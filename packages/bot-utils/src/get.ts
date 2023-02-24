/* eslint-disable no-await-in-loop */
import got from 'got';

import type { MeasurementResponse } from './types';

const fetchMeasurement = async (id: string): Promise<MeasurementResponse> => {
	const res = await got.get(`https://api.globalping.io/v1/measurements/${id}`);
	if (res.statusCode === 200)
		return JSON.parse(res.body);

	throw new Error(JSON.parse(res.body));
};

export const getMeasurement = async (id: string): Promise<MeasurementResponse> => {
	let data = await fetchMeasurement(id);
	while (data.status === 'in-progress') {
		// eslint-disable-next-line no-promise-executor-return
		await new Promise(resolve => setTimeout(resolve, 100));
		data = await fetchMeasurement(id);
	}
	return data;
};

export const getTag = (tags: string[]): string | undefined => {
	if (tags.length === 0) return undefined;
	// Iterarate through tags and return the first one that has its last character be a number
	for (const tag of tags) {
		if (Number.isInteger(Number(tag.slice(-1)))) return `${tag}`;
	}
	return undefined;
};
