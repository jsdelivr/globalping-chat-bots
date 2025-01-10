import { scopedLogger, initKnexClient } from '@globalping/bot-utils';
import { initBot } from 'github-bot';
import { initApp, CustomRoute } from 'slack-bot';
import { config } from './config.js';

import { faviconHandler, homeHandler, robotsHandler } from './handlers.js';

const knex = initKnexClient(config, './migrations');

const logger = scopedLogger('main');

const githubBot = initBot(config, scopedLogger('github'));

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

const app = initApp(config, knex, routes);

// Start the app
(async () => {
	logger.info('Running migrations');
	await knex.migrate.latest();
	logger.info('Migrations complete');

	// Start your app
	await app.start(config.port);

	if (config.env === 'production') {
		logger.info('Bots are online [PRODUCTION]');
	} else {
		logger.info('Bots are running! [DEVELOPMENT]');
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
