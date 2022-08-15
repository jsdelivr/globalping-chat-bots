import { ChatInputCommandInteraction } from 'discord.js';

export const getOptions = (interaction: ChatInputCommandInteraction) => ({
	target: interaction.options.getString('target'),
	from: interaction.options.getString('from'),
	limit: interaction.options.getInteger('limit')
});
