import { AuthSubcommand } from './flags.js';

export const generalHelpTexts = {
	preamble: `Globalping is a platform that allows anyone to run networking commands such as ping, traceroute, dig and mtr on probes distributed all around the world.
The Globalping bot allows you to interact with the API in a simple and human-friendly way to debug networking issues like anycast routing and script automated tests and benchmarks.`,
	usage: (rootCommand: string) => `${rootCommand} [command]`,
	measurementCommands: `  dns           Resolve a DNS record similarly to dig
  http          Perform a HEAD or GET request to a host
  mtr           Run an MTR test, similar to traceroute
  ping          Run a ping test
  traceroute    Run a traceroute test`,
	additionalCommands: `  auth          Authenticate with the Globalping API
  limits        Show the current rate limits
  help          Help about any command`,
	flags: `  -F, --from string   Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "world"). (default "world")
  -h, --help          help for globalping
      --latency       Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int     Limit the number of probes to use (default 1)
      --share         Prints a link at the end the results, allowing to vizualize the results online (default false)

  Use "globalping [command] --help" for more information about a command.`,
};

export const dnsHelpTexts = {
	preamble: `Performs DNS lookups and displays the answers that are returned from the name server(s) that were queried.
The default nameserver depends on the probe and is defined by the user's local settings or DHCP.
This command provides 2 different ways to provide the dns resolver:
Using the --resolver argument. For example:
\`\`\`
dns jsdelivr.com from Berlin --resolver 1.1.1.1
\`\`\`
Using the dig format @resolver. For example:
\`\`\`
dns jsdelivr.com @1.1.1.1 from Berlin
\`\`\``,
	examples: `Resolve google.com from 2 probes in New York:
\`\`\`
dns google.com from New York --limit 2
\`\`\`
Resolve google.com using probes from previous measurement
\`\`\`
dns google.com from rvasVvKnj48cxNjC
\`\`\`
Resolve google.com from 2 probes from London or Belgium with trace enabled
\`\`\`
dns google.com from London,Belgium --limit 2 --trace
\`\`\`
Resolve google.com from a probe in Paris using the TCP protocol
\`\`\`
dns google.com from Paris --protocol tcp
\`\`\`
Resolve jsdelivr.com from a probe in Berlin using the type MX and the resolver 1.1.1.1
\`\`\`
dns jsdelivr.com from Berlin --type MX --resolver 1.1.1.1
\`\`\`
Resolve jsdelivr.com from a probe that is from the AWS network and is located in Montreal with latency output
\`\`\`
dns jsdelivr.com from aws+montreal --latency
\`\`\``,
	usage: (rootCommand: string) => `${rootCommand} dns [target] from [location] [flags]`,
	flags: `  -h, --help              Help for dns
      --port int          Send the query to a non-standard port on the server (default 53)
      --protocol string   Specifies the protocol to use for the DNS query (TCP or UDP) (default "udp")
      --resolver string   Resolver is the hostname or IP address of the name server to use (default empty)
      --trace             Toggle tracing of the delegation path from the root name servers (default false)
      --type string       Specifies the type of DNS query to perform (default "A")`,
	globalFlags: `  -F, --from string       Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "world"). (default "world")
      --latency           Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int         Limit the number of probes to use (default 1)
      --share             Prints a link at the end the results, allowing to vizualize the results online (default false)`,
};

