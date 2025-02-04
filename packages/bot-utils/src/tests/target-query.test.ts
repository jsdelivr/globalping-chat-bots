import { describe, expect, it } from 'vitest';

import {
	findAndRemoveResolver,
	parseTargetQuery,
	TargetQuery,
} from '../target-query.js';

describe('Utils', () => {
	describe('parseTargetQuery', () => {
		it('simple', () => {
			const cmd = 'ping';
			const args = [ 'example.com' ];

			const q: TargetQuery = parseTargetQuery(cmd, args);

			expect(q.target).toEqual('example.com');
			expect(q.from).toEqual(undefined);
		});

		it('simple with resolver', () => {
			const cmd = 'dns';
			const args = [ 'example.com', '@1.1.1.1' ];

			const q: TargetQuery = parseTargetQuery(cmd, args);

			expect(q.target).toEqual('example.com');
			expect(q.from).toEqual(undefined);
			expect(q.resolver).toEqual('1.1.1.1');
		});

		it('resolver not allowed', () => {
			const cmd = 'ping';
			const args = [ 'example.com', '@1.1.1.1' ];

			expect(() => parseTargetQuery(cmd, args)).toThrowError('does not accept a resolver argument');
		});

		it('target from x', () => {
			const cmd = 'ping';
			const args = [ 'example.com', 'from', 'London' ];

			const q: TargetQuery = parseTargetQuery(cmd, args);

			expect(q.target).toEqual('example.com');
			expect(q.from).toEqual('London');
		});

		it('target from x with resolver', () => {
			const cmd = 'http';
			const args = [ 'example.com', 'from', 'London', '@1.1.1.1' ];

			const q: TargetQuery = parseTargetQuery(cmd, args);

			expect(q.target).toEqual('example.com');
			expect(q.from).toEqual('London');
			expect(q.resolver).toEqual('1.1.1.1');
		});
	});

	describe('findAndRemoveResolver', () => {
		it('simple no resolver', () => {
			const args = [ 'example.com' ];

			const [ resolver, argsWithoutResolver ] = findAndRemoveResolver(args);

			expect(resolver).toEqual('');
			expect(argsWithoutResolver).toEqual(args);
		});

		it('no resolver', () => {
			const args = [ 'example.com', 'from', 'London' ];

			const [ resolver, argsWithoutResolver ] = findAndRemoveResolver(args);

			expect(resolver).toEqual('');
			expect(argsWithoutResolver).toEqual(args);
		});

		it('resolver and from', () => {
			const args = [ 'example.com', '@1.1.1.1', 'from', 'London' ];

			const [ resolver, argsWithoutResolver ] = findAndRemoveResolver(args);

			expect(resolver).toEqual('1.1.1.1');
			expect(argsWithoutResolver).toEqual([ 'example.com', 'from', 'London' ]);
		});

		it('resolver only', () => {
			const args = [ 'example.com', '@1.1.1.1' ];

			const [ resolver, argsWithoutResolver ] = findAndRemoveResolver(args);

			expect(resolver).toEqual('1.1.1.1');
			expect(argsWithoutResolver).toEqual([ 'example.com' ]);
		});
	});
});
