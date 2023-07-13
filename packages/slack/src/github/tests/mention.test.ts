import { describe, expect, it } from 'vitest';

import { cleanUpCommandText, isMentionNotification, parseCommandfromMention, parseFooter, splitMessageFooter } from '../mention';
import { GithubTargetType } from '../types';

describe('Mention', () => {
    describe('parseCommandfromMention', () => {
        it('valid ', () => {
            const text = '@globalping ping 1.2.3.4 --from france --limit 5\r\n -- \r\n abc';
            const ghHandle = 'globalping';
            const cmd = parseCommandfromMention(text, ghHandle);
            expect(cmd).to.equal('ping 1.2.3.4 --from france --limit 5');
        });

        it('wrong gh handle id', () => {
            const text = '@globalping ping 1.2.3.4 --from france --limit 5\r\n -- \r\n abc';
            const ghHandle = 'someuser';
            const cmd = parseCommandfromMention(text, ghHandle);
            expect(cmd).to.equal(undefined);
        });

        it('text before mention', () => {
            const text = 'some other text @globalping ping <http://yahoo.com|yahoo.com> --from france --limit 5\r\n -- \r\n abc';
            const ghHandle = 'globalping';
            const cmd = parseCommandfromMention(text, ghHandle);
            expect(cmd).to.equal(undefined);
        });
    });

    describe('isMentionNotification', () => {
        it('valid ', () => {
            const text = '@globalping ping 1.2.3.4 --from france --limit 5\r\n -- You are receiving this because you were mentioned ... ';
            const ok = isMentionNotification(text);
            expect(ok).to.equal(true);
        });

        it('not valid', () => {
            const text = '@globalping ping 1.2.3.4 --from france --limit 5';
            const ok = isMentionNotification(text);
            expect(ok).to.equal(false);
        });
    });

    describe('splitMessageFooter', () => {
        it('valid ', () => {
            const text = `@gping-dev ping google.com -L 5 --from "UK"

--
Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`;
            const parts = splitMessageFooter(text);
            expect(parts.length).to.equal(2);
            const [message, footer] = parts;
            expect(message).to.equal(`@gping-dev ping google.com -L 5 --from "UK"

--`);
            expect(footer).to.equal(`Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`);
        });

        it('invalid ', () => {
            const text = `@gping-dev ping google.com -L 5 --from "UK"

--
Some invalid footer`;
            const parts = splitMessageFooter(text);
            expect(parts.length).to.equal(0);
        });


    });

    describe('parseFooter', () => {
        it('valid - issue', () => {
            const footer = `Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1234
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1234@github.com>`;
            const ghTarget = parseFooter(footer);
            expect(ghTarget).to.not.equal(undefined);
            expect(ghTarget?.type).to.equal(GithubTargetType.Issue);
            expect(ghTarget?.owner).to.equal('myuser');
            expect(ghTarget?.repo).to.equal('myrepo');
            expect(ghTarget?.id).to.equal(1234);
        });

        it('valid - issue with comment', () => {
            const footer = `Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1234#issuecomment-548794345
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1234/548794345@github.com>`;
            const ghTarget = parseFooter(footer);
            expect(ghTarget).to.not.equal(undefined);
            expect(ghTarget?.type).to.equal(GithubTargetType.Issue);
            expect(ghTarget?.owner).to.equal('myuser');
            expect(ghTarget?.repo).to.equal('myrepo');
            expect(ghTarget?.id).to.equal(1234);
        });

        it('valid - PR', () => {
            const footer = `Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/pull/1234
You are receiving this because you were mentioned.

Message ID: &lt;myuser/myrepo/pull/1234@github.com&gt;`;
            const ghTarget = parseFooter(footer);
            expect(ghTarget).to.not.equal(undefined);
            expect(ghTarget?.type).to.equal(GithubTargetType.PullRequest);
            expect(ghTarget?.owner).to.equal('myuser');
            expect(ghTarget?.repo).to.equal('myrepo');
            expect(ghTarget?.id).to.equal(1234);
        });

        it('valid - PR comment', () => {
            const footer = `Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/pull/1234#issuecomment-c212456
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/pull/1234/c212456@github.com>`;
            const ghTarget = parseFooter(footer);
            expect(ghTarget).to.not.equal(undefined);
            expect(ghTarget?.type).to.equal(GithubTargetType.PullRequest);
            expect(ghTarget?.owner).to.equal('myuser');
            expect(ghTarget?.repo).to.equal('myrepo');
            expect(ghTarget?.id).to.equal(1234);
        });

        it('invalid', () => {
            const footer = `Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1234
You are receiving this because you were mentioned.`;
            const ghTarget = parseFooter(footer);
            expect(ghTarget).to.equal(undefined);
        });
    });

    describe('cleanUpCommandText', () => {
        it('removelink ', async () => {
            const text = '@globalping http [jsdelivr.com](http://jsdelivr.com) --from france --limit 5';
            const result = await cleanUpCommandText(text);
            expect(result).to.equal('@globalping http jsdelivr.com --from france --limit 5');
        });

        it('noop', async () => {
            const text = '@globalping http jsdelivr.com --from france --limit 5';
            const result = await cleanUpCommandText(text);
            expect(result).to.equal('@globalping http jsdelivr.com --from france --limit 5');
        });
    });
});
