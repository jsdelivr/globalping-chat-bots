import { Flags, throwArgError, HelpTexts } from '@globalping/bot-utils';
import { ChatInputCommandInteraction } from 'discord.js';

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

export const getHelpForCommand = (
	cmd: string,
	target: string,
	help: HelpTexts,
): string => {
	switch (cmd) {
		case 'dns':
			return help.dns;
		case 'http':
			return help.http;
		case 'mtr':
			return help.mtr;
		case 'ping':
			return help.ping;
		case 'traceroute':
			return help.traceroute;

		case undefined:
		case '':
		case 'help':
			if (!target) {
				return help.general;
			}

			// handle case: /globalping help <subcommand>
			return getHelpForCommand(target, target, help);

		default:
			return help.unknownCommand;
	}
};
