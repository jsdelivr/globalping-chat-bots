import {
	AuthToken,
	CreateLimitType,
	generateHelp,
	HttpProbeResult,
} from '@globalping/bot-utils';
import { codeBlock, GuildMember, MessageFlags, Routes } from 'discord.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Bot } from '../src/bot.js';
import {
	getDefaultDnsResponse,
	getDefaultHttpResponse,
	getDefaultMtrResponse,
	getDefaultPingResponse,
	getDefaultTracerouteResponse,
	mockAuthClient,
	mockDBClient,
	mockDiscordClient,
	mockDiscordInteraction,
	mockDiscordMessage,
	mockGetMeasurement,
	mockLogger,
	mockPostMeasurement,
} from './utils.js';
import { Config } from '../src/types.js';
import { AuthorizeSession } from '../src/db.js';
import { IncomingMessage } from 'node:http';

describe('Bot', () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	const discordMessageLimit = 2000;

	const loggerMock = mockLogger();
	const dbClientMock = mockDBClient();
	const oauthClientMock = mockAuthClient();
	const postMeasurementMock = mockPostMeasurement();
	const getMeasurementMock = mockGetMeasurement();
	const discordClientMock = mockDiscordClient();

	const interactionMock = mockDiscordInteraction();
	const messageMock = mockDiscordMessage();

	const expectedHelpTexts = generateHelp('**', '/globalping', undefined, 4, 1);
	const configMock = {
		serverHost: 'http://localhost',
		dashboardUrl: 'http://dash.localhost',
		authUrl: 'http://auth.localhost',
	};

	const bot = new Bot(
		loggerMock,
		configMock as Config,
		dbClientMock,
		postMeasurementMock,
		getMeasurementMock,
		oauthClientMock,
		discordClientMock,
	);

	describe('HandleInteraction', () => {
		it('should handle the command - /globalping ping', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			const options: Record<string, string | number | boolean> = {
				target: 'google.com',
			};
			interactionMock.options = {
				getSubcommand: () => 'ping',
				getSubcommandGroup: () => undefined,
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultPingResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith('G654');

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'ping',
					target: 'google.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {},
				},
				'tok3n',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedReply = {
				content: '<@123>, here are the results for `ping google.com`',
				embeds: [
					{
						fields: [
							{
								name: '> **Amsterdam, NL, EU, Gigahost AS (AS56655)**\n',
								value: codeBlock(expectedResponse.results[0].result.rawOutput),
							},
						],
					},
				],
			};

			expect(interactionMock.editReply).toHaveBeenCalledWith(expectedReply);
		});

		it('should handle the command - /globalping dns', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			const options: Record<string, string | number | boolean> = {
				target: 'google.com',
				from: 'Berlin',
				resolver: '1.1.1.1',
			};
			interactionMock.options = {
				getSubcommand: () => 'dns',
				getSubcommandGroup: () => undefined,
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultDnsResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith('G654');

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'dns',
					target: 'google.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'Berlin' }],
					measurementOptions: {
						resolver: '1.1.1.1',
					},
				},
				'tok3n',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedReply = {
				content:
					'<@123>, here are the results for `dns google.com from Berlin --resolver 1.1.1.1`',
				embeds: [
					{
						fields: [
							{
								name: '> **Helsinki, FI, EU, Hetzner Online GmbH (AS24940)**\n',
								value: codeBlock(expectedResponse.results[0].result.rawOutput.trim()),
							},
						],
					},
				],
			};

			expect(interactionMock.editReply).toHaveBeenCalledWith(expectedReply);
		});

		it('should handle the command - /globalping http', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			const options: Record<string, string | number | boolean> = {
				target: 'jsdelivr.com',
				host: 'www.jsdelivr.com',
				protocol: 'HTTPS',
				port: 443,
				path: '/package/npm/test',
				query: 'nav=stats',
			};
			interactionMock.options = {
				getSubcommand: () => 'http',
				getSubcommandGroup: () => undefined,
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultHttpResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith('G654');

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'http',
					target: 'jsdelivr.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {
						port: 443,
						protocol: 'HTTPS',
						request: {
							host: 'www.jsdelivr.com',
							path: '/package/npm/test',
							query: 'nav=stats',
						},
					},
				},
				'tok3n',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedText
				= expectedResponse.results[0].result.rawOutput.trim().slice(0, 1000)
				+ '\n... (truncated)';

			const expectedReply = {
				content:
					'<@123>, here are the results for `http jsdelivr.com --protocol HTTPS --port 443 --query nav=stats --path /package/npm/test --host www.jsdelivr.com`',
				embeds: [
					{
						fields: [
							{
								name: '> **Chisinau, MD, EU, STARK INDUSTRIES SOLUTIONS LTD (AS44477)**\n',
								value: codeBlock(expectedText),
							},
						],
					},
				],
			};

			expect(interactionMock.editReply).toHaveBeenCalledWith(expectedReply);
		});

		it('should handle the command - /globalping http tls details', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			const options: Record<string, string | number | boolean> = {
				target: 'jsdelivr.com',
				protocol: 'HTTPS',
				full: true,
			};
			interactionMock.options = {
				getSubcommand: () => 'http',
				getSubcommandGroup: () => undefined,
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultHttpResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith('G654');

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'http',
					target: 'jsdelivr.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {
						protocol: 'HTTPS',
						request: {},
					},
				},
				'tok3n',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedText = `TLSv1.3/TLS_AES_256_GCM_SHA384
Subject: www.jsdelivr.com; DNS:www.jsdelivr.com
Issuer: E6; Let's Encrypt; US
Validity: 2024-11-09T23:42:06.000Z; 2025-02-07T23:42:05.000Z
Serial number: 04:F7:8C:6D:25:44:42:1D:C3:0C:9D:77:0C:E1:89:60:95:2F
Fingerprint: 46:CF:F6:55:D2:66:13:4E:65:83:25:3E:4D:5D:E5:AA:88:15:BE:FA:FC:4E:A8:6A:42:CE:B0:63:FF:0E:88:83
Key type: EC256

HTTP/1.1 200
${(expectedResponse.results[0].result as HttpProbeResult).rawHeaders.slice(0, 622)}
... (truncated)`;

			const expectedReply = {
				content:
					'<@123>, here are the results for `http jsdelivr.com --protocol HTTPS --full true`',
				embeds: [
					{
						fields: [
							{
								name: '> **Chisinau, MD, EU, STARK INDUSTRIES SOLUTIONS LTD (AS44477)**\n',
								value: codeBlock(expectedText),
							},
						],
					},
				],
			};

			expect(interactionMock.editReply).toHaveBeenCalledWith(expectedReply);
		});

		it('should handle the command - /globalping mtr', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			const options: Record<string, string | number | boolean> = {
				target: 'google.com',
			};
			interactionMock.options = {
				getSubcommand: () => 'mtr',
				getSubcommandGroup: () => undefined,
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultMtrResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith('G654');

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'mtr',
					target: 'google.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {},
				},
				'tok3n',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedText
				= expectedResponse.results[0].result.rawOutput.trim().slice(0, 1000)
				+ '\n... (truncated)';

			const expectedReply = {
				content: '<@123>, here are the results for `mtr google.com`',
				embeds: [
					{
						fields: [
							{
								name: '> **Beauharnois, CA, NA, OVH SAS (AS16276)**\n',
								value: codeBlock(expectedText),
							},
						],
					},
				],
			};

			expect(interactionMock.editReply).toHaveBeenCalledWith(expectedReply);
		});

		it('should handle the command - /globalping traceroute', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			const options: Record<string, string | number | boolean> = {
				target: 'google.com',
			};
			interactionMock.options = {
				getSubcommand: () => 'traceroute',
				getSubcommandGroup: () => undefined,
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultTracerouteResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith('G654');

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'traceroute',
					target: 'google.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {},
				},
				'tok3n',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedReply = {
				content: '<@123>, here are the results for `traceroute google.com`',
				embeds: [
					{
						fields: [
							{
								name: '> **Rotterdam, NL, EU, DELTA Fiber Nederland B.V. (AS15435)**\n',
								value: codeBlock(expectedResponse.results[0].result.rawOutput.trim()),
							},
						],
					},
				],
			};

			expect(interactionMock.editReply).toHaveBeenCalledWith(expectedReply);
		});

		it('should handle the command - auth login', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			interactionMock.options = {
				getSubcommand: () => 'login',
				getSubcommandGroup: () => 'auth',
			} as any;

			interactionMock.member = {
				permissions: {
					has: vi.fn().mockReturnValue(true),
				},
			} as any;

			vi.spyOn(oauthClientMock, 'Authorize').mockResolvedValue({
				url: 'https://globalping.io/auth',
			});

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(oauthClientMock.Authorize).toHaveBeenCalledWith('G654', {
				applicationId: 'A123',
				token: 'message_tok3n',
			});

			expect(interactionMock.editReply).toHaveBeenCalledWith({
				embeds: [
					{
						description: `Please [click here](https://globalping.io/auth) to authenticate.

**Note:** This action applies to the whole server. Once logged in, all users on the server share the same account credits.`,
					},
				],
			});
		});

		it('should handle the command - auth login - cannot use the command', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			interactionMock.options = {
				getSubcommand: () => 'login',
				getSubcommandGroup: () => 'auth',
			} as any;

			interactionMock.member = {
				permissions: {
					has: vi.fn().mockReturnValue(false),
				},
			} as any;

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(oauthClientMock.Authorize).toHaveBeenCalledTimes(0);

			expect(interactionMock.editReply).toHaveBeenCalledWith({
				content: 'Only administrators can use this command.',
			});
		});

		it('should handle the command - auth logout', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			interactionMock.options = {
				getSubcommand: () => 'logout',
				getSubcommandGroup: () => 'auth',
			} as any;

			interactionMock.member = {
				permissions: {
					has: vi.fn().mockReturnValue(true),
				},
			} as any;

			vi.spyOn(oauthClientMock, 'Logout').mockResolvedValue(null);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(interactionMock.editReply).toHaveBeenCalledWith({
				content: 'You are now logged out.',
			});
		});

		it('should handle the command - auth status', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			interactionMock.options = {
				getSubcommand: () => 'status',
				getSubcommandGroup: () => 'auth',
			} as any;

			interactionMock.member = {
				permissions: {
					has: vi.fn().mockReturnValue(true),
				},
			} as any;

			vi.spyOn(oauthClientMock, 'Introspect').mockResolvedValue([
				{
					active: true,
					username: 'john',
				},
				null,
			]);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(oauthClientMock.Introspect).toHaveBeenCalledWith('G654');

			expect(interactionMock.editReply).toHaveBeenCalledWith({
				content: 'Logged in as john.',
			});
		});

		it('should handle the command - auth status anonymous', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			interactionMock.options = {
				getSubcommand: () => 'status',
				getSubcommandGroup: () => 'auth',
			} as any;

			interactionMock.member = {
				permissions: {
					has: vi.fn().mockReturnValue(true),
				},
			} as any;

			vi.spyOn(oauthClientMock, 'Introspect').mockResolvedValue([
				{
					active: true,
				},
				null,
			]);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(oauthClientMock.Introspect).toHaveBeenCalledWith('G654');

			expect(interactionMock.editReply).toHaveBeenCalledWith({
				content: 'Not logged in.',
			});
		});

		it('should handle the command - limits', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			interactionMock.options = {
				getSubcommand: () => 'limits',
				getSubcommandGroup: () => undefined,
			} as any;

			vi.spyOn(oauthClientMock, 'Introspect').mockResolvedValue([
				{
					active: true,
					username: 'john',
				},
				null,
			]);

			vi.spyOn(oauthClientMock, 'Limits').mockResolvedValue([
				{
					rateLimit: {
						measurements: {
							create: {
								type: CreateLimitType.User,
								limit: 500,
								remaining: 350,
								reset: 600,
							},
						},
					},
					credits: {
						remaining: 1000,
					},
				},
				null,
			]);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(oauthClientMock.Introspect).toHaveBeenCalledWith('G654');

			const expectedText = `Authentication: token (john)

Creating measurements:
 - 500 tests per hour
 - 150 consumed, 350 remaining
 - resets in 10 minutes

Credits:
 - 1000 credits remaining (may be used to create measurements above the hourly limits)
`;

			expect(interactionMock.editReply).toHaveBeenCalledWith({
				content: expectedText,
			});
		});

		it('should handle the command - limits IP', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			interactionMock.options = {
				getSubcommand: () => 'limits',
				getSubcommandGroup: () => undefined,
			} as any;

			vi.spyOn(oauthClientMock, 'Introspect').mockResolvedValue([
				{
					active: true,
					username: 'john',
				},
				null,
			]);

			vi.spyOn(oauthClientMock, 'Limits').mockResolvedValue([
				{
					rateLimit: {
						measurements: {
							create: {
								type: CreateLimitType.IP,
								limit: 500,
								remaining: 500,
								reset: 0,
							},
						},
					},
				},
				null,
			]);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(oauthClientMock.Introspect).toHaveBeenCalledWith('G654');

			const expectedText = `Authentication: workspace

Creating measurements:
 - 500 tests per hour
 - 0 consumed, 500 remaining
`;

			expect(interactionMock.editReply).toHaveBeenCalledWith({
				content: expectedText,
			});
		});

		it('should handle the command - /globalping help', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			const options: Record<string, string | number | boolean> = {};
			interactionMock.options = {
				getSubcommand: () => 'help',
				getSubcommandGroup: () => undefined,
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			await bot.HandleInteraction(interactionMock);

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.reply).toHaveBeenCalledWith({
				content: expectedHelpTexts.general,
				flags: MessageFlags.Ephemeral,
			});

			if (expectedHelpTexts.general.length > discordMessageLimit) {
				throw new Error(`The message must have at most ${discordMessageLimit} characters. Got ${expectedHelpTexts.general.length}`);
			}
		});

		it('should handle the command - /globalping help ping', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			const options: Record<string, string | number | boolean> = {
				command: 'ping',
			};
			interactionMock.options = {
				getSubcommand: () => 'help',
				getSubcommandGroup: () => undefined,
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			await bot.HandleInteraction(interactionMock);

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.reply).toHaveBeenCalledWith({
				content: expectedHelpTexts.ping,
				flags: MessageFlags.Ephemeral,
			});

			if (expectedHelpTexts.ping.length > discordMessageLimit) {
				throw new Error(`The message must have at most ${discordMessageLimit} characters. Got ${expectedHelpTexts.ping.length}`);
			}
		});

		it('should handle the command - /globalping help dns', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			const options: Record<string, string | number | boolean> = {
				command: 'dns',
			};
			interactionMock.options = {
				getSubcommand: () => 'help',
				getSubcommandGroup: () => undefined,
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			await bot.HandleInteraction(interactionMock);

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.reply).toHaveBeenCalledWith({
				content: expectedHelpTexts.dns,
				flags: MessageFlags.Ephemeral,
			});

			if (expectedHelpTexts.dns.length > discordMessageLimit) {
				throw new Error(`The message must have at most ${discordMessageLimit} characters. Got ${expectedHelpTexts.dns.length}`);
			}
		});

		it('should handle the command - /globalping help http', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			const options: Record<string, string | number | boolean> = {
				command: 'http',
			};
			interactionMock.options = {
				getSubcommand: () => 'help',
				getSubcommandGroup: () => undefined,
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			await bot.HandleInteraction(interactionMock);

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.reply).toHaveBeenCalledWith({
				content: expectedHelpTexts.http,
				flags: MessageFlags.Ephemeral,
			});

			if (expectedHelpTexts.http.length > discordMessageLimit) {
				throw new Error(`The message must have at most ${discordMessageLimit} characters. Got ${expectedHelpTexts.http.length}`);
			}
		});

		it('should handle the command - /globalping help mtr', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			const options: Record<string, string | number | boolean> = {
				command: 'mtr',
			};
			interactionMock.options = {
				getSubcommand: () => 'help',
				getSubcommandGroup: () => undefined,
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			await bot.HandleInteraction(interactionMock);

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.reply).toHaveBeenCalledWith({
				content: expectedHelpTexts.mtr,
				flags: MessageFlags.Ephemeral,
			});

			if (expectedHelpTexts.mtr.length > discordMessageLimit) {
				throw new Error(`The message must have at most ${discordMessageLimit} characters. Got ${expectedHelpTexts.mtr.length}`);
			}
		});

		it('should handle the command - /globalping help traceroute', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			const options: Record<string, string | number | boolean> = {
				command: 'traceroute',
			};
			interactionMock.options = {
				getSubcommand: () => 'help',
				getSubcommandGroup: () => undefined,
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			await bot.HandleInteraction(interactionMock);

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.reply).toHaveBeenCalledWith({
				content: expectedHelpTexts.traceroute,
				flags: MessageFlags.Ephemeral,
			});

			if (expectedHelpTexts.traceroute.length > discordMessageLimit) {
				throw new Error(`The message must have at most ${discordMessageLimit} characters. Got ${expectedHelpTexts.traceroute.length}`);
			}
		});
	});

	describe('HandleMessage', () => {
		it('should handle the mention - ping', async () => {
			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultPingResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			vi.spyOn(messageMock.mentions, 'has').mockReturnValue(true);

			messageMock.content = '<@111> ping google.com';

			await bot.HandleMessage(messageMock);

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith('G654');

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'ping',
					target: 'google.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {},
				},
				'tok3n',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedReply = {
				content: '<@123>, here are the results for `ping google.com`',
				embeds: [
					{
						fields: [
							{
								name: '> **Amsterdam, NL, EU, Gigahost AS (AS56655)**\n',
								value: codeBlock(expectedResponse.results[0].result.rawOutput),
							},
						],
					},
				],
			};

			expect(messageMock.reply).toHaveBeenCalledWith(expectedReply);
		});

		it('should handle the mention - dns', async () => {
			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultDnsResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			vi.spyOn(messageMock.mentions, 'has').mockReturnValue(true);

			messageMock.content = 'text <@111> dns google.com from Berlin --resolver 1.1.1.1';

			await bot.HandleMessage(messageMock);

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith('G654');

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'dns',
					target: 'google.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'Berlin' }],
					measurementOptions: {
						resolver: '1.1.1.1',
					},
				},
				'tok3n',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedReply = {
				content: '<@123>, here are the results for `dns google.com from Berlin --resolver 1.1.1.1`',
				embeds: [
					{
						fields: [
							{
								name: '> **Helsinki, FI, EU, Hetzner Online GmbH (AS24940)**\n',
								value: codeBlock(expectedResponse.results[0].result.rawOutput.trim()),
							},
						],
					},
				],
			};

			expect(messageMock.reply).toHaveBeenCalledWith(expectedReply);
		});

		it('should handle the mention - http', async () => {
			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultHttpResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			vi.spyOn(messageMock.mentions, 'has').mockReturnValue(true);

			messageMock.content = '<@111> http jsdelivr.com --host www.jsdelivr.com --protocol https --port 443 --path "/package/npm/test" --query "nav=stats"';

			await bot.HandleMessage(messageMock);

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith('G654');

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'http',
					target: 'jsdelivr.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {
						port: 443,
						protocol: 'HTTPS',
						request: {
							headers: {},
							host: 'www.jsdelivr.com',
							path: '/package/npm/test',
							query: 'nav=stats',
						},
					},
				},
				'tok3n',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedText
				= expectedResponse.results[0].result.rawOutput.trim().slice(0, 1000)
				+ '\n... (truncated)';

			const expectedReply = {
				content: '<@123>, here are the results for `http jsdelivr.com --host www.jsdelivr.com --protocol https --port 443 --path "/package/npm/test" --query "nav=stats"`',
				embeds: [
					{
						fields: [
							{
								name: '> **Chisinau, MD, EU, STARK INDUSTRIES SOLUTIONS LTD (AS44477)**\n',
								value: codeBlock(expectedText),
							},
						],
					},
				],
			};

			expect(messageMock.reply).toHaveBeenCalledWith(expectedReply);
		});

		it('should handle the mention - mtr', async () => {
			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultMtrResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			vi.spyOn(messageMock.mentions, 'has').mockReturnValue(true);

			messageMock.content = '<@111> mtr google.com';

			await bot.HandleMessage(messageMock);

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith('G654');

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'mtr',
					target: 'google.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {},
				},
				'tok3n',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedText
				= expectedResponse.results[0].result.rawOutput.trim().slice(0, 1000)
				+ '\n... (truncated)';

			const expectedReply = {
				content: '<@123>, here are the results for `mtr google.com`',
				embeds: [
					{
						fields: [
							{
								name: '> **Beauharnois, CA, NA, OVH SAS (AS16276)**\n',
								value: codeBlock(expectedText),
							},
						],
					},
				],
			};

			expect(messageMock.reply).toHaveBeenCalledWith(expectedReply);
		});

		it('should handle the mention - traceroute', async () => {
			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultTracerouteResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			vi.spyOn(messageMock.mentions, 'has').mockReturnValue(true);

			messageMock.content = '<@111> traceroute google.com';

			await bot.HandleMessage(messageMock);

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith('G654');

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'traceroute',
					target: 'google.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {},
				},
				'tok3n',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedReply = {
				content: '<@123>, here are the results for `traceroute google.com`',
				embeds: [
					{
						fields: [
							{
								name: '> **Rotterdam, NL, EU, DELTA Fiber Nederland B.V. (AS15435)**\n',
								value: codeBlock(expectedResponse.results[0].result.rawOutput.trim()),
							},
						],
					},
				],
			};

			expect(messageMock.reply).toHaveBeenCalledWith(expectedReply);
		});

		it('should handle the mention - auth login', async () => {
			vi.spyOn(messageMock.mentions, 'has').mockReturnValue(true);
			vi.spyOn((messageMock.member as GuildMember).permissions, 'has').mockReturnValue(true);

			messageMock.content = '<@111> auth login';

			await bot.HandleMessage(messageMock);

			expect(messageMock.reply).toHaveBeenCalledWith({
				content: 'Please use `/globalping auth login` instead.',
			});
		});

		it('should handle the mention - auth logout', async () => {
			vi.spyOn(messageMock.mentions, 'has').mockReturnValue(true);
			vi.spyOn((messageMock.member as GuildMember).permissions, 'has').mockReturnValue(true);

			vi.spyOn(oauthClientMock, 'Logout').mockResolvedValue(null);

			messageMock.content = '<@111> auth logout';

			await bot.HandleMessage(messageMock);


			expect(messageMock.reply).toHaveBeenCalledWith({
				content: 'You are now logged out.',
			});
		});

		it('should handle the mention - auth status', async () => {
			vi.spyOn(messageMock.mentions, 'has').mockReturnValue(true);
			vi.spyOn((messageMock.member as GuildMember).permissions, 'has').mockReturnValue(true);


			vi.spyOn(oauthClientMock, 'Introspect').mockResolvedValue([
				{
					active: true,
					username: 'john',
				},
				null,
			]);

			messageMock.content = '<@111> auth status';

			await bot.HandleMessage(messageMock);

			expect(oauthClientMock.Introspect).toHaveBeenCalledWith('G654');


			expect(messageMock.reply).toHaveBeenCalledWith({
				content: 'Logged in as john.',
			});
		});

		it('should handle the mention - limits', async () => {
			vi.spyOn(messageMock.mentions, 'has').mockReturnValue(true);
			vi.spyOn((messageMock.member as GuildMember).permissions, 'has').mockReturnValue(true);

			vi.spyOn(oauthClientMock, 'Introspect').mockResolvedValue([
				{
					active: true,
					username: 'john',
				},
				null,
			]);

			vi.spyOn(oauthClientMock, 'Limits').mockResolvedValue([
				{
					rateLimit: {
						measurements: {
							create: {
								type: CreateLimitType.User,
								limit: 500,
								remaining: 350,
								reset: 600,
							},
						},
					},
					credits: {
						remaining: 1000,
					},
				},
				null,
			]);

			messageMock.content = '<@111> limits';

			await bot.HandleMessage(messageMock);

			expect(oauthClientMock.Introspect).toHaveBeenCalledWith('G654');

			const expectedText = `Authentication: token (john)

Creating measurements:
 - 500 tests per hour
 - 150 consumed, 350 remaining
 - resets in 10 minutes

Credits:
 - 1000 credits remaining (may be used to create measurements above the hourly limits)
`;
			expect(messageMock.reply).toHaveBeenCalledWith({
				content: expectedText,
			});
		});

		it('should handle the mention - bot mention was replaced with a role mention', async () => {
			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultPingResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			vi.spyOn(messageMock.mentions, 'has').mockReturnValue(true);

			messageMock.content = '<@&199> ping google.com';

			await bot.HandleMessage(messageMock);

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith('G654');

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'ping',
					target: 'google.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {},
				},
				'tok3n',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedReply = {
				content: '<@123>, here are the results for `ping google.com`',
				embeds: [
					{
						fields: [
							{
								name: '> **Amsterdam, NL, EU, Gigahost AS (AS56655)**\n',
								value: codeBlock(expectedResponse.results[0].result.rawOutput),
							},
						],
					},
				],
			};

			expect(messageMock.reply).toHaveBeenCalledWith(expectedReply);
		});

		it('should handle the mention - invalid command', async () => {
			vi.spyOn(messageMock.mentions, 'has').mockReturnValue(true);

			messageMock.content = '<@111> test test';

			await bot.HandleMessage(messageMock);

			expect(messageMock.reply).toHaveBeenCalledWith(`<@123>, there was an error processing your request for \`test test\`
\`\`\`
Invalid argument "test" for "command"!
Expected "ping, traceroute, dns, mtr, http, auth, limits".
\`\`\`
Documentation and Support: https://github.com/jsdelivr/globalping`);
		});

		it('should ignore mention - bot is not mentioned', async () => {
			vi.spyOn(messageMock.mentions, 'has').mockReturnValue(false);

			messageMock.content = 'message';

			await bot.HandleMessage(messageMock);

			expect(messageMock.reply).toHaveBeenCalledTimes(0);
		});
	});

	describe('OnAuthCallback', () => {
		it('should exchange a new token, revoke the old token, and post a success message in slack', async () => {
			const code = 'code';
			const userId = 'U123';
			const id = 'U' + userId;
			const applicationId = 'A123';
			const messageToken = 'message_tok3n';

			const now = new Date();

			const token: AuthToken = {
				access_token: 'tok3n',
				refresh_token: 'refresh_tok3n',
				expires_in: 3600,
				token_type: 'Bearer',
				expiry: now.getTime() / 1000 - 3600,
			};

			const authorizeSession: AuthorizeSession = {
				callbackVerifier: 'callback',
				exchangeVerifier: 'verifier',
				applicationId,
				token: messageToken,
			};

			vi.spyOn(dbClientMock, 'getDataForAuthorization').mockResolvedValue({
				token,
				session: authorizeSession,
			});

			const req = {
				url: `/oauth/callback?code=${code}&state=${authorizeSession.callbackVerifier}:${id}`,
			} as IncomingMessage;
			const res = {
				writeHead: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.OnAuthCallback(req, res);

			expect(dbClientMock.getDataForAuthorization).toHaveBeenCalledWith(id);

			expect(dbClientMock.updateAuthorizeSession).toHaveBeenCalledWith(
				id,
				null,
			);

			expect(oauthClientMock.Exchange).toHaveBeenCalledWith(
				code,
				authorizeSession.exchangeVerifier,
				id,
			);

			expect(oauthClientMock.RevokeToken).toHaveBeenCalledWith(token.refresh_token);

			expect(discordClientMock.rest.post).toHaveBeenCalledWith(
				Routes.webhook(applicationId, messageToken),
				{
					body: {
						content: `Success! You are now authenticated.`,
						flags: MessageFlags.Ephemeral,
					},
				},
			);

			expect(res.writeHead).toHaveBeenCalledWith(302, {
				Location: `${configMock.dashboardUrl}/authorize/success`,
			});

			expect(res.end).toHaveBeenCalled();
		});

		it('should redirect to the error page - callback verifier does not match', async () => {
			const code = 'code';
			const userId = 'U123';
			const id = 'U' + userId;
			const applicationId = 'A123';
			const messageToken = 'message_tok3n';

			const now = new Date();

			const token: AuthToken = {
				access_token: 'tok3n',
				refresh_token: 'refresh_tok3n',
				expires_in: 3600,
				token_type: 'Bearer',
				expiry: now.getTime() / 1000 - 3600,
			};

			const authorizeSession: AuthorizeSession = {
				callbackVerifier: 'callback',
				exchangeVerifier: 'verifier',
				applicationId,
				token: messageToken,
			};

			vi.spyOn(Date, 'now').mockReturnValue(now.getTime());

			vi.spyOn(dbClientMock, 'getDataForAuthorization').mockResolvedValue({
				token,
				session: {
					...authorizeSession,
					callbackVerifier: 'wrong',
				},
			});

			const fetchSpy = vi.spyOn(global, 'fetch');

			const req = {
				url: `/oauth/callback?code=${code}&state=${authorizeSession.callbackVerifier}:${id}`,
			} as IncomingMessage;
			const res = {
				writeHead: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.OnAuthCallback(req, res);

			expect(dbClientMock.getDataForAuthorization).toHaveBeenCalledWith(id);

			expect(dbClientMock.updateAuthorizeSession).toHaveBeenCalledTimes(0);

			expect(dbClientMock.updateToken).toHaveBeenCalledTimes(0);

			expect(fetchSpy).toHaveBeenCalledTimes(0);

			expect(discordClientMock.rest.post).toHaveBeenCalledTimes(0);

			expect(res.writeHead).toHaveBeenCalledWith(302, {
				Location: `${configMock.dashboardUrl}/authorize/error`,
			});

			expect(res.end).toHaveBeenCalled();
		});
	});
});
