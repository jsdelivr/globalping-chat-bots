

export function githubHandle(): string {
    return process.env.GITHUB_BOT_HANDLE || 'globalping';
}
