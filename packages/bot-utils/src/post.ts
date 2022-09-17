import got from 'got';

import type { PostMeasurement, PostMeasurementResponse } from './types';

export const postMeasurement = async (optsArr: PostMeasurement[]): Promise<PostMeasurementResponse[]> => {
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
		} else {
			throw new Error(JSON.parse(res.body));
		}
	}
	return measurementArr;
};
