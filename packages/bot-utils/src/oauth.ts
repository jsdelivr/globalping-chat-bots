import { createHash, randomBytes } from 'node:crypto';
import { AuthToken } from './types.js';
import { Logger } from './logger.js';

export interface Config {
	serverHost: string;
	apiUrl: string;
	authUrl: string;
	authCallbackPath: string;
	authClientId: string;
	authClientSecret: string;
}

type AuthorizeSession = {
	callbackVerifier: string;
	exchangeVerifier: string;
};

type AuthorizeSessionData = {
	channelId: string;
	userId: string;
	threadTs?: string;
};

export interface DBClient {
	getToken: (id: string) => Promise<AuthToken | null>;
	updateToken: (id: string, token: AuthToken | null) => Promise<void>;
	updateAuthorizeSession: (
		id: string,
		authorizeSesssion: AuthorizeSession & AuthorizeSessionData,
	) => Promise<void>;
}

export enum AuthorizeErrorType {
	NotAuthorized = 'not_authorized',
	InternalError = 'internal_error',
	RefreshFailed = 'refresh_failed',
	InvalidGrant = 'invalid_grant',
}

export interface AuthorizeResponse {
	url: string;
}

export interface AuthorizeError {
	error: string;
	error_description: string;
}

export interface IntrospectionResponse {
	active: boolean;

	scope?: string;
	client_id?: string;
	username?: string;
	token_type?: string;
	exp?: number;
	iat?: number;
	nbf?: number;
	sub?: string;
	aud?: string;
	iss?: string;
	jti?: string;
}

export interface LimitsError {
	type: string;
	message: string;
}

export interface CreditLimits {
	remaining: number;
}

export enum CreateLimitType {
	IP = 'ip',
	User = 'user',
}

export interface MeasurementsCreateLimits {
	type: CreateLimitType;
	limit: number;
	remaining: number;
	reset: number;
}

export interface MeasurementsLimits {
	create: MeasurementsCreateLimits;
}

export interface RateLimits {
	measurements: MeasurementsLimits;
}

export interface LimitsResponse {
	rateLimit: RateLimits;
	credits?: CreditLimits; // Only for authenticated requests
}

const stateSeparator = ':';

export class OAuthClient {
	constructor (
		private config: Config,
		private logger: Logger,
		private db: DBClient,
	) { }

	async Authorize (
		id: string,
		data: AuthorizeSessionData,
	): Promise<AuthorizeResponse> {
		const callbackVerifier = generateVerifier();
		const exchangeVerifier = generateVerifier();

		await this.db.updateAuthorizeSession(id, {
			callbackVerifier,
			exchangeVerifier,
			...data,
		});

		const url = new URL(`${this.config.authUrl}/oauth/authorize`);
		url.searchParams.append('client_id', this.config.authClientId);

		url.searchParams.append(
			'code_challenge',
			generateS256Challenge(exchangeVerifier),
		);

		url.searchParams.append('code_challenge_method', 'S256');
		url.searchParams.append('response_type', 'code');
		url.searchParams.append('scope', 'measurements');

		url.searchParams.append(
			'redirect_uri',
			this.config.serverHost + this.config.authCallbackPath,
		);

		url.searchParams.append('state', callbackVerifier + stateSeparator + id);

		return {
			url: url.toString(),
		};
	}

	async Logout (id: string): Promise<AuthorizeError | null> {
		const token = await this.db.getToken(id);

		if (!token) {
			return null;
		}

		let error: AuthorizeError | null = null;

		if (token && !token.isAnonymous && token.refresh_token) {
			error = await this.RevokeToken(token.refresh_token);

			if (!error) {
				// Delete token
				await this.db.updateToken(id, null);
			}
		}

		return error;
	}

	async Introspect (id: string): Promise<[IntrospectionResponse | null, AuthorizeError | null]> {
		const token = await this.GetToken(id);

		if (!token) {
			return [
				null,
				{
					error: AuthorizeErrorType.NotAuthorized,
					error_description: 'You are not authorized',
				},
			];
		}

		if (token.isAnonymous) {
			return [
				{
					active: false,
				},
				null,
			];
		}

		const url = new URL(`${this.config.authUrl}/oauth/token/introspect`);
		const body = new URLSearchParams();
		body.append('token', token.access_token);
		const b = body.toString();

		const res = await fetch(url.toString(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': b.length.toString(),
			},
			body: b,
		});

		if (res.status !== 200) {
			const error = (await res.json()) as AuthorizeError;
			return [ null, error ];
		}

