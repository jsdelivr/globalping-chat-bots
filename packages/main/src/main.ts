import { scopedLogger, initKnexClient } from '@globalping/bot-utils';
import { initBot as initGithubBot } from 'github-bot';
import { initBot as initDiscordBot } from 'discord-bot';
import { initApp, CustomRoute } from 'slack-bot';
import { config } from './config.js';

import { faviconHandler, homeHandler, robotsHandler } from './handlers.js';

const knex = initKnexClient(config, './migrations');

const logger = scopedLogger('main');

const githubBot = initGithubBot(config, scopedLogger('github'));
const discordBot = initDiscordBot(scopedLogger('discord'));

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
			try {
				res
					.writeHead(302, {
						Location:
							'https://discord.com/api/oauth2/authorize?client_id='
							+ config.discordClientId,
					})
					.end();
			} catch (error) {
				res.writeHead(503);
				res.write('Failed to redirect to Discord\'s OAuth page');
				res.end();
			}
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

const app = initApp(config, scopedLogger('slack'), knex, routes);

// Start the app
(async () => {
	logger.info('Running migrations');
	await knex.migrate.latest();
	logger.info('Migrations complete');

	// Start your app
	await app.start(config.port);
	logger.info('Slack and Github bots are online', { env: config.env });

	try {
		await discordBot.login(config.discordToken);
	} catch (error) {
		logger.error('Discord bot failed to start', error);
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

		logger.info('Closing Discord bot');
		await discordBot.destroy();
		logger.info('Discord bot closed');
	});
});
