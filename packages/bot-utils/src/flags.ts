import parser from 'yargs-parser';

import { ALLOWED_QUERY_TYPES, DnsProtocol, DnsType, HttpMethod, HttpProtocol, isQueryType, MtrProtocol, QueryType, TraceProtocol } from './types';
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

const checkFlags = (cmd: string, args: Record<string, string>): void => {
	const skipFlags = new Set(['--', '_', 'help']);
	const flags = Object.keys(args).filter(item => !skipFlags.has(item));

	if (!isQueryType(cmd)) {
		throwArgError(cmd, 'command', [...ALLOWED_QUERY_TYPES].join(', '));
	}

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

	if (cmd === 'http') {
		for (const flag of flags) {
			if (!isHttpFlag(flag))
				throwOptError(flag, 'http', [...ALLOWED_HTTP_FLAGS].join(', '));
		}
	}
};

interface UrlData {
	target: string
	host: string
	path: string
	port?: number
	protocol?: string
	query?: string
}

export const argsToFlags = (argv: string | string[]): Flags => {
	let args = argv;
	if (typeof args === 'string')
		args = args.split(' ');

	if ((args.indexOf('from') === 2 || args.indexOf('--from') === 2) && (args[3] && !args[3].startsWith('--'))) {
		args[2] = '--from';
	} else if (args[0] === 'help' || args[1] === 'help') {
		// Ensure help flag is added for parser to catch
		args.push('--help');
	}

	const flagAlias = {
		'help': ['h'],
		'from': ['F'],
		'limit': ['L'],
		'header': ['H'],
	};

	const parsed = parser(args, {
		array: ['from', 'limit', 'packets', 'port', 'protocol', 'type', 'resolver', 'path', 'query', 'host', 'method', 'header', 'help', 'latency'],
		alias: flagAlias,
		configuration: {
			'strip-aliased': true,
		}
	});

	// Add to parsed for checkFlags later
	const cmd = parsed._[0] ? String(parsed._[0]).toLowerCase() : undefined;
	let target = parsed._[1] ? String(parsed._[1]) : undefined;

	let host = parsed.host ? String(parsed.host) : undefined;
	let path = parsed.path ? String(parsed.path) : undefined;
	let port = parsed.port ? Number(parsed.port) : undefined;
	let protocol = parsed.protocol ? String(parsed.protocol).toUpperCase() : undefined;
	let httpQuery = parsed.query ? String(parsed.query) : undefined;
	const httpMethod = parsed.method ? String(parsed.method).toUpperCase() : undefined;

	// Throw on any invalid flags
	if (cmd && parsed.help === undefined) checkFlags(cmd, parsed);

	let urlData: UrlData | undefined;

	if (cmd === 'http' && target) {
		urlData = parseUrlData(target);

		target = urlData.target;

		if (!host) {
			host = urlData.host;
		}
		if (!path) {
			path = urlData.path;
		}
		if (!port) {
			port = urlData.port;
		}
		if (!protocol) {
			protocol = urlData.protocol;
		}
		if (!httpQuery) {
			httpQuery = urlData.query;
		}
	}

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

	const from = parsed.from ? String(parsed.from.join(' ')).toLowerCase() : 'world';

	const flags: Flags = {
		cmd,
		target,
		from,
		limit: parsed.limit ? Number(parsed.limit) : 1,
		...parsed.packets && { packets: Number(parsed.packets) },
		protocol,
		port,
		...parsed.resolver && { resolver: String(parsed.resolver) },
		...parsed.trace && { trace: true },
		query: httpQuery,
		method: httpMethod,
		path,
		host,
		...headers && { headers },
		...parsed.help && { help: true },
		...parsed.latency && { latency: true },
	};

	return flags;
};

function parseUrlData(input: string): UrlData {
	const urlData = {} as UrlData;

	let u = input;

	// add url scheme if missing
	if (!u.startsWith('http://') && !u.startsWith('https://')) {
		u = `http://${u}`;
	}

	try {
		const url = new URL(u);

		urlData.target = url.hostname;
		urlData.host = url.hostname;
		urlData.path = url.pathname;
		urlData.port = url.port ? Number(url.port) : undefined;
		urlData.protocol = url.protocol ? url.protocol.replace(':', '').toUpperCase() : undefined;
		urlData.query = url.search ? url.search.slice(1) : undefined;
	} catch {
		// parsing failed
		throw new Error('Invalid http target');
	}
	return urlData;
}