export const httpHelpTexts = {
	preamble: `The http command sends an HTTP request to a host and can perform HEAD or GET operations. GET is limited to 10KB responses, everything above will be cut by the API. Detailed performance stats as available for every request.
The tool supports 2 formats for this command:
When the full url is supplied, the tool automatically parses the scheme, host, port, domain, path and query. For example:
\`\`\`
http https://www.jsdelivr.com:443/package/npm/test?nav=stats
\`\`\`
As an alternative that can be useful for scripting, the scheme, host, port, domain, path and query can be provided as separate command line flags. For example:
\`\`\`
http jsdelivr.com --host www.jsdelivr.com --protocol https --port 443 --path "/package/npm/test" --query "nav=stats"
\`\`\`
This command also provides 2 different ways to provide the dns resolver:
Using the --resolver argument. For example:
\`\`\`
http jsdelivr.com from Berlin --resolver 1.1.1.1
\`\`\`
Using the dig format @resolver. For example:
\`\`\`
http jsdelivr.com @1.1.1.1 from Berlin
\`\`\``,
	examples: `HTTP HEAD request to jsdelivr.com from 2 probes in New York (protocol, port and path are inferred from the URL)
\`\`\`
http https://www.jsdelivr.com:443/package/npm/test?nav=stats from New York --limit 2
\`\`\`
HTTP GET request to google.com from 2 probes from London or Belgium
\`\`\`
http google.com from London,Belgium --limit 2 --method get
\`\`\`
HTTP GET request to google.com using probes from previous measurement
\`\`\`
http google.com from rvasVvKnj48cxNjC --method get
\`\`\`
HTTP GET request to google.com from a probe in London. Returns the full output
\`\`\`
http google.com from London --method get --full
\`\`\`
HTTP HEAD request to jsdelivr.com from a probe that is from the AWS network and is located in Montreal using HTTP2. 2 http headers are added to the request.
\`\`\`
http jsdelivr.com from aws+montreal --protocol http2 --header "Accept-Encoding: br,gzip" -H "Accept-Language: *"
\`\`\`
HTTP HEAD request to jsdelivr.com from a probe that is located in Paris, using the /robots.txt path with "test=1" query string
\`\`\`
http jsdelivr.com from Paris --path /robots.txt --query "test=1"
\`\`\`
HTTP HEAD request to example.com from a probe that is located in Berlin, specifying a different host example.org in the request headers
\`\`\`
http example.com from Berlin --host example.org
\`\`\`
HTTP GET request google.com from a probe in ASN 123 with a dns resolver 1.1.1.1
\`\`\`
http google.com from 123 --resolver 1.1.1.1
\`\`\``,
	usage: (rootCommand: string) => `${rootCommand} http [target] from [location] [flags]`,
	flags: `      --full                 Full output. Uses an HTTP GET request, and outputs the status, headers and body to the output
  -H, --header string        Specifies a HTTP header to be added to the request, in the format "Key: Value". Multiple headers can be added by adding multiple flags
  -h, --help                 Help for http
      --host string          Specifies the Host header, which is going to be added to the request (default host defined in target)
      --method string        Specifies the HTTP method to use (HEAD or GET) (default "HEAD")
      --path string          A URL pathname (default "/")
      --port int             Specifies the port to use (default 80 for HTTP, 443 for HTTPS and HTTP2)
      --protocol string      Specifies the query protocol (HTTP, HTTPS, HTTP2) (default "HTTP")
      --query string         A query-string
      --resolver string      Specifies the resolver server used for DNS lookup (default is defined by the probe's network)`,
	globalFlags: `  -F, --from string          Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "world"). (default "world")
      --latency              Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int            Limit the number of probes to use (default 1)
      --share                Prints a link at the end the results, allowing to vizualize the results online (default false)`,
};

export const mtrHelpTexts = {
	preamble:
		'mtr combines the functionality of the traceroute and ping programs in a single network diagnostic tool.',
	examples: `MTR google.com from 2 probes in New York
\`\`\`
mtr google.com from New York --limit 2
\`\`\`
MTR google.com using probes from previous measurement
\`\`\`
mtr google.com from rvasVvKnj48cxNjC
\`\`\`
MTR 1.1.1.1 from 2 probes from USA or Belgium with 10 packets
\`\`\`
mtr 1.1.1.1 from USA,Belgium --limit 2 --packets 10
\`\`\`
MTR jsdelivr.com from a probe that is from the AWS network and is located in Montreal using the TCP protocol and port 453
\`\`\`
mtr jsdelivr.com from aws+montreal --protocol tcp --port 453
\`\`\``,
	usage: (rootCommand: string) => `${rootCommand} mtr [target] from [location] [flags]`,
	flags: `  -h, --help          Help for mtr
  --packets int       Specifies the number of packets to send to each hop (default 3)
  --port int          Specifies the port to use. Only applicable for TCP protocol (default 53)
  --protocol string   Specifies the protocol used (ICMP, TCP or UDP) (default "icmp")`,
	globalFlags: `  -F, --from string   Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "world"). (default "world")
      --latency       Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int     Limit the number of probes to use (default 1)
      --share         Prints a link at the end the results, allowing to vizualize the results online (default false)`,
};

export const pingHelpTexts = {
	preamble:
		'The ping command allows sending ping requests to a target. Often used to test the network latency and stability.',
	examples: `Ping google.com from 2 probes in New York
\`\`\`
ping google.com from New York --limit 2
\`\`\`
Ping google.com using probes from previous measurement
\`\`\`
ping google.com from rvasVvKnj48cxNjC
\`\`\`
Ping 1.1.1.1 from 2 probes from USA or Belgium with 10 packets
\`\`\`
ping 1.1.1.1 from USA,Belgium --limit 2 --packets 10
\`\`\`
Ping jsdelivr.com from a probe that is from the AWS network and is located in Montreal with latency output
\`\`\`
ping jsdelivr.com from aws+montreal --latency
\`\`\``,
	usage: (rootCommand: string) => `${rootCommand} ping [target] from [location] [flags]`,
	flags: `  -h, --help          Help for ping
      --packets int   Specifies the desired amount of ECHO_REQUEST packets to be sent (default 3)`,
	globalFlags: `  -F, --from string   Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "world"). (default "world")
      --latency       Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int     Limit the number of probes to use (default 1)
      --share         Prints a link at the end the results, allowing to vizualize the results online (default false)`,
};

