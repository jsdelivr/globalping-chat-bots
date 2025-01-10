import { KnexClient, Tables } from '@globalping/bot-utils';

export const up = async (knex: KnexClient) => {
	console.log('Adding token and authorize_session columns to installations table');

	await knex.schema.table(Tables.Installations, (table) => {
		table.json('token');
		table.json('authorize_session');
	});
};

export const down = async (knex: KnexClient) => {
	console.log('Dropping token and authorize_session columns from installations table');

	await knex.schema.table(Tables.Installations, (table) => {
		table.dropColumn('token');
		table.dropColumn('authorize_session');
	});
};