		const introspection = (await res.json()) as IntrospectionResponse;
		return [ introspection, null ];
	}

	async Limits (id: string): Promise<[LimitsResponse | null, LimitsError | null]> {
		const token = await this.GetToken(id);
		const headers: { [key: string]: string } = {};

		if (token) {
			headers['Authorization'] = `Bearer ${token.access_token}`;
		}

		const res = await fetch(this.config.apiUrl + '/limits', {
			headers,
		});

		if (res.status !== 200) {
			const error = (await res.json()) as LimitsError;
			return [ null, error ];
		}

		const limits = (await res.json()) as LimitsResponse;
		return [ limits, null ];
	}

	// NOTE: Does not handle concurrent refreshes
	async GetToken (id: string): Promise<AuthToken | null> {
		const token = await this.db.getToken(id);

		if (!token) {
			const [ t ] = await this.requestAnonymousToken(id);
			return t;
		}

		const now = Date.now() / 1000;

		if (token.expiry < now) {
			const [ t, error ] = await this.refreshToken(id, token.refresh_token);

			if (
				token.isAnonymous
				&& error
				&& error.error === AuthorizeErrorType.InvalidGrant
			) {
				const [ newToken ] = await this.requestAnonymousToken(id);
				return newToken;
			}

			return t;
		}

		return token;
	}

	async TryToRefreshToken (
		id: string,
		token: AuthToken,
	): Promise<string | null> {
		if (!token.refresh_token) {
			return 'Your access token has been rejected by the API. Try signing in with a new token.';
		}

		try {
			const [ newToken ] = await this.refreshToken(id, token.refresh_token);

			if (newToken) {
				return 'Access token successfully refreshed. Try repeating the measurement.';
			}
		} catch {
			// Ignore
		}

		return 'You have been signed out by the API. Please try signing in again.';
	}

	async Exchange (
		code: string,
		verifier: string,
		id: string,
	): Promise<AuthorizeError | null> {
		const url = new URL(`${this.config.authUrl}/oauth/token`);
		const body = new URLSearchParams();
		body.append('client_id', this.config.authClientId);
		body.append('client_secret', this.config.authClientSecret);
		body.append('code', code);
		body.append('code_verifier', verifier);
		body.append('grant_type', 'authorization_code');

		body.append(
			'redirect_uri',
			this.config.serverHost + this.config.authCallbackPath,
		);

		const b = body.toString();

		const res = await fetch(url.toString(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': b.length.toString(),
			},
			body: b,
		});

		if (res.status !== 200) {
			return (await res.json()) as AuthorizeError;
		}

		const token = (await res.json()) as AuthToken;
		token.expiry = Math.floor(Date.now() / 1000) + token.expires_in;

		await this.db.updateToken(id, token);

		return null;
	}

	async RevokeToken (token: string): Promise<AuthorizeError | null> {
		const url = new URL(`${this.config.authUrl}/oauth/token/revoke`);
		const body = new URLSearchParams();
		body.append('token', token);
		const b = body.toString();

		const res = await fetch(url.toString(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': b.length.toString(),
			},
			body: b,
		});

		if (res.status !== 200) {
			return (await res.json()) as AuthorizeError;
		}

		return null;
	}

	async requestAnonymousToken (id: string): Promise<[AuthToken | null, AuthorizeError | null]> {
		const url = new URL(`${this.config.authUrl}/oauth/token`);
		const body = new URLSearchParams();
		body.append('client_id', this.config.authClientId);
		body.append('client_secret', this.config.authClientSecret);
		body.append('grant_type', 'globalping_client_credentials');
		body.append('scope', 'measurements');
		const b = body.toString();

		const res = await fetch(url.toString(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': b.length.toString(),
			},
			body: b,
		});

		if (res.status !== 200) {
			const err = (await res.json()) as AuthorizeError;
			this.logger.error('Failed to get anonymous token.', err);
			return [ null, err ];
		}

		const token = (await res.json()) as AuthToken;
		token.expiry = Math.floor(Date.now() / 1000) + token.expires_in;
		token.isAnonymous = true;

		await this.db.updateToken(id, token);
		return [ token, null ];
	}

	async refreshToken (
		id: string,
		refreshToken: string,
	): Promise<[AuthToken | null, AuthorizeError | null]> {
		const url = new URL(`${this.config.authUrl}/oauth/token`);
		const body = new URLSearchParams();
		body.append('client_id', this.config.authClientId);
		body.append('client_secret', this.config.authClientSecret);
		body.append('refresh_token', refreshToken);
		body.append('grant_type', 'refresh_token');
		const b = body.toString();

		const res = await fetch(url.toString(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': b.length.toString(),
			},
			body: b,
		});

		if (res.status !== 200) {
			const error = (await res.json()) as AuthorizeError;
			return [ null, error ];
		}

		const token = (await res.json()) as AuthToken;
		token.expiry = Math.floor(Date.now() / 1000) + token.expires_in;
		await this.db.updateToken(id, token);

		return [ token, null ];
	}
}

function generateVerifier (): string {
	return randomBytes(32).toString('base64url');
}

function generateS256Challenge (verifier: string): string {
	const hash = createHash('sha256');
	hash.update(verifier);
	return hash.digest('base64url');
}

export function parseCallbackURL (
	url: string,
	base: string,
): {
	code: string | null;
	error: string | null;
	errorDescription: string | null;
	verifier?: string;
	id?: string;
} {
	const u = new URL(url, base);
	const state = u.searchParams.get('state');
	const separatorIndex = state ? state.indexOf(stateSeparator) : -1;
	return {
		code: u.searchParams.get('code'),
		error: u.searchParams.get('error'),
		errorDescription: u.searchParams.get('error_description'),
		verifier: state ? state.substring(0, separatorIndex) : undefined,
		id: state ? state.substring(separatorIndex + 1) : undefined,
	};
}
