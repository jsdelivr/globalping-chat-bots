/* eslint-disable @typescript-eslint/return-await */
import type { Installation, InstallationQuery } from '@slack/bolt';
import { knex as knexInstance } from 'knex';

import { getInstallationId, logger } from './utils';
import { config } from './config';

type AuthVersion = 'v1' | 'v2';
export type InstallationStore = Installation<AuthVersion, boolean>;

export interface AuthToken {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	expiry: number; // Unix timestamp
}

export const enum Tables {
	Installations = 'installations',
	Users = 'users',
}

export interface AuthorizeSession {
	verifier: string;
	installationId?: string;
	channelId: string;
	userId: string;
	threadTs?: string;
}

declare module 'knex/types/tables' {
	interface UserInstallation {
		id: string;
		installation: InstallationStore;
	}

	interface AuthToken {
		id: string;
		token: AuthToken;
	}

	interface Tables {
		// This is same as specifying `knex<User>('users')`
		installations: UserInstallation;
		authTokens: AuthToken;
	}
}
// Query builder
export const knex = knexInstance({
	client: 'mysql',
	connection: {
		host: config.dbHost,
		port: config.dbPort,
		user: config.dbUser,
		password: config.dbPassword,
		database: config.dbDatabase,
	},
	migrations: {
		directory: './migrations',
	},
});

const setInstallation = async (
	id: string,
	installation: InstallationStore
): Promise<void> => {
	try {
		await knex
			.table(Tables.Installations)
			.insert({ id, installation })
			.onConflict('id')
			.merge();
		logger.debug(`Installation set: ${id}`);
	} catch (error) {
		throw new Error(`Failed to set installation: ${error}`);
	}
};

const getInstallation = async (id: string): Promise<InstallationStore> => {
	try {
		const installation = await knex
			.table(Tables.Installations)
			.where('id', id)
			.first();
		if (!installation) {
			throw new Error(id);
		}
		logger.debug(`Installation retrieved: ${JSON.stringify(installation)}`);
		return JSON.parse(installation.installation as unknown as string);
	} catch (error) {
		throw new Error(`Failed to get installation: ${error}`);
	}
};

const deleteInstallation = async (id: string): Promise<void> => {
	try {
		await knex.table(Tables.Installations).where('id', id).del();
		logger.debug(`Installation deleted: ${id}`);
	} catch (error) {
		throw new Error(`Failed to delete installation: ${error}`);
	}
};

export const installationStore = {
	storeInstallation: (installation: InstallationStore) => {
		logger.debug(`Storing installation: ${JSON.stringify(installation)}`);
		try {
			// Bolt will pass your handler an installation object
			// Change the lines below so they save to your database
			if (
				installation.isEnterpriseInstall &&
				installation.enterprise !== undefined
			) {
				// handle storing org-wide app installation
				return setInstallation(installation.enterprise.id, installation);
			}
			if (installation.team !== undefined) {
				// single team app installation
				return setInstallation(installation.team.id, installation);
			}
			throw new Error(
				'Failed saving installation to installationStore (no team or enterprise id)'
			);
		} catch (error) {
			logger.error(error);
			throw error;
		}
	},
	fetchInstallation: async (installQuery: InstallationQuery<boolean>) => {
		logger.debug(`Fetching installation: ${JSON.stringify(installQuery)}`);
		try {
			// Bolt will pass your handler an installQuery object
			// Change the lines below so they fetch from your database
			const id = getInstallationId(installQuery);
			if (id === undefined) {
				throw new Error('Failed fetching installation (no id)');
			}
			return await getInstallation(id);
		} catch (error) {
			logger.error(error);
			throw error;
		}
	},
	deleteInstallation: async (installQuery: InstallationQuery<boolean>) => {
		logger.debug(`Deleting installation: ${JSON.stringify(installQuery)}`);
		try {
			// Bolt will pass your handler  an installQuery object
			// Change the lines below so they delete from your database
			const id = getInstallationId(installQuery);
			if (id === undefined) {
				throw new Error('Failed deleting installation (no id)');
			}
			return await deleteInstallation(id);
		} catch (error) {
			logger.error(error);
			throw error;
		}
	},
};

export type UserStore = typeof userStore;

export const userStore = {
	updateToken: async (id: string, token: AuthToken | null) => {
		try {
			const res = await knex
				.table(Tables.Users)
				.insert({ id, token })
				.onConflict('id')
				.merge();
			logger.debug(`Token set: ${res}`);
		} catch (error) {
			const err = new Error(`Failed to set token: ${error}`);
			logger.error(err);
			throw err;
		}
	},
	getToken: async (id: string) => {
		try {
			const token = await knex.table(Tables.Users).where('id', id).first();
			if (!token) {
				return null;
			}
			return JSON.parse(token.token as string) as AuthToken;
		} catch (error) {
			const err = new Error(`Failed to get token: ${error}`);
			logger.error(err);
			throw err;
		}
	},
	updateAuthorizeSession: async (
		id: string,
		authorizeSesssion: AuthorizeSession | null
	) => {
		try {
			await knex
				.table(Tables.Users)
				.insert({ id, authorize_session: authorizeSesssion })
				.onConflict('id')
				.merge();
		} catch (error) {
			const err = new Error(`Failed to set authorize session: ${error}`);
			logger.error(err);
			throw err;
		}
	},
	getUserForAuthorization: async (id: string) => {
		try {
			const res = await knex
				.table(Tables.Users)
				.select('token', 'authorize_session')
				.where('id', id)
				.first();
			if (!res) {
				return {
					token: null,
					session: null,
					installation: null,
				};
			}
			const token = res.token ? JSON.parse(res.token as string) : null;
			const session = res.authorize_session
				? JSON.parse(res.authorize_session as string)
				: null;
			let installation: InstallationStore | null = null;
			if (session && session.installationId) {
				try {
					installation = await getInstallation(session.installationId);
				} catch (error) {
					logger.error(
						`Failed to get installation for authorize session: ${error}`
					);
				}
			}
			return {
				token,
				session: session,
				installation,
			};
		} catch (error) {
			const err = new Error(`Failed to get authorize session: ${error}`);
			logger.error(err);
			throw err;
		}
	},
};
