import { describe, expect, it } from 'vitest';

import { parseArgs } from '../src/utils';

describe('Utils', () => {
	describe('parseArgs', () => {
		it('should parse args', () => {
			const args = 'http google.com from New York --limit 2 --path / --query ?a=abc --host google.com --method get --port 80 --protocol https --resolver 0.0.0.0 --header Content-Encoding: gzip --header Content-Type: text/html; charset=utf-8';
			const result = parseArgs(args);

			expect(result).toEqual({
				_: ['http', 'google.com'],
				from: ['New', 'York'],
				header: [
					'Content-Encoding:',
					'gzip',
					'Content-Type:',
					'text/html;',
					'charset=utf-8',
				],
				host: ['google.com'],
				limit: [2],
				method: ['get'],
				path: ['/'],
				port: [80],
				protocol: ['https'],
				query: ['?a=abc'],
				resolver: ['0.0.0.0']
			});
		});

		it('should infer url for http parse', () => {
			const args = 'http https://google.com:80/test?a=abc from New York --limit 2 --method get --resolver 0.0.0.0 --header Content-Encoding: gzip --header Content-Type: text/html; charset=utf-8';
			const result = parseArgs(args.split(' '));

			expect(result).toEqual({
				_: ['http', 'https://google.com:80/test?a=abc'],
				from: ['New', 'York'],
				header: [
					'Content-Encoding:',
					'gzip',
					'Content-Type:',
					'text/html;',
					'charset=utf-8',
				],
				host: ['google.com'],
				limit: [2],
				method: ['get'],
				path: ['/test'],
				port: [80],
				protocol: ['https'],
				query: ['?a=abc'],
				resolver: ['0.0.0.0']
			});
		});
	});
});
