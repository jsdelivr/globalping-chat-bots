// types
export const ALLOWED_QUERY_TYPES = ['ping', 'traceroute', 'dns', 'mtr', 'http'] as const;
export type QueryType = typeof ALLOWED_QUERY_TYPES[number];
export const isQueryType = (type: string): type is QueryType => ALLOWED_QUERY_TYPES.includes(type as QueryType);

// filters
export const ALLOWED_LOCATION_TYPES = ['continent', 'region', 'country', 'state', 'city', 'asn', 'network', 'magic'] as const;
export type LocationType = typeof ALLOWED_LOCATION_TYPES[number];
export const isLocationType = (type: string): type is LocationType => ALLOWED_LOCATION_TYPES.includes(type as LocationType);

// traceroute
export const ALLOWED_TRACE_PROTOCOLS = ['TCP', 'UDP', 'ICMP'] as const;
export type TraceProtocol = typeof ALLOWED_TRACE_PROTOCOLS[number];
export const isTraceProtocol = (type: string): type is TraceProtocol => ALLOWED_TRACE_PROTOCOLS.includes(type as TraceProtocol);

// dns
export const ALLOWED_DNS_TYPES = ['A', 'AAAA', 'ANY', 'CNAME', 'DNSKEY', 'DS', 'MX', 'NS', 'NSEC', 'PTR', 'RRSIG', 'SOA', 'TXT', 'SRV'] as const;
export type DnsType = typeof ALLOWED_DNS_TYPES[number];
export const isDnsType = (type: string): type is DnsType => ALLOWED_DNS_TYPES.includes(type as DnsType);

export const ALLOWED_DNS_PROTOCOLS = ['UDP', 'TCP'] as const;
export type DnsProtocol = typeof ALLOWED_DNS_PROTOCOLS[number];
export const isDnsProtocol = (type: string): type is DnsProtocol => ALLOWED_DNS_PROTOCOLS.includes(type as DnsProtocol);

// mtr
export const ALLOWED_MTR_PROTOCOLS = ['TCP', 'UDP', 'ICMP'] as const;
export type MtrProtocol = typeof ALLOWED_MTR_PROTOCOLS[number];
export const isMtrProtocol = (type: string): type is MtrProtocol => ALLOWED_MTR_PROTOCOLS.includes(type as MtrProtocol);

// http
export const ALLOWED_HTTP_PROTOCOLS = ['HTTP', 'HTTPS', 'HTTP2'] as const;
export type HttpProtocol = typeof ALLOWED_HTTP_PROTOCOLS[number];
export const isHttpProtocol = (type: string): type is HttpProtocol => ALLOWED_HTTP_PROTOCOLS.includes(type as HttpProtocol);

export const ALLOWED_HTTP_METHODS = ['GET', 'HEAD'] as const;
export type HttpMethod = typeof ALLOWED_HTTP_METHODS[number];
export const isHttpMethod = (type: string): type is HttpMethod => ALLOWED_HTTP_METHODS.includes(type as HttpMethod);

// Post Types
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

interface SharedMeasurement {
	target: string
	limit: number
	locations: Locations[]
}

export interface PingMeasurement extends SharedMeasurement {
	type: 'ping'
	measurementOptions?: {
		packets?: number
	}
}
export interface TraceMeasurement extends SharedMeasurement {
	type: 'traceroute'
	measurementOptions?: {
		protocol?: TraceProtocol
		port?: number
	}
}

export interface DnsMeasurement extends SharedMeasurement {
	type: 'dns'
	measurementOptions?: {
		query?: {
			type: DnsType
		}
		protocol?: DnsProtocol
		port?: number
		resolver?: string
		trace?: boolean
	}
}

export interface MtrMeasurement extends SharedMeasurement {
	type: 'mtr'
	measurementOptions?: {
		protocol?: MtrProtocol
		port?: number
		packets?: number
	}
}

export interface HttpMeasurement extends SharedMeasurement {
	type: 'http'
	measurementOptions?: {
		port?: number
		protocol?: HttpProtocol
		request?: {
			path?: string
			query?: string
			method?: HttpMethod
			host?: string
			headers?: Record<string, string | string[] | undefined>
		}
	}
}

export type PostMeasurement = PingMeasurement | TraceMeasurement | DnsMeasurement | MtrMeasurement | HttpMeasurement;

export interface PostMeasurementResponse {
	id: string
	probesCount: number
}

// Get Types

interface SharedResults {
	probe: {
		continent: string
		region: string
		country: string
		state: string | null
		city: string
		asn: number
		longitude: number
		latitude: number
		network: string
		resolvers: string[]
		tags: string[]
	}
	result: {
		rawOutput: string,
		stats: {
			loss: number
			min: number
			avg: number
			max: number
		}
		/* eslint-disable  @typescript-eslint/no-explicit-any */
		timings: any
	}
}

// Ping
export interface PingResult extends SharedResults {
	resolvedAddress: string
	resolvedHostname: string
}

// Trace
interface TraceTimings {
	rtt: number
}
interface TraceHops {
	resolvedAddress: string
	resolvedHostname: string
	timings: TraceTimings[]
}
export interface TraceResult extends SharedResults {
	resolvedAddress: string
	resolvedHostname: string
	hops: TraceHops[]
}

// DNS
interface DnsTimings {
	total: number
}

interface DnsAnswers {
	name: string
	type: DnsType
	ttl: number
	class: string
	value: string
}

export interface DnsResultAnswer {
	answers: DnsAnswers[]
	resolver: string
	timings: DnsTimings
}
export interface DnsResultBase extends SharedResults {
	result: DnsResultAnswer
}
export interface DnsResultTrace extends SharedResults {
	result: {
		hops: DnsResultAnswer[]
	}
}

export type DnsResult<Trace> = Trace extends boolean ? DnsResultTrace : DnsResultBase;


interface SharedMeasurementResponse {
	id: string
	type: QueryType
	status: 'in-progress' | 'finished'
	createdAt: string
	updatedAt: string
}

export interface PingMeasurementResponse extends SharedMeasurementResponse {
	type: 'ping'
	results: PingResult[]
}

export type MeasurementResponse = PingMeasurementResponse
