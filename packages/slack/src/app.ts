import { argsToFlags, getMeasurement, parseFlags, postMeasurement } from '@globalping/bot-utils/src/index';
import { App, LogLevel } from '@slack/bolt';
import * as dotenv from 'dotenv';
import { HTTPError } from 'got';

import { expandResults } from './utils';

dotenv.config();

const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	logLevel: LogLevel.DEBUG,
});

app.command('/globalping', async ({ payload, command, ack, respond }) => {
	// Acknowledge command request
	await ack({
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
	try {
		const args = parseFlags(argsToFlags(command.text));
		const { id } = await postMeasurement(args);
		const res = await getMeasurement(id);
		const username = payload.user_name;
		await respond({
			'response_type': 'in_channel',
			'text': `@${username}, here are the results for "${command.text}"`,
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
		let msg = error;
		// Got does not expose the returned error message from the API by default
		if (error instanceof HTTPError)
			msg = `${error}\n${error.response.body}`;

		await respond({
			'response_type': 'ephemeral',
			'blocks': [
				{
					'type': 'section',
					'text': {
						'type': 'mrkdwn',
						'text': `\`\`\`${msg}\`\`\``,
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
