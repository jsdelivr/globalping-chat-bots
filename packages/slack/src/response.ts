import { Flags, getTag, Logger, PingMeasurementResponse, PingResult } from '@globalping/bot-utils';
import { WebClient } from '@slack/web-api';

export function responseHeader(result: PingResult, tag: string | undefined): string {
    return `>*${result.probe.continent}, ${result.probe.country}, ${result.probe.state ? `(${result.probe.state}), ` : ''}${result.probe.city}, ASN:${result.probe.asn}, ${result.probe.network}${tag ? ` (${tag})` : ''}*\n`;
}

export function resultsLink(id: string): string {
    return `https://www.jsdelivr.com/globalping?measurement=${id}`;
}

export function shareMessageFooter(id: string): string {
    return `>*View the results online: ${resultsLink(id)} *\n`;
}

export function fullResultsFooter(id: string): string {
    return `>*Full results available here: ${resultsLink(id)} *\n`;
}

const slackTruncationLimit = 2800;

const reponseTextRegular = (result: PingResult, flags: Flags): string => {
    const responseText = isBodyOnlyHttpGet(flags) ? result.result.rawBody : result.result.rawOutput;

    // Slack has a limit of 3000 characters per block - truncate if necessary
    const finalResponseText = responseText.length > slackTruncationLimit ? `${responseText.slice(0, slackTruncationLimit)}\n... (truncated)` : `${responseText}`;
    return finalResponseText;
};

function isBodyOnlyHttpGet(flags: Flags): boolean {
    return flags.cmd === 'http' && flags.method === 'GET' && !flags.full;
}

const formatResponseText = (text: string): string => `\`\`\`${text}\`\`\``;


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
            break;
    }

    return text;
};

const responseText = (result: PingResult, flags: Flags): string => {
    const text = flags.latency ? latencyText(result, flags) : reponseTextRegular(result, flags);

    return formatResponseText(text);
};

const maxDisplayedResults = 4;

export const measurementsChatResponse = async (logger: Logger, client: WebClient, channel_id: string, thread_ts: string | undefined, measurementId: string, res: PingMeasurementResponse, flags: Flags) => {
    const resultsForDisplay = res.results.slice(0, maxDisplayedResults);

    /* eslint-disable no-await-in-loop */
    for (const result of resultsForDisplay) {
        const tag = getTag(result.probe.tags);
        const text = responseHeader(result, tag) + responseText(result, flags);

        try {
            await client.chat.postMessage({ text, channel: channel_id, thread_ts });
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    const resultsTruncated = (resultsForDisplay.length !== res.results.length);

    let footerText;
    if (resultsTruncated) {
        footerText = fullResultsFooter(measurementId);
    } else if (flags.share) {
        footerText = shareMessageFooter(measurementId);
    }

    if (footerText !== undefined) {
        try {
            await client.chat.postMessage({ text: footerText, channel: channel_id, thread_ts });
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }
};









