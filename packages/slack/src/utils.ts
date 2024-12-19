/* eslint-disable no-await-in-loop */
import { loggerInit } from '@globalping/bot-utils';
import type { WebClient } from '@slack/web-api';

import { config } from './config.js';

export const logger = loggerInit('slack', config.logLevel);

export type Logger = typeof logger;

export type SlackClient = WebClient;

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

export const pluralize = (count: number, singular: string): string => {
	if (count === 1) {
		return `${count} ${singular}`;
	}

	return `${count} ${singular}s`;
};

export const formatSeconds = (seconds: number): string => {
	if (seconds < 60) {
		return pluralize(seconds, 'second');
	}

	if (seconds < 3600) {
		return pluralize(Math.round(seconds / 60), 'minute');
	}

	if (seconds < 86400) {
		return pluralize(Math.round(seconds / 3600), 'hour');
	}

	return pluralize(Math.round(seconds / 86400), 'day');
};
