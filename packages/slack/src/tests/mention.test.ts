import { describe, expect, it } from 'vitest';

import { parseCommandfromMention } from '../mention';

describe('Mention', () => {
	describe('parseCommandfromMention', () => {
		it('valid with url link', () => {
			const text =
				'<@U052V9JLQ5C> http <http://yahoo.com|yahoo.com> --from uk --limit 5';
			const botUserId = 'U052V9JLQ5C';
			const cmd = parseCommandfromMention(text, botUserId);
			expect(cmd).to.equal('http yahoo.com --from uk --limit 5');
		});

		it('valid with url link and query', () => {
			const text =
				'<@U052V9JLQ5C> http <http://yahoo.com?abc=xyz1|yahoo.com> --from uk';
			const botUserId = 'U052V9JLQ5C';
			const cmd = parseCommandfromMention(text, botUserId);
			expect(cmd).to.equal('http yahoo.com --from uk');
		});

		it('valid with just complex url link', () => {
			const text =
				'<@U052V9JLQ5C> http <https://www.example.com:8080/my/path?x=abc&yz=defg> --from france --limit 5';
			const botUserId = 'U052V9JLQ5C';
			const cmd = parseCommandfromMention(text, botUserId);
			expect(cmd).to.equal(
				'http https://www.example.com:8080/my/path?x=abc&yz=defg --from france --limit 5'
			);
		});

		it('valid with host', () => {
			const text = '<@U052V9JLQ5C> dns yahoo.com --from france --limit 5';
			const botUserId = 'U052V9JLQ5C';
			const cmd = parseCommandfromMention(text, botUserId);
			expect(cmd).to.equal('dns yahoo.com --from france --limit 5');
		});

		it('valid with ip', () => {
			const text = '<@U052V9JLQ5C> ping 1.2.3.4 --from france --limit 5';
			const botUserId = 'U052V9JLQ5C';
			const cmd = parseCommandfromMention(text, botUserId);
			expect(cmd).to.equal('ping 1.2.3.4 --from france --limit 5');
		});

		it('wrong user id', () => {
			const text =
				'<@U061X8OMS7D> ping <http://yahoo.com|yahoo.com> --from france --limit 5';
			const botUserId = 'U052V9JLQ5C';
			const cmd = parseCommandfromMention(text, botUserId);
			expect(cmd).to.equal('');
		});

		it('text before mention', () => {
			const text =
				'some other text <@U052V9JLQ5C> ping <http://yahoo.com|yahoo.com> --from france --limit 5';
			const botUserId = 'U052V9JLQ5C';
			const cmd = parseCommandfromMention(text, botUserId);
			expect(cmd).to.equal('');
		});
	});
});
