export const throwArgError = (
	invalid: string | undefined,
	type: string,
	expected: string,
) => {
	throw new TypeError(`Invalid argument "${invalid}" for "${type}"!\nExpected "${expected}".`);
};

export const throwOptError = (
	invalid: string | undefined,
	type: string,
	expected: string,
) => {
	throw new TypeError(`Invalid option "${invalid}" for "${type}"!\nExpected "${expected}".`);
};

export const pluralize = (count: number, singular: string): string => {
	if (count === 1) {
		return `${count} ${singular}`;
	}

	return `${count} ${singular}s`;
};

export const formatSeconds = (seconds: number): string => {
	if (seconds < 60) {
		return pluralize(seconds, 'second');
	}

	if (seconds < 3600) {
		return pluralize(Math.round(seconds / 60), 'minute');
	}

	if (seconds < 86400) {
		return pluralize(Math.round(seconds / 3600), 'hour');
	}

	return pluralize(Math.round(seconds / 86400), 'day');
};
