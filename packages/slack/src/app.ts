import { getMeasurement, parseArgs, postMeasurement } from '@globalping/bot-utils/src/index';
import { App, LogLevel } from '@slack/bolt';
import * as dotenv from 'dotenv';

import { expandResults } from './utils';

dotenv.config();

const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	logLevel: LogLevel.DEBUG,
});

app.command('/globalping', async ({ payload, command, ack, respond }) => {
	// Acknowledge command request
	await ack();
	try {
		const args = parseArgs(command.text);
		await respond({
			'response_type': 'ephemeral',
			'text': 'Processing request...',
			'blocks': [
				{
					'type': 'section',
					'text': {
						'type': 'mrkdwn',
						'text': '```Processing request...```',
					}
				}
			]
		});

		const { id } = await postMeasurement(args);
		console.log(id);
		const res = await getMeasurement(id);
		const username = payload.user_name;
		await respond({
			'response_type': 'in_channel',
			'text': `@${username}, here are the results for "${command.text}", ${res.results[0].probe.city}`,
			'blocks': [
				{
					'type': 'section',
					'text': {
						'type': 'mrkdwn',
						'text': `@${username}, here are the results for \`${command.text}\``
					}
				},
				...expandResults(res)
			]
		});
	} catch (error) {
		await respond({
			'response_type': 'ephemeral',
			'blocks': [
				{
					'type': 'section',
					'text': {
						'type': 'mrkdwn',
						'text': `*Error*\n\`\`\`${error}\`\`\``,
					}
				}
			]
		});
	}
});

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	// Start your app
	await app.start(Number(process.env.PORT) || 3000);

	console.log('⚡️ Bolt app is running!');
})();
