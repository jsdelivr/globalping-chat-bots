# slack-bot

Slack bot using the Bolt.js framework.

## Setup

Refer to the Bolt.js documentation to [create an app](https://slack.dev/bolt-js/tutorial/getting-started#create-an-app) and [setting up tokens](https://slack.dev/bolt-js/tutorial/getting-started#tokens-and-installing-apps) to create the neccessary [Slack App configuration](https://api.slack.com/apps). Make sure to enable Slash command functionality.

You will want to enable the following **Bot Token Scopes** under the **OAuth & Permissions** tab in the Slack API page for your application:

1. `chat:write`
2. `chat:write.public`
3. `commands`
4. `channels:read`
5. `groups:read`
6. `im:read`
7. `mpim:read`
8. `im:write`
9. `im:history`
10. `users:read`

Setup the Globalping command by navigating to the **Slash Commands** tab in your app configuration and add the following commands: `/globalping`, `/dns`, `/http`, `/mtr`, `/ping` and `/traceroute`.

Navigate to **Event Subscriptions** in your app configuration and enable the feature. The request URL will also be `https://<yourdomain.com>/slack/events`. Scroll down to **Subscribe to Bot Events** and add `app_uninstalled`, `app_home_opened`, `message.im`, `app_mention` and `member_joined_channel` to the subscribed events.

Navigate to **App Home** in your app configuration and enable `Allow users to send Slash commands and messages from the messages tab`.

Then navigate to **OAuth & Permissions** in your app configuration and click Add a Redirect URL. The redirect URL should be set to your domain with the `slack/oauth_redirect` path appended. e.g. `https://<yourdomain.com>/slack/oauth_redirect`

This will enable the OAuth flow at `https://<yourdomain.com>/slack/install`.

### Env Variables

You will need secret tokens when deploying for proper OAuth setup. You will need the following env variables:

```
SLACK_SIGNING_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_STATE_SECRET= # You can choose any string as this will be used to encode/decode oauth flows
```

This can be found in your [app configuration](https://api.slack.com/apps).

### Database

You will also need to setup a MySQL/MariaDB database to store OAuth tokens for all Slack installations. Additional env variables:

```
# MySQL/MariaDB
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_DATABASE=
```

### Development

Set `SLACK_SOCKET_MODE=true` to enable socket mode for local development.

Go to `http://localhost:3000/slack/install` to install the app to your workspace (after the callback, replace `https` with `http` in the redirect URL to bypass the SSL error).

Run the app with `pnpm dev`.
