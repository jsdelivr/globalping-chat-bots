import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	getLimitsOutput,
	getMoreCreditsRequiredAuthError,
	getMoreCreditsRequiredNoAuthError,
	getNoCreditsAuthError,
	getNoCreditsNoAuthError,
} from '../post.js';
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

			expect(getLimitsOutput(limits, introspection)).toBe(expectedText);
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

			expect(getLimitsOutput(limits, introspection)).toBe(expectedText);
		});
	});

	describe('getMoreCreditsRequiredAuthError', () => {
		it('should return correct error', () => {
			const error = getMoreCreditsRequiredAuthError(5, 2, 300);
			expect(error).toEqual(new Error('You only have 2 credits remaining, and 5 were required. Try requesting fewer probes or wait 5 minutes for the rate limit to reset. You can get higher limits by sponsoring us or hosting probes.'));
		});
	});

	describe('getNoCreditsAuthError', () => {
		it('should return correct error', () => {
			const error = getNoCreditsAuthError(60);
			expect(error).toEqual(new Error('You have run out of credits for this session. You can wait 1 minute for the rate limit to reset or get higher limits by sponsoring us or hosting probes.'));
		});
	});

	describe('getMoreCreditsRequiredNoAuthError', () => {
		it('should return correct error', () => {
			const error = getMoreCreditsRequiredNoAuthError(2, 1, 245);
			expect(error).toEqual(new Error('You only have 1 credit remaining, and 2 were required. Try requesting fewer probes or wait 4 minutes for the rate limit to reset. You can get higher limits by creating an account. Sign up at https://globalping.io'));
		});
	});

	describe('getNoCreditsNoAuthError', () => {
		it('should return correct error', () => {
			const error = getNoCreditsNoAuthError(10);
			expect(error).toEqual(new Error('You have run out of credits for this session. You can wait 10 seconds for the rate limit to reset or get higher limits by creating an account. Sign up at https://globalping.io'));
		});
	});
});
