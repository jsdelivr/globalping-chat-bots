# slack-bot

Slack bot using the Bolt.js framework.

## Setup

Refer to the Bolt.js documentation to [create an app](https://slack.dev/bolt-js/tutorial/getting-started#create-an-app) and [setting up tokens](https://slack.dev/bolt-js/tutorial/getting-started#tokens-and-installing-apps) to create the neccessary [Slack App configuration](https://api.slack.com/apps). Make sure to enable Slash command functionality.

You will want to enable the following **Bot Token Scopes** under the **OAuth & Permissions** tab in the Slack API page for your application:

1. `chat:write`
2. `chat:write.public`
3. `commands`.

Finally, setup Globalping command by navigating to the **Slash Commands** tab in your app configuration and create new command `/globalping` with the request URL `https://<yourdomain.com>/slack/events`.

### Development

For development, you will need to install [`ngrok`](https://ngrok.com/) to proxy your local instance to a public URL that your `\globalping` command can interact with.

You will only need the following environment variables:

```
SLACK_SIGNING_SECRET=
SLACK_BOT_TOKEN=xoxb-
```

For development, you can save these variables in an `.env` file. These variables can be found in your [app configuration](https://api.slack.com/apps).

1. Run `ngrok http 3000`
2. Copy the public URL and replace your `/globalping` request URL with `https://<subdomain>.ngrok.io/slack/events`.

### Production

#### Slack

You will need additional secret tokens when deploying to production for proper OAuth setup. You do not need `SLACK_BOT_TOKEN`. You will need the following env variables:

```
SLACK_SIGNING_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_STATE_SECRET= # You can choose any string as this will be used to encode/decode oauth flows
```

This can be found in your [app configuration](https://api.slack.com/apps).

Then navigate to **OAuth & Permissions** in your app configuration and click Add a Redirect URL. The redirect URL should be set to your domain with the `slack/oauth_redirect` path appended.

```
https://<yourdomain.com>/slack/oauth_redirect
```

This will enable the OAuth flow at `https://<yourdomain.com>/slack/install`.

#### Database

You will also need to setup a MySQL/MariaDB database to store OAuth tokens for all Slack installations. Additional env variables:

```
# MySQL/MariaDB
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_DATABASE=
```

Note before running the app for the first time, run `pnpm run setup-db` which will generate the table `installations` for you which will be used by the Slack App.
