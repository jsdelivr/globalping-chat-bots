import parser from 'yargs-parser';

export const parseArgs = (args: string[]) => {
	if (args.indexOf('from') === 2)
		args[2] = '--from';

	const results = parser(args, {
		array: ['from', 'limit', 'packets', 'port', 'protocol', 'type', 'resolver', 'path', 'query', 'host', 'method', 'header'],
		configuration: {
			'greedy-arrays': true,
		}
	});

	return results;
};
