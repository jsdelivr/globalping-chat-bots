/* eslint-disable no-await-in-loop */
import got, { Headers, Response } from 'got';

import type { MeasurementResponse } from './types';
import { userAgent } from './user-agent';

class MeasurementsFetcher {
	// The api url endpoint
	apiUrl: string;

	// caches Etags by measurement id
	etags: Record<string, string>;

	// caches Measurements by ETag
	measurements: Record<string, MeasurementResponse>;

	constructor(apiUrl: string) {
		this.apiUrl = apiUrl;
		this.etags = {};
		this.measurements = {};
	}

	async fetchMeasurement(id: string): Promise<MeasurementResponse> {
		const headers: Headers = {
			'User-Agent': userAgent(),
			'Accept-Encoding': 'br',
		};

		let etag: string | undefined = this.etags[id];
		if (etag !== undefined) {
			headers['If-None-Match'] = etag;
		}

		const res: Response<string> = await got.get(`${this.apiUrl}/${id}`, {
			method: 'GET',
			headers,
		});

		if (res.statusCode === 304) {
			// 304 not modified
			// get response from cache
			const measurementResponse = this.measurements[etag];
			if (measurementResponse === undefined) {
				throw new Error('response not found in etags cache');
			}

			return measurementResponse;
		} if (res.statusCode >= 400) {
			if (res.statusCode === 500) {
				throw new Error(JSON.parse(res.body));
			} else if (res.statusCode === 404) {
				throw new Error('measurement not found');
			} else {
				throw new Error(`error with http status code: ${res.statusCode}`);
			}
		}

		const measurementResponse: MeasurementResponse = JSON.parse(res.body);

		// save etag and response to cache
		etag = res.headers.etag;
		if (etag !== undefined) {
			this.etags[id] = etag;
			this.measurements[etag] = measurementResponse;
		}

		return measurementResponse;
	};
}

export const ApiUrl = 'https://api.globalping.io/v1/measurements';


const apiPollInterval = 500;

export const getMeasurement = async (id: string): Promise<MeasurementResponse> => {
	const measurementsFetcher = new MeasurementsFetcher(ApiUrl);

	let data = await measurementsFetcher.fetchMeasurement(id);
	while (data.status === 'in-progress') {
		// eslint-disable-next-line no-promise-executor-return
		await new Promise(resolve => setTimeout(resolve, apiPollInterval));
		data = await measurementsFetcher.fetchMeasurement(id);
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


