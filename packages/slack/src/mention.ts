

export function parseCommandfromMention(text: string, botUserId: string): string {
    const trimmedText = text.trim();
    const expectedMention = `<@${botUserId}>`;
    if (trimmedText.startsWith(expectedMention)) {
        const urlRegex = /<([^>|]+)(?:\|[^>]+)?>/g;
        return trimmedText.slice(expectedMention.length).replace(urlRegex, '$1').trim();
    }

    return '';
}