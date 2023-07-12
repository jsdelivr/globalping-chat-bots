import { Octokit } from "octokit";

let octokit: Octokit;

function initClient() {
    octokit = new Octokit({ auth: process.env.GH_TOKEN });
}

export function getGithubClient(): Octokit {
    if (octokit === undefined) {
        initClient()
    }

    return octokit;
}




