import { Response } from 'got';

export const throwArgError = (invalid: string | undefined, type: string, expected: string) => {
	throw new TypeError(`Invalid argument "${invalid}" for "${type}"!\nExpected "${expected}".`);
};

export const throwOptError = (invalid: string | undefined, type: string, expected: string) => {
	throw new TypeError(`Invalid option "${invalid}" for "${type}"!\nExpected "${expected}".`);
};
interface APIError {
	error: {
		message: string
		type: 'validation_error' | 'no_probes_found' | 'api_error'
		params?: {
			[key: string]: string
		}
	}
}

export class PostError extends Error {
	response: Response<unknown>;

	location: string;

	constructor(response: Response<unknown>, location: string, message = '') {
		super(message);
		this.message = message;
		this.response = response;
		this.location = location;
	}
}

export const formatAPIError = (error: unknown): string => {
	// @ts-ignore Discord error format
	if (error.code === 50_001)
		return 'Missing access! Please add the Globalping bot to this channel!';

	if (error instanceof PostError) {
		const { location, response } = error;
		const { body } = response;
		const errObj: APIError = JSON.parse(body as string) as APIError;
		if (errObj.error.type === 'validation_error')
			return `\`\`\`${errObj.error.message}\n${errObj.error.params ? Object.keys(errObj.error.params).map(key => `${errObj.error.params?.[key]}`).join('\n') : 'Unknown validation error.'}\`\`\`\nDocumentation and Support: https://github.com/jsdelivr/globalping`;

		if (errObj.error.type === 'no_probes_found') {
			return `\`\`\`${errObj.error.message} at location ${location}\`\`\`\nDocumentation and Support: https://github.com/jsdelivr/globalping`;
		}
		if (errObj.error.type === 'api_error') {
			return `\`\`\`${errObj.error.message}\`\`\`\nDocumentation and Support: https://github.com/jsdelivr/globalping`;
		}
	} else if (error instanceof Error || error instanceof TypeError) {
		return `\`\`\`${error.message}\`\`\`\nDocumentation and Support: https://github.com/jsdelivr/globalping`;
	}
	return `\`\`\`${error}\`\`\`\nDocumentation and Support: https://github.com/jsdelivr/globalping`;
};

interface Help {
	[key: string]: {
		preamble?: string
		usage: string
		args?: string
		options?: string
		examples?: string
		end?: string
		endDiscord?: string
	}
}

export const generalHelpTexts = {
	preamble: `Globalping is a platform that allows anyone to run networking commands such as ping, traceroute, dig and mtr on probes distributed all around the world.
The Globalping bot allows you to interact with the API in a simple and human-friendly way to debug networking issues like anycast routing and script automated tests and benchmarks.`,
	usage: '/globalping [command]',
	measurementCommands: `  dns           Resolve a DNS record similarly to dig
  http          Perform a HEAD or GET request to a host
  mtr           Run an MTR test, similar to traceroute
  ping          Run a ping test
  traceroute    Run a traceroute test`,
	additionalCommands: '  help          Help about any command',
	flags: `  -F, --from string   Comma-separated list of location values to match against. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "world"). (default "world")
  -h, --help          help for globalping
      --latency       Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int     Limit the number of probes to use (default 1)

  Use "globalping [command] --help" for more information about a command.`
};

