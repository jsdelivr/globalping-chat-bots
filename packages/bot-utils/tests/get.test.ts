import { describe, expect, it } from 'vitest';

import { getMeasurement } from '../src/get';
import { getMeasurementHandlers, setupAPIServer } from './mocks/index';
import probeData from './mocks/probedata.json';

// This is mainly just to have easy probe data fixtures to reference for future debugging
describe('Get measurement', () => {
	setupAPIServer(getMeasurementHandlers);

	describe('ping', () => {
		it('should get ping successfully (no flags)', async () => {
			const res = await getMeasurement('ping1');
			expect(res).toEqual(probeData.ping1);
		});

		it('should get ping successfully (all flags)', async () => {
			const res = await getMeasurement('ping2');
			expect(res).toEqual(probeData.ping2);
		});
	});

	describe('traceroute', () => {
		it('should get traceroute successfully (no flags)', async () => {
			const res = await getMeasurement('traceroute1');
			expect(res).toEqual(probeData.traceroute1);
		});

		it('should get traceroute successfully (all flags)', async () => {
			const res = await getMeasurement('traceroute2');
			expect(res).toEqual(probeData.traceroute2);
		});
	});

	describe('dns', () => {
		it('should get dns successfully (no flags)', async () => {
			const res = await getMeasurement('dns1');
			expect(res).toEqual(probeData.dns1);
		});

		it('should get dns successfully (all flags)', async () => {
			const res = await getMeasurement('dns2');
			expect(res).toEqual(probeData.dns2);
		});
	});

	describe('mtr', () => {
		it('should get mtr successfully (no flags)', async () => {
			const res = await getMeasurement('mtr1');
			expect(res).toEqual(probeData.mtr1);
		});

		it('should get mtr successfully (all flags)', async () => {
			const res = await getMeasurement('mtr2');
			expect(res).toEqual(probeData.mtr2);
		});
	});

	describe.skip('http', () => {
		it('should get http successfully (no flags)', async () => {
			const res = await getMeasurement('http1');
			expect(res).toEqual(probeData.http1);
		});
	});
});
