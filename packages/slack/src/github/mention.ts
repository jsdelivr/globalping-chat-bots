import { remark } from 'remark';
import strip from 'strip-markdown';

import { logger } from '../utils.js';
import { githubHandle } from './common.js';
import { processCommand } from './processing.js';
import {
	GithubNotificationRequest,
	GithubTarget,
	GithubTargetType,
} from './types.js';

export async function handleGithubMention (
	reqId: string,
	ghRequest: GithubNotificationRequest,
): Promise<Error | undefined> {
	const logData = { reqId };

	const fullText = ghRequest.bodyPlain;

	const parts = splitMessageFooter(fullText);

	if (parts.length === 0) {
		const err = new Error('Not a valid notification email');
		// not a valid notification email, do nothing
		logger.info(logData, `/github-bot - ${err.message} - Skipping`);
		return err;
	}

	const [ message, footer ] = parts;

	if (!isMentionNotification(footer)) {
		const err = new Error('Not a mention notification');
		// not a mention, do nothing
		logger.info(logData, `/github-bot - ${err.message} - Skipping`);
		return err;
	}

	let commandText = parseCommandfromMention(message, githubHandle());

	if (commandText === undefined) {
		const err = new Error('Mention not found');
		// Mention not found, do nothing
		logger.info(logData, `/github-bot - ${err.message} - Skipping`);
		return err;
	}

	logger.info({ commandText, ...logData }, '/github-bot - Command text');
	commandText = await cleanUpCommandText(commandText);

	logger.info(
		{ commandText, ...logData },
		'/github-bot - Cleaned up command text',
	);

	const githubTarget = parseFooter(footer);

	if (githubTarget === undefined) {
		const err = new Error('Invalid footer');
		// invalid footer, do nothing
		logger.info(logData, `/github-bot - ${err.message} - Skipping`);
		return err;
	}

	try {
		await processCommand(reqId, githubTarget, commandText);
	} catch (error) {
		const err = error as Error;
		// invalid footer, do nothing
		logger.info(logData, `/github-bot - ${err.message} - Processing failed`);
		return err;
	}

	return undefined;
}

export async function cleanUpCommandText (text: string): Promise<string> {
	const file = await remark().use(strip).process(text);

	return String(file).trim();
}

export function parseCommandfromMention (
	text: string,
	ghHandle: string,
): string | undefined {
	const trimmedText = text.trim();
	const expectedMention = `@${ghHandle}`;

	if (!trimmedText.startsWith(expectedMention)) {
		return undefined;
	}

	const textWithoutMention = trimmedText.slice(expectedMention.length).trim();
	const commandOnly = removeNewLineAndFollowingText(textWithoutMention).trim();
	return commandOnly;
}

function removeNewLineAndFollowingText (input: string): string {
	const newLineIndex = input.indexOf('\n');
	const carriageReturnIndex = input.indexOf('\r\n');

	if (
		newLineIndex !== -1
		&& (newLineIndex < carriageReturnIndex || carriageReturnIndex === -1)
	) {
		return input.slice(0, Math.max(0, newLineIndex));
	}

	if (carriageReturnIndex !== -1) {
		return input.slice(0, Math.max(0, carriageReturnIndex));
	}

	return input;
}

export function isMentionNotification (text: string): boolean {
	return text.includes('You are receiving this because you were mentioned');
}

export function splitMessageFooter (fullText: string): string[] {
	const delimiter = 'Reply to this email';
	const lastIndex = fullText.lastIndexOf(delimiter);

	if (lastIndex < 0) {
		return [];
	}

	const message = fullText.slice(0, lastIndex).trim();
	const footer = fullText.slice(lastIndex).trim();

	return [ message, footer ];
}

export function parseFooter (footer: string): GithubTarget | undefined {
	const lines = footer.split(/\r?\n/);

	if (lines.length < 2) {
		return undefined;
	}

	const lastLine = lines[lines.length - 1];

	const regex = /(<|&lt;)(.*)(>|&gt;)/;
	const matches = regex.exec(lastLine);

	if (matches === null) {
		// message id not found
		return undefined;
	}

	const messageId = matches[2];
	const messageIdParts = messageId.split('/');

	if (messageIdParts.length < 4) {
		// message id invalid
		return undefined;
	}

	const owner = messageIdParts[0];
	const repo = messageIdParts[1];
	const typeStr = messageIdParts[2];
	const idPart = messageIdParts[3];

	let type: GithubTargetType;

	if (typeStr === 'pull') {
		type = GithubTargetType.PullRequest;
	} else if (typeStr === 'issues') {
		type = GithubTargetType.Issue;
	} else {
		// type unknown
		return undefined;
	}

	const idArr = idPart.split('@');
	const idStr = idArr[0];

	if (idStr.length === 0) {
		// no id
		return undefined;
	}

	const id = Number(idStr);

	if (Number.isNaN(id)) {
		// id is not a number
		return undefined;
	}

	const githubTarget: GithubTarget = {
		owner,
		repo,
		type,
		id,
	};

	return githubTarget;
}
