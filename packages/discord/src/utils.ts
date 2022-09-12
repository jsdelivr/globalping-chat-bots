/* eslint-disable no-await-in-loop */
import { Flags, MeasurementResponse, throwArgError } from '@globalping/bot-utils';
import { ChatInputCommandInteraction, codeBlock } from 'discord.js';

export const getFlags = (interaction: ChatInputCommandInteraction): Flags => {
	const cmd = interaction.options.getSubcommand();
	const help = (interaction.options.getBoolean('help') || cmd === 'help') ?? undefined;
	const rawHeader = interaction.options.getString('header')?.split(':').map(header => header.trim()) ?? undefined;

	return {
		cmd,
		target: interaction.options.getString('target') ?? help ? 'help' : throwArgError(undefined, 'target', 'jsdelivr.com'),
		from: interaction.options.getString('from') ?? help ? 'help' : throwArgError(undefined, 'from', 'New York'),
		limit: interaction.options.getNumber('limit') ?? undefined as unknown as number, // Force overwrite main interface
		packets: interaction.options.getNumber('packets') ?? undefined,
		protocol: interaction.options.getString('protocol') ?? undefined,
		port: interaction.options.getNumber('port') ?? undefined,
		resolver: interaction.options.getString('resolver') ?? undefined,
		trace: interaction.options.getBoolean('trace') ?? undefined,
		query: interaction.options.getString('query') ?? undefined,
		method: interaction.options.getString('method') ?? undefined,
		path: interaction.options.getString('path') ?? undefined,
		host: interaction.options.getString('host') ?? undefined,
		headers: rawHeader ? { [String(rawHeader.shift())]: rawHeader.join(' ') } : undefined,
		help,
	};
};


export const expandFlags = (flags: Flags): string => {
	const entries = Object.entries(flags);
	const skipFlag = new Set(['cmd', 'target', 'from']);
	const msg = [];
	for (const [key, value] of entries) {
		// Remove flags that don't need to be diplayed to user
		if (!skipFlag.has(key) && value !== undefined) {
			if (key === 'headers') {
				// Headers have different flag format
				msg.push(`${Object.entries(value).map(([headerKey, headerValue]) => `--header ${headerKey}: ${headerValue}`).join(' ')}`);
			}
			msg.push(`--${key} ${value}`);
		}
	}
	return msg.join(' ');
};

export const expandResults = async (response: MeasurementResponse, interaction: ChatInputCommandInteraction) => {
	const { results } = response;
	for (const result of results) {
		const msg = { content: `${result.probe.continent}, ${result.probe.country}, ${result.probe.state ? `(${result.probe.state}), ` : ''}${result.probe.city}, ASN:${result.probe.asn}` };
		// Discord has a limit of 2000 characters per block - truncate if necessary
		const rawOutput = result.result.rawOutput.length > 1950 ? `${result.result.rawOutput.slice(0, 1950)}\n... (truncated)` : `${result.result.rawOutput}`;
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
