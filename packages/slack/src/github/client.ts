import { Octokit } from 'octokit';

import { config } from '../config.js';

let octokit: Octokit;

function initClient () {
	octokit = new Octokit({ auth: config.githubPersonalAccessToken });
}

export function getGithubClient (): Octokit {
	if (octokit === undefined) {
		initClient();
	}

	return octokit;
}
