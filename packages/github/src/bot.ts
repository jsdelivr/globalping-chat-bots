import { IncomingMessage, ServerResponse } from 'node:http';
import getRawBody from 'raw-body';
import { v4 as uuidv4 } from 'uuid';
import {
	argsToFlags,
	buildPostMeasurements,
	Flags,
	formatAPIError,
	fullResultsFooter,
	generateHelp,
	getAPIErrorMessage,
	getMeasurement,
	getTag,
	HelpTexts,
	LinkBlockType,
	Logger,
	Measurement,
	MeasurementCreate,
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
import { getHelpForCommand } from './utils.js';

export const initBot = (config: Config, logger: Logger) => {
	const octokit = new Octokit({ auth: config.githubPersonalAccessToken });

	return new Bot(config, logger, octokit, postMeasurement, getMeasurement);
};

export class Bot {
	private maxDisplayedResults = 4;
	private help: HelpTexts;

	constructor (
		private config: Config,
		private logger: Logger,
		private githubClient: Octokit,
		private postMeasurement: (
			opts: MeasurementCreate,
			token?: string,
		) => Promise<MeasurementCreateResponse>,
		private getMeasurement: (id: string) => Promise<Measurement>,
	) {
		this.help = generateHelp(
			'**',
			`@${config.githubBotHandle}`,
			new Set([ 'auth', 'limits' ]),
		);
	}

	async HandleRequest (req: IncomingMessage, res: ServerResponse) {
		const reqId = uuidv4();
		const logData = { reqId };
		this.logger.info('Request received.', logData);

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
			this.logger.error('Failed to parse the request body.', e, logData);

			res.writeHead(400);
			res.write(JSON.stringify({ err: e.message }));
			res.end();
			return;
		}

		try {
			this.logger.info('Processing.', { ghRequest, ...logData });

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

			this.logger.info('OK', logData);
		} catch (error) {
			const e = error as Error;
			this.logger.error('Request handling failed.', e, logData);

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
			this.logger.info(`HandleMention: ${err.message} - skipping.`, logData);
			return err;
		}

		const [ message, footer ] = parts;

		if (!isMentionNotification(footer)) {
			const err = new Error('Not a mention notification');
			// not a mention, do nothing
			this.logger.info(`HandleMention: ${err.message} - skipping.`, logData);
			return err;
		}

		let commandText = parseCommandfromMention(
			message,
			this.config.githubBotHandle,
		);

		if (commandText === undefined) {
			const err = new Error('Mention not found');
			// Mention not found, do nothing
			this.logger.info(`HandleMention: ${err.message} - skipping.`, logData);
			return err;
		}

		this.logger.info(`HandleMention: command text.`, {
			commandText,
			...logData,
		});

		commandText = await cleanUpCommandText(commandText);

		this.logger.info(`HandleMention: clean up command text.`, {
			commandText,
			...logData,
		});

		const githubTarget = parseFooter(footer);

		if (githubTarget === undefined) {
			const err = new Error('Invalid footer');
			// invalid footer, do nothing
			this.logger.info(`HandleMention: ${err.message} - skipping.`, logData);
			return err;
		}

		try {
			await this.processCommand(reqId, githubTarget, commandText);
		} catch (error) {
			const err = error as Error;
			this.logger.info(
				`HandleMention: ${err.message} - processing failed.`,
				logData,
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
			this.logger.error(`ProcessCommand: argsToFlags failed.`, {
				errorMsg,
				...logData,
			});

			await this.postComment(
				this.githubClient,
				githubTarget,
				`Failed to process command \`${cmdText}\`.\n${formatAPIError(errorMsg)}`,
			);

			throw error;
		}

		if (!flags.cmd || flags.help) {
			const text = getHelpForCommand(flags.cmd, flags.target, this.help);

			await this.postComment(this.githubClient, githubTarget, text);
			return;
		}

		const opts = buildPostMeasurements(flags);

		let measurementResponse: MeasurementCreateResponse;

		try {
			measurementResponse = await this.postMeasurement(
				opts,
				this.config.globalpingToken,
			);
		} catch (error) {
			const errorMsg = getAPIErrorMessage(error);
			this.logger.error(`ProcessCommand: postMeasurement failed.`, {
				errorMsg,
				...logData,
			});

			await this.postComment(
				this.githubClient,
				githubTarget,
				`Failed to process command \`${cmdText}\`.\n${formatAPIError(errorMsg)}`,
			);

			throw error;
		}

		let res: Measurement;

		try {
			res = await this.getMeasurement(measurementResponse.id);
		} catch (error) {
			const errorMsg = getAPIErrorMessage(error);
			this.logger.error(`ProcessCommand: getMeasurement failed.`, {
				errorMsg,
				...logData,
			});

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

		fullText += `Here are the results for \`${cmdText}\`\n`;

		/* eslint-disable no-await-in-loop */
		for (const result of resultsForDisplay) {
			const tag = getTag(result.probe.tags);
			const text = `${
				responseHeader(result, tag, githubBoldSeparator)
				+ responseText(result, flags, githubTruncationLimit)
			}\n`;
			fullText += text;
		}

		const resultsTruncated = resultsForDisplay.length !== res.results.length;

		let footerText;

		if (resultsTruncated) {
			footerText = fullResultsFooter(
				measurementId,
				githubBoldSeparator,
				LinkBlockType.Markdown,
			);
		} else if (flags.share) {
			footerText = shareMessageFooter(
				measurementId,
				githubBoldSeparator,
				LinkBlockType.Markdown,
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

	if (commandOnly === '--') {
		return '';
	}

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
