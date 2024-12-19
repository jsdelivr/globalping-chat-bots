import { describe, expect, it } from 'vitest';

import {
	fullResultsFooter,
	responseHeader,
	shareMessageFooter,
} from '../src/response.js';
import { ProbeMeasurement } from '../src/types.js';

describe('Response', () => {
	const boldSeparator = '*';

	describe('shareMessageFooter', () => {
		it('ok', () => {
			const id = 'abc123';
			const text = shareMessageFooter(id, boldSeparator, true);
			expect(text).to.equal('>*View the results online: <https://globalping.io?measurement=abc123>*\n');
		});
	});

	describe('fullResultsFooter', () => {
		it('ok', () => {
			const id = 'abc123';
			const text = fullResultsFooter(id, boldSeparator, true);
			expect(text).to.equal('>*Full results available here: <https://globalping.io?measurement=abc123>*\n');
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
			expect(text).to.equal('>*Vienna, AT, EU, My Network (AS12345)*\n');
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
			expect(text).to.equal('>*Atlanta (GA), US, NA, My Network (AS12345), (tag-1)*\n');
		});
	});
});
