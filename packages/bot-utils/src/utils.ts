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
		type: 'invalid_request_error' | 'api_error'
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
	// @ts-ignore - skip for now
	if (error instanceof PostError) {
		const { location, response } = error;
		const { statusCode, body } = response;
		const errObj: APIError = JSON.parse(body as string) as APIError;
		if (errObj.error.type === 'invalid_request_error')
			return `\`\`\`${errObj.error.message}\n${errObj.error.params ? Object.keys(errObj.error.params).map(key => `${errObj.error.params?.[key]}`).join('\n') : 'Unknown validation error.'}\`\`\`\nDocumentation and Support: https://github.com/jsdelivr/globalping`;

		if (errObj.error.type === 'api_error' && statusCode === 400) {
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

export const help: Help = {
	'help': {
		preamble: 'The Globalping bot is a simple interface to interact with the Globalping API and run global networking tests. Need a traceroute done from Japan? Or check the ping latency of an endpoint from Brazil? Just ask me!',
		usage: `/globalping ping <target> from <location> [options]
/globalping traceroute <target> from <location> [options]
/globalping dns <target> from <location> [options]
/globalping mtr <target> from <location> [options]
/globalping http <target> from <location> [options]`,
		args: `<target>		A public endpoint, such as a hostname or IPv4 address - e.g. "jsdelivr.com", "1.1.1.1"
<from>		  Magic Location - It can be anything, a city, country, ISP provider, AS number and more. e.g. "germany", "eu", "aws", "55286"

Magic locations can be combined with a comma to run a test from multiple locations in parallel. e.g. "germany, france, spain".
Alternatively, they can be combined with a plus to narrow the filter. e.g. "google+belgium" will match a server in Belgium hosted at Google Cloud DC.

Providing no location will default to "world" which will match a probe from anywhere in the world. e.g. "/globalping ping jsdelivr.com"

Location Schema: https://github.com/jsdelivr/globalping/blob/master/docs/measurement/schema/location.md`,
		end: `/globalping ping --help
/globalping traceroute --help
/globalping dns --help
/globalping mtr --help
/globalping http --help

For more information, see the Globalping documentation: https://github.com/jsdelivr/globalping/tree/master/docs`,
		endDiscord: `/globalping help ping
/globalping help traceroute
/globalping help dns
/globalping help mtr
/globalping help http

For more information, see the Globalping documentation: https://github.com/jsdelivr/globalping/tree/master/docs`
	},

	'ping': {
		preamble: 'Ping is a simple ICMP echo request to a target endpoint.',
		usage: '/globalping ping <target> from <location> [options]',
		options: `--limit			  Number of probes - e.g. 1
--packets			Number of packets - e.g. 4`,
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

	'dns': {
		preamble: 'DNS is a network protocol used to translate domain names to IP addresses.',
		usage: '/globalping dns <target> from <location> [options]',
		options: `--limit			Number of probes - e.g. 1
--query			Query type - A | AAAA | ANY | CNAME | DNSKEY | DS | MX | NS | NSEC | PTR | RRSIG | SOA | TXT | SRV
--port			 Port to use - e.g. 53
--protocol		 Protocol to use - UDP | TCP
--resolver		 Resolver to use - e.g. 1.1.1.1
--trace			Boolean flag to enable trace`,
		examples: `/globalping dns jsdelivr.com from united kingdom
/globalping dns google.com from EU --limit 2 --query A --port 53 --protocol UDP --resolver 1.1.1.1
/globalping dns one.one.one.one --limit 2
/globalping dns google.com from new york --limit 2 --query A --port 53 --protocol udp --resolver 1.1.1.1 --trace`,
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
		options: `--limit			Number of probes - e.g. 1
--protocol		 Protocol to use - HTTP | HTTPS | HTTP2
--port 			Port to use - e.g. 80
--method		   HTTP method - HEAD | GET
--path			 URL pathname - e.g. /
--query			Query string
--host 			Hostname
--header		   Headers to use e.g. "Content-Type: text/html; charset=UTF-8"`,
		examples: `/globalping http jsdelivr.com from united kingdom
/globalping http 1.1.1.1 --limit 2
/globalping http google.com from EU --limit 2 --protocol https --port 443 --method HEAD --path / --query a=1 --header Content-Type: text/html; charset=UTF-8 --header Accept-CH: Viewport-Width, Width`,
	}

};

