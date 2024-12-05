import {
	DnsProbeResult,
	Flags,
	getTag,
	HttpProbeResult,
	Measurement,
	PingProbeResult,
	ProbeMeasurement,
} from '@globalping/bot-utils';
import { KnownBlock } from '@slack/web-api';

export function responseHeader (
	result: ProbeMeasurement,
	tag: string | undefined,
	boldSeparator: string,
): string {
	return `>${boldSeparator}${result.probe.city}${
		result.probe.state ? ` (${result.probe.state})` : ''
	}, ${result.probe.country}, ${result.probe.continent}, ${
		result.probe.network
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
	result: ProbeMeasurement,
	flags: Flags,
	truncationLimit: number,
): string => {
	let responseText = result.result.rawOutput;

	if (isBodyOnlyHttpGet(flags)) {
		responseText = (result.result as HttpProbeResult).rawBody || '';
	}

	// Slack has a limit of characters per block - truncate if necessary
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

const latencyText = (result: ProbeMeasurement, flags: Flags): string => {
	let text = '';

	if (flags.cmd === 'ping') {
		const stats = (result.result as PingProbeResult).stats;
		text += `Min: ${stats.min} ms\n`;
		text += `Max: ${stats.max} ms\n`;
		text += `Avg: ${stats.min} ms\n`;
		return text;
	}

	if (flags.cmd === 'dns') {
		const timings = (result.result as DnsProbeResult).timings;
		text += `Total: ${timings.total} ms\n`;
		return text;
	}

	if (flags.cmd === 'http') {
		const timings = (result.result as HttpProbeResult).timings;
		text += `Total: ${timings.total} ms\n`;
		text += `Download: ${timings.download} ms\n`;
		text += `First byte: ${timings.firstByte} ms\n`;
		text += `DNS: ${timings.dns} ms\n`;
		text += `TLS: ${timings.tls} ms\n`;
		text += `TCP: ${timings.tcp} ms\n`;
		return text;
	}

	throw new Error(`unknown command: ${flags.cmd}`);
};

export const responseText = (
	result: ProbeMeasurement,
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
	res: Measurement,
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
