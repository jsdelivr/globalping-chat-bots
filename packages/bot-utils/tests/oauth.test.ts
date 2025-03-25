import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	AuthorizeError,
	AuthorizeErrorType,
	Config,
	IntrospectionResponse,
	OAuthClient,
} from '../src/oauth.js';
import { mockDBClient, mockLogger } from './utils.js';
import { AuthToken } from '../src/types.js';

describe('Auth', () => {
	const config: Config = {
		serverHost: 'http://localhost',
		authCallbackPath: '/oauth/callback',
		authUrl: 'http://auth.localhost',
		authClientId: 'client_id',
		authClientSecret: 'client_secret',
	} as Config;

	const loggerMock = mockLogger();
	const dbClientMock = mockDBClient();

	const oauth: OAuthClient = new OAuthClient(config, loggerMock, dbClientMock);

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('Authorize', () => {
		it('should create a session and return a valid url', async () => {
			const userId = 'U123';
			const channelId = 'C123';
			const threadTs = '123';
			const installationId = 'I123';

			const res = await oauth.Authorize(installationId, {
				userId,
				channelId,
				threadTs,
			});

			expect(dbClientMock.updateAuthorizeSession).toHaveBeenCalledWith(
				installationId,
				{
					callbackVerifier: expect.any(String),
					exchangeVerifier: expect.any(String),
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

			expect(url.searchParams.get('redirect_uri')).toBe(config.serverHost + config.authCallbackPath);

			const state = url.searchParams.get('state');
			expect(state?.length).toBe(43 + 1 + installationId.length);
			expect(state?.substring(43)).toBe(':' + installationId);
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

			vi.spyOn(dbClientMock, 'getToken').mockResolvedValue(token);

			const err = await oauth.Logout(installationId);

			expect(dbClientMock.getToken).toHaveBeenCalledWith(installationId);

			expect(dbClientMock.updateToken).toHaveBeenCalledWith(
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

			vi.spyOn(dbClientMock, 'getToken').mockResolvedValue(null);

			const err = await oauth.Logout(insallationId);

			expect(dbClientMock.getToken).toHaveBeenCalledWith(insallationId);

			expect(dbClientMock.updateToken).toHaveBeenCalledTimes(0);
			expect(fetchSpy).toHaveBeenCalledTimes(0);

			expect(err).toBeNull();
		});

		it('should not remove and revoke the token - anonymous token', async () => {
			const installationId = 'I123';
			const token: AuthToken = {
				access_token: 'tok3n',
				refresh_token: 'refresh_tok3n',
				expires_in: 3600,
				token_type: 'Bearer',
				expiry: Date.now() / 1000 + 3600,
				isAnonymous: true,
			};

			const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
				ok: true,
				status: 200,
			} as Response);

			vi.spyOn(dbClientMock, 'getToken').mockResolvedValue(token);

			const err = await oauth.Logout(installationId);

			expect(dbClientMock.getToken).toHaveBeenCalledWith(installationId);

			expect(dbClientMock.updateToken).toHaveBeenCalledTimes(0);

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

			vi.spyOn(dbClientMock, 'getToken').mockResolvedValue(token);

			const [ introspection, error ] = await oauth.Introspect(installationId);

			expect(dbClientMock.getToken).toHaveBeenCalledWith(installationId);

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

		it('should successfully return the response - anonymous token', async () => {
			const installationId = 'I123';

			const token: AuthToken = {
				access_token: 'tok3n',
				refresh_token: 'refresh_tok3n',
				expires_in: 3600,
				token_type: 'Bearer',
				expiry: Date.now() / 1000 + 3600,
				isAnonymous: true,
			};
			const expectedIntrospection: IntrospectionResponse = {
				active: false,
			};

			const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
				ok: true,
				status: 200,
			} as Response);

			vi.spyOn(dbClientMock, 'getToken').mockResolvedValue(token);

			const [ introspection, error ] = await oauth.Introspect(installationId);

			expect(dbClientMock.getToken).toHaveBeenCalledWith(installationId);

			expect(fetchSpy).toHaveBeenCalledTimes(0);

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

			vi.spyOn(dbClientMock, 'getToken').mockResolvedValue(token);

			const newToken = await oauth.GetToken(installationId);

			expect(dbClientMock.getToken).toHaveBeenCalledWith(installationId);

			expect(dbClientMock.updateToken).toHaveBeenCalledWith(
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

			vi.spyOn(dbClientMock, 'getToken').mockResolvedValue(token);

			const newToken = await oauth.GetToken(installationId);

			expect(dbClientMock.getToken).toHaveBeenCalledWith(installationId);

			expect(dbClientMock.updateToken).toHaveBeenCalledTimes(0);

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

		it('should request a new anonymous token - no current token', async () => {
			const now = new Date();
			const installationId = 'I123';

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

			vi.spyOn(dbClientMock, 'getToken').mockResolvedValue(null);

			const newToken = await oauth.GetToken(installationId);

			expect(dbClientMock.getToken).toHaveBeenCalledWith(installationId);

			expect(dbClientMock.updateToken).toHaveBeenCalledWith(installationId, {
				...expectedToken,
				isAnonymous: true,
			});

			expect(fetchSpy).toHaveBeenCalledWith(`${config.authUrl}/oauth/token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': '107',
				},
				body: 'client_id=client_id&client_secret=client_secret&grant_type=globalping_client_credentials&scope=measurements',
			});

			expect(newToken).toEqual(expectedToken);
		});

		it('should request a new anonymous token - current anonymous token is expired', async () => {
			const now = new Date();
			const installationId = 'I123';

			const currentToken: AuthToken = {
				access_token: 'token',
				refresh_token: 'refresh_token',
				expires_in: 3600,
				token_type: 'Bearer',
				expiry: Math.floor(now.getTime() / 1000),
				isAnonymous: true,
			};

			const expectedToken: AuthToken = {
				access_token: 'new_tok3n',
				refresh_token: 'new_refresh_tok3n',
				expires_in: 3600,
				token_type: 'Bearer',
				expiry: Math.floor(now.getTime() / 1000 + 13600),
			};

			vi.spyOn(Date, 'now').mockReturnValue(now.getTime() + 1000000);

			vi.spyOn(dbClientMock, 'getToken').mockResolvedValue(currentToken);

			const fetchSpy = vi.spyOn(global, 'fetch');
			fetchSpy.mockResolvedValueOnce({
				ok: true,
				status: 400,
				json: async () => ({
					error: AuthorizeErrorType.InvalidGrant,
					error_description: 'Invalid token',
				}),
			} as Response);

			fetchSpy.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => expectedToken,
			} as Response);

			const newToken = await oauth.GetToken(installationId);

			expect(dbClientMock.getToken).toHaveBeenCalledWith(installationId);

			expect(dbClientMock.updateToken).toHaveBeenCalledWith(installationId, {
				...expectedToken,
				isAnonymous: true,
			});

			expect(fetchSpy).toHaveBeenCalledTimes(2);

			expect(fetchSpy).toHaveBeenCalledWith(`${config.authUrl}/oauth/token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': '100',
				},
				body: 'client_id=client_id&client_secret=client_secret&refresh_token=refresh_token&grant_type=refresh_token',
			});

			expect(fetchSpy).toHaveBeenCalledWith(`${config.authUrl}/oauth/token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': '107',
				},
				body: 'client_id=client_id&client_secret=client_secret&grant_type=globalping_client_credentials&scope=measurements',
			});

			expect(newToken).toEqual(expectedToken);
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

			expect(dbClientMock.updateToken).toHaveBeenCalledWith(
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

	describe('Exchange', () => {
		it('should exchange the token', async () => {
			const now = new Date();
			const id = '123';

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

			const err = await oauth.Exchange('cod3', 'verifi3r', id);

			expect(err).toBeNull();

			expect(dbClientMock.updateToken).toHaveBeenCalledWith(id, expectedToken);

			expect(fetchSpy).toHaveBeenCalledWith(`${config.authUrl}/oauth/token`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': '165',
				},
				body: 'client_id=client_id&client_secret=client_secret&code=cod3&code_verifier=verifi3r&grant_type=authorization_code&redirect_uri=http%3A%2F%2Flocalhost%2Foauth%2Fcallback',
			});
		});
	});

	describe('RevokeToken', () => {
		it('should revoke the token', async () => {
			const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
				ok: true,
				status: 200,
			} as Response);

			const err = await oauth.RevokeToken('refresh_tok3n');

			expect(err).toBeNull();

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
		});
	});
});
