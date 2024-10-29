import { Knex } from 'knex';

import { Tables } from '../src/db.js';

export const up = async (knex: Knex) => {
	console.log('Adding installation_token columns to installations table');

	await knex.schema.table(Tables.Installations, (table) => {
		table.json('installation_token');
	});
};

export const down = async (knex: Knex) => {
	console.log('Dropping installation_token columns from installations table');

	await knex.schema.table(Tables.Installations, (table) => {
		table.dropColumn('installation_token');
	});
};
