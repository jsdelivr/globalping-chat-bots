import { client } from 'discord-bot/src/app';
import express from 'express';
import { knex } from 'slack-bot/src/db';

const app = express();

const router = express.Router({});
router.get('/', async (_req, res) => {
	try {
		// Check if db is accessible
		await knex.raw('select 1+1 as result');
		if (!client.ws.ping) {
			throw new Error('Discord bot down.');
		}

		res.send('OK');
	} catch (error) {
		res.status(503).send(error);
	}
});

app.use('/health', router);

const PORT = process.env.PORT || 4111;
client.login(process.env.DISCORD_TOKEN);
console.log('Health checkpoints ready');
app.listen(PORT);
