import { describe, expect, it } from 'vitest';

import { getMeasurement } from '../src/get';
import { getMeasurementHandlers, setupAPIServer } from './mocks/index';


describe('Get', () => {
	setupAPIServer(getMeasurementHandlers);

	describe('Get measurement', () => {
		it('get measurement successfully', async () => {
			const res = await getMeasurement('test1');
			expect(res).toEqual([{
				'id': 'kg8n5uP6QLAOmpij',
				'type': 'ping',
				'status': 'finished',
				'createdAt': '2022-08-09T09:53:23.095Z',
				'updatedAt': '2022-08-09T09:53:25.184Z',
				'probesCount': 1,
				'results': [
					{
						'probe': {
							'continent': 'NA',
							'region': 'Northern America',
							'country': 'US',
							'state': 'NY',
							'city': 'New York City',
							'asn': 36_352,
							'longitude': -74.006,
							'latitude': 40.7143,
							'network': 'ColoCrossing',
							'resolvers': [
								'8.8.8.8',
								'8.8.4.4'
							]
						},
						'result': {
							'resolvedAddress': '216.24.57.3',
							'resolvedHostname': '216.24.57.3:',
							'timings': [],
							'stats': {
								'min': 1.038,
								'avg': 1.354,
								'max': 1.777,
								'loss': 0
							},
							'rawOutput': 'PING jsdelivr.com (216.24.57.3) 56(84) bytes of data.\n64 bytes from 216.24.57.3: icmp_seq=1 ttl=58 time=1.78 ms\n64 bytes from 216.24.57.3: icmp_seq=2 ttl=58 time=1.04 ms\n64 bytes from 216.24.57.3: icmp_seq=3 ttl=58 time=1.25 ms\n\n--- jsdelivr.com ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss, time 1102ms\nrtt min/avg/max/mdev = 1.038/1.354/1.777/0.310 ms'
						}
					}
				]
			}]);
		});
	});
});
