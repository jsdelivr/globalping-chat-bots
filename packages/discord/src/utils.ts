import { Flags, throwArgError } from '@globalping/bot-utils';
import { ChatInputCommandInteraction } from 'discord.js';

export const getOptions = (interaction: ChatInputCommandInteraction): Flags => ({
	cmd: interaction.options.getSubcommand(),
	target: interaction.options.getString('target') ?? throwArgError(undefined, 'target', ['jsdelivr.com']),
	from: interaction.options.getString('from') ?? throwArgError(undefined, 'from', ['New York']),
	limit: interaction.options.getInteger('limit') ?? 1,
	packets: interaction.options.getInteger('packets') ?? undefined,
	protocol: interaction.options.getString('protocol') ?? undefined,
	port: interaction.options.getInteger('port') ?? undefined,
	resolver: interaction.options.getString('resolver') ?? undefined,
	trace: interaction.options.getBoolean('trace') ?? undefined,
	query: interaction.options.getString('query') ?? undefined,
	method: interaction.options.getString('method') ?? undefined,
	path: interaction.options.getString('path') ?? undefined,
	host: interaction.options.getString('host') ?? undefined
	// TODO headers
});
