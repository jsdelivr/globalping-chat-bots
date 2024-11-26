import parser from 'yargs-parser';

import { parseTargetQuery } from './target-query.js';
import {
	ALLOWED_QUERY_TYPES,
	DnsProtocol,
	DnsType,
	HttpMethod,
	HttpProtocol,
	isQueryType,
	MtrProtocol,
	QueryType,
	TraceProtocol,
} from './types.js';
import { throwArgError, throwOptError } from './utils.js';

const ALLOWED_BASE_FLAGS = [ 'target', 'from', 'limit', 'share' ] as const;
const ALLOWED_PING_FLAGS = [
	'packets',
	'latency',
	...ALLOWED_BASE_FLAGS,
] as const;

type PingFlags = (typeof ALLOWED_PING_FLAGS)[number];
const isPingFlag = (flag: string): flag is PingFlags => ALLOWED_PING_FLAGS.includes(flag as PingFlags);

const ALLOWED_TRACE_FLAGS = [
	'protocol',
	'port',
	...ALLOWED_BASE_FLAGS,
] as const;

type TraceFlags = (typeof ALLOWED_TRACE_FLAGS)[number];
const isTraceFlag = (flag: string): flag is TraceFlags => ALLOWED_TRACE_FLAGS.includes(flag as TraceFlags);

const ALLOWED_DNS_FLAGS = [
	'query',
	'protocol',
	'port',
	'resolver',
	'trace',
	'latency',
	...ALLOWED_BASE_FLAGS,
] as const;

type DnsFlags = (typeof ALLOWED_DNS_FLAGS)[number];
const isDnsFlag = (flag: string): flag is DnsFlags => ALLOWED_DNS_FLAGS.includes(flag as DnsFlags);

const ALLOWED_MTR_FLAGS = [
	'protocol',
	'port',
	'packets',
	...ALLOWED_BASE_FLAGS,
] as const;

type MtrFlags = (typeof ALLOWED_MTR_FLAGS)[number];
const isMtrFlag = (flag: string): flag is MtrFlags => ALLOWED_MTR_FLAGS.includes(flag as MtrFlags);

const ALLOWED_HTTP_FLAGS = [
	'protocol',
	'port',
	'resolver',
	'method',
	'path',
	'query',
	'host',
	'header',
	'latency',
	'full',
	...ALLOWED_BASE_FLAGS,
] as const;

type HttpFlags = (typeof ALLOWED_HTTP_FLAGS)[number];
const isHttpFlag = (flag: string): flag is HttpFlags => ALLOWED_HTTP_FLAGS.includes(flag as HttpFlags);

export interface Flags {
	cmd: QueryType | string;
	target: string;
	from: string;
	limit: number;
	packets?: number;
	protocol?: TraceProtocol | DnsProtocol | MtrProtocol | HttpProtocol | string;
	port?: number;
	resolver?: string;
	trace?: boolean;
	query?: DnsType | string;
	method?: HttpMethod | string;
	path?: string;
	host?: string;
	headers?: { [header: string]: string };
	help?: QueryType | string | boolean;
	latency?: boolean;
	full?: boolean;
	share?: boolean;
}

export const enum AuthSubcommand {
	Login = 'login',
	Logout = 'logout',
	Status = 'status',
}

const checkFlags = (cmd: string, args: Record<string, string>): void => {
	const skipFlags = new Set([ '--', '_', 'help' ]);
	const flags = Object.keys(args).filter(item => !skipFlags.has(item));

	if (!isQueryType(cmd)) {
		throwArgError(cmd, 'command', [ ...ALLOWED_QUERY_TYPES ].join(', '));
	}

	if (cmd === 'ping') {
		for (const flag of flags) {
			if (!isPingFlag(flag)) {
				throwOptError(flag, 'ping', [ ...ALLOWED_PING_FLAGS ].join(', '));
			}
		}
	}

	if (cmd === 'traceroute') {
		for (const flag of flags) {
			if (!isTraceFlag(flag)) {
				throwOptError(flag, 'traceroute', [ ...ALLOWED_TRACE_FLAGS ].join(', '));
			}
		}
	}

	if (cmd === 'dns') {
		for (const flag of flags) {
			if (!isDnsFlag(flag)) {
				throwOptError(flag, 'dns', [ ...ALLOWED_DNS_FLAGS ].join(', '));
			}
		}
	}

	if (cmd === 'mtr') {
		for (const flag of flags) {
			if (!isMtrFlag(flag)) {
				throwOptError(flag, 'mtr', [ ...ALLOWED_MTR_FLAGS ].join(', '));
			}
		}
	}

	if (cmd === 'http') {
		for (const flag of flags) {
			if (!isHttpFlag(flag)) {
				throwOptError(flag, 'http', [ ...ALLOWED_HTTP_FLAGS ].join(', '));
			}
		}
	}
};

interface UrlData {
	target: string;
	host: string;
	path: string;
	port?: number;
	protocol?: string;
	query?: string;
}

interface HttpHeaders {
	[header: string]: string;
}

