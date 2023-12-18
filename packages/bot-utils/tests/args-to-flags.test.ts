import { describe, expect, it } from 'vitest';

import { argsToFlags, Flags } from '../src/flags';

describe('Utils', () => {
	describe('args to flags', () => {
		it('should convert dns args to flags', () => {
			const args =
				'dns google.com from New York --limit 2 --type AAAA --protocol tcp --port 80 --resolver 1.1.1.1 --trace --latency';
			const result = argsToFlags(args);
			const flags: Flags = {
				cmd: 'dns',
				target: 'google.com',
				from: 'New York',
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

		describe('http args to flags', () => {
			it('host target', () => {
				const args =
					'http google.com from New York --limit 2 --path / --query ?a=abc --host google.fr --method get --port 80 --protocol http2 --latency';
				const result = argsToFlags(args);

				const flags: Flags = {
					cmd: 'http',
					from: 'New York',
					host: 'google.fr',
					limit: 2,
					method: 'GET',
					path: '/',
					port: 80,
					protocol: 'HTTP2',
					query: '?a=abc',
					target: 'google.com',
					latency: true,
					headers: {},
				};

				expect(result).toEqual(flags);
			});

			it('url target, resolver and spaces', () => {
				const args =
					'http https://www.example.com:1234/my/path/?abc=123&xyz=test @8.8.8.8  --from usa  --limit 2   --method get';
				const result = argsToFlags(args);

				const flags: Flags = {
					cmd: 'http',
					from: 'usa',
					host: 'www.example.com',
					limit: 2,
					method: 'GET',
					path: '/my/path/',
					port: 1234,
					protocol: 'HTTPS',
					query: 'abc=123&xyz=test',
					target: 'www.example.com',
					headers: {},
					resolver: '8.8.8.8',
				};

				expect(result).toEqual(flags);
			});

			it('with 1 simple header', () => {
				const args =
					'http google.com from New York --limit 2 --path / --query  "?a=abc"  --host  google.fr --method get --port  80 --protocol http2 --full -H "AB: 123z"';
				const result = argsToFlags(args);

				const flags: Flags = {
					cmd: 'http',
					from: 'New York',
					host: 'google.fr',
					limit: 2,
					method: 'GET',
					path: '/',
					port: 80,
					protocol: 'HTTP2',
					query: '?a=abc',
					target: 'google.com',
					full: true,
					headers: {
						AB: '123z',
					},
				};

				expect(result).toEqual(flags);
			});

			it('with 2 headers', () => {
				const args =
					'http google.com from New York --limit 2 --path / --query ?a=abc --host google.fr --method get --port 80 --protocol http2 --latency --header "Content-Encoding: gzip" --header \'Content-Type: text/html; charset=utf-8\'';
				const result = argsToFlags(args);

				const flags: Flags = {
					cmd: 'http',
					from: 'New York',
					host: 'google.fr',
					limit: 2,
					method: 'GET',
					path: '/',
					port: 80,
					protocol: 'HTTP2',
					query: '?a=abc',
					target: 'google.com',
					latency: true,
					headers: {
						'Content-Encoding': 'gzip',
						'Content-Type': 'text/html; charset=utf-8',
					},
				};

				expect(result).toEqual(flags);
			});
		});

		it('convert ping args to flags', () => {
			const args =
				'ping google.com from New York --limit 2 --packets 3 --latency';
			const result = argsToFlags(args);
			const flags: Flags = {
				cmd: 'ping',
				from: 'New York',
				limit: 2,
				packets: 3,
				target: 'google.com',
				latency: true,
			};

			expect(result).toEqual(flags);
		});

		it('convert mtr args to flags with share', () => {
			const args =
				'mtr aws.com from Canada --packets 2 --protocol icmp -L 5 --share';
			const result = argsToFlags(args);
			const flags: Flags = {
				cmd: 'mtr',
				from: 'Canada',
				limit: 5,
				packets: 2,
				protocol: 'ICMP',
				target: 'aws.com',
				share: true,
			};

			expect(result).toEqual(flags);
		});
	});
});
