import {
	Flags,
	fullResultsFooter,
	getTag,
	LinkBlockType,
	Measurement,
	responseHeader,
	responseText,
	shareMessageFooter,
} from '@globalping/bot-utils';
import { KnownBlock } from '@slack/web-api';

const maxDisplayedResults = 4;

export const formatMeasurementResponse = (
	userId: string,
	cmdText: string,
	res: Measurement,
	flags: Flags,
) => {
	const blocks: KnownBlock[] = [
		{
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: `<@${userId}>, here are the results for \`${cmdText}\``,
				verbatim: true,
			},
		},
	];
	const resultsForDisplay = res.results.slice(0, maxDisplayedResults);
	const slackBoldSeparator = '*';
	const mrkdownBlockLimit = 3000;

	for (const result of resultsForDisplay) {
		const tag = getTag(result.probe.tags);
		const header = responseHeader(result, tag, slackBoldSeparator);
		const text = responseText(result, flags, mrkdownBlockLimit - header.length);
		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: header + text,
				verbatim: true,
			},
		});
	}

	const resultsTruncated = resultsForDisplay.length !== res.results.length;

	if (resultsTruncated) {
		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: fullResultsFooter(
					res.id,
					slackBoldSeparator,
					LinkBlockType.Slack,
				),
				verbatim: true,
			},
		});
	} else if (flags.share) {
		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: shareMessageFooter(
					res.id,
					slackBoldSeparator,
					LinkBlockType.Slack,
				),
				verbatim: true,
			},
		});
	}

	return blocks;
};
