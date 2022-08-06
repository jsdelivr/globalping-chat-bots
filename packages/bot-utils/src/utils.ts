import type { Arguments } from 'yargs-parser';
import parser from 'yargs-parser';

import { ALLOWED_DNS_PROTOCOLS, ALLOWED_DNS_TYPES, ALLOWED_HTTP_METHODS, ALLOWED_HTTP_PROTOCOLS, ALLOWED_MTR_PROTOCOLS, ALLOWED_QUERY_TYPES, ALLOWED_TRACE_PROTOCOLS, isDnsProtocol, isDnsType, isHttpMethod, isHttpProtocol, isMtrProtocol, isTraceProtocol, PostMeasurement } from './types';

const throwArgError = (invalid: string | undefined, type: string, expected: string | string[]) => {
	if (invalid === undefined)
		return invalid;

	throw new TypeError(`Invalid argument ${invalid} for ${type}! Expected ${expected}.`);
};

interface ArgError {
	error: string
}

const validateArgs = (args: Arguments): PostMeasurement | ArgError => {
	const cmd = args._[0];
	const target = String(args._[1]);
	const limit = args.limit ?? 1;
	const locations = [{ magic: args.from.join(' ') }];

	// General flags that don't need to be validated
	const packets = Number(args.packets);
	const port = Number(args.port);
	const resolver = String(args.resolver);
	const trace = Boolean(args.trace);

	try {
		if (cmd === 'ping')
			return {
				type: 'ping',
				target,
				limit,
				locations,
				measurementOptions: {
					...packets && { packets },
				}
			};

		if (cmd === 'traceroute') {
			const protocol = isTraceProtocol(args.protocol) ? args.protocol : throwArgError(args.protocol, 'protocol', [...ALLOWED_TRACE_PROTOCOLS]);
			return {
				type: 'traceroute',
				target,
				limit,
				locations,
				measurementOptions: {
					...protocol && { protocol },
					...port && { port },
				}
			};
		}

		if (cmd === 'dns') {
			const dnsType = isDnsType(args.query) ? args.query : throwArgError(args.query, 'query', [...ALLOWED_DNS_TYPES]);
			const protocol = isDnsProtocol(args.protocol) ? args.protocol : throwArgError(args.protocol, 'protocol', [...ALLOWED_DNS_PROTOCOLS]);
			return {
				type: 'dns',
				target,
				limit,
				locations,
				measurementOptions: {
					...dnsType && { query: { type: dnsType } },
					...protocol && { protocol },
					...port && { port },
					...resolver && { resolver },
					...trace && { trace },
				}
			};
		}

		if (cmd === 'mtr') {
			const protocol = isMtrProtocol(args.protocol) ? args.protocol : throwArgError(args.protocol, 'protocol', [...ALLOWED_MTR_PROTOCOLS]);
			return {
				type: 'mtr',
				target,
				limit,
				locations,
				measurementOptions: {
					...protocol && { protocol },
					...port && { port },
					...packets && { packets },
				}
			};
		}

		if (cmd === 'http') {
			const protocol = isHttpProtocol(args.protocol) ? args.protocol : throwArgError(args.protocol, 'protocol', [...ALLOWED_HTTP_PROTOCOLS]);
			const method = isHttpMethod(args.method) ? args.method : throwArgError(args.method, 'method', [...ALLOWED_HTTP_METHODS]);
			return {
				type: 'http',
				target,
				limit,
				locations,
				...port && { port },
				...protocol && { protocol },
				request: {
					...args.path && { path: args.path },
					...args.query && { query: args.query },
					...method && { method },
					...args.host && { host: args.host },
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

			// If a flag isn't passed to override, infer from URL obj instead
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

