import {
	getMeasurement,
	KnexClient,
	postMeasurement,
	Logger,
	OAuthClient,
} from '@globalping/bot-utils';
import bolt, { type App, AppOptions, CustomRoute, LogLevel } from '@slack/bolt';

import { Bot } from './bot.js';
import { DBClient } from './db.js';
import { Config } from './types.js';

export function initApp (
	config: Config,
	logger: Logger,
	knex: KnexClient,
	routes: CustomRoute[],
): App {
	const db = new DBClient(knex, logger);

	const oauth = new OAuthClient(config, logger, db);

	const bot = new Bot(
		logger,
		config,
		db,
		oauth,
		postMeasurement,
		getMeasurement,
	);
	routes.push({
		path: config.authCallbackPath,
		method: [ 'GET' ],
		handler: (req, res) => bot.OnAuthCallback(req, res),
	});

	const logMessages = (log: Logger['info'], messages: unknown[]) => {
		for (const message of messages) {
			if (typeof message === 'string') {
				log(message);
			} else {
				log('Context:', message);
			}
		}
	};

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
				logMessages(logger.debug.bind(logger), msgs);
			},
			info: (...msgs: unknown[]) => {
				logMessages(logger.info.bind(logger), msgs);
			},
			warn: (...msgs: unknown[]) => {
				logMessages(logger.warn.bind(logger), msgs);
			},
			error: (...msgs: unknown[]) => {
				logMessages(logger.error.bind(logger), msgs);
			},
			setLevel: () => undefined,
			getLevel: () => Logger.levelsByValue[logger.writers[0]!.level] as LogLevel,
			setName: () => undefined,
		},
		installationStore: db,
		installerOptions: {
			directInstall: true,
		},
		customRoutes: routes,
	};

	const app: App = new bolt.App(baseAppConfig);
	bot.SetSlackClient(app.client);

	if (config.env !== 'production') {
		baseAppConfig.logLevel = LogLevel.DEBUG;
	}

	app.event('app_home_opened', args => bot.HandleHomeOpened(args));
	// Needed until this is resolved - https://github.com/slackapi/bolt-js/issues/1203
	app.event('app_uninstalled', args => bot.HandleUninstalled(args));

	app.event('member_joined_channel', args => bot.HandleMemberJoinedChannel(args));

	app.command('/globalping', args => bot.HandleCommand(args));
	app.command('/dns', args => bot.HandleCommand(args));
	app.command('/http', args => bot.HandleCommand(args));
	app.command('/mtr', args => bot.HandleCommand(args));
	app.command('/ping', args => bot.HandleCommand(args));
	app.command('/traceroute', args => bot.HandleCommand(args));
	app.event('app_mention', args => bot.HandleMention(args));
	app.event('message', args => bot.HandleMessage(args));

	return app;
}
