/* eslint-disable no-await-in-loop */
import {
	Flags,
	getTag,
	help,
	loggerInit,
	MeasurementResponse,
	throwArgError,
} from '@globalping/bot-utils';
import { ChatInputCommandInteraction, codeBlock } from 'discord.js';
import * as dotenv from 'dotenv';

dotenv.config();

export const logger = loggerInit('discord', process.env.LOG_LEVEL ?? 'info');

export const getFlags = (interaction: ChatInputCommandInteraction): Flags => {
	const cmd = interaction.options.getSubcommand();
	const helpVal
		= interaction.options.getString('command')
		?? (cmd === 'help' ? 'help' : undefined);

	const target
		= interaction.options.getString('target')
		?? (helpVal ? '' : throwArgError(undefined, 'target', 'jsdelivr.com'));
	const from
		= interaction.options.getString('from')
		?? (helpVal ? '' : throwArgError(undefined, 'from', 'New York'));
	const rawHeader
		= interaction.options
			.getString('header')
			?.split(':')
			.map(header => header.trim()) ?? undefined;

	return {
		cmd,
		target,
		from,
		limit:
			interaction.options.getNumber('limit')
			?? (undefined as unknown as number), // Force overwrite main interface
		packets: interaction.options.getNumber('packets') ?? undefined,
		protocol: interaction.options.getString('protocol') ?? undefined,
		port: interaction.options.getNumber('port') ?? undefined,
		resolver: interaction.options.getString('resolver') ?? undefined,
		trace: interaction.options.getBoolean('trace') ?? undefined,
		query: interaction.options.getString('query') ?? undefined,
		method: interaction.options.getString('method') ?? undefined,
		path: interaction.options.getString('path') ?? undefined,
		host: interaction.options.getString('host') ?? undefined,
		headers: rawHeader
			? { [String(rawHeader.shift())]: rawHeader.join(' ') }
			: undefined,
		help: helpVal,
	};
};

export const expandFlags = (flags: Flags): string => {
	const entries = Object.entries(flags);
	const skipFlag = new Set([ 'cmd', 'target', 'from', 'help' ]);
	const msg = [];

	for (const [ key, value ] of entries) {
		// Remove flags that don't need to be diplayed to user
		if (!skipFlag.has(key) && value !== undefined) {
			if (key === 'headers') {
				// Headers have different flag format
				msg.push(`${Object.entries(value)
					.map(([ headerKey, headerValue ]) => `--header ${headerKey}: ${headerValue}`)
					.join(' ')}`);
			}

			msg.push(`--${key} ${value}`);
		}
	}

	return msg.join(' ');
};

export const expandResults = async (
	response: MeasurementResponse,
	interaction: ChatInputCommandInteraction,
) => {
	const { results } = response;

	for (const result of results) {
		const tag = getTag(result.probe.tags);
		const msg = {
			content: `> **${result.probe.city}${
				result.probe.state ? ` (${result.probe.state})` : ''
			}, ${result.probe.country}, ${result.probe.continent}, ${
				result.probe.network
			} (AS${result.probe.asn})${tag ? `, (${tag})` : ''}**`,
		};
		// Discord has a limit of 2000 characters per block - truncate if necessary
		const rawOutput
			= result.result.rawOutput.length > 1900
				? `${result.result.rawOutput.slice(0, 1900)}\n... (truncated)`
				: `${result.result.rawOutput}`;
		const output = { content: codeBlock('shell', rawOutput) };

		if (interaction.channel) {
			await interaction.channel.send(msg);
			await interaction.channel.send(output);
		} else {
			await interaction.user.send(msg);
			await interaction.user.send(output);
		}
	}
};

export const helpCmd = (cmd: string): string => {
	if (cmd === 'help') {
		return `${help.help.preamble}\n\n**Usage:**\n\`\`\`${help.help.usage}\`\`\`\n**Arguments**:\n\`\`\`${help.help.args}\`\`\`\nMore help can be found here:\n\`\`\`${help.help.endDiscord}\`\`\``;
	}

	if (cmd === 'ping') {
		return `${help.ping.preamble}\n\n**Usage:**\n\`\`\`${help.ping.usage}\`\`\`\n**Options:**\n\`\`\`${help.ping.options}\`\`\`\n\n**Examples:**\n\`\`\`${help.ping.examples}\`\`\``;
	}

	if (cmd === 'traceroute') {
		return `${help.traceroute.preamble}\n\n**Usage:**\n\`\`\`${help.traceroute.usage}\`\`\`\n**Options:**\n\`\`\`${help.traceroute.options}\`\`\`\n**Examples:**\n\`\`\`${help.traceroute.examples}\`\`\``;
	}

	if (cmd === 'dns') {
		return `${help.dns.preamble}\n\n**Usage:**\n\`\`\`${help.dns.usage}\`\`\`\n**Options:**\n\`\`\`${help.dns.options}\`\`\`\n\n**Examples:**\n\`\`\`${help.dns.examples}\`\`\``;
	}

	if (cmd === 'mtr') {
		return `${help.mtr.preamble}\n\n**Usage:**\n\`\`\`${help.mtr.usage}\`\`\`\n**Options:**\n\`\`\`${help.mtr.options}\`\`\`\n\n**Examples:**\n\`\`\`${help.mtr.examples}\`\`\``;
	}

	if (cmd === 'http') {
		return `${help.http.preamble}\n\n**Usage:**\n\`\`\`${help.http.usage}\`\`\`\n**Options:**\n\`\`\`${help.http.options}\`\`\`\n**Examples:**\n\`\`\`${help.http.examples}\`\`\``;
	}

	return 'Unknown command! Please call `/globalping help` for a list of commands.';
};
