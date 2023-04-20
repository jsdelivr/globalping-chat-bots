import { dnsHelpTexts, generalHelpTexts, httpHelpTexts, mtrHelpTexts, pingHelpTexts, tracerouteHelpTexts } from '@globalping/bot-utils/src/utils';


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


export function mtrHelp() {
    return `${mtrHelpTexts.preamble}

*Examples:*
${mtrHelpTexts.examples}

*Usage:*
\`\`\`${mtrHelpTexts.usage}\`\`\`

*Flags*:
\`\`\`${mtrHelpTexts.flags}\`\`\`

*Global Flags*:
\`\`\`${mtrHelpTexts.globalFlags}\`\`\``;;
}

export function pingHelp() {
    return `${pingHelpTexts.preamble}

*Examples:*
${pingHelpTexts.examples}

*Usage:*
\`\`\`${pingHelpTexts.usage}\`\`\`

*Flags*:
\`\`\`${pingHelpTexts.flags}\`\`\`

*Global Flags*:
\`\`\`${pingHelpTexts.globalFlags}\`\`\``;;
}

export function tracerouteHelp() {
    return `${tracerouteHelpTexts.preamble}

*Examples:*
${tracerouteHelpTexts.examples}

*Usage:*
\`\`\`${tracerouteHelpTexts.usage}\`\`\`

*Flags*:
\`\`\`${tracerouteHelpTexts.flags}\`\`\`

*Global Flags*:
\`\`\`${tracerouteHelpTexts.globalFlags}\`\`\``;;
}