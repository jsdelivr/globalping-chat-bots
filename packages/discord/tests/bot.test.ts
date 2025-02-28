import { generateHelp, HttpProbeResult } from '@globalping/bot-utils';
import { codeBlock } from 'discord.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Bot } from '../src/bot.js';
import {
	getDefaultDnsResponse,
	getDefaultHttpResponse,
	getDefaultMtrResponse,
	getDefaultPingResponse,
	getDefaultTracerouteResponse,
	mockDiscordInteraction,
	mockGetMeasurement,
	mockLogger,
	mockPostMeasurement,
} from './utils.js';

describe('Bot', () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	const discordMessageLimit = 2000;

	const loggerMock = mockLogger();
	const postMeasurementMock = mockPostMeasurement();
	const getMeasurementMock = mockGetMeasurement();

	const interactionMock = mockDiscordInteraction();

	const expectedHelpTexts = generateHelp(
		'**',
		'/globalping',
		new Set([ 'auth', 'limits' ]),
		4,
		1,
	);

	const bot = new Bot(loggerMock, postMeasurementMock, getMeasurementMock);

	describe('HandleInteraction', () => {
		it('should handle the command - /globalping ping', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			const options: Record<string, string | number | boolean> = {
				target: 'google.com',
			};
			interactionMock.options = {
				getSubcommand: () => 'ping',
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultPingResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledWith({
				type: 'ping',
				target: 'google.com',
				inProgressUpdates: false,
				limit: 1,
				locations: [{ magic: 'world' }],
				measurementOptions: {},
			});

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
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultDnsResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledWith({
				type: 'dns',
				target: 'google.com',
				inProgressUpdates: false,
				limit: 1,
				locations: [{ magic: 'Berlin' }],
				measurementOptions: {
					resolver: '1.1.1.1',
				},
			});

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
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultHttpResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledWith({
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
			});

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
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultHttpResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledWith({
				type: 'http',
				target: 'jsdelivr.com',
				inProgressUpdates: false,
				limit: 1,
				locations: [{ magic: 'world' }],
				measurementOptions: {
					protocol: 'HTTPS',
					request: {},
				},
			});

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
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultMtrResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledWith({
				type: 'mtr',
				target: 'google.com',
				inProgressUpdates: false,
				limit: 1,
				locations: [{ magic: 'world' }],
				measurementOptions: {},
			});

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
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultTracerouteResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledWith({
				type: 'traceroute',
				target: 'google.com',
				inProgressUpdates: false,
				limit: 1,
				locations: [{ magic: 'world' }],
				measurementOptions: {},
			});

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

		it('should handle the command - /globalping help', async () => {
			vi.spyOn(interactionMock, 'isChatInputCommand').mockReturnValue(true);

			const options: Record<string, string | number | boolean> = {};
			interactionMock.options = {
				getSubcommand: () => 'help',
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.editReply).toHaveBeenCalledWith(expectedHelpTexts.general);

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
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.editReply).toHaveBeenCalledWith(expectedHelpTexts.ping);

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
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.editReply).toHaveBeenCalledWith(expectedHelpTexts.dns);

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
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.editReply).toHaveBeenCalledWith(expectedHelpTexts.http);

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
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.editReply).toHaveBeenCalledWith(expectedHelpTexts.mtr);

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
				getString: (key: string) => options[key] as string,
				getNumber: (key: string) => options[key] as number,
				getBoolean: (key: string) => options[key] as boolean,
			} as any;

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.editReply).toHaveBeenCalledWith(expectedHelpTexts.traceroute);

			if (expectedHelpTexts.traceroute.length > discordMessageLimit) {
				throw new Error(`The message must have at most ${discordMessageLimit} characters. Got ${expectedHelpTexts.traceroute.length}`);
			}
		});
	});
});
