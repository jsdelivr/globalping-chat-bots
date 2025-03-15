import { scopedLogger } from '@globalping/bot-utils';
import { deployCommands, DeployCommandsConfig } from 'discord-bot';
import * as dotenv from 'dotenv';

dotenv.config();

(async () => {
	const logger = scopedLogger('main');
	const config: DeployCommandsConfig = {
		discordToken: process.env.DISCORD_TOKEN as string,
		discordAppId: process.env.DISCORD_APP_ID as string,
	};

	if (!config.discordToken || !config.discordAppId) {
		logger.error('DISCORD_TOKEN and DISCORD_APP_ID environment variables must be set');

		process.exit(1);
	}

	try {
		await deployCommands(config);
		logger.info('Successfully registered application commands.');
	} catch (error) {
		logger.error('Failed to register application commands.', error);
	}
})();
