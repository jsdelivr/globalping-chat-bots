import { REST } from '@discordjs/rest';
import {
	ALLOWED_DNS_PROTOCOLS,
	ALLOWED_DNS_TYPES,
	ALLOWED_HTTP_METHODS,
	ALLOWED_HTTP_PROTOCOLS,
	ALLOWED_MTR_PROTOCOLS,
	ALLOWED_QUERY_TYPES,
	ALLOWED_TRACE_PROTOCOLS,
	AuthSubcommand,
	dnsHelpTexts,
	dnsFlagsMap,
	globalFlagsMap,
	helpHelpTexts,
	httpFlagsMap,
	mtrHelpTexts,
	mtrFlagsMap,
	pingHelpTexts,
	pingFlagsMap,
	tracerouteHelpTexts,
	authHelpTexts,
	authLoginHelpTexts,
	authLogoutHelpTexts,
	authStatusHelpTexts,
	limitsHelpTexts,
	httpHelpTexts,
	tracerouteFlagsMap,
	otherFlagsMap,
	HelpFlag,
} from '@globalping/bot-utils';
import { Routes, SlashCommandBuilder } from 'discord.js';
import { DeployCommandsConfig } from './types.js';

const choiceMap = (arr: string[]) => arr.map(item => ({ name: item, value: item }));

