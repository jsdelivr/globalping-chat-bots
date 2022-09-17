import got, { HTTPError } from 'got';

import type { PostMeasurement, PostMeasurementResponse } from './types';
import { PostError } from './utils';

export const postMeasurement = async (optsArr: PostMeasurement[]): Promise<PostMeasurementResponse[]> => {
	let index = 0;
	try {
		const measurementArr: PostMeasurementResponse[] = [];
		for (const opts of optsArr) {

			// eslint-disable-next-line no-await-in-loop
			const res = await got.post('https://api.globalping.io/v1/measurements', {
				headers: {
					'Content-Type': 'application/json',
				},
				json: opts,
			});

			if (res.statusCode === 202) {
				measurementArr.push(JSON.parse(res.body));
				index += 1;
			} else {
				const body = JSON.parse(res.body);
				body.location = opts.locations[0].magic;
				throw new Error(body);
			}
		}
		return measurementArr;
	} catch (error) {
		if (error instanceof HTTPError) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const location = optsArr[index].locations[0].magic!;
			const newError = new PostError(error.response, location, error.message);
			throw newError;
		} else {
			throw new TypeError(error as string);
		}
	}
};
