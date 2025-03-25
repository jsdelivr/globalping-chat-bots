import { IncomingHttpHeaders } from 'node:http';
import { Flags } from './flags.js';
import {
	CreateLimitType,
	IntrospectionResponse,
	LimitsResponse,
} from './oauth.js';
import {
	AuthToken,
	DnsProbeResult,
	HttpProbeResult,
	HttpTLS,
	PingProbeResult,
	ProbeMeasurement,
} from './types.js';
import { formatSeconds, pluralize } from './utils.js';

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

export enum LinkBlockType {
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

function getHTTPTLSText (tls: HttpTLS | null): string {
	if (!tls) {
		return '';
	}

	return `${tls.protocol}/${tls.cipherName}${tls.authorized ? '' : '\nError: ' + tls.error}
Subject: ${tls.subject.CN}; ${tls.subject.alt}
Issuer: ${tls.issuer.CN}; ${tls.issuer.O}; ${tls.issuer.C}
Validity: ${tls.createdAt}; ${tls.expiresAt}
Serial number: ${tls.serialNumber}
Fingerprint: ${tls.fingerprint256}
Key type: ${tls.keyType}${tls.keyBits}

`;
}

export const codeBlock = (text: string): string => `\`\`\`
${text}
\`\`\``;

export const codeBlockLength = codeBlock('').length;

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

	if (flags.cmd === 'http') {
		if (flags.full === true) {
			responseText = getHTTPTLSText((result.result as HttpProbeResult).tls);

			const firstLineEnd = result.result.rawOutput.indexOf('\n');
			responseText
				+= result.result.rawOutput.slice(0, firstLineEnd)
				+ '\n'
				+ (result.result as HttpProbeResult).rawHeaders
				+ '\n\n';

			if (flags.method === 'GET') {
				responseText
					+= (result.result as HttpProbeResult).rawBody?.trim() || '';
			}
		} else if (flags.method === 'GET') {
			responseText = (result.result as HttpProbeResult).rawBody?.trim() || '';
		} else {
			responseText = result.result.rawOutput.trim();
		}
	} else {
		responseText = result.result.rawOutput.trim();
	}

	return codeBlock(truncate(responseText, truncationLimit - codeBlockLength));
};

const truncationText = '\n... (truncated)';

export const truncate = (text: string, limit: number): string => {
	if (text.length <= limit) {
		return text;
	}

	return text.slice(0, limit - truncationText.length) + truncationText;
};

export function getLimitsOutput (
	limits: LimitsResponse,
	introspection: IntrospectionResponse,
) {
	let text = '';

	if (limits.rateLimit.measurements.create.type === CreateLimitType.User) {
		text = `Authentication: token (${introspection?.username || ''})\n\n`;
	} else {
		text = 'Authentication: workspace\n\n';
	}

	const createLimit = pluralize(
		limits.rateLimit.measurements.create.limit,
		'test',
	);
	const createConsumed
		= limits.rateLimit.measurements.create.limit
		- limits.rateLimit.measurements.create.remaining;
	const createRemaining = limits.rateLimit.measurements.create.remaining;
	text += `Creating measurements:
 - ${createLimit} per hour
 - ${createConsumed} consumed, ${createRemaining} remaining
`;

	if (limits.rateLimit.measurements.create.reset) {
		text += ` - resets in ${formatSeconds(limits.rateLimit.measurements.create.reset)}\n`;
	}

	if (limits.rateLimit.measurements.create.type === CreateLimitType.User) {
		text += `
Credits:
 - ${pluralize(
		limits.credits?.remaining || 0,
		'credit',
	)} remaining (may be used to create measurements above the hourly limits)
`;
	}

	return text;
}

export function getTooManyRequestsError (
	headers: IncomingHttpHeaders,
	token: AuthToken | null,
): Error {
	const rateLimitRemaining = parseInt(headers['X-RateLimit-Remaining'] as string);
	const rateLimitReset = parseInt(headers['X-RateLimit-Reset'] as string);
	const creditsRemaining = parseInt(headers['X-Credits-Remaining'] as string);
	const requestCost = parseInt(headers['X-Request-Cost'] as string);
	const remaining = rateLimitRemaining + creditsRemaining;

	if (token && !token.isAnonymous) {
		if (remaining > 0) {
			return getMoreCreditsRequiredAuthError(
				requestCost,
				remaining,
				rateLimitReset,
			);
		}

		return getNoCreditsAuthError(rateLimitReset);
	}

	if (remaining > 0) {
		return getMoreCreditsRequiredNoAuthError(
			remaining,
			requestCost,
			rateLimitReset,
		);
	}

	return getNoCreditsNoAuthError(rateLimitReset);
}

export function getMoreCreditsRequiredAuthError (
	requestCost: number,
	remaining: number,
	rateLimitReset: number,
): Error {
	return new Error(`You only have ${pluralize(
		remaining,
		'credit',
	)} remaining, and ${requestCost} were required. Try requesting fewer probes or wait ${formatSeconds(rateLimitReset)} for the rate limit to reset. You can get higher limits by sponsoring us or hosting probes.`);
}

export function getNoCreditsAuthError (rateLimitReset: number): Error {
	return new Error(`You have run out of credits for this session. You can wait ${formatSeconds(rateLimitReset)} for the rate limit to reset or get higher limits by sponsoring us or hosting probes.`);
}

export function getMoreCreditsRequiredNoAuthError (
	requestCost: number,
	remaining: number,
	rateLimitReset: number,
): Error {
	return new Error(`You only have ${pluralize(
		remaining,
		'credit',
	)} remaining, and ${requestCost} were required. Try requesting fewer probes or wait ${formatSeconds(rateLimitReset)} for the rate limit to reset. You can get higher limits by creating an account. Sign up at https://globalping.io`);
}

export function getNoCreditsNoAuthError (rateLimitReset: number): Error {
	return new Error(`You have run out of credits for this session. You can wait ${formatSeconds(rateLimitReset)} for the rate limit to reset or get higher limits by creating an account. Sign up at https://globalping.io`);
}
