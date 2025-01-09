import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IncomingMessage, ServerResponse } from 'node:http';

export async function homeHandler (_req: IncomingMessage, res: ServerResponse) {
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
}

export async function faviconHandler (
	_req: IncomingMessage,
	res: ServerResponse,
) {
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
}

export async function robotsHandler (
	_req: IncomingMessage,
	res: ServerResponse,
) {
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
}
