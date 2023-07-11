import { BufferedIncomingMessage, CustomRoute, HTTPModuleFunctions } from '@slack/bolt';
// import { client as discord } from 'discord-bot/src/app';
import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './utils';
import { v4 as uuidv4 } from 'uuid';

import * as database from './db';
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
				res.writeHead(301, {
					Location: 'https://www.jsdelivr.com/globalping'
				}).end();
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
				fs.createReadStream(path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/favicon.ico')).pipe(res);
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
				fs.createReadStream(path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/robots.txt')).pipe(res);
			} catch (error) {
				res.writeHead(503);
				res.write(JSON.stringify(error));
				res.end();
			}
		}
	},
	{
		path: '/github-bot',
		method: ['POST'],
		handler: async (_req, res) => {
			const reqId = uuidv4();
			const logData = { reqId };
			logger.info(logData, '/github-bot request');

			let bufferedReq: BufferedIncomingMessage;
			let body: any;

			// code based on https://github.com/slackapi/bolt-js/blob/0e827339a85804d868a7ddd7fdd4af9ec5b4e135/src/receivers/HTTPReceiver.ts#L416
			try {
				bufferedReq = await HTTPModuleFunctions.parseAndVerifyHTTPRequest(
					{
						enabled: false,
						signingSecret: "",
					},
					_req,
				);
			} catch (err) {
				const e = err as any;
				logger.error({ errorMsg: `Failed to parse the request body: ${e.message}`, ...logData }, '/github-bot failed');
				res.writeHead(401);
				res.write({ err: JSON.stringify(e.message) });
				res.end();
				return
			}

			try {
				body = HTTPModuleFunctions.parseHTTPRequestBody(bufferedReq);
			} catch (err) {
				const e = err as any;
				logger.error({ errorMsg: `Malformed request body: ${e.message}`, ...logData }, '/github-bot failed');
				res.writeHead(400);
				res.write({ err: JSON.stringify(e.message) });
				return;
			}

			try {
				logger.info({ reqBody: body, ...logData }, '/github-bot processing');

				res.writeHead(200);
				res.write(JSON.stringify(body));
				res.end();

				logger.info(logData, '/github-bot response - OK');
			} catch (err) {
				const e = err as any;
				logger.error({ errorMsg: `Request handling failed: ${e.message}`, ...logData }, '/github-bot failed');
				res.writeHead(503);
				res.write({ err: JSON.stringify(e.message) });
				res.end();

				return
			}
		}
	},
];

