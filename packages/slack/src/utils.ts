/* eslint-disable no-await-in-loop */
import { MeasurementResponse } from '@globalping/bot-utils/src/types';
import type { SlashCommand } from '@slack/bolt';

export const expandResults = async (response: MeasurementResponse, payload: SlashCommand, client: any) => {
	const { results } = response;
	for (const result of results) {
		await client.chat.postMessage({ text: `${result.probe.continent}, ${result.probe.country}, ${result.probe.state ? `(${result.probe.state}), ` : ''}${result.probe.city}, ASN:${result.probe.asn}`, channel: payload.channel_id });

		// Slack has a limit of 3000 characters per block - truncate if necessary
		const output = result.result.rawOutput.length > 2800 ? `\`\`\`${result.result.rawOutput.slice(0, 2800)}\n... (truncated)\`\`\`` : `\`\`\`${result.result.rawOutput}\`\`\``;
		await client.chat.postMessage({ text: output, channel: payload.channel_id });
	}
};
