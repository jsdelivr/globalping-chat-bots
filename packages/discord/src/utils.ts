import { AuthSubcommand, HelpTexts } from '@globalping/bot-utils';

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

		case 'auth':
			switch (target) {
				case AuthSubcommand.Login:
					return help.auth_login;
				case AuthSubcommand.Logout:
					return help.auth_logout;
				case AuthSubcommand.Status:
					return help.auth_status;
				default:
					return help.auth;
			}

		case 'limits':
			return help.limits;

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
