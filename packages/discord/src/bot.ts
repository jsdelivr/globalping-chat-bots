import {
	buildPostMeasurements,
	Flags,
	formatAPIError,
	fullResultsFooter,
	generateHelp,
	getMeasurement,
	getTag,
	HelpTexts,
	LinkBlockType,
	Logger,
	Measurement,
	MeasurementCreate,
	MeasurementCreateResponse,
	postMeasurement,
	responseHeader,
	responseText,
	shareMessageFooter,
	throwArgError,
} from '@globalping/bot-utils';
import {
	APIEmbed,
	APIEmbedField,
	CacheType,
	ChatInputCommandInteraction,
	Client,
	GatewayIntentBits,
	inlineCode,
	Interaction,
	userMention,
} from 'discord.js';

import { expandFlags, getHelpForCommand } from './utils.js';

export const initBot = (logger: Logger) => {
	const client = new Client({ intents: [ GatewayIntentBits.Guilds ] });

	const bot = new Bot(logger, postMeasurement, getMeasurement);

	client.on('ready', () => logger.info('Discord bot is online'));
	client.on('debug', m => logger.debug(m));
	client.on('warn', m => logger.warn(m));
	client.on('error', m => logger.error(m.message, m));

	client.on('interactionCreate', args => bot.handleInteraction(args));

	return client;
};

class Bot {
	private maxDisplayedResults = 4;
	private help: HelpTexts;

	constructor (
		private logger: Logger,
		private postMeasurement: (
			opts: MeasurementCreate,
			token?: string,
		) => Promise<MeasurementCreateResponse>,
		private getMeasurement: (id: string) => Promise<Measurement>,
	) {
		this.help = generateHelp('**', '/globalping', new Set([ 'auth', 'limits' ]));
	}

	async handleInteraction (interaction: Interaction<CacheType>) {
		this.logger.debug(`Received interaction`, { interaction });

		if (!interaction.isChatInputCommand()) {
			return;
		}

		const { commandName, user } = interaction;

		if (commandName !== 'globalping') {
			return;
		}

		await interaction.deferReply();

		let txtCommand;

		try {
			const flags = this.getFlags(interaction);
			this.logger.debug(`Flags received`, { flags });

			if (flags.cmd === 'help') {
				if (typeof flags.help !== 'string') {
					flags.help = 'help';
				}

				await interaction.editReply({
					content: getHelpForCommand(flags.help, '', this.help),
				});

				return;
			}

			const txtFlags
				= expandFlags(flags).length > 0 ? ` ${expandFlags(flags)}` : '';
			txtCommand = `${flags.cmd} ${flags.target} from ${flags.from}${txtFlags}`;

			const measurementResponse = await this.postMeasurement(buildPostMeasurements(flags));
			const res = await this.getMeasurement(measurementResponse.id);
			this.logger.debug(`Get response`, { res });

			const embeds = this.formatMeasurementResponse(res, flags);

			await interaction.editReply({
				content: `${userMention(user.id)}, here are the results for ${inlineCode(txtCommand)}`,
				embeds,
			});
		} catch (error) {
			await interaction.editReply(`${userMention(user.id)}, there was an error processing your request for ${inlineCode(txtCommand ?? 'help')}
${formatAPIError(error)}`);
		}
	}

	private getFlags (interaction: ChatInputCommandInteraction): Flags {
		const cmd = interaction.options.getSubcommand();
		const helpVal
			= interaction.options.getString('command')
			?? (cmd === 'help' ? 'help' : undefined);

		const target
			= interaction.options.getString('target')
			?? (helpVal ? '' : throwArgError(undefined, 'target', 'jsdelivr.com'));
		const from
			= interaction.options.getString('from')
			?? (helpVal ? '' : throwArgError(undefined, 'from', 'New York'));
		const rawHeader
			= interaction.options
				.getString('header')
				?.split(':')
				.map(header => header.trim()) ?? undefined;

		return {
			cmd,
			target,
			from,
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
			help: helpVal,
		};
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

		for (const result of resultsForDisplay) {
			fields.push({
				name: responseHeader(result, getTag(result.probe.tags), boldSeparator),
				value: responseText(result, flags, 1024),
			});
		}

		if (resultsForDisplay.length !== response.results.length) {
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
}
