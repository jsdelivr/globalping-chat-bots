import { randomBytes, createHash } from 'crypto';
import { ParamsIncomingMessage } from '@slack/bolt/dist/receivers/ParamsIncomingMessage';
import { IncomingMessage, ServerResponse } from 'node:http';
import { parse } from 'node:url';
import { Logger, SlackClient } from './utils';
import { Config } from './config';
import {
	AuthorizeSession,
	AuthToken,
	InstallationStore,
	UserStore,
} from './db';

export const CALLBACK_PATH = '/slack/oauth/callback';
export const enum AuthorizeErrorType {
	NotAuthorized = 'not_authorized',
	InternalError = 'internal_error',
	RefreshFailed = 'refresh_failed',
	InvalidGrant = 'invalid_grant',
}

export let oauth: OAuthClient;

export function initOAuthClient(
	config: Config,
	logger: Logger,
	usersStore: UserStore,
	slackClient: SlackClient
) {
	oauth = new OAuthClient(config, logger, usersStore, slackClient);
}

export class OAuthClient {
	constructor(
		private config: Config,
		private logger: Logger,
		private usersStore: UserStore,
		private slackClient: SlackClient
	) {}

	async Authorize(
		userId: string,
		channelId: string,
		threadTs?: string,
		installationId?: string
	): Promise<AuthorizeResponse> {
		const verifier = generateVerifier();

		await this.usersStore.updateAuthorizeSession(userId, {
			verifier,
			userId: userId,
			channelId: channelId,
			threadTs: threadTs,
			installationId,
		});

		const url = new URL(this.config.authUrl + '/oauth/authorize');
		url.searchParams.append('client_id', this.config.authClientId);
		url.searchParams.append('code_challenge', generateS256Challenge(verifier));
		url.searchParams.append('code_challenge_method', 'S256');
		url.searchParams.append('response_type', 'code');
		url.searchParams.append('scope', 'measurements');
		url.searchParams.append('state', userId);

		return {
			url: url.toString(),
		};
	}

	async LoginWithToken(
		userId: string,
		accessToken: string
	): Promise<[IntrospectionResponse | null, AuthorizeError | null]> {
		const [introspection, error] = await this.Introspect(userId);
		if (error) {
			return [null, error];
		}
		if (!introspection?.active) {
			return [
				null,
				{
					error: 'invalid_token',
					error_description: 'Token is invalid',
				},
			];
		}
		const oldToken = await this.usersStore.getToken(userId);
		if (oldToken) {
			// Revoke old token
			try {
				await this.revokeToken(oldToken.refresh_token);
			} catch (error) {
				this.logger.error(error, 'Failed to revoke old token');
			}
		}
		await this.usersStore.updateToken(userId, {
			access_token: accessToken,
			expires_in: 0,
			refresh_token: '',
			token_type: 'Bearer',
			expiry: Number.MAX_SAFE_INTEGER,
		});
		return [introspection, null];
	}

	async Logout(userId: string): Promise<AuthorizeError | null> {
		const token = await this.usersStore.getToken(userId);
		let error: AuthorizeError | null = null;
		if (!token) {
			return {
				error: AuthorizeErrorType.NotAuthorized,
				error_description: 'You are not authorized',
			};
		}
		if (token && token.refresh_token) {
			console.log('Revoking token');
			error = await this.revokeToken(token.refresh_token);
			if (!error) {
				// Delete token
				const _error = await this.usersStore.updateToken(userId, null);
				this.logger.error(_error, 'Failed to delete token', userId);
			}
		}
		return error;
	}

