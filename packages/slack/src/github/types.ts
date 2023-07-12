export interface GithubNotificationRequest {
    subject: string
    bodyPlain: string
}

export enum GithubTargetType {
    Issue = 'ISSUE',
    PullRequest = 'PULL_REQUEST',
}

export interface GithubTarget {
    type: GithubTargetType
    owner: string
    repo: string
    id: Number
}