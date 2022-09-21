/* eslint-disable no-await-in-loop */
import { errorParse, formatAPIError, welcome } from '@globalping/bot-utils';
import { channelWelcome } from '@globalping/bot-utils/src/utils';
import { App, LogLevel } from '@slack/bolt';
import * as dotenv from 'dotenv';

import * as database from './db';
import { routes } from './routes';
import { logger, postAPI } from './utils';

dotenv.config();

if (!process.env.SLACK_SIGNING_SECRET || !process.env.SLACK_CLIENT_ID || !process.env.SLACK_CLIENT_SECRET || !process.env.SLACK_STATE_SECRET)
	throw new Error('SLACK_SIGNING_SECRET, SLACK_CLIENT_ID, SLACK_CLIENT_SECRET and SLACK_STATE_SECRET environment variable must be set for production');

if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_DATABASE)
	throw new Error('DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_DATABASE environment variable must be set for production');

// We run a discord instance in the slack express receiver
if (!process.env.DISCORD_TOKEN && !process.env.DISCORD_APP_ID)
	throw new Error('DISCORD_TOKEN and DISCORD_APP_ID environment variable must be set for production.');

const baseAppConfig = {
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	clientId: process.env.SLACK_CLIENT_ID,
	clientSecret: process.env.SLACK_CLIENT_SECRET,
	stateSecret: process.env.SLACK_STATE_SECRET,
	scopes: ['chat:write', 'chat:write.public', 'commands', 'channels:read', 'groups:read', 'im:read', 'mpim:read', 'im:write', 'im:history', 'users:read'],
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

app.command('/globalping', async ({ payload, command, ack, client, respond }) => {
	try {
		// Acknowledge command request
		await ack();
		logger.debug(`Calling command ${command.text} with payload: ${JSON.stringify(payload)}`);

		// eslint-disable-next-line @typescript-eslint/naming-convention
		const { channel_id, user_id, channel_name } = payload;

		let info;
		// Check if channel is accessible just to be sure
		try {
			info = await client.conversations.info({ channel: channel_id });
			logger.debug(`Channel info: ${JSON.stringify(info)}`);
		} catch (error) {
			logger.debug(`Channel info not accessible: ${JSON.stringify(error)}`);
			// Continue
		}

		// If channel is not accessible, respond with errors
		if (!info) {
			// This is a user DM
			if (channel_name === 'directmessage' || channel_id.startsWith('D')) {
				logger.debug('Channel is a DM');
				const conversation = await client.conversations.open({ users: user_id });
				logger.debug(`Open conversation: ${JSON.stringify(conversation)}`);

				// If the DM is not the Globalping DM, we cancel the request
				if (conversation.channel?.id && channel_id !== conversation.channel.id) {
					await respond({ text: 'Unable to run `/globalping` in a private DM! You can DM the Globalping App directly to run commands, or create a new group DM with the Globalping App to include multiple users.' });
				} else {
					throw new Error('Unable to open a DM with the Globalping App.');
				}
			} else if (channel_name.startsWith('mpdm-')) {
				logger.debug('Channel is mpdm');
				await respond({ text: 'Unable to run `/globalping` in a private DM! You can DM the Globalping App directly to run commands, or create a new group DM with the Globalping App to include multiple users.' });
			} else {
				// If not DM, try checking the properties of the channel
				logger.debug('Could not get channel info, assuming private channel');
				await respond('Please invite me to this channel to use this command. Run `/invite @Globalping` to invite me.');
			}
		} else {
			const channelPayload = { channel_id, user_id };
			await postAPI(client, channelPayload, command.text);
		}
	} catch (error) {
		await respond({ text: `Unable to successfully process command \`${command.text}\`.\n${formatAPIError(error)}` });
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
