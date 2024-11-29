import { formatAPIError, getAPIErrorMessage } from '@globalping/bot-utils';
import { Block, KnownBlock, RichTextBlockElement, WebClient } from '@slack/web-api';

import { postAPI } from './post.js';
import { logger } from './utils.js';

export function getRawTextFromBlocks (
	botUserId: string,
	blocks?: (KnownBlock | Block)[],
): string {
	if (!blocks) {
		return '';
	}

	let text = '';
	traverseBlocks(blocks, (block) => {
		if (block.type === 'user' && 'user_id' in block && block.user_id === botUserId) {
			// ignore text before the bot mention
			text = '';
		} else if ('text' in block && typeof block.text === 'string') {
			if ((block.text as string).trim()) {
				text += block.text;
			}
		}
	});

	return text.trim();
}

function traverseBlocks (blocks: (KnownBlock | Block)[], callback: (block: KnownBlock | Block | RichTextBlockElement) => void) {
	for (const block of blocks) {
		if ('text' in block || block.type === 'user') {
			callback(block);
		}

		if ('elements' in block) {
			traverseBlocks(block.elements, callback);
		}
	}
}

export async function handleMention (
	fullText: string,
	teamId: string | undefined,
	channelId: string,
	userId: string,
	eventTs: string,
	threadTs: string | undefined,
	installationId: string,
	client: WebClient,
) {
	const logData = { fullText, teamId, channelId, userId, eventTs, threadTs };
	logger.info(logData, '@globalping request');

	try {
		// the mention is always received in a channel where the bot is a member
		const channelPayload = {
			channel_id: channelId,
			user_id: userId,
			thread_ts: threadTs,
			installationId,
		};
		logger.info(logData, '@globalping processing starting');
		await postAPI(client, channelPayload, fullText);
		logger.info(logData, '@globalping response - OK');
	} catch (error) {
		const errorMsg = getAPIErrorMessage(error);
		logger.error({ errorMsg, ...logData }, '@globalping failed');

		await client.chat.postMessage({
			channel: channelId,
			thread_ts: threadTs,
			text: `Failed to process command \`${fullText}\`.\n${formatAPIError(errorMsg)}`,
		});
	}
}
