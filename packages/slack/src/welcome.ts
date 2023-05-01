import { SayFn } from '@slack/bolt';
import { WebClient } from '@slack/web-api';

import { logger, welcome } from './utils';


const welcomeMap: Record<string, boolean> = {};


const welcomeMapTimeout = 10_000;

function welcomeMapKey(teamId: string | undefined, user: string): string {
    return `team:${teamId}-user:${user}`;
}

function markWelcomeSent(teamId: string | undefined, user: string) {
    welcomeMap[welcomeMapKey(teamId, user)] = true;

    // delete from the map after timout as the message should be in the slack history by then
    setTimeout(() => {
        delete welcomeMap[welcomeMapKey(teamId, user)];
    }, welcomeMapTimeout);
}

function welcomeSent(teamId: string | undefined, user: string): boolean {
    return welcomeMap[welcomeMapKey(teamId, user)];
}

export async function handleAppHomeMessagesOpened(client: WebClient, user: string, botToken: string | undefined, channel: string, eventTs: string | undefined, teamId: string | undefined, say: SayFn) {
    const logData = { teamId, user, eventTs };

    logger.info(logData, 'app home messages tab open');

    if (welcomeSent(teamId, user)) {
        logger.info(logData, 'not sending welcome message, record present');
        return;
    }

    const history = await client.conversations.history({
        token: botToken,
        channel,
        count: 1 // we only need to check if >=1 messages exist
    });

    const historyLength = history?.messages?.length;
    if (historyLength !== undefined && historyLength > 0) {
        logger.info(logData, 'not sending welcome message, history present');
        return;
    }

    // no previous messages
    markWelcomeSent(teamId, user);
    logger.info(logData, 'sending welcome message');
    await say({
        text: welcome(user)
    });
}