	async Introspect(
		userId: string
	): Promise<[IntrospectionResponse | null, AuthorizeError | null]> {
		const token = await this.getToken(userId);
		this.logger.debug({ userId, token }, 'Introspect token');
		if (!token) {
			return [
				null,
				{
					error: AuthorizeErrorType.NotAuthorized,
					error_description: 'You are not authorized',
				},
			];
		}
		const url = new URL(this.config.authUrl + '/oauth/token/introspect');
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
			return [null, error];
		}
		const introspection = (await res.json()) as IntrospectionResponse;
		return [introspection, null];
	}

	async exchange(
		code: string,
		session: AuthorizeSession
	): Promise<AuthorizeError | null> {
		const url = new URL(this.config.authUrl + '/oauth/token');
		const body = new URLSearchParams();
		body.append('client_id', this.config.authClientId);
		body.append('client_secret', this.config.authClientSecret);
		body.append('code', code);
		body.append('code_verifier', session.verifier);
		body.append('grant_type', 'authorization_code');
		body.append('redirect_uri', this.config.serverHost + CALLBACK_PATH);
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

		await this.usersStore.updateToken(session.userId, token);

		return null;
	}

	async revokeToken(token: string): Promise<AuthorizeError | null> {
		const url = new URL(this.config.authUrl + '/oauth/token/revoke');
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

	async OnCallback(
		req: ParamsIncomingMessage,
		res: ServerResponse<IncomingMessage>
	) {
		if (!this.slackClient) {
			this.logger.error('Slack client not set');
			res.writeHead(500);
			res.end();
			return;
		}

		const query = parse(req.url || '', true).query;
		const callbackError = query.error;
		const errorDescription = query.error_description;
		const code = query.code as string;
		const userId = query.state as string;

		if (!userId) {
			this.logger.error(callbackError, '/oauth/callback missing userId');
			res.writeHead(302, {
				Location: this.config.dashboardUrl + '/authorize/error',
			});
			res.end();
			return;
		}

		let oldToken: AuthToken | null;
		let session: AuthorizeSession | null;
		let installation: InstallationStore | null;

		try {
			const res = await this.usersStore.getUserForAuthorization(userId);
			oldToken = res.token;
			session = res.session;
			installation = res.installation;
		} catch (error) {
			res.writeHead(302, {
				Location: this.config.dashboardUrl + '/authorize/error',
			});
			res.end();
			return;
		}

		if (!session) {
			this.logger.error({ userId }, '/oauth/callback missing session');
			res.writeHead(302, {
				Location: this.config.dashboardUrl + '/authorize/error',
			});
			res.end();
			return;
		}

		try {
			// Delete session
			await this.usersStore.updateAuthorizeSession(userId, null);
		} catch (error) {
			this.logger.error(error, '/oauth/callback failed to delete session');
		}

		if (callbackError || !code) {
			try {
				await this.slackClient.chat.postEphemeral({
					token: installation?.bot?.token,
					text: `Failed to authorize: ${callbackError}: ${errorDescription}`,
					user: session.userId,
					channel: session.channelId,
					thread_ts: session.threadTs,
				});
			} catch (error) {
				this.logger.error(error, '/oauth/callback failed to post ephemeral');
			}
			this.logger.error(
				{ error: callbackError, errorDescription, code, sessionId: userId },
				'/oauth/callback failed'
			);
			res.writeHead(302, {
				Location: this.config.dashboardUrl + '/authorize/error',
			});
			res.end();
			return;
		}
		let exchangeError: AuthorizeError | null;
		try {
			exchangeError = await this.exchange(code, session);

			// Revoke old token if exists
			if (!exchangeError && oldToken && oldToken.refresh_token) {
				try {
					await this.revokeToken(oldToken.refresh_token);
				} catch (error) {
					this.logger.error(
						{
							user_id: session.userId,
							error,
						},
						'/oauth/callback failed to revoke token'
					);
				}
			}
		} catch (error) {
			exchangeError = {
				error: AuthorizeErrorType.InternalError,
				error_description: 'Failed to exchange code',
			};
		}
		let message = '';
		if (exchangeError) {
			this.logger.error(exchangeError, '/oauth/callback failed');
			message = `Failed to authorize: ${exchangeError.error}: ${exchangeError.error_description}`;
		} else {
			message = 'Success! You are now authenticated.';
		}
		try {
			await this.slackClient.chat.postEphemeral({
				token: installation?.bot?.token,
				text: message,
				user: session.userId,
				channel: session.channelId,
				thread_ts: session.threadTs,
			});
		} catch (error) {
			this.logger.error(error, '/oauth/callback failed to post ephemeral');
		}
		res.writeHead(302, {
			Location:
				this.config.dashboardUrl +
				(exchangeError ? '/authorize/error' : '/authorize/success'),
		});
		res.end();
	}

	async refreshToken(
		userId: string,
		refreshToken: string
	): Promise<[AuthToken | null, AuthorizeError | null]> {
		const url = new URL(this.config.authUrl + '/oauth/token');
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
			if (error.error === AuthorizeErrorType.InvalidGrant) {
				// Delete token
				const _error = await this.usersStore.updateToken(userId, null);
				this.logger.error(_error, 'Failed to delete token', userId);
			}
			return [null, error];
		}

		const token = (await res.json()) as AuthToken;
		token.expiry = Math.floor(Date.now() / 1000) + token.expires_in;
		await this.usersStore.updateToken(userId, token);

		return [token, null];
	}

	// NOTE: Does not handle concurrent refreshes
	async getToken(userId: string): Promise<AuthToken | null> {
		const token = await this.usersStore.getToken(userId);
		if (!token) {
			return null;
		}
		const now = Date.now() / 1000;
		if (token.expiry < now) {
			this.logger.debug({ userId, token }, 'token expired, refreshing');
			const [t, _] = await this.refreshToken(userId, token.refresh_token);
			return t;
		}
		return token;
	}
}

function generateVerifier(): string {
	return randomBytes(32).toString('base64url');
}

function generateS256Challenge(verifier: string): string {
	const hash = createHash('sha256');
	hash.update(verifier);
	return hash.digest('base64url');
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
