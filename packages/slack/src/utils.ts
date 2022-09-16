/* eslint-disable no-await-in-loop */
import { MeasurementResponse } from '@globalping/bot-utils/src/types';
import type { RespondFn } from '@slack/bolt';

export const expandResults = async (response: MeasurementResponse, respond: RespondFn) => {
	const { results } = response;
	for (const result of results) {
		await respond({ text: `*${result.probe.continent}, ${result.probe.country}, ${result.probe.state ? `(${result.probe.state}), ` : ''}${result.probe.city}, ASN:${result.probe.asn}*`, response_type: 'in_channel' });

		// Slack has a limit of 3000 characters per block - truncate if necessary
		const output = result.result.rawOutput.length > 2800 ? `\`\`\`${result.result.rawOutput.slice(0, 2800)}\n... (truncated)\`\`\`` : `\`\`\`${result.result.rawOutput}\`\`\``;
		await respond({ text: output, response_type: 'in_channel' });
	}
};
