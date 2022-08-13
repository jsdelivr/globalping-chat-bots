import { MeasurementResponse } from '@globalping/bot-utils/src/types';

export const expandResults = (response: MeasurementResponse) => {
	const { results } = response;
	const blocks = [];
	for (const result of results) {
		blocks.push({
			'type': 'divider'
		}, {
			'type': 'section',
			'text': {
				'type': 'plain_text',
				'text': `${result.probe.continent}, ${result.probe.country}, ${result.probe.state ? `(${result.probe.state}), ` : ''}${result.probe.city}, ASN:${result.probe.asn}`,
			}
		});

		// Slack has a limit of 3000 characters per block - truncate if necessary
		const output = result.result.rawOutput.length > 2950 ? `\`\`\`${result.result.rawOutput.slice(0, 2950)}\n...\`\`\`` : `\`\`\`${result.result.rawOutput}\`\`\``;
		blocks.push({
			'type': 'section',
			'text': {
				'type': 'mrkdwn',
				'text': output

			}
		});
	}
	return blocks;
};
