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
