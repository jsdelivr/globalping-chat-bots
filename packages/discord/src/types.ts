export interface DeployCommandsConfig {
	discordToken: string;
	discordAppId: string;
}

export interface Config {
	serverHost: string;

	apiUrl: string;
	dashboardUrl: string;
	authUrl: string;
	authClientId: string;
	authClientSecret: string;
	authCallbackPath: string;
}
