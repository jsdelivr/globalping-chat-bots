import type { Arguments } from 'yargs-parser';
import parser from 'yargs-parser';

export const parseArgs = (argv: string | string[]) => {
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

	return parsed;
};

