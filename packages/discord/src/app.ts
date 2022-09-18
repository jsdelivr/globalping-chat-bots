import { formatAPIError, getMeasurement, help, parseFlags, postMeasurement } from '@globalping/bot-utils';
import { Client, codeBlock, GatewayIntentBits, inlineCode, userMention } from 'discord.js';
import * as dotenv from 'dotenv';

import { expandFlags, expandResults, getFlags, logger } from './utils';

dotenv.config();

if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_APP_ID)
	throw new Error('DISCORD_TOKEN and DISCORD_APP_ID env variables must be set');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });


client.on('ready', () => logger.info('Discord bot is online'));
client.on('debug', m => logger.debug(m));
client.on('warn', m => logger.warn(m));
client.on('error', m => logger.error(m));


client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const { commandName, user } = interaction;

	if (commandName === 'globalping') {
		await interaction.deferReply();
		let txtCommand;
		try {
			const flags = getFlags(interaction);
			if (flags.help) {
				await interaction.editReply({ content: codeBlock(help[flags.cmd]) });
			} else {
				const txtFlags = expandFlags(flags).length > 0 ? ` ${expandFlags(flags)}` : '';
				txtCommand = `${flags.cmd} ${flags.target} from ${flags.from}${txtFlags}`;

				const measurement = parseFlags(flags);
				const { id } = await postMeasurement(measurement);
				const res = await getMeasurement(id);
				await interaction.editReply(`${userMention(user.id)}, here are the results for ${inlineCode(txtCommand)}`);
				await expandResults(res, interaction);
			}
		} catch (error) {
			await interaction.editReply(`${userMention(user.id)}, there was an error processing your request for ${inlineCode(txtCommand ?? 'help')}`);
			await interaction.followUp({ content: codeBlock(formatAPIError(error)) });
		}
	}
});


client.login(process.env.DISCORD_TOKEN);

export { client };
