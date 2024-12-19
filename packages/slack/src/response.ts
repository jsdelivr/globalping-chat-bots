import {
	Flags,
	fullResultsFooter,
	getTag,
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
	const slackTruncationLimit = 4000;

	/* eslint-disable no-await-in-loop */
	for (const result of resultsForDisplay) {
		const tag = getTag(result.probe.tags);
		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text:
					responseHeader(result, tag, slackBoldSeparator)
					+ responseText(result, flags, slackTruncationLimit),
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
				text: fullResultsFooter(res.id, slackBoldSeparator, true),
				verbatim: true,
			},
		});
	} else if (flags.share) {
		blocks.push({
			type: 'section',
			text: {
				type: 'mrkdwn',
				text: shareMessageFooter(res.id, slackBoldSeparator, true),
				verbatim: true,
			},
		});
	}

	return blocks;
};
