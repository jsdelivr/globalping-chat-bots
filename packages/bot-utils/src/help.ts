import { codeBlock } from './response.js';

export type HelpFlag = {
	name: string;
	short?: string;
	type?: string;
	shortDescription: string;
	description: string;
};

export const otherFlags: HelpFlag[] = [
	{
		name: 'target',
		shortDescription: 'Target host to be tested',
		description: 'Target host to be tested',
	},
];
export const otherFlagsMap = new Map<string, HelpFlag>(otherFlags.map(flag => [ flag.name, flag ]));

export const globalFlags: HelpFlag[] = [
	{
		name: 'from',
		short: 'F',
		type: 'string',
		shortDescription:
			'Comma-separated list of location values to match against or measurement ID (default "World")',
		description:
			'Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "World")',
	},
	{
		name: 'latency',
		shortDescription: 'Output only the stats of a measurement (default false)',
		description:
			'Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands',
	},
	{
		name: 'limit',
		type: 'int',
		short: 'L',
		shortDescription: 'Limit the number of probes to use (default 1)',
		description: 'Limit the number of probes to use (default 1)',
	},
	{
		name: 'share',
		shortDescription:
			'Prints a link at the end the results, allowing to visualize the results online (default false)',
		description:
			'Prints a link at the end the results, allowing to visualize the results online (default false)',
	},
];
export const globalFlagsMap = new Map<string, HelpFlag>(globalFlags.map(flag => [ flag.name, flag ]));

