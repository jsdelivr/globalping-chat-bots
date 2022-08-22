import { argsToFlags, formatAPIError, getMeasurement, parseFlags, postMeasurement } from '@globalping/bot-utils';
import { App, LogLevel } from '@slack/bolt';
import * as dotenv from 'dotenv';

import { expandResults } from './utils';

dotenv.config();

let app: App;
if (process.env.NODE_ENV === 'production') {
	if (!process.env.SLACK_SIGNING_SECRET || !process.env.SLACK_CLIENT_ID || !process.env.SLACK_CLIENT_SECRET || !process.env.SLACK_STATE_SECRET)
		throw new Error('SLACK_SIGNING_SECRET, SLACK_CLIENT_ID, SLACK_CLIENT_SECRET and SLACK_STATE_SECRET environment variable must be set for production');

	app = new App({
		logLevel: LogLevel.INFO,
		signingSecret: process.env.SLACK_SIGNING_SECRET,
		clientId: process.env.SLACK_CLIENT_ID,
		clientSecret: process.env.SLACK_CLIENT_SECRET,
		stateSecret: process.env.SLACK_STATE_SECRET,
		scopes: ['chat:write', 'chat:write.public', 'commands'],
		installerOptions: {
			directInstall: true,
		},
	});
} else {
	if (!process.env.SLACK_BOT_TOKEN && !process.env.SLACK_SIGNING_SECRET)
		throw new Error('SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET environment variable must be set for development');

	app = new App({
		token: process.env.SLACK_BOT_TOKEN,
		signingSecret: process.env.SLACK_SIGNING_SECRET,
		logLevel: LogLevel.DEBUG
	});
}

app.command('/globalping', async ({ payload, command, ack, respond }) => {
	// Acknowledge command request
	await ack();
	try {
		const args = parseFlags(argsToFlags(command.text));
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
		await respond({
			'response_type': 'ephemeral',
			'blocks': [
				{
					'type': 'section',
					'text': {
						'type': 'mrkdwn',
						'text': `\`\`\`${formatAPIError(error)}\`\`\``,
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
	if (process.env.NODE_ENV === 'production') {
		console.log('⚡️ Bolt app is running! [PRODUCTION]');
	} else {
		console.log('⚡️ Bolt app is running! [DEVELOPMENT]');
	}
})();



