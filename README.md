# globalping-chat-bots

Discord and Slack bot codebase.

## Initial Setup

To run this setup, you need Node.js 16 installed. This monorepo uses PNPM workspaces and you can install `pnpm` by either running `corepack enable` or `npm i pnpm -g`.

1. Clone repository
2. `pnpm install`
3. Finish Discord and Slack application setup
4. Deploy to a Render instance or run locally

## Discord Application Setup

Refer to the `discord bot` [README](https://github.com/jsdelivr/globalping-chat-bots/tree/master/packages/discord).

## Slack Application Setup

<a href="https://bots.globalping.io/slack/install"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>

Refer to the `slack bot` [README](https://github.com/jsdelivr/globalping-chat-bots/tree/master/packages/slack).

## Deployment

Build command: `pnpm install`
Start command: `pnpm start`

Environment variables to load:

```
DISCORD_TOKEN=
DISCORD_APP_ID=

SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_STATE_SECRET= // You can choose any string as this will be used to encode/decode oauth flows

DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_DATABASE=
```

Once ready, you can install Slack Apps with `https://<yourdomain.com>/slack/install` and Discord Bots with the generated invite URL setup in the Discord Application Setup README.
