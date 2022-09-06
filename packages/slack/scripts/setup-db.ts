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

createTables().then(() => console.log('Successfully created table "installations"\nCTRL+C to exit')).catch((error) => console.error(`${error}\nCTRL+C to exit`));
