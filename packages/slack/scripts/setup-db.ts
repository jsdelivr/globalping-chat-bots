import { knex } from '../src/db';

const createTables = async () => {
	try {
		await knex.schema.createTable('installations', (table) => {
			table.string('id').primary();
			table.json('installation');
		});
	} catch (error) {
		throw new Error(`Failed to create tables: ${error}`);
	}
};

(async () => {
	try {
		await createTables();
		console.log('Successfully created table "installations"');
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(0);
	} catch (error) {
		console.error(error);
		// eslint-disable-next-line unicorn/no-process-exit
		process.exit(1);
	}
})();
