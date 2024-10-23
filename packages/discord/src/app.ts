/* eslint-disable no-await-in-loop */
import {
	buildPostMeasurements,
	formatAPIError,
	getMeasurement,
	postMeasurement,
} from '@globalping/bot-utils';
import { Client, GatewayIntentBits, inlineCode, userMention } from 'discord.js';
import * as dotenv from 'dotenv';

import { expandFlags, expandResults, getFlags, helpCmd, logger } from './utils.js';

dotenv.config();

if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_APP_ID) { throw new Error('DISCORD_TOKEN and DISCORD_APP_ID env variables must be set'); }

const client = new Client({ intents: [ GatewayIntentBits.Guilds ] });

client.on('ready', () => logger.info('Discord bot is online'));
client.on('debug', m => logger.debug(m));
client.on('warn', m => logger.warn(m));
client.on('error', m => logger.error(m));

client.on('interactionCreate', async (interaction) => {
	if (!interaction.isChatInputCommand()) { return; }

	const { commandName, user } = interaction;

	if (commandName === 'globalping') {
		await interaction.deferReply();
		let txtCommand;

		try {
			const flags = getFlags(interaction);
			logger.debug(`Flags received: ${JSON.stringify(flags)}`);

			if (flags.cmd === 'help') {
				if (typeof flags.help !== 'string') { flags.help = 'help'; }

				await interaction.editReply({ content: helpCmd(flags.help) });
			} else {
				const txtFlags
					= expandFlags(flags).length > 0 ? ` ${expandFlags(flags)}` : '';
				txtCommand = `${flags.cmd} ${flags.target} from ${flags.from}${txtFlags}`;

				const measurements = await postMeasurement(buildPostMeasurements(flags));

				for (const measurement of measurements) {
					const res = await getMeasurement(measurement.id);
					logger.debug(`Get response: ${JSON.stringify(res)}`);

					await interaction.editReply(`${userMention(user.id)}, here are the results for ${inlineCode(txtCommand)}`);

					await expandResults(res, interaction);
				}
			}
		} catch (error) {
			await interaction.editReply(`${userMention(user.id)}, there was an error processing your request for ${inlineCode(txtCommand ?? 'help')}`);

			await interaction.followUp({ content: formatAPIError(error) });
		}
	}
});

client.login(process.env.DISCORD_TOKEN);

export { client };
