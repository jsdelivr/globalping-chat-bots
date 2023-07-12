import { argsToFlags } from "@globalping/bot-utils";
import { GithubTarget, GithubTargetType } from "./types";
import { getGithubClient } from "./client";
import { Octokit } from "octokit";
import { helpCmd } from "../utils";


export const processCommand = async (githubTarget: GithubTarget, cmdText: string) => {
    let githubClient = getGithubClient();

    const flags = argsToFlags(cmdText);

    if (!flags.cmd || flags.help) {
        ghClient.rest.issues.createComment({
            owner: "abc",
            repo: "abv",
            issue_number: 132,
            body: "testing"
        });
        const text = helpCmd(flags.cmd, flags.target);
        await postComment(githubClient, githubTarget, text);
    }
};

async function postComment(githubClient: Octokit, githubTarget: GithubTarget, body: string) {
    await githubClient.rest.issues.createComment({
        owner: githubTarget.owner,
        repo: githubTarget.repo,
        issue_number: 132,
        body: body
    });
}