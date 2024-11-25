import { formatAPIError, getAPIErrorMessage } from '@globalping/bot-utils';
import { WebClient } from '@slack/web-api';

import { postAPI } from './post.js';
import { logger } from './utils.js';

export function parseCommandfromMention (
	text: string,
	botUserId: string,
): string {
	const botMention = '<@' + botUserId + '>';
	const mentionIndex = text.indexOf(botMention);

	if (mentionIndex === -1) {
		return text;
	}

	return text.slice(mentionIndex + botMention.length).trim();
}

export async function handleMention (
	fullText: string,
	teamId: string | undefined,
	channelId: string,
	userId: string,
	eventTs: string,
	threadTs: string | undefined,
	installationId: string,
	botUserId: string,
	client: WebClient,
) {
	const logData = { fullText, teamId, channelId, userId, eventTs, threadTs };
	logger.info(logData, '@globalping request');

	const commandText = parseCommandfromMention(fullText, botUserId);

	try {
		// the mention is always received in a channel where the bot is a member
		const channelPayload = {
			channel_id: channelId,
			user_id: userId,
			thread_ts: threadTs,
			installationId,
		};
		logger.info({ commandText, ...logData }, '@globalping processing starting');
		await postAPI(client, channelPayload, commandText);
		logger.info(logData, '@globalping response - OK');
	} catch (error) {
		const errorMsg = getAPIErrorMessage(error);
		logger.error({ errorMsg, ...logData }, '@globalping failed');

		await client.chat.postMessage({
			channel: channelId,
			thread_ts: threadTs,
			text: `Failed to process command \`${commandText}\`.\n${formatAPIError(errorMsg)}`,
		});
	}
}
