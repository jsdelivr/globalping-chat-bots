import { describe, expect, it } from 'vitest';

import { postMeasurement } from '../src/post.js';
import { postMeasurementHandlers, setupAPIServer } from './mocks/index.js';
import { PostMeasurement } from '../src/types.js';

describe('Post', () => {
	setupAPIServer(postMeasurementHandlers);

	describe('Post measurement', () => {
		it('should post measurement', async () => {
			const res = await postMeasurement({
				target: 'google.com',
				type: 'ping',
				limit: 1,
				locations: [{ magic: 'gb' }],
			} as PostMeasurement);
			expect(res).toEqual({ id: 'testId', probesCount: 1 });
		});
	});
});
