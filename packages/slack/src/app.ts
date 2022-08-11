import { getMeasurement, parseArgs, postMeasurement } from '@globalping/bot-utils/src/index';
import { App, LogLevel } from '@slack/bolt';
import * as dotenv from 'dotenv';


dotenv.config();

const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	logLevel: LogLevel.DEBUG,
});

app.command('/globalping', async ({ payload, command, ack, say }) => {
	// Acknowledge command request
	await ack();
	const args = parseArgs(command.text);
	if ('error' in args) {
		await say({
			'blocks': [
				{
					'type': 'section',
					'text': {
						'type': 'mrkdwn',
						'text': `*Error*\n\`\`\`${args.error}\`\`\``,
					}
				}
			]
		});;
	} else {
		const { id } = await postMeasurement(args);
		const res = await getMeasurement(id);
		const username = payload.user_name;
		await say({
			'blocks': [
				{
					'type': 'section',
					'text': {
						'type': 'mrkdwn',
						'text': `@${username}, here are the results for \`${command.text}\`\n${res[0].results[0].probe.city}`
					}
				},
				{
					'type': 'divider'
				},
				{
					'type': 'section',
					'text': {
						'type': 'mrkdwn',
						'text': `\`\`\`${res[res.length - 1].results[0].result.rawOutput}\`\`\``
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
