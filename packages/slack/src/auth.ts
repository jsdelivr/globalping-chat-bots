import { AuthToken } from '@globalping/bot-utils';
import { ParamsIncomingMessage } from '@slack/bolt/dist/receivers/ParamsIncomingMessage';
import { createHash, randomBytes } from 'node:crypto';
import { IncomingMessage, ServerResponse } from 'node:http';
import { parse } from 'node:url';

import { Config } from './config';
import { AuthorizeSession, InstallationStore, UserStore } from './db';
import { getLocalUserId, Logger, SlackClient } from './utils';

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
	constructor(
		private config: Config,
		private logger: Logger,
		private userStore: UserStore,
		private slackClient: SlackClient
	) {}

	async Authorize(opts: {
		installationId: string;
		channel_id: string;
		user_id: string;
		thread_ts?: string;
	}): Promise<AuthorizeResponse> {
		const verifier = generateVerifier();

		const localUserId = getLocalUserId(opts);
		await this.userStore.updateAuthorizeSession(localUserId, {
			verifier,
			installationId: opts.installationId,
			userId: opts.user_id,
			channelId: opts.channel_id,
			threadTs: opts.thread_ts,
		});

		const url = new URL(`${this.config.authUrl}/oauth/authorize`);
		url.searchParams.append('client_id', this.config.authClientId);
		url.searchParams.append('code_challenge', generateS256Challenge(verifier));
		url.searchParams.append('code_challenge_method', 'S256');
		url.searchParams.append('response_type', 'code');
		url.searchParams.append('scope', 'measurements');
		url.searchParams.append('state', localUserId);

		return {
			url: url.toString(),
		};
	}

	async Logout(localUserId: string): Promise<AuthorizeError | null> {
		const token = await this.userStore.getToken(localUserId);
		let error: AuthorizeError | null = null;
		if (!token) {
			return {
				error: AuthorizeErrorType.NotAuthorized,
				error_description: 'You are not authorized',
			};
		}
		if (token && token.refresh_token) {
			error = await this.revokeToken(token.refresh_token);
			if (!error) {
				// Delete token
				await this.userStore.updateToken(localUserId, null);
			}
		}
		return error;
	}

	async Introspect(
		localUserId: string
	): Promise<[IntrospectionResponse | null, AuthorizeError | null]> {
		const token = await this.GetToken(localUserId);
		this.logger.debug({ userId: localUserId, token }, 'Introspect token');
		if (!token) {
			return [
				null,
				{
					error: AuthorizeErrorType.NotAuthorized,
					error_description: 'You are not authorized',
				},
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
			return [null, error];
		}
		const introspection = (await res.json()) as IntrospectionResponse;
		return [introspection, null];
	}

	// NOTE: Does not handle concurrent refreshes
	async GetToken(userId: string): Promise<AuthToken | null> {
		const token = await this.userStore.getToken(userId);
		if (!token) {
			return null;
		}
		const now = Date.now() / 1000;
		if (token.expiry < now) {
			this.logger.debug({ userId, token }, 'token expired, refreshing');
			const [t] = await this.refreshToken(userId, token.refresh_token);
			return t;
		}
		return token;
	}

	async TryToRefreshToken(
		userId: string,
		token: AuthToken
	): Promise<string | null> {
		if (!token.refresh_token) {
			return 'Your access token has been rejected by the API. Try signing in with a new token.';
		}
		try {
			const [newToken] = await this.refreshToken(userId, token.refresh_token);
			if (newToken) {
				return 'Access token successfully refreshed. Try repeating the measurement.';
			}
		} catch {
			// Ignore
		}
		return 'You have been signed out by the API. Please try signing in again.';
	}

	async exchange(
		code: string,
		verifier: string,
		localUserId: string
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

		await this.userStore.updateToken(localUserId, token);

		return null;
	}

	async revokeToken(token: string): Promise<AuthorizeError | null> {
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

		const { query } = parse(req.url || '', true);
		const callbackError = query.error;
		const errorDescription = query.error_description;
		const code = query.code as string;
		const localUserId = query.state as string;

		if (!localUserId) {
			this.logger.error(callbackError, '/oauth/callback missing userId');
			res.writeHead(302, {
				Location: `${this.config.dashboardUrl}/authorize/error`,
			});
			res.end();
			return;
		}

		let oldToken: AuthToken | null;
		let session: AuthorizeSession | null;
		let installation: InstallationStore | null;

		try {
			const user = await this.userStore.getUserForAuthorization(localUserId);
			oldToken = user.token;
			session = user.session;
			installation = user.installation;
		} catch {
			res.writeHead(302, {
				Location: `${this.config.dashboardUrl}/authorize/error`,
			});
			res.end();
			return;
		}

		if (!session) {
			this.logger.error(
				{ userId: localUserId },
				'/oauth/callback missing session'
			);
			res.writeHead(302, {
				Location: `${this.config.dashboardUrl}/authorize/error`,
			});
			res.end();
			return;
		}

		try {
			// Delete session
			await this.userStore.updateAuthorizeSession(localUserId, null);
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
				{
					error: callbackError,
					errorDescription,
					code,
					userId: localUserId,
				},
				'/oauth/callback failed'
			);
			res.writeHead(302, {
				Location: `${this.config.dashboardUrl}/authorize/error`,
			});
			res.end();
			return;
		}
		let exchangeError: AuthorizeError | null;
		try {
			exchangeError = await this.exchange(code, session.verifier, localUserId);

			// Revoke old token if exists
			if (!exchangeError && oldToken && oldToken.refresh_token) {
				try {
					await this.revokeToken(oldToken.refresh_token);
				} catch (error) {
					this.logger.error(
						{
							user_id: localUserId,
							error,
						},
						'/oauth/callback failed to revoke token'
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
		localUserId: string,
		refreshToken: string
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
			if (error.error === AuthorizeErrorType.InvalidGrant) {
				// Delete token
				await this.userStore.updateToken(localUserId, null);
			}
			return [null, error];
		}

		const token = (await res.json()) as AuthToken;
		token.expiry = Math.floor(Date.now() / 1000) + token.expires_in;
		await this.userStore.updateToken(localUserId, token);

		return [token, null];
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

// eslint-disable-next-line import/no-mutable-exports
export let oauth: OAuthClient;

export function initOAuthClient(
	config: Config,
	logger: Logger,
	usersStore: UserStore,
	slackClient: SlackClient
) {
	oauth = new OAuthClient(config, logger, usersStore, slackClient);
}
