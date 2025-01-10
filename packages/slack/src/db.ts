import { AuthToken, Logger, KnexClient, Tables } from '@globalping/bot-utils';
import type {
	Installation as SlackInstallation,
	InstallationQuery,
} from '@slack/bolt';

import { getInstallationId } from './utils.js';

type AuthVersion = 'v1' | 'v2';
export type Installation = SlackInstallation<AuthVersion, boolean>;

export interface AuthorizeSession {
	callbackVerifier: string;
	exchangeVerifier: string;
	channelId: string;
	userId: string;
	threadTs?: string;
}

export class DBClient {
	constructor (
		private knex: KnexClient,
		private logger: Logger,
	) {}

	async storeInstallation (installation: Installation) {
		this.logger.debug({ installation }, 'Storing installation');

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

			await this.knex
				.table(Tables.Installations)
				.insert({ id, installation: JSON.stringify(installation) })
				.onConflict('id')
				.merge();

			this.logger.debug({ id }, 'Installation set');
		} catch (error) {
			const err = new Error(`Failed to set installation: ${error}`);
			this.logger.error(err);
			throw err;
		}
	}

	async fetchInstallation (installQuery: InstallationQuery<boolean>) {
		this.logger.debug({ installQuery }, 'Fetching installation');

		try {
			// Bolt will pass your handler an installQuery object
			// Change the lines below so they fetch from your database
			const id = getInstallationId(installQuery);
			const res = await this.knex
				.table(Tables.Installations)
				.select('installation')
				.where('id', id)
				.first();

			if (!res) {
				throw new Error(id);
			}

			this.logger.debug(
				{ installation: res.installation },
				'Installation retrieved',
			);

			if (!res.installation) {
				return null;
			}

			return JSON.parse(res.installation);
		} catch (error) {
			const err = new Error(`Failed to fetch installation: ${error}`);
			this.logger.error(err);
			throw err;
		}
	}

	async deleteInstallation (installQuery: InstallationQuery<boolean>) {
		this.logger.debug({ installQuery }, 'Deleting installation');

		try {
			// Bolt will pass your handler  an installQuery object
			// Change the lines below so they delete from your database
			const id = getInstallationId(installQuery);
			await this.knex.table(Tables.Installations).where('id', id).update({
				installation: null,
			});

			this.logger.debug({ id }, 'Installation deleted');
		} catch (error) {
			const err = new Error(`Failed to delete installation: ${error}`);
			this.logger.error(err);
			throw err;
		}
	}

	// NOTE: When Bolt.js allows adding custom data to context from fetchInstallation,
	//       we should load the token from there to avoid an extra DB call.
	// See: https://github.com/slackapi/bolt-js/issues/1831
	async getToken (id: string) {
		try {
			const res = await this.knex
				.table(Tables.Installations)
				.select('token', 'installation_token')
				.where('id', id)
				.first();

			if (!res) {
				return null;
			}

			if (res.token) {
				return JSON.parse(res.token) as AuthToken;
			}

			if (res.installation_token) {
				return JSON.parse(res.installation_token) as AuthToken;
			}

			return null;
		} catch (error) {
			const err = new Error(`Failed to get token: ${error}`);
			this.logger.error(err);
			throw err;
		}
	}

	async updateToken (id: string, token: AuthToken | null) {
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

			await this.knex
				.table(Tables.Installations)
				.where('id', id)
				.update(update as never);

			this.logger.debug({ id }, 'Token set');
		} catch (error) {
			const err = new Error(`Failed to set token: ${error}`);
			this.logger.error(err);
			throw err;
		}
	}

	async updateAuthorizeSession (
		id: string,
		authorizeSesssion: AuthorizeSession | null,
	) {
		try {
			await this.knex
				.table(Tables.Installations)
				.where('id', id)
				.update({
					authorize_session: authorizeSesssion
						? JSON.stringify(authorizeSesssion)
						: null,
				});
		} catch (error) {
			const err = new Error(`Failed to set authorize session: ${error}`);
			this.logger.error(err);
			throw err;
		}
	}

	async getInstallationForAuthorization (id: string) {
		try {
			const res = await this.knex
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
				? JSON.parse(res.installation)
				: null;
			const token = res.token ? JSON.parse(res.token) : null;
			const session = res.authorize_session
				? JSON.parse(res.authorize_session)
				: null;
			return {
				installation,
				token,
				session,
			};
		} catch (error) {
			const err = new Error(`Failed to get authorize session: ${error}`);
			this.logger.error(err);
			throw err;
		}
	}
}
