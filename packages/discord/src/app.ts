import { getMeasurement, parseArgs, postMeasurement } from '@globalping/bot-utils/src/index';
import { Client, GatewayIntentBits, userMention } from 'discord.js';
import * as dotenv from 'dotenv';

import { getOptions } from './utils';


dotenv.config();

if (!process.env.DISCORD_TOKEN || !process.env.APP_ID)
	throw new Error('DISCORD_TOKEN and APP_ID env variables must be set');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
	console.log('Client booted!');
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const { commandName, user } = interaction;

	if (commandName === 'globalping') {
		await interaction.deferReply();
		const options = getOptions(interaction);
		await interaction.editReply(`${userMention(user.id)} Pong!`);
	}
});

client.login(process.env.DISCORD_TOKEN);

