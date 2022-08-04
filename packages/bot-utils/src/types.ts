// types
const ALLOWED_QUERY_TYPES = ['ping', 'traceroute', 'dns', 'mtr', 'http'] as const;

// filters
const ALLOWED_LOCATION_TYPES = ['continent', 'region', 'country', 'state', 'city', 'asn', 'network', 'magic'] as const;

// traceroute
const ALLOWED_TRACE_PROTOCOLS = ['TCP', 'UDP', 'ICMP'] as const;

// dns
const ALLOWED_DNS_TYPES = ['A', 'AAAA', 'ANY', 'CNAME', 'DNSKEY', 'DS', 'MX', 'NS', 'NSEC', 'PTR', 'RRSIG', 'SOA', 'TXT', 'SRV'] as const;
const ALLOWED_DNS_PROTOCOLS = ['UDP', 'TCP'] as const;

// mtr
const ALLOWED_MTR_PROTOCOLS = ['TCP', 'UDP', 'ICMP'] as const;

// http
const ALLOWED_HTTP_PROTOCOLS = ['HTTP', 'HTTPS', 'HTTP2'] as const;
const ALLOWED_HTTP_METHODS = ['GET', 'HEAD'] as const;

interface Locations {
	continent?: string;
	region?: string;
	country?: string;
	state?: string;
	city?: string;
	network?: string;
	asn?: number;
	magic?: string;
}

export interface PostMeasurement {
	limit: number
	locations: Locations[]
	type: string
	target: string
	measurementOptions: {
		query?: {
			type?: string
		}
		request?: {
			headers?: Record<string, string>
			path?: string
			host?: string
			query?: string
			method?: string
		}
		protocol?: string
		port?: number
		resolver?: string
		trace?: boolean
		packets?: number
	}
}
