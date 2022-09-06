import type { Installation } from '@slack/bolt';
import * as dotenv from 'dotenv';
import { Knex, knex as knexInstance } from 'knex';

dotenv.config();

type AuthVersion = 'v1' | 'v2';
type InstallationStore = Installation<AuthVersion, boolean>;

declare module 'knex/types/tables' {
	interface UserInstallation {
		id: string;
		installation: InstallationStore;
	}

	interface Tables {
		// This is same as specifying `knex<User>('users')`
		installations: UserInstallation;
	}
}

const config: Knex.Config = {
	client: 'mysql',
	connection: {
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT),
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DATABASE
	}
};

// Query builder
const knex = knexInstance(config);

const checkTables = async (): Promise<boolean> => knex.schema.hasTable('installations');

const setInstallation = async (id: string, installation: InstallationStore): Promise<void> => {
	try {
		await knex.table('installations').insert({ id, installation });
	} catch (error) {
		throw new Error(`Failed to set installation: ${error}`);
	}
};

const getInstallation = async (id: string): Promise<InstallationStore> => {
	try {
		const installation = await knex.table('installations').where('id', id).first();
		if (!installation) {
			throw new Error(id);
		}
		return installation.installation;
	} catch (error) {
		throw new Error(`Failed to get installation: ${error}`);
	}
};

const deleteInstallation = async (id: string): Promise<void> => {
	try {
		await knex.table('installations').where('id', id).delete();
	} catch (error) {
		throw new Error(`Failed to delete installation: ${error}`);
	}
};


export { checkTables, deleteInstallation, getInstallation, knex, setInstallation };
