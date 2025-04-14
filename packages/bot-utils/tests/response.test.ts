import { describe, expect, it } from 'vitest';

import {
	fullResultsFooter,
	getMoreCreditsRequiredAuthError,
	getMoreCreditsRequiredNoAuthError,
	getNoCreditsAuthError,
	getNoCreditsNoAuthError,
	LinkBlockType,
	responseHeader,
	shareMessageFooter,
} from '../src/response.js';
import { ProbeMeasurement } from '../src/types.js';

describe('Response', () => {
	const boldSeparator = '*';

	describe('shareMessageFooter', () => {
		it('ok', () => {
			const id = 'abc123';
			const text = shareMessageFooter(id, boldSeparator, LinkBlockType.AngleBrackets);
			expect(text).to.equal('> *View the results online: <https://globalping.io?measurement=abc123>*\n');
		});
	});

	describe('fullResultsFooter', () => {
		it('ok', () => {
			const id = 'abc123';
			const text = fullResultsFooter(id, boldSeparator, LinkBlockType.AngleBrackets);
			expect(text).to.equal('> *Full results available here: <https://globalping.io?measurement=abc123>*\n');
		});
	});

	describe('responseHeader', () => {
		it('no state no tag', () => {
			const pingResult: ProbeMeasurement = {
				probe: {
					continent: 'EU',
					region: '',
					country: 'AT',
					state: '',
					city: 'Vienna',
					asn: 12_345,
					longitude: 0,
					latitude: 0,
					network: 'My Network',
					resolvers: [],
					tags: [],
				},
				result: {
					status: 'in-progress',
					rawOutput: '',
				},
			};
			const tag = undefined;
			const text = responseHeader(pingResult, tag, boldSeparator);
			expect(text).to.equal('> *Vienna, AT, EU, My Network (AS12345)*\n');
		});
	});

	describe('responseHeader', () => {
		it('state and tags', () => {
			const pingResult: ProbeMeasurement = {
				probe: {
					continent: 'NA',
					region: '',
					country: 'US',
					state: 'GA',
					city: 'Atlanta',
					asn: 12_345,
					longitude: 0,
					latitude: 0,
					network: 'My Network',
					resolvers: [],
					tags: [ 'tag-1', 'tag-2' ],
				},
				result: {
					status: 'in-progress',
					rawOutput: '',
				},
			};
			const text = responseHeader(pingResult, 'tag-1', boldSeparator);
			expect(text).to.equal('> *Atlanta (GA), US, NA, My Network (AS12345), (tag-1)*\n');
		});
	});

	describe('getMoreCreditsRequiredAuthError', () => {
		it('should return correct error', () => {
			const error = getMoreCreditsRequiredAuthError(5, 2, 300);
			expect(error).toEqual(new Error('You only have 2 credits remaining, and 5 were required. Try requesting fewer probes or wait 5 minutes for the rate limit to reset. You can get higher limits by sponsoring us or hosting probes. Learn more at https://dash.globalping.io?view=add-credits.'));
		});
	});

	describe('getNoCreditsAuthError', () => {
		it('should return correct error', () => {
			const error = getNoCreditsAuthError(60);
			expect(error).toEqual(new Error('You have run out of credits for this session. You can wait 1 minute for the rate limit to reset or get higher limits by sponsoring us or hosting probes. Learn more at https://dash.globalping.io?view=add-credits.'));
		});
	});

	describe('getMoreCreditsRequiredNoAuthError', () => {
		it('should return correct error', () => {
			const error = getMoreCreditsRequiredNoAuthError(2, 1, 245);
			expect(error).toEqual(new Error('You only have 1 credit remaining, and 2 were required. Try requesting fewer probes or wait 4 minutes for the rate limit to reset. You can get higher limits by creating an account. Sign up at https://dash.globalping.io?view=add-credits.'));
		});
	});

	describe('getNoCreditsNoAuthError', () => {
		it('should return correct error', () => {
			const error = getNoCreditsNoAuthError(10);
			expect(error).toEqual(new Error('You have run out of credits for this session. You can wait 10 seconds for the rate limit to reset or get higher limits by creating an account. Sign up at https://dash.globalping.io?view=add-credits.'));
		});
	});
});
