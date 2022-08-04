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
