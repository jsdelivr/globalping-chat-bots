import { CustomRoute } from '@slack/bolt';
// import { client as discord } from 'discord-bot/src/app';
import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as database from './db';
import { githubHandler } from './github/handler';
// import { logger } from './utils';

export const routes: CustomRoute[] = [
	{
		path: '/health',
		method: ['GET'],
		handler: async (_req, res) => {
			try {
				// Check if db is accessible
				await database.knex.raw('select 1+1 as result');
				// logger.debug('Database is accessible');

				if (!(await database.checkTables()))
					throw new Error('Tables not found');
				// logger.debug('Tables are accessible');

				/*	if (!discord.ws.ping)
						throw new Error('Discord bot down.'); */
				// logger.debug('Discord bot is accessible');

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
	{
		path: '/',
		method: ['GET'],
		handler: async (_req, res) => {
			try {
				res
					.writeHead(301, {
						Location: 'https://www.jsdelivr.com/globalping',
					})
					.end();
			} catch (error) {
				res.writeHead(503);
				res.write(JSON.stringify(error));
				res.end();
			}
		},
	},
	{
		path: '/favicon.ico',
		method: ['GET'],
		handler: async (_req, res) => {
			try {
				res.setHeader('Content-Type', 'image/x-icon');
				fs.createReadStream(
					path.join(
						path.dirname(fileURLToPath(import.meta.url)),
						'../public/favicon.ico'
					)
				).pipe(res);
			} catch (error) {
				res.writeHead(503);
				res.write(JSON.stringify(error));
				res.end();
			}
		},
	},
	{
		path: '/robots.txt',
		method: ['GET'],
		handler: async (_req, res) => {
			try {
				res.setHeader('Content-Type', 'text/plain');
				fs.createReadStream(
					path.join(
						path.dirname(fileURLToPath(import.meta.url)),
						'../public/robots.txt'
					)
				).pipe(res);
			} catch (error) {
				res.writeHead(503);
				res.write(JSON.stringify(error));
				res.end();
			}
		},
	},
	{
		path: '/github-bot',
		method: ['POST'],
		handler: githubHandler,
	},
];