export const argsToFlags = (argv: string | string[]): Flags => {
	let args = argv;

	if (typeof args === 'string') {
		args = args.split(' ');
	}

	if (args[0] === 'help' || args[1] === 'help') {
		// Ensure help flag is added for parser to catch
		args.push('--help');
	}

	const flagAlias = {
		help: [ 'h' ],
		from: [ 'F' ],
		limit: [ 'L' ],
		header: [ 'H' ],
		// --type aliased to query because initial version of the chatbot was written expecting --query flag for dns type
		query: [ 'type' ],
	};

	const parsedKeys = [
		'from',
		'limit',
		'packets',
		'port',
		'protocol',
		'type',
		'resolver',
		'path',
		'query',
		'host',
		'method',
		'header',
		'help',
		'latency',
		'full',
		'share',
	];

	const parsed = parser(args, {
		array: parsedKeys,
		alias: flagAlias,
		configuration: {
			'strip-aliased': true,
		},
	});

	for (const key of parsedKeys) {
		if (parsed[key] !== undefined) {
			// remove empty entries that result from spaces in the command
			parsed[key] = parsed[key].filter((item: string | number) => item !== '');

			for (let i = 0; i < parsed[key].length; i += 1) {
				if (typeof parsed[key][i] === 'string') {
					// replace quoting chars used in command
					parsed[key][i] = parsed[key][i]
						.replaceAll('‘', '')
						.replaceAll('’', '')
						.replaceAll('“', '')
						.replaceAll('”', '')
						.replaceAll('"', '')
						.replaceAll('\'', '');
				}
			}
		}
	}

	// Add to parsed for checkFlags later
	const cmd = parsed._[0] ? String(parsed._[0]).toLowerCase() : undefined;

	const argsForTargetQueryParser = parsed._.slice(1)
		.map(arg => arg.toString())
		.filter(arg => arg !== '');

	if (cmd === 'auth' || argsForTargetQueryParser[0] === 'auth') {
		const target
			= argsForTargetQueryParser[0] === 'auth'
				? argsForTargetQueryParser[1] || ''
				: argsForTargetQueryParser[0] || '';
		return {
			cmd: 'auth',
			help: !!parsed.help,
			target,
			from: '',
			limit: 1,
		};
	}

	if (cmd === 'limits' || argsForTargetQueryParser[0] === 'limits') {
		const target
			= argsForTargetQueryParser[0] === 'limits'
				? argsForTargetQueryParser[1] || ''
				: argsForTargetQueryParser[0] || '';
		return {
			cmd: 'limits',
			help: !!parsed.help,
			target,
			from: '',
			limit: 1,
		};
	}

	const targetQuery = parseTargetQuery(cmd, argsForTargetQueryParser);
	let { target, from, resolver } = targetQuery;

	let host = parsed.host ? String(parsed.host) : undefined;
	let path = parsed.path ? String(parsed.path) : undefined;
	let port = parsed.port ? Number(parsed.port[0]) : undefined;
	let protocol = parsed.protocol
		? String(parsed.protocol).toUpperCase()
		: undefined;
	let query = parsed.query ? String(parsed.query) : undefined;

	let httpMethod = parsed.method
		? String(parsed.method).toUpperCase()
		: undefined;

	if (parsed.full) {
		httpMethod = 'GET';
	}

	// Throw on any invalid flags
	if (cmd && parsed.help === undefined) {
		checkFlags(cmd, parsed);
	}

	let urlData: UrlData | undefined;
	let httpHeaders: HttpHeaders | undefined;

	if (target) {
		urlData = parseUrlData(target);
		target = urlData.target;
	}

	if (cmd === 'http' && target) {
		if (!host) {
			host = urlData?.host;
		}

		if (!path) {
			path = urlData?.path;
		}

		if (!port) {
			port = urlData?.port;
		}

		if (!protocol) {
			protocol = urlData?.protocol;
		}

		if (!query) {
			query = urlData?.query;
		}

		httpHeaders = parseHttpHeaders(parsed.header);
	}

	// from based on target query takes precedence
	if (!from) {
		from = parsed.from
			? String(parsed.from.join(' ')).trim().toLowerCase()
			: 'world';
	}

	// resolver based on flags takes precedence
	if (parsed.resolver) {
		resolver = String(parsed.resolver);
	}

	const flags: Flags = {
		cmd,
		target,
		from,
		limit: parsed.limit ? Number(parsed.limit[0]) : 1,
		...parsed.packets && { packets: Number(parsed.packets[0]) },
		protocol,
		port,
		resolver,
		...parsed.trace && { trace: true },
		query,
		method: httpMethod,
		path,
		host,
		headers: httpHeaders,
		...parsed.help && { help: true },
		...parsed.latency && { latency: true },
		...parsed.full && { full: true },
		...parsed.share && { share: true },
	};

	return flags;
};

function parseUrlData (input: string): UrlData {
	const urlData = {} as UrlData;

	let u = input;

	if (u.startsWith('<') && u.endsWith('>')) {
		const linkEnd = u.indexOf('|');

		if (linkEnd !== -1) {
			u = u.slice(1, linkEnd);
		} else {
			u = u.slice(1, -1);
		}
	}

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

		urlData.protocol = url.protocol
			? url.protocol.replace(':', '').toUpperCase()
			: undefined;

		urlData.query = url.search ? url.search.slice(1) : undefined;
	} catch {
		// parsing failed
		throw new Error('Invalid http target');
	}

	return urlData;
}

function parseHttpHeaders (rawHeaders: string[]): HttpHeaders {
	const headers = {} as HttpHeaders;

	if (!rawHeaders) {
		return headers;
	}

	let currentKey = '';
	let currentValue = '';

	for (const item of rawHeaders) {
		// yargs parsers splits all --header inputs on whitespace and provides them as a single array
		// replace quoting chars used in command
		const str = item
			.replaceAll('‘', '')
			.replaceAll('’', '')
			.replaceAll('“', '')
			.replaceAll('”', '')
			.replaceAll('"', '')
			.replaceAll('\'', '');

		if (str.endsWith(':')) {
			if (currentKey !== '') {
				headers[currentKey] = currentValue.trim();
			}

			currentKey = str.slice(0, -1);
			currentValue = '';
		} else {
			currentValue += `${str} `;
		}
	}

	if (currentValue !== '') {
		headers[currentKey] = currentValue.trim();
		currentValue = '';
	}

	return headers;
}
