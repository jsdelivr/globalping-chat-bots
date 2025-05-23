import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scopedLogger, initKnexClient } from '@globalping/bot-utils';
import { initBot as initGithubBot } from 'github-bot';
import { initBot as initDiscordBot } from 'discord-bot';
import { initApp, CustomRoute } from 'slack-bot';
import { config } from './config.js';

import { faviconHandler, homeHandler, robotsHandler } from './handlers.js';

const migrationsPath = path.join(
	path.dirname(fileURLToPath(import.meta.url).replace('/dist/', '/')),
	'../migrations',
);
const knex = initKnexClient(config, migrationsPath);

const logger = scopedLogger('main');

const routes: CustomRoute[] = [
	{
		path: '/',
		method: [ 'GET' ],
		handler: homeHandler,
	},
	{
		path: '/favicon.ico',
		method: [ 'GET' ],
		handler: faviconHandler,
	},
	{
		path: '/robots.txt',
		method: [ 'GET' ],
		handler: robotsHandler,
	},
	{
		path: '/github-bot',
		method: [ 'POST' ],
		handler: (req, res) => githubBot.HandleRequest(req, res),
	},
	{
		path: '/discord/install',
		method: [ 'GET' ],
		handler: (_req, res) => {
			res
				.writeHead(302, {
					Location:
						'https://discord.com/api/oauth2/authorize?client_id='
						+ config.discordAppId,
				})
				.end();
		},
	},
	{
		path: '/health',
		method: [ 'GET' ],
		handler: async (_req, res) => {
			try {
				// Check if db is accessible
				await knex.raw('select 1+1 as result');

				res.writeHead(200);
				res.write('OK');
				res.end();
			} catch (error) {
				res.writeHead(503);
				res.write(JSON.stringify(error));
				res.end();
			}
		},
	},
];

const githubBot = initGithubBot(
	{
		globalpingToken: config.globalpingToken,
		githubPersonalAccessToken: config.githubPersonalAccessToken,
		githubBotApiKey: config.githubBotApiKey,
		githubBotHandle: config.githubBotHandle,
	},
	scopedLogger('github'),
);
const discordBot = initDiscordBot(
	{
		serverHost: config.serverHost,
		apiUrl: config.apiUrl,
		dashboardUrl: config.dashboardUrl,
		authUrl: config.authUrl,
		authClientId: config.authDiscordClientId,
		authClientSecret: config.authDiscordClientSecret,
		authCallbackPath: '/discord/oauth/callback',
	},
	scopedLogger('discord'),
	knex,
	routes,
);
const app = initApp(
	{
		env: config.env,

		serverHost: config.serverHost,
		apiUrl: config.apiUrl,
		dashboardUrl: config.dashboardUrl,
		authUrl: config.authUrl,
		authClientId: config.authClientId,
		authClientSecret: config.authClientSecret,
		authCallbackPath: '/slack/oauth/callback',

		slackSigningSecret: config.slackSigningSecret,
		slackClientId: config.slackClientId,
		slackClientSecret: config.slackClientSecret,
		slackStateSecret: config.slackStateSecret,
		slackSocketMode: config.slackSocketMode,
		slackAppToken: config.slackAppToken,
	},
	scopedLogger('slack'),
	knex,
	routes,
);

// Start the app
(async () => {
	try {
		logger.info('Running migrations');
		await knex.migrate.latest();
		logger.info('Migrations complete');
	} catch (error) {
		logger.error('Migrations failed', error);
		process.exit(1);
	}

	try {
		await app.start(config.port);
		logger.info('Slack and Github bots are online', { env: config.env });
	} catch (error) {
		logger.error('App failed to start', error);
		process.exit(1);
	}

	try {
		await discordBot.login(config.discordToken);
	} catch (error) {
		logger.error('Discord bot failed to start', error);
		process.exit(1);
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
	process.on(eventType, async (arg0) => {
		logger.info(`Stopping app (${eventType})`, arg0);
		await app.stop();
		logger.info('Closing database connection');
		await knex.destroy();
		logger.info('App stopped');

		logger.info('Closing Discord bot');
		await discordBot.destroy();
		logger.info('Discord bot closed');
	});
});
