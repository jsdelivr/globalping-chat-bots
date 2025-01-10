import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
	env: process.env.NODE_ENV || 'development',
	port: Number(process.env.PORT) || 3000,

	logLevel: process.env.LOG_LEVEL ?? 'info',

	serverHost: process.env.SERVER_HOST as string,

	dbHost: process.env.DB_HOST as string,
	dbPort: Number(process.env.DB_PORT),
	dbUser: process.env.DB_USER as string,
	dbPassword: process.env.DB_PASSWORD as string,
	dbDatabase: process.env.DB_DATABASE as string,

	apiUrl: 'https://api.globalping.io/v1',
	dashboardUrl: process.env.DASHBOARD_URL as string,
	authUrl: process.env.AUTH_URL as string,
	authClientId: process.env.AUTH_CLIENT_ID as string,
	authClientSecret: process.env.AUTH_CLIENT_SECRET as string,

	slackSigningSecret: process.env.SLACK_SIGNING_SECRET as string,
	slackClientId: process.env.SLACK_CLIENT_ID as string,
	slackClientSecret: process.env.SLACK_CLIENT_SECRET as string,
	slackStateSecret: process.env.SLACK_STATE_SECRET as string,
	slackSocketMode: !!process.env.SLACK_SOCKET_MODE,
	slackAppToken: process.env.SLACK_APP_TOKEN,

	githubPersonalAccessToken: process.env.GITHUB_PERSONAL_ACCESS_TOKEN as string,
	githubBotApiKey: process.env.GITHUB_BOT_API_KEY as string,
	githubBotHandle: process.env.GITHUB_BOT_HANDLE || 'globalping',

	globalpingToken: process.env.GLOBALPING_TOKEN as string,
};

export type Config = typeof config;
