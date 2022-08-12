import got from 'got';

import type { PostMeasurement, PostMeasurementResponse } from './types';

export const postMeasurement = async (opts: PostMeasurement): Promise<PostMeasurementResponse> => {
	const res = await got.post('https://api.globalping.io/v1/measurements', {
		headers: {
			'Content-Type': 'application/json',
		},
		json: opts,
	}).catch(error => { throw new Error(error); });

	if (res.statusCode === 202) {
		return JSON.parse(res.body);
	}

	console.log(res.body);
	throw new Error(JSON.parse(res.body));
};
