import { REST } from '@discordjs/rest';
import {
	ALLOWED_DNS_PROTOCOLS,
	ALLOWED_DNS_TYPES,
	ALLOWED_HTTP_METHODS,
	ALLOWED_HTTP_PROTOCOLS,
	ALLOWED_MTR_PROTOCOLS,
	ALLOWED_QUERY_TYPES,
	ALLOWED_TRACE_PROTOCOLS,
} from '@globalping/bot-utils';
import { Routes, SlashCommandBuilder } from 'discord.js';
import { Config } from './types.js';

const choiceMap = (arr: string[]) => arr.map(item => ({ name: item, value: item }));

// Only needs to be run once whenever bot is registered with server
export const deployCommands = (config: Config) => {
	const commands = [
		new SlashCommandBuilder()
			.setName('globalping')
			.setDescription('Query Globalping network')
			// Ping
			.addSubcommand(subcommand => subcommand
				.setName('ping')
				.setDescription('Use ping command')
				.addStringOption(option => option
					.setName('target')
					.setDescription('Target to ping')
					.setRequired(true))
				.addStringOption(option => option
					.setName('from')
					.setDescription('Probe locations')
					.setRequired(true))
				.addNumberOption(option => option
					.setName('limit')
					.setDescription('Number of probes')
					.setRequired(false))
				.addNumberOption(option => option
					.setName('packets')
					.setDescription('Number of packets')
					.setRequired(false)))
			// Traceroute
			.addSubcommand(subcommand => subcommand
				.setName('traceroute')
				.setDescription('Use traceroute command')
				.addStringOption(option => option
					.setName('target')
					.setDescription('Target to traceroute')
					.setRequired(true))
				.addStringOption(option => option
					.setName('from')
					.setDescription('Probe locations')
					.setRequired(true))
				.addNumberOption(option => option
					.setName('limit')
					.setDescription('Number of probes')
					.setRequired(false))
				.addStringOption(option => option
					.setName('protocol')
					.setDescription('Protocol to use')
					.setRequired(false)
					.addChoices(...choiceMap([ ...ALLOWED_TRACE_PROTOCOLS ])))
				.addNumberOption(option => option
					.setName('port')
					.setDescription('Port to use')
					.setRequired(false)))
			.addSubcommand(subcommand => subcommand
				.setName('dns')
				.setDescription('Use dns command')
				.addStringOption(option => option
					.setName('target')
					.setDescription('Target to query')
					.setRequired(true))
				.addStringOption(option => option
					.setName('from')
					.setDescription('Probe locations')
					.setRequired(true))
				.addNumberOption(option => option
					.setName('limit')
					.setDescription('Number of probes')
					.setRequired(false))
				.addStringOption(option => option
					.setName('query')
					.setDescription('Query type')
					.setRequired(false)
					.addChoices(...choiceMap([ ...ALLOWED_DNS_TYPES ])))
				.addNumberOption(option => option
					.setName('port')
					.setDescription('Port to use')
					.setRequired(false))
				.addStringOption(option => option
					.setName('protocol')
					.setDescription('Protocol to use')
					.setRequired(false)
					.addChoices(...choiceMap([ ...ALLOWED_DNS_PROTOCOLS ])))
				.addStringOption(option => option
					.setName('resolver')
					.setDescription('Resolver to use')
					.setRequired(false))
				.addBooleanOption(option => option
					.setName('trace')
					.setDescription('Trace route')
					.setRequired(false)))
			.addSubcommand(subcommand => subcommand
				.setName('mtr')
				.setDescription('Use mtr command')
				.addStringOption(option => option
					.setName('target')
					.setDescription('Target to query')
					.setRequired(true))
				.addStringOption(option => option
					.setName('from')
					.setDescription('Probe locations')
					.setRequired(true))
				.addNumberOption(option => option
					.setName('limit')
					.setDescription('Number of probes')
					.setRequired(false))
				.addNumberOption(option => option
					.setName('port')
					.setDescription('Port to use')
					.setRequired(false))
				.addNumberOption(option => option
					.setName('packets')
					.setDescription('Number of packets')
					.setRequired(false))
				.addStringOption(option => option
					.setName('protocol')
					.setDescription('Protocol to use')
					.setRequired(false)
					.addChoices(...choiceMap([ ...ALLOWED_MTR_PROTOCOLS ]))))
			.addSubcommand(subcommand => subcommand
				.setName('http')
				.setDescription('Use http command')
				.addStringOption(option => option
					.setName('target')
					.setDescription('Target to query')
					.setRequired(true))
				.addStringOption(option => option
					.setName('from')
					.setDescription('Probe locations')
					.setRequired(true))
				.addNumberOption(option => option
					.setName('limit')
					.setDescription('Number of probes')
					.setRequired(false))
				.addNumberOption(option => option
					.setName('port')
					.setDescription('Port to use')
					.setRequired(false))
				.addStringOption(option => option
					.setName('protocol')
					.setDescription('Protocol to use')
					.setRequired(false)
					.addChoices(...choiceMap([ ...ALLOWED_HTTP_PROTOCOLS ])))
				.addStringOption(option => option
					.setName('method')
					.setDescription('Method to use')
					.setRequired(false)
					.addChoices(...choiceMap([ ...ALLOWED_HTTP_METHODS ])))
				.addStringOption(option => option
					.setName('path')
					.setDescription('Pathname')
					.setRequired(false))
				.addStringOption(option => option
					.setName('query')
					.setDescription('URL query')
					.setRequired(false))
				.addStringOption(option => option
					.setName('host')
					.setDescription('Hostname')
					.setRequired(false))
				.addStringOption(option => option
					.setName('header')
					.setDescription('Headers')
					.setRequired(false)))
			.addSubcommand(subcommand => subcommand
				.setName('help')
				.setDescription('Help command')
				.addStringOption(option => option
					.setName('command')
					.setDescription('Command to get help for')
					.setRequired(false)
					.addChoices(...choiceMap([ ...ALLOWED_QUERY_TYPES ])))),
	].map(command => command.toJSON());

	const rest = new REST({ version: '10' }).setToken(config.discordToken);

	return rest.put(Routes.applicationCommands(config.discordAppId), {
		body: commands,
	});
};
