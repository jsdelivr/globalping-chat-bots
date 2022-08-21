import { describe, expect, it } from 'vitest';

import { argsToFlags, parseFlags } from '../src/flags';

describe('Utils', () => {
	describe('parse arguments', () => {
		describe('ping', () => {
			it('should parse ping args', () => {
				const args = 'ping google.com from New York';
				const result = parseFlags(argsToFlags(args));
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
				const result = parseFlags(argsToFlags(args));
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
				expect(() => parseFlags(argsToFlags(args))).toThrow('Invalid argument "protocol" for "ping"!\nExpected "packets, target, from, limit".');
			});
		});

		describe('traceroute', () => {
			it('should parse traceroute args', () => {
				const args = 'traceroute google.com from New York';
				const result = parseFlags(argsToFlags(args));
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
				const result = parseFlags(argsToFlags(args));
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
				expect(() => parseFlags(argsToFlags(args))).toThrow('Invalid argument "packets" for "traceroute"!\nExpected "protocol, port, target, from, limit".');
			});
		});

		describe('dns', () => {
			it('should parse dns args', () => {
				const args = 'dns google.com from New York';
				const result = parseFlags(argsToFlags(args));
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
				const result = parseFlags(argsToFlags(args));
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
				expect(() => parseFlags(argsToFlags(args))).toThrow('Invalid argument "test" for "dns"!\nExpected "query, protocol, port, resolver, trace, target, from, limit".');
			});
		});

		describe('mtr', () => {
			it('should parse mtr args', () => {
				const args = 'mtr google.com from New York';
				const result = parseFlags(argsToFlags(args));
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
				const result = parseFlags(argsToFlags(args));
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
				expect(() => parseFlags(argsToFlags(args))).toThrow('Invalid argument "test" for "mtr"!\nExpected "protocol, port, packets, target, from, limit".');
			});
		});

		describe('http', () => {
			it('should parse http args', () => {
				const args = 'http google.com from New York';
				const result = parseFlags(argsToFlags(args));
				expect(result).toEqual({
					type: 'http',
					target: 'google.com',
					limit: 1,
					locations: [{ magic: 'new york' }],
					measurementOptions: {
						request: {}
					}
				});
			});

			it('should parse http args with flags', () => {
				const args = 'http google.com from New York --limit 2 --path / --query ?a=abc --host google.com --method get --port 80 --protocol https --header Content-Type: text/html; charset=utf-8 --header Content-Encoding: gzip';
				const result = parseFlags(argsToFlags(args));

				expect(result).toEqual({
					type: 'http',
					target: 'google.com',
					limit: 2,
					locations: [{ magic: 'new york' }],
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
								'Content-Type': 'text/html; charset=utf-8'
							}
						}
					}
				});
			});

			it('should infer url for http parse', () => {
				const args = 'http https://google.com:80/test?a=abc from New York --limit 2 --method get --header Content-Encoding: gzip --header Content-Type: text/html; charset=utf-8';
				const result = parseFlags(argsToFlags(args));

				expect(result).toEqual({
					type: 'http',
					target: 'https://google.com:80/test?a=abc',
					limit: 2,
					locations: [{ magic: 'new york' }],
					measurementOptions: {
						port: 80,
						protocol: 'HTTPS',
						request: {
							path: '/test',
							query: '?a=abc',
							method: 'GET',
							host: 'google.com',
							headers: {
								'Content-Encoding': 'gzip',
								'Content-Type': 'text/html; charset=utf-8'
							}
						}
					}
				});
			});

			it('should throw if incorrect http flag', () => {
				const args = 'http google.com from New York --limit 2 --path / --query ?a=abc --host google.com --method get --port 80 --protocol https --header Content-Encoding: gzip --header Content-Type: text/html; charset=utf-8 --test';
				expect(() => parseFlags(argsToFlags(args))).toThrow('Invalid argument "test" for "http"!\nExpected "protocol, port, method, path, query, host, header, target, from, limit".');
			});
		});
	});
});