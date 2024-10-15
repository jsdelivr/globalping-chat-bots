import { Octokit } from 'octokit';

import { config } from '../config';

let octokit: Octokit;

function initClient() {
	octokit = new Octokit({ auth: config.githubPersonalAccessToken });
}

export function getGithubClient(): Octokit {
	if (octokit === undefined) {
		initClient();
	}

	return octokit;
}
