import { PingResult } from '@globalping/bot-utils';
import { describe, expect, it } from 'vitest';

import { fullResultsFooter, responseHeader, shareMessageFooter } from '../response';

describe('Response', () => {
    const boldSeparator = '*';

    describe('shareMessageFooter', () => {
        it('ok', () => {
            const id = 'abc123';
            const text = shareMessageFooter(id, boldSeparator, true);
            expect(text).to.equal('>*View the results online: <https://www.jsdelivr.com/globalping?measurement=abc123>*\n');
        });
    });

    describe('fullResultsFooter', () => {
        it('ok', () => {
            const id = 'abc123';
            const text = fullResultsFooter(id, boldSeparator, true);
            expect(text).to.equal('>*Full results available here: <https://www.jsdelivr.com/globalping?measurement=abc123>*\n');
        });
    });

    describe('responseHeader', () => {
        it('no state no tag', () => {
            const pingResult: PingResult = {
                resolvedAddress: '',
                resolvedHostname: '',
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
                    rawOutput: '',
                    rawHeaders: '',
                    rawBody: '',
                    stats: {
                        loss: 0,
                        min: 0,
                        avg: 0,
                        max: 0,
                    },
                    timings: undefined,
                },
            };
            const tag = undefined;
            const text = responseHeader(pingResult, tag, boldSeparator);
            expect(text).to.equal('>*EU, AT, Vienna, ASN:12345, My Network*\n');
        });
    });

    describe('responseHeader', () => {
        it('state and tags', () => {
            const pingResult: PingResult = {
                resolvedAddress: '',
                resolvedHostname: '',
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
                    tags: ['tag-1', 'tag-2'],
                },
                result: {
                    rawOutput: '',
                    rawHeaders: '',
                    rawBody: '',
                    stats: {
                        loss: 0,
                        min: 0,
                        avg: 0,
                        max: 0,
                    },
                    timings: undefined,
                },
            };
            const text = responseHeader(pingResult, 'tag-1', boldSeparator);
            expect(text).to.equal('>*NA, US, (GA), Atlanta, ASN:12345, My Network (tag-1)*\n');
        });
    });
});
