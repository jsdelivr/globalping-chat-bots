import { describe, expect, it } from 'vitest';

import { parseArgs } from '../src/utils';

describe('Utils', () => {
	describe('parse arguments', () => {
		describe('ping', () => {
			it('should parse ping args', () => {
				const args = 'ping google.com from New York';
				const result = parseArgs(args);
				expect(result).toEqual({
					type: 'ping',
					target: 'google.com',
					limit: 1,
					locations: [{ magic: 'new york' }],
					measurementOptions: {}
				});
			});

			it('should parse ping args with flags', () => {
				const args = 'ping google.com from New York --limit 2 --packets 3';
				const result = parseArgs(args);
				expect(result).toEqual({
					type: 'ping',
					target: 'google.com',
					limit: 2,
					locations: [{ magic: 'new york' }],
					measurementOptions: {
						packets: 3
					}
				});
			});

			it('should throw if incorrect ping flag', () => {
				const args = 'ping google.com from New York --limit 2 --packets 3 --protocol icmp';
				expect(() => parseArgs(args)).toThrow('Invalid argument "protocol" for "ping"! Expected "packets,from,limit".');
			});
		});

		describe('traceroute', () => {
			it('should parse traceroute args', () => {
				const args = 'traceroute google.com from New York';
				const result = parseArgs(args);
				expect(result).toEqual({
					type: 'traceroute',
					target: 'google.com',
					limit: 1,
					locations: [{ magic: 'new york' }],
					measurementOptions: {}
				});
			});

			it('should parse traceroute args with flags', () => {
				const args = 'traceroute google.com from New York --limit 2 --protocol tcp --port 80';
				const result = parseArgs(args);
				expect(result).toEqual({
					type: 'traceroute',
					target: 'google.com',
					limit: 2,
					locations: [{ magic: 'new york' }],
					measurementOptions: {
						protocol: 'TCP',
						port: 80
					}
				});
			});

			it('should throw if incorrect traceroute flag', () => {
				const args = 'traceroute google.com from New York --limit 2 --protocol tcp --port 80 --packets 3';
				expect(() => parseArgs(args)).toThrow('Invalid argument "packets" for "traceroute"! Expected "protocol,port,from,limit".');
			});
		});

		describe('dns', () => {
			it('should parse dns args', () => {
				const args = 'dns google.com from New York';
				const result = parseArgs(args);
				expect(result).toEqual({
					type: 'dns',
					target: 'google.com',
					limit: 1,
					locations: [{ magic: 'new york' }],
					measurementOptions: {}
				});
			});

			it('should parse dns args with flags', () => {
				const args = 'dns google.com from New York --limit 2 --query AAAA --protocol tcp --port 80 --resolver 1.1.1.1 --trace';
				const result = parseArgs(args);
				expect(result).toEqual({
					type: 'dns',
					target: 'google.com',
					limit: 2,
					locations: [{ magic: 'new york' }],
					measurementOptions: {
						query: {
							type: 'AAAA'
						},
						protocol: 'TCP',
						port: 80,
						resolver: '1.1.1.1',
						trace: true
					}
				});
			});

			it('should throw if incorrect dns flag', () => {
				const args = 'dns google.com from New York --limit 2 --query AAAA --protocol tcp --port 80 --test';
				expect(() => parseArgs(args)).toThrow('Invalid argument "test" for "dns"! Expected "query,protocol,port,resolver,trace,from,limit".');
			});
		});

		describe('mtr', () => {
			it('should parse mtr args', () => {
				const args = 'mtr google.com from New York';
				const result = parseArgs(args);
				expect(result).toEqual({
					type: 'mtr',
					target: 'google.com',
					limit: 1,
					locations: [{ magic: 'new york' }],
					measurementOptions: {}
				});
			});

			it('should parse mtr args with flags', () => {
				const args = 'mtr google.com from New York --limit 2 --protocol tcp --port 80 --packets 16';
				const result = parseArgs(args);
				expect(result).toEqual({
					type: 'mtr',
					target: 'google.com',
					limit: 2,
					locations: [{ magic: 'new york' }],
					measurementOptions: {
						protocol: 'TCP',
						port: 80,
						packets: 16
					}
				});
			});

			it('should throw if incorrect mtr flag', () => {
				const args = 'mtr google.com from New York --limit 2 --protocol tcp --port 80 --packets 16 --test';
				expect(() => parseArgs(args)).toThrow('Invalid argument "test" for "mtr"! Expected "protocol,port,packets,from,limit".');
			});
		});

		describe('http', () => {
			it('should parse http args', () => {
				const args = 'http google.com from New York';
				const result = parseArgs(args);
				expect(result).toEqual({
					type: 'http',
					target: 'google.com',
					limit: 1,
					locations: [{ magic: 'new york' }],
					request: {}
				});
			});

			it('should parse http args with flags', () => {
				const args = 'http google.com from New York --limit 2 --path / --query ?a=abc --host google.com --method get --port 80 --protocol https --header Content-Encoding: gzip --header Content-Type: text/html; charset=utf-8';
				const result = parseArgs(args);

				expect(result).toEqual({
					type: 'http',
					target: 'google.com',
					limit: 2,
					locations: [{ magic: 'new york' }],
					port: 80,
					protocol: 'HTTPS',
					request: {
						path: '/',
						query: '?a=abc',
						method: 'GET',
						host: 'google.com'
					}
				});
			});

			it('should infer url for http parse', () => {
				const args = 'http https://google.com:80/test?a=abc from New York --limit 2 --method get --header Content-Encoding: gzip --header Content-Type: text/html; charset=utf-8';
				const result = parseArgs(args.split(' '));

				expect(result).toEqual({
					type: 'http',
					target: 'https://google.com:80/test?a=abc',
					limit: 2,
					locations: [{ magic: 'new york' }],
					port: 80,
					protocol: 'HTTPS',
					request: {
						path: '/test',
						query: '?a=abc',
						method: 'GET',
						host: 'google.com'
					}
				});
			});

			it('should throw if incorrect http flag', () => {
				const args = 'http google.com from New York --limit 2 --path / --query ?a=abc --host google.com --method get --port 80 --protocol https --header Content-Encoding: gzip --header Content-Type: text/html; charset=utf-8 --test';
				expect(() => parseArgs(args)).toThrow('Invalid argument "test" for "http"! Expected "protocol,port,method,path,query,host,header,from,limit".');
			});
		});
	});
});
