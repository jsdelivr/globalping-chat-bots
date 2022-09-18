/* eslint-disable no-await-in-loop */
import { argsToFlags, errorParse, formatAPIError, getMeasurement, parseFlags, postMeasurement } from '@globalping/bot-utils';
import { helpCmd } from '@globalping/bot-utils/src/utils';
import { App, LogLevel } from '@slack/bolt';
import * as dotenv from 'dotenv';

import * as database from './db';
import { routes } from './routes';
import { expandResults, logger } from './utils';

dotenv.config();

if (!process.env.SLACK_SIGNING_SECRET || !process.env.SLACK_CLIENT_ID || !process.env.SLACK_CLIENT_SECRET || !process.env.SLACK_STATE_SECRET)
	throw new Error('SLACK_SIGNING_SECRET, SLACK_CLIENT_ID, SLACK_CLIENT_SECRET and SLACK_STATE_SECRET environment variable must be set for production');

if (!process.env.DB_HOST || !process.env.DB_PORT || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_DATABASE)
	throw new Error('DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_DATABASE environment variable must be set for production');

// We run a discord instance in the slack express receiver
if (!process.env.DISCORD_TOKEN && !process.env.DISCORD_APP_ID)
	throw new Error('DISCORD_TOKEN and DISCORD_APP_ID environment variable must be set for production.');

const baseAppConfig = {
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	clientId: process.env.SLACK_CLIENT_ID,
	clientSecret: process.env.SLACK_CLIENT_SECRET,
	stateSecret: process.env.SLACK_STATE_SECRET,
	scopes: ['chat:write', 'chat:write.public', 'commands'],
	logLevel: LogLevel.INFO,
	logger: {
		debug: (...msgs: unknown[]) => { logger.debug(JSON.stringify(msgs)); },
		info: (...msgs: unknown[]) => { logger.info(JSON.stringify(msgs)); },
		warn: (...msgs: unknown[]) => { logger.warn(JSON.stringify(msgs)); },
		error: (...msgs: unknown[]) => {
			for (const msg of msgs) {
				logger.error(JSON.stringify(errorParse(msg as Error)));
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
};

let app: App;
if (process.env.NODE_ENV === 'production') {
	app = new App(baseAppConfig);
} else {
	baseAppConfig.logLevel = LogLevel.DEBUG;
	app = new App(baseAppConfig);
}

app.command('/globalping', async ({ payload, command, ack, respond, say }) => {
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
			const measurements = await postMeasurement(flags);
			await respond({ text: '```Processing request...```' });
			logger.debug(`Post response: ${JSON.stringify(measurements)}`);

			let first = true;
			for (const measurement of measurements) {
				const res = await getMeasurement(measurement.id);
				logger.debug(`Get response: ${JSON.stringify(res)}`);
				// Only want this to run on first measurement
				if (first) {
					await say({ text: `<@${payload.user_id}>, here are the results for \`${command.text}\`` });
					first = false;
				}
				await expandResults(res, say);
			}
		}
	} catch (error) {
		await respond({ text: `Unable to successfully process command \`${command.text}\`.\n${formatAPIError(error)}` });
	}
});

// Needed until this is resolved - https://github.com/slackapi/bolt-js/issues/1203
app.event('app_uninstalled', async ({ context }) => {
	// @ts-ignore - They are pretty much the same type
	await database.installationStore.deleteInstallation(context);
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
		logger.info('⚡️ Bolt app is running! [DEVELOPMENT]');
	}
})();
