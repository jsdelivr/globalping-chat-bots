import { REST } from '@discordjs/rest';
import { ALLOWED_DNS_PROTOCOLS, ALLOWED_DNS_TYPES, ALLOWED_HTTP_METHODS, ALLOWED_HTTP_PROTOCOLS, ALLOWED_MTR_PROTOCOLS, ALLOWED_TRACE_PROTOCOLS } from '@globalping/bot-utils/src/types';
import { Routes, SlashCommandBuilder } from 'discord.js';
import * as dotenv from 'dotenv';


dotenv.config();

if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_APP_ID)
	throw new Error('DISCORD_TOKEN and APP_ID env variables must be set');

const choiceMap = (arr: string[]) => arr.map(item => ({ name: item, value: item }));

// Only needs ot be run once whenever bot is registered with server
const commands = [
	new SlashCommandBuilder().setName('globalping').setDescription('Query Globalping network')
		// Ping
		.addSubcommand(subcommand => subcommand.setName('ping').setDescription('Use ping command')
			.addStringOption(option => option.setName('target').setDescription('Target to ping').setRequired(true))
			.addStringOption(option => option.setName('from').setDescription('Probe locations').setRequired(true))
			.addBooleanOption(option => option.setName('help').setDescription('Help information').setRequired(false))
			.addNumberOption(option => option.setName('limit').setDescription('Number of probes').setRequired(false))
			.addNumberOption(option => option.setName('packets').setDescription('Number of packets').setRequired(false)))
		// Traceroute
		.addSubcommand(subcommand => subcommand.setName('traceroute').setDescription('Use traceroute command')
			.addStringOption(option => option.setName('target').setDescription('Target to traceroute').setRequired(true))
			.addStringOption(option => option.setName('from').setDescription('Probe locations').setRequired(true))
			.addBooleanOption(option => option.setName('help').setDescription('Help information').setRequired(false))
			.addNumberOption(option => option.setName('limit').setDescription('Number of probes').setRequired(false))
			.addStringOption(option => option.setName('protocol').setDescription('Protocol to use').setRequired(false)
				.addChoices(...choiceMap([...ALLOWED_TRACE_PROTOCOLS])))
			.addNumberOption(option => option.setName('port').setDescription('Port to use').setRequired(false)))
		.addSubcommand(subcommand => subcommand.setName('dns').setDescription('Use dns command')
			.addStringOption(option => option.setName('target').setDescription('Target to query').setRequired(true))
			.addStringOption(option => option.setName('from').setDescription('Probe locations').setRequired(true))
			.addBooleanOption(option => option.setName('help').setDescription('Help information').setRequired(false))
			.addNumberOption(option => option.setName('limit').setDescription('Number of probes').setRequired(false))
			.addStringOption(option => option.setName('query').setDescription('Query type').setRequired(false)
				.addChoices(...choiceMap([...ALLOWED_DNS_TYPES])))
			.addNumberOption(option => option.setName('port').setDescription('Port to use').setRequired(false))
			.addStringOption(option => option.setName('protocol').setDescription('Protocol to use').setRequired(false)
				.addChoices(...choiceMap([...ALLOWED_DNS_PROTOCOLS])))
			.addStringOption(option => option.setName('resolver').setDescription('Resolver to use').setRequired(false))
			.addBooleanOption(option => option.setName('trace').setDescription('Trace route').setRequired(false)))
		.addSubcommand(subcommand => subcommand.setName('mtr').setDescription('Use mtr command')
			.addStringOption(option => option.setName('target').setDescription('Target to query').setRequired(true))
			.addStringOption(option => option.setName('from').setDescription('Probe locations').setRequired(true))
			.addBooleanOption(option => option.setName('help').setDescription('Help information').setRequired(false))
			.addNumberOption(option => option.setName('limit').setDescription('Number of probes').setRequired(false))
			.addNumberOption(option => option.setName('port').setDescription('Port to use').setRequired(false))
			.addNumberOption(option => option.setName('packets').setDescription('Number of packets').setRequired(false))
			.addStringOption(option => option.setName('protocol').setDescription('Protocol to use').setRequired(false)
				.addChoices(...choiceMap([...ALLOWED_MTR_PROTOCOLS]))))
		.addSubcommand(subcommand => subcommand.setName('http').setDescription('Use http command')
			.addStringOption(option => option.setName('target').setDescription('Target to query').setRequired(true))
			.addStringOption(option => option.setName('from').setDescription('Probe locations').setRequired(true))
			.addBooleanOption(option => option.setName('help').setDescription('Help information').setRequired(false))
			.addNumberOption(option => option.setName('limit').setDescription('Number of probes').setRequired(false))
			.addNumberOption(option => option.setName('port').setDescription('Port to use').setRequired(false))
			.addStringOption(option => option.setName('protocol').setDescription('Protocol to use').setRequired(false)
				.addChoices(...choiceMap([...ALLOWED_HTTP_PROTOCOLS])))
			.addStringOption(option => option.setName('method').setDescription('Method to use').setRequired(false)
				.addChoices(...choiceMap([...ALLOWED_HTTP_METHODS])))
			.addStringOption(option => option.setName('path').setDescription('Pathname').setRequired(false))
			.addStringOption(option => option.setName('query').setDescription('URL query').setRequired(false))
			.addStringOption(option => option.setName('host').setDescription('Hostname').setRequired(false))
			.addStringOption(option => option.setName('header').setDescription('Headers').setRequired(false)))
		.addSubcommand(subcommand => subcommand.setName('help').setDescription('Help command'))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

rest.put(Routes.applicationCommands(process.env.DISCORD_APP_ID), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
