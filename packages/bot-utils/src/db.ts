import knex, { type Knex } from 'knex';

export type KnexClient = Knex;

export enum Tables {
	Installations = 'installations',
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
	return knex.knex({
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
