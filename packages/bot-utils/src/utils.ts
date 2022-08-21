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
	if (error instanceof HTTPError) {
		const errObj: APIError = JSON.parse(error.response.body as string) as APIError;
		if (errObj.error.type === 'invalid_request_error')
			return `${error}\n\n${errObj.error.message}\n\n${errObj.error.params ? Object.keys(errObj.error.params).map(key => `${errObj.error.params?.[key]}`).join('\n') : 'Unknown validation error. Please make an issue to the Globalping repository.'}`;

		if (errObj.error.type === 'api_error')
			return `${error}\n\n${errObj.error.message}\n\nIf you think this is a bug, please make an issue at the Globalping repository reporting this.`;
	}
	return String(error);
};
