import { rest } from 'msw';

export const postMeasurementHandlers = [
	rest.post('https://api.globalping.io/v1/measurements', (req, res, ctx) => res(ctx.status(202), ctx.json({ id: 'testId', probesCount: 1 })))
];
