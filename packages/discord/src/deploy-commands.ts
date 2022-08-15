import { REST } from '@discordjs/rest';
import { Routes, SlashCommandBuilder } from 'discord.js';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DISCORD_TOKEN || !process.env.APP_ID)
	throw new Error('DISCORD_TOKEN and APP_ID env variables must be set');

// Only needs ot be run once whenever bot is registered with server
const commands = [
	new SlashCommandBuilder().setName('globalping').setDescription('Query Globalping network')
		.addSubcommand(subcommand => subcommand.setName('ping').setDescription('Use ping command')
			.addStringOption(option => option.setName('target')
				.setDescription('Target to ping')
				.setRequired(true))
			.addStringOption(option => option.setName('from').setDescription('Probe locations').setRequired(true))
			.addNumberOption(option => option.setName('limit').setDescription('Number of probes').setRequired(false))
			.addNumberOption(option => option.setName('packets').setDescription('Number of packets').setRequired(false))
		)
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

rest.put(Routes.applicationCommands(process.env.APP_ID), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
