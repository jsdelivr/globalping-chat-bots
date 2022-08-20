import { getMeasurement, parseFlags, postMeasurement } from '@globalping/bot-utils/src/index';
import { Client, codeBlock, GatewayIntentBits, inlineCode, userMention } from 'discord.js';
import * as dotenv from 'dotenv';
import { HTTPError } from 'got';

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
		try {
			await interaction.deferReply();
			const flags = getFlags(interaction);
			const measurement = parseFlags(flags);
			const { id } = await postMeasurement(measurement);
			const res = await getMeasurement(id);
			const txtFlags = expandFlags(flags).length > 0 ? ` ${expandFlags(flags)}` : '';
			await interaction.editReply(`${userMention(user.id)}, here are the results for ${inlineCode(`${flags.cmd} ${flags.target} from ${flags.from}${txtFlags}`)}`);
			await expandResults(res, interaction);
		} catch (error) {
			let msg = error;
			// Got does not expose the returned error message from the API by default
			if (error instanceof HTTPError)
				msg = `${error}\n${error.response.body}`;

			await interaction.editReply(`${userMention(user.id)}, there was an error processing your request`);
			await interaction.followUp({ content: codeBlock(String(msg)), fetchReply: false });
		}
	}
});

client.login(process.env.DISCORD_TOKEN);

