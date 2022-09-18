import { CustomRoute } from '@slack/bolt';
import { client as discord } from 'discord-bot/src/app';
import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as database from './db';
import { logger } from './utils';

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

				if (!discord.ws.ping)
					throw new Error('Discord bot down.');
				// logger.debug('Discord bot is accessible');

				res.writeHead(200);
				res.end('OK');
			} catch (error) {
				res.writeHead(503);
				res.end(error);
			}
		},
	},
	{
		path: '/',
		method: ['GET'],
		handler: async (_req, res) => {
			try {
				res.writeHead(301, {
					Location: 'https://www.jsdelivr.com/globalping'
				}).end();
			} catch (error) {
				res.writeHead(503);
				res.end(error);
			}
		},
	},
	{
		path: '/favicon.ico',
		method: ['GET'],
		handler: async (_req, res) => {
			try {
				res.setHeader('Content-Type', 'image/x-icon');
				fs.createReadStream(path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/favicon.ico')).pipe(res);
			} catch (error) {
				res.writeHead(503);
				res.end(error);
			}
		},
	},
];
