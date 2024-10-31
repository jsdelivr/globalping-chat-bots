/* eslint-disable no-await-in-loop */
import {
	argsToFlags,
	AuthSubcommand,
	buildPostMeasurements,
	getMeasurement,
	PostError,
	postMeasurement,
	PostMeasurementResponse,
} from '@globalping/bot-utils';
import type { WebClient } from '@slack/web-api';

import {
	AuthorizeErrorType,
	CreateLimitType,
	IntrospectionResponse,
	LimitsResponse,
	oauth,
} from './auth.js';
import { measurementsChatResponse } from './response.js';
import { formatSeconds, helpCmd, logger, pluralize } from './utils.js';

interface ChannelPayload {
	installationId: string;
	channel_id: string;
	user_id: string;
	thread_ts?: string;
}

export const postAPI = async (
	client: WebClient,
	payload: ChannelPayload,
	cmdText: string,
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
				await authLogin(client, payload);
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

	if (flags.cmd === 'limits') {
		await limits(client, payload);
		return;
	}

	const postMeasurements = buildPostMeasurements(flags);

	// We post measurement first to catch any validation errors before committing to processing request message
	logger.debug(`Posting measurement: ${JSON.stringify(postMeasurements)}`);
	let measurements: PostMeasurementResponse[];

	const token = await oauth.GetToken(payload.installationId);

	try {
		measurements = await postMeasurement(postMeasurements, token?.access_token);
	} catch (error) {
		if (error instanceof PostError) {
			const { statusCode, headers } = error.response;

			// Unauthorized or Forbidden
			if ((statusCode === 401 || statusCode === 403) && token) {
				const errMsg = await oauth.TryToRefreshToken(
					payload.installationId,
					token,
				);

				if (errMsg) {
					throw new Error(errMsg);
				}
			}

			// Too many requests
			if (statusCode === 429) {
				const rateLimitRemaining = parseInt(headers['X-RateLimit-Remaining'] as string);
				const rateLimitReset = parseInt(headers['X-RateLimit-Reset'] as string);
				const creditsRemaining = parseInt(headers['X-Credits-Remaining'] as string);
				const requestCost = parseInt(headers['X-Request-Cost'] as string);
				const remaining = rateLimitRemaining + creditsRemaining;

				if (token && !token.isAnonymous) {
					if (remaining > 0) {
						throw getMoreCreditsRequiredAuthError(
							requestCost,
							remaining,
							rateLimitReset,
						);
					}

					throw getNoCreditsAuthError(rateLimitReset);
				} else {
					if (remaining > 0) {
						throw getMoreCreditsRequiredNoAuthError(
							remaining,
							requestCost,
							rateLimitReset,
						);
					}

					throw getNoCreditsNoAuthError(rateLimitReset);
				}
			}
		}

		throw error;
	}

	await client.chat.postEphemeral({
		text: '```Processing the request...```',
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
			flags,
		);
	}
};

async function authLogin (client: WebClient, payload: ChannelPayload) {
	if (!await canUseAuthCommand(client, payload)) {
		return;
	}

	const res = await oauth.Authorize(payload);
	await client.chat.postEphemeral({
		blocks: [
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `Please <${res.url}|click here> to authenticate.`,
				},
			},
		],
		user: payload.user_id,
		channel: payload.channel_id,
		thread_ts: payload.thread_ts,
	});
}

async function authStatus (client: WebClient, payload: ChannelPayload) {
	if (!await canUseAuthCommand(client, payload)) {
		return;
	}

	const [ introspection, error ] = await oauth.Introspect(payload.installationId);
	let text = '';

	if (error) {
		text
			= error.error === AuthorizeErrorType.NotAuthorized
				? 'Not logged in.'
				: `${error.error}: ${error.error_description}`;
	}

	text
		= introspection && introspection.active
			? `Logged in as ${introspection?.username}.`
			: 'Not logged in.';

	await client.chat.postEphemeral({
		text,
		user: payload.user_id,
		channel: payload.channel_id,
		thread_ts: payload.thread_ts,
	});
}

async function authLogout (client: WebClient, payload: ChannelPayload) {
	if (!await canUseAuthCommand(client, payload)) {
		return;
	}

	const error = await oauth.Logout(payload.installationId);
	let text = '';
	text = error
		? `${error.error}: ${error.error_description}`
		: 'You are now logged out.';

	await client.chat.postEphemeral({
		text,
		user: payload.user_id,
		channel: payload.channel_id,
		thread_ts: payload.thread_ts,
	});
}