export const dnsHelpTexts = {
	name: 'dns',
	shortDescription: 'Resolve a DNS record similarly to dig',
	preamble: `Performs DNS lookups and displays the answers that are returned from the name server(s) that were queried. The default nameserver depends on the probe and is defined by the user's local settings or DHCP.`,
	examples: [
		{
			description: 'Resolve google.com from 2 probes in New York',
			command: 'dns google.com from New York --limit 2',
		},
		{
			description: 'Resolve google.com using probes from previous measurement',
			command: 'dns google.com from rvasVvKnj48cxNjC',
		},
		{
			description:
				'Resolve google.com from 2 probes from London or Belgium with trace enabled',
			command: 'dns google.com from London,Belgium --limit 2 --trace',
		},
		{
			description:
				'Resolve google.com from a probe in Paris using the TCP protocol',
			command: 'dns google.com from Paris --protocol tcp',
		},
		{
			description:
				'Resolve jsdelivr.com from a probe in Berlin using the type MX and the resolver 1.1.1.1',
			command: 'dns jsdelivr.com from Berlin --type MX --resolver 1.1.1.1',
		},
		{
			description:
				'Resolve jsdelivr.com from a probe that is from the AWS network and is located in Montreal with latency output',
			command: 'dns jsdelivr.com from aws+montreal --latency',
		},
	],
	usage: (rootCommand: string) => `${rootCommand} dns [target] from [location] [flags]`,
	flags: [
		{
			name: 'help',
			short: 'h',
			shortDescription: 'Help for dns',
			description: 'Help for dns',
		},
		{
			name: 'port',
			type: 'int',
			shortDescription: 'Send the query to a non-standard port on the server (default 53)',
			description:
				'Send the query to a non-standard port on the server (default 53)',
		},
		{
			name: 'protocol',
			type: 'string',
			shortDescription:
				'Specifies the protocol to use for the DNS query (TCP or UDP) (default "UDP")',
			description:
				'Specifies the protocol to use for the DNS query (TCP or UDP) (default "UDP")',
		},
		{
			name: 'resolver',
			type: 'string',
			shortDescription:
				'Resolver is the hostname or IP address of the name server to use (default empty)',
			description:
				'Resolver is the hostname or IP address of the name server to use (default empty)',
		},
		{
			name: 'trace',
			shortDescription:
				'Toggle tracing of the delegation path from the root name servers (default false)',
			description:
				'Toggle tracing of the delegation path from the root name servers (default false)',
		},
		{
			name: 'type',
			type: 'string',
			shortDescription:
				'Specifies the type of DNS query to perform (default "A")',
			description: 'Specifies the type of DNS query to perform (default "A")',
		},
	] as HelpFlag[],
};
export const dnsFlagsMap = new Map<string, HelpFlag>(dnsHelpTexts.flags.map(flag => [ flag.name, flag ]));
export const httpHelpTexts = {
	name: 'http',
	shortDescription: 'Perform a HEAD, GET, or OPTIONS request to a host',
	preamble: `The http command sends an HTTP request to a host and can perform HEAD, GET, or OPTIONS operations. GET is limited to 10KB responses, everything above will be cut by the API.`,
	examples: [
		{
			description:
				'HTTP HEAD request to jsdelivr.com from 2 probes in New York',
			command:
				'http https://www.jsdelivr.com:443/package/npm/test?nav=stats from New York --limit 2',
		},
		{
			description:
				'HTTP GET request to google.com from 2 probes from London or Belgium',
			command: 'http google.com from London,Belgium --limit 2 --method GET',
		},
		{
			description:
				'HTTP GET request to google.com using probes from previous measurement',
			command: 'http google.com from rvasVvKnj48cxNjC --method GET',
		},
		{
			description:
				'HTTP GET request to google.com from a probe in London. Returns the full output',
			command: 'http google.com from London --method GET --full',
		},
		{
			description:
				'HTTP HEAD request to jsdelivr.com from a probe that is from the AWS network and is located in Montreal using HTTP2, 2 http headers are added to the request',
			command:
				'http jsdelivr.com from aws+montreal --protocol http2 --header "Accept-Encoding: br,gzip" -H "Accept-Language: *"',
		},
		{
			description:
				'HTTP HEAD request to jsdelivr.com from a probe that is located in Paris, using the /robots.txt path with "test=1" query string',
			command:
				'http jsdelivr.com from Paris --path /robots.txt --query "test=1"',
		},
		{
			description:
				'HTTP HEAD request to example.com from a probe that is located in Berlin, specifying a different host example.org in the request headers',
			command: 'http example.com from Berlin --host example.org',
		},
		{
			description:
				'HTTP GET request google.com from a probe in ASN 123 with a dns resolver 1.1.1.1',
			command: 'http google.com from 123 --resolver 1.1.1.1',
		},
	],
	usage: (rootCommand: string) => `${rootCommand} http [target] from [location] [flags]`,
	flags: [
		{
			name: 'help',
			short: 'h',
			shortDescription: 'Help for http',
			description: 'Help for http',
		},
		{
			name: 'full',
			shortDescription:
				'Enable full output to display TLS details, HTTP status, headers, and body (if available)',
			description:
				'Enable full output to display TLS details, HTTP status, headers, and body (if available)',
		},
		{
			name: 'header',
			short: 'H',
			type: 'string',
			shortDescription:
				'Specifies a HTTP header to be added to the request, in the format "Key: Value"',
			description:
				'Specifies a HTTP header to be added to the request, in the format "Key: Value". Multiple headers can be added by adding multiple flags',
		},
		{
			name: 'host',
			type: 'string',
			shortDescription:
				'Specifies the Host header (default host defined in target)',
			description:
				'Specifies the Host header, which is going to be added to the request (default host defined in target)',
		},
		{
			name: 'method',
			type: 'string',
			shortDescription:
				'Specifies the HTTP method to use (HEAD, GET, or OPTIONS) (default "HEAD")',
			description:
				'Specifies the HTTP method to use (HEAD, GET, or OPTIONS) (default "HEAD")',
		},
		{
			name: 'path',
			type: 'string',
			shortDescription: 'A URL pathname (default "/")',
			description: 'A URL pathname (default "/")',
		},
		{
			name: 'port',
			type: 'int',
			shortDescription:
				'Specifies the port to use (default 80 for HTTP, 443 for HTTPS and HTTP2)',
			description:
				'Specifies the port to use (default 80 for HTTP, 443 for HTTPS and HTTP2)',
		},
		{
			name: 'protocol',
			type: 'string',
			shortDescription:
				'Specifies the query protocol (HTTP, HTTPS, HTTP2) (default "HTTPS")',
			description:
				'Specifies the query protocol (HTTP, HTTPS, HTTP2) (default "HTTPS")',
		},
		{
			name: 'query',
			type: 'string',
			shortDescription:
				'A URL query string (default empty)"',
			description: 'A query-string',
		},
		{
			name: 'resolver',
			type: 'string',
			shortDescription:
				'Specifies the resolver server used for DNS lookup (default is defined by the probe\'s network)',
			description:
				'Specifies the resolver server used for DNS lookup (default is defined by the probe\'s network)',
		},
	],
};
export const httpFlagsMap = new Map<string, HelpFlag>(httpHelpTexts.flags.map(flag => [ flag.name, flag ]));

