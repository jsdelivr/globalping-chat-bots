/* eslint-disable @typescript-eslint/return-await */
import { AuthToken } from '@globalping/bot-utils';
import type {
	Installation as SlackInstallation,
	InstallationQuery,
} from '@slack/bolt';
import { knex as knexInstance } from 'knex';

import { config } from './config.js';
import { getInstallationId, logger } from './utils.js';

type AuthVersion = 'v1' | 'v2';
export type Installation = SlackInstallation<AuthVersion, boolean>;

export const enum Tables {
	Installations = 'installations',
}

export interface AuthorizeSession {
	callbackVerifier: string;
	exchangeVerifier: string;
	channelId: string;
	userId: string;
	threadTs?: string;
}

declare module 'knex/types/tables' {
	interface UserInstallation {
		id: string;
		installation: Installation | null;
		token: AuthToken | null;
		authorize_session: AuthorizeSession | null;
		installation_token: AuthToken | null;
	}

	interface Tables {
		// This is same as specifying `knex<User>('users')`
		installations: UserInstallation;
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

export const installationStore = {
	storeInstallation: async (installation: Installation) => {
		logger.debug({ installation }, 'Storing installation');

		try {
			// Bolt will pass your handler an installation object
			// Change the lines below so they save to your database
			let id: string | undefined;

			if (
				installation.isEnterpriseInstall
				&& installation.enterprise !== undefined
			) {
				id = installation.enterprise.id;
			} else if (installation.team !== undefined) {
				id = installation.team.id;
			}

			if (!id) {
				throw new Error('Failed saving installation to installationStore (no team or enterprise id)');
			}

			await knex
				.table(Tables.Installations)
				.insert({ id, installation })
				.onConflict('id')
				.merge();

			logger.debug({ id }, 'Installation set');
		} catch (error) {
			const err = new Error(`Failed to set installation: ${error}`);
			logger.error(err);
			throw err;
		}
	},
	fetchInstallation: async (installQuery: InstallationQuery<boolean>) => {
		logger.debug({ installQuery }, 'Fetching installation');

		try {
			// Bolt will pass your handler an installQuery object
			// Change the lines below so they fetch from your database
			const id = getInstallationId(installQuery);
			const res = await knex
				.table(Tables.Installations)
				.select('installation')
				.where('id', id)
				.first();

			if (!res) {
				throw new Error(id);
			}

			logger.debug(
				{ installation: res.installation },
				'Installation retrieved',
			);

			if (!res.installation) {
				return null;
			}

			return JSON.parse(res.installation as unknown as string);
		} catch (error) {
			const err = new Error(`Failed to fetch installation: ${error}`);
			logger.error(err);
			throw err;
		}
	},
	deleteInstallation: async (installQuery: InstallationQuery<boolean>) => {
		logger.debug({ installQuery }, 'Deleting installation');

		try {
			// Bolt will pass your handler  an installQuery object
			// Change the lines below so they delete from your database
			const id = getInstallationId(installQuery);
			await knex.table(Tables.Installations).where('id', id).update({
				installation: null,
			});

			logger.debug({ id }, 'Installation deleted');
		} catch (error) {
			const err = new Error(`Failed to delete installation: ${error}`);
			logger.error(err);
			throw err;
		}
	},
	// NOTE: When Bolt.js allows adding custom data to context from fetchInstallation,
	//       we should load the token from there to avoid an extra DB call.
	// See: https://github.com/slackapi/bolt-js/issues/1831
	getToken: async (id: string) => {
		try {
			const res = await knex
				.table(Tables.Installations)
				.select('token', 'installation_token')
				.where('id', id)
				.first();

			if (!res) {
				return null;
			}

			if (res.token) {
				return JSON.parse(res.token as unknown as string) as AuthToken;
			}

			if (res.installation_token) {
				return JSON.parse(res.installation_token as unknown as string) as AuthToken;
			}

			return null;
		} catch (error) {
			const err = new Error(`Failed to get token: ${error}`);
			logger.error(err);
			throw err;
		}
	},
	updateToken: async (id: string, token: AuthToken | null) => {
		try {
			// Note: The installation token (anonymous token) is kept
			// separately and not deleted to make sure the rate limits
			// are not exceeded when the user signs in/out or the bot
			// is re-installed.
			const update: {
				token?: string | null;
				installation_token?: string | null;
			} = {};

			if (token?.isAnonymous) {
				update.installation_token = JSON.stringify(token);
			} else {
				update.token = token ? JSON.stringify(token) : null;
			}

			await knex
				.table(Tables.Installations)
				.where('id', id)
				.update(update as never);

			logger.debug({ id }, 'Token set');
		} catch (error) {
			const err = new Error(`Failed to set token: ${error}`);
			logger.error(err);
			throw err;
		}
	},
	updateAuthorizeSession: async (
		id: string,
		authorizeSesssion: AuthorizeSession | null,
	) => {
		try {
			await knex
				.table(Tables.Installations)
				.where('id', id)
				.update({
					authorize_session: authorizeSesssion
						? (JSON.stringify(authorizeSesssion) as never) // TODO add the actual type
						: null,
				});
		} catch (error) {
			const err = new Error(`Failed to set authorize session: ${error}`);
			logger.error(err);
			throw err;
		}
	},
	getInstallationForAuthorization: async (id: string) => {
		try {
			const res = await knex
				.table(Tables.Installations)
				.select('installation', 'token', 'authorize_session')
				.where('id', id)
				.first();

			if (!res) {
				return {
					token: null,
					session: null,
					installation: null,
				};
			}

			// Note: When upgrading the MySQL version, the JSON.parse() call may not be needed
			const installation = res.installation
				? JSON.parse(res.installation as unknown as string)
				: null;
			const token = res.token
				? JSON.parse(res.token as unknown as string)
				: null;
			const session = res.authorize_session
				? JSON.parse(res.authorize_session as unknown as string)
				: null;
			return {
				installation,
				token,
				session,
			};
		} catch (error) {
			const err = new Error(`Failed to get authorize session: ${error}`);
			logger.error(err);
			throw err;
		}
	},
};

export type InstallationStore = typeof installationStore;
