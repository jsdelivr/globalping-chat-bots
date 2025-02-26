import { http } from 'msw';

import dataImport from './probedata.json' assert { type: 'json' };

const data: Record<string, object> = dataImport;

export const postMeasurementHandlers = [
	http.post('https://api.globalping.io/v1/measurements', () => {
		return new Response(JSON.stringify({ id: 'testId', probesCount: 1 }), {
			headers: {
				'Content-Type': 'application/json',
			},
			status: 202,
		});
	}),
];

export const getMeasurementHandlers = [
	http.get('https://api.globalping.io/v1/measurements/:id', ({ params }) => {
		return new Response(JSON.stringify(data[params.id as string]), {
			headers: {
				'Content-Type': 'application/json',
			},
			status: 200,
		});
	}),
];
