import { knex as knexInstance, Knex } from 'knex';

export type KnexClient = Knex;

export const enum Tables {
	Installations = 'installations',
}

declare module 'knex/types/tables' {
	interface UserInstallation {
		id: string;
		installation: string | null;
		token: string | null;
		authorize_session: string | null;
		installation_token: string | null;
	}

	interface Tables {
		// This is same as specifying `knex<User>('users')`
		installations: UserInstallation;
	}
}

export function initKnexClient (
	config: {
		dbHost: string;
		dbPort: number;
		dbUser: string;
		dbPassword: string;
		dbDatabase: string;
	},
	migrationsDirPath: string,
): KnexClient {
	return knexInstance({
		client: 'mysql',
		connection: {
			host: config.dbHost,
			port: config.dbPort,
			user: config.dbUser,
			password: config.dbPassword,
			database: config.dbDatabase,
		},
		migrations: {
			directory: migrationsDirPath,
		},
	});
}
