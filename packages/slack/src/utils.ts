/* eslint-disable no-await-in-loop */
import {
	argsToFlags,
	buildPostMeasurements,
	getMeasurement,
	loggerInit,
	postMeasurement,
	AuthSubcommand,
} from '@globalping/bot-utils';
import type { WebClient } from '@slack/web-api';

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
} from './format-help';
import { githubHandle } from './github/common';
import { measurementsChatResponse } from './response';
import { AuthorizeErrorType, oauth } from './auth';
import { config } from './config';

export const logger = loggerInit('slack', config.logLevel);

export type Logger = typeof logger;

export type SlackClient = WebClient;

export const helpCmd = (
	cmd: string,
	target: string,
	platform: string
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

export const welcome = (
	id: string
) => `Hi <@${id}>! :wave:\nI help make running networking commands easy. To learn more about me, try running \`/globalping help!\`\n\n:zap: Here are some quick example commands to help you get started:
\`/globalping ping jsdelivr.com from new york --packets 4\`
\`/globalping traceroute jsdelivr.com from united kingdom --limit 2\`
\`/globalping dns jsdelivr.com from eu --resolver 1.1.1.1\`
\`/globalping mtr jsdelivr.com from new york, london --protocol udp\`
\`/globalping http jsdelivr.com from google+belgium --protocol http2\``;

export const channelWelcome =
	"Hello, I'm Globalping. To learn more about me, run `/globalping help`.";

interface ChannelPayload {
	channel_id: string;
	user_id: string;
	thread_ts?: string;
	installationId?: string;
}

export const postAPI = async (
	client: WebClient,
	payload: ChannelPayload,
	cmdText: string
) => {
	const flags = argsToFlags(cmdText);

	// eslint-disable-next-line @typescript-eslint/naming-convention
	const { channel_id, user_id, thread_ts } = payload;

	if (!flags.cmd || flags.help) {
		await client.chat.postEphemeral({
			text: helpCmd(flags.cmd, flags.target, 'slack'),
			user: user_id,
			channel: channel_id,
			thread_ts,
		});
		return;
	}

	if (flags.cmd === 'auth') {
		switch (flags.target) {
			case AuthSubcommand.Login:
				await authLogin(client, payload, flags.withToken);
				return;
			case AuthSubcommand.Logout:
				await authLogout(client, payload);
				return;
			case AuthSubcommand.Status:
				await authStatus(client, payload);
				return;
			default:
				await client.chat.postEphemeral({
					text: helpCmd(flags.cmd, flags.target, 'slack'),
					user: user_id,
					channel: channel_id,
					thread_ts,
				});
				return;
		}
	}

	const postMeasurements = buildPostMeasurements(flags);

	// We post measurement first to catch any validation errors before committing to processing request message
	logger.debug(`Posting measurement: ${JSON.stringify(postMeasurements)}`);
	const measurements = await postMeasurement(postMeasurements);
	await client.chat.postEphemeral({
		text: '```Processing request...```',
		user: user_id,
		channel: channel_id,
		thread_ts,
	});
	logger.debug(`Post response: ${JSON.stringify(measurements)}`);
	logger.debug(`Latency mode: ${flags.latency}`);

	let first = true;
	// You can have multiple locations run in parallel
	for (const measurement of measurements) {
		const res = await getMeasurement(measurement.id);
		logger.debug(`Get response: ${JSON.stringify(res)}`);
		// Only want this to run on first measurement
		if (first) {
			await client.chat.postMessage({
				channel: channel_id,
				thread_ts,
				text: `<@${user_id}>, here are the results for \`${cmdText}\``,
			});
			first = false;
		}

		await measurementsChatResponse(
			logger,
			client,
			channel_id,
			thread_ts,
			measurement.id,
			res,
			flags
		);
	}
};

async function authLogin(
	client: WebClient,
	payload: ChannelPayload,
	token?: string
) {
	const { channel_id, user_id, thread_ts, installationId } = payload;
	const userInfoRes = await client.users.info({ user: user_id });
	const user = userInfoRes.user;
	if (!user) {
		logger.error('Failed to get user info');
		await client.chat.postEphemeral({
			text: 'Failed to get user information',
			user: user_id,
			channel: channel_id,
			thread_ts,
		});
		return;
	}
	const canAuthenticate = user.is_admin || user.is_owner;
	if (!canAuthenticate) {
		await client.chat.postEphemeral({
			text: 'You do not have permission to authenticate',
			user: user_id,
			channel: channel_id,
			thread_ts,
		});
		return;
	}
	if (token) {
		const [introspection, error] = await oauth.LoginWithToken(user_id, token);
		let text = '';
		if (error) {
			text = `${error.error}: ${error.error_description}`;
		}
		if (introspection && introspection.active) {
			text = `Logged in as ${introspection?.username}`;
		}
		await client.chat.postEphemeral({
			text: text,
			user: user_id,
			channel: channel_id,
			thread_ts,
		});
		return;
	}
	const res = await oauth.Authorize(
		user_id,
		channel_id,
		thread_ts,
		installationId
	);
	await client.chat.postEphemeral({
		blocks: [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `Click <${res.url}|here> to authenticate`,
				},
			},
		],
		user: user_id,
		channel: channel_id,
		thread_ts,
	});
}

async function authStatus(client: WebClient, payload: ChannelPayload) {
	const { channel_id, user_id, thread_ts } = payload;
	const [introspection, error] = await oauth.Introspect(user_id);
	let text = '';
	if (error) {
		if (error.error === AuthorizeErrorType.NotAuthorized) {
			text = 'Not logged in.';
		} else {
			text = `${error.error}: ${error.error_description}`;
		}
	}
	if (introspection && introspection.active) {
		text = `Logged in as ${introspection?.username}`;
	} else {
		text = 'Not logged in.';
	}
	await client.chat.postEphemeral({
		text: text,
		user: user_id,
		channel: channel_id,
		thread_ts,
	});
}

async function authLogout(client: WebClient, payload: ChannelPayload) {
	const { channel_id, user_id, thread_ts } = payload;
	const error = await oauth.Logout(user_id);
	let text = '';
	if (error) {
		text = `${error.error}: ${error.error_description}`;
	} else {
		text = 'You are now logged out.';
	}
	await client.chat.postEphemeral({
		text: text,
		user: user_id,
		channel: channel_id,
		thread_ts,
	});
}

export const getInstallationId = (p: {
	isEnterpriseInstall: boolean;
	enterpriseId?: string;
	teamId?: string;
}): string | undefined => {
	if (p.isEnterpriseInstall && p.enterpriseId) {
		return p.enterpriseId;
	}
	return p.teamId;
};
