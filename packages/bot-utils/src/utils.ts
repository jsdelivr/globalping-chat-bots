import { HTTPError } from 'got';

export const throwArgError = (invalid: string | undefined, type: string, expected: string) => {
	throw new TypeError(`Invalid argument "${invalid}" for "${type}"!\nExpected "${expected}".`);
};
interface APIError {
	error: {
		message: string
		type: 'invalid_request_error' | 'api_error'
		params?: {
			[key: string]: string
		}
	}
}

export const formatAPIError = (error: unknown): string => {
	let msg = error;
	if (error instanceof HTTPError) {
		const errObj: APIError = error.response.body as APIError;
		if (errObj.error.type === 'invalid_request_error')
			msg = `${error}\n${errObj.error.message}\n${errObj.error.params ? Object.keys(errObj.error.params).map(key => `${key}: ${errObj.error.params?.[key]}`).join('\n') : 'Unknown validation error. Please make an issue to the Globalping repository.'}`;

		if (errObj.error.type === 'api_error')
			msg = `${error}\n${errObj.error.message}\nPlease make an issue at the Globalping repository reporting this!`;
	}
	return String(msg);
};
