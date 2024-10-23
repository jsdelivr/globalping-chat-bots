import { describe, expect, it } from 'vitest';

import { argsToFlags } from '../src/flags.js';
import { buildPostMeasurements } from '../src/measurements-request.js';

describe('Utils', () => {
	describe('parse arguments', () => {
		describe('ping', () => {
			it('should parse ping args', () => {
				const args = 'ping google.com from New York';
				const result = buildPostMeasurements(argsToFlags(args));
				expect(result).toEqual([
					{
						type: 'ping',
						target: 'google.com',
						inProgressUpdates: false,
						limit: 1,
						locations: [{ magic: 'New York' }],
						measurementOptions: {},
					},
				]);
			});

			it('should parse ping args with flags', () => {
				const args = 'ping google.com from New York --limit 2 --packets 3';
				const result = buildPostMeasurements(argsToFlags(args));
				expect(result).toEqual([
					{
						type: 'ping',
						target: 'google.com',
						inProgressUpdates: false,
						limit: 2,
						locations: [{ magic: 'New York' }],
						measurementOptions: {
							packets: 3,
						},
					},
				]);
			});

			it('should throw if incorrect ping flag', () => {
				const args
					= 'ping google.com from New York --limit 2 --packets 3 --protocol icmp';
				expect(() => buildPostMeasurements(argsToFlags(args))).toThrow('Invalid option "protocol" for "ping"!\nExpected "packets, latency, target, from, limit, share".');
			});
		});

		describe('traceroute', () => {
			it('should parse traceroute args', () => {
				const args = 'traceroute google.com from New York';
				const result = buildPostMeasurements(argsToFlags(args));
				expect(result).toEqual([
					{
						type: 'traceroute',
						target: 'google.com',
						inProgressUpdates: false,
						limit: 1,
						locations: [{ magic: 'New York' }],
						measurementOptions: {},
					},
				]);
			});

			it('should parse traceroute args with flags', () => {
				const args
					= 'traceroute google.com from New York --limit 2 --protocol tcp --port 80';
				const result = buildPostMeasurements(argsToFlags(args));
				expect(result).toEqual([
					{
						type: 'traceroute',
						target: 'google.com',
						inProgressUpdates: false,
						limit: 2,
						locations: [{ magic: 'New York' }],
						measurementOptions: {
							protocol: 'TCP',
							port: 80,
						},
					},
				]);
			});

			it('should throw if incorrect traceroute flag', () => {
				const args
					= 'traceroute google.com from New York --limit 2 --protocol tcp --port 80 --packets 3';
				expect(() => buildPostMeasurements(argsToFlags(args))).toThrow('Invalid option "packets" for "traceroute"!\nExpected "protocol, port, target, from, limit, share".');
			});
		});

		describe('dns', () => {
			it('should parse dns args', () => {
				const args = 'dns google.com from New York';
				const result = buildPostMeasurements(argsToFlags(args));
				expect(result).toEqual([
					{
						type: 'dns',
						target: 'google.com',
						inProgressUpdates: false,
						limit: 1,
						locations: [{ magic: 'New York' }],
						measurementOptions: {},
					},
				]);
			});

			it('should parse dns args with flags', () => {
				const args
					= 'dns google.com from New York --limit 2 --query AAAA --protocol tcp --port 80 --resolver 1.1.1.1 --trace';
				const result = buildPostMeasurements(argsToFlags(args));
				expect(result).toEqual([
					{
						type: 'dns',
						target: 'google.com',
						inProgressUpdates: false,
						limit: 2,
						locations: [{ magic: 'New York' }],
						measurementOptions: {
							query: {
								type: 'AAAA',
							},
							protocol: 'TCP',
							port: 80,
							resolver: '1.1.1.1',
							trace: true,
						},
					},
				]);
			});

			it('should throw if incorrect dns flag', () => {
				const args
					= 'dns google.com from New York --limit 2 --query AAAA --protocol tcp --port 80 --test';
				expect(() => buildPostMeasurements(argsToFlags(args))).toThrow('Invalid option "test" for "dns"!\nExpected "query, protocol, port, resolver, trace, latency, target, from, limit, share".');
			});
		});

		describe('mtr', () => {
			it('should parse mtr args', () => {
				const args = 'mtr google.com from New York';
				const result = buildPostMeasurements(argsToFlags(args));
				expect(result).toEqual([
					{
						type: 'mtr',
						target: 'google.com',
						inProgressUpdates: false,
						limit: 1,
						locations: [{ magic: 'New York' }],
						measurementOptions: {},
					},
				]);
			});

			it('should parse mtr args with flags', () => {
				const args
					= 'mtr google.com from New York --limit 2 --protocol tcp --port 80 --packets 16';
				const result = buildPostMeasurements(argsToFlags(args));
				expect(result).toEqual([
					{
						type: 'mtr',
						target: 'google.com',
						inProgressUpdates: false,
						limit: 2,
						locations: [{ magic: 'New York' }],
						measurementOptions: {
							protocol: 'TCP',
							port: 80,
							packets: 16,
						},
					},
				]);
			});

			it('should throw if incorrect mtr flag', () => {
				const args
					= 'mtr google.com from New York --limit 2 --protocol tcp --port 80 --packets 16 --test';
				expect(() => buildPostMeasurements(argsToFlags(args))).toThrow('Invalid option "test" for "mtr"!\nExpected "protocol, port, packets, target, from, limit, share".');
			});
		});

		describe('http', () => {
			it('should parse http args', () => {
				const args = 'http google.com from New York';
				const result = buildPostMeasurements(argsToFlags(args));
				expect(result).toEqual([
					{
						type: 'http',
						target: 'google.com',
						inProgressUpdates: false,
						limit: 1,
						locations: [{ magic: 'New York' }],
						measurementOptions: {
							protocol: 'HTTP',
							request: {
								host: 'google.com',
								path: '/',
								headers: {},
							},
						},
					},
				]);
			});

			it('should parse http args with flags', () => {
				const args
					= 'http google.com from New York --limit 2 --path / --query ?a=abc --host google.com --method get --port 80 --protocol https --header "Content-Type: text/html; charset=utf-8" --header "Content-Encoding: gzip"';
				const result = buildPostMeasurements(argsToFlags(args));

				expect(result).toEqual([
					{
						type: 'http',
						target: 'google.com',
						inProgressUpdates: false,
						limit: 2,
						locations: [{ magic: 'New York' }],
						measurementOptions: {
							port: 80,
							protocol: 'HTTPS',
							request: {
								path: '/',
								query: '?a=abc',
								method: 'GET',
								host: 'google.com',
								headers: {
									'Content-Encoding': 'gzip',
									'Content-Type': 'text/html; charset=utf-8',
								},
							},
						},
					},
				]);
			});

			it('should infer url for http parse', () => {
				const args
					= 'http https://google.com:80/test?a=abc from New York --limit 2 --method get --header "Content-Encoding: gzip" --header "Content-Type: text/html; charset=utf-8"';
				const result = buildPostMeasurements(argsToFlags(args));

				expect(result).toEqual([
					{
						type: 'http',
						target: 'google.com',
						inProgressUpdates: false,
						limit: 2,
						locations: [{ magic: 'New York' }],
						measurementOptions: {
							port: 80,
							protocol: 'HTTPS',
							request: {
								path: '/test',
								query: 'a=abc',
								method: 'GET',
								host: 'google.com',
								headers: {
									'Content-Encoding': 'gzip',
									'Content-Type': 'text/html; charset=utf-8',
								},
							},
						},
					},
				]);
			});

			it('should throw if incorrect http flag', () => {
				const args
					= 'http google.com from New York --limit 2 --path / --query ?a=abc --host google.com --method get --port 80 --protocol https --header Content-Encoding: gzip --header Content-Type: text/html; charset=utf-8 --test';
				expect(() => buildPostMeasurements(argsToFlags(args))).toThrow('Invalid option "test" for "http"!\nExpected "protocol, port, resolver, method, path, query, host, header, latency, full, target, from, limit, share".');
			});
		});
	});
});
