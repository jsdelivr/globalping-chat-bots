import { afterEach, describe, expect, it, vi } from 'vitest';
import { CreateLimitType } from '../src/auth.js';
import {
	Bot,
	getMoreCreditsRequiredAuthError,
	getMoreCreditsRequiredNoAuthError,
	getNoCreditsAuthError,
	getNoCreditsNoAuthError,
	getRawTextFromBlocks,
} from '../src/bot.js';
import {
	getDefaultDnsResponse,
	getDefaultHttpResponse,
	getDefaultMtrResponse,
	getDefaultPingResponse,
	getDefaultTracerouteResponse,
	mockAuthClient,
	mockDBClient,
	mockGetMeasurement,
	mockLogger,
	mockPostMeasurement,
	mockSlackClient,
} from './utils.js';
import { Context, SlashCommand } from '@slack/bolt';
import { StringIndexed } from '@slack/bolt/dist/types/helpers.js';
import { AuthToken, generateHelp } from '@globalping/bot-utils';

describe('Bot', () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	const loggerMock = mockLogger();
	const dbClientMock = mockDBClient();
	const oauthClientMock = mockAuthClient();
	const postMeasurementMock = mockPostMeasurement();
	const getMeasurementMock = mockGetMeasurement();

	const ackMock = vi.fn();
	const respondMock = vi.fn();
	const slackClientMock = mockSlackClient();
	const expectedHelpTexts = generateHelp('*', '/globalping');

	const bot = new Bot(
		loggerMock,
		dbClientMock,
		oauthClientMock,
		postMeasurementMock,
		getMeasurementMock,
	);

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
						text: `> *Amsterdam, NL, EU, Gigahost AS (AS56655)*
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
						text: `> *Helsinki, FI, EU, Hetzner Online GmbH (AS24940)*
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
						text: `> *Chisinau, MD, EU, STARK INDUSTRIES SOLUTIONS LTD (AS44477)*
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
						text: `> *Beauharnois, CA, NA, OVH SAS (AS16276)*
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

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'ping',
					target: 'google.com',
					inProgressUpdates: false,
					limit: 2,
					locations: [{ magic: 'New York' }],
					measurementOptions: {},
				},
				'tok3n',
			);

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
						text: `> *Amsterdam, NL, EU, Gigahost AS (AS56655)*
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
						text: `> *Rotterdam, NL, EU, DELTA Fiber Nederland B.V. (AS15435)*
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

		it('should handle the command - auth login', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'auth login',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

			vi.spyOn(slackClientMock.users, 'info').mockResolvedValue({
				user: {
					is_owner: true,
				},
			} as any);

			vi.spyOn(oauthClientMock, 'Authorize').mockResolvedValue({
				url: 'https://globalping.io/auth',
			});

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

			expect(slackClientMock.users.info).toHaveBeenCalledWith({
				user: payload.user_id,
			});

			expect(oauthClientMock.Authorize).toHaveBeenCalledWith({
				installationId: context.teamId,
				channel_id: payload.channel_id,
				user_id: payload.user_id,
				thread_ts: payload.thread_ts,
			});

			const expectedBlocks = [
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: `Please <https://globalping.io/auth|click here> to authenticate.`,
					},
				},
			];
			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				blocks: expectedBlocks,
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});
		});

		it('should handle the command - auth logout', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'auth logout',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

			vi.spyOn(slackClientMock.users, 'info').mockResolvedValue({
				user: {
					is_owner: true,
				},
			} as any);

			vi.spyOn(oauthClientMock, 'Logout').mockResolvedValue(null);

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

			expect(slackClientMock.users.info).toHaveBeenCalledWith({
				user: payload.user_id,
			});

			expect(oauthClientMock.Logout).toHaveBeenCalledWith(context.teamId);

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: 'You are now logged out.',
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});
		});

		it('should handle the command - auth status', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'auth status',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

			vi.spyOn(slackClientMock.users, 'info').mockResolvedValue({
				user: {
					is_owner: true,
				},
			} as any);

			vi.spyOn(oauthClientMock, 'Introspect').mockResolvedValue([
				{
					active: true,
					username: 'john',
				},
				null,
			]);

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

			expect(slackClientMock.users.info).toHaveBeenCalledWith({
				user: payload.user_id,
			});

			expect(oauthClientMock.Introspect).toHaveBeenCalledWith(context.teamId);

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: 'Logged in as john.',
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});
		});

		it('should handle the command - auth status anonymous', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'auth status',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

			vi.spyOn(slackClientMock.users, 'info').mockResolvedValue({
				user: {
					is_owner: true,
				},
			} as any);

			vi.spyOn(oauthClientMock, 'Introspect').mockResolvedValue([
				{
					active: true,
				},
				null,
			]);

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

			expect(slackClientMock.users.info).toHaveBeenCalledWith({
				user: payload.user_id,
			});

			expect(oauthClientMock.Introspect).toHaveBeenCalledWith(context.teamId);

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: 'Not logged in.',
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});
		});

		it('should handle the command - limits', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'limits',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(oauthClientMock.Introspect).toHaveBeenCalledWith(context.teamId);

			const expectedText = `Authentication: token (john)

Creating measurements:
 - 500 tests per hour
 - 150 consumed, 350 remaining
 - resets in 10 minutes

Credits:
 - 1000 credits remaining (may be used to create measurements above the hourly limits)
`;
			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: expectedText,
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});
		});

		it('should handle the command - limits IP', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'limits',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(oauthClientMock.Introspect).toHaveBeenCalledWith(context.teamId);

			const expectedText = `Authentication: workspace

Creating measurements:
 - 500 tests per hour
 - 0 consumed, 500 remaining
`;
			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: expectedText,
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});
		});

		it('should handle the command - ping latency', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'ping google.com --latency',
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
						text: `> *Amsterdam, NL, EU, Gigahost AS (AS56655)*
\`\`\`
Min: 0.419 ms
Max: 0.489 ms
Avg: 0.419 ms
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

		it('should handle the command - dns latency', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'dns google.com --latency',
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

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'dns',
					target: 'google.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {},
				},
				'tok3n',
			);

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
						text: `> *Helsinki, FI, EU, Hetzner Online GmbH (AS24940)*
\`\`\`
Total: 7 ms
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

		it('should handle the command - http latency', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'http jsdelivr.com --latency',
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

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'http',
					target: 'jsdelivr.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {
						protocol: 'HTTP',
						request: {
							headers: {},
							host: 'jsdelivr.com',
							path: '/',
						},
					},
				},
				'tok3n',
			);

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
						text: `> *Chisinau, MD, EU, STARK INDUSTRIES SOLUTIONS LTD (AS44477)*
\`\`\`
Total: 161 ms
Download: 2 ms
First byte: 45 ms
DNS: 38 ms
TLS: 45 ms
TCP: 31 ms
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

		it('should return help text - empty command', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: '',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: expectedHelpTexts.general,
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);
			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);
		});

		it('should return help text - help command', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'help',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: expectedHelpTexts.general,
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);
			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);
		});

		it('should return help text - ping command', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'help ping',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: expectedHelpTexts.ping,
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);
			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);
		});

		it('should return help text - dns command', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'help dns',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: expectedHelpTexts.dns,
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);
			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);
		});

		it('should return help text - mtr command', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'help mtr',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: expectedHelpTexts.mtr,
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);
			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);
		});

		it('should return help text - http command', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'help http',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: expectedHelpTexts.http,
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);
			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);
		});

		it('should return help text - traceroute command', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'help traceroute',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: expectedHelpTexts.traceroute,
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);
			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);
		});

		it('should return help text - auth command', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'help auth',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: expectedHelpTexts.auth,
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);
			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);
		});

		it('should return help text - limits command', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'help limits',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
				text: expectedHelpTexts.limits,
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: undefined,
			});

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);
			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);
		});

		it('should return error message - wrong command', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'xyz',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);

			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledTimes(0);

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);

			expect(respondMock).toHaveBeenCalledWith({
				text: `Failed to process command \`xyz\`.
\`\`\`
Invalid argument "xyz" for "command"!
Expected "ping, traceroute, dns, mtr, http, auth, limits".
\`\`\`
Documentation and Support: https://github.com/jsdelivr/globalping`,
			});
		});

		it('should return error message - wrong ping flag', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'ping google.com --xyz',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledTimes(0);
			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);

			expect(respondMock).toHaveBeenCalledWith({
				text: `Failed to process command \`ping google.com --xyz\`.
\`\`\`
Invalid option "xyz" for "ping"!
Expected "packets, latency, target, from, limit, share".
\`\`\`
Documentation and Support: https://github.com/jsdelivr/globalping`,
			});
		});

		it('should return error message - wrong dns flag', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'dns google.com --xyz',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledTimes(0);
			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);

			expect(respondMock).toHaveBeenCalledWith({
				text: `Failed to process command \`dns google.com --xyz\`.
\`\`\`
Invalid option "xyz" for "dns"!
Expected "query, protocol, port, resolver, trace, latency, target, from, limit, share".
\`\`\`
Documentation and Support: https://github.com/jsdelivr/globalping`,
			});
		});

		it('should return error message - wrong mtr flag', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'mtr google.com --xyz',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledTimes(0);
			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);

			expect(respondMock).toHaveBeenCalledWith({
				text: `Failed to process command \`mtr google.com --xyz\`.
\`\`\`
Invalid option "xyz" for "mtr"!
Expected "protocol, port, packets, target, from, limit, share".
\`\`\`
Documentation and Support: https://github.com/jsdelivr/globalping`,
			});
		});

		it('should return error message - wrong traceroute flag', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'traceroute google.com --xyz',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledTimes(0);
			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);

			expect(respondMock).toHaveBeenCalledWith({
				text: `Failed to process command \`traceroute google.com --xyz\`.
\`\`\`
Invalid option "xyz" for "traceroute"!
Expected "protocol, port, target, from, limit, share".
\`\`\`
Documentation and Support: https://github.com/jsdelivr/globalping`,
			});
		});

		it('should return error message - wrong http flag', async () => {
			const payload = {
				channel_id: 'C07QAK46BGU',
				user_id: 'U07QAK46BGU',
				command: '/globalping',
				text: 'http google.com --xyz',
			} as SlashCommand;
			const context = {
				teamId: 'T07QAK46BGU',
			} as Context & StringIndexed;

			vi.spyOn(slackClientMock.conversations, 'info').mockResolvedValue({} as any);

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

			expect(oauthClientMock.GetToken).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledTimes(0);
			expect(postMeasurementMock).toHaveBeenCalledTimes(0);
			expect(getMeasurementMock).toHaveBeenCalledTimes(0);
			expect(slackClientMock.chat.postMessage).toHaveBeenCalledTimes(0);

			expect(respondMock).toHaveBeenCalledWith({
				text: `Failed to process command \`http google.com --xyz\`.
\`\`\`
Invalid option "xyz" for "http"!
Expected "protocol, port, resolver, method, path, query, host, header, latency, full, target, from, limit, share".
\`\`\`
Documentation and Support: https://github.com/jsdelivr/globalping`,
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
						text: `> *Amsterdam, NL, EU, Gigahost AS (AS56655)*
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
						text: `> *Amsterdam, NL, EU, Gigahost AS (AS56655)*
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
			const event = {};
			const context = {} as Context & StringIndexed;

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
			const context = {} as Context & StringIndexed;

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
