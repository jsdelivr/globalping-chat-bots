/* eslint-disable no-await-in-loop */
import got from 'got';

import type { MeasurementResponse } from './types';

const fetchMeasurement = async (id: string): Promise<MeasurementResponse> => {
	const res = await got.get(`https://api.globalping.io/v1/measurements/${id}`);
	return JSON.parse(res.body);
};

export const getMeasurement = async (id: string): Promise<MeasurementResponse[]> => {
	const data = [await fetchMeasurement(id)];
	while (data[data.length - 1].status === 'in-progress') {
		// eslint-disable-next-line no-promise-executor-return
		await new Promise(resolve => setTimeout(resolve, 100));
		data.push(await fetchMeasurement(id));
	}
	return data;
};
