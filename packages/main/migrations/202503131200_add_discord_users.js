import { Tables } from "@globalping/bot-utils";

export const up = async (knex) => {
	if (!(await knex.schema.hasTable(Tables.DiscordUsers))) {
		console.log("Creating discord_users table");

		await knex.schema.createTable(Tables.DiscordUsers, (table) => {
			table.string("id").primary();
			table.json("token");
			table.json("authorize_session");
			table.json("anonymous_token");
		});
	}
};

export const down = async (knex) => {
	if (await knex.schema.hasTable(Tables.DiscordUsers)) {
		console.log("Dropping discord_users table");
		await knex.schema.dropTable(Tables.DiscordUsers);
	}
};
