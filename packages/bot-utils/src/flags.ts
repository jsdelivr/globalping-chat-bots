import parser from 'yargs-parser';

import { ALLOWED_DNS_PROTOCOLS, ALLOWED_DNS_TYPES, ALLOWED_HTTP_METHODS, ALLOWED_HTTP_PROTOCOLS, ALLOWED_MTR_PROTOCOLS, ALLOWED_QUERY_TYPES, ALLOWED_TRACE_PROTOCOLS, DnsProtocol, DnsType, HttpMethod, HttpProtocol, isDnsProtocol, isDnsType, isHttpMethod, isHttpProtocol, isMtrProtocol, isQueryType, isTraceProtocol, MtrProtocol, PostMeasurement, QueryType, TraceProtocol } from './types';
import { throwArgError, throwOptError } from './utils';

const ALLOWED_BASE_FLAGS = ['target', 'from', 'limit'] as const;
const ALLOWED_PING_FLAGS = ['packets', 'latency', ...ALLOWED_BASE_FLAGS] as const;
type PingFlags = typeof ALLOWED_PING_FLAGS[number];
const isPingFlag = (flag: string): flag is PingFlags => ALLOWED_PING_FLAGS.includes(flag as PingFlags);

const ALLOWED_TRACE_FLAGS = ['protocol', 'port', ...ALLOWED_BASE_FLAGS] as const;
type TraceFlags = typeof ALLOWED_TRACE_FLAGS[number];
const isTraceFlag = (flag: string): flag is TraceFlags => ALLOWED_TRACE_FLAGS.includes(flag as TraceFlags);

const ALLOWED_DNS_FLAGS = ['query', 'protocol', 'port', 'resolver', 'trace', 'latency', ...ALLOWED_BASE_FLAGS] as const;
type DnsFlags = typeof ALLOWED_DNS_FLAGS[number];
const isDnsFlag = (flag: string): flag is DnsFlags => ALLOWED_DNS_FLAGS.includes(flag as DnsFlags);

const ALLOWED_MTR_FLAGS = ['protocol', 'port', 'packets', ...ALLOWED_BASE_FLAGS] as const;
type MtrFlags = typeof ALLOWED_MTR_FLAGS[number];
const isMtrFlag = (flag: string): flag is MtrFlags => ALLOWED_MTR_FLAGS.includes(flag as MtrFlags);

const ALLOWED_HTTP_FLAGS = ['protocol', 'port', 'method', 'path', 'query', 'host', 'header', 'latency', ...ALLOWED_BASE_FLAGS] as const;
type HttpFlags = typeof ALLOWED_HTTP_FLAGS[number];
const isHttpFlag = (flag: string): flag is HttpFlags => ALLOWED_HTTP_FLAGS.includes(flag as HttpFlags);

export interface Flags {
	cmd: QueryType | string
	target: string
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
	help?: QueryType | string | boolean
	latency?: boolean
}

const checkFlags = (args: Record<string, string>): void => {
	const skipFlags = new Set(['cmd', '--', '_', 'help']);
	const flags = Object.keys(args).filter(item => !skipFlags.has(item));
	const cmd = isQueryType(args.cmd) ? args.cmd : throwArgError(args.cmd, 'command', [...ALLOWED_QUERY_TYPES].join(', '));

	if (cmd === 'ping') {
		for (const flag of flags) {
			if (!isPingFlag(flag))
				throwOptError(flag, 'ping', [...ALLOWED_PING_FLAGS].join(', '));
		}
	}

	if (cmd === 'traceroute') {
		for (const flag of flags) {
			if (!isTraceFlag(flag))
				throwOptError(flag, 'traceroute', [...ALLOWED_TRACE_FLAGS].join(', '));
		}
	}

	if (cmd === 'dns') {
		for (const flag of flags) {
			if (!isDnsFlag(flag))
				throwOptError(flag, 'dns', [...ALLOWED_DNS_FLAGS].join(', '));
		}
	}

	if (cmd === 'mtr') {
		for (const flag of flags) {
			if (!isMtrFlag(flag))
				throwOptError(flag, 'mtr', [...ALLOWED_MTR_FLAGS].join(', '));
		}
	}

	if (args.cmd === 'http') {
		for (const flag of flags) {
			if (!isHttpFlag(flag))
				throwOptError(flag, 'http', [...ALLOWED_HTTP_FLAGS].join(', '));
		}
	}
};

