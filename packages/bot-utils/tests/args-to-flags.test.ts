import { describe, expect, it } from 'vitest';

import { argsToFlags, Flags } from '../src/flags';

describe('Utils', () => {
    describe('args to flags', () => {
        it('should convert dns args to flags', () => {
            const args = 'dns google.com from New York --limit 2 --query AAAA --protocol tcp --port 80 --resolver 1.1.1.1 --trace --latency';
            const result = argsToFlags(args);
            const flags: Flags = {
                cmd: 'dns',
                target: 'google.com',
                from: 'new york',
                limit: 2,
                query: 'AAAA',
                protocol: 'TCP',
                port: 80,
                resolver: '1.1.1.1',
                trace: true,
                latency: true,
            };

            expect(result).toEqual(flags);
        });

        it('convert http args to flags', () => {
            const args = 'http google.com from New York --limit 2 --path / --query ?a=abc --host google.fr --method get --port 80 --protocol https --latency';
            const result = argsToFlags(args);

            const flags: Flags = {
                cmd: 'http',
                from: 'new york',
                host: 'google.fr',
                limit: 2,
                method: 'GET',
                path: '/',
                port: 80,
                protocol: 'HTTPS',
                query: '?a=abc',
                target: 'google.com',
                latency: true,
            };

            expect(result).toEqual(flags);
        });


        it('convert ping args to flags', () => {
            const args = 'ping google.com from New York --limit 2 --packets 3 --latency';
            const result = argsToFlags(args);
            const flags: Flags = {
                cmd: 'ping',
                from: 'new york',
                limit: 2,
                packets: 3,
                target: 'google.com',
                latency: true,
            };

            expect(result).toEqual(flags);
        });

    });
});