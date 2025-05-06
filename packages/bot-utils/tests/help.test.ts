import { describe, expect, it } from 'vitest';
import { generalHelpTexts, generateHelp } from '../src/help.js';

describe('help', () => {
	describe('generateHelp', () => {
		it('should return help texts', async () => {
			const helpTexts = generateHelp('*', '/globalping');

			const expectedHelpTexts = {
				auth: `Authenticate with the Globalping API for higher measurements limits.

*Available Commands*:
\`\`\`
  login     Log in to your Globalping account
  logout    Log out from your Globalping account
  status    Check the current authentication status
\`\`\`

*Usage:*
\`\`\`
/globalping auth [command]
\`\`\`

*Flags*:
\`\`\`
  -h, --help    Help for auth
\`\`\``,
				auth_login: `Log in to your Globalping account for higher measurements limits.

*Usage:*
\`\`\`
/globalping auth login  [flags]
\`\`\`

*Flags*:
\`\`\`
  -h, --help    Help for login
\`\`\``,
				auth_logout: `Log out from your Globalping account.

*Usage:*
\`\`\`
/globalping auth logout
\`\`\`

*Flags*:
\`\`\`
  -h, --help    Help for logout
\`\`\``,
				auth_status: `Check the current authentication status.

*Usage:*
\`\`\`
/globalping auth status
\`\`\`

*Flags*:
\`\`\`
  -h, --help    Help for status
\`\`\``,
				dns: `Performs DNS lookups and displays the answers that are returned from the name server(s) that were queried. The default nameserver depends on the probe and is defined by the user's local settings or DHCP.

*Examples:*
Resolve google.com from 2 probes in New York
\`\`\`
/globalping dns google.com from New York --limit 2
\`\`\`
Resolve google.com using probes from previous measurement
\`\`\`
/globalping dns google.com from rvasVvKnj48cxNjC
\`\`\`
Resolve google.com from 2 probes from London or Belgium with trace enabled
\`\`\`
/globalping dns google.com from London,Belgium --limit 2 --trace
\`\`\`
Resolve google.com from a probe in Paris using the TCP protocol
\`\`\`
/globalping dns google.com from Paris --protocol tcp
\`\`\`
Resolve jsdelivr.com from a probe in Berlin using the type MX and the resolver 1.1.1.1
\`\`\`
/globalping dns jsdelivr.com from Berlin --type MX --resolver 1.1.1.1
\`\`\`
Resolve jsdelivr.com from a probe that is from the AWS network and is located in Montreal with latency output
\`\`\`
/globalping dns jsdelivr.com from aws+montreal --latency
\`\`\`

*Usage:*
\`\`\`
/globalping dns [target] from [location] [flags]
\`\`\`

*Flags*:
\`\`\`
  -h, --help               Help for dns
      --port int           Send the query to a non-standard port on the server (default 53)
      --protocol string    Specifies the protocol to use for the DNS query (TCP or UDP) (default "UDP")
      --resolver string    Resolver is the hostname or IP address of the name server to use (default empty)
      --trace              Toggle tracing of the delegation path from the root name servers (default false)
      --type string        Specifies the type of DNS query to perform (default "A")
\`\`\`

*Global Flags*:
\`\`\`
  -F, --from string    Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "World")
      --latency        Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int      Limit the number of probes to use (default 1)
      --share          Prints a link at the end the results, allowing to visualize the results online (default false)
\`\`\``,
				general: `Globalping is a platform that allows anyone to run networking commands such as ping, traceroute, dig and mtr on probes distributed all around the world.
The Globalping bot allows you to interact with the API in a simple and human-friendly way to debug networking issues like anycast routing and script automated tests and benchmarks.

*Usage:*
\`\`\`
/globalping [command]
\`\`\`

*Measurement Commands*:
\`\`\`
  dns           Resolve a DNS record similarly to dig
  http          Perform a HEAD, GET, or OPTIONS request to a host
  mtr           Run an MTR test, similar to traceroute
  ping          Run a ping test
  traceroute    Run a traceroute test
\`\`\`

*Additional Commands*:
\`\`\`
  auth          Authenticate with the Globalping API
  limits        Show the current rate limits
  help          Help about any command
\`\`\`

*Flags*:
\`\`\`
  -h, --help           Help for globalping
  -F, --from string    Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "World")
      --latency        Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int      Limit the number of probes to use (default 1)
      --share          Prints a link at the end the results, allowing to visualize the results online (default false)
\`\`\`

Use \`/globalping help [command]\` for more information about a command.
`,
				http: `The http command sends an HTTP request to a host and can perform HEAD, GET, or OPTIONS operations. GET is limited to 10KB responses, everything above will be cut by the API.

*Examples:*
HTTP HEAD request to jsdelivr.com from 2 probes in New York
\`\`\`
/globalping http https://www.jsdelivr.com:443/package/npm/test?nav=stats from New York --limit 2
\`\`\`
HTTP GET request to google.com from 2 probes from London or Belgium
\`\`\`
/globalping http google.com from London,Belgium --limit 2 --method GET
\`\`\`
HTTP GET request to google.com using probes from previous measurement
\`\`\`
/globalping http google.com from rvasVvKnj48cxNjC --method GET
\`\`\`
HTTP GET request to google.com from a probe in London. Returns the full output
\`\`\`
/globalping http google.com from London --method GET --full
\`\`\`
HTTP HEAD request to jsdelivr.com from a probe that is from the AWS network and is located in Montreal using HTTP2, 2 http headers are added to the request
\`\`\`
/globalping http jsdelivr.com from aws+montreal --protocol http2 --header "Accept-Encoding: br,gzip" -H "Accept-Language: *"
\`\`\`
HTTP HEAD request to jsdelivr.com from a probe that is located in Paris, using the /robots.txt path with "test=1" query string
\`\`\`
/globalping http jsdelivr.com from Paris --path /robots.txt --query "test=1"
\`\`\`
HTTP HEAD request to example.com from a probe that is located in Berlin, specifying a different host example.org in the request headers
\`\`\`
/globalping http example.com from Berlin --host example.org
\`\`\`
HTTP GET request google.com from a probe in ASN 123 with a dns resolver 1.1.1.1
\`\`\`
/globalping http google.com from 123 --resolver 1.1.1.1
\`\`\`

*Usage:*
\`\`\`
/globalping http [target] from [location] [flags]
\`\`\`

*Flags*:
\`\`\`
  -h, --help               Help for http
      --full               Enable full output to display TLS details, HTTP status, headers, and body (if available)
  -H, --header string      Specifies a HTTP header to be added to the request, in the format "Key: Value". Multiple headers can be added by adding multiple flags
      --host string        Specifies the Host header, which is going to be added to the request (default host defined in target)
      --method string      Specifies the HTTP method to use (HEAD, GET, or OPTIONS) (default "HEAD")
      --path string        A URL pathname (default "/")
      --port int           Specifies the port to use (default 80 for HTTP, 443 for HTTPS and HTTP2)
      --protocol string    Specifies the query protocol (HTTP, HTTPS, HTTP2) (default "HTTPS")
      --query string       A query-string
      --resolver string    Specifies the resolver server used for DNS lookup (default is defined by the probe's network)
\`\`\`

*Global Flags*:
\`\`\`
  -F, --from string    Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "World")
      --latency        Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int      Limit the number of probes to use (default 1)
      --share          Prints a link at the end the results, allowing to visualize the results online (default false)
\`\`\``,
				limits: `Show the current rate limits.

*Usage:*
\`\`\`
/globalping limits
\`\`\`

*Flags*:
\`\`\`
  -h, --help    Help for limits
\`\`\``,
				mtr: `mtr combines the functionality of the traceroute and ping programs in a single network diagnostic tool.

*Examples:*
MTR google.com from 2 probes in New York
\`\`\`
/globalping mtr google.com from New York --limit 2
\`\`\`
MTR google.com using probes from previous measurement
\`\`\`
/globalping mtr google.com from rvasVvKnj48cxNjC
\`\`\`
MTR 1.1.1.1 from 2 probes from USA or Belgium with 10 packets
\`\`\`
/globalping mtr 1.1.1.1 from USA,Belgium --limit 2 --packets 10
\`\`\`
MTR jsdelivr.com from a probe that is from the AWS network and is located in Montreal using the TCP protocol and port 453
\`\`\`
/globalping mtr jsdelivr.com from aws+montreal --protocol tcp --port 453
\`\`\`

*Usage:*
\`\`\`
/globalping mtr [target] from [location] [flags]
\`\`\`

*Flags*:
\`\`\`
  -h, --help               Help for mtr
      --packets int        Specifies the number of packets to send to each hop (default 3)
      --port int           Specifies the port to use. Only applicable for TCP protocol (default 53)
      --protocol string    Specifies the protocol used (ICMP, TCP or UDP) (default "ICMP")
\`\`\`

*Global Flags*:
\`\`\`
  -F, --from string    Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "World")
      --latency        Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int      Limit the number of probes to use (default 1)
      --share          Prints a link at the end the results, allowing to visualize the results online (default false)
\`\`\``,
				ping: `The ping command allows sending ping requests to a target. Often used to test the network latency and stability.

*Examples:*
Ping google.com from 2 probes in New York
\`\`\`
/globalping ping google.com from New York --limit 2
\`\`\`
Ping google.com using probes from previous measurement
\`\`\`
/globalping ping google.com from rvasVvKnj48cxNjC
\`\`\`
Ping 1.1.1.1 from 2 probes from USA or Belgium with 10 packets
\`\`\`
/globalping ping 1.1.1.1 from USA,Belgium --limit 2 --packets 10
\`\`\`
Ping jsdelivr.com from a probe that is from the AWS network and is located in Montreal with latency output
\`\`\`
/globalping ping jsdelivr.com from aws+montreal --latency
\`\`\`

*Usage:*
\`\`\`
/globalping ping [target] from [location] [flags]
\`\`\`

*Flags*:
\`\`\`
  -h, --help           Help for ping
      --packets int    Specifies the desired amount of ECHO_REQUEST packets to be sent (default 3)
\`\`\`

*Global Flags*:
\`\`\`
  -F, --from string    Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "World")
      --latency        Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int      Limit the number of probes to use (default 1)
      --share          Prints a link at the end the results, allowing to visualize the results online (default false)
\`\`\``,
				traceroute: `traceroute tracks the route packets take from an IP network on their way to a given host.

*Examples:*
Traceroute google.com from 2 probes in New York
\`\`\`
/globalping traceroute google.com from New York --limit 2
\`\`\`
Traceroute google.com using probes from previous measurement
\`\`\`
/globalping traceroute google.com from rvasVvKnj48cxNjC
\`\`\`
Traceroute 1.1.1.1 from 2 probes from USA or Belgium
\`\`\`
/globalping traceroute 1.1.1.1 from USA,Belgium --limit 2
\`\`\`
Traceroute jsdelivr.com from a probe that is from the AWS network and is located in Montreal using the UDP protocol
\`\`\`
/globalping traceroute jsdelivr.com from aws+montreal --protocol UDP
\`\`\`
Traceroute jsdelivr.com from a probe that is located in Paris to port 453
\`\`\`
/globalping traceroute jsdelivr.com from Paris --port 453
\`\`\`

*Usage:*
\`\`\`
/globalping traceroute [target] from [location] [flags]
\`\`\`

*Flags*:
\`\`\`
  -h, --help               Help for traceroute
      --port int           Specifies the port to use for the traceroute. Only applicable for TCP protocol (default 80)
      --protocol string    Specifies the protocol used for tracerouting (ICMP, TCP or UDP) (default "ICMP")
\`\`\`

*Global Flags*:
\`\`\`
  -F, --from string    Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "World")
      --latency        Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int      Limit the number of probes to use (default 1)
      --share          Prints a link at the end the results, allowing to visualize the results online (default false)
\`\`\``,
				unknownCommand:
					'Unknown command! Please call `/globalping help` for a list of commands.',
			};
			expect(helpTexts).toEqual(expectedHelpTexts);
		});

		it('should return help texts - hide help flag', async () => {
			const helpTexts = generateHelp('*', '/globalping', undefined, undefined, undefined, true);

			const expectedHelpTexts = {
				auth: `Authenticate with the Globalping API for higher measurements limits.

*Available Commands*:
\`\`\`
  login     Log in to your Globalping account
  logout    Log out from your Globalping account
  status    Check the current authentication status
\`\`\`

*Usage:*
\`\`\`
/globalping auth [command]
\`\`\`
`,
				auth_login: `Log in to your Globalping account for higher measurements limits.

*Usage:*
\`\`\`
/globalping auth login  [flags]
\`\`\`
`,
				auth_logout: `Log out from your Globalping account.

*Usage:*
\`\`\`
/globalping auth logout
\`\`\`
`,
				auth_status: `Check the current authentication status.

*Usage:*
\`\`\`
/globalping auth status
\`\`\`
`,
				dns: `Performs DNS lookups and displays the answers that are returned from the name server(s) that were queried. The default nameserver depends on the probe and is defined by the user's local settings or DHCP.

*Examples:*
Resolve google.com from 2 probes in New York
\`\`\`
/globalping dns google.com from New York --limit 2
\`\`\`
Resolve google.com using probes from previous measurement
\`\`\`
/globalping dns google.com from rvasVvKnj48cxNjC
\`\`\`
Resolve google.com from 2 probes from London or Belgium with trace enabled
\`\`\`
/globalping dns google.com from London,Belgium --limit 2 --trace
\`\`\`
Resolve google.com from a probe in Paris using the TCP protocol
\`\`\`
/globalping dns google.com from Paris --protocol tcp
\`\`\`
Resolve jsdelivr.com from a probe in Berlin using the type MX and the resolver 1.1.1.1
\`\`\`
/globalping dns jsdelivr.com from Berlin --type MX --resolver 1.1.1.1
\`\`\`
Resolve jsdelivr.com from a probe that is from the AWS network and is located in Montreal with latency output
\`\`\`
/globalping dns jsdelivr.com from aws+montreal --latency
\`\`\`

*Usage:*
\`\`\`
/globalping dns [target] from [location] [flags]
\`\`\`

*Flags*:
\`\`\`
--port int           Send the query to a non-standard port on the server (default 53)
--protocol string    Specifies the protocol to use for the DNS query (TCP or UDP) (default "UDP")
--resolver string    Resolver is the hostname or IP address of the name server to use (default empty)
--trace              Toggle tracing of the delegation path from the root name servers (default false)
--type string        Specifies the type of DNS query to perform (default "A")
\`\`\`

*Global Flags*:
\`\`\`
  -F, --from string    Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "World")
      --latency        Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int      Limit the number of probes to use (default 1)
      --share          Prints a link at the end the results, allowing to visualize the results online (default false)
\`\`\``,
				general: `Globalping is a platform that allows anyone to run networking commands such as ping, traceroute, dig and mtr on probes distributed all around the world.
The Globalping bot allows you to interact with the API in a simple and human-friendly way to debug networking issues like anycast routing and script automated tests and benchmarks.

*Usage:*
\`\`\`
/globalping [command]
\`\`\`

*Measurement Commands*:
\`\`\`
  dns           Resolve a DNS record similarly to dig
  http          Perform a HEAD, GET, or OPTIONS request to a host
  mtr           Run an MTR test, similar to traceroute
  ping          Run a ping test
  traceroute    Run a traceroute test
\`\`\`

*Additional Commands*:
\`\`\`
  auth          Authenticate with the Globalping API
  limits        Show the current rate limits
  help          Help about any command
\`\`\`

*Flags*:
\`\`\`
  -F, --from string    Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "World")
      --latency        Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int      Limit the number of probes to use (default 1)
      --share          Prints a link at the end the results, allowing to visualize the results online (default false)
\`\`\`

Use \`/globalping help [command]\` for more information about a command.
`,
				http: `The http command sends an HTTP request to a host and can perform HEAD, GET, or OPTIONS operations. GET is limited to 10KB responses, everything above will be cut by the API.

*Examples:*
HTTP HEAD request to jsdelivr.com from 2 probes in New York
\`\`\`
/globalping http https://www.jsdelivr.com:443/package/npm/test?nav=stats from New York --limit 2
\`\`\`
HTTP GET request to google.com from 2 probes from London or Belgium
\`\`\`
/globalping http google.com from London,Belgium --limit 2 --method GET
\`\`\`
HTTP GET request to google.com using probes from previous measurement
\`\`\`
/globalping http google.com from rvasVvKnj48cxNjC --method GET
\`\`\`
HTTP GET request to google.com from a probe in London. Returns the full output
\`\`\`
/globalping http google.com from London --method GET --full
\`\`\`
HTTP HEAD request to jsdelivr.com from a probe that is from the AWS network and is located in Montreal using HTTP2, 2 http headers are added to the request
\`\`\`
/globalping http jsdelivr.com from aws+montreal --protocol http2 --header "Accept-Encoding: br,gzip" -H "Accept-Language: *"
\`\`\`
HTTP HEAD request to jsdelivr.com from a probe that is located in Paris, using the /robots.txt path with "test=1" query string
\`\`\`
/globalping http jsdelivr.com from Paris --path /robots.txt --query "test=1"
\`\`\`
HTTP HEAD request to example.com from a probe that is located in Berlin, specifying a different host example.org in the request headers
\`\`\`
/globalping http example.com from Berlin --host example.org
\`\`\`
HTTP GET request google.com from a probe in ASN 123 with a dns resolver 1.1.1.1
\`\`\`
/globalping http google.com from 123 --resolver 1.1.1.1
\`\`\`

*Usage:*
\`\`\`
/globalping http [target] from [location] [flags]
\`\`\`

*Flags*:
\`\`\`
      --full               Enable full output to display TLS details, HTTP status, headers, and body (if available)
  -H, --header string      Specifies a HTTP header to be added to the request, in the format "Key: Value". Multiple headers can be added by adding multiple flags
      --host string        Specifies the Host header, which is going to be added to the request (default host defined in target)
      --method string      Specifies the HTTP method to use (HEAD, GET, or OPTIONS) (default "HEAD")
      --path string        A URL pathname (default "/")
      --port int           Specifies the port to use (default 80 for HTTP, 443 for HTTPS and HTTP2)
      --protocol string    Specifies the query protocol (HTTP, HTTPS, HTTP2) (default "HTTPS")
      --query string       A query-string
      --resolver string    Specifies the resolver server used for DNS lookup (default is defined by the probe's network)
\`\`\`

*Global Flags*:
\`\`\`
  -F, --from string    Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "World")
      --latency        Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int      Limit the number of probes to use (default 1)
      --share          Prints a link at the end the results, allowing to visualize the results online (default false)
\`\`\``,
				limits: `Show the current rate limits.

*Usage:*
\`\`\`
/globalping limits
\`\`\`
`,
				mtr: `mtr combines the functionality of the traceroute and ping programs in a single network diagnostic tool.

*Examples:*
MTR google.com from 2 probes in New York
\`\`\`
/globalping mtr google.com from New York --limit 2
\`\`\`
MTR google.com using probes from previous measurement
\`\`\`
/globalping mtr google.com from rvasVvKnj48cxNjC
\`\`\`
MTR 1.1.1.1 from 2 probes from USA or Belgium with 10 packets
\`\`\`
/globalping mtr 1.1.1.1 from USA,Belgium --limit 2 --packets 10
\`\`\`
MTR jsdelivr.com from a probe that is from the AWS network and is located in Montreal using the TCP protocol and port 453
\`\`\`
/globalping mtr jsdelivr.com from aws+montreal --protocol tcp --port 453
\`\`\`

*Usage:*
\`\`\`
/globalping mtr [target] from [location] [flags]
\`\`\`

*Flags*:
\`\`\`
--packets int        Specifies the number of packets to send to each hop (default 3)
--port int           Specifies the port to use. Only applicable for TCP protocol (default 53)
--protocol string    Specifies the protocol used (ICMP, TCP or UDP) (default "ICMP")
\`\`\`

*Global Flags*:
\`\`\`
  -F, --from string    Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "World")
      --latency        Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int      Limit the number of probes to use (default 1)
      --share          Prints a link at the end the results, allowing to visualize the results online (default false)
\`\`\``,
				ping: `The ping command allows sending ping requests to a target. Often used to test the network latency and stability.

*Examples:*
Ping google.com from 2 probes in New York
\`\`\`
/globalping ping google.com from New York --limit 2
\`\`\`
Ping google.com using probes from previous measurement
\`\`\`
/globalping ping google.com from rvasVvKnj48cxNjC
\`\`\`
Ping 1.1.1.1 from 2 probes from USA or Belgium with 10 packets
\`\`\`
/globalping ping 1.1.1.1 from USA,Belgium --limit 2 --packets 10
\`\`\`
Ping jsdelivr.com from a probe that is from the AWS network and is located in Montreal with latency output
\`\`\`
/globalping ping jsdelivr.com from aws+montreal --latency
\`\`\`

*Usage:*
\`\`\`
/globalping ping [target] from [location] [flags]
\`\`\`

*Flags*:
\`\`\`
--packets int    Specifies the desired amount of ECHO_REQUEST packets to be sent (default 3)
\`\`\`

*Global Flags*:
\`\`\`
  -F, --from string    Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "World")
      --latency        Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int      Limit the number of probes to use (default 1)
      --share          Prints a link at the end the results, allowing to visualize the results online (default false)
\`\`\``,
				traceroute: `traceroute tracks the route packets take from an IP network on their way to a given host.

*Examples:*
Traceroute google.com from 2 probes in New York
\`\`\`
/globalping traceroute google.com from New York --limit 2
\`\`\`
Traceroute google.com using probes from previous measurement
\`\`\`
/globalping traceroute google.com from rvasVvKnj48cxNjC
\`\`\`
Traceroute 1.1.1.1 from 2 probes from USA or Belgium
\`\`\`
/globalping traceroute 1.1.1.1 from USA,Belgium --limit 2
\`\`\`
Traceroute jsdelivr.com from a probe that is from the AWS network and is located in Montreal using the UDP protocol
\`\`\`
/globalping traceroute jsdelivr.com from aws+montreal --protocol UDP
\`\`\`
Traceroute jsdelivr.com from a probe that is located in Paris to port 453
\`\`\`
/globalping traceroute jsdelivr.com from Paris --port 453
\`\`\`

*Usage:*
\`\`\`
/globalping traceroute [target] from [location] [flags]
\`\`\`

*Flags*:
\`\`\`
--port int           Specifies the port to use for the traceroute. Only applicable for TCP protocol (default 80)
--protocol string    Specifies the protocol used for tracerouting (ICMP, TCP or UDP) (default "ICMP")
\`\`\`

*Global Flags*:
\`\`\`
  -F, --from string    Comma-separated list of location values to match against or measurement ID. For example the partial or full name of a continent, region (e.g eastern europe), country, US state, city or network (default "World")
      --latency        Output only the stats of a measurement (default false). Only applies to the dns, http and ping commands
  -L, --limit int      Limit the number of probes to use (default 1)
      --share          Prints a link at the end the results, allowing to visualize the results online (default false)
\`\`\``,
				unknownCommand:
					'Unknown command! Please call `/globalping help` for a list of commands.',
			};
			expect(helpTexts).toEqual(expectedHelpTexts);
		});

		it('should check that short descriptions are less than or equal to 100 chars', async () => {
			for (const cmd of generalHelpTexts.commands) {
				expect((cmd.shortDescription || '').length <= 100, `${cmd.name}: ${cmd.shortDescription}`).toBe(true);

				for (const flag of cmd.flags) {
					expect((flag.shortDescription || '').length <= 100, `${cmd.name}: ${flag.name}: ${flag.shortDescription}`).toBe(true);
				}
			}

			for (const cmd of generalHelpTexts.additionalCommands) {
				expect((cmd.shortDescription || '').length <= 100, `${cmd.name}: ${cmd.shortDescription}`).toBe(true);

				for (const flag of cmd.flags) {
					expect((flag.shortDescription || '').length <= 100, `${cmd.name}: ${flag.name}: ${flag.shortDescription}`).toBe(true);
				}
			}

			for (const flag of generalHelpTexts.flags) {
				expect((flag.shortDescription || '').length <= 100, `general: ${flag.name}: ${flag.shortDescription}`).toBe(true);
			}
		});
	});
});
