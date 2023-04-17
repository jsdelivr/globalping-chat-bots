import { Flags } from './flags';
import { ALLOWED_DNS_PROTOCOLS, ALLOWED_DNS_TYPES, ALLOWED_HTTP_METHODS, ALLOWED_HTTP_PROTOCOLS, ALLOWED_MTR_PROTOCOLS, ALLOWED_QUERY_TYPES, ALLOWED_TRACE_PROTOCOLS, isDnsProtocol, isDnsType, isHttpMethod, isHttpProtocol, isMtrProtocol, isTraceProtocol, PostMeasurement } from './types';
import { throwArgError } from './utils';


export const buildPostMeasurements = (args: Flags): PostMeasurement[] => {
    const { cmd, target, from, limit, packets, protocol, port, query, resolver, trace, path, method, host, headers } = args;
    const multiFrom = from.split(',').map((f) => f.trim());
    if (multiFrom.length > 10) throw new Error('You can only query up to 10 different locations at once!');

    const postArray: PostMeasurement[] = [];
    for (const location of multiFrom) {
        if (location === '')
            throw new Error('Empty location! Run "/globalping help" for more information.');

        const locations = [{ magic: location }];

        switch (cmd) {
            case 'ping': {
                postArray.push({
                    type: 'ping',
                    target,
                    inProgressUpdates: false,
                    limit,
                    locations,
                    measurementOptions: {
                        ...packets && { packets },
                    }
                });

                break;
            }
            case 'traceroute': {
                postArray.push({
                    type: 'traceroute',
                    target,
                    inProgressUpdates: false,
                    limit,
                    locations,
                    measurementOptions: {
                        ...protocol && { protocol: isTraceProtocol(protocol) ? protocol : throwArgError(protocol, 'protocol', [...ALLOWED_TRACE_PROTOCOLS].join(', ')) },
                        ...port && { port },
                    }
                });

                break;
            }
            case 'dns': {
                postArray.push({
                    type: 'dns',
                    target,
                    inProgressUpdates: false,
                    limit,
                    locations,
                    measurementOptions: {
                        ...query && { query: { type: isDnsType(query) ? query : throwArgError(query, 'query', [...ALLOWED_DNS_TYPES].join(', ')) } },
                        ...protocol && { protocol: isDnsProtocol(protocol) ? protocol : throwArgError(protocol, 'protocol', [...ALLOWED_DNS_PROTOCOLS].join(', ')) },
                        ...port && { port },
                        ...resolver && { resolver },
                        ...trace && { trace },
                    }
                });

                break;
            }
            case 'mtr': {
                postArray.push({
                    type: 'mtr',
                    target,
                    inProgressUpdates: false,
                    limit,
                    locations,
                    measurementOptions: {
                        ...protocol && { protocol: isMtrProtocol(protocol) ? protocol : throwArgError(protocol, 'protocol', [...ALLOWED_MTR_PROTOCOLS].join(', ')) },
                        ...port && { port },
                        ...packets && { packets },
                    }
                });

                break;
            }
            case 'http': {
                postArray.push({
                    type: 'http',
                    target,
                    inProgressUpdates: false,
                    limit,
                    locations,
                    measurementOptions: {
                        ...port && { port },
                        ...protocol && { protocol: isHttpProtocol(protocol) ? protocol : throwArgError(protocol, 'protocol', [...ALLOWED_HTTP_PROTOCOLS].join(', ')) },
                        request: {
                            ...path && { path },
                            ...query && { query },
                            ...method && { method: isHttpMethod(method) ? method : throwArgError(method, 'method', [...ALLOWED_HTTP_METHODS].join(', ')) },
                            ...host && { host },
                            ...headers && { headers },
                        }
                    }
                });

                break;
            }
            default: {
                throwArgError(String(cmd), 'command', [...ALLOWED_QUERY_TYPES].join(', '));
                throw new Error('Unknown error.');
            }
        }
    }
    return postArray;
};