export const argsToFlags = (argv: string | string[]): Flags => {
	let args = argv;
	if (typeof args === 'string')
		args = args.split(' ');

	if ((args.indexOf('from') === 2 || args.indexOf('--from') === 2) && (args[3] && !args[3].startsWith('--'))) {
		args[2] = '--from';
	} else if (args[0] === 'help' || args[1] === 'help' || args.includes('--help')) {
		// Ensure help flag is added for parser to catch
		args.push('--help');
	} else if (args[1] && (args[2] === undefined || args[2].startsWith('--'))) {
		// If no from flag is passed, default to world e.g. globalping ping jsdelivr.com
		args.push('--from', 'world');
	}
	else {
		throw new Error('Invalid command format! Run "/globalping help" for more information.');
	}


	const parsed = parser(args, {
		array: ['from', 'limit', 'packets', 'port', 'protocol', 'type', 'resolver', 'path', 'query', 'host', 'method', 'header', 'help', 'latency'],
		configuration: {
			'greedy-arrays': true,
		}
	});

	// Add to parsed for checkFlags later
	parsed.cmd = String(parsed._[0]).toLowerCase();

	// Try to infer parameters from URL
	if (parsed.cmd === 'http') {
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
	// Throw on any invalid flags
	if (parsed.help === undefined) checkFlags(parsed);

	type Headers = { [header: string]: string };
	let headers: Headers | undefined;
	if (parsed.header) {
		headers = {};

		let key;
		for (const item of parsed.header) {
			// Typical input would be Content-Type: text/html; charset=utf-8
			// Arr representation is ['Content-Type', 'text/html;', 'charset=utf-8']
			if (item.endsWith(':'))
				key = item.slice(0, -1);
			else
				headers[key] = headers[key] ? `${headers[key]} ${item}` : item;
		}
	}

	const flags: Flags = {
		cmd: parsed.cmd,
		target: String(parsed._[1]),
		from: String(parsed.from?.join(' ')).toLowerCase(),
		limit: parsed.limit ? Number(parsed.limit) : 1,
		...parsed.packets && { packets: Number(parsed.packets[0]) },
		...parsed.protocol && { protocol: String(parsed.protocol[0]).toUpperCase() },
		...parsed.port && { port: Number(parsed.port[0]) },
		...parsed.resolver && { resolver: String(parsed.resolver[0]) },
		...parsed.trace && { trace: true },
		...parsed.query && { query: String(parsed.query[0]) }, // Case choice has to be done at cmd level
		...parsed.method && { method: String(parsed.method[0]).toUpperCase() },
		...parsed.path && { path: String(parsed.path[0]) },
		...parsed.host && { host: String(parsed.host[0]) },
		...headers && { headers },
		...parsed.help && { help: true },
		...parsed.latency && { latency: true },
	};

	return flags;
};

export const parseFlags = (args: Flags): PostMeasurement[] => {
	const { cmd, target, from, limit, packets, protocol, port, query, resolver, trace, path, method, host, headers } = args;
	const multiFrom = from.split(',').map((f) => f.trim());
	if (multiFrom.length > 10) throw new Error('You can only query up to 10 different locations at once!');

	const postArray: PostMeasurement[] = [];
	for (const location of multiFrom) {
		if (location === '')
			throw new Error('Empty location! Run "/globalping help" for more information.');

		const locations = [{ magic: location }];

		switch (cmd) {
			case 'ping': {
				postArray.push({
					type: 'ping',
					target,
					inProgressUpdates: false,
					limit,
					locations,
					measurementOptions: {
						...packets && { packets },
					}
				});

				break;
			}
			case 'traceroute': {
				postArray.push({
					type: 'traceroute',
					target,
					inProgressUpdates: false,
					limit,
					locations,
					measurementOptions: {
						...protocol && { protocol: isTraceProtocol(protocol) ? protocol : throwArgError(protocol, 'protocol', [...ALLOWED_TRACE_PROTOCOLS].join(', ')) },
						...port && { port },
					}
				});

				break;
			}
			case 'dns': {
				postArray.push({
					type: 'dns',
					target,
					inProgressUpdates: false,
					limit,
					locations,
					measurementOptions: {
						...query && { query: { type: isDnsType(query) ? query : throwArgError(query, 'query', [...ALLOWED_DNS_TYPES].join(', ')) } },
						...protocol && { protocol: isDnsProtocol(protocol) ? protocol : throwArgError(protocol, 'protocol', [...ALLOWED_DNS_PROTOCOLS].join(', ')) },
						...port && { port },
						...resolver && { resolver },
						...trace && { trace },
					}
				});

				break;
			}
			case 'mtr': {
				postArray.push({
					type: 'mtr',
					target,
					inProgressUpdates: false,
					limit,
					locations,
					measurementOptions: {
						...protocol && { protocol: isMtrProtocol(protocol) ? protocol : throwArgError(protocol, 'protocol', [...ALLOWED_MTR_PROTOCOLS].join(', ')) },
						...port && { port },
						...packets && { packets },
					}
				});

				break;
			}
			case 'http': {
				postArray.push({
					type: 'http',
					target,
					inProgressUpdates: false,
					limit,
					locations,
					measurementOptions: {
						...port && { port },
						...protocol && { protocol: isHttpProtocol(protocol) ? protocol : throwArgError(protocol, 'protocol', [...ALLOWED_HTTP_PROTOCOLS].join(', ')) },
						request: {
							...path && { path },
							...query && { query },
							...method && { method: isHttpMethod(method) ? method : throwArgError(method, 'method', [...ALLOWED_HTTP_METHODS].join(', ')) },
							...host && { host },
							...headers && { headers },
						}
					}
				});

				break;
			}
			default: {
				throwArgError(String(cmd), 'command', [...ALLOWED_QUERY_TYPES].join(', '));
				throw new Error('Unknown error.');
			}
		}
	}
	return postArray;
};
