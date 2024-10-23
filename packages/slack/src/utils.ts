/* eslint-disable no-await-in-loop */
import { AuthSubcommand, loggerInit } from '@globalping/bot-utils';
import type { WebClient } from '@slack/web-api';

import { config } from './config.js';
import {
	authHelp,
	authLoginHelp,
	authLogoutHelp,
	authStatusHelp,
	dnsHelp,
	generalHelp,
	httpHelp,
	mtrHelp,
	pingHelp,
	tracerouteHelp,
} from './format-help.js';
import { githubHandle } from './github/common.js';

export const logger = loggerInit('slack', config.logLevel);

export type Logger = typeof logger;

export type SlackClient = WebClient;

export const helpCmd = (
	cmd: string,
	target: string,
	platform: string,
): string => {
	let boldSeparator = '';
	let rootCommand = '';

	if (platform === 'github') {
		boldSeparator = '**';
		rootCommand = `@${githubHandle()}`;
	} else {
		boldSeparator = '*';
		rootCommand = '/globalping';
	}

	switch (cmd) {
		case 'dns':
			return dnsHelp(boldSeparator, rootCommand);
		case 'http':
			return httpHelp(boldSeparator, rootCommand);
		case 'mtr':
			return mtrHelp(boldSeparator, rootCommand);
		case 'ping':
			return pingHelp(boldSeparator, rootCommand);
		case 'traceroute':
			return tracerouteHelp(boldSeparator, rootCommand);

		case 'auth':
			switch (target) {
				case AuthSubcommand.Login:
					return authLoginHelp(boldSeparator, rootCommand);
				case AuthSubcommand.Logout:
					return authLogoutHelp(boldSeparator, rootCommand);
				case AuthSubcommand.Status:
					return authStatusHelp(boldSeparator, rootCommand);
				default:
					return authHelp(boldSeparator, rootCommand);
			}

		case undefined:
		case '':
		case 'help':
			if (!target) {
				return generalHelp(boldSeparator, rootCommand);
			}

			// handle case: /globalping help <subcommand>
			return helpCmd(target, target, platform);

		default:
			return `Unknown command! Please call \`${rootCommand} help\` for a list of commands.`;
	}
};

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
