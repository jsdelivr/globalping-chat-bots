import type { WebClient } from '@slack/web-api';

export type SlackClient = WebClient;

export type { CustomRoute } from '@slack/bolt';

export interface Config {
	env: string;
	logLevel: string;

	serverHost: string;

	dbHost: string;
	dbPort: number;
	dbUser: string;
	dbPassword: string;
	dbDatabase: string;

	apiUrl: string;
	dashboardUrl: string;
	authUrl: string;
	authClientId: string;
	authClientSecret: string;

	slackSigningSecret: string;
	slackClientId: string;
	slackClientSecret: string;
	slackStateSecret: string;
	slackSocketMode: boolean;
	slackAppToken: string | undefined;
}
