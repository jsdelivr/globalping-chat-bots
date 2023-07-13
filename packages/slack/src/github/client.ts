import { Octokit } from 'octokit';

let octokit: Octokit;

function initClient() {
    octokit = new Octokit({ auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN });
}

export function getGithubClient(): Octokit {
    if (octokit === undefined) {
        initClient();
    }

    return octokit;
}




