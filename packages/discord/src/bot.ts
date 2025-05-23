import {
	AuthSubcommand,
	buildPostMeasurements,
	Flags,
	formatAPIError,
	fullResultsFooter,
	generateHelp,
	getMeasurement,
	getTag,
	HelpTexts,
	KnexClient,
	LinkBlockType,
	Logger,
	Measurement,
	MeasurementCreate,
	MeasurementCreateResponse,
	OAuthClient,
	postMeasurement,
	responseHeader,
	responseText,
	shareMessageFooter,
	throwArgError,
	getLimitsOutput,
	AuthorizeErrorType,
	AuthToken,
	AuthorizeError,
	PostError,
	getTooManyRequestsError,
	CustomRoute,
	parseCallbackURL,
	argsToFlags,
} from '@globalping/bot-utils';
import {
	APIEmbed,
	APIEmbedField,
	CacheType,
	ChatInputCommandInteraction,
	Client,
	ClientUser,
	GatewayIntentBits,
	inlineCode,
	Interaction,
	InteractionEditReplyOptions,
	Message,
	MessageFlags,
	MessageReplyOptions,
	PermissionFlagsBits,
	PermissionsBitField,
	Routes,
	userMention,
} from 'discord.js';

import { getHelpForCommand } from './utils.js';
import { Config } from './types.js';
import { DBClient, AuthorizeSession } from './db.js';
import { IncomingMessage, ServerResponse } from 'node:http';

export const initBot = (
	config: Config,
	logger: Logger,
	knex: KnexClient,
	routes: CustomRoute[],
) => {
	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.DirectMessages,
			GatewayIntentBits.MessageContent,
		],
	});

	const db = new DBClient(knex, logger);

	const oauth = new OAuthClient(config, logger, db);

	const bot = new Bot(
		logger,
		config,
		db,
		postMeasurement,
		getMeasurement,
		oauth,
		client,
	);
	routes.push({
		path: config.authCallbackPath,
		method: [ 'GET' ],
		handler: (req, res) => bot.OnAuthCallback(req, res),
	});

	client.on('ready', () => logger.info('Discord bot is online'));
	client.on('debug', m => logger.debug(m));
	client.on('warn', m => logger.warn(m));
	client.on('error', m => logger.error(m.message, m));

	client.on('interactionCreate', args => bot.HandleInteraction(args));
	client.on('messageCreate', args => bot.HandleMessage(args));

	return client;
};

export class Bot {
	private maxDisplayedResults = 4;
	private help: HelpTexts;

	constructor (
		private logger: Logger,
		private config: Config,
		private dbClient: DBClient,
		private postMeasurement: (
			opts: MeasurementCreate,
			token?: string,
		) => Promise<MeasurementCreateResponse>,
		private getMeasurement: (id: string) => Promise<Measurement>,
		private oauth: OAuthClient,
		private discord: Client,
	) {
		this.help = generateHelp('**', '/globalping', undefined, 4, 1);
	}

	async HandleInteraction (interaction: Interaction<CacheType>) {
		if (!interaction.isChatInputCommand()) {
			return;
		}

		const { commandName, user } = interaction;

		if (commandName !== 'globalping') {
			return;
		}

		let cmdText;

		try {
			const flags = this.getFlags(interaction);

			if (flags.cmd === 'help') {
				if (typeof flags.help !== 'string') {
					flags.help = 'help';
				}

				await interaction.reply({
					content: getHelpForCommand(flags.help, flags.target, this.help),
					flags: MessageFlags.Ephemeral,
				});

				return;
			}

			cmdText = this.expandCommand(flags);

			const id = this.getIdFromInteraction(interaction);

			if (flags.cmd === 'auth') {
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });

				if (!await this.canUseAuthCommandFromInteraction(interaction)) {
					return;
				}

				let response: InteractionEditReplyOptions;

				switch (flags.target) {
					case AuthSubcommand.Login:
						response = await this.authLogin(id, interaction);

						break;
					case AuthSubcommand.Logout:
						response = await this.authLogout(id);
						break;
					case AuthSubcommand.Status:
						response = await this.authStatus(id);
						break;
					default:
						return;
				}

				await interaction.editReply(response);
				return;
			}

