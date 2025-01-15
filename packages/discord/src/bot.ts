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
} from '@globalping/bot-utils';
import {
	APIEmbed,
	APIEmbedField,
	CacheType,
	Client,
	GatewayIntentBits,
	inlineCode,
	Interaction,
	userMention,
} from 'discord.js';

import { expandFlags, getFlags, getHelpForCommand } from './utils.js';

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
			const flags = getFlags(interaction);
			this.logger.debug(`Flags received`, { flags });

			if (flags.cmd === 'help') {
				if (typeof flags.help !== 'string') {
					flags.help = 'help';
				}

				await interaction.editReply({
					content: getHelpForCommand(flags.help, '', this.help),
				});
			} else {
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
			}
		} catch (error) {
			await interaction.editReply(`${userMention(user.id)}, there was an error processing your request for ${inlineCode(txtCommand ?? 'help')}`);

			await interaction.followUp({ content: formatAPIError(error) });
		}
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
