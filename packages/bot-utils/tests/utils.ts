import { vi } from 'vitest';

import { DBClient } from '../src/oauth.js';
import { Logger } from '../src/logger.js';

export const mockDBClient = (): DBClient => ({
	getToken: vi.fn(),
	updateToken: vi.fn(),
	updateAuthorizeSession: vi.fn(),
}) as any;

export const mockLogger = (): Logger => ({
	info: vi.fn(),
	error: vi.fn(),
	debug: vi.fn(),
}) as any;
