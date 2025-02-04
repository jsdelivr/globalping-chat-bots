import { vi } from 'vitest';

import { SlackClient } from '../types.js';
import { OAuthClient } from '../auth.js';
import probeData from '@globalping/bot-utils/src/tests/mocks/probedata.json' assert { type: 'json' };
import { Logger, Measurement } from '@globalping/bot-utils';
import { DBClient } from '../db.js';

export const mockLogger = (): Logger => ({
	info: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
}) as any;

export const mockSlackClient = (): SlackClient => ({
	chat: {
		postEphemeral: vi.fn(),
		postMessage: vi.fn(),
	},
	conversations: {
		info: vi.fn(),
	},
	users: {
		info: vi.fn(),
	},
}) as any;

export const mockDBClient = (): DBClient => ({
	getToken: vi.fn(),
	updateToken: vi.fn(),
	updateAuthorizeSession: vi.fn(),
	getInstallationForAuthorization: vi.fn(),
}) as any;

export const mockPostMeasurement = () => vi.fn();
export const mockGetMeasurement = () => vi.fn();

export const mockAuthClient = (): OAuthClient => ({
	Authorize: vi.fn(),
	Logout: vi.fn(),
	Introspect: vi.fn(),
	Limits: vi.fn(),
	GetToken: vi.fn(),
	TryToRefreshToken: vi.fn(),
}) as any;

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
