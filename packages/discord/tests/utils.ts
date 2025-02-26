import { vi } from 'vitest';

import probeData from '@globalping/bot-utils/dist/tests/mocks/probedata.json' assert { type: 'json' };
import { Logger, Measurement } from '@globalping/bot-utils';
import { ChatInputCommandInteraction } from 'discord.js';

export const mockLogger = (): Logger => ({
	info: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
}) as any;

export const mockDiscordInteraction = (): ChatInputCommandInteraction => ({
	isChatInputCommand: vi.fn(),
	deferReply: vi.fn(),
	editReply: vi.fn(),
	commandName: 'globalping',
	options: {
		getSubcommand: vi.fn(),
		getString: vi.fn(),
		getNumber: vi.fn(),
		getBoolean: vi.fn(),
	},
	user: {
		id: '123',
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
