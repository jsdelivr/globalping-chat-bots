import { describe, expect, it } from 'vitest';

import { getRawTextFromBlocks } from '../mention.js';

describe('Mention', () => {
	describe('getRawTextFromBlocks', () => {
		it('should return only the text', () => {
			const blocks = [
				{
					type: 'rich_text',
					block_id: '4T2L4',
					elements: [
						{
							type: 'rich_text_section',
							elements: [
								{
									type: 'emoji',
									name: 'laughing',
									unicode: '1f606',
								},
								{
									type: 'text',
									text: '  ',
								},
								{
									type: 'text',
									text: ' ping ',
								},
								{
									type: 'link',
									url: 'http://google.com',
									text: 'google.com',
								},
							],
						},
					],
				},
			];
			const text = getRawTextFromBlocks('U07QAK46BGU', blocks);
			expect(text).to.equal('ping google.com');
		});

		it('should return the text after the mention', () => {
			const blocks = [
				{
					type: 'rich_text',
					block_id: '4T2L4',
					elements: [
						{
							type: 'rich_text_section',
							elements: [
								{
									type: 'text',
									text: 'xxxxx ',
								},
								{
									type: 'emoji',
									name: 'laughing',
									unicode: '1f606',
								},
								{
									type: 'text',
									text: ' ',
								},
								{
									type: 'user',
									user_id: 'U07QAK46BGU',
								},
								{
									type: 'text',
									text: ' ping ',
								},
								{
									type: 'link',
									url: 'http://google.com',
									text: 'google.com',
								},
							],
						},
					],
				},
			];
			const text = getRawTextFromBlocks('U07QAK46BGU', blocks);
			expect(text).to.equal('ping google.com');
		});
	});
});
