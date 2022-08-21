import { formatAPIError, getMeasurement, parseFlags, postMeasurement } from '@globalping/bot-utils';
import { Client, codeBlock, GatewayIntentBits, inlineCode, userMention } from 'discord.js';
import * as dotenv from 'dotenv';

import { logger } from './logger';
import { expandFlags, expandResults, getFlags } from './utils';

dotenv.config();

if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_APP_ID)
	throw new Error('DISCORD_TOKEN and DISCORD_APP_ID env variables must be set');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

if (process.env.NODE_ENV === 'production') {
	client.on('ready', () => logger.info('The bot is online'));
	client.on('warn', m => logger.warn(m));
	client.on('error', m => logger.error(m));
} else {
	client.on('ready', () => console.info('The bot is online'));
	client.on('debug', m => console.debug(m));
	client.on('warn', m => console.warn(m));
	client.on('error', m => console.error(m));
}


client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const { commandName, user } = interaction;

	if (commandName === 'globalping') {
		await interaction.deferReply();
		const flags = getFlags(interaction);
		const txtFlags = expandFlags(flags).length > 0 ? ` ${expandFlags(flags)}` : '';
		const txtCommand = `${flags.cmd} ${flags.target} from ${flags.from}${txtFlags}`;

		try {
			const measurement = parseFlags(flags);
			const { id } = await postMeasurement(measurement);
			const res = await getMeasurement(id);
			await interaction.editReply(`${userMention(user.id)}, here are the results for ${inlineCode(txtCommand)}`);
			await expandResults(res, interaction);
		} catch (error) {
			await interaction.editReply(`${userMention(user.id)}, there was an error processing your request for ${inlineCode(txtCommand)}`);
			await interaction.reply({ content: codeBlock(formatAPIError(error)) });
		}
	}
});

client.login(process.env.DISCORD_TOKEN);
