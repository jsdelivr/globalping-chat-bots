import { HelpTexts, truncate } from '@globalping/bot-utils';

const truncationLimit = 2000;

export const getHelpForCommand = (
	cmd: string,
	target: string,
	help: HelpTexts,
): string => {
	switch (cmd) {
		case 'dns':
			return truncate(help.dns, truncationLimit);
		case 'http':
			return truncate(help.http, truncationLimit);
		case 'mtr':
			return truncate(help.mtr, truncationLimit);
		case 'ping':
			return truncate(help.ping, truncationLimit);
		case 'traceroute':
			return truncate(help.traceroute, truncationLimit);

		case undefined:
		case '':
		case 'help':
			if (!target) {
				return truncate(help.general, truncationLimit);
			}

			// handle case: /globalping help <subcommand>
			return getHelpForCommand(target, target, help);

		default:
			return help.unknownCommand;
	}
};
