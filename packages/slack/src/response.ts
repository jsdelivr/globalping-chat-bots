import { getTag, Logger, PingMeasurementResponse, PingResult } from '@globalping/bot-utils';
import { WebClient } from '@slack/web-api';

const responseHeader = (result: PingResult, tag: string | undefined): string => `>*${result.probe.continent}, ${result.probe.country}, ${result.probe.state ? `(${result.probe.state}), ` : ''}${result.probe.city}, ASN:${result.probe.asn}, ${result.probe.network}${tag ? ` (${tag})` : ''}*\n`;

const reponseTextRegular = (result: PingResult): string => {
    // Slack has a limit of 3000 characters per block - truncate if necessary
    const output = result.result.rawOutput.length > 2800 ? `${result.result.rawOutput.slice(0, 2800)}\n... (truncated)` : `${result.result.rawOutput}`;
    return output;
};

const formatResponseText = (text: string): string => `\`\`\`${text}\`\`\``;


const latencyText = (result: PingResult, cmd: string): string => {
    let text = '';

    switch (cmd) {
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
            throw new Error(`unknown command: ${cmd}`);
            break;
    }

    return text;
};

const responseText = (result: PingResult, cmd: string, latency: boolean | undefined): string => {
    const text = latency ? latencyText(result, cmd) : reponseTextRegular(result);

    return formatResponseText(text);
};

export const measurementsChatResponse = async (logger: Logger, client: WebClient, channel_id: string, res: PingMeasurementResponse, cmd: string, latency: boolean | undefined) => {
    /* eslint-disable no-await-in-loop */
    for (const result of res.results) {
        const tag = getTag(result.probe.tags);
        const text = responseHeader(result, tag) + responseText(result, cmd, latency);

        try {
            await client.chat.postMessage({ text, channel: channel_id });
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }
};