export const mtrHelpTexts = {
	name: 'mtr',
	shortDescription: 'Run an MTR test, similar to traceroute',
	preamble:
		'mtr combines the functionality of the traceroute and ping programs in a single network diagnostic tool.',
	examples: [
		{
			description: 'MTR google.com from 2 probes in New York',
			command: 'mtr google.com from New York --limit 2',
		},
		{
			description: 'MTR google.com using probes from previous measurement',
			command: 'mtr google.com from rvasVvKnj48cxNjC',
		},
		{
			description:
				'MTR 1.1.1.1 from 2 probes from USA or Belgium with 10 packets',
			command: 'mtr 1.1.1.1 from USA,Belgium --limit 2 --packets 10',
		},
		{
			description:
				'MTR jsdelivr.com from a probe that is from the AWS network and is located in Montreal using the TCP protocol and port 453',
			command: 'mtr jsdelivr.com from aws+montreal --protocol tcp --port 453',
		},
	],
	usage: (rootCommand: string) => `${rootCommand} mtr [target] from [location] [flags]`,
	flags: [
		{
			name: 'help',
			short: 'h',
			shortDescription: 'Help for mtr',
			description: 'Help for mtr',
		},
		{
			name: 'packets',
			type: 'int',
			shortDescription:
				'Specifies the number of packets to send to each hop (default 3)',
			description:
				'Specifies the number of packets to send to each hop (default 3)',
		},
		{
			name: 'port',
			type: 'int',
			shortDescription:
				'Specifies the port to use. Only applicable for TCP protocol (default 53)',
			description:
				'Specifies the port to use. Only applicable for TCP protocol (default 53)',
		},
		{
			name: 'protocol',
			type: 'string',
			shortDescription:
				'Specifies the protocol used (ICMP, TCP or UDP) (default "ICMP")',
			description:
				'Specifies the protocol used (ICMP, TCP or UDP) (default "ICMP")',
		},
	],
};
export const mtrFlagsMap = new Map<string, HelpFlag>(mtrHelpTexts.flags.map(flag => [ flag.name, flag ]));

export const pingHelpTexts = {
	name: 'ping',
	shortDescription: 'Run a ping test',
	preamble:
		'The ping command allows sending ping requests to a target. Often used to test the network latency and stability.',
	examples: [
		{
			description: 'Ping google.com from 2 probes in New York',
			command: 'ping google.com from New York --limit 2',
		},
		{
			description: 'Ping google.com using probes from previous measurement',
			command: 'ping google.com from rvasVvKnj48cxNjC',
		},
		{
			description:
				'Ping 1.1.1.1 from 2 probes from USA or Belgium with 10 packets',
			command: 'ping 1.1.1.1 from USA,Belgium --limit 2 --packets 10',
		},
		{
			description:
				'Ping jsdelivr.com from a probe that is from the AWS network and is located in Montreal with latency output',
			command: 'ping jsdelivr.com from aws+montreal --latency',
		},
	],
	usage: (rootCommand: string) => `${rootCommand} ping [target] from [location] [flags]`,
	flags: [
		{
			name: 'help',
			short: 'h',
			shortDescription: 'Help for ping',
			description: 'Help for ping',
		},
		{
			name: 'packets',
			type: 'int',
			shortDescription:
				'Specifies the desired amount of ECHO_REQUEST packets to be sent (default 3)',
			description:
				'Specifies the desired amount of ECHO_REQUEST packets to be sent (default 3)',
		},
	],
};
export const pingFlagsMap = new Map<string, HelpFlag>(pingHelpTexts.flags.map(flag => [ flag.name, flag ]));

