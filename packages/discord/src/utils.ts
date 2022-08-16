/* eslint-disable no-await-in-loop */
import { Flags, MeasurementResponse, throwArgError } from '@globalping/bot-utils';
import { ChatInputCommandInteraction, codeBlock } from 'discord.js';

export const getFlags = (interaction: ChatInputCommandInteraction): Flags => ({
	cmd: interaction.options.getSubcommand(),
	target: interaction.options.getString('target') ?? throwArgError(undefined, 'target', ['jsdelivr.com']),
	from: interaction.options.getString('from') ?? throwArgError(undefined, 'from', ['New York']),
	limit: interaction.options.getNumber('limit') ?? 1,
	packets: interaction.options.getNumber('packets') ?? undefined,
	protocol: interaction.options.getString('protocol') ?? undefined,
	port: interaction.options.getNumber('port') ?? undefined,
	resolver: interaction.options.getString('resolver') ?? undefined,
	trace: interaction.options.getBoolean('trace') ?? undefined,
	query: interaction.options.getString('query') ?? undefined,
	method: interaction.options.getString('method') ?? undefined,
	path: interaction.options.getString('path') ?? undefined,
	host: interaction.options.getString('host') ?? undefined
	// TODO headers
});

export const expandResults = async (response: MeasurementResponse, interaction: ChatInputCommandInteraction) => {
	const { results } = response;
	for (const result of results) {
		await interaction.channel?.send({ content: `${result.probe.continent}, ${result.probe.country}, ${result.probe.state ? `(${result.probe.state}), ` : ''}${result.probe.city}, ASN:${result.probe.asn}` });
		// Discord has a limit of 2000 characters per block - truncate if necessary
		const output = result.result.rawOutput.length > 1950 ? `${result.result.rawOutput.slice(0, 1950)}\n... (truncated)` : `${result.result.rawOutput}`;
		await interaction.channel?.send({ content: codeBlock('shell', output) });
	};
};
