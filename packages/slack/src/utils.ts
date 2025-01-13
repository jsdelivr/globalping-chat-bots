import { AuthSubcommand, HelpTexts } from '@globalping/bot-utils';

export const welcome = (id: string) => `Hi <@${id}>! :wave:\nI help make running networking commands easy. To learn more about me, try running \`/globalping help!\`\n\n:zap: Here are some quick example commands to help you get started:
\`/globalping ping jsdelivr.com from new york --packets 4\`
\`/globalping traceroute jsdelivr.com from united kingdom --limit 2\`
\`/globalping dns jsdelivr.com from eu --resolver 1.1.1.1\`
\`/globalping mtr jsdelivr.com from new york, london --protocol udp\`
\`/globalping http jsdelivr.com from google+belgium --protocol http2\``;

export const channelWelcome
	= 'Hello, I\'m Globalping. To learn more about me, run `/globalping help`.';

export const getInstallationId = (p: {
	isEnterpriseInstall: boolean;
	enterpriseId?: string;
	teamId?: string;
}): string => {
	if (p.isEnterpriseInstall && p.enterpriseId) {
		return p.enterpriseId;
	}

	if (!p.teamId) {
		throw new Error('No teamId provided');
	}

	return p.teamId;
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