export const tracerouteHelpTexts = {
	name: 'traceroute',
	shortDescription: 'Run a traceroute test',
	preamble:
		'traceroute tracks the route packets take from an IP network on their way to a given host.',
	examples: [
		{
			description: 'Traceroute google.com from 2 probes in New York',
			command: 'traceroute google.com from New York --limit 2',
		},
		{
			description:
				'Traceroute google.com using probes from previous measurement',
			command: 'traceroute google.com from rvasVvKnj48cxNjC',
		},
		{
			description: 'Traceroute 1.1.1.1 from 2 probes from USA or Belgium',
			command: 'traceroute 1.1.1.1 from USA,Belgium --limit 2',
		},
		{
			description:
				'Traceroute jsdelivr.com from a probe that is from the AWS network and is located in Montreal using the UDP protocol',
			command: 'traceroute jsdelivr.com from aws+montreal --protocol udp',
		},
		{
			description:
				'Traceroute jsdelivr.com from a probe that is located in Paris to port 453',
			command: 'traceroute jsdelivr.com from Paris --port 453',
		},
	],
	usage: (rootCommand: string) => `${rootCommand} traceroute [target] from [location] [flags]`,
	flags: [
		{
			name: 'help',
			short: 'h',
			shortDescription: 'Help for traceroute',
			description: 'Help for traceroute',
		},
		{
			name: 'port',
			type: 'int',
			shortDescription:
				'Specifies the port to use for the traceroute (default 53)',
			description:
				'Specifies the port to use for the traceroute. Only applicable for TCP protocol (default 80)',
		},
		{
			name: 'protocol',
			type: 'string',
			shortDescription:
				'Specifies the protocol used for tracerouting (ICMP, TCP or UDP) (default "ICMP")',
			description:
				'Specifies the protocol used for tracerouting (ICMP, TCP or UDP) (default "ICMP")',
		},
	],
};
export const tracerouteFlagsMap = new Map<string, HelpFlag>(tracerouteHelpTexts.flags.map(flag => [ flag.name, flag ]));
export const authLoginHelpTexts = {
	name: 'login',
	shortDescription: 'Log in to your Globalping account',
	preamble: 'Log in to your Globalping account for higher measurements limits.',
	usage: (rootCommand: string) => `${rootCommand} auth login  [flags]`,
	flags: [
		{
			name: 'help',
			short: 'h',
			shortDescription: 'Help for login',
			description: 'Help for login',
		},
	],
};
export const authLoginHelpTextsMap = new Map<string, HelpFlag>(authLoginHelpTexts.flags.map(flag => [ flag.name, flag ]));

export const authLogoutHelpTexts = {
	name: 'logout',
	shortDescription: 'Log out from your Globalping account',
	preamble: 'Log out from your Globalping account.',
	usage: (rootCommand: string) => `${rootCommand} auth logout`,
	flags: [
		{
			name: 'help',
			short: 'h',
			shortDescription: 'Help for logout',
			description: 'Help for logout',
		},
	],
};
export const authLogoutHelpTextsMap = new Map<string, HelpFlag>(authLogoutHelpTexts.flags.map(flag => [ flag.name, flag ]));

export const authStatusHelpTexts = {
	name: 'status',
	shortDescription: 'Check the current authentication status',
	preamble: 'Check the current authentication status.',
	usage: (rootCommand: string) => `${rootCommand} auth status`,
	flags: [
		{
			name: 'help',
			short: 'h',
			shortDescription: 'Help for status',
			description: 'Help for status',
		},
	],
};
export const authStatusHelpTextsMap = new Map<string, HelpFlag>(authStatusHelpTexts.flags.map(flag => [ flag.name, flag ]));

export const authHelpTexts = {
	name: 'auth',
	shortDescription: 'Authenticate with the Globalping API',
	preamble: `Authenticate with the Globalping API for higher measurements limits.`,
	commands: [ authLoginHelpTexts, authLogoutHelpTexts, authStatusHelpTexts ],
	usage: (rootCommand: string) => `${rootCommand} auth [command]`,
	flags: [
		{
			name: 'help',
			short: 'h',
			shortDescription: 'Help for auth',
			description: 'Help for auth',
		},
	],
};
export const authHelpTextsMap = new Map<string, HelpFlag>(authHelpTexts.flags.map(flag => [ flag.name, flag ]));

export const limitsHelpTexts = {
	name: 'limits',
	shortDescription: 'Show the current rate limits',
	preamble: `Show the current rate limits.`,
	usage: (rootCommand: string) => `${rootCommand} limits`,
	flags: [
		{
			name: 'help',
			short: 'h',
			shortDescription: 'Help for limits',
			description: 'Help for limits',
		},
	],
};
export const limitsHelpTextsMap = new Map<string, HelpFlag>(limitsHelpTexts.flags.map(flag => [ flag.name, flag ]));

export const helpHelpTexts = {
	name: 'help',
	shortDescription: 'Help about any command',
	flags: [],
};

