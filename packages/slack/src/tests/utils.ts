import { vi } from 'vitest';

import { InstallationStore } from '../db.js';
import { Logger, SlackClient } from '../utils.js';
import { OAuthClient } from '../auth.js';
import probeData from '../../../bot-utils/tests/mocks/probedata.json';
import { Measurement } from '@globalping/bot-utils';

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
}) as any;

export const mockInstallationStore = (): InstallationStore => ({
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
