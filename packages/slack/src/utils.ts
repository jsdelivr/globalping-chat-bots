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
		}, {
			'type': 'section',
			'text': {
				'type': 'mrkdwn',
				'text': `\`\`\`${result.result.rawOutput}\`\`\``

			}
		});
	}
	return blocks;
};
