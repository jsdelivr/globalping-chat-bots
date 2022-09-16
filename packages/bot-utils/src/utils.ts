import { HTTPError } from 'got';

export const throwArgError = (invalid: string | undefined, type: string, expected: string) => {
	throw new TypeError(`Invalid argument "${invalid}" for "${type}"!\nExpected "${expected}".`);
};
interface APIError {
	error: {
		message: string
		type: 'invalid_request_error' | 'api_error'
		params?: {
			[key: string]: string
		}
	}
}

export const formatAPIError = (error: unknown): string => {
	if (error instanceof HTTPError) {
		const errObj: APIError = JSON.parse(error.response.body as string) as APIError;
		if (errObj.error.type === 'invalid_request_error')
			return `${error}\n\n${errObj.error.message}\n${errObj.error.params ? Object.keys(errObj.error.params).map(key => `${errObj.error.params?.[key]}`).join('\n') : 'Unknown validation error. Please make an issue to the Globalping repository.'}`;

		if (errObj.error.type === 'api_error')
			return `${error}\n\n${errObj.error.message}\n\nIf you think this is a bug, please make an issue at the Globalping repository reporting this.`;
	}
	return String(error);
};

interface Help {
	[key: string]: {
		preamble?: string
		usage: string
		args?: string
		options?: string
		examples?: string
		end?: string
	}
}

export const help: Help = {
	'help': {
		preamble: 'The Globalping bot is a simple interface to interact with the Globalping API and run global networking tests. Need a traceroute done from Japan? Or check the ping latency of an endpoint from Brazil? Just ask me!',
		usage: `globalping ping <target> from <location> [options]
globalping traceroute <target> from <location> [options]
globalping dns <target> from <location> [options]
globalping mtr <target> from<location> [options]
globalping http <target> from <location> [options]`,
		args: `<target>		A public endpoint, such as a hostname or IPv4 address - e.g. "jsdelivr.com"
<from>		  Magic Location - e.g. "ger", "aws", "google+belgium", "55286"

Location Schema: https://github.com/jsdelivr/globalping/blob/master/docs/measurement/schema/location.md`,
		end: `globalping ping --help
globalping traceroute --help
globalping dns --help
globalping mtr --help
globalping http --help

For more information, see the Globalping documentation: https://github.com/jsdelivr/globalping/tree/master/docs`
	},

	'ping': {
		preamble: 'Ping is a simple ICMP echo request to a target endpoint.',
		usage: 'globalping ping <target> from <location> [options]',
		options: `--limit			  Number of probes - e.g. 1
--packets			Number of packets - e.g. 4`,
		examples: `globalping ping jsdelivr.com from united kingdom
globalping ping google.com from EU --limit 2 --packets 5`,
	},

	'traceroute': {
		preamble: 'Traceroute is a tool used to diagnose problems in a network path.',
		usage: 'globalping traceroute <target> from <location> [options]',
		options: `--limit			Number of probes - e.g. 1
--protocol	Protocol to use - TCP | UDP | ICMP
--port 			Port to use - e.g. 33434`,
		examples: `globalping traceroute jsdelivr.com from united kingdom
globalping traceroute google.com from EU --limit 2 --protocol TCP --port 33434`,
	},

	'dns': {
		preamble: 'DNS is a network protocol used to translate domain names to IP addresses.',
		usage: 'globalping dns <target> from <location> [options]',
		options: `--limit			Number of probes - e.g. 1
--query			Query type - A | AAAA | ANY | CNAME | DNSKEY | DS | MX | NS | NSEC | PTR | RRSIG | SOA | TXT | SRV
--port			Port to use - e.g. 53
--protocol	Protocol to use - UDP | TCP
--resolver 	Resolver to use - e.g.
--trace			Boolean flag to enable trace`,
		examples: `globalping dns jsdelivr.com from united kingdom
globalping dns google.com from EU --limit 2 --query A --port 53 --protocol UDP --resolver
globalping dns google.com from EU --limit 2 --query A --port 53 --protocol UDP --resolver --trace`,
	},


	'mtr': {
		preamble: 'My Traceroute (MTR) is a tool that combines traceroute and ping, which is a common method for testing network connectivity and speed.',
		usage: 'globalping mtr <target> from <location> [options]',
		options: `--limit			Number of probes - e.g. 1
--protocol	Protocol to use - TCP | UDP | ICMP
--port 			Port to use - e.g. 33434`,
		examples: `globalping mtr jsdelivr.com from united kingdom
globalping mtr google.com from EU --limit 2 --protocol TCP --port 33434`,
	},

	'http': {
		preamble: 'HTTP is a network protocol used to transfer data between a client and a server.',
		usage: 'globalping http <target> from <location> [options]',
		options: `--limit			Number of probes - e.g. 1
--protocol	Protocol to use - HTTP | HTTPS | HTTP2
--port 			Port to use - e.g. 80
--method		HTTP method - HEAD | GET
--path			URL pathname - e.g. /
--query			Query string
--host 			Hostname
--header		Headers to use e.g. "Content-Type: text/html; charset=UTF-8"`,
		examples: `globalping http jsdelivr.com from united kingdom
globalping http google.com from EU --limit 2 --protocol HTTP --port 80 --method GET --path / --query --host --header`,
	}

};

export const helpCmd = (cmd: string): string => {
	if (cmd === 'help') return `${help.help.preamble}\n\n*Usage:*\n\`\`\`${help.help.usage}\`\`\`\n\n*Arguments*:\n\`\`\`${help.help.args}\`\`\`\n\nMore help can be found here:\n\`\`\`${help.help.end}\`\`\``;
	if (cmd === 'ping') return `${help.ping.preamble}\n\n*Usage:*\n\`\`\`${help.ping.usage}\`\`\`\n\n*Options:*\n\`\`\`${help.ping.options}\`\`\`\n\n*Examples:*\n\`\`\`${help.ping.examples}\`\`\``;
	if (cmd === 'traceroute') return `${help.traceroute.preamble}\n\n*Usage:*\n\`\`\`${help.traceroute.usage}\`\`\`\n\n*Options:*\n\`\`\`${help.traceroute.options}\`\`\`\n\n*Examples:*\n\`\`\`${help.traceroute.examples}\`\`\``;
	if (cmd === 'dns') return `${help.dns.preamble}\n\n*Usage:*\n\`\`\`${help.dns.usage}\`\`\`\n\n*Options:*\n\`\`\`${help.dns.options}\`\`\`\n\n*Examples:*\n\`\`\`${help.dns.examples}\`\`\``;
	if (cmd === 'mtr') return `${help.mtr.preamble}\n\n*Usage:*\n\`\`\`${help.mtr.usage}\`\`\`\n\n*Options:*\n\`\`\`${help.mtr.options}\`\`\`\n\n*Examples:*\n\`\`\`${help.mtr.examples}\`\`\``;
	if (cmd === 'http') return `${help.http.preamble}\n\n*Usage:*\n\`\`\`${help.http.usage}\`\`\`\n\n*Options:*\n\`\`\`${help.http.options}\`\`\`\n\n*Examples:*\n\`\`\`${help.http.examples}\`\`\``;

	return 'Unknown command! Please call `/globalping help` for a list of commands.';
};
