import { describe, expect, it } from 'vitest';

import { postMeasurement } from '../post.js';
import { postMeasurementHandlers, setupAPIServer } from './mocks/index.js';
import { MeasurementCreate } from '../types.js';

describe('Post', () => {
	setupAPIServer(postMeasurementHandlers);

	describe('Post measurement', () => {
		it('should post measurement', async () => {
			const res = await postMeasurement({
				target: 'google.com',
				type: 'ping',
				limit: 1,
				locations: [{ magic: 'gb' }],
			} as MeasurementCreate);
			expect(res).toEqual({ id: 'testId', probesCount: 1 });
		});
	});
});
