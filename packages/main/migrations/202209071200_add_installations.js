import { Tables } from '@globalping/bot-utils';

export const up = async (knex) => {
	if (!await knex.schema.hasTable(Tables.Installations)) {
		console.log('Creating installations table');

		await knex.schema.createTable(Tables.Installations, (table) => {
			table.string('id').primary();
			table.json('installation');
		});
	}
};

export const down = async (knex) => {
	if (await knex.schema.hasTable(Tables.Installations)) {
		console.log('Dropping installations table');
		await knex.schema.dropTable(Tables.Installations);
	}
};
