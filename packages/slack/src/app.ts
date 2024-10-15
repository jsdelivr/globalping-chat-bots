/* eslint-disable no-await-in-loop */
import {
	errorParse,
	formatAPIError,
	getAPIErrorMessage,
} from '@globalping/bot-utils';
import { App, AppOptions, GenericMessageEvent, LogLevel } from '@slack/bolt';

import { initOAuthClient } from './auth';
import { config } from './config';
import { installationStore, knex, userStore } from './db';
import { handleMention } from './mention';
import { postAPI } from './post';
import { routes } from './routes';
import { channelWelcome, getInstallationId, logger } from './utils';
import { handleAppHomeMessagesOpened } from './welcome';

const baseAppConfig: AppOptions = {
	signingSecret: config.slackSigningSecret,
	clientId: config.slackClientId,
	clientSecret: config.slackClientSecret,
	stateSecret: config.slackStateSecret,
	socketMode: config.slackSocketMode,
	appToken: config.slackAppToken,
	scopes: [
		'chat:write',
		'chat:write.public',
		'commands',
		'channels:read',
		'groups:read',
		'im:read',
		'mpim:read',
		'im:write',
		'im:history',
		'users:read',
		'app_mentions:read',
	],
	logLevel: LogLevel.INFO,
	logger: {
		debug: (...msgs: unknown[]) => {
			logger.debug(JSON.stringify(msgs));
		},
		info: (...msgs: unknown[]) => {
			logger.info(JSON.stringify(msgs));
		},
		warn: (...msgs: unknown[]) => {
			logger.warn(JSON.stringify(msgs));
		},
		error: (...msgs: unknown[]) => {
			for (const msg of msgs) {
				logger.error(JSON.stringify(errorParse(msg as Error)));
			}
		},
		setLevel: () => {},
		getLevel: () => logger.level as LogLevel,
		setName: () => {},
	},
	installationStore,
	installerOptions: {
		directInstall: true,
	},
	customRoutes: routes,
};

const app: App = new App(baseAppConfig);
if (config.env !== 'production') {
	baseAppConfig.logLevel = LogLevel.DEBUG;
}

initOAuthClient(config, logger, userStore, app.client);

