/* eslint-disable no-await-in-loop */
import { errorParse, formatAPIError, getAPIErrorMessage } from '@globalping/bot-utils';
import { App, LogLevel } from '@slack/bolt';
import * as dotenv from 'dotenv';

import * as database from './db';
import { parseCommandfromMention } from './mention';
import { routes } from './routes';
import { channelWelcome, logger, postAPI, welcome } from './utils';

dotenv.config();

if (!process.env.SLACK_SIGNING_SECRET || !process.env.SLACK_CLIENT_ID || !process.env.SLACK_CLIENT_SECRET || !process.env.SLACK_STATE_SECRET)
	throw new Error('SLACK_SIGNING_SECRET, SLACK_CLIENT_ID, SLACK_CLIENT_SECRET and SLACK_STATE_SECRET environment variable must be set for production');

if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_DATABASE)
	throw new Error('DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_DATABASE environment variable must be set for production');

// We run a discord instance in the slack express receiver
// if (!process.env.DISCORD_TOKEN && !process.env.DISCORD_APP_ID)
//	throw new Error('DISCORD_TOKEN and DISCORD_APP_ID environment variable must be set for production.');

const baseAppConfig = {
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	clientId: process.env.SLACK_CLIENT_ID,
	clientSecret: process.env.SLACK_CLIENT_SECRET,
	stateSecret: process.env.SLACK_STATE_SECRET,
	scopes: ['chat:write', 'chat:write.public', 'commands', 'channels:read', 'groups:read', 'im:read', 'mpim:read', 'im:write', 'im:history', 'users:read', 'app_mentions:read'],
	logLevel: LogLevel.INFO,
	logger: {
		debug: (...msgs: unknown[]) => { logger.debug(JSON.stringify(msgs)); },
		info: (...msgs: unknown[]) => { logger.info(JSON.stringify(msgs)); },
		warn: (...msgs: unknown[]) => { logger.warn(JSON.stringify(msgs)); },
		error: (...msgs: unknown[]) => {
			for (const msg of msgs) {
				logger.error(JSON.stringify(errorParse(msg as Error)));
			}
		},
		setLevel: () => { },
		getLevel: () => logger.level as LogLevel,
		setName: () => { },
	},
	installationStore: database.installationStore,
	installerOptions: {
		directInstall: true,
	},
	customRoutes: routes
};

let app: App;
if (process.env.NODE_ENV === 'production') {
	app = new App(baseAppConfig);
} else {
	baseAppConfig.logLevel = LogLevel.DEBUG;
	app = new App(baseAppConfig);
}

