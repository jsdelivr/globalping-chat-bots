import { Flags, HelpTexts } from '@globalping/bot-utils';

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
