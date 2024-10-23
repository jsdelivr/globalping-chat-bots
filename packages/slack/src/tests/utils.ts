import { vi } from 'vitest';

import { InstallationStore } from '../db.js';
import { Logger, SlackClient } from '../utils.js';

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

export const mockInstallationStore = (): InstallationStore => ({
	getToken: vi.fn(),
	updateToken: vi.fn(),
	updateAuthorizeSession: vi.fn(),
	getInstallationForAuthorization: vi.fn(),
} as any);
