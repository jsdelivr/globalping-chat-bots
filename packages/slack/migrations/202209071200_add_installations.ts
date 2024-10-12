import { Knex } from 'knex';

import { Tables } from '../src/db';

export const up = async (knex: Knex) => {
	if (!(await knex.schema.hasTable(Tables.Installations))) {
		console.log('Creating installations table');
		await knex.schema.createTable(Tables.Installations, (table) => {
			table.string('id').primary();
			table.json('installation');
		});
	}
};

export const down = async (knex: Knex) => {
	if (await knex.schema.hasTable(Tables.Installations)) {
		console.log('Dropping installations table');
		await knex.schema.dropTable(Tables.Installations);
	}
};
