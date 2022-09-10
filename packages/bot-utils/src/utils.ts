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
	[key: string]: string
}

export const help: Help = {
	'help': `The Globalping bot is a simple interface to interact with the Globalping API and run global networking tests. Need a traceroute done from Japan? Or check the ping latency of an endpoint from Brazil? Just ask me!

	Usage:
		globalping ping <target> from <location> [options]
		globalping <target> traceroute from <location> [options]
		globalping <target> dns from <location> [options]
		globalping mtr <target> from <location> [options]
		globalping http <target> from <location> [options]

	Arguments:
		<target>		A public endpoint, such as a hostname or IPv4 address - e.g. "https://www.jsdelivr.com"
		<from>			Magic Location - e.g. "ger", "aws", "google+belgium"

		Location Schema: https://github.com/jsdelivr/globalping/blob/master/docs/measurement/schema/location.md

	Options:
		--limit			Number of probes - e.g. 1

	Command specific options can be found with:
		globalping ping -h | --help
		globalping traceroute -h | --help
		globalping dns -h | --help
		globalping mtr -h | --help
		globalping http -h | --help

	Reference: https://github.com/jsdelivr/globalping/tree/master/docs`,

	'ping': `Usage:
	globalping ping <target> from <location> [options]

	Options:
		--limit			Number of probes - e.g. 1
		--packets		Number of packets - e.g. 4`,

	'traceroute': `Usage:
	globalping traceroute <target> from <location> [options]

	Options:
		--limit			Number of probes - e.g. 1
		--protocol	Protocol to use - TCP | UDP | ICMP
		--port 			Port to use - e.g. 33434`,

	'dns': `Usage:
	globalping dns <target> from <location> [options]

	Options:
		--limit			Number of probes - e.g. 1
		--query			Query type - A | AAAA | ANY | CNAME | DNSKEY | DS | MX | NS | NSEC | PTR | RRSIG | SOA | TXT | SRV
		--port			Port to use - e.g. 53
		--protocol	Protocol to use - UDP | TCP
		--resolver 	Resolver to use - e.g. 1.1.1.1
		--trace			Boolean flag to enable trace`,

	'mtr': `Usage:
	globalping mtr <target> from <location> [options]

	Options:
		--limit			Number of probes - e.g. 1
		--protocol	Protocol to use - TCP | UDP | ICMP
		--port 			Port to use - e.g. 33434`,

	'http': `Usage:
	globalping http <target> from <location> [options]

	Options:
		--limit			Number of probes - e.g. 1
		--protocol	Protocol to use - HTTP | HTTPS | HTTP2
		--port 			Port to use - e.g. 80
		--method		HTTP method - HEAD | GET
		--path			URL pathname - e.g. /
		--query			Query string
		--host 			Hostname
		--header		Headers to use e.g. "Content-Type: text/html; charset=UTF-8"`};