app.command('/globalping', async ({ payload, ack, client, respond }) => {
	const logData = { commandText: payload.text, teamDomain: payload.team_domain, channelName: payload.channel_name, userName: payload.user_name, triggerId: payload.trigger_id };
	logger.info(logData, '/globalping request');

	try {
		logger.info(logData, '/globalping ack');
		// Acknowledge command request
		await ack();
	}
	catch (error) {
		const err = (error as Error);
		logger.info({ errorMsg: err.message, ...logData }, '/globalping ack failed');
		await respond({ text: `Unable to acknowledge request.\n${formatAPIError(err.message)}` });
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { channel_id, user_id, channel_name, text: commandText } = payload;

	let channelConversationsInfo;
	// Check if channel is accessible just to be sure
	try {
		channelConversationsInfo = await client.conversations.info({ channel: channel_id });
	} catch (error) {
		const err = (error as Error);
		logger.info({ errorMsg: err.message, ...logData }, '/globalping channel info not available');
	}

	try {
		// If channel is not accessible, respond with errors
		if (!channelConversationsInfo) {
			// This is a user DM
			if (channel_name === 'directmessage' || channel_id.startsWith('D')) {
				logger.debug('Channel is a DM');
				const conversation = await client.conversations.open({ users: user_id });
				logger.debug(`Open conversation: ${JSON.stringify(conversation)}`);

				// If the DM is not the Globalping DM, we cancel the request
				if (conversation.channel?.id && channel_id !== conversation.channel.id) {
					logger.error({ errorMsg: 'request in dm', ...logData }, '/globalping response - dm');
					await respond({ text: 'Unable to run `/globalping` in a private DM! You can DM the Globalping App directly to run commands, or create a new group DM with the Globalping App to include multiple users.' });
				} else {
					throw new Error('Unable to open a DM with the Globalping App.');
				}
			} else if (channel_name.startsWith('mpdm-')) {
				logger.error({ errorMsg: 'request in mpdm', ...logData }, '/globalping response - mpdm');
				await respond({ text: 'Unable to run `/globalping` in a private DM! You can DM the Globalping App directly to run commands, or create a new group DM with the Globalping App to include multiple users.' });
			} else {
				// If not DM, try checking the properties of the channel
				logger.error({ errorMsg: 'asked for invite to channel', ...logData }, '/globalping response - channel invite needed');
				await respond('Please invite me to this channel to use this command. Run `/invite @Globalping` to invite me.');
			}
		} else {
			const channelPayload = { channel_id, user_id };
			logger.info(logData, '/globalping processing starting');
			await postAPI(client, channelPayload, commandText);
			logger.info(logData, '/globalping response - OK');
		}
	} catch (error) {
		const errorMsg = getAPIErrorMessage(error);
		logger.error({ errorMsg, ...logData }, '/globalping failed');
		await respond({ text: `Failed to process command \`${commandText}\`.\n${formatAPIError(errorMsg)}` });
	}
});

app.event('app_home_opened', async ({ context, event, say }) => {
	if (event.tab === 'messages') {
		logger.debug(`Opening messages tab for user ${event.user}`);
		// check the message history if there was a prior interaction for this App DM
		const history = await app.client.conversations.history({
			token: context.botToken,
			channel: event.channel,
			count: 1 // we only need to check if >=1 messages exist
		});
		// logger.debug(`History: ${JSON.stringify(history)}`);

		// if there was no prior interaction (= 0 messages), it's safe to send a welcome message
		if (history?.messages?.length === 0) {
			logger.debug('No prior interaction, sending welcome message');
			say({
				text: welcome(event.user)
			});
		}
	}
});

// Needed until this is resolved - https://github.com/slackapi/bolt-js/issues/1203
app.event('app_uninstalled', async ({ context }) => {
	// @ts-ignore - They are pretty much the same type
	await database.installationStore.deleteInstallation(context);
});


app.event('member_joined_channel', async ({ event, context, say }) => {
	logger.debug(`Member joined channel: ${JSON.stringify(event)}`);
	logger.debug(`Context: ${JSON.stringify(context)}`);
	if (event.user === context.botUserId) {
		logger.debug('Bot joined channel, sending welcome message');
		await say({
			text: channelWelcome
		});
	}

});

app.event('app_mention', async ({ payload, event, context, client }) => {
	let { botUserId } = context;
	if (botUserId === undefined) {
		botUserId = '';
	}
	const fullText = payload.text;
	const eventTs = payload.event_ts;
	const teamId = event.team;
	const channelId = event.channel;
	const threadTs = event.thread_ts;
	let userId = event.user;

	if (userId === undefined) {
		userId = '';
	}

	const logData = { fullText, teamId, channelId, userId, eventTs, threadTs };
	logger.info(logData, '@globalping request');

	const commandText = parseCommandfromMention(fullText, botUserId);

	try {
		// the mention is always received in a channel where the bot is a member
		const channelPayload = { channel_id: channelId, user_id: userId, thread_ts: threadTs };
		logger.info({ commandText, ...logData }, '@globalping processing starting');
		await postAPI(client, channelPayload, commandText);
		logger.info(logData, '@globalping response - OK');
	} catch (error) {
		const errorMsg = getAPIErrorMessage(error);
		logger.error({ errorMsg, ...logData }, '@globalping failed');
		await client.chat.postMessage({ channel: channelId, thread_ts: threadTs, text: `Failed to process command \`${commandText}\`.\n${formatAPIError(errorMsg)}` });
	}
});


// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	// Moved here due to top-level await restrictions
	if (process.env.NODE_ENV === 'production' && !(await database.checkTables()))
		throw new Error('"installations" table does not exist in database! Run "pnpm run setup-db" to create the necessary table.');

	// Start your app
	await app.start(Number(process.env.PORT) || 3000);
	if (process.env.NODE_ENV === 'production') {
		logger.info('Slack bot is online [PRODUCTION]');
	} else {
		logger.info('⚡️ Bolt app is running! [DEVELOPMENT]');
	}
})();
