import type { Arguments } from 'yargs-parser';
import parser from 'yargs-parser';

import { ALLOWED_DNS_PROTOCOLS, ALLOWED_DNS_TYPES, ALLOWED_HTTP_METHODS, ALLOWED_HTTP_PROTOCOLS, ALLOWED_MTR_PROTOCOLS, ALLOWED_QUERY_TYPES, ALLOWED_TRACE_PROTOCOLS, DnsProtocol, DnsType, HttpMethod, HttpProtocol, isDnsProtocol, isDnsType, isHttpMethod, isHttpProtocol, isMtrProtocol, isQueryType, isTraceProtocol, MtrProtocol, PostMeasurement, QueryType, TraceProtocol } from './types';

const ALLOWED_BASE_FLAGS = ['_', '--', 'from', 'limit'] as const;
const ALLOWED_PING_FLAGS = ['packets', ...ALLOWED_BASE_FLAGS] as const;
type PingFlags = typeof ALLOWED_PING_FLAGS[number];
const isPingFlag = (flag: string): flag is PingFlags => ALLOWED_PING_FLAGS.includes(flag as PingFlags);

const ALLOWED_TRACE_FLAGS = ['protocol', 'port', ...ALLOWED_BASE_FLAGS] as const;
type TraceFlags = typeof ALLOWED_TRACE_FLAGS[number];
const isTraceFlag = (flag: string): flag is TraceFlags => ALLOWED_TRACE_FLAGS.includes(flag as TraceFlags);

const ALLOWED_DNS_FLAGS = ['query', 'protocol', 'port', 'resolver', 'trace', ...ALLOWED_BASE_FLAGS] as const;
type DnsFlags = typeof ALLOWED_DNS_FLAGS[number];
const isDnsFlag = (flag: string): flag is DnsFlags => ALLOWED_DNS_FLAGS.includes(flag as DnsFlags);

const ALLOWED_MTR_FLAGS = ['protocol', 'port', 'packets', ...ALLOWED_BASE_FLAGS] as const;
type MtrFlags = typeof ALLOWED_MTR_FLAGS[number];
const isMtrFlag = (flag: string): flag is MtrFlags => ALLOWED_MTR_FLAGS.includes(flag as MtrFlags);

const ALLOWED_HTTP_FLAGS = ['protocol', 'port', 'method', 'path', 'query', 'host', 'header', ...ALLOWED_BASE_FLAGS] as const;
type HttpFlags = typeof ALLOWED_HTTP_FLAGS[number];
const isHttpFlag = (flag: string): flag is HttpFlags => ALLOWED_HTTP_FLAGS.includes(flag as HttpFlags);

interface Flags {
	from: string
	limit: number
	packets?: number
	protocol?: TraceProtocol | DnsProtocol | MtrProtocol | HttpProtocol | string
	port?: number
	resolver?: string
	trace?: boolean
	query?: DnsType | string
	method?: HttpMethod | string
	path?: string
	host?: string
	headers?: { [header: string]: string }
}

const throwArgError = (invalid: string | undefined, type: string, expected: string | string[]) => {
	if (invalid === undefined)
		return invalid;

	throw new TypeError(`Invalid argument "${invalid}" for "${type}"! Expected "${expected}".`);
};