export const tracerouteHelpTexts = {
	preamble:
		'traceroute tracks the route packets take from an IP network on their way to a given host.',
	examples: `Traceroute google.com from 2 probes in New York
\`\`\`
traceroute google.com from New York --limit 2
\`\`\`
Traceroute google.com using probes from previous measurement
\`\`\`
traceroute google.com from rvasVvKnj48cxNjC
\`\`\`
Traceroute 1.1.1.1 from 2 probes from USA or Belgium
\`\`\`
traceroute 1.1.1.1 from USA,Belgium --limit 2
\`\`\`
Traceroute jsdelivr.com from a probe that is from the AWS network and is located in Montreal using the UDP protocol
\`\`\`
traceroute jsdelivr.com from aws+montreal --protocol udp
\`\`\`
Traceroute jsdelivr.com from a probe that is located in Paris to port 453
\`\`\`
traceroute jsdelivr.com from Paris --port 453
\`\`\``,
	usage: (rootCommand: string) => `${rootCommand} traceroute [target] from [location] [flags]`,
	flags: `  -h, --help              Help for traceroute
      --port int          Specifies the port to use for the traceroute. Only applicable for TCP protocol (default 80)
      --protocol string   Specifies the protocol used for tracerouting (ICMP, TCP or UDP) (default "icmp")`,
	globalFlags: `  -F, --from string       Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "world"). (default "world")
      --latency           Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int         Limit the number of probes to use (default 1)
      --share             Prints a link at the end the results, allowing to vizualize the results online (default false)`,
};

export const authHelpTexts = {
	preamble: `Authenticate with the Globalping API for higher measurements limits.

*Available Commands:*
\`\`\`
  login       Log in to your Globalping account
  logout      Log out from your Globalping account
  status      Check the current authentication status
\`\`\``,
	usage: (rootCommand: string) => `${rootCommand} auth [command]`,
	flags: '  -h, --help   Help for auth',
};

export const authLoginHelpTexts = {
	preamble: 'Log in to your Globalping account for higher measurements limits.',
	usage: (rootCommand: string) => `${rootCommand} auth login  [flags]`,
	flags: '  -h, --help         Help for login',
};

export const authStatusHelpTexts = {
	preamble: 'Check the current authentication status.',
	usage: (rootCommand: string) => `${rootCommand} auth status`,
	flags: '  -h, --help   Help for status',
};

export const authLogoutHelpTexts = {
	preamble: 'Log out from your Globalping account.',
	usage: (rootCommand: string) => `${rootCommand} auth logout`,
	flags: '  -h, --help   Help for logout',
};

export const limitsHelpTexts = {
	preamble: `Show the current rate limits.`,
	usage: (rootCommand: string) => `${rootCommand} limits`,
	flags: '  -h, --help   Help for limits',
};

export const helpCmd = (
	cmd: string,
	target: string,
	platform: string,
	githubHandle?: string,
): string => {
	let boldSeparator = '';
	let rootCommand = '';

	if (platform === 'github') {
		boldSeparator = '**';
		rootCommand = `@${githubHandle}`;
	} else {
		boldSeparator = '*';
		rootCommand = '/globalping';
	}

	switch (cmd) {
		case 'dns':
			return dnsHelp(boldSeparator, rootCommand);
		case 'http':
			return httpHelp(boldSeparator, rootCommand);
		case 'mtr':
			return mtrHelp(boldSeparator, rootCommand);
		case 'ping':
			return pingHelp(boldSeparator, rootCommand);
		case 'traceroute':
			return tracerouteHelp(boldSeparator, rootCommand);

		case 'auth':
			switch (target) {
				case AuthSubcommand.Login:
					return authLoginHelp(boldSeparator, rootCommand);
				case AuthSubcommand.Logout:
					return authLogoutHelp(boldSeparator, rootCommand);
				case AuthSubcommand.Status:
					return authStatusHelp(boldSeparator, rootCommand);
				default:
					return authHelp(boldSeparator, rootCommand);
			}

		case 'limits':
			return limitsHelp(boldSeparator, rootCommand);

		case undefined:
		case '':
		case 'help':
			if (!target) {
				return generalHelp(boldSeparator, rootCommand);
			}

			// handle case: /globalping help <subcommand>
			return helpCmd(target, target, platform);

		default:
			return `Unknown command! Please call \`${rootCommand} help\` for a list of commands.`;
	}
};

export function generalHelp (boldSeparator: string, rootCommand: string) {
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

export function dnsHelp (boldSeparator: string, rootCommand: string) {
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

export function httpHelp (boldSeparator: string, rootCommand: string) {
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

export function mtrHelp (boldSeparator: string, rootCommand: string) {
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

export function pingHelp (boldSeparator: string, rootCommand: string) {
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

export function tracerouteHelp (boldSeparator: string, rootCommand: string) {
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

export function authHelp (boldSeparator: string, rootCommand: string) {
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

export function authLoginHelp (boldSeparator: string, rootCommand: string) {
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

export function authStatusHelp (boldSeparator: string, rootCommand: string) {
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

export function authLogoutHelp (boldSeparator: string, rootCommand: string) {
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

export function limitsHelp (boldSeparator: string, rootCommand: string) {
	return `${limitsHelpTexts.preamble}

${boldSeparator}Usage:${boldSeparator}
\`\`\`
${limitsHelpTexts.usage(rootCommand)}
\`\`\`

${boldSeparator}Flags${boldSeparator}:
\`\`\`
${limitsHelpTexts.flags}
\`\`\``;
}
