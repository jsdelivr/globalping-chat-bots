import minimist from 'minimist';

export const parseArgs = (args: string[]) => {
	if (args.indexOf('from') === 2)
		args[2] = '--from';

	return minimist(args);
};