export const generalHelpTexts = {
	preamble: `Globalping is a platform that allows anyone to run networking commands such as ping, traceroute, dig and mtr on probes distributed all around the world.
The Globalping bot allows you to interact with the API in a simple and human-friendly way to debug networking issues like anycast routing and script automated tests and benchmarks.`,
	usage: (rootCommand: string) => `${rootCommand} [command]`,
	commands: [
		dnsHelpTexts,
		httpHelpTexts,
		mtrHelpTexts,
		pingHelpTexts,
		tracerouteHelpTexts,
	],
	additionalCommands: [ authHelpTexts, limitsHelpTexts, helpHelpTexts ],
	flags: [
		{
			name: 'help',
			short: 'h',
			shortDescription: 'Help for globalping',
			description: 'Help for globalping',
		},
		...globalFlags,
	],
};

function generateFlagsText (flags: HelpFlag[]): string {
	const leftCol = [];
	let shortMax = 0;
	let nameAndTypeMax = 0;

	for (const flag of flags) {
		if (flag.short) {
			shortMax = Math.max(shortMax, flag.short.length);
		}

		let t = `--${flag.name}`;

		if (flag.type) {
			t += ` ${flag.type}`;
		}

		nameAndTypeMax = Math.max(nameAndTypeMax, t.length);

		leftCol.push(t);
	}

	nameAndTypeMax += 4;

	let text = '';

	for (let i = 0; i < leftCol.length; i++) {
		if (flags[i].short) {
			text += `  -${flags[i].short}, `;
		} else if (shortMax) {
			text += ' '.repeat(shortMax + 5);
		}

		text
			+= leftCol[i]
			+ ' '.repeat(nameAndTypeMax - leftCol[i].length)
			+ flags[i].description
			+ (i < leftCol.length - 1 ? '\n' : '');
	}

	return text;
}

function generateExamplesText (
	examples: { description: string; command: string }[],
	limit: number = 0,
) {
	let text = '';

	for (let i = 0; i < examples.length; i++) {
		if (limit && i >= limit) {
			break;
		}

		text += `${examples[i].description}\n${codeBlock(examples[i].command)}\n`;
	}

	return text.trimEnd();
}