// Only needs to be run once whenever bot is registered with server
export const deployCommands = (config: DeployCommandsConfig) => {
	const commands = [
		new SlashCommandBuilder()
			.setName('globalping')
			.setDescription('Query Globalping network')
			// Ping
			.addSubcommand(subcommand => subcommand
				.setName(pingHelpTexts.name)
				.setDescription(pingHelpTexts.shortDescription)
				.addStringOption(option => option
					.setName((otherFlagsMap.get('target') as HelpFlag).name)
					.setDescription((otherFlagsMap.get('target') as HelpFlag).shortDescription)
					.setRequired(true))
				.addStringOption(option => option
					.setName((globalFlagsMap.get('from') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('from') as HelpFlag).shortDescription)
					.setRequired(false))
				.addNumberOption(option => option
					.setName((globalFlagsMap.get('limit') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('limit') as HelpFlag).shortDescription)
					.setRequired(false))
				.addNumberOption(option => option
					.setName((pingFlagsMap.get('packets') as HelpFlag).name)
					.setDescription((pingFlagsMap.get('packets') as HelpFlag).shortDescription)
					.setRequired(false))
				.addBooleanOption(option => option
					.setName((globalFlagsMap.get('share') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('share') as HelpFlag).shortDescription)
					.setRequired(false))
				.addBooleanOption(option => option
					.setName((globalFlagsMap.get('latency') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('latency') as HelpFlag).shortDescription)
					.setRequired(false)))
			// Traceroute
			.addSubcommand(subcommand => subcommand
				.setName(tracerouteHelpTexts.name)
				.setDescription(tracerouteHelpTexts.shortDescription)
				.addStringOption(option => option
					.setName((otherFlagsMap.get('target') as HelpFlag).name)
					.setDescription((otherFlagsMap.get('target') as HelpFlag).shortDescription)
					.setRequired(true))
				.addStringOption(option => option
					.setName((globalFlagsMap.get('from') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('from') as HelpFlag).shortDescription)
					.setRequired(false))
				.addNumberOption(option => option
					.setName((globalFlagsMap.get('limit') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('limit') as HelpFlag).shortDescription)
					.setRequired(false))
				.addStringOption(option => option
					.setName((tracerouteFlagsMap.get('protocol') as HelpFlag).name)
					.setDescription((tracerouteFlagsMap.get('protocol') as HelpFlag).shortDescription)
					.setRequired(false)
					.addChoices(...choiceMap([ ...ALLOWED_TRACE_PROTOCOLS ])))
				.addNumberOption(option => option
					.setName((tracerouteFlagsMap.get('port') as HelpFlag).name)
					.setDescription((tracerouteFlagsMap.get('port') as HelpFlag).shortDescription)
					.setRequired(false)))
			// dns
			.addSubcommand(subcommand => subcommand
				.setName(dnsHelpTexts.name)
				.setDescription(dnsHelpTexts.shortDescription)
				.addStringOption(option => option
					.setName((otherFlagsMap.get('target') as HelpFlag).name)
					.setDescription((otherFlagsMap.get('target') as HelpFlag).shortDescription)
					.setRequired(true))
				.addStringOption(option => option
					.setName((globalFlagsMap.get('from') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('from') as HelpFlag).shortDescription)
					.setRequired(false))
				.addNumberOption(option => option
					.setName((globalFlagsMap.get('limit') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('limit') as HelpFlag).shortDescription)
					.setRequired(false))
				.addStringOption(option => option
					.setName((dnsFlagsMap.get('type') as HelpFlag).name)
					.setDescription((dnsFlagsMap.get('type') as HelpFlag).shortDescription)
					.setRequired(false)
					.addChoices(...choiceMap([ ...ALLOWED_DNS_TYPES ])))
				.addNumberOption(option => option
					.setName((dnsFlagsMap.get('port') as HelpFlag).name)
					.setDescription((dnsFlagsMap.get('port') as HelpFlag).shortDescription)
					.setRequired(false))
				.addStringOption(option => option
					.setName((dnsFlagsMap.get('protocol') as HelpFlag).name)
					.setDescription((dnsFlagsMap.get('protocol') as HelpFlag).shortDescription)
					.setRequired(false)
					.addChoices(...choiceMap([ ...ALLOWED_DNS_PROTOCOLS ])))
				.addStringOption(option => option
					.setName((dnsFlagsMap.get('resolver') as HelpFlag).name)
					.setDescription((dnsFlagsMap.get('resolver') as HelpFlag).shortDescription)
					.setRequired(false))
				.addBooleanOption(option => option
					.setName((dnsFlagsMap.get('trace') as HelpFlag).name)
					.setDescription((dnsFlagsMap.get('trace') as HelpFlag).shortDescription)
					.setRequired(false))
				.addBooleanOption(option => option
					.setName((globalFlagsMap.get('share') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('share') as HelpFlag).shortDescription)
					.setRequired(false))
				.addBooleanOption(option => option
					.setName((globalFlagsMap.get('latency') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('latency') as HelpFlag).shortDescription)
					.setRequired(false)))
			// mtr
			.addSubcommand(subcommand => subcommand
				.setName(mtrHelpTexts.name)
				.setDescription(mtrHelpTexts.shortDescription)
				.addStringOption(option => option
					.setName((otherFlagsMap.get('target') as HelpFlag).name)
					.setDescription((otherFlagsMap.get('target') as HelpFlag).shortDescription)
					.setRequired(true))
				.addStringOption(option => option
					.setName((globalFlagsMap.get('from') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('from') as HelpFlag).shortDescription)
					.setRequired(false))
				.addNumberOption(option => option
					.setName((globalFlagsMap.get('limit') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('limit') as HelpFlag).shortDescription)
					.setRequired(false))
				.addNumberOption(option => option
					.setName((mtrFlagsMap.get('port') as HelpFlag).name)
					.setDescription((mtrFlagsMap.get('port') as HelpFlag).shortDescription)
					.setRequired(false))
				.addNumberOption(option => option
					.setName((mtrFlagsMap.get('packets') as HelpFlag).name)
					.setDescription((mtrFlagsMap.get('packets') as HelpFlag).shortDescription)
					.setRequired(false))
				.addStringOption(option => option
					.setName((mtrFlagsMap.get('protocol') as HelpFlag).name)
					.setDescription((mtrFlagsMap.get('protocol') as HelpFlag).shortDescription)
					.setRequired(false)
					.addChoices(...choiceMap([ ...ALLOWED_MTR_PROTOCOLS ])))
				.addBooleanOption(option => option
					.setName((globalFlagsMap.get('share') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('share') as HelpFlag).shortDescription)
					.setRequired(false)))
			// http
			.addSubcommand(subcommand => subcommand
				.setName(httpHelpTexts.name)
				.setDescription(httpHelpTexts.shortDescription)
				.addStringOption(option => option
					.setName((otherFlagsMap.get('target') as HelpFlag).name)
					.setDescription((otherFlagsMap.get('target') as HelpFlag).shortDescription)
					.setRequired(true))
				.addStringOption(option => option
					.setName((globalFlagsMap.get('from') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('from') as HelpFlag).shortDescription)
					.setRequired(false))
				.addNumberOption(option => option
					.setName((globalFlagsMap.get('limit') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('limit') as HelpFlag).shortDescription)
					.setRequired(false))
				.addNumberOption(option => option
					.setName((httpFlagsMap.get('port') as HelpFlag).name)
					.setDescription((httpFlagsMap.get('port') as HelpFlag).shortDescription)
					.setRequired(false))
				.addStringOption(option => option
					.setName((httpFlagsMap.get('protocol') as HelpFlag).name)
					.setDescription((httpFlagsMap.get('protocol') as HelpFlag).shortDescription)
					.setRequired(false)
					.addChoices(...choiceMap([ ...ALLOWED_HTTP_PROTOCOLS ])))
				.addStringOption(option => option
					.setName((httpFlagsMap.get('resolver') as HelpFlag).name)
					.setDescription((httpFlagsMap.get('resolver') as HelpFlag).shortDescription)
					.setRequired(false))
				.addStringOption(option => option
					.setName((httpFlagsMap.get('method') as HelpFlag).name)
					.setDescription((httpFlagsMap.get('method') as HelpFlag).shortDescription)
					.setRequired(false)
					.addChoices(...choiceMap([ ...ALLOWED_HTTP_METHODS ])))
				.addStringOption(option => option
					.setName((httpFlagsMap.get('path') as HelpFlag).name)
					.setDescription((httpFlagsMap.get('path') as HelpFlag).shortDescription)
					.setRequired(false))
				.addStringOption(option => option
					.setName((httpFlagsMap.get('query') as HelpFlag).name)
					.setDescription((httpFlagsMap.get('query') as HelpFlag).shortDescription)
					.setRequired(false))
				.addStringOption(option => option
					.setName((httpFlagsMap.get('host') as HelpFlag).name)
					.setDescription((httpFlagsMap.get('host') as HelpFlag).shortDescription)
					.setRequired(false))
				.addStringOption(option => option
					.setName((httpFlagsMap.get('header') as HelpFlag).name)
					.setDescription((httpFlagsMap.get('header') as HelpFlag).shortDescription)
					.setRequired(false))
				.addBooleanOption(option => option
					.setName((globalFlagsMap.get('share') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('share') as HelpFlag).shortDescription)
					.setRequired(false))
				.addBooleanOption(option => option
					.setName((globalFlagsMap.get('latency') as HelpFlag).name)
					.setDescription((globalFlagsMap.get('latency') as HelpFlag).shortDescription)
					.setRequired(false))
				.addBooleanOption(option => option
					.setName((httpFlagsMap.get('full') as HelpFlag).name)
					.setDescription((httpFlagsMap.get('full') as HelpFlag).shortDescription)
					.setRequired(false)))
			// auth
			.addSubcommandGroup(group => group
				.setName(authHelpTexts.name)
				.setDescription(authHelpTexts.shortDescription)
				.addSubcommand(subcommand => subcommand
					.setName(AuthSubcommand.Login)
					.setDescription(authLoginHelpTexts.shortDescription))
				.addSubcommand(subcommand => subcommand
					.setName(AuthSubcommand.Logout)
					.setDescription(authLogoutHelpTexts.shortDescription))
				.addSubcommand(subcommand => subcommand
					.setName(AuthSubcommand.Status)
					.setDescription(authStatusHelpTexts.shortDescription)))
			// limits
			.addSubcommand(subcommand => subcommand
				.setName(limitsHelpTexts.name)
				.setDescription(limitsHelpTexts.shortDescription))
			// help
			.addSubcommand(subcommand => subcommand
				.setName(helpHelpTexts.name)
				.setDescription(helpHelpTexts.shortDescription)
				.addStringOption(option => option
					.setName('command')
					.setDescription('Command to get help for')
					.setRequired(false)
					.addChoices(...choiceMap([
						...ALLOWED_QUERY_TYPES,
						'auth ' + AuthSubcommand.Login,
						'auth ' + AuthSubcommand.Logout,
						'auth ' + AuthSubcommand.Status,
						'limits',
					])))),
	].map(command => command.toJSON());

	const rest = new REST({ version: '10' }).setToken(config.discordToken);

	return rest.put(Routes.applicationCommands(config.discordAppId), {
		body: commands,
	});
};