			if (flags.cmd === 'limits') {
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });

				const response = await this.limits(id);

				await interaction.editReply(response);
				return;
			}

			if (!flags.from) {
				flags.from = 'world';
			}

			if (!flags.limit) {
				flags.limit = 1;
			}

			await interaction.deferReply();

			const response = await this.createMeasurement(
				id,
				interaction.user.id,
				flags,
				cmdText,
			);
			await interaction.editReply(response);
		} catch (error) {
			this.logger.error(`Error processing request`, {
				error,
				command: cmdText,
			});

			const errorMsg = `${userMention(user.id)}, there was an error processing your request for ${inlineCode(cmdText ?? 'help')}
${formatAPIError(error, LinkBlockType.AngleBrackets)}`;

			if (interaction.deferred) {
				await interaction.editReply(errorMsg);
			} else {
				await interaction.reply(errorMsg);
			}
		}
	}

	async HandleMessage (message: Message) {
		if (!message.mentions.has(message.client.user)) {
			return;
		}

		// Ignore messages from the bot itself
		if (message.author.id === message.client.user.id) {
			return;
		}

		const cmdText = this.parseMentionContent(
			message.content,
			message.client.user,
		);

		try {
			const flags = argsToFlags(cmdText);

			if (!flags.cmd || flags.help) {
				await message.reply({
					content: getHelpForCommand(flags.cmd, flags.target, this.help),
				});

				return;
			}

			const id = this.getIdFromMessage(message);

			if (flags.cmd === 'auth') {
				if (!await this.canUseAuthCommandFromMessage(message)) {
					return;
				}

				let response: MessageReplyOptions;

				switch (flags.target) {
					case AuthSubcommand.Login:
						response = {
							content: 'Please use `/globalping auth login` instead.',
						};

						break;
					case AuthSubcommand.Logout:
						response = await this.authLogout(id);
						break;
					case AuthSubcommand.Status:
						response = await this.authStatus(id);
						break;
					default:
						await message.reply({
							content: getHelpForCommand(flags.cmd, flags.target, this.help),
						});

						return;
				}

				await message.reply(response);
				return;
			}

			if (flags.cmd === 'limits') {
				const response = await this.limits(id);
				await message.reply(response);
				return;
			}

			const response = await this.createMeasurement(
				id,
				message.author.id,
				flags,
				cmdText,
			);
			await message.reply(response);
		} catch (error) {
			this.logger.error(`Error processing request`, {
				error,
				command: cmdText,
				originalCommand: message.content,
				user: message.client.user,
			});

			const errorMsg = `${userMention(message.author.id)}, there was an error processing your request for ${inlineCode(cmdText ?? 'help')}
${formatAPIError(error, LinkBlockType.AngleBrackets)}`;
			await message.reply(errorMsg);
		}
	}

	async OnAuthCallback (req: IncomingMessage, res: ServerResponse) {
		const url = parseCallbackURL(req.url || '', this.config.serverHost);

		if (!url.verifier || !url.id) {
			this.logger.error('/oauth/callback missing state', {
				error: url.error,
				errorDescription: url.errorDescription,
			});

			res.writeHead(302, {
				Location: `${this.config.dashboardUrl}/authorize/error`,
			});

			res.end();
			return;
		}

		let oldToken: AuthToken | null;
		let session: AuthorizeSession | null;

		try {
			const data = await this.dbClient.getDataForAuthorization(url.id);
			oldToken = data.token;
			session = data.session;
		} catch {
			res.writeHead(302, {
				Location: `${this.config.dashboardUrl}/authorize/error`,
			});

			res.end();
			return;
		}

		if (!session) {
			this.logger.error('/oauth/callback missing session', { id: url.id });

			res.writeHead(302, {
				Location: `${this.config.dashboardUrl}/authorize/error`,
			});

			res.end();
			return;
		}

		if (url.verifier !== session.callbackVerifier) {
			this.logger.error('/oauth/callback invalid verifier', {
				id: url.id,
			});

			res.writeHead(302, {
				Location: `${this.config.dashboardUrl}/authorize/error`,
			});

			res.end();
			return;
		}

		try {
			// Delete session
			await this.dbClient.updateAuthorizeSession(url.id, null);
		} catch (error) {
			this.logger.error('/oauth/callback failed to delete session', error);
		}

		if (url.error || !url.code) {
			try {
				await this.discord.rest.post(
					Routes.webhook(session.applicationId, session.token),
					{
						body: {
							content: `Authentication failed: ${url.error}: ${url.errorDescription}`,
							flags: MessageFlags.Ephemeral,
						},
					},
				);
			} catch (error) {
				this.logger.error('/oauth/callback failed to post ephemeral', error);
			}

			this.logger.error('/oauth/callback failed', {
				error: url.error,
				errorDescription: url.errorDescription,
				code: url.code,
				id: url.id,
			});

			res.writeHead(302, {
				Location: `${this.config.dashboardUrl}/authorize/error`,
			});

			res.end();
			return;
		}

		let exchangeError: AuthorizeError | null;

		try {
			exchangeError = await this.oauth.Exchange(
				url.code,
				session.exchangeVerifier,
				url.id,
			);

			// Revoke old token if exists
			if (!exchangeError && oldToken && oldToken.refresh_token) {
				try {
					await this.oauth.RevokeToken(oldToken.refresh_token);
				} catch (error) {
					this.logger.error('/oauth/callback failed to revoke token', {
						id: url.id,
						error,
					});
				}
			}
		} catch {
			exchangeError = {
				error: AuthorizeErrorType.InternalError,
				error_description: 'Failed to exchange code',
			};
		}

		let message = '';

		if (exchangeError) {
			this.logger.error('/oauth/callback failed', exchangeError);
			message = `Authentication failed: ${exchangeError.error}: ${exchangeError.error_description}`;
		} else {
			message = 'Success! You are now authenticated.';
		}

		try {
			await this.discord.rest.post(
				Routes.webhook(session.applicationId, session.token),
				{
					body: {
						content: message,
						flags: MessageFlags.Ephemeral,
					},
				},
			);
		} catch (error) {
			this.logger.error('/oauth/callback failed to reply to user', error);
		}

		res.writeHead(302, {
			Location:
				this.config.dashboardUrl
				+ (exchangeError ? '/authorize/error' : '/authorize/success'),
		});

		res.end();
	}

	private async createMeasurement (
		localId: string,
		userId: string,
		flags: Flags,
		cmdText: string,
	) {
		const token = await this.oauth.GetToken(localId);

		let measurementResponse: MeasurementCreateResponse;

		try {
			measurementResponse = await this.postMeasurement(
				buildPostMeasurements(flags),
				token?.access_token,
			);
		} catch (error) {
			if (error instanceof PostError) {
				const { statusCode, headers } = error.response;

				// Unauthorized or Forbidden
				if ((statusCode === 401 || statusCode === 403) && token) {
					const errMsg = await this.oauth.TryToRefreshToken(localId, token);

					if (errMsg) {
						throw new Error(errMsg);
					}
				}

				// Too many requests
				if (statusCode === 429) {
					throw getTooManyRequestsError(headers, token);
				}
			}

			throw error;
		}

		const res = await this.getMeasurement(measurementResponse.id);

		const embeds = this.formatMeasurementResponse(res, flags);

		return {
			content: `${userMention(userId)}, here are the results for ${inlineCode(cmdText)}`,
			embeds,
		};
	}

	private async authLogin (
		id: string,
		interaction: ChatInputCommandInteraction,
	) {
		const res = await this.oauth.Authorize(id, {
			applicationId: interaction.applicationId,
			token: interaction.token,
		});

		let text = `Please [click here](${res.url}) to authenticate.`;

		if (interaction.inGuild()) {
			text
				+= '\n\n**Note:** This action applies to the whole server. Once logged in, all users on the server share the same account credits.';
		}

		return {
			embeds: [
				{
					description: text,
				},
			],
		};
	}

	private async authStatus (localId: string) {
		const [ introspection, error ] = await this.oauth.Introspect(localId);
		let text = '';

		if (error) {
			text
				= error.error === AuthorizeErrorType.NotAuthorized
					? 'Not logged in.'
					: `${error.error}: ${error.error_description}`;
		}

		text
			= introspection && introspection.active && introspection.username
				? `Logged in as ${introspection?.username}.`
				: 'Not logged in.';

		return {
			content: text,
		};
	}

	private async authLogout (localId: string) {
		const error = await this.oauth.Logout(localId);
		let text = '';
		text = error
			? `${error.error}: ${error.error_description}`
			: 'You are now logged out.';

		return {
			content: text,
		};
	}

	private async limits (localId: string) {
		const [ introspection, error ] = await this.oauth.Introspect(localId);

		if (!introspection) {
			return {
				content: `${error?.error}: ${error?.error_description}`,
			};
		}

		const [ limits, limitsError ] = await this.oauth.Limits(localId);

		if (!limits) {
			return {
				content: `${limitsError?.type}: ${limitsError?.message}`,
			};
		}

		return {
			content: getLimitsOutput(limits, introspection),
		};
	}

	private getIdFromInteraction (interaction: ChatInputCommandInteraction): string {
		if (interaction.inGuild()) {
			return `G${interaction.guildId}`;
		}

		return `U${interaction.user.id}`;
	}

	private getIdFromMessage (message: Message): string {
		if (message.inGuild()) {
			return `G${message.guildId}`;
		}

		return `U${message.author.id}`;
	}

	private async canUseAuthCommandFromInteraction (interaction: ChatInputCommandInteraction): Promise<boolean> {
		if (!interaction.inGuild()) {
			return true;
		}

		const canAuthenticate = (
			interaction.member.permissions as PermissionsBitField
		).has(PermissionFlagsBits.Administrator);

		if (!canAuthenticate) {
			await interaction.editReply({
				content: 'Only administrators can use this command.',
			});

			return false;
		}

		return true;
	}

	private async canUseAuthCommandFromMessage (message: Message): Promise<boolean> {
		if (!message.inGuild()) {
			return true;
		}

		const canAuthenticate
			= message.member?.permissions?.has(PermissionFlagsBits.Administrator);

		if (!canAuthenticate) {
			await message.reply({
				content: 'Only administrators can use this command.',
			});

			return false;
		}

		return true;
	}

	private getFlags (interaction: ChatInputCommandInteraction): Flags {
		const cmd = interaction.options.getSubcommand();

		if (interaction.options.getSubcommandGroup() === 'auth') {
			return {
				cmd: 'auth',
				target: cmd,
				from: '',
				limit: undefined as unknown as number,
			};
		}

		if (cmd === 'help') {
			let help = interaction.options.getString('command') ?? 'help';
			let target = '';

			if (help.startsWith('auth ')) {
				target = help.split(' ')[1];
				help = 'auth';
			}

			return {
				cmd,
				target,
				from: '',
				limit: undefined as unknown as number,
				help,
			};
		}

		if (cmd === 'limits') {
			return {
				cmd,
				target: '',
				from: '',
				limit: undefined as unknown as number,
			};
		}

		const target
			= interaction.options.getString('target')
			?? throwArgError(undefined, 'target', 'jsdelivr.com');
		const from = interaction.options.getString('from') ?? undefined;
		const rawHeader
			= interaction.options
				.getString('header')
				?.split(':')
				.map(header => header.trim()) ?? undefined;

		return {
			cmd,
			target,
			from: from as string,
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
			share: interaction.options.getBoolean('share') ?? undefined,
			latency: interaction.options.getBoolean('latency') ?? undefined,
			full: interaction.options.getBoolean('full') ?? undefined,
		};
	}

	private expandCommand (flags: Flags): string {
		let cmd = `${flags.cmd} ${flags.target}`;

		if (flags.from) {
			cmd += ` from ${flags.from}`;
		}

		const entries = Object.entries(flags);
		const skipFlag = new Set([ 'cmd', 'target', 'from', 'help' ]);

		for (const [ key, value ] of entries) {
			if (skipFlag.has(key)) {
				continue;
			}

			if (value === undefined) {
				continue;
			}

			if (key === 'headers') {
				// Headers have different flag format
				cmd += ` ${Object.entries(value)
					.map(([ headerKey, headerValue ]) => `--header ${headerKey}: ${headerValue}`)
					.join(' ')}`;

				continue;
			}

			cmd += ` --${key} ${value}`;
		}

		return cmd;
	}

	private formatMeasurementResponse (
		response: Measurement,
		flags: Flags,
	): APIEmbed[] {
		const boldSeparator = '**';
		const resultsForDisplay = response.results.slice(
			0,
			this.maxDisplayedResults,
		);

		const fields: APIEmbedField[] = [];
		let resultsTruncated = resultsForDisplay.length !== response.results.length;

		for (const result of resultsForDisplay) {
			const rt = responseText(result, flags, 1024);
			resultsTruncated = resultsTruncated || rt.truncated;

			fields.push({
				name: responseHeader(result, getTag(result.probe.tags), boldSeparator),
				value: rt.text,
			});
		}

		if (resultsTruncated) {
			fields.push({
				name: '',
				value: fullResultsFooter(response.id, boldSeparator, LinkBlockType.Raw),
			});
		} else if (flags.share) {
			fields.push({
				name: '',
				value: shareMessageFooter(
					response.id,
					boldSeparator,
					LinkBlockType.Raw,
				),
			});
		}

		return [{ fields }];
	}

	private parseMentionContent (content: string, botUser: ClientUser) {
		const botMention = userMention(botUser.id);
		const botMentionIndex = content.indexOf(botMention);

		if (botMentionIndex !== -1) {
			return content
				.slice(botMentionIndex + botMention.length)
				.trim();
		}

		// Handle copy-paste issue. When a previous message command is copied
		// and pasted into a new message, discord might replace the mention
		// with a role reference.
		const roleReferenceIndex = content.lastIndexOf('<@&');

		if (roleReferenceIndex === -1) {
			return content;
		}

		const roleReferenceIndexEnd = content.indexOf('>', roleReferenceIndex);

		if (roleReferenceIndexEnd !== -1) {
			return content.slice(roleReferenceIndexEnd + 1).trim();
		}

		return content;
	}
}
