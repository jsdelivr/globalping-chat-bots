import { Knex } from 'knex';
import { Tables } from '../src/db';

exports.up = async (knex: Knex) => {
	if (!(await knex.schema.hasTable(Tables.Installations))) {
		console.log('Creating installations table');
		await knex.schema.createTable(Tables.Installations, (table) => {
			table.string('id').primary();
			table.json('installation');
		});
	}
};

exports.down = async (knex: Knex) => {
	if (await knex.schema.hasTable(Tables.Installations)) {
		console.log('Dropping installations table');
		await knex.schema.dropTable(Tables.Installations);
	}
};
