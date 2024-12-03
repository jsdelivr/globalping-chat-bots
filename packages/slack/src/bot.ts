import { AllMiddlewareArgs, SlackCommandMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import { formatSeconds, getInstallationId, helpCmd, Logger, pluralize } from './utils.js';
import { StringIndexed } from '@slack/bolt/dist/types/helpers.js';
import {
	formatAPIError,
	getAPIErrorMessage,
	argsToFlags,
	AuthSubcommand,
	buildPostMeasurements,
	PostError,
	PostMeasurementResponse,
	Flags,
	MeasurementResponse,
	PostMeasurement,
} from '@globalping/bot-utils';
import type { Block, GenericMessageEvent, KnownBlock, RichTextBlockElement, WebClient } from '@slack/web-api';
import { AuthorizeErrorType, CreateLimitType, IntrospectionResponse, LimitsResponse, OAuthClient } from './auth.js';
import { formatMeasurementResponse } from './response.js';

interface ChannelPayload {
	installationId: string;
	channel_id: string;
	user_id: string;
	thread_ts?: string;
}

export class Bot {
	constructor (
		private logger: Logger,
		private oauth: OAuthClient,
		private postMeasurement: (opts: PostMeasurement, token?: string) => Promise<PostMeasurementResponse>,
		private getMeasurement: (id: string) => Promise<MeasurementResponse>,
	) { }

	async HandleCommand ({
		ack, respond, client, payload, context,
	}: SlackCommandMiddlewareArgs & AllMiddlewareArgs<StringIndexed>) {
		const logData = {
			command: payload.command,
			commandText: payload.text,
			teamDomain: payload.team_domain,
			channelName: payload.channel_name,
			userName: payload.user_name,
			triggerId: payload.trigger_id,
		};
		this.logger.info(logData, 'HandleCommand: request');

		try {
			// Acknowledge command request
			await ack();
		} catch (error) {
			const err = error as Error;
			this.logger.info(
				{ errorMsg: err.message, ...logData },
				'HandleCommand: ack failed',
			);

			await respond({
				text: `Unable to acknowledge the request.\n${formatAPIError(err.message)}`,
			});
		}

		// eslint-disable-next-line @typescript-eslint/naming-convention
		const { channel_id, user_id, channel_name, text } = payload;

		let channelConversationsInfo;

		// Check if channel is accessible just to be sure
		try {
			channelConversationsInfo = await client.conversations.info({
				channel: channel_id,
			});
		} catch (error) {
			const err = error as Error;
			this.logger.info(
				{ errorMsg: err.message, ...logData },
				'HandleCommand: channel info not available',
			);
		}

		try {
			// If channel is not accessible, respond with errors
			if (!channelConversationsInfo) {
				// This is a user DM
				if (channel_name === 'directmessage' || channel_id.startsWith('D')) {
					this.logger.debug('Channel is a DM');
					const conversation = await client.conversations.open({
						users: user_id,
					});
					this.logger.debug(`Open conversation: ${JSON.stringify(conversation)}`);

					// If the DM is not the Globalping DM, we cancel the request
					if (
						conversation.channel?.id
						&& channel_id !== conversation.channel.id
					) {
						this.logger.error(
							{ errorMsg: 'request in dm', ...logData },
							'HandleCommand: response - dm',
						);

						await respond({
							text: 'Unable to run `' + payload.command + '` in a private DM! You can DM the Globalping App directly to run commands, or create a new group DM with the Globalping App to include multiple users.',
						});
					} else {
						throw new Error('Unable to open a DM with the Globalping App.');
					}

					return;
				}

				if (channel_name.startsWith('mpdm-')) {
					this.logger.error(
						{ errorMsg: 'request in mpdm', ...logData },
						'HandleCommand: response - mpdm',
					);

					await respond({
						text: 'Unable to run `' + payload.command + '` in a private DM! You can DM the Globalping App directly to run commands, or create a new group DM with the Globalping App to include multiple users.',
					});

					return;
				}

				// If not DM, try checking the properties of the channel
				this.logger.error(
					{ errorMsg: 'asked for invite to channel', ...logData },
					'HandleCommand: channel invite needed',
				);

				await respond('Please invite me to this channel to use this command. Run `/invite @Globalping` to invite me.');
				return;
			}

			const channelPayload = {
				channel_id,
				user_id,
				installationId: getInstallationId(context),
			};
			let commandText = text;

			switch (payload.command) {
				case '/dns':
				case '/http':
				case '/mtr':
				case '/ping':
				case '/traceroute':
					commandText = payload.command.substring(1) + ' ' + text;
					break;
			}

			await this.processCommand(client, channelPayload, commandText);
		} catch (error) {
			const errorMsg = getAPIErrorMessage(error);
			this.logger.error({ errorMsg, ...logData }, 'HandleCommand: failed');

			await respond({
				text: `Failed to process command \`${text}\`.\n${formatAPIError(errorMsg)}`,
			});
		}
	}

	async HandleMention ({ event, context, client }: SlackEventMiddlewareArgs<'app_mention'> & AllMiddlewareArgs<StringIndexed>) {
		await this.processMention(
			getRawTextFromBlocks(context.botUserId || '', event.blocks),
			event.team,
			event.channel,
			event.user || '',
			event.event_ts,
			event.thread_ts,
			getInstallationId(context),
			client,
		);
	}

	async HandleMessage ({ event, context, client }: SlackEventMiddlewareArgs<'message'> & AllMiddlewareArgs<StringIndexed>) {
		if (event.channel_type !== 'im') {
			return;
		}

		if (event.subtype === 'message_changed') {
			return;
		}

		const messageEvent = event as GenericMessageEvent;

		await this.processMention(
			getRawTextFromBlocks(context.botUserId || '', messageEvent.blocks),
			messageEvent.team,
			messageEvent.channel,
			messageEvent.user || '',
			messageEvent.event_ts,
			messageEvent.thread_ts,
			getInstallationId(context),
			client,
		);
	}

	private async processMention (
		fullText: string,
		teamId: string | undefined,
		channelId: string,
		userId: string,
		eventTs: string,
		threadTs: string | undefined,
		installationId: string,
		client: WebClient,
	) {
		const logData = { fullText, teamId, channelId, userId, eventTs, threadTs };

		try {
			// the mention is always received in a channel where the bot is a member
			const channelPayload = {
				channel_id: channelId,
				user_id: userId,
				thread_ts: threadTs,
				installationId,
			};
			this.logger.info(logData, '@globalping processing starting');
			await this.processCommand(client, channelPayload, fullText);
			this.logger.info(logData, '@globalping response - OK');
		} catch (error) {
			const errorMsg = getAPIErrorMessage(error);
			this.logger.error({ errorMsg, ...logData }, '@globalping failed');

			await client.chat.postMessage({
				channel: channelId,
				thread_ts: threadTs,
				text: `Failed to process command \`${fullText}\`.\n${formatAPIError(errorMsg)}`,
			});
		}
	}

	private async processCommand (
		client: WebClient,
		payload: ChannelPayload,
		cmdText: string,
	) {
		const flags = argsToFlags(cmdText);

		if (!flags.cmd || flags.help) {
			await this.help(client, payload, flags);
			return;
		}

		if (flags.cmd === 'auth') {
			switch (flags.target) {
				case AuthSubcommand.Login:
					await this.authLogin(client, payload);
					return;
				case AuthSubcommand.Logout:
					await this.authLogout(client, payload);
					return;
				case AuthSubcommand.Status:
					await this.authStatus(client, payload);
					return;
				default:
					await this.help(client, payload, flags);
					return;
			}
		}

		if (flags.cmd === 'limits') {
			await this.limits(client, payload);
			return;
		}

		await this.createMeasurement(client, payload, cmdText, flags);
	}

	private async help (
		client: WebClient,
		payload: ChannelPayload,
		flags: Flags,
	) {
		await client.chat.postEphemeral({
			text: helpCmd(flags.cmd, flags.target, 'slack'),
			user: payload.user_id,
			channel: payload.channel_id,
			thread_ts: payload.thread_ts,
		});
	}

	private async createMeasurement (
		client: WebClient,
		payload: ChannelPayload,
		cmdText: string,
		flags: Flags,
	) {
		const opts = buildPostMeasurements(flags);

		this.logger.debug(`Posting measurement: ${JSON.stringify(opts)}`);
		let measurementResponse: PostMeasurementResponse;

		const token = await this.oauth.GetToken(payload.installationId);

		try {
			measurementResponse = await this.postMeasurement(
				opts,
				token?.access_token,
			);
		} catch (error) {
			if (error instanceof PostError) {
				const { statusCode, headers } = error.response;

				// Unauthorized or Forbidden
				if ((statusCode === 401 || statusCode === 403) && token) {
					const errMsg = await this.oauth.TryToRefreshToken(
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
			user: payload.user_id,
			channel: payload.channel_id,
			thread_ts: payload.thread_ts,
		});

		this.logger.debug(`Post response: ${JSON.stringify(measurementResponse)}`);
		const res = await this.getMeasurement(measurementResponse.id);
		this.logger.debug(`Get response: ${JSON.stringify(res)}`);

		const blocks = formatMeasurementResponse(payload.user_id, cmdText, res, flags);

		await client.chat.postMessage({
			blocks,
			channel: payload.channel_id,
			thread_ts: payload.thread_ts,
		});
	}

	private async authLogin (client: WebClient, payload: ChannelPayload) {
		if (!await this.canUseAuthCommand(client, payload)) {
			return;
		}

		const res = await this.oauth.Authorize(payload);
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

	private async authStatus (client: WebClient, payload: ChannelPayload) {
		if (!await this.canUseAuthCommand(client, payload)) {
			return;
		}

		const [ introspection, error ] = await this.oauth.Introspect(payload.installationId);
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

	private async authLogout (client: WebClient, payload: ChannelPayload) {
		if (!await this.canUseAuthCommand(client, payload)) {
			return;
		}

		const error = await this.oauth.Logout(payload.installationId);
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

	private async canUseAuthCommand (
		client: WebClient,
		payload: ChannelPayload,
	): Promise<boolean> {
		const userInfoRes = await client.users.info({ user: payload.user_id });
		const { user } = userInfoRes;

		if (!user) {
			this.logger.error('Failed to get user info');

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

	private async limits (client: WebClient, payload: ChannelPayload) {
		const [ introspection, error ] = await this.oauth.Introspect(payload.installationId);

		if (!introspection) {
			await client.chat.postEphemeral({
				text: `${error?.error}: ${error?.error_description}`,
				user: payload.user_id,
				channel: payload.channel_id,
				thread_ts: payload.thread_ts,
			});

			return;
		}

		const [ limits, limitsError ] = await this.oauth.Limits(payload.installationId);

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
}

export function getRawTextFromBlocks (
	botUserId: string,
	blocks?: (KnownBlock | Block)[],
): string {
	if (!blocks) {
		return '';
	}

	let text = '';
	traverseBlocks(blocks, (block) => {
		if (block.type === 'user' && 'user_id' in block && block.user_id === botUserId) {
			// ignore text before the bot mention
			text = '';
		} else if ('text' in block && typeof block.text === 'string') {
			if ((block.text as string).trim()) {
				text += block.text;
			}
		}
	});

	return text.trim();
}

function traverseBlocks (blocks: (KnownBlock | Block)[], callback: (block: KnownBlock | Block | RichTextBlockElement) => void) {
	for (const block of blocks) {
		if ('text' in block || block.type === 'user') {
			callback(block);
		}

		if ('elements' in block) {
			traverseBlocks(block.elements, callback);
		}
	}
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
