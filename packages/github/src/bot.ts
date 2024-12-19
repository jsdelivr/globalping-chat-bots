import { IncomingMessage, ServerResponse } from 'node:http';
import getRawBody from 'raw-body';
import { v4 as uuidv4 } from 'uuid';
import {
	argsToFlags,
	buildPostMeasurements,
	Flags,
	formatAPIError,
	fullResultsFooter,
	getAPIErrorMessage,
	getMeasurement,
	getTag,
	helpCmd,
	Logger,
	Measurement,
	MeasurementCreateResponse,
	postMeasurement,
	responseHeader,
	responseText,
	shareMessageFooter,
} from '@globalping/bot-utils';

import {
	Config,
	GithubNotificationRequest,
	GithubTarget,
	GithubTargetType,
} from './types.js';
import { Octokit } from 'octokit';
import { remark } from 'remark';
import strip from 'strip-markdown';

export const initBot = (config: Config, logger: Logger) => {
	const octokit = new Octokit({ auth: config.githubPersonalAccessToken });

	return new Bot(config, logger, octokit);
};

export class Bot {
	private maxDisplayedResults = 4;

	constructor (
		private config: Config,
		private logger: Logger,
		private githubClient: Octokit,
	) {}

	async HandleRequest (req: IncomingMessage, res: ServerResponse) {
		const reqId = uuidv4();
		const logData = { reqId };
		this.logger.info(logData, '/github-bot request');

		if (req.headers['api-key'] !== this.config.githubBotApiKey) {
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
			const e = error as Error;
			this.logger.error(
				{
					errorMsg: `Failed to parse the request body: ${e.message}`,
					...logData,
				},
				'/github-bot failed',
			);

			res.writeHead(400);
			res.write(JSON.stringify({ err: e.message }));
			res.end();
			return;
		}

		try {
			this.logger.info({ ghRequest, ...logData }, '/github-bot processing');

			const e = await this.handleMention(reqId, ghRequest);

			if (e !== undefined) {
				res.writeHead(400);
				res.write(JSON.stringify({ err: e.message }));
				res.end();
				return;
			}

			res.writeHead(200);
			res.write(JSON.stringify({}));
			res.end();

			this.logger.info(logData, '/github-bot response - OK');
		} catch (error) {
			const e = error as Error;
			this.logger.error(
				{ errorMsg: `Request handling failed: ${e.message}`, ...logData },
				'/github-bot failed',
			);

			res.writeHead(500);
			res.write(JSON.stringify({ err: e.message }));
			res.end();
		}
	}

	private async handleMention (
		reqId: string,
		ghRequest: GithubNotificationRequest,
	): Promise<Error | undefined> {
		const logData = { reqId };

		const fullText = ghRequest.bodyPlain;

		const parts = splitMessageFooter(fullText);

		if (parts.length === 0) {
			const err = new Error('Not a valid notification email');
			// not a valid notification email, do nothing
			this.logger.info(logData, `/github-bot - ${err.message} - Skipping`);
			return err;
		}

		const [ message, footer ] = parts;

		if (!isMentionNotification(footer)) {
			const err = new Error('Not a mention notification');
			// not a mention, do nothing
			this.logger.info(logData, `/github-bot - ${err.message} - Skipping`);
			return err;
		}

		let commandText = parseCommandfromMention(
			message,
			this.config.githubBotHandle,
		);

		if (commandText === undefined) {
			const err = new Error('Mention not found');
			// Mention not found, do nothing
			this.logger.info(logData, `/github-bot - ${err.message} - Skipping`);
			return err;
		}

		this.logger.info({ commandText, ...logData }, '/github-bot - Command text');
		commandText = await cleanUpCommandText(commandText);

		this.logger.info(
			{ commandText, ...logData },
			'/github-bot - Cleaned up command text',
		);

		const githubTarget = parseFooter(footer);

		if (githubTarget === undefined) {
			const err = new Error('Invalid footer');
			// invalid footer, do nothing
			this.logger.info(logData, `/github-bot - ${err.message} - Skipping`);
			return err;
		}

		try {
			await this.processCommand(reqId, githubTarget, commandText);
		} catch (error) {
			const err = error as Error;
			// invalid footer, do nothing
			this.logger.info(
				logData,
				`/github-bot - ${err.message} - Processing failed`,
			);

			return err;
		}

		return undefined;
	}

