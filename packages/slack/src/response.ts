import {
	Flags,
	getTag,
	PingMeasurementResponse,
	PingResult,
} from '@globalping/bot-utils';
import { KnownBlock } from '@slack/web-api';

export function responseHeader (
	result: PingResult,
	tag: string | undefined,
	boldSeparator: string,
): string {
	return `>${boldSeparator}${result.probe.city}${result.probe.state ? ` (${result.probe.state})` : ''
	}, ${result.probe.country}, ${result.probe.continent}, ${result.probe.network
	} (AS${result.probe.asn})${tag ? `, (${tag})` : ''}${boldSeparator}\n`;
}

export function resultsLink (id: string, isSlackLink: boolean): string {
	const url = `https://globalping.io?measurement=${id}`;
	return isSlackLink ? `<${url}>` : `[${url}](${url})`;
}

export function shareMessageFooter (
	id: string,
	boldSeparator: string,
	isSlackLink: boolean,
): string {
	return `>${boldSeparator}View the results online: ${resultsLink(
		id,
		isSlackLink,
	)}${boldSeparator}\n`;
}

export function fullResultsFooter (
	id: string,
	boldSeparator: string,
	isSlackLink: boolean,
): string {
	return `>${boldSeparator}Full results available here: ${resultsLink(
		id,
		isSlackLink,
	)}${boldSeparator}\n`;
}

const reponseTextRegular = (
	result: PingResult,
	flags: Flags,
	truncationLimit: number,
): string => {
	const responseText = isBodyOnlyHttpGet(flags)
		? result.result.rawBody
		: result.result.rawOutput;

	// Slack has a limit of 3000 characters per block - truncate if necessary
	const finalResponseText
		= responseText.length > truncationLimit
			? `${responseText.slice(0, truncationLimit)}\n... (truncated)`
			: `${responseText}`;
	return finalResponseText;
};

function isBodyOnlyHttpGet (flags: Flags): boolean {
	return flags.cmd === 'http' && flags.method === 'GET' && !flags.full;
}

const formatResponseText = (text: string): string => `\`\`\`
${text}
\`\`\``;

const latencyText = (result: PingResult, flags: Flags): string => {
	let text = '';

	switch (flags.cmd) {
		case 'ping':
			text += `Min: ${result.result.stats.min} ms\n`;
			text += `Max: ${result.result.stats.max} ms\n`;
			text += `Avg: ${result.result.stats.min} ms\n`;
			break;

		case 'dns':
			text += `Total: ${result.result.timings.total} ms\n`;
			break;

		case 'http':
			text += `Total: ${result.result.timings.total} ms\n`;
			text += `Download: ${result.result.timings.download} ms\n`;
			text += `First byte: ${result.result.timings.firstByte} ms\n`;
			text += `DNS: ${result.result.timings.dns} ms\n`;
			text += `TLS: ${result.result.timings.tls} ms\n`;
			text += `TCP: ${result.result.timings.tcp} ms\n`;
			break;

		default:
			throw new Error(`unknown command: ${flags.cmd}`);
	}

	return text;
};

export const responseText = (
	result: PingResult,
	flags: Flags,
	truncationLimit: number,
): string => {
	const text = flags.latency
		? latencyText(result, flags)
		: reponseTextRegular(result, flags, truncationLimit);

	return formatResponseText(text.trim());
};

const maxDisplayedResults = 4;

export const formatMeasurementResponse = (
	userId: string,
	cmdText: string,
	res: PingMeasurementResponse,
	flags: Flags,
) => {
	const blocks: KnownBlock[] = [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `<@${userId}>, here are the results for \`${cmdText}\``,
				verbatim: true,
			},
		},
	];
	const resultsForDisplay = res.results.slice(0, maxDisplayedResults);
	const slackBoldSeparator = '*';
	const slackTruncationLimit = 4000;

	/* eslint-disable no-await-in-loop */
	for (const result of resultsForDisplay) {
		const tag = getTag(result.probe.tags);
		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text:
					responseHeader(result, tag, slackBoldSeparator)
					+ responseText(result, flags, slackTruncationLimit),
				verbatim: true,
			},
		});
	}

	const resultsTruncated = resultsForDisplay.length !== res.results.length;

	if (resultsTruncated) {
		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: fullResultsFooter(res.id, slackBoldSeparator, true),
				verbatim: true,
			},
		});
	} else if (flags.share) {
		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: shareMessageFooter(res.id, slackBoldSeparator, true),
				verbatim: true,
			},
		});
	}

	return blocks;
};
