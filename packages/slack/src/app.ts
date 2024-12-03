/* eslint-disable no-await-in-loop */
import {
	errorParse,
	getMeasurement,
	postMeasurement,
} from '@globalping/bot-utils';
import { App, AppOptions, LogLevel } from '@slack/bolt';

import { initOAuthClient, oauth } from './auth.js';
import { config } from './config.js';
import { installationStore, knex } from './db.js';
import { routes } from './routes.js';
import { channelWelcome, logger } from './utils.js';
import { handleAppHomeMessagesOpened } from './welcome.js';
import { Bot } from './bot.js';

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
		setLevel: () => undefined,
		getLevel: () => logger.level as LogLevel,
		setName: () => undefined,
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

initOAuthClient(config, logger, installationStore, app.client);
const bot = new Bot(logger, oauth, postMeasurement, getMeasurement);

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
			say,
		);
	}
});

// Needed until this is resolved - https://github.com/slackapi/bolt-js/issues/1203
app.event('app_uninstalled', async ({ context }) => {
	// @ts-expect-error - They are pretty much the same type
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

app.command('/globalping', args => bot.HandleCommand(args));
app.command('/dns', args => bot.HandleCommand(args));
app.command('/http', args => bot.HandleCommand(args));
app.command('/mtr', args => bot.HandleCommand(args));
app.command('/ping', args => bot.HandleCommand(args));
app.command('/traceroute', args => bot.HandleCommand(args));
app.event('app_mention', args => bot.HandleMention(args));
app.event('message', args => bot.HandleMessage(args));


// Start the app
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

// Graceful shutdown
[
	'beforeExit',
	'uncaughtException',
	'unhandledRejection',
	'SIGINT',
	'SIGQUIT',
	'SIGILL',
	'SIGTERM',
].forEach((eventType) => {
	process.on(eventType, async () => {
		logger.info('Stopping app');
		await app.stop();
		logger.info('Closing database connection');
		await knex.destroy();
		logger.info('App stopped');
	});
});
