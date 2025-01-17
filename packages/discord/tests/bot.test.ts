import { generateHelp } from '@globalping/bot-utils';
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

	const loggerMock = mockLogger();
	const postMeasurementMock = mockPostMeasurement();
	const getMeasurementMock = mockGetMeasurement();

	const interactionMock = mockDiscordInteraction();

	const expectedHelpTexts = generateHelp(
		'**',
		'/globalping',
		new Set([ 'auth', 'limits' ]),
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
			};

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
			};

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
			};

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
				= expectedResponse.results[0].result.rawOutput.trim().slice(0, 1008)
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
			};

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
				= expectedResponse.results[0].result.rawOutput.trim().slice(0, 1008)
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
			};

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
			};

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.editReply).toHaveBeenCalledWith({
				content: expectedHelpTexts.general,
			});
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
			};

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.editReply).toHaveBeenCalledWith({
				content: expectedHelpTexts.ping,
			});
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
			};

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.editReply).toHaveBeenCalledWith({
				content: expectedHelpTexts.dns,
			});
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
			};

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.editReply).toHaveBeenCalledWith({
				content: expectedHelpTexts.http,
			});
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
			};

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.editReply).toHaveBeenCalledWith({
				content: expectedHelpTexts.mtr,
			});
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
			};

			await bot.HandleInteraction(interactionMock);

			expect(interactionMock.deferReply).toHaveBeenCalled();

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(interactionMock.editReply).toHaveBeenCalledWith({
				content: expectedHelpTexts.traceroute,
			});
		});
	});
});
