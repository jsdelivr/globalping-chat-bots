import { AuthToken, KnexClient, Tables } from '@globalping/bot-utils';

export const up = async (knex: KnexClient) => {
	console.log('Adding installation_token columns to installations table');

	await knex.schema.table(Tables.Installations, (table) => {
		table.json('installation_token');
	});

	const rows = await knex(Tables.Installations).select('id', 'token');

	for (const row of rows) {
		const token = row.token
			? (JSON.parse(row.token as unknown as string) as AuthToken)
			: null;

		if (token?.isAnonymous) {
			const update: {
				token?: string | null;
				installation_token?: string | null;
			} = {};
			update.token = null;
			update.installation_token = JSON.stringify(token);

			await knex
				.table(Tables.Installations)
				.where('id', row.id)
				.update(update as never);
		}
	}
};

export const down = async (knex: KnexClient) => {
	console.log('Dropping installation_token columns from installations table');

	await knex.schema.table(Tables.Installations, (table) => {
		table.dropColumn('installation_token');
	});
};
