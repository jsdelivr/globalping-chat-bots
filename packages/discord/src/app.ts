import { getMeasurement, parseFlags, postMeasurement } from '@globalping/bot-utils/src/index';
import { Client, codeBlock, GatewayIntentBits, inlineCode, userMention } from 'discord.js';
import * as dotenv from 'dotenv';

import { logger } from './logger';
import { expandResults, getFlags } from './utils';

dotenv.config();

if (!process.env.DISCORD_TOKEN || !process.env.APP_ID)
	throw new Error('DISCORD_TOKEN and APP_ID env variables must be set');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => logger.info('The bot is online'));
client.on('debug', m => logger.debug(m));
client.on('warn', m => logger.warn(m));
client.on('error', m => logger.error(m));


client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const { commandName, user } = interaction;

	if (commandName === 'globalping') {
		try {
			await interaction.deferReply();
			const flags = getFlags(interaction);
			const measurement = parseFlags(flags);
			const { id } = await postMeasurement(measurement);
			const res = await getMeasurement(id);
			await interaction.editReply(`${userMention(user.id)}, here are the results for ${inlineCode(`${flags.cmd} ${flags.target} from ${flags.from}`)}`);
			await expandResults(res, interaction);
		} catch (error) {
			await interaction.editReply(`${userMention(user.id)}, there was an error processing your request`);
			await interaction.followUp({ content: codeBlock(String(error)), fetchReply: false });
		}
	}
});

client.login(process.env.DISCORD_TOKEN);

