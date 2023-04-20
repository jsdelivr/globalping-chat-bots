/* eslint-disable no-await-in-loop */
import { argsToFlags, buildPostMeasurements, getMeasurement, help, loggerInit, postMeasurement } from '@globalping/bot-utils';
import type { WebClient } from '@slack/web-api';
import * as dotenv from 'dotenv';

import { dnsHelp, generalHelp } from './format-help';
import { measurementsChatResponse } from './response';

dotenv.config();

export const logger = loggerInit('slack', process.env.LOG_LEVEL ?? 'info');


export const helpCmd = (cmd: string): string => {
	switch (cmd) {
		case 'dns':
			return dnsHelp();
		case 'traceroute':
			return `${help.traceroute.preamble}\n\n*Usage:*\n\`\`\`${help.traceroute.usage}\`\`\`\n\n*Options:*\n\`\`\`${help.traceroute.options}\`\`\`\n\n*Examples:*\n\`\`\`${help.traceroute.examples}\`\`\``;
		case 'ping':
			return `${help.dns.preamble}\n\n*Usage:*\n\`\`\`${help.dns.usage}\`\`\`\n\n*Options:*\n\`\`\`${help.dns.options}\`\`\`\n\n*Examples:*\n\`\`\`${help.dns.examples}\`\`\``;
		case 'mtr':
			return `${help.mtr.preamble}\n\n*Usage:*\n\`\`\`${help.mtr.usage}\`\`\`\n\n*Options:*\n\`\`\`${help.mtr.options}\`\`\`\n\n*Examples:*\n\`\`\`${help.mtr.examples}\`\`\``;
		case 'http':
			return `${help.http.preamble}\n\n*Usage:*\n\`\`\`${help.http.usage}\`\`\`\n\n*Options:*\n\`\`\`${help.http.options}\`\`\`\n\n*Examples:*\n\`\`\`${help.http.examples}\`\`\``;
		case undefined:
		case '':
		case 'help':
			return generalHelp();
		default:
			return 'Unknown command! Please call `/globalping help` for a list of commands.';
	}
};

export const welcome = (id: string) => `Hi <@${id}>! :wave:\nI help make running networking commands easy. To learn more about me, try running \`/globalping help!\`\n\n:zap: Here are some quick example commands to help you get started:
\`/globalping ping jsdelivr.com from new york --packets 4\`
\`/globalping traceroute jsdelivr.com from united kingdom --limit 2\`
\`/globalping dns jsdelivr.com from eu --resolver 1.1.1.1\`
\`/globalping mtr jsdelivr.com from new york, london --protocol udp\`
\`/globalping http jsdelivr.com from google+belgium --protocol http2\``;

export const channelWelcome = 'Hello, I\'m Globalping. To learn more about me, run `/globalping help`.';


interface ChannelPayload {
	channel_id: string
	user_id: string
}

export const postAPI = async (client: WebClient, payload: ChannelPayload, cmdText: string) => {
	const flags = argsToFlags(cmdText);

	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { channel_id, user_id } = payload;

	if (!flags.cmd || flags.help) {
		await client.chat.postEphemeral({ text: helpCmd(flags.cmd), user: user_id, channel: channel_id });
	} else {
		const postMeasurements = buildPostMeasurements(flags);

		// We post measurement first to catch any validation errors before committing to processing request message
		logger.debug(`Posting measurement: ${JSON.stringify(postMeasurements)}`);
		const measurements = await postMeasurement(postMeasurements);
		await client.chat.postEphemeral({ text: '```Processing request...```', user: user_id, channel: channel_id });
		logger.debug(`Post response: ${JSON.stringify(measurements)}`);
		logger.debug(`Latency mode: ${flags.latency}`);

		let first = true;
		// You can have multiple locations run in parallel
		for (const measurement of measurements) {
			const res = await getMeasurement(measurement.id);
			logger.debug(`Get response: ${JSON.stringify(res)}`);
			// Only want this to run on first measurement
			if (first) {
				await client.chat.postMessage({ channel: channel_id, text: `<@${user_id}>, here are the results for \`${cmdText}\`` });
				first = false;
			}

			measurementsChatResponse(logger, client, channel_id, res, flags.cmd, flags.latency);
		}
	}
};

