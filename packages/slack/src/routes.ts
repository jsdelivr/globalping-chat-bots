import { CustomRoute } from '@slack/bolt';
import { ParamsIncomingMessage } from '@slack/bolt/dist/receivers/ParamsIncomingMessage.js';
import * as fs from 'node:fs';
import { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CALLBACK_PATH, oauth } from './auth.js';
import { knex } from './db.js';
import { githubHandler } from './github/handler.js';

export const routes: CustomRoute[] = [
	{
		path: '/health',
		method: [ 'GET' ],
		handler: async (_req, res) => {
			try {
				// Check if db is accessible
				await knex.raw('select 1+1 as result');
				// logger.debug('Database is accessible');

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
		method: [ 'GET' ],
		handler: async (_req, res) => {
			try {
				res
					.writeHead(301, {
						Location: 'https://globalping.io',
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
		method: [ 'GET' ],
		handler: async (_req, res) => {
			try {
				res.setHeader('Content-Type', 'image/x-icon');

				fs.createReadStream(path.join(
					path.dirname(fileURLToPath(import.meta.url)),
					'../public/favicon.ico',
				)).pipe(res);
			} catch (error) {
				res.writeHead(503);
				res.write(JSON.stringify(error));
				res.end();
			}
		},
	},
	{
		path: '/robots.txt',
		method: [ 'GET' ],
		handler: async (_req, res) => {
			try {
				res.setHeader('Content-Type', 'text/plain');

				fs.createReadStream(path.join(
					path.dirname(fileURLToPath(import.meta.url)),
					'../public/robots.txt',
				)).pipe(res);
			} catch (error) {
				res.writeHead(503);
				res.write(JSON.stringify(error));
				res.end();
			}
		},
	},
	{
		path: '/github-bot',
		method: [ 'POST' ],
		handler: githubHandler,
	},
	{
		path: CALLBACK_PATH,
		method: [ 'GET' ],
		handler: (
			req: ParamsIncomingMessage,
			res: ServerResponse<IncomingMessage>,
		) => oauth.OnCallback(req, res),
	},
];
