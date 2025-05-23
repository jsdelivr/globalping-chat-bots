import { Response } from 'got';
import { codeBlock, linkBlock, LinkBlockType } from './response.js';

interface APIError {
	error: {
		message: string;
		type: 'validation_error' | 'no_probes_found' | 'api_error';
		params?: {
			[key: string]: string;
		};
	};
}

export class PostError extends Error {
	response: Response<unknown>;

	location: string;

	constructor (response: Response<unknown>, location: string, message = '') {
		super(message);
		this.message = message;
		this.response = response;
		this.location = location;
	}
}

export function getAPIErrorMessage (error: unknown): string {
	// @ts-expect-error Discord error format
	if (error.code === 50_001) {
		return 'Missing access! Please add the Globalping bot to this channel!';
	}

	if (error instanceof PostError) {
		const { location, response } = error;
		const { body } = response;
		const errObj: APIError = JSON.parse(body as string) as APIError;

		if (errObj.error.type === 'validation_error') {
			return `Error: invalid parameters\n${errObj.error.params
				? Object.keys(errObj.error.params)
					.map(key => ` - ${errObj.error.params?.[key]}`)
					.join('\n')
				: ' - unknown validation error.'
			}`;
		}

		if (errObj.error.type === 'no_probes_found') {
			return `${errObj.error.message} at location ${location}`;
		}

		if (errObj.error.type === 'api_error') {
			return errObj.error.message;
		}
	} else if (error instanceof Error || error instanceof TypeError) {
		return error.message;
	}

	return `${error}`;
}

export function formatAPIError (error: unknown, linkType: LinkBlockType): string {
	return `${codeBlock(getAPIErrorMessage(error))}
Documentation and Support: ${linkBlock('https://github.com/jsdelivr/globalping', linkType)}`;
}
