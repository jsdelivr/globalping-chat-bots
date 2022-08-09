import type { Arguments } from 'yargs-parser';
import parser from 'yargs-parser';

import { ALLOWED_DNS_PROTOCOLS, ALLOWED_DNS_TYPES, ALLOWED_HTTP_METHODS, ALLOWED_HTTP_PROTOCOLS, ALLOWED_MTR_PROTOCOLS, ALLOWED_QUERY_TYPES, ALLOWED_TRACE_PROTOCOLS, isDnsProtocol, isDnsType, isHttpMethod, isHttpProtocol, isMtrProtocol, isTraceProtocol, PostMeasurement } from './types';

const ALLOWED_BASE_FLAGS = ['from', 'limit'] as const;
const ALLOWED_PING_FLAGS = ['packets', ...ALLOWED_BASE_FLAGS] as const;
type PingFlags = typeof ALLOWED_PING_FLAGS[number];

const ALLOWED_TRACE_FLAGS = ['protocol', 'port', 'packets', 'from', 'resolver', 'trace', ...ALLOWED_BASE_FLAGS] as const;
type TraceFlags = typeof ALLOWED_TRACE_FLAGS[number];

const ALLOWED_DNS_FLAGS = ['query', 'protocol', 'port', 'resolver', 'trace', ...ALLOWED_BASE_FLAGS] as const;
type DnsFlags = typeof ALLOWED_DNS_FLAGS[number];

const ALLOWED_MTR_FLAGS = ['protocol', 'port', 'packets', 'from', 'resolver', 'trace', ...ALLOWED_BASE_FLAGS] as const;
type MtrFlags = typeof ALLOWED_MTR_FLAGS[number];

const ALLOWED_HTTP_FLAGS = ['protocol', 'method', 'path', 'query', 'host', ...ALLOWED_BASE_FLAGS] as const;
type HttpFlags = typeof ALLOWED_HTTP_FLAGS[number];

const stripFlags = (args: Arguments, allowedFlags: PingFlags | TraceFlags | DnsFlags | MtrFlags | HttpFlags): string[] => {
	const flags = Object.keys(args);
	return flags.filter(flag => !allowedFlags.includes(flag));
};

const throwArgError = (invalid: string | undefined, type: string, expected: string | string[]) => {
	if (invalid === undefined)
		return invalid;

	throw new TypeError(`Invalid argument ${invalid} for ${type}! Expected ${expected}.`);
};

interface ArgError {
	error: string
}

const validateArgs = (args: Arguments): PostMeasurement | ArgError => {
	const cmd = String(args._[0]).toLowerCase();
	const target = String(args._[1]);
	const limit = Number(args.limit) ?? 1;
	const locations = [{ magic: String(args.from.join(' ')).toLowerCase() }];

	// General flags that don't need to be validated
	const packets = Number(args.packets);
	const port = Number(args.port);
	const resolver = String(args.resolver);
	const trace = Boolean(args.trace);

	// Flags that need to be validated, but normalised
	const protocol = String(args.protocol).toUpperCase();
	const query = String(args.query).toUpperCase();
	const method = String(args.method).toUpperCase();

	try {
		if (cmd === 'ping') {
			/* const invalidFlags = stripFlags(args, ALLOWED_PING_FLAGS);
			if (invalidFlags.length > 0)
				throwArgError(stripFlags(args, invalidFlags)[0], 'ping', 'none'); */


			return {
				type: 'ping',
				target,
				limit,
				locations,
				measurementOptions: {
					...packets && { packets },
				}
			};
		}

		if (cmd === 'traceroute') {
			const protocolTrace = isTraceProtocol(protocol) ? protocol : throwArgError(args.protocol, 'protocol', [...ALLOWED_TRACE_PROTOCOLS]);
			return {
				type: 'traceroute',
				target,
				limit,
				locations,
				measurementOptions: {
					...protocolTrace && { protocol: protocolTrace },
					...port && { port },
				}
			};
		}

		if (cmd === 'dns') {
			const dnsType = isDnsType(query) ? query : throwArgError(args.query, 'query', [...ALLOWED_DNS_TYPES]);
			const protocolDns = isDnsProtocol(protocol) ? protocol : throwArgError(args.protocol, 'protocol', [...ALLOWED_DNS_PROTOCOLS]);
			return {
				type: 'dns',
				target,
				limit,
				locations,
				measurementOptions: {
					...dnsType && { query: { type: dnsType } },
					...protocolDns && { protocol: protocolDns },
					...port && { port },
					...resolver && { resolver },
					...trace && { trace },
				}
			};
		}

		if (cmd === 'mtr') {
			const protocolMtr = isMtrProtocol(protocol) ? protocol : throwArgError(args.protocol, 'protocol', [...ALLOWED_MTR_PROTOCOLS]);
			return {
				type: 'mtr',
				target,
				limit,
				locations,
				measurementOptions: {
					...protocolMtr && { protocol: protocolMtr },
					...port && { port },
					...packets && { packets },
				}
			};
		}

		if (cmd === 'http') {
			const protocolHttp = isHttpProtocol(protocol) ? protocol : throwArgError(args.protocol, 'protocol', [...ALLOWED_HTTP_PROTOCOLS]);
			const methodHttp = isHttpMethod(method) ? method : throwArgError(args.method, 'method', [...ALLOWED_HTTP_METHODS]);
			return {
				type: 'http',
				target,
				limit,
				locations,
				...port && { port },
				...protocolHttp && { protocol: protocolHttp },
				request: {
					...args.path && { path: String(args.path) },
					...args.query && { query: String(args.query) },
					...methodHttp && { method: methodHttp },
					...args.host && { host: String(args.host) },
				}
			};
		}

		throwArgError(String(cmd), 'command', [...ALLOWED_QUERY_TYPES]);
	} catch (error) {
		return {
			error: String(error),
		};
	}
	return { error: 'Unknown error.' };
};

export const parseArgs = (argv: string | string[]): PostMeasurement | ArgError => {
	let args = argv;
	if (typeof args === 'string')
		args = args.split(' ');

	if (args.indexOf('from') === 2)
		args[2] = '--from';

	const parsed = parser(args, {
		array: ['from', 'limit', 'packets', 'port', 'protocol', 'type', 'resolver', 'path', 'query', 'host', 'method', 'header'],
		configuration: {
			'greedy-arrays': true,
		}
	});

	if (parsed._[0] === 'http') {
		try {
			const url = new URL(parsed._[1] as string);

			// If a flag  isn't passed to override, infer from URL obj instead
			if (!parsed.host && url.hostname) parsed.host = [url.hostname];
			if (!parsed.path && url.pathname) parsed.path = [url.pathname];
			if (!parsed.port && url.port) parsed.port = [Number(url.port)];
			if (!parsed.protocol && url.protocol) parsed.protocol = [url.protocol.replace(':', '')];
			if (!parsed.query && url.search) parsed.query = [url.search];
		} catch {
			// Do nothing
		}
	}

	return validateArgs(parsed);
};

