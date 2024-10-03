import { describe, expect, it } from 'vitest';

import { expandFlags } from '../src/utils';

describe('Discord utils', () => {
	it('should expand flags (empty)', () => {
		const flags = {
			cmd: 'ping',
			target: 'jsdelivr.com',
			from: 'New York',
			limit: undefined as unknown as number,
			packets: undefined,
			protocol: undefined,
			port: undefined,
			resolver: undefined,
			trace: undefined,
		};
		expect(expandFlags(flags)).toBe('');
	});

	it('should expand flags (some)', () => {
		const flags = {
			cmd: 'ping',
			target: 'jsdelivr.com',
			from: 'New York',
			limit: 1,
			packets: 1,
			protocol: 'icmp',
			port: 80,
		};
		expect(expandFlags(flags)).toBe(
			'--limit 1 --packets 1 --protocol icmp --port 80'
		);
	});
});
