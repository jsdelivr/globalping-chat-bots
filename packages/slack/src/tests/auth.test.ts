import { AuthToken } from '@globalping/bot-utils';
import { ParamsIncomingMessage } from '@slack/bolt/dist/receivers/ParamsIncomingMessage.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	AuthorizeError,
	AuthorizeErrorType,
	IntrospectionResponse,
	OAuthClient,
} from '../auth.js';
import { Config } from '../config.js';
import { AuthorizeSession, Installation } from '../db.js';
import { mockInstallationStore, mockLogger, mockSlackClient } from './utils.js';

describe('Auth', () => {
	const config: Config = {
		serverHost: 'http://localhost',
		dashboardUrl: 'http://dash.localhost',
		authUrl: 'http://auth.localhost',
		authClientId: 'client_id',
		authClientSecret: 'client_secret',
	} as Config;

	const loggerMock = mockLogger();
	const installationStoreMock = mockInstallationStore();
	const slackClientMock = mockSlackClient();

	const oauth: OAuthClient = new OAuthClient(
		config,
		loggerMock,
		installationStoreMock,
		slackClientMock,
	);

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('Authorize', () => {
		it('should create a session and return a valid url', async () => {
			const userId = 'U123';
			const channelId = 'C123';
			const threadTs = '123';
			const installationId = 'I123';

			const res = await oauth.Authorize({
				installationId,
				user_id: userId,
				channel_id: channelId,
				thread_ts: threadTs,
			});

			expect(installationStoreMock.updateAuthorizeSession).toHaveBeenCalledWith(
				installationId,
				{
					verifier: expect.any(String),
					userId,
					channelId,
					threadTs,
				},
			);

			const url = new URL(res.url);
			expect(url.origin).toBe(config.authUrl);
			expect(url.pathname).toBe('/oauth/authorize');
			expect(url.searchParams.get('client_id')).toBe(config.authClientId);
			expect(url.searchParams.get('code_challenge')?.length).toBe(43);
			expect(url.searchParams.get('code_challenge_method')).toBe('S256');
			expect(url.searchParams.get('scope')).toBe('measurements');
			expect(url.searchParams.get('state')).toBe(installationId);
		});
	});

	describe('Logout', () => {
		it('should remove and revoke the token', async () => {
			const installationId = 'I123';
			const token: AuthToken = {
				access_token: 'tok3n',
				refresh_token: 'refresh_tok3n',
				expires_in: 3600,
				token_type: 'Bearer',
				expiry: Date.now() / 1000 + 3600,
			};

			const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
				ok: true,
				status: 200,
			} as Response);

			vi.spyOn(installationStoreMock, 'getToken').mockResolvedValue(token);

			const err = await oauth.Logout(installationId);

			expect(installationStoreMock.getToken).toHaveBeenCalledWith(installationId);

			expect(installationStoreMock.updateToken).toHaveBeenCalledWith(
				installationId,
				null,
			);

			expect(fetchSpy).toHaveBeenCalledWith(
				`${config.authUrl}/oauth/token/revoke`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Content-Length': '19',
					},
					body: 'token=refresh_tok3n',
				},
			);

			expect(err).toBeNull();
		});

		it('should return no error - no token', async () => {
			const insallationId = 'I123';

			const fetchSpy = vi.spyOn(global, 'fetch');

			vi.spyOn(installationStoreMock, 'getToken').mockResolvedValue(null);

			const err = await oauth.Logout(insallationId);

			expect(installationStoreMock.getToken).toHaveBeenCalledWith(insallationId);

			expect(installationStoreMock.updateToken).toHaveBeenCalledTimes(0);
			expect(fetchSpy).toHaveBeenCalledTimes(0);

			expect(err).toBeNull();
		});
	});

	describe('Introspect', () => {
		it('should successfully return the response', async () => {
			const installationId = 'I123';

			const token: AuthToken = {
				access_token: 'tok3n',
				refresh_token: 'refresh_tok3n',
				expires_in: 3600,
				token_type: 'Bearer',
				expiry: Date.now() / 1000 + 3600,
			};
			const expectedIntrospection: IntrospectionResponse = {
				active: true,
				username: 'John Doe',
			};

			const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => expectedIntrospection,
			} as Response);

			vi.spyOn(installationStoreMock, 'getToken').mockResolvedValue(token);

			const [ introspection, error ] = await oauth.Introspect(installationId);

			expect(installationStoreMock.getToken).toHaveBeenCalledWith(installationId);

			expect(fetchSpy).toHaveBeenCalledWith(
				`${config.authUrl}/oauth/token/introspect`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Content-Length': '11',
					},
					body: 'token=tok3n',
				},
			);

			expect(introspection).toEqual(expectedIntrospection);
			expect(error).toBeNull();
		});
	});

	describe('GetToken', () => {
		it('should refresh and return the token', async () => {
			const now = new Date();
			const installationId = 'I123';
			const token: AuthToken = {
				access_token: 'tok3n',
				refresh_token: 'refresh_tok3n',
				expires_in: 3600,
				token_type: 'Bearer',
				expiry: now.getTime() / 1000 - 3600,
			};

			const expectedToken: AuthToken = {
				access_token: 'new_tok3n',
				refresh_token: 'new_refresh_tok3n',
				expires_in: 3600,
				token_type: 'Bearer',
				expiry: Math.floor(now.getTime() / 1000 + 3600),
			};

			vi.spyOn(Date, 'now').mockReturnValue(now.getTime());

			const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => expectedToken,
			} as Response);

			vi.spyOn(installationStoreMock, 'getToken').mockResolvedValue(token);

			const newToken = await oauth.GetToken(installationId);

			expect(installationStoreMock.getToken).toHaveBeenCalledWith(installationId);

			expect(installationStoreMock.updateToken).toHaveBeenCalledWith(
				installationId,
				expectedToken,
			);

			expect(fetchSpy).toHaveBeenCalledWith(`${config.authUrl}/oauth/token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': '100',
				},
				body: 'client_id=client_id&client_secret=client_secret&refresh_token=refresh_tok3n&grant_type=refresh_token',
			});

			expect(newToken).toEqual(expectedToken);
		});

		it('should return an error - token could not be refreshed', async () => {
			const now = new Date();
			const installationId = 'I123';
			const token: AuthToken = {
				access_token: 'tok3n',
				refresh_token: 'refresh_tok3n',
				expires_in: 3600,
				token_type: 'Bearer',
				expiry: now.getTime() / 1000 - 3600,
			};

			const expectedError: AuthorizeError = {
				error: AuthorizeErrorType.InvalidGrant,
				error_description: 'Invalid token',
			};

			vi.spyOn(Date, 'now').mockReturnValue(now.getTime());

			const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
				ok: true,
				status: 400,
				json: async () => expectedError,
			} as Response);

			vi.spyOn(installationStoreMock, 'getToken').mockResolvedValue(token);

			const newToken = await oauth.GetToken(installationId);

			expect(installationStoreMock.getToken).toHaveBeenCalledWith(installationId);

			expect(installationStoreMock.updateToken).toHaveBeenCalledTimes(0);

			expect(fetchSpy).toHaveBeenCalledWith(`${config.authUrl}/oauth/token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': '100',
				},
				body: 'client_id=client_id&client_secret=client_secret&refresh_token=refresh_tok3n&grant_type=refresh_token',
			});

			expect(newToken).toEqual(null);
		});
	});

	describe('TryToRefreshToken', () => {
		it('should refresh the token and return an error message', async () => {
			const now = new Date();
			const installationId = 'I123';
			const token: AuthToken = {
				access_token: 'tok3n',
				refresh_token: 'refresh_tok3n',
				expires_in: 3600,
				token_type: 'Bearer',
				expiry: now.getTime() / 1000 - 3600,
			};

			const expectedToken: AuthToken = {
				access_token: 'new_tok3n',
				refresh_token: 'new_refresh_tok3n',
				expires_in: 3600,
				token_type: 'Bearer',
				expiry: Math.floor(now.getTime() / 1000 + 3600),
			};

			vi.spyOn(Date, 'now').mockReturnValue(now.getTime());

			const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
				ok: true,
				status: 200,
				json: async () => expectedToken,
			} as Response);

			const errorMsg = await oauth.TryToRefreshToken(installationId, token);

			expect(installationStoreMock.updateToken).toHaveBeenCalledWith(
				installationId,
				expectedToken,
			);

			expect(fetchSpy).toHaveBeenCalledWith(`${config.authUrl}/oauth/token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': '100',
				},
				body: 'client_id=client_id&client_secret=client_secret&refresh_token=refresh_tok3n&grant_type=refresh_token',
			});

			expect(errorMsg).toEqual('Access token successfully refreshed. Try repeating the measurement.');
		});
	});

	describe('OnCallback', () => {
		it('should exchange a new token, revoke the old token, and post a success message in slack', async () => {
			const code = 'code';
			const userId = 'U123';
			const channelId = 'C123';
			const threadTs = '123';
			const installationId = 'I123';

			const now = new Date();

			const token: AuthToken = {
				access_token: 'tok3n',
				refresh_token: 'refresh_tok3n',
				expires_in: 3600,
				token_type: 'Bearer',
				expiry: now.getTime() / 1000 - 3600,
			};

			const authorizeSession: AuthorizeSession = {
				verifier: 'verifier',
				userId,
				channelId,
				threadTs,
			};

			const installation = {
				bot: { token: 'installation_token' },
			} as Installation;

			const newToken: AuthToken = {
				access_token: 'new_tok3n',
				refresh_token: 'new_refresh_tok3n',
				expires_in: 3600,
				token_type: 'Bearer',
				expiry: Math.floor(now.getTime() / 1000 + 3600),
			};

			vi.spyOn(Date, 'now').mockReturnValue(now.getTime());

			vi.spyOn(
				installationStoreMock,
				'getInstallationForAuthorization',
			).mockResolvedValue({
				token,
				session: authorizeSession,
				installation,
			});

			const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => newToken,
			} as Response);

			const req = {
				url: `/oauth/callback?code=${code}&state=${installationId}`,
			} as ParamsIncomingMessage;
			const res = {
				writeHead: vi.fn(),
				end: vi.fn(),
			} as any;

			await oauth.OnCallback(req, res);

			expect(installationStoreMock.getInstallationForAuthorization).toHaveBeenCalledWith(installationId);

			expect(installationStoreMock.updateAuthorizeSession).toHaveBeenCalledWith(
				installationId,
				null,
			);

			expect(installationStoreMock.updateToken).toHaveBeenCalledWith(
				installationId,
				newToken,
			);

			expect(fetchSpy).toHaveBeenCalledWith(`${config.authUrl}/oauth/token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': '173',
				},
				body: 'client_id=client_id&client_secret=client_secret&code=code&code_verifier=verifier&grant_type=authorization_code&redirect_uri=http%3A%2F%2Flocalhost%2Fslack%2Foauth%2Fcallback',
			});

			expect(fetchSpy).toHaveBeenCalledWith(
				`${config.authUrl}/oauth/token/revoke`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
						'Content-Length': '19',
					},
					body: 'token=refresh_tok3n',
				},
			);

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				token: installation?.bot?.token,
				text: 'Success! You are now authenticated.',
				user: userId,
				channel: channelId,
				thread_ts: threadTs,
			});

			expect(res.writeHead).toHaveBeenCalledWith(302, {
				Location: `${config.dashboardUrl}/authorize/success`,
			});

			expect(res.end).toHaveBeenCalled();
		});
	});
});
