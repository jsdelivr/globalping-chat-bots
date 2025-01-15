import { Flags } from './flags.js';
import {
	DnsProbeResult,
	HttpProbeResult,
	PingProbeResult,
	ProbeMeasurement,
} from './types.js';

export function responseHeader (
	result: ProbeMeasurement,
	tag: string | undefined,
	boldSeparator: string,
): string {
	return `> ${boldSeparator}${result.probe.city}${
		result.probe.state ? ` (${result.probe.state})` : ''
	}, ${result.probe.country}, ${result.probe.continent}, ${
		result.probe.network
	} (AS${result.probe.asn})${tag ? `, (${tag})` : ''}${boldSeparator}\n`;
}

export const enum LinkBlockType {
	Slack = 1,
	Markdown = 2,
	Raw = 3,
}

export function resultsLink (id: string, type: LinkBlockType): string {
	const url = `https://globalping.io?measurement=${id}`;

	switch (type) {
		case LinkBlockType.Slack:
			return `<${url}>`;
		case LinkBlockType.Markdown:
			return `[${url}](${url})`;
		case LinkBlockType.Raw:
			return url;
	}
}

export function shareMessageFooter (
	id: string,
	boldSeparator: string,
	type: LinkBlockType,
): string {
	return `> ${boldSeparator}View the results online: ${resultsLink(
		id,
		type,
	)}${boldSeparator}\n`;
}

export function fullResultsFooter (
	id: string,
	boldSeparator: string,
	type: LinkBlockType,
): string {
	return `> ${boldSeparator}Full results available here: ${resultsLink(
		id,
		type,
	)}${boldSeparator}\n`;
}

function isBodyOnlyHttpGet (flags: Flags): boolean {
	return flags.cmd === 'http' && flags.method === 'GET' && !flags.full;
}

const codeBlock = (text: string): string => `\`\`\`
${text}
\`\`\``;

const latencyText = (result: ProbeMeasurement, flags: Flags): string => {
	let text = '';

	if (flags.cmd === 'ping') {
		const stats = (result.result as PingProbeResult).stats;
		text += `Min: ${stats.min} ms\n`;
		text += `Max: ${stats.max} ms\n`;
		text += `Avg: ${stats.min} ms`;
		return text;
	}

	if (flags.cmd === 'dns') {
		const timings = (result.result as DnsProbeResult).timings;
		text += `Total: ${timings.total} ms`;
		return text;
	}

	if (flags.cmd === 'http') {
		const timings = (result.result as HttpProbeResult).timings;
		text += `Total: ${timings.total} ms\n`;
		text += `Download: ${timings.download} ms\n`;
		text += `First byte: ${timings.firstByte} ms\n`;
		text += `DNS: ${timings.dns} ms\n`;
		text += `TLS: ${timings.tls} ms\n`;
		text += `TCP: ${timings.tcp} ms`;
		return text;
	}

	throw new Error(`unknown command: ${flags.cmd}`);
};

export const responseText = (
	result: ProbeMeasurement,
	flags: Flags,
	truncationLimit: number,
): string => {
	if (truncationLimit <= 0) {
		return '';
	}

	if (flags.latency) {
		return codeBlock(latencyText(result, flags));
	}

	let responseText: string;

	if (isBodyOnlyHttpGet(flags)) {
		responseText = (result.result as HttpProbeResult).rawBody?.trim() || '';
	} else {
		responseText = result.result.rawOutput.trim();
	}

	if (responseText.length > truncationLimit) {
		const truncationText = '\n... (truncated)';
		return (
			responseText.slice(0, truncationLimit - truncationText.length)
			+ truncationText
		);
	}

	return codeBlock(responseText);
};
