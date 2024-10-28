import { AuthToken } from '@globalping/bot-utils';
import { ParamsIncomingMessage } from '@slack/bolt/dist/receivers/ParamsIncomingMessage.js';
import { createHash, randomBytes } from 'node:crypto';
import { IncomingMessage, ServerResponse } from 'node:http';

import { Config } from './config.js';
import { AuthorizeSession, Installation, InstallationStore } from './db.js';
import { Logger, SlackClient } from './utils.js';

export const CALLBACK_PATH = '/slack/oauth/callback';
export const enum AuthorizeErrorType {
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

export class OAuthClient {
	constructor (
		private config: Config,
		private logger: Logger,
		private installationStore: InstallationStore,
		private slackClient: SlackClient,
	) {}

	async Authorize (opts: {
		installationId: string;
		channel_id: string;
		user_id: string;
		thread_ts?: string;
	}): Promise<AuthorizeResponse> {
		const callbackVerifier = generateVerifier();
		const exchangeVerifier = generateVerifier();

		await this.installationStore.updateAuthorizeSession(opts.installationId, {
			callbackVerifier,
			exchangeVerifier,
			channelId: opts.channel_id,
			userId: opts.user_id,
			threadTs: opts.thread_ts,
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
			'state',
			`${callbackVerifier}-${opts.installationId}`,
		);

		return {
			url: url.toString(),
		};
	}

	async Logout (id: string): Promise<AuthorizeError | null> {
		const token = await this.installationStore.getToken(id);

		if (!token) {
			return null;
		}

		let error: AuthorizeError | null = null;

		if (token && !token.isAnonymous && token.refresh_token) {
			error = await this.revokeToken(token.refresh_token);

			if (!error) {
				// Delete token
				await this.installationStore.updateToken(id, null);
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

	// NOTE: Does not handle concurrent refreshes
	async GetToken (id: string): Promise<AuthToken | null> {
		const token = await this.installationStore.getToken(id);

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

	async exchange (
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

		await this.installationStore.updateToken(id, token);

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
			this.logger.error(err, 'Failed to get anonymous token');
			return [ null, err ];
		}

		const token = (await res.json()) as AuthToken;
		token.expiry = Math.floor(Date.now() / 1000) + token.expires_in;
		token.isAnonymous = true;

		await this.installationStore.updateToken(id, token);
		return [ token, null ];
	}

	async revokeToken (token: string): Promise<AuthorizeError | null> {
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

	async OnCallback (
		req: ParamsIncomingMessage,
		res: ServerResponse<IncomingMessage>,
	) {
		if (!this.slackClient) {
			this.logger.error('Slack client not set');
			res.writeHead(500);
			res.end();
			return;
		}

		const url = new URL(req.url || '', this.config.serverHost);
		const callbackError = url.searchParams.get('error');
		const errorDescription = url.searchParams.get('error_description');
		const code = url.searchParams.get('code');
		const state = url.searchParams.get('state');

		if (!state) {
			this.logger.error(callbackError, '/oauth/callback missing state');

			res.writeHead(302, {
				Location: `${this.config.dashboardUrl}/authorize/error`,
			});

			res.end();
			return;
		}

		const separatorIndex = state.indexOf('-');
		const callbackVerifier = state.substring(0, separatorIndex);
		const installationId = state.substring(separatorIndex + 1);

		let oldToken: AuthToken | null;
		let session: AuthorizeSession | null;
		let installation: Installation | null;

		try {
			const installationRes
				= await this.installationStore.getInstallationForAuthorization(installationId);
			oldToken = installationRes.token;
			session = installationRes.session;
			installation = installationRes.installation;
		} catch {
			res.writeHead(302, {
				Location: `${this.config.dashboardUrl}/authorize/error`,
			});

			res.end();
			return;
		}

		if (!session) {
			this.logger.error({ installationId }, '/oauth/callback missing session');

			res.writeHead(302, {
				Location: `${this.config.dashboardUrl}/authorize/error`,
			});

			res.end();
			return;
		}

		if (callbackVerifier !== session.callbackVerifier) {
			this.logger.error(
				{
					installationId,
				},
				'/oauth/callback invalid verifier',
			);

			res.writeHead(302, {
				Location: `${this.config.dashboardUrl}/authorize/error`,
			});

			res.end();
			return;
		}

		try {
			// Delete session
			await this.installationStore.updateAuthorizeSession(installationId, null);
		} catch (error) {
			this.logger.error(error, '/oauth/callback failed to delete session');
		}

		if (callbackError || !code) {
			try {
				await this.slackClient.chat.postEphemeral({
					token: installation?.bot?.token,
					text: `Authentication failed: ${callbackError}: ${errorDescription}`,
					user: session.userId,
					channel: session.channelId,
					thread_ts: session.threadTs,
				});
			} catch (error) {
				this.logger.error(error, '/oauth/callback failed to post ephemeral');
			}

			this.logger.error(
				{
					error: callbackError,
					errorDescription,
					code,
					installationId,
				},
				'/oauth/callback failed',
			);

			res.writeHead(302, {
				Location: `${this.config.dashboardUrl}/authorize/error`,
			});

			res.end();
			return;
		}

		let exchangeError: AuthorizeError | null;

		try {
			exchangeError = await this.exchange(
				code,
				session.exchangeVerifier,
				installationId,
			);

			// Revoke old token if exists
			if (!exchangeError && oldToken && oldToken.refresh_token) {
				try {
					await this.revokeToken(oldToken.refresh_token);
				} catch (error) {
					this.logger.error(
						{
							installationId,
							error,
						},
						'/oauth/callback failed to revoke token',
					);
				}
			}
		} catch {
			exchangeError = {
				error: AuthorizeErrorType.InternalError,
				error_description: 'Failed to exchange code',
			};
		}

		let message = '';

		if (exchangeError) {
			this.logger.error(exchangeError, '/oauth/callback failed');
			message = `Authentication failed: ${exchangeError.error}: ${exchangeError.error_description}`;
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
				this.config.dashboardUrl
				+ (exchangeError ? '/authorize/error' : '/authorize/success'),
		});

		res.end();
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
		await this.installationStore.updateToken(id, token);

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

export let oauth: OAuthClient;

export function initOAuthClient (
	config: Config,
	logger: Logger,
	installationStore: InstallationStore,
	slackClient: SlackClient,
) {
	oauth = new OAuthClient(config, logger, installationStore, slackClient);
}
