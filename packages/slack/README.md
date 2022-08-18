# slack-bot

Slack bot using the Bolt.js framework.

## Setup

1. Refer to the Bolt.js documentation to [create an app](https://slack.dev/bolt-js/tutorial/getting-started#create-an-app) and [setting up tokens](https://slack.dev/bolt-js/tutorial/getting-started#tokens-and-installing-apps) to create the neccessary [Slack App configuration](https://api.slack.com/apps). Make sure to enable Slash command functionality.
2. You will want to enable the following **Bot Token Scopes** under the **OAuth & Permissions** tab in the Slack API page for your application: `chat:write`, `chat:write.public`, `commands`.
3. Setup Globalping command by navigating to the **Slash Commands** tab in your app configuration and create new command `/globalping` with the request URL `https://<yourdomain.com>/slack/events`.

### Development

For development, you will need to install [`ngrok`](https://ngrok.com/) to proxy your local instance to a public URL that your `\globalping` command can interact with.

You will only need the following environment variables: `SLACK_SIGNING_SECRET`, `SLACK_BOT_TOKEN` (xoxb) and save it to a `.env` file. This can be found in your [app configuration](https://api.slack.com/apps).

1. Run `ngrok http 3000`
2. Copy the public URL and replace your `/globalping` request URL with `https://<subdomain>.ngrok.io/slack/events`.

## Production

You will need additional secret tokens when deploying to production for proper OAuth setup. You will need the following env variables:

```
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_STATE_SECRET= // You can choose any string as this will be used to encode/decode oauth flows
```

This can be found in your [app configuration](https://api.slack.com/apps).

Then navigate to **OAuth & Permissions** in your app configuration and click Add a Redirect URL. The redirect URL should be set to your domain with the `slack/oauth_redirect` path appended.

```
https://<yourdomain.com>/slack/oauth_redirect
```

This will enable the OAuth flow at `https://<yourdomain.com>/slack/install`.