export const dnsHelpTexts = {
	preamble: `Performs DNS lookups and displays the answers that are returned from the name server(s) that were queried.
The default nameserver depends on the probe and is defined by the user's local settings or DHCP.
This command provides 2 different ways to provide the dns resolver:
Using the --resolver argument. For example:\`\`\`dns jsdelivr.com from Berlin --resolver 1.1.1.1\`\`\`
Using the dig format @resolver. For example:\`\`\`dns jsdelivr.com @1.1.1.1 from Berlin\`\`\``,
	examples: `Resolve google.com from 2 probes in New York:\`\`\`dns google.com from New York --limit 2\`\`\`
Resolve google.com from 2 probes from London or Belgium with trace enabled
\`\`\`dns google.com from London,Belgium --limit 2 --trace\`\`\`
Resolve google.com from a probe in Paris using the TCP protocol
\`\`\`dns google.com from Paris --protocol tcp\`\`\`
Resolve jsdelivr.com from a probe in Berlin using the type MX and the resolver 1.1.1.1
\`\`\`dns jsdelivr.com from Berlin --type MX --resolver 1.1.1.1\`\`\`
Resolve jsdelivr.com from a probe that is from the AWS network and is located in Montreal with latency output
\`\`\`dns jsdelivr.com from aws+montreal --latency\`\`\``,
	usage: '/globalping dns [target] from [location] [flags]',
	flags: `  -h, --help              help for dns
      --port int          Send the query to a non-standard port on the server (default 53)
      --protocol string   Specifies the protocol to use for the DNS query (TCP or UDP) (default "udp")
      --resolver string   Resolver is the hostname or IP address of the name server to use (default empty)
      --trace             Toggle tracing of the delegation path from the root name servers (default false)
      --type string       Specifies the type of DNS query to perform (default "A")`,
	globalFlags: `  -F, --from string   Comma-separated list of location values to match against. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "world"). (default "world")
      --latency       Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int     Limit the number of probes to use (default 1)`,
};


export const help: Help = {
	'help': generalHelpTexts,
	'dns': dnsHelpTexts,

	'ping': {
		preamble: 'Ping is a simple ICMP echo request to a target endpoint.',
		usage: '/globalping ping <target> from <location> [options]',
		options: `--limit			  Number of probes - e.g. 1
--packets			Number of packets - e.g. 4
--latency		    Output only the stats of a measurement`,
		examples: `/globalping ping jsdelivr.com from united kingdom
/globalping ping 1.1.1.1 --limit 2
/globalping ping google.com from EU --limit 2 --packets 5`,
	},

	'traceroute': {
		preamble: 'Traceroute is a tool used to diagnose problems in a network path.',
		usage: '/globalping traceroute <target> from <location> [options]',
		options: `--limit			Number of probes - e.g. 1
--protocol		 Protocol to use - TCP | UDP | ICMP
--port 			Port to use - e.g. 33434`,
		examples: `/globalping traceroute jsdelivr.com from united kingdom
/globalping traceroute 1.1.1.1 --limit 2
/globalping traceroute google.com from EU --limit 2 --protocol tcp --port 33434`,
	},




	'mtr': {
		preamble: 'My Traceroute (MTR) is a tool that combines traceroute and ping, which is a common method for testing network connectivity and speed.',
		usage: '/globalping mtr <target> from <location> [options]',
		options: `--limit			Number of probes - e.g. 1
--protocol		 Protocol to use - TCP | UDP | ICMP
--port 			Port to use - e.g. 33434`,
		examples: `/globalping mtr jsdelivr.com from united kingdom
/globalping mtr 1.1.1.1 --limit 2
/globalping mtr google.com from new york --limit 2 --protocol tcp --port 33434`,
	},

	'http': {
		preamble: 'HTTP is a network protocol used to transfer data between a client and a server.',
		usage: '/globalping http <target> from <location> [options]',
		options: `--limit            Number of probes - e.g. 1
--latency          Output only the stats of a measurement
--protocol         Protocol to use - HTTP | HTTPS | HTTP2
--port             Port to use - e.g. 80
--method           HTTP method - HEAD | GET
--path             URL pathname - e.g. /
--query            Query string
--host             Hostname
--header           Headers to use e.g. "Content-Type: text/html; charset=UTF-8"`,
		examples: `/globalping http jsdelivr.com from united kingdom
/globalping http 1.1.1.1 --limit 2
/globalping http google.com from EU --limit 2 --protocol https --port 443 --method HEAD --path / --query a=1 --header Content-Type: text/html; charset=UTF-8 --header Accept-CH: Viewport-Width, Width`,
	}

};

