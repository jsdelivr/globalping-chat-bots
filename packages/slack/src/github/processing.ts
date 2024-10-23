import {
	argsToFlags,
	buildPostMeasurements,
	Flags,
	formatAPIError,
	getAPIErrorMessage,
	getMeasurement,
	getTag,
	PingMeasurementResponse,
	postMeasurement,
	PostMeasurementResponse,
} from '@globalping/bot-utils';
import { Octokit } from 'octokit';

import {
	fullResultsFooter,
	responseHeader,
	responseText,
	shareMessageFooter,
} from '../response.js';
import { helpCmd, logger } from '../utils.js';
import { getGithubClient } from './client.js';
import { GithubTarget } from './types.js';

export const processCommand = async (
	reqId: string,
	githubTarget: GithubTarget,
	cmdText: string,
) => {
	const logData = { reqId };

	const githubClient = getGithubClient();

	let flags: Flags;

	try {
		flags = argsToFlags(cmdText);
	} catch (error) {
		const errorMsg = getAPIErrorMessage(error);
		logger.error({ errorMsg, ...logData }, '/github-bot - argsToFlags failed');

		await postComment(
			githubClient,
			githubTarget,
			`Failed to process command \`${cmdText}\`.\n${formatAPIError(errorMsg)}`,
		);

		throw error;
	}

	if (!flags.cmd || flags.help) {
		const text = helpCmd(flags.cmd, flags.target, 'github');

		await postComment(githubClient, githubTarget, text);
		return;
	}

	const postMeasurements = buildPostMeasurements(flags);

	let measurements: PostMeasurementResponse[];

	try {
		measurements = await postMeasurement(postMeasurements);
	} catch (error) {
		const errorMsg = getAPIErrorMessage(error);
		logger.error(
			{ errorMsg, ...logData },
			'/github-bot - postMeasurement failed',
		);

		await postComment(
			githubClient,
			githubTarget,
			`Failed to process command \`${cmdText}\`.\n${formatAPIError(errorMsg)}`,
		);

		throw error;
	}

	let firstMeasurement = true;

	/* eslint-disable no-await-in-loop */
	for (const measurement of measurements) {
		let res: PingMeasurementResponse;

		try {
			res = await getMeasurement(measurement.id);
		} catch (error) {
			const errorMsg = getAPIErrorMessage(error);
			logger.error(
				{ errorMsg, ...logData },
				'/github-bot - getMeasurement failed',
			);

			await postComment(
				githubClient,
				githubTarget,
				`Failed to process command \`${cmdText}\`.\n${formatAPIError(errorMsg)}`,
			);

			throw error;
		}

		await measurementsResponse(
			githubClient,
			githubTarget,
			measurement.id,
			res,
			flags,
			cmdText,
			firstMeasurement,
		);

		if (firstMeasurement) {
			firstMeasurement = false;
		}
	}
};

async function postComment (
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

const maxDisplayedResults = 4;

async function measurementsResponse (
	githubClient: Octokit,
	githubTarget: GithubTarget,
	measurementId: string,
	res: PingMeasurementResponse,
	flags: Flags,
	cmdText: string,
	firstMeasurement: boolean,
) {
	const resultsForDisplay = res.results.slice(0, maxDisplayedResults);

	const githubBoldSeparator = '**';
	const githubTruncationLimit = 60_000;

	let fullText = '';

	const preHeader = firstMeasurement
		? `Here are the results for \`${cmdText}\`\r\n`
		: '';

	fullText += preHeader;

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
		footerText = shareMessageFooter(measurementId, githubBoldSeparator, false);
	}

	if (footerText !== undefined) {
		fullText += footerText;
	}

	await postComment(githubClient, githubTarget, fullText);
}
