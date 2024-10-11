import {
	authHelpTexts,
	authLoginHelpTexts,
	authLogoutHelpTexts,
	authStatusHelpTexts,
	dnsHelpTexts,
	generalHelpTexts,
	httpHelpTexts,
	mtrHelpTexts,
	pingHelpTexts,
	tracerouteHelpTexts,
} from '@globalping/bot-utils/src/utils';

export function generalHelp(boldSeparator: string, rootCommand: string) {
	return `${generalHelpTexts.preamble}

${boldSeparator}Usage:${boldSeparator}
\`\`\`
${generalHelpTexts.usage(rootCommand)}
\`\`\`

${boldSeparator}Measurement Commands${boldSeparator}:
\`\`\`
${generalHelpTexts.measurementCommands}
\`\`\`

${boldSeparator}Additional Commands${boldSeparator}:
\`\`\`
${generalHelpTexts.additionalCommands}
\`\`\`

${boldSeparator}Flags${boldSeparator}:
\`\`\`
${generalHelpTexts.flags}
\`\`\``;
}

export function dnsHelp(boldSeparator: string, rootCommand: string) {
	return `${dnsHelpTexts.preamble}

${boldSeparator}Examples:${boldSeparator}
${dnsHelpTexts.examples}

${boldSeparator}Usage:${boldSeparator}
\`\`\`
${dnsHelpTexts.usage(rootCommand)}
\`\`\`

${boldSeparator}Flags${boldSeparator}:
\`\`\`
${dnsHelpTexts.flags}
\`\`\`

${boldSeparator}Global Flags${boldSeparator}:
\`\`\`
${dnsHelpTexts.globalFlags}
\`\`\``;
}

export function httpHelp(boldSeparator: string, rootCommand: string) {
	return `${httpHelpTexts.preamble}

${boldSeparator}Examples:${boldSeparator}
${httpHelpTexts.examples}

${boldSeparator}Usage:${boldSeparator}
\`\`\`
${httpHelpTexts.usage(rootCommand)}
\`\`\`

${boldSeparator}Flags${boldSeparator}:
\`\`\`
${httpHelpTexts.flags}
\`\`\`

${boldSeparator}Global Flags${boldSeparator}:
\`\`\`
${httpHelpTexts.globalFlags}
\`\`\``;
}

export function mtrHelp(boldSeparator: string, rootCommand: string) {
	return `${mtrHelpTexts.preamble}

${boldSeparator}Examples:${boldSeparator}
${mtrHelpTexts.examples}

${boldSeparator}Usage:${boldSeparator}
\`\`\`
${mtrHelpTexts.usage(rootCommand)}
\`\`\`

${boldSeparator}Flags${boldSeparator}:
\`\`\`
${mtrHelpTexts.flags}
\`\`\`

${boldSeparator}Global Flags${boldSeparator}:
\`\`\`
${mtrHelpTexts.globalFlags}
\`\`\``;
}

export function pingHelp(boldSeparator: string, rootCommand: string) {
	return `${pingHelpTexts.preamble}

${boldSeparator}Examples:${boldSeparator}
${pingHelpTexts.examples}

${boldSeparator}Usage:${boldSeparator}
\`\`\`
${pingHelpTexts.usage(rootCommand)}
\`\`\`

${boldSeparator}Flags${boldSeparator}:
\`\`\`
${pingHelpTexts.flags}
\`\`\`

${boldSeparator}Global Flags${boldSeparator}:
\`\`\`
${pingHelpTexts.globalFlags}
\`\`\``;
}

export function tracerouteHelp(boldSeparator: string, rootCommand: string) {
	return `${tracerouteHelpTexts.preamble}

${boldSeparator}Examples:${boldSeparator}
${tracerouteHelpTexts.examples}

${boldSeparator}Usage:${boldSeparator}
\`\`\`
${tracerouteHelpTexts.usage(rootCommand)}
\`\`\`

${boldSeparator}Flags${boldSeparator}:
\`\`\`
${tracerouteHelpTexts.flags}
\`\`\`

${boldSeparator}Global Flags${boldSeparator}:
\`\`\`
${tracerouteHelpTexts.globalFlags}
\`\`\``;
}

export function authHelp(boldSeparator: string, rootCommand: string) {
	return `${authHelpTexts.preamble}

${boldSeparator}Usage:${boldSeparator}
\`\`\`
${authHelpTexts.usage(rootCommand)}
\`\`\`

${boldSeparator}Flags${boldSeparator}:
\`\`\`
${authHelpTexts.flags}
\`\`\``;
}

export function authLoginHelp(boldSeparator: string, rootCommand: string) {
	return `${authLoginHelpTexts.preamble}

${boldSeparator}Usage:${boldSeparator}
\`\`\`
${authLoginHelpTexts.usage(rootCommand)}
\`\`\`

${boldSeparator}Flags${boldSeparator}:
\`\`\`
${authLoginHelpTexts.flags}
\`\`\``;
}

export function authStatusHelp(boldSeparator: string, rootCommand: string) {
	return `${authStatusHelpTexts.preamble}

${boldSeparator}Usage:${boldSeparator}
\`\`\`
${authStatusHelpTexts.usage(rootCommand)}
\`\`\`

${boldSeparator}Flags${boldSeparator}:
\`\`\`
${authStatusHelpTexts.flags}
\`\`\``;
}

export function authLogoutHelp(boldSeparator: string, rootCommand: string) {
	return `${authLogoutHelpTexts.preamble}

${boldSeparator}Usage:${boldSeparator}
\`\`\`
${authLogoutHelpTexts.usage(rootCommand)}
\`\`\`

${boldSeparator}Flags${boldSeparator}:
\`\`\`
${authLogoutHelpTexts.flags}
\`\`\``;
}
