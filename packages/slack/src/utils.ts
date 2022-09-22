/* eslint-disable no-await-in-loop */
import { argsToFlags, getMeasurement, helpCmd, loggerInit, parseFlags, postMeasurement } from '@globalping/bot-utils';
import type { WebClient } from '@slack/web-api';
import * as dotenv from 'dotenv';

dotenv.config();

export const logger = loggerInit('slack', 'debug');

interface ChannelPayload {
	channel_id: string
	user_id: string
}

export const postAPI = async (client: WebClient, payload: ChannelPayload, cmdText: string) => {
	const args = argsToFlags(cmdText);

	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { channel_id, user_id } = payload;

	if (args.help) {
		await client.chat.postEphemeral({ text: helpCmd(args.cmd), user: user_id, channel: channel_id });
	} else {
		const flags = parseFlags(args);
		// We post measurement first to catch any validation errors before committing to processing request message
		logger.debug(`Posting measurement: ${JSON.stringify(flags)}`);
		const measurements = await postMeasurement(flags);
		await client.chat.postEphemeral({ text: '```Processing request...```', user: user_id, channel: channel_id });
		logger.debug(`Post response: ${JSON.stringify(measurements)}`);

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

			for (const result of res.results) {
				// Slack has a limit of 3000 characters per block - truncate if necessary
				const output = result.result.rawOutput.length > 2800 ? `\`\`\`${result.result.rawOutput.slice(0, 2800)}\n... (truncated)\`\`\`` : `\`\`\`${result.result.rawOutput}\`\`\``;

				try {
					await client.chat.postMessage({ text: `*${result.probe.continent}, ${result.probe.country}, ${result.probe.state ? `(${result.probe.state}), ` : ''}${result.probe.city}, ASN:${result.probe.asn}*\n${output}`, channel: channel_id });
				} catch (error) {
					logger.error(error);
					throw error;
				}
			}
		}
	}
};
