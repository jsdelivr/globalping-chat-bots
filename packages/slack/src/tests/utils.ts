import { vi } from 'vitest';

import { UserStore } from '../db';
import { Logger, SlackClient } from '../utils';

export const mockLogger = (): Logger => ({
		info: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	} as any);

export const mockSlackClient = (): SlackClient => ({
		chat: {
			postEphemeral: vi.fn(),
		},
	} as any);

export const mockUserStore = (): UserStore => ({
		updateToken: vi.fn(),
		getToken: vi.fn(),
		updateAuthorizeSession: vi.fn(),
		getUserForAuthorization: vi.fn(),
	} as any);
