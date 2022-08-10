import { rest } from 'msw';

import data from './probedata.json';

export const postMeasurementHandlers = [
	rest.post('https://api.globalping.io/v1/measurements', (_req, res, ctx) => res(ctx.status(202), ctx.json({ id: 'testId', probesCount: 1 })))
];

export const getMeasurementHandlers = [
	rest.get('https://api.globalping.io/v1/measurements/test1', (_req, res, ctx) => res(ctx.status(200), ctx.json(data.test1)))
];
