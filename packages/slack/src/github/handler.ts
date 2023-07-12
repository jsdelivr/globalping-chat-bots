
import { ParamsIncomingMessage } from '@slack/bolt/dist/receivers/ParamsIncomingMessage';
import { IncomingMessage, ServerResponse } from 'node:http';
import getRawBody from 'raw-body';
import { v4 as uuidv4 } from 'uuid';

import { logger } from '../utils';
import { handleGithubMention } from './mention';
import { GithubNotificationRequest } from './types';

export async function githubHandler(req: ParamsIncomingMessage, res: ServerResponse<IncomingMessage>) {
    const reqId = uuidv4();
    const logData = { reqId };
    logger.info(logData, '/github-bot request');

    if (req.headers['api-key'] !== process.env.GITHUB_BOT_API_KEY) {
        res.writeHead(401);
        res.write(JSON.stringify({ err: 'Invalid API Key' }));
        res.end();
        return;
    }

    let ghRequest: GithubNotificationRequest;

    try {
        const rawBody = await getRawBody(req);
        ghRequest = JSON.parse(rawBody.toString());
    } catch (error) {
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        const e = error as any;
        logger.error({ errorMsg: `Failed to parse the request body: ${e.message}`, ...logData }, '/github-bot failed');
        res.writeHead(400);
        res.write(JSON.stringify({ err: e.message }));
        res.end();
        return;
    }

    try {
        logger.info({ ghRequest, ...logData }, '/github-bot processing');

        const e = await handleGithubMention(reqId, ghRequest);
        if (e !== undefined) {
            res.writeHead(400);
            res.write(JSON.stringify({ err: e.message }));
            res.end();
            return;
        }

        res.writeHead(200);
        res.write(JSON.stringify({}));
        res.end();

        logger.info(logData, '/github-bot response - OK');
    } catch (error) {
        /* eslint-disable  @typescript-eslint/no-explicit-any */
        const e = error as any;
        logger.error({ errorMsg: `Request handling failed: ${e.message}`, ...logData }, '/github-bot failed');
        res.writeHead(500);
        res.write(JSON.stringify({ err: e.message }));
        res.end();

    }
}