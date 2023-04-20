import { dnsHelpTexts, generalHelpTexts,httpHelpTexts } from '@globalping/bot-utils/src/utils';


export function generalHelp() {
    return `${generalHelpTexts.preamble}

*Usage:*
\`\`\`${generalHelpTexts.usage}\`\`\`

*Measurement Commands*:
\`\`\`${generalHelpTexts.measurementCommands}\`\`\`

*Additional Commands*:
\`\`\`${generalHelpTexts.additionalCommands}\`\`\`

*Flags*:
\`\`\`${generalHelpTexts.flags}\`\`\``;
}

export function dnsHelp() {
    return `${dnsHelpTexts.preamble}

*Examples:*
${dnsHelpTexts.examples}

*Usage:*
\`\`\`${dnsHelpTexts.usage}\`\`\`

*Flags*:
\`\`\`${dnsHelpTexts.flags}\`\`\`

*Global Flags*:
\`\`\`${dnsHelpTexts.globalFlags}\`\`\``;;
}

export function httpHelp() {
    return `${httpHelpTexts.preamble}

*Examples:*
${httpHelpTexts.examples}

*Usage:*
\`\`\`${httpHelpTexts.usage}\`\`\`

*Flags*:
\`\`\`${httpHelpTexts.flags}\`\`\`

*Global Flags*:
\`\`\`${httpHelpTexts.globalFlags}\`\`\``;;
}