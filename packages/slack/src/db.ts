import { slackLogger as logger } from '@globalping/bot-utils';
import type { Installation, InstallationQuery } from '@slack/bolt';
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
		await knex.table('installations').insert({ id, installation }).onConflict('id').merge();
		logger.debug(`Installation set: ${id}`);
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
		logger.debug(`Installation retrieved: ${JSON.stringify(installation)}`);
		return JSON.parse(installation.installation as unknown as string);
	} catch (error) {
		throw new Error(`Failed to get installation: ${error}`);
	}
};

const deleteInstallation = async (id: string): Promise<void> => {
	try {
		await knex.table('installations').where('id', id).del();
		logger.debug(`Installation deleted: ${id}`);
	} catch (error) {
		throw new Error(`Failed to delete installation: ${error}`);
	}
};

const installationStore = {
	storeInstallation: (installation: InstallationStore) => {
		logger.debug(`Storing installation: ${JSON.stringify(installation)}`);
		try {
			// Bolt will pass your handler an installation object
			// Change the lines below so they save to your database
			if (installation.isEnterpriseInstall && installation.enterprise !== undefined) {
				// handle storing org-wide app installation
				return setInstallation(installation.enterprise.id, installation);
			}
			if (installation.team !== undefined) {
				// single team app installation
				return setInstallation(installation.team.id, installation);
			}
			throw new Error('Failed saving installation to installationStore (no team or enterprise id)');
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
			if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
				// handle org wide app installation lookup
				return await getInstallation(installQuery.enterpriseId);
			}
			if (installQuery.teamId !== undefined) {
				// single team app installation lookup
				return await getInstallation(installQuery.teamId);
			}
			throw new Error('Failed fetching installation (no teamId or enterpriseId)');
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
			if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
				// org wide app installation deletion
				return await deleteInstallation(installQuery.enterpriseId);
			}
			if (installQuery.teamId !== undefined) {
				// single team app installation deletion
				return await deleteInstallation(installQuery.teamId);
			}
			throw new Error('Failed to delete installation (no teamId or enterpriseId)');
		} catch (error) {
			logger.error(error);
			throw error;
		}
	},
};


export { checkTables, deleteInstallation, getInstallation, installationStore, knex, setInstallation };