	private async processCommand (
		reqId: string,
		githubTarget: GithubTarget,
		cmdText: string,
	) {
		const logData = { reqId };

		let flags: Flags;

		try {
			flags = argsToFlags(cmdText);
		} catch (error) {
			const errorMsg = getAPIErrorMessage(error);
			this.logger.error(
				{ errorMsg, ...logData },
				'/github-bot - argsToFlags failed',
			);

			await this.postComment(
				this.githubClient,
				githubTarget,
				`Failed to process command \`${cmdText}\`.\n${formatAPIError(errorMsg)}`,
			);

			throw error;
		}

		if (!flags.cmd || flags.help) {
			const text = helpCmd(
				flags.cmd,
				flags.target,
				'github',
				this.config.githubBotHandle,
			);

			await this.postComment(this.githubClient, githubTarget, text);
			return;
		}

		const opts = buildPostMeasurements(flags);

		let measurementResponse: MeasurementCreateResponse;

		try {
			measurementResponse = await postMeasurement(
				opts,
				this.config.globalpingToken,
			);
		} catch (error) {
			const errorMsg = getAPIErrorMessage(error);
			this.logger.error(
				{ errorMsg, ...logData },
				'/github-bot - postMeasurement failed',
			);

			await this.postComment(
				this.githubClient,
				githubTarget,
				`Failed to process command \`${cmdText}\`.\n${formatAPIError(errorMsg)}`,
			);

			throw error;
		}

		let res: Measurement;

		try {
			res = await getMeasurement(measurementResponse.id);
		} catch (error) {
			const errorMsg = getAPIErrorMessage(error);
			this.logger.error(
				{ errorMsg, ...logData },
				'/github-bot - getMeasurement failed',
			);

			await this.postComment(
				this.githubClient,
				githubTarget,
				`Failed to process command \`${cmdText}\`.\n${formatAPIError(errorMsg)}`,
			);

			throw error;
		}

		await this.measurementsResponse(
			this.githubClient,
			githubTarget,
			measurementResponse.id,
			res,
			flags,
			cmdText,
		);
	}

	private async postComment (
		githubClient: Octokit,
		githubTarget: GithubTarget,
		body: string,
	) {
		await githubClient.rest.issues.createComment({
			owner: githubTarget.owner,
			repo: githubTarget.repo,
			issue_number: githubTarget.id,
			body,
		});
	}

	// const

	private async measurementsResponse (
		githubClient: Octokit,
		githubTarget: GithubTarget,
		measurementId: string,
		res: Measurement,
		flags: Flags,
		cmdText: string,
	) {
		const resultsForDisplay = res.results.slice(0, this.maxDisplayedResults);

		const githubBoldSeparator = '**';
		const githubTruncationLimit = 60_000;

		let fullText = '';

		fullText += `Here are the results for \`${cmdText}\`\r\n`;

		/* eslint-disable no-await-in-loop */
		for (const result of resultsForDisplay) {
			const tag = getTag(result.probe.tags);
			const text = `${
				responseHeader(result, tag, githubBoldSeparator)
				+ responseText(result, flags, githubTruncationLimit)
			}\r\n`;
			fullText += text;
		}

		const resultsTruncated = resultsForDisplay.length !== res.results.length;

		let footerText;

		if (resultsTruncated) {
			footerText = fullResultsFooter(measurementId, githubBoldSeparator, false);
		} else if (flags.share) {
			footerText = shareMessageFooter(
				measurementId,
				githubBoldSeparator,
				false,
			);
		}

		if (footerText !== undefined) {
			fullText += footerText;
		}

		await this.postComment(githubClient, githubTarget, fullText);
	}
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