import { vi } from 'vitest';

import probeData from '@globalping/bot-utils/dist/tests/mocks/probedata.json' assert { type: 'json' };
import { Logger, Measurement, OAuthClient } from '@globalping/bot-utils';
import { ChatInputCommandInteraction, Client } from 'discord.js';
import { DBClient } from '../src/db.js';

export const mockLogger = (): Logger => ({
	info: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
}) as any;

export const mockDiscordInteraction = (): ChatInputCommandInteraction => ({
	isChatInputCommand: vi.fn(),
	deferReply: vi.fn(),
	editReply: vi.fn(),
	reply: vi.fn(),
	commandName: 'globalping',
	options: {
		getSubcommand: vi.fn(),
		getString: vi.fn(),
		getNumber: vi.fn(),
		getBoolean: vi.fn(),
	},
	inGuild: () => true,
	guildId: '654',
	channelId: 'C123',
	applicationId: 'A123',
	token: 'message_tok3n',
	user: {
		id: '123',
	},
}) as any;

export const mockDiscordClient = (): Client => ({
	rest: {
		post: vi.fn(),
	},
}) as any;

export const mockDBClient = (): DBClient => ({
	getToken: vi.fn(),
	updateToken: vi.fn(),
	updateAuthorizeSession: vi.fn(),
	getDataForAuthorization: vi.fn(),
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
	Exchange: vi.fn(),
	RevokeToken: vi.fn(),
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
