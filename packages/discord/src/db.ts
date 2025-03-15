import { AuthToken, Logger, KnexClient, Tables } from '@globalping/bot-utils';

export interface AuthorizeSession {
	callbackVerifier: string;
	exchangeVerifier: string;
	userId: string;
	channelId: string;
}

export class DBClient {
	constructor (
		private knex: KnexClient,
		private logger: Logger,
	) {}

	async getToken (id: string) {
		try {
			const res = await this.knex
				.table(Tables.DiscordUsers)
				.select('token', 'anonymous_token')
				.where('id', id)
				.first();

			if (!res) {
				return null;
			}

			if (res.token) {
				return JSON.parse(res.token) as AuthToken;
			}

			if (res.anonymous_token) {
				return JSON.parse(res.anonymous_token) as AuthToken;
			}

			return null;
		} catch (error) {
			const err = new Error(`Failed to get token: ${error}`);
			this.logger.error(err.message, error);
			throw err;
		}
	}

	async updateToken (id: string, token: AuthToken | null) {
		try {
			// Note: The anonymous token is kept separately and not
			// deleted to make sure the rate limits are not exceeded
			// when the user signs in/out or the bot is re-installed.
			const update: {
				token?: string | null;
				anonymous_token?: string | null;
			} = {};

			if (token?.isAnonymous) {
				update.anonymous_token = JSON.stringify(token);
			} else {
				update.token = token ? JSON.stringify(token) : null;
			}

			await this.knex
				.table(Tables.DiscordUsers)
				.where('id', id)
				.update(update as never);

			this.logger.debug('Token set', { id });
		} catch (error) {
			const err = new Error(`Failed to set token: ${error}`);
			this.logger.error(err.message, error);
			throw err;
		}
	}

	async updateAuthorizeSession (
		id: string,
		authorizeSesssion: AuthorizeSession | null,
	) {
		try {
			await this.knex
				.table(Tables.DiscordUsers)
				.insert({
					id,
					authorize_session: authorizeSesssion
						? JSON.stringify(authorizeSesssion)
						: null,
				})
				.onConflict('id')
				.merge();
		} catch (error) {
			const err = new Error(`Failed to set authorize session: ${error}`);
			this.logger.error(err.message, error);
			throw err;
		}
	}

	async getDataForAuthorization (id: string) {
		try {
			const res = await this.knex
				.table(Tables.DiscordUsers)
				.select('token', 'authorize_session')
				.where('id', id)
				.first();

			if (!res) {
				return {
					token: null,
					session: null,
				};
			}

			// Note: When upgrading the MySQL version, the JSON.parse() call may not be needed
			const token = res.token ? JSON.parse(res.token) : null;
			const session = res.authorize_session
				? JSON.parse(res.authorize_session)
				: null;
			return {
				token,
				session,
			};
		} catch (error) {
			const err = new Error(`Failed to get authorize session: ${error}`);
			this.logger.error(err.message, error);
			throw err;
		}
	}
}
