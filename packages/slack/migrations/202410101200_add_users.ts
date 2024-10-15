import { Knex } from 'knex';

import { Tables } from '../src/db';

export const up = async (knex: Knex) => {
	if (!(await knex.schema.hasTable(Tables.Users))) {
		console.log('Creating users table');
		await knex.schema.createTable(Tables.Users, (table) => {
			table.string('id').primary();
			table.json('authorize_session');
			table.json('token');
		});
	}
};

export const down = async (knex: Knex) => {
	if (await knex.schema.hasTable(Tables.Users)) {
		console.log('Dropping users table');
		await knex.schema.dropTable(Tables.Users);
	}
};
