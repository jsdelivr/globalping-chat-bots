/* eslint-disable no-await-in-loop */
import { loggerInit } from '@globalping/bot-utils';
import { MeasurementResponse } from '@globalping/bot-utils/src/types';
import type { SayFn } from '@slack/bolt';
import * as dotenv from 'dotenv';

dotenv.config();

export const logger = loggerInit('slack', process.env.LOG_LEVEL ?? 'info');

export const expandResults = async (response: MeasurementResponse, say: SayFn) => {
	const { results } = response;
	for (const result of results) {
		await say({ text: `*${result.probe.continent}, ${result.probe.country}, ${result.probe.state ? `(${result.probe.state}), ` : ''}${result.probe.city}, ASN:${result.probe.asn}*` });

		// Slack has a limit of 3000 characters per block - truncate if necessary
		const output = result.result.rawOutput.length > 2800 ? `\`\`\`${result.result.rawOutput.slice(0, 2800)}\n... (truncated)\`\`\`` : `\`\`\`${result.result.rawOutput}\`\`\``;
		await say({ text: output });
	}
};
