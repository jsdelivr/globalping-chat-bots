import { argsToFlags, formatAPIError, getMeasurement, logger, parseFlags, postMeasurement } from '@globalping/bot-utils';
import { App, LogLevel } from '@slack/bolt';
import { client } from 'discord-bot/src/app';
import * as dotenv from 'dotenv';

import * as database from './db';
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
		logLevel: LogLevel.INFO,
		logger: {
			debug: (...msgs) => { logger.debug(JSON.stringify(msgs)); },
			info: (...msgs) => { logger.info(JSON.stringify(msgs)); },
			warn: (...msgs) => { logger.warn(JSON.stringify(msgs)); },
			error: (...msgs) => { logger.error(JSON.stringify(msgs)); },
			setLevel: () => { },
			getLevel: () => logger.level as LogLevel,
			setName: () => { },
		},
		installationStore: {
			storeInstallation: async (installation) => {
				// Bolt will pass your handler an installation object
				// Change the lines below so they save to your database
				if (installation.isEnterpriseInstall && installation.enterprise !== undefined) {
					// handle storing org-wide app installation
					return database.setInstallation(installation.enterprise.id, installation);
				}
				if (installation.team !== undefined) {
					// single team app installation
					return database.setInstallation(installation.team.id, installation);
				}
				throw new Error('Failed saving installation data to installationStore');
			},
			fetchInstallation: async (installQuery) => {
				// Bolt will pass your handler an installQuery object
				// Change the lines below so they fetch from your database
				if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
					// handle org wide app installation lookup
					return database.getInstallation(installQuery.enterpriseId);
				}
				if (installQuery.teamId !== undefined) {
					// single team app installation lookup
					return database.getInstallation(installQuery.teamId);
				}
				throw new Error('Failed fetching installation');
			},
			deleteInstallation: async (installQuery) => {
				// Bolt will pass your handler  an installQuery object
				// Change the lines below so they delete from your database
				if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
					// org wide app installation deletion
					return database.deleteInstallation(installQuery.enterpriseId);
				}
				if (installQuery.teamId !== undefined) {
					// single team app installation deletion
					return database.deleteInstallation(installQuery.teamId);
				}
				throw new Error('Failed to delete installation');
			},
		},
		installerOptions: {
			directInstall: true,
		},
		customRoutes: [
			{
				path: '/health',
				method: ['GET'],
				handler: async (_req, res) => {
					try {
						// Check if db is accessible
						await database.knex.raw('select 1+1 as result');
						if (!client.ws.ping) {
							throw new Error('Discord bot down.');
						}

						res.writeHead(200);
						res.end('OK');
					} catch (error) {
						res.writeHead(503);
						res.end(error);
					}
				},
			},
		],
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
