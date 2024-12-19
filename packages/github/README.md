# github

### Env Variables

The following env variables are needed for the Github Bot:

```
# A secret API Key that will allow authenticating http requests to the endpoint
GITHUB_BOT_API_KEY=
# The github username of the bot (globalping in this case for the prod version)
GITHUB_BOT_HANDLE=
# A Github Personal Access Token for the Github bot user account, with the public_repo scope selected
GITHUB_PERSONAL_ACCESS_TOKEN=
```

### Zapier Configuration

In Zapier, you need to configure a Zap with 2 steps:

- Email By Zapier / Inbound Email
- Code By Zapier / Javascript

#### Zap Step 1 - Email By Zapier

The github bot user account should be set to send the github notifications to the Email By Zapier email address configured in this step.

#### Zap Step 2 - Code By Zapier

The input data fields should be set as follows:

- fromEmail: Set to the `From Email` field from Step 1
- subject: Set to the `Subject` field from Step 1
- bodyPlain: Set to the `Body Plain` field from Step 1
- targetUrl: Set to `https://<slack-app-domain>/github-bot``
- notificationsSourceEmail: Set to `notifications@github.com`
- apiKey: Set to the value of the slack app env variable `GITHUB_BOT_API_KEY`
- sleepTimeout: Set to `500`

The code should be set to the following:

```javascript
if (inputData.fromEmail != inputData.notificationsSourceEmail) {
	output = { posted: false, reason: 'NOT_GH_NOTIFICATION_EMAIL' };
	return;
}

const requestBody = {
	subject: inputData.subject,
	bodyPlain: inputData.bodyPlain,
};

fetch(inputData.targetUrl, {
	method: 'POST',
	headers: {
		Accept: 'application/json',
		'Content-Type': 'application/json',
		'API-KEY': inputData.apiKey,
	},
	body: JSON.stringify(requestBody),
});

// sleep ms to wait for data to be posted
await new Promise((r) => setTimeout(r, inputData.sleepTimeout));

output = {
	posted: true,
};
```
