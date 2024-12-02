import got, { HTTPError } from 'got';

import { PostError } from './errors.js';
import type { PostMeasurement, PostMeasurementResponse } from './types.js';
import { userAgent } from './user-agent.js';

export const postMeasurement = async (
	opts: PostMeasurement,
	token?: string,
): Promise<PostMeasurementResponse> => {
	try {
		const headers: { [key: string]: string } = {
			'Content-Type': 'application/json',
			'User-Agent': userAgent(),
			'Accept-Encoding': 'br',
		};

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		// eslint-disable-next-line no-await-in-loop
		const res = await got.post('https://api.globalping.io/v1/measurements', {
			headers,
			json: opts,
		});

		if (res.statusCode !== 202) {
			const body = JSON.parse(res.body);
			body.location = opts.locations[0].magic;
			throw new Error(body);
		}

		return JSON.parse(res.body);
	} catch (error) {
		if (error instanceof HTTPError) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const location = opts.locations[0].magic!;
			const newError = new PostError(error.response, location, error.message);

			throw newError;
		} else {
			throw new TypeError(error as string);
		}
	}
};
