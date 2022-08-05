import { parseArgs } from '@globalping/bot-utils/src/index'; // Temp import
import { App, LogLevel } from '@slack/bolt';
import * as dotenv from 'dotenv';


dotenv.config();

const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	logLevel: LogLevel.DEBUG,
});

app.command('/globalping', async ({ command, ack, respond }) => {
	// Acknowledge command request
	await ack();

	await respond(`${JSON.stringify(parseArgs(command.text.split(' ')))}`);
});

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	// Start your app
	await app.start(Number(process.env.PORT) || 3000);

	console.log('⚡️ Bolt app is running!');
})();
