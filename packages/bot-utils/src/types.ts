// Docs: https://globalping.io/docs/api.globalping.io

export const ALLOWED_QUERY_TYPES = [
	'ping',
	'traceroute',
	'dns',
	'mtr',
	'http',
] as const;
export type QueryType = (typeof ALLOWED_QUERY_TYPES)[number];

export const ALLOWED_ADDITIONAL_QUERY_TYPES = [ 'auth', 'limits' ] as const;
export type AdditionalQueryType =
	(typeof ALLOWED_ADDITIONAL_QUERY_TYPES)[number];

export const isQueryType = (type: string): type is QueryType => ALLOWED_QUERY_TYPES.includes(type as QueryType)
	|| ALLOWED_ADDITIONAL_QUERY_TYPES.includes(type as AdditionalQueryType);

// filters
export const ALLOWED_LOCATION_TYPES = [
	'continent',
	'region',
	'country',
	'state',
	'city',
	'asn',
	'network',
	'magic',
] as const;
export type LocationType = (typeof ALLOWED_LOCATION_TYPES)[number];
export const isLocationType = (type: string): type is LocationType => ALLOWED_LOCATION_TYPES.includes(type as LocationType);

// traceroute
export const ALLOWED_TRACE_PROTOCOLS = [ 'TCP', 'UDP', 'ICMP' ] as const;
export type TraceProtocol = (typeof ALLOWED_TRACE_PROTOCOLS)[number];
export const isTraceProtocol = (type: string): type is TraceProtocol => ALLOWED_TRACE_PROTOCOLS.includes(type as TraceProtocol);

// dns
export const ALLOWED_DNS_TYPES = [
	'A',
	'AAAA',
	'ANY',
	'CNAME',
	'DNSKEY',
	'DS',
	'HTTPS',
	'MX',
	'NS',
	'NSEC',
	'PTR',
	'RRSIG',
	'SOA',
	'TXT',
	'SRV',
] as const;
export type DnsType = (typeof ALLOWED_DNS_TYPES)[number];
export const isDnsType = (type: string): type is DnsType => ALLOWED_DNS_TYPES.includes(type as DnsType);

export const ALLOWED_DNS_PROTOCOLS = [ 'UDP', 'TCP' ] as const;
export type DnsProtocol = (typeof ALLOWED_DNS_PROTOCOLS)[number];
export const isDnsProtocol = (type: string): type is DnsProtocol => ALLOWED_DNS_PROTOCOLS.includes(type as DnsProtocol);

// mtr
export const ALLOWED_MTR_PROTOCOLS = [ 'TCP', 'UDP', 'ICMP' ] as const;
export type MtrProtocol = (typeof ALLOWED_MTR_PROTOCOLS)[number];
export const isMtrProtocol = (type: string): type is MtrProtocol => ALLOWED_MTR_PROTOCOLS.includes(type as MtrProtocol);

// http
export const ALLOWED_HTTP_PROTOCOLS = [ 'HTTP', 'HTTPS', 'HTTP2' ] as const;
export type HttpProtocol = (typeof ALLOWED_HTTP_PROTOCOLS)[number];
export const isHttpProtocol = (type: string): type is HttpProtocol => ALLOWED_HTTP_PROTOCOLS.includes(type as HttpProtocol);

export const ALLOWED_HTTP_METHODS = [ 'HEAD', 'GET', 'OPTIONS' ] as const;
export type HttpMethod = (typeof ALLOWED_HTTP_METHODS)[number];
export const isHttpMethod = (type: string): type is HttpMethod => ALLOWED_HTTP_METHODS.includes(type as HttpMethod);

// Post Types
export interface Location {
	continent?: string;
	region?: string;
	country?: string;
	state?: string;
	city?: string;
	asn?: number;
	network?: string;
	tags?: string[];
	magic?: string;
	limit?: number;
}

interface MeasurementCreateOptionsBase {
	ipVersion?: number; // 4 | 6. Only allowed if the target is a hostname.
}

// https://globalping.io/docs/api.globalping.io#post-/v1/measurements
interface MeasurementCreateBase {
	target: string;
	inProgressUpdates: boolean;
	locations: string | Location[];
	limit: number;
}

export interface PingMeasurementCreateOptions
	extends MeasurementCreateOptionsBase {
	packets?: number;
}

export interface PingMeasurementCreate extends MeasurementCreateBase {
	type: 'ping';
	measurementOptions?: PingMeasurementCreateOptions;
}

export interface TracerouteMeasurementCreateOptions
	extends MeasurementCreateOptionsBase {
	port?: number;
	protocol?: TraceProtocol;
}

export interface TracerouteMeasurementCreate extends MeasurementCreateBase {
	type: 'traceroute';
	measurementOptions: TracerouteMeasurementCreateOptions;
}

export interface DnsMeasurementCreateOptions
	extends MeasurementCreateOptionsBase {
	query?: {
		type: DnsType;
	};
	resolver?: string;
	port?: number;
	protocol?: DnsProtocol;
	trace?: boolean;
}

export interface DnsMeasurementCreate extends MeasurementCreateBase {
	type: 'dns';
	measurementOptions?: DnsMeasurementCreateOptions;
}

