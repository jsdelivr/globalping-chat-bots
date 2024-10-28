import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLimitsOutput as getLimitsText } from '../post.js';
import {
	CreateLimitType,
	IntrospectionResponse,
	LimitsResponse,
} from '../auth.js';

describe('post', () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('getLimitsOutput', () => {
		it('should return correct text', () => {
			const introspection: IntrospectionResponse = {
				active: true,
				username: 'john',
			};
			const limits: LimitsResponse = {
				rateLimit: {
					measurements: {
						create: {
							type: CreateLimitType.User,
							limit: 500,
							remaining: 350,
							reset: 600,
						},
					},
				},
				credits: {
					remaining: 1000,
				},
			};

			const expectedText = `Authentication: token (john)

Creating measurements:
 - 500 tests per hour
 - 150 consumed, 350 remaining
 - resets in 10 minutes

Credits:
 - 1000 credits remaining (may be used to create measurements above the hourly limits)
`;

			expect(getLimitsText(limits, introspection)).toBe(expectedText);
		});

		it('should return correct text - limit type IP', () => {
			const introspection: IntrospectionResponse = {
				active: true,
				username: 'john',
			};
			const limits: LimitsResponse = {
				rateLimit: {
					measurements: {
						create: {
							type: CreateLimitType.IP,
							limit: 500,
							remaining: 500,
							reset: 0,
						},
					},
				},
			};

			const expectedText = `Authentication: workspace

Creating measurements:
 - 500 tests per hour
 - 0 consumed, 500 remaining
`;

			expect(getLimitsText(limits, introspection)).toBe(expectedText);
		});
	});
});
