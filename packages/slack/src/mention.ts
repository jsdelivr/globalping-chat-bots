import { formatAPIError, getAPIErrorMessage } from '@globalping/bot-utils';
import { WebClient } from '@slack/web-api';

import { postAPI } from './post';
import { logger } from './utils';

export function parseCommandfromMention(
	text: string,
	botUserId: string
): string {
	const trimmedText = text.trim();
	const expectedMention = `<@${botUserId}>`;
	if (trimmedText.startsWith(expectedMention)) {
		const urlRegex = /<([^>|]+)(?:\|([^>]+))?>/g;

		return trimmedText
			.slice(expectedMention.length)
			.replace(urlRegex, (_, link, urlText) => urlText || link)
			.trim();
	}

	return '';
}

export async function handleMention(
	fullText: string,
	teamId: string | undefined,
	channelId: string,
	userId: string,
	eventTs: string,
	threadTs: string | undefined,
	installationId: string,
	botUserId: string,
	client: WebClient
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
			text: `Failed to process command \`${commandText}\`.\n${formatAPIError(
				errorMsg
			)}`,
		});
	}
}