app.command('/globalping', async ({ payload, ack, client, respond }) => {
	const logData = {
		commandText: payload.text,
		teamDomain: payload.team_domain,
		channelName: payload.channel_name,
		userName: payload.user_name,
		triggerId: payload.trigger_id,
	};
	logger.info(logData, '/globalping request');

	try {
		logger.info(logData, '/globalping ack');
		// Acknowledge command request
		await ack();
	} catch (error) {
		const err = error as Error;
		logger.info(
			{ errorMsg: err.message, ...logData },
			'/globalping ack failed'
		);
		await respond({
			text: `Unable to acknowledge request.\n${formatAPIError(err.message)}`,
		});
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { channel_id, user_id, channel_name, text: commandText } = payload;

	let channelConversationsInfo;
	// Check if channel is accessible just to be sure
	try {
		channelConversationsInfo = await client.conversations.info({
			channel: channel_id,
		});
	} catch (error) {
		const err = error as Error;
		logger.info(
			{ errorMsg: err.message, ...logData },
			'/globalping channel info not available'
		);
	}

	try {
		// If channel is not accessible, respond with errors
		if (!channelConversationsInfo) {
			// This is a user DM
			if (channel_name === 'directmessage' || channel_id.startsWith('D')) {
				logger.debug('Channel is a DM');
				const conversation = await client.conversations.open({
					users: user_id,
				});
				logger.debug(`Open conversation: ${JSON.stringify(conversation)}`);

				// If the DM is not the Globalping DM, we cancel the request
				if (
					conversation.channel?.id &&
					channel_id !== conversation.channel.id
				) {
					logger.error(
						{ errorMsg: 'request in dm', ...logData },
						'/globalping response - dm'
					);
					await respond({
						text: 'Unable to run `/globalping` in a private DM! You can DM the Globalping App directly to run commands, or create a new group DM with the Globalping App to include multiple users.',
					});
				} else {
					throw new Error('Unable to open a DM with the Globalping App.');
				}
			} else if (channel_name.startsWith('mpdm-')) {
				logger.error(
					{ errorMsg: 'request in mpdm', ...logData },
					'/globalping response - mpdm'
				);
				await respond({
					text: 'Unable to run `/globalping` in a private DM! You can DM the Globalping App directly to run commands, or create a new group DM with the Globalping App to include multiple users.',
				});
			} else {
				// If not DM, try checking the properties of the channel
				logger.error(
					{ errorMsg: 'asked for invite to channel', ...logData },
					'/globalping response - channel invite needed'
				);
				await respond(
					'Please invite me to this channel to use this command. Run `/invite @Globalping` to invite me.'
				);
			}
		} else {
			const channelPayload = {
				channel_id,
				user_id,
				installationId: getInstallationId({
					isEnterpriseInstall: payload.is_enterprise_install === 'true',
					enterpriseId: payload.enterprise_id,
					teamId: payload.team_id,
				}),
			};
			logger.info(logData, '/globalping processing starting');
			await postAPI(client, channelPayload, commandText);
			logger.info(logData, '/globalping response - OK');
		}
	} catch (error) {
		const errorMsg = getAPIErrorMessage(error);
		logger.error({ errorMsg, ...logData }, '/globalping failed');
		await respond({
			text: `Failed to process command \`${commandText}\`.\n${formatAPIError(
				errorMsg
			)}`,
		});
	}
});

app.event('app_home_opened', async ({ context, event, say, client }) => {
	if (event.tab === 'messages') {
		const { botToken, teamId } = context;
		const { user, channel, event_ts: eventTs } = event;

		handleAppHomeMessagesOpened(
			client,
			user,
			botToken,
			channel,
			eventTs,
			teamId,
			say
		);
	}
});

// Needed until this is resolved - https://github.com/slackapi/bolt-js/issues/1203
app.event('app_uninstalled', async ({ context }) => {
	// @ts-ignore - They are pretty much the same type
	await installationStore.deleteInstallation(context);
});

app.event('member_joined_channel', async ({ event, context, say }) => {
	logger.debug(`Member joined channel: ${JSON.stringify(event)}`);
	logger.debug(`Context: ${JSON.stringify(context)}`);
	if (event.user === context.botUserId) {
		logger.debug('Bot joined channel, sending welcome message');
		await say({
			text: channelWelcome,
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
	const installationId = getInstallationId(context);

	if (userId === undefined) {
		userId = '';
	}

	await handleMention(
		fullText,
		teamId,
		channelId,
		userId,
		eventTs,
		threadTs,
		installationId,
		botUserId,
		client
	);
});

app.event('message', async ({ payload, event, context, client }) => {
	// Filter im events
	if (event.channel_type !== 'im') {
		return;
	}

	const messageEvent = event as GenericMessageEvent;

	let { botUserId } = context;
	if (botUserId === undefined) {
		botUserId = '';
	}
	let fullText = messageEvent.text;
	const eventTs = payload.event_ts;
	const teamId = messageEvent.team;
	const channelId = event.channel;
	const threadTs = messageEvent.thread_ts;
	let userId = messageEvent.user;
	const installationId = getInstallationId(context);

	if (userId === undefined) {
		userId = '';
	}

	if (fullText === undefined) {
		fullText = '';
	}
	await handleMention(
		fullText,
		teamId,
		channelId,
		userId,
		eventTs,
		threadTs,
		installationId,
		botUserId,
		client
	);
});

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	logger.info('Running migrations');
	await knex.migrate.latest();
	logger.info('Migrations complete');

	// Start your app
	await app.start(config.port);
	if (config.env === 'production') {
		logger.info('Slack bot is online [PRODUCTION]');
	} else {
		logger.info('⚡️ Bolt app is running! [DEVELOPMENT]');
	}
})();
