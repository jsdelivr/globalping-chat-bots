import { argsToFlags, errorParse, formatAPIError, getMeasurement, parseFlags, postMeasurement, slackLogger as logger } from '@globalping/bot-utils';
import { helpCmd } from '@globalping/bot-utils/src/utils';
import { App, LogLevel } from '@slack/bolt';
import * as dotenv from 'dotenv';

import { defaultCallbackFailure, defaultCallbackSuccess } from './callbacks';
import * as database from './db';
import { routes } from './routes';
import { expandResults } from './utils';

dotenv.config();

let app: App;
if (process.env.NODE_ENV === 'production') {
	if (!process.env.SLACK_SIGNING_SECRET || !process.env.SLACK_CLIENT_ID || !process.env.SLACK_CLIENT_SECRET || !process.env.SLACK_STATE_SECRET)
		throw new Error('SLACK_SIGNING_SECRET, SLACK_CLIENT_ID, SLACK_CLIENT_SECRET and SLACK_STATE_SECRET environment variable must be set for production');

	if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_DATABASE)
		throw new Error('DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_DATABASE environment variable must be set for production');

	// We run a discord instance in the slack express receiver
	if (!process.env.DISCORD_TOKEN && !process.env.DISCORD_APP_ID)
		throw new Error('DISCORD_TOKEN and DISCORD_APP_ID environment variable must be set for production.');


	app = new App({

		signingSecret: process.env.SLACK_SIGNING_SECRET,
		clientId: process.env.SLACK_CLIENT_ID,
		clientSecret: process.env.SLACK_CLIENT_SECRET,
		stateSecret: process.env.SLACK_STATE_SECRET,
		scopes: ['chat:write', 'chat:write.public', 'commands'],
		logLevel: LogLevel.DEBUG,
		logger: {
			debug: (...msgs) => { logger.debug(JSON.stringify(msgs)); },
			info: (...msgs) => { logger.info(JSON.stringify(msgs)); },
			warn: (...msgs) => { logger.warn(JSON.stringify(msgs)); },
			error: (...msgs) => {
				for (const msg of msgs) {
					logger.error(JSON.stringify(errorParse(msg)));
				}
			},
			setLevel: () => { },
			getLevel: () => logger.level as LogLevel,
			setName: () => { },
		},
		installationStore: database.installationStore,
		installerOptions: {
			directInstall: true,
		},
		customRoutes: routes
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
	logger.debug(`Calling command ${command.text} with token: ${payload.token}`);
	try {
		const args = argsToFlags(command.text);

		if (args.help) {
			await respond({ text: helpCmd(args.cmd) });
		} else {
			const flags = parseFlags(args);
			// We post measurement first to catch any validation errors before committing to processing request message
			const { id } = await postMeasurement(flags);
			await respond({ text: '```Processing request...```', response_type: 'ephemeral' });

			const res = await getMeasurement(id);
			await respond({ text: `<@${payload.user_id}>, here are the results for \`${command.text}\``, response_type: 'in_channel' });
			await expandResults(res, respond);
		}
	} catch (error) {
		await respond({ text: `Unable to successfully process command \`${command.text}\`.\n\`\`\`${formatAPIError(error)}\`\`\``, response_type: 'ephemeral' });
	}
});

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
	// Moved here due to top-level await restrictions
	if (process.env.NODE_ENV === 'production' && !(await database.checkTables()))
		throw new Error('"installations" table does not exist in database! Run "pnpm run setup-db" to create the necessary table.');

	// Start your app
	await app.start(Number(process.env.PORT) || 3000);
	if (process.env.NODE_ENV === 'production') {
		logger.info('Slack bot is online [PRODUCTION]');
	} else {
		console.log('⚡️ Bolt app is running! [DEVELOPMENT]');
	}
})();
