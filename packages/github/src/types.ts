export interface GithubNotificationRequest {
	subject: string;
	bodyPlain: string;
}

export enum GithubTargetType {
	Issue = 'ISSUE',
	PullRequest = 'PULL_REQUEST',
}

export interface GithubTarget {
	type: GithubTargetType;
	owner: string;
	repo: string;
	id: number;
}

export interface Config {
	globalpingToken: string;
	githubPersonalAccessToken: string;
	githubBotApiKey: string;
	githubBotHandle: string;
}
