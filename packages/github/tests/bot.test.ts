import { generateHelp, HttpProbeResult } from '@globalping/bot-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	Bot,
	cleanUpCommandText,
	isMentionNotification,
	parseCommandfromMention,
	parseFooter,
	splitMessageFooter,
} from '../src/bot.js';

import {
	Config,
	GithubNotificationRequest,
	GithubTargetType,
} from '../src/types.js';
import {
	getDefaultDnsResponse,
	getDefaultHttpResponse,
	getDefaultMtrResponse,
	getDefaultPingResponse,
	getDefaultTracerouteResponse,
	mockGetMeasurement,
	mockGithubClient,
	mockIncomingMessage,
	mockLogger,
	mockPostMeasurement,
} from './utils.js';

describe('Bot', () => {
	afterEach(() => {
		vi.resetAllMocks();
	});

	const loggerMock = mockLogger();
	const githubClientMock = mockGithubClient();
	const postMeasurementMock = mockPostMeasurement();
	const getMeasurementMock = mockGetMeasurement();
	const configMock: Config = {
		globalpingToken: 'globalping_token',
		githubPersonalAccessToken: 'access_token',
		githubBotApiKey: 'api_key',
		githubBotHandle: 'globalping',
	};

	const expectedHelpTexts = generateHelp(
		'**',
		`@${configMock.githubBotHandle}`,
		new Set([ 'auth', 'limits' ]),
	);

	const bot = new Bot(
		configMock,
		loggerMock,
		githubClientMock,
		postMeasurementMock,
		getMeasurementMock,
	);

	describe('HandleRequest', () => {
		it('should succesfully handle the command - ping', async () => {
			const githubRequest: GithubNotificationRequest = {
				subject: '',
				bodyPlain: `@globalping ping google.com

--
Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`,
			};

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultPingResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			const req = mockIncomingMessage(
				{
					headers: {
						'api-key': configMock.githubBotApiKey,
					},
				},
				Buffer.from(JSON.stringify(githubRequest)),
			);

			const res = {
				writeHead: vi.fn(),
				write: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.HandleRequest(req, res);

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'ping',
					target: 'google.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {},
				},
				'globalping_token',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			expect(githubClientMock.rest.issues.createComment).toHaveBeenCalledWith({
				owner: 'myuser',
				repo: 'myrepo',
				issue_number: 1,
				body: `Here are the results for \`ping google.com\`
> **Amsterdam, NL, EU, Gigahost AS (AS56655)**
\`\`\`
${expectedResponse.results[0].result.rawOutput}
\`\`\`
`,
			});
		});

		it('should succesfully handle the command - dns', async () => {
			const githubRequest: GithubNotificationRequest = {
				subject: '',
				bodyPlain: `@globalping dns google.com from Berlin --resolver 1.1.1.1

--
Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`,
			};

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultDnsResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			const req = mockIncomingMessage(
				{
					headers: {
						'api-key': configMock.githubBotApiKey,
					},
				},
				Buffer.from(JSON.stringify(githubRequest)),
			);

			const res = {
				writeHead: vi.fn(),
				write: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.HandleRequest(req, res);

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'dns',
					target: 'google.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'Berlin' }],
					measurementOptions: {
						resolver: '1.1.1.1',
					},
				},
				'globalping_token',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			expect(githubClientMock.rest.issues.createComment).toHaveBeenCalledWith({
				owner: 'myuser',
				repo: 'myrepo',
				issue_number: 1,
				body: `Here are the results for \`dns google.com from Berlin --resolver 1.1.1.1\`
> **Helsinki, FI, EU, Hetzner Online GmbH (AS24940)**
\`\`\`
${expectedResponse.results[0].result.rawOutput.trim()}
\`\`\`
`,
			});
		});

		it('should succesfully handle the command - http', async () => {
			const githubRequest: GithubNotificationRequest = {
				subject: '',
				bodyPlain: `@globalping http jsdelivr.com --host www.jsdelivr.com --protocol https --port 443 --path "/package/npm/test" --query "nav=stats"

--
Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`,
			};

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultHttpResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			const req = mockIncomingMessage(
				{
					headers: {
						'api-key': configMock.githubBotApiKey,
					},
				},
				Buffer.from(JSON.stringify(githubRequest)),
			);

			const res = {
				writeHead: vi.fn(),
				write: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.HandleRequest(req, res);

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'http',
					target: 'jsdelivr.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {
						port: 443,
						protocol: 'HTTPS',
						request: {
							headers: {},
							host: 'www.jsdelivr.com',
							path: '/package/npm/test',
							query: 'nav=stats',
						},
					},
				},
				'globalping_token',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			expect(githubClientMock.rest.issues.createComment).toHaveBeenCalledWith({
				owner: 'myuser',
				repo: 'myrepo',
				issue_number: 1,
				body: `Here are the results for \`http jsdelivr.com --host www.jsdelivr.com --protocol https --port 443 --path "/package/npm/test" --query "nav=stats"\`
> **Chisinau, MD, EU, STARK INDUSTRIES SOLUTIONS LTD (AS44477)**
\`\`\`
${expectedResponse.results[0].result.rawOutput}
\`\`\`
`,
			});
		});

		it('should succesfully handle the command - http tls details', async () => {
			const githubRequest: GithubNotificationRequest = {
				subject: '',
				bodyPlain: `@globalping http jsdelivr.com --protocol https --full

--
Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`,
			};

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultHttpResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			const req = mockIncomingMessage(
				{
					headers: {
						'api-key': configMock.githubBotApiKey,
					},
				},
				Buffer.from(JSON.stringify(githubRequest)),
			);

			const res = {
				writeHead: vi.fn(),
				write: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.HandleRequest(req, res);

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'http',
					target: 'jsdelivr.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {
						protocol: 'HTTPS',
						request: {
							headers: {},
							method: 'GET',
							host: 'jsdelivr.com',
							path: '/',
						},
					},
				},
				'globalping_token',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			expect(githubClientMock.rest.issues.createComment).toHaveBeenCalledWith({
				owner: 'myuser',
				repo: 'myrepo',
				issue_number: 1,
				body: `Here are the results for \`http jsdelivr.com --protocol https --full\`
> **Chisinau, MD, EU, STARK INDUSTRIES SOLUTIONS LTD (AS44477)**
\`\`\`
TLSv1.3/TLS_AES_256_GCM_SHA384
Subject: www.jsdelivr.com; DNS:www.jsdelivr.com
Issuer: E6; Let's Encrypt; US
Validity: 2024-11-09T23:42:06.000Z; 2025-02-07T23:42:05.000Z
Serial number: 04:F7:8C:6D:25:44:42:1D:C3:0C:9D:77:0C:E1:89:60:95:2F
Fingerprint: 46:CF:F6:55:D2:66:13:4E:65:83:25:3E:4D:5D:E5:AA:88:15:BE:FA:FC:4E:A8:6A:42:CE:B0:63:FF:0E:88:83
Key type: EC256

HTTP/1.1 200
${(expectedResponse.results[0].result as HttpProbeResult).rawHeaders}

${(expectedResponse.results[0].result as HttpProbeResult).rawBody?.trim()}
\`\`\`
`,
			});
		});

		it('should succesfully handle the command - mtr', async () => {
			const githubRequest: GithubNotificationRequest = {
				subject: '',
				bodyPlain: `@globalping mtr google.com

--
Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`,
			};

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultMtrResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			const req = mockIncomingMessage(
				{
					headers: {
						'api-key': configMock.githubBotApiKey,
					},
				},
				Buffer.from(JSON.stringify(githubRequest)),
			);

			const res = {
				writeHead: vi.fn(),
				write: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.HandleRequest(req, res);

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'mtr',
					target: 'google.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {},
				},
				'globalping_token',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			expect(githubClientMock.rest.issues.createComment).toHaveBeenCalledWith({
				owner: 'myuser',
				repo: 'myrepo',
				issue_number: 1,
				body: `Here are the results for \`mtr google.com\`
> **Beauharnois, CA, NA, OVH SAS (AS16276)**
\`\`\`
${expectedResponse.results[0].result.rawOutput.trim()}
\`\`\`
`,
			});
		});

		it('should succesfully handle the command - traceroute', async () => {
			const githubRequest: GithubNotificationRequest = {
				subject: '',
				bodyPlain: `@globalping traceroute google.com

--
Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`,
			};

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultTracerouteResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			const req = mockIncomingMessage(
				{
					headers: {
						'api-key': configMock.githubBotApiKey,
					},
				},
				Buffer.from(JSON.stringify(githubRequest)),
			);

			const res = {
				writeHead: vi.fn(),
				write: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.HandleRequest(req, res);

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'traceroute',
					target: 'google.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {},
				},
				'globalping_token',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			expect(githubClientMock.rest.issues.createComment).toHaveBeenCalledWith({
				owner: 'myuser',
				repo: 'myrepo',
				issue_number: 1,
				body: `Here are the results for \`traceroute google.com\`
> **Rotterdam, NL, EU, DELTA Fiber Nederland B.V. (AS15435)**
\`\`\`
${expectedResponse.results[0].result.rawOutput.trim()}
\`\`\`
`,
			});
		});

		it('should output truncation text and full results link', async () => {
			const bot = new Bot(
				configMock,
				loggerMock,
				githubClientMock,
				postMeasurementMock,
				getMeasurementMock,
			);
			bot.messageSizeLimit = 1000;
			const githubRequest: GithubNotificationRequest = {
				subject: '',
				bodyPlain: `@globalping http jsdelivr.com --host www.jsdelivr.com --protocol https --port 443 --path "/package/npm/test" --query "nav=stats"

--
Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`,
			};

			postMeasurementMock.mockResolvedValue({
				id: 'm345ur3m3nt',
				probesCount: 1,
			});

			const expectedResponse = getDefaultHttpResponse();
			getMeasurementMock.mockResolvedValue(expectedResponse);

			const req = mockIncomingMessage(
				{
					headers: {
						'api-key': configMock.githubBotApiKey,
					},
				},
				Buffer.from(JSON.stringify(githubRequest)),
			);

			const res = {
				writeHead: vi.fn(),
				write: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.HandleRequest(req, res);

			expect(postMeasurementMock).toHaveBeenCalledWith(
				{
					type: 'http',
					target: 'jsdelivr.com',
					inProgressUpdates: false,
					limit: 1,
					locations: [{ magic: 'world' }],
					measurementOptions: {
						port: 443,
						protocol: 'HTTPS',
						request: {
							headers: {},
							host: 'www.jsdelivr.com',
							path: '/package/npm/test',
							query: 'nav=stats',
						},
					},
				},
				'globalping_token',
			);

			expect(getMeasurementMock).toHaveBeenCalledWith('m345ur3m3nt');

			expect(githubClientMock.rest.issues.createComment).toHaveBeenCalledWith({
				owner: 'myuser',
				repo: 'myrepo',
				issue_number: 1,
				body: `Here are the results for \`http jsdelivr.com --host www.jsdelivr.com --protocol https --port 443 --path "/package/npm/test" --query "nav=stats"\`
> **Chisinau, MD, EU, STARK INDUSTRIES SOLUTIONS LTD (AS44477)**
\`\`\`
${expectedResponse.results[0].result.rawOutput.trim().slice(0, 637)}
... (truncated)
\`\`\`> **Full results available here: [https://globalping.io?measurement=m345ur3m3nt](https://globalping.io?measurement=m345ur3m3nt)**
`,
			});
		});

		it('should return help text - empty command', async () => {
			const githubRequest: GithubNotificationRequest = {
				subject: '',
				bodyPlain: `@globalping

--
Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`,
			};

			const req = mockIncomingMessage(
				{
					headers: {
						'api-key': configMock.githubBotApiKey,
					},
				},
				Buffer.from(JSON.stringify(githubRequest)),
			);

			const res = {
				writeHead: vi.fn(),
				write: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.HandleRequest(req, res);

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(githubClientMock.rest.issues.createComment).toHaveBeenCalledWith({
				owner: 'myuser',
				repo: 'myrepo',
				issue_number: 1,
				body: expectedHelpTexts.general,
			});
		});

		it('should return help text - help command', async () => {
			const githubRequest: GithubNotificationRequest = {
				subject: '',
				bodyPlain: `@globalping help

--
Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`,
			};

			const req = mockIncomingMessage(
				{
					headers: {
						'api-key': configMock.githubBotApiKey,
					},
				},
				Buffer.from(JSON.stringify(githubRequest)),
			);

			const res = {
				writeHead: vi.fn(),
				write: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.HandleRequest(req, res);

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(githubClientMock.rest.issues.createComment).toHaveBeenCalledWith({
				owner: 'myuser',
				repo: 'myrepo',
				issue_number: 1,
				body: expectedHelpTexts.general,
			});
		});

		it('should return help text - ping command', async () => {
			const githubRequest: GithubNotificationRequest = {
				subject: '',
				bodyPlain: `@globalping help ping

--
Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`,
			};

			const req = mockIncomingMessage(
				{
					headers: {
						'api-key': configMock.githubBotApiKey,
					},
				},
				Buffer.from(JSON.stringify(githubRequest)),
			);

			const res = {
				writeHead: vi.fn(),
				write: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.HandleRequest(req, res);

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(githubClientMock.rest.issues.createComment).toHaveBeenCalledWith({
				owner: 'myuser',
				repo: 'myrepo',
				issue_number: 1,
				body: expectedHelpTexts.ping,
			});
		});

		it('should return help text - dns command', async () => {
			const githubRequest: GithubNotificationRequest = {
				subject: '',
				bodyPlain: `@globalping help dns

--
Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`,
			};

			const req = mockIncomingMessage(
				{
					headers: {
						'api-key': configMock.githubBotApiKey,
					},
				},
				Buffer.from(JSON.stringify(githubRequest)),
			);

			const res = {
				writeHead: vi.fn(),
				write: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.HandleRequest(req, res);

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(githubClientMock.rest.issues.createComment).toHaveBeenCalledWith({
				owner: 'myuser',
				repo: 'myrepo',
				issue_number: 1,
				body: expectedHelpTexts.dns,
			});
		});

		it('should return help text - mtr command', async () => {
			const githubRequest: GithubNotificationRequest = {
				subject: '',
				bodyPlain: `@globalping help mtr

--
Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`,
			};

			const req = mockIncomingMessage(
				{
					headers: {
						'api-key': configMock.githubBotApiKey,
					},
				},
				Buffer.from(JSON.stringify(githubRequest)),
			);

			const res = {
				writeHead: vi.fn(),
				write: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.HandleRequest(req, res);

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(githubClientMock.rest.issues.createComment).toHaveBeenCalledWith({
				owner: 'myuser',
				repo: 'myrepo',
				issue_number: 1,
				body: expectedHelpTexts.mtr,
			});
		});

		it('should return help text - http command', async () => {
			const githubRequest: GithubNotificationRequest = {
				subject: '',
				bodyPlain: `@globalping help http

--
Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`,
			};

			const req = mockIncomingMessage(
				{
					headers: {
						'api-key': configMock.githubBotApiKey,
					},
				},
				Buffer.from(JSON.stringify(githubRequest)),
			);

			const res = {
				writeHead: vi.fn(),
				write: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.HandleRequest(req, res);

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(githubClientMock.rest.issues.createComment).toHaveBeenCalledWith({
				owner: 'myuser',
				repo: 'myrepo',
				issue_number: 1,
				body: expectedHelpTexts.http,
			});
		});

		it('should return help text - traceroute command', async () => {
			const githubRequest: GithubNotificationRequest = {
				subject: '',
				bodyPlain: `@globalping help traceroute

--
Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`,
			};

			const req = mockIncomingMessage(
				{
					headers: {
						'api-key': configMock.githubBotApiKey,
					},
				},
				Buffer.from(JSON.stringify(githubRequest)),
			);

			const res = {
				writeHead: vi.fn(),
				write: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.HandleRequest(req, res);

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(githubClientMock.rest.issues.createComment).toHaveBeenCalledWith({
				owner: 'myuser',
				repo: 'myrepo',
				issue_number: 1,
				body: expectedHelpTexts.traceroute,
			});
		});

		it('should return help texts - invalid command', async () => {
			const githubRequest: GithubNotificationRequest = {
				subject: '',
				bodyPlain: `@globalping help auth

--
Reply to this email directly or view it on GitHub:
https://github.com/myuser/myrepo/issues/1
You are receiving this because you were mentioned.

Message ID: <myuser/myrepo/issues/1@github.com>`,
			};

			const req = mockIncomingMessage(
				{
					headers: {
						'api-key': configMock.githubBotApiKey,
					},
				},
				Buffer.from(JSON.stringify(githubRequest)),
			);

			const res = {
				writeHead: vi.fn(),
				write: vi.fn(),
				end: vi.fn(),
			} as any;

			await bot.HandleRequest(req, res);

			expect(postMeasurementMock).toHaveBeenCalledTimes(0);

			expect(getMeasurementMock).toHaveBeenCalledTimes(0);

			expect(githubClientMock.rest.issues.createComment).toHaveBeenCalledWith({
				owner: 'myuser',
				repo: 'myrepo',
				issue_number: 1,
				body: expectedHelpTexts.unknownCommand,
			});
		});
	});

	describe('parseCommandfromMention', () => {
		it('valid ', () => {
			const text
				= '@globalping ping 1.2.3.4 --from france --limit 5\r\n -- \r\n abc';
			const ghHandle = 'globalping';
			const cmd = parseCommandfromMention(text, ghHandle);
			expect(cmd).to.equal('ping 1.2.3.4 --from france --limit 5');
		});

		it('wrong gh handle id', () => {
			const text
				= '@globalping ping 1.2.3.4 --from france --limit 5\r\n -- \r\n abc';
			const ghHandle = 'someuser';
			const cmd = parseCommandfromMention(text, ghHandle);
			expect(cmd).to.equal(undefined);
		});

		it('text before mention', () => {
			const text
				= 'some other text @globalping ping <http://yahoo.com|yahoo.com> --from france --limit 5\r\n -- \r\n abc';
			const ghHandle = 'globalping';
			const cmd = parseCommandfromMention(text, ghHandle);
			expect(cmd).to.equal(undefined);
		});
	});

	describe('isMentionNotification', () => {
		it('valid ', () => {
			const text
				= '@globalping ping 1.2.3.4 --from france --limit 5\r\n -- You are receiving this because you were mentioned ... ';
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
			const [ message, footer ] = parts;
			expect(message).to.equal(`@gping-dev ping google.com -L 5 --from "UK"

--`);

			expect(footer).to
				.equal(`Reply to this email directly or view it on GitHub:
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
			const text
				= '@globalping http [jsdelivr.com](http://jsdelivr.com) --from france --limit 5';
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
