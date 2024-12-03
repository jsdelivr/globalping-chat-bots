import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	CreateLimitType,
	IntrospectionResponse,
	LimitsResponse,
} from '../auth.js';
import { Bot, getLimitsOutput, getMoreCreditsRequiredAuthError, getMoreCreditsRequiredNoAuthError, getNoCreditsAuthError, getNoCreditsNoAuthError, getRawTextFromBlocks } from '../bot.js';
import { getDefaultDnsResponse, getDefaultHttpResponse, getDefaultMtrResponse, getDefaultPingResponse, getDefaultTracerouteResponse, mockAuthClient, mockGetMeasurement, mockLogger, mockPostMeasurement, mockSlackClient } from './utils.js';
import { Context, SlashCommand } from '@slack/bolt';
import { StringIndexed } from '@slack/bolt/dist/types/helpers.js';
import { AuthToken } from '@globalping/bot-utils';

describe('Bot', () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	const loggerMock = mockLogger();
	const oauthClientMock = mockAuthClient();
	const postMeasurementMock = mockPostMeasurement();
	const getMeasurementMock = mockGetMeasurement();

	const ackMock = vi.fn();
	const respondMock = vi.fn();
	const slackClientMock = mockSlackClient();

	const bot = new Bot(loggerMock, oauthClientMock, postMeasurementMock, getMeasurementMock);

	describe('HandleCommand', () => {
		it('should handle the command - /globalping', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'ping google.com',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultPingResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleCommand({
				ack: ackMock,
				respond: respondMock,
				client: slackClientMock,
				payload,
				context,
			} as any);

			expect(ackMock).toHaveBeenCalledTimes(1);

			expect(slackClientMock.conversations.info).toHaveBeenCalledWith({
				channel: payload.channel_id,
			});

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith(context.teamId);

			expect(postMeasurementMock).toHaveBeenCalledWith({
				type: 'ping',
				target: 'google.com',
				inProgressUpdates: false,
				limit: 1,
				locations: [{ magic: 'world' }],
				measurementOptions: {},
			}, 'tok3n');

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: '```Processing the request...```',
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedBlocks = [
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `<@${payload.user_id}>, here are the results for \`${payload.text}\``,
						verbatim: true,
					},
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `>*Amsterdam, NL, EU, Gigahost AS (AS56655)*
\`\`\`
${expectedResponse.results[0].result.rawOutput}
\`\`\``,
						verbatim: true,
					},
				},
			];
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledWith({
				blocks: expectedBlocks,
				channel: payload.channel_id,
				thread_ts: undefined,
			});
		});

		it('should handle the command - /dns', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/dns',
				text: 'google.com from Berlin --resolver 1.1.1.1',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultDnsResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleCommand({
				ack: ackMock,
				respond: respondMock,
				client: slackClientMock,
				payload,
				context,
			} as any);

			expect(ackMock).toHaveBeenCalledTimes(1);

			expect(slackClientMock.conversations.info).toHaveBeenCalledWith({
				channel: payload.channel_id,
			});

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith(context.teamId);

			expect(postMeasurementMock).toHaveBeenCalledWith({
				type: 'dns',
				target: 'google.com',
				inProgressUpdates: false,
				limit: 1,
				locations: [{ magic: 'Berlin' }],
				measurementOptions: {
					resolver: '1.1.1.1',
				},
			}, 'tok3n');

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: '```Processing the request...```',
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedBlocks = [
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `<@${payload.user_id}>, here are the results for \`dns ${payload.text}\``,
						verbatim: true,
					},
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `>*Helsinki, FI, EU, Hetzner Online GmbH (AS24940)*
\`\`\`
${expectedResponse.results[0].result.rawOutput.trim()}
\`\`\``,
						verbatim: true,
					},
				},
			];
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledWith({
				blocks: expectedBlocks,
				channel: payload.channel_id,
				thread_ts: undefined,
			});
		});

		it('should handle the command - /http', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/http',
				text: 'jsdelivr.com --host www.jsdelivr.com --protocol https --port 443 --path "/package/npm/test" --query "nav=stats"',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultHttpResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleCommand({
				ack: ackMock,
				respond: respondMock,
				client: slackClientMock,
				payload,
				context,
			} as any);

			expect(ackMock).toHaveBeenCalledTimes(1);

			expect(slackClientMock.conversations.info).toHaveBeenCalledWith({
				channel: payload.channel_id,
			});

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith(context.teamId);

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
						headers: {},
						host: 'www.jsdelivr.com',
						path: '/package/npm/test',
						query: 'nav=stats',
					},
				},
			}, 'tok3n');

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: '```Processing the request...```',
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedBlocks = [
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `<@${payload.user_id}>, here are the results for \`http ${payload.text}\``,
						verbatim: true,
					},
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `>*Chisinau, MD, EU, STARK INDUSTRIES SOLUTIONS LTD (AS44477)*
\`\`\`
${expectedResponse.results[0].result.rawOutput}
\`\`\``,
						verbatim: true,
					},
				},
			];
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledWith({
				blocks: expectedBlocks,
				channel: payload.channel_id,
				thread_ts: undefined,
			});
		});

		it('should handle the command - /mtr', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/mtr',
				text: 'google.com',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultMtrResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleCommand({
				ack: ackMock,
				respond: respondMock,
				client: slackClientMock,
				payload,
				context,
			} as any);

			expect(ackMock).toHaveBeenCalledTimes(1);

			expect(slackClientMock.conversations.info).toHaveBeenCalledWith({
				channel: payload.channel_id,
			});

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith(context.teamId);

			expect(postMeasurementMock).toHaveBeenCalledWith({
				type: 'mtr',
				target: 'google.com',
				inProgressUpdates: false,
				limit: 1,
				locations: [{ magic: 'world' }],
				measurementOptions: {
				},
			}, 'tok3n');

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: '```Processing the request...```',
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedBlocks = [
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `<@${payload.user_id}>, here are the results for \`mtr ${payload.text}\``,
						verbatim: true,
					},
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `>*Beauharnois, CA, NA, OVH SAS (AS16276)*
\`\`\`
${expectedResponse.results[0].result.rawOutput.trim()}
\`\`\``,
						verbatim: true,
					},
				},
			];
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledWith({
				blocks: expectedBlocks,
				channel: payload.channel_id,
				thread_ts: undefined,
			});
		});

		it('should handle the command - /ping', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/ping',
				text: 'google.com from New York --limit 2',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultPingResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleCommand({
				ack: ackMock,
				respond: respondMock,
				client: slackClientMock,
				payload,
				context,
			} as any);

			expect(ackMock).toHaveBeenCalledTimes(1);

			expect(slackClientMock.conversations.info).toHaveBeenCalledWith({
				channel: payload.channel_id,
			});

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith(context.teamId);

			expect(postMeasurementMock).toHaveBeenCalledWith({
				type: 'ping',
				target: 'google.com',
				inProgressUpdates: false,
				limit: 2,
				locations: [{ magic: 'New York' }],
				measurementOptions: {},
			}, 'tok3n');

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: '```Processing the request...```',
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedBlocks = [
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `<@${payload.user_id}>, here are the results for \`ping ${payload.text}\``,
						verbatim: true,
					},
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `>*Amsterdam, NL, EU, Gigahost AS (AS56655)*
\`\`\`
${expectedResponse.results[0].result.rawOutput}
\`\`\``,
						verbatim: true,
					},
				},
			];
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledWith({
				blocks: expectedBlocks,
				channel: payload.channel_id,
				thread_ts: undefined,
			});
		});

		it('should handle the command - /traceroute', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/traceroute',
				text: 'google.com',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultTracerouteResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleCommand({
				ack: ackMock,
				respond: respondMock,
				client: slackClientMock,
				payload,
				context,
			} as any);

			expect(ackMock).toHaveBeenCalledTimes(1);

			expect(slackClientMock.conversations.info).toHaveBeenCalledWith({
				channel: payload.channel_id,
			});

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith(context.teamId);

			expect(postMeasurementMock).toHaveBeenCalledWith({
				type: 'traceroute',
				target: 'google.com',
				inProgressUpdates: false,
				limit: 1,
				locations: [{ magic: 'world' }],
				measurementOptions: {
				},
			}, 'tok3n');

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: '```Processing the request...```',
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedBlocks = [
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `<@${payload.user_id}>, here are the results for \`traceroute ${payload.text}\``,
						verbatim: true,
					},
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `>*Rotterdam, NL, EU, DELTA Fiber Nederland B.V. (AS15435)*
\`\`\`
${expectedResponse.results[0].result.rawOutput.trim()}
\`\`\``,
						verbatim: true,
					},
				},
			];
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledWith({
				blocks: expectedBlocks,
				channel: payload.channel_id,
				thread_ts: undefined,
			});
		});
	});

	describe('HandleMention', () => {
		it('should handle the mention', async () => {
			const event = {
				team: 'T07QAK46BGU',
				channel: 'C07QAK46BGU',
				user: 'U08QAK46BGU',
				thread_ts: '1629350157.000200',
				blocks: [
					{
						type: 'rich_text',
						block_id: '4T2L4',
						elements: [
							{
								type: 'rich_text_section',
								elements: [
									{
										type: 'user',
										user_id: 'U07QAK46BGU',
									},
									{
										type: 'text',
										text: ' ping ',
									},
									{
										type: 'link',
										url: 'http://google.com',
										text: 'google.com',
									},
								],
							},
						],
					},
				],
			};
			const context = {
				teamId: 'T07QAK46BGU',
				botUserId: 'U07QAK46BGU',
			} as Context & StringIndexed;


			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultPingResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleMention({
				event,
				context,
				client: slackClientMock,
			} as any);

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith(context.teamId);

			expect(postMeasurementMock).toHaveBeenCalledWith({
				type: 'ping',
				target: 'google.com',
				inProgressUpdates: false,
				limit: 1,
				locations: [{ magic: 'world' }],
				measurementOptions: {},
			}, 'tok3n');

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: '```Processing the request...```',
				user: event.user,
				channel: event.channel,
				thread_ts: event.thread_ts,
			});

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedBlocks = [
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `<@${event.user}>, here are the results for \`ping google.com\``,
						verbatim: true,
					},
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `>*Amsterdam, NL, EU, Gigahost AS (AS56655)*
\`\`\`
${expectedResponse.results[0].result.rawOutput}
\`\`\``,
						verbatim: true,
					},
				},
			];
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledWith({
				blocks: expectedBlocks,
				channel: event.channel,
				thread_ts: event.thread_ts,
			});
		});
	});

	describe('HandleMessage', () => {
		it('should handle the message', async () => {
			const event = {
				channel_type: 'im',
				team: 'T07QAK46BGU',
				channel: 'C07QAK46BGU',
				user: 'U08QAK46BGU',
				thread_ts: undefined,
				blocks: [
					{
						type: 'rich_text',
						block_id: '4T2L4',
						elements: [
							{
								type: 'rich_text_section',
								elements: [
									{
										type: 'text',
										text: 'ping ',
									},
									{
										type: 'link',
										url: 'http://google.com',
										text: 'google.com',
									},
								],
							},
						],
					},
				],
			};
			const context = {
				teamId: 'T07QAK46BGU',
				botUserId: 'U07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(oauthClientMock, 'GetToken').mockResolvedValue({
				access_token: 'tok3n',
			} as AuthToken);

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultPingResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			await bot.HandleMessage({
				event,
				context,
				client: slackClientMock,
			} as any);

			expect(oauthClientMock.GetToken).toHaveBeenCalledWith(context.teamId);

			expect(postMeasurementMock).toHaveBeenCalledWith({
				type: 'ping',
				target: 'google.com',
				inProgressUpdates: false,
				limit: 1,
				locations: [{ magic: 'world' }],
				measurementOptions: {},
			}, 'tok3n');

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: '```Processing the request...```',
				user: event.user,
				channel: event.channel,
				thread_ts: event.thread_ts,
			});

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			const expectedBlocks = [
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `<@${event.user}>, here are the results for \`ping google.com\``,
						verbatim: true,
					},
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `>*Amsterdam, NL, EU, Gigahost AS (AS56655)*
\`\`\`
${expectedResponse.results[0].result.rawOutput}
\`\`\``,
						verbatim: true,
					},
				},
			];
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledWith({
				blocks: expectedBlocks,
				channel: event.channel,
				thread_ts: event.thread_ts,
			});
		});

		it('should ignore the message - channel type is not im', async () => {
			const event = {
			};
			const context = {
			} as Context & StringIndexed;

			await bot.HandleMessage({
				event,
				context,
				client: slackClientMock,
			} as any);

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);
			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);
		});

		it('should ignore the message - event sub type is message_changed', async () => {
			const event = {
				channel_type: 'im',
				subtype: 'message_changed',
			};
			const context = {
			} as Context & StringIndexed;

			await bot.HandleMessage({
				event,
				context,
				client: slackClientMock,
			} as any);

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);
			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);
		});
	});

	describe('getLimitsOutput', () => {
		it('should return correct text', () => {
			const introspection: IntrospectionResponse = {
				active: true,
				username: 'john',
			};
			const limits: LimitsResponse = {
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
			};

			const expectedText = `Authentication: token (john)

Creating measurements:
 - 500 tests per hour
 - 150 consumed, 350 remaining
 - resets in 10 minutes

Credits:
 - 1000 credits remaining (may be used to create measurements above the hourly limits)
`;

			expect(getLimitsOutput(limits, introspection)).toBe(expectedText);
		});

		it('should return correct text - limit type IP', () => {
			const introspection: IntrospectionResponse = {
				active: true,
				username: 'john',
			};
			const limits: LimitsResponse = {
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
			};

			const expectedText = `Authentication: workspace

Creating measurements:
 - 500 tests per hour
 - 0 consumed, 500 remaining
`;

			expect(getLimitsOutput(limits, introspection)).toBe(expectedText);
		});
	});

	describe('getMoreCreditsRequiredAuthError', () => {
		it('should return correct error', () => {
			const error = getMoreCreditsRequiredAuthError(5, 2, 300);
			expect(error).toEqual(new Error('You only have 2 credits remaining, and 5 were required. Try requesting fewer probes or wait 5 minutes for the rate limit to reset. You can get higher limits by sponsoring us or hosting probes.'));
		});
	});

	describe('getNoCreditsAuthError', () => {
		it('should return correct error', () => {
			const error = getNoCreditsAuthError(60);
			expect(error).toEqual(new Error('You have run out of credits for this session. You can wait 1 minute for the rate limit to reset or get higher limits by sponsoring us or hosting probes.'));
		});
	});

	describe('getMoreCreditsRequiredNoAuthError', () => {
		it('should return correct error', () => {
			const error = getMoreCreditsRequiredNoAuthError(2, 1, 245);
			expect(error).toEqual(new Error('You only have 1 credit remaining, and 2 were required. Try requesting fewer probes or wait 4 minutes for the rate limit to reset. You can get higher limits by creating an account. Sign up at https://globalping.io'));
		});
	});

	describe('getNoCreditsNoAuthError', () => {
		it('should return correct error', () => {
			const error = getNoCreditsNoAuthError(10);
			expect(error).toEqual(new Error('You have run out of credits for this session. You can wait 10 seconds for the rate limit to reset or get higher limits by creating an account. Sign up at https://globalping.io'));
		});
	});

	describe('getRawTextFromBlocks', () => {
		it('should return only the text', () => {
			const blocks = [
				{
					type: 'rich_text',
					block_id: '4T2L4',
					elements: [
						{
							type: 'rich_text_section',
							elements: [
								{
									type: 'emoji',
									name: 'laughing',
									unicode: '1f606',
								},
								{
									type: 'text',
									text: '  ',
								},
								{
									type: 'text',
									text: ' ping ',
								},
								{
									type: 'link',
									url: 'http://google.com',
									text: 'google.com',
								},
							],
						},
					],
				},
			];
			const text = getRawTextFromBlocks('U07QAK46BGU', blocks);
			expect(text).to.equal('ping google.com');
		});

		it('should return the text after the mention', () => {
			const blocks = [
				{
					type: 'rich_text',
					block_id: '4T2L4',
					elements: [
						{
							type: 'rich_text_section',
							elements: [
								{
									type: 'text',
									text: 'xxxxx ',
								},
								{
									type: 'emoji',
									name: 'laughing',
									unicode: '1f606',
								},
								{
									type: 'text',
									text: ' ',
								},
								{
									type: 'user',
									user_id: 'U07QAK46BGU',
								},
								{
									type: 'text',
									text: ' ping ',
								},
								{
									type: 'link',
									url: 'http://google.com',
									text: 'google.com',
								},
							],
						},
					],
				},
			];
			const text = getRawTextFromBlocks('U07QAK46BGU', blocks);
			expect(text).to.equal('ping google.com');
		});
	});
});
