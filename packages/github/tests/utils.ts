import { vi } from 'vitest';

import { Logger, Measurement } from '@globalping/bot-utils';
import probeData from '@globalping/bot-utils/tests/mocks/probedata.json' assert { type: 'json' };
import { Octokit } from 'octokit';
import { Readable } from 'node:stream';
import { IncomingMessage } from 'node:http';

export const mockLogger = (): Logger => ({
	info: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
}) as any;

export const mockGithubClient = (): Octokit => ({
	rest: {
		issues: {
			createComment: vi.fn(),
		},
	},
}) as any;

export const mockPostMeasurement = () => vi.fn();
export const mockGetMeasurement = () => vi.fn();

export const getDefaultDnsResponse = (): Measurement => {
	return probeData.dns1 as any;
};

export const getDefaultHttpResponse = (): Measurement => {
	return probeData.http1 as any;
};

export const getDefaultMtrResponse = (): Measurement => {
	return probeData.mtr1 as any;
};

export const getDefaultPingResponse = (): Measurement => {
	return probeData.ping1 as any;
};

export const getDefaultTracerouteResponse = (): Measurement => {
	return probeData.traceroute1 as any;
};

export const mockIncomingMessage = (
	options = {},
	data: string | Buffer,
): IncomingMessage => {
	const readable = new Readable();
	readable._read = () => {
		readable.emit('data', data);
		readable.emit('end');
	};

	const mockRequest = Object.assign(readable, options);

	return mockRequest as IncomingMessage;
};