export function generateHelp (
	boldSeparator: string,
	rootCommand: string,
	ignoreCmds?: Set<string>,
	dnsExampleLimit: number = 0,
	httpExampleLimit: number = 0,
) {
	let maxCmdLength = generalHelpTexts.commands.reduce(
		(max, cmd) => Math.max(max, cmd.name.length),
		0,
	);
	generalHelpTexts.additionalCommands.reduce(
		(max, cmd) => Math.max(max, cmd.name.length),
		maxCmdLength,
	);

	maxCmdLength += 4;

	let maxAuthCmdLength = authHelpTexts.commands.reduce(
		(max, cmd) => Math.max(max, cmd.name.length),
		0,
	);
	maxAuthCmdLength += 4;

	return {
		general: `${generalHelpTexts.preamble}

${boldSeparator}Usage:${boldSeparator}
${codeBlock(generalHelpTexts.usage(rootCommand))}

${boldSeparator}Measurement Commands${boldSeparator}:
${codeBlock(generalHelpTexts.commands.reduce((s, cmd, i) => {
		if (ignoreCmds?.has(cmd.name)) {
			return s;
		}

		const spaces = ' '.repeat(maxCmdLength - cmd.name.length);
		return (
			s
				+ `  ${cmd.name}${spaces}${cmd.shortDescription}`
				+ (i < generalHelpTexts.commands.length - 1 ? '\n' : '')
		);
	}, ''))}

${boldSeparator}Additional Commands${boldSeparator}:
${codeBlock(generalHelpTexts.additionalCommands.reduce((s, cmd, i) => {
		if (ignoreCmds?.has(cmd.name)) {
			return s;
		}

		const spaces = ' '.repeat(maxCmdLength - cmd.name.length);
		return (
			s
				+ `  ${cmd.name}${spaces}${cmd.shortDescription}`
				+ (i < generalHelpTexts.additionalCommands.length - 1 ? '\n' : '')
		);
	}, ''))}

${boldSeparator}Flags${boldSeparator}:
${codeBlock(generateFlagsText(generalHelpTexts.flags))}

Use \`globalping [command] --help\` for more information about a command.
`,
		dns: `${dnsHelpTexts.preamble}

${boldSeparator}Examples:${boldSeparator}
${generateExamplesText(dnsHelpTexts.examples, dnsExampleLimit)}

${boldSeparator}Usage:${boldSeparator}
${codeBlock(dnsHelpTexts.usage(rootCommand))}

${boldSeparator}Flags${boldSeparator}:
${codeBlock(generateFlagsText(dnsHelpTexts.flags))}

${boldSeparator}Global Flags${boldSeparator}:
${codeBlock(generateFlagsText(globalFlags))}`,
		http: `${httpHelpTexts.preamble}

${boldSeparator}Examples:${boldSeparator}
${generateExamplesText(httpHelpTexts.examples, httpExampleLimit)}

${boldSeparator}Usage:${boldSeparator}
${codeBlock(httpHelpTexts.usage(rootCommand))}

${boldSeparator}Flags${boldSeparator}:
${codeBlock(generateFlagsText(httpHelpTexts.flags))}

${boldSeparator}Global Flags${boldSeparator}:
${codeBlock(generateFlagsText(globalFlags))}`,
		mtr: `${mtrHelpTexts.preamble}

${boldSeparator}Examples:${boldSeparator}
${generateExamplesText(mtrHelpTexts.examples)}

${boldSeparator}Usage:${boldSeparator}
${codeBlock(mtrHelpTexts.usage(rootCommand))}

${boldSeparator}Flags${boldSeparator}:
${codeBlock(generateFlagsText(mtrHelpTexts.flags))}

${boldSeparator}Global Flags${boldSeparator}:
${codeBlock(generateFlagsText(globalFlags))}`,

		ping: `${pingHelpTexts.preamble}

${boldSeparator}Examples:${boldSeparator}
${generateExamplesText(pingHelpTexts.examples)}

${boldSeparator}Usage:${boldSeparator}
${codeBlock(pingHelpTexts.usage(rootCommand))}

${boldSeparator}Flags${boldSeparator}:
${codeBlock(generateFlagsText(pingHelpTexts.flags))}

${boldSeparator}Global Flags${boldSeparator}:
${codeBlock(generateFlagsText(globalFlags))}`,
		traceroute: `${tracerouteHelpTexts.preamble}

${boldSeparator}Examples:${boldSeparator}
${generateExamplesText(tracerouteHelpTexts.examples)}

${boldSeparator}Usage:${boldSeparator}
${codeBlock(tracerouteHelpTexts.usage(rootCommand))}

${boldSeparator}Flags${boldSeparator}:
${codeBlock(generateFlagsText(tracerouteHelpTexts.flags))}

${boldSeparator}Global Flags${boldSeparator}:
${codeBlock(generateFlagsText(globalFlags))}`,
		auth: `${authHelpTexts.preamble}

${boldSeparator}Available Commands${boldSeparator}:
${codeBlock(authHelpTexts.commands.reduce((s, cmd, i) => {
		const spaces = ' '.repeat(maxAuthCmdLength - cmd.name.length);
		return (
			s
				+ `  ${cmd.name}${spaces}${cmd.shortDescription}`
				+ (i < authHelpTexts.commands.length - 1 ? '\n' : '')
		);
	}, ''))}

${boldSeparator}Usage:${boldSeparator}
${codeBlock(authHelpTexts.usage(rootCommand))}

${boldSeparator}Flags${boldSeparator}:
${codeBlock(generateFlagsText(authHelpTexts.flags))}`,
		auth_login: `${authLoginHelpTexts.preamble}

${boldSeparator}Usage:${boldSeparator}
${codeBlock(authLoginHelpTexts.usage(rootCommand))}

${boldSeparator}Flags${boldSeparator}:
${codeBlock(generateFlagsText(authLoginHelpTexts.flags))}`,
		auth_status: `${authStatusHelpTexts.preamble}

${boldSeparator}Usage:${boldSeparator}
${codeBlock(authStatusHelpTexts.usage(rootCommand))}

${boldSeparator}Flags${boldSeparator}:
${codeBlock(generateFlagsText(authStatusHelpTexts.flags))}`,
		auth_logout: `${authLogoutHelpTexts.preamble}

${boldSeparator}Usage:${boldSeparator}
${codeBlock(authLogoutHelpTexts.usage(rootCommand))}

${boldSeparator}Flags${boldSeparator}:
${codeBlock(generateFlagsText(authLogoutHelpTexts.flags))}`,
		limits: `${limitsHelpTexts.preamble}

${boldSeparator}Usage:${boldSeparator}
${codeBlock(limitsHelpTexts.usage(rootCommand))}

${boldSeparator}Flags${boldSeparator}:
${codeBlock(generateFlagsText(limitsHelpTexts.flags))}`,
		unknownCommand: `Unknown command! Please call \`${rootCommand} help\` for a list of commands.`,
	};
}

export type HelpTexts = ReturnType<typeof generateHelp>;