const checkFlags = (args: Arguments, cmd: string): Flags => {
	if (!isQueryType(cmd))
		throwArgError(cmd, 'command', [...ALLOWED_QUERY_TYPES]);

	const flags = Object.keys(args);

	if (cmd === 'ping') {
		for (const flag of flags) {
			if (!isPingFlag(flag))
				throwArgError(flag, 'ping', [...ALLOWED_PING_FLAGS]);
		}
	}

	if (cmd === 'trace') {
		for (const flag of flags) {
			if (!isTraceFlag(flag))
				throwArgError(flag, 'trace', [...ALLOWED_TRACE_FLAGS]);
		}
	}

	if (cmd === 'dns') {
		for (const flag of flags) {
			if (!isDnsFlag(flag))
				throwArgError(flag, 'dns', [...ALLOWED_DNS_FLAGS]);
		}
	}

	if (cmd === 'mtr') {
		for (const flag of flags) {
			if (!isMtrFlag(flag))
				throwArgError(flag, 'mtr', [...ALLOWED_MTR_FLAGS]);
		}
	}

	if (cmd === 'http') {
		for (const flag of flags) {
			if (!isHttpFlag(flag))
				throwArgError(flag, 'http', [...ALLOWED_HTTP_FLAGS]);
		}
	}
	return {
		from: String(args.from.join(' ')).toLowerCase(),
		limit: args.limit ? Number(args.limit) : 1,
		packets: args.packets ? Number(args.packets[0]) : undefined,
		protocol: args.protocol ? String(args.protocol[0]).toUpperCase() : undefined,
		port: args.port ? Number(args.port[0]) : undefined,
		resolver: args.resolver ? String(args.resolver[0]) : undefined,
		trace: args.trace ? true : undefined,
		query: args.query ? String(args.query[0]) : undefined, // Case choice has to be done at cmd level
		method: args.method ? String(args.method[0]).toUpperCase() : undefined,
		path: args.path ? String(args.path[0]) : undefined,
		host: args.host ? String(args.host[0]) : undefined,
		// Converts headers such as Content-Type: Test to { 'Content-Type': 'Test' }
		// TODO Finish header parsing
		/* headers: args.header ? Object.fromEntries(args.header.map((header: string) => {
			const kv = header.split(':');
			return [kv[0], kv[1]];
		})) : undefined, */
	};
};

interface ArgError {
	error: string
}

const validateArgs = (args: Arguments): PostMeasurement | ArgError => {
	const cmd = String(args._[0]).toLowerCase();
	const target = String(args._[1]);
	const flags = checkFlags(args, cmd);
	const locations = [{ magic: flags.from }];

	try {
		if (cmd === 'ping')
			return {
				type: 'ping',
				target,
				limit: flags.limit,
				locations,
				measurementOptions: {
					...flags.packets && { packets: flags.packets },
				}
			};

		if (cmd === 'traceroute')
			return {
				type: 'traceroute',
				target,
				limit: flags.limit,
				locations,
				measurementOptions: {
					...flags.protocol && { protocol: isTraceProtocol(flags.protocol) ? flags.protocol : throwArgError(args.protocol, 'protocol', [...ALLOWED_TRACE_PROTOCOLS]) },
					...flags.port && { port: flags.port },
				}
			};

		if (cmd === 'dns')
			return {
				type: 'dns',
				target,
				limit: flags.limit,
				locations,
				measurementOptions: {
					...flags.query && { query: { type: isDnsType(flags.query) ? flags.query : throwArgError(args.query, 'query', [...ALLOWED_DNS_TYPES]) } },
					...flags.protocol && { protocol: isDnsProtocol(flags.protocol) ? flags.protocol : throwArgError(args.protocol, 'protocol', [...ALLOWED_DNS_PROTOCOLS]) },
					...flags.port && { port: flags.port },
					...flags.resolver && { resolver: flags.resolver },
					...flags.trace && { trace: flags.trace },
				}
			};

		if (cmd === 'mtr') {
			return {
				type: 'mtr',
				target,
				limit: flags.limit,
				locations,
				measurementOptions: {
					...flags.protocol && { protocol: isMtrProtocol(flags.protocol) ? flags.protocol : throwArgError(args.protocol, 'protocol', [...ALLOWED_MTR_PROTOCOLS]) },
					...flags.port && { port: flags.port },
					...flags.packets && { packets: flags.packets },
				}
			};
		}

		if (cmd === 'http')
			return {
				type: 'http',
				target,
				limit: flags.limit,
				locations,
				...flags.port && { port: flags.port },
				...flags.protocol && { protocol: isHttpProtocol(flags.protocol) ? flags.protocol : throwArgError(args.protocol, 'protocol', [...ALLOWED_HTTP_PROTOCOLS]) },
				request: {
					...flags.path && { path: flags.path },
					...flags.query && { query: flags.query },
					...flags.method && { method: isHttpMethod(flags.method) ? flags.method : throwArgError(args.method, 'method', [...ALLOWED_HTTP_METHODS]) },
					...flags.host && { host: flags.host },
					...flags.headers && { headers: flags.headers },
				}
			};

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