export interface MtrMeasurementCreateOptions
	extends MeasurementCreateOptionsBase {
	port?: number;
	protocol?: MtrProtocol;
	packets?: number;
}

export interface MtrMeasurementCreate extends MeasurementCreateBase {
	type: 'mtr';
	measurementOptions?: MtrMeasurementCreateOptions;
}

export interface HttpMeasurementCreateOptions
	extends MeasurementCreateOptionsBase {
	request?: {
		host?: string;
		path?: string;
		query?: string;
		method?: HttpMethod;
		headers?: Record<string, string>;
	};
	resolver?: string;
	port?: number;
	protocol?: HttpProtocol;
}

export interface HttpMeasurementCreate extends MeasurementCreateBase {
	type: 'http';
	measurementOptions?: HttpMeasurementCreateOptions;
}

export type MeasurementCreate =
	| PingMeasurementCreate
	| TracerouteMeasurementCreate
	| DnsMeasurementCreate
	| MtrMeasurementCreate
	| HttpMeasurementCreate;

export interface MeasurementCreateResponse {
	id: string;
	probesCount: number;
}

export interface ProbeDetails {
	continent: string;
	region: string;
	country: string;
	state: string | null;
	city: string;
	asn: number;
	network: string;
	latitude: number;
	longitude: number;
	tags: string[];
	resolvers: string[];
}

export interface InProgressProbeResult {
	status: 'in-progress';
	rawOutput: string;
}

export interface PingTiming {
	rtt: number;
	ttl: number;
}

export interface PingStats {
	min: number | null;
	avg: number | null;
	max: number | null;
	total: number;
	rcv: number;
	drop: number;
	loss: number;
}

export interface PingProbeResult {
	status: 'finished';
	rawOutput: string;
	resolvedAddress: string | null;
	resolvedHostname: string | null;
	stats: PingStats;
	timings: PingTiming[];
}

export interface TracerouteTiming {
	ttl: number;
}

export interface TracerouHop {
	resolvedAddress: string | null;
	resolvedHostname: string | null;
	timings: TracerouteTiming[];
}

export interface TracerouteProbeResult {
	status: 'finished';
	rawOutput: string;
	resolvedAddress: string | null;
	resolvedHostname: string | null;
	hops: TracerouHop[];
}

export interface DnsAnswer {
	name: string;
	type: string;
	ttl: number;
	class: string;
	value: string;
}

export interface DnsTimings {
	total: number;
}

export interface DnsProbeResult {
	status: 'finished';
	rawOutput: string;
	statusCode: number;
	statusCodeName: string;
	resolver: string;
	answers: DnsAnswer[];
	timings: DnsTimings;
}

export interface TraceDnsHop {
	resolver: string;
	answers: DnsAnswer[];
	timings: DnsTimings;
}

export interface TraceDnsProbeResult {
	status: 'finished';
	rawOutput: string;
	hops: TraceDnsHop[];
}

export interface MtrStats {
	min: number;
	avg: number;
	max: number;
	stDev: number;
	jMin: number;
	jAvg: number;
	jMax: number;
	total: number;
	rcv: number;
	drop: number;
	loss: number;
}

export interface MtrTiming {
	rtt: number;
}

export interface MtrHop {
	resolvedAddress: string | null;
	resolvedHostname: string | null;
	asn: number[];
	stats: MtrStats;
	timings: MtrTiming[];
}

export interface MtrProbeResult {
	status: 'finished';
	rawOutput: string;
	resolvedAddress: string | null;
	resolvedHostname: string | null;
	hops: MtrHop[];
}

export type HttpHeaders = Record<string, string>;

export interface HttpTimings {
	total: number;
	dns: number;
	tcp: number;
	tls: number;
	firstByte: number;
	download: number;
}

export interface HttpTLS {
	protocol: string;
	cipherName: string;
	authorized: boolean;
	error?: string;
	createdAt: string;
	expiresAt: string;
	subject: {
		CN: string;
		alt: string;
	};
	issuer: {
		C: string;
		O: string;
		CN: string;
	};
	keyType: string | null;
	keyBits: number | null;
	serialNumber: string;
	fingerprint256: string;
	publicKey: string | null;
}

export interface HttpProbeResult {
	status: 'finished';
	rawOutput: string;
	rawHeaders: string;
	rawBody: string | null;
	truncated: boolean;
	headers: HttpHeaders;
	statusCode: number;
	statusCodeName: string;
	resolvedAddress: string | null;
	timings: HttpTimings;
	tls: HttpTLS | null;
}

export interface ProbeMeasurement {
	probe: ProbeDetails;
	result:
		| InProgressProbeResult
		| PingProbeResult
		| TracerouteProbeResult
		| DnsProbeResult
		| TraceDnsProbeResult
		| MtrProbeResult
		| HttpProbeResult;
}

export interface Measurement {
	id: string;
	type: QueryType;
	target: string;
	status: 'in-progress' | 'finished';
	createdAt: string;
	updatedAt: string;
	probesCount: number;
	locations: Location[];
	limit: number;
	results: ProbeMeasurement[];
}

export interface AuthToken {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	expiry: number; // Unix timestamp
	isAnonymous?: boolean;
}