async function canUseAuthCommand (
	client: WebClient,
	payload: ChannelPayload,
): Promise<boolean> {
	const userInfoRes = await client.users.info({ user: payload.user_id });
	const { user } = userInfoRes;

	if (!user) {
		logger.error('Failed to get user info');

		await client.chat.postEphemeral({
			text: 'Failed to get user information',
			user: payload.user_id,
			channel: payload.channel_id,
			thread_ts: payload.thread_ts,
		});

		return false;
	}

	const canAuthenticate = user.is_admin || user.is_owner;

	if (!canAuthenticate) {
		await client.chat.postEphemeral({
			text: 'Only workspace owners or administrators can use this command.',
			user: payload.user_id,
			channel: payload.channel_id,
			thread_ts: payload.thread_ts,
		});

		return false;
	}

	return true;
}

async function limits (client: WebClient, payload: ChannelPayload) {
	const [ introspection, error ] = await oauth.Introspect(payload.installationId);

	if (!introspection) {
		await client.chat.postEphemeral({
			text: `${error?.error}: ${error?.error_description}`,
			user: payload.user_id,
			channel: payload.channel_id,
			thread_ts: payload.thread_ts,
		});

		return;
	}

	const [ limits, limitsError ] = await oauth.Limits(payload.installationId);

	if (!limits) {
		await client.chat.postEphemeral({
			text: `${limitsError?.type}: ${limitsError?.message}`,
			user: payload.user_id,
			channel: payload.channel_id,
			thread_ts: payload.thread_ts,
		});

		return;
	}

	await client.chat.postEphemeral({
		text: getLimitsOutput(limits, introspection),
		user: payload.user_id,
		channel: payload.channel_id,
		thread_ts: payload.thread_ts,
	});
}

export function getLimitsOutput (
	limits: LimitsResponse,
	introspection: IntrospectionResponse,
) {
	let text = '';

	if (limits.rateLimit.measurements.create.type === CreateLimitType.User) {
		text = `Authentication: token (${introspection?.username || ''})\n\n`;
	} else {
		text = 'Authentication: workspace\n\n';
	}

	const createLimit = pluralize(
		limits.rateLimit.measurements.create.limit,
		'test',
	);
	const createConsumed
		= limits.rateLimit.measurements.create.limit
		- limits.rateLimit.measurements.create.remaining;
	const createRemaining = limits.rateLimit.measurements.create.remaining;
	text += `Creating measurements:
 - ${createLimit} per hour
 - ${createConsumed} consumed, ${createRemaining} remaining
`;

	if (limits.rateLimit.measurements.create.reset) {
		text += ` - resets in ${formatSeconds(limits.rateLimit.measurements.create.reset)}\n`;
	}

	if (limits.rateLimit.measurements.create.type === CreateLimitType.User) {
		text += `
Credits:
 - ${pluralize(
		limits.credits?.remaining || 0,
		'credit',
	)} remaining (may be used to create measurements above the hourly limits)
`;
	}

	return text;
}

export function getMoreCreditsRequiredAuthError (
	requestCost: number,
	remaining: number,
	rateLimitReset: number,
): Error {
	return new Error(`You only have ${pluralize(
		remaining,
		'credit',
	)} remaining, and ${requestCost} were required. Try requesting fewer probes or wait ${formatSeconds(rateLimitReset)} for the rate limit to reset. You can get higher limits by sponsoring us or hosting probes.`);
}

export function getNoCreditsAuthError (rateLimitReset: number): Error {
	return new Error(`You have run out of credits for this session. You can wait ${formatSeconds(rateLimitReset)} for the rate limit to reset or get higher limits by sponsoring us or hosting probes.`);
}

export function getMoreCreditsRequiredNoAuthError (
	requestCost: number,
	remaining: number,
	rateLimitReset: number,
): Error {
	return new Error(`You only have ${pluralize(
		remaining,
		'credit',
	)} remaining, and ${requestCost} were required. Try requesting fewer probes or wait ${formatSeconds(rateLimitReset)} for the rate limit to reset. You can get higher limits by creating an account. Sign up at https://globalping.io`);
}

export function getNoCreditsNoAuthError (rateLimitReset: number): Error {
	return new Error(`You have run out of credits for this session. You can wait ${formatSeconds(rateLimitReset)} for the rate limit to reset or get higher limits by creating an account. Sign up at https://globalping.io`);
}
