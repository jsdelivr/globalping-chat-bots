import { Knex } from 'knex';

import { Tables } from '../src/db';

export const up = async (knex: Knex) => {
	console.log(
		'Adding token and authorize_session columns to installations table'
	);
	await knex.schema.table(Tables.Installations, (table) => {
		table.json('token');
		table.json('authorize_session');
	});
};

export const down = async (knex: Knex) => {
	console.log(
		'Dropping token and authorize_session columns from installations table'
	);
	await knex.schema.table(Tables.Installations, (table) => {
		table.dropColumn('token');
		table.dropColumn('authorize_session');
	});
};
