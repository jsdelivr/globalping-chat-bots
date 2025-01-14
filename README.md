# globalping-chat-bots

Discord, Slack and Github bot codebase.

## Initial Setup

To run this setup, you need Node.js 20 installed. This monorepo uses PNPM workspaces and you can install `pnpm` by either running `corepack enable` or `npm i pnpm -g`.

1. Clone repository
2. `pnpm install`
3. Finish the application setup for each bot (separate apps/tokens should be setup for dev and prod)
4. Deploy to a Render instance or run locally

## Discord Application Setup

Refer to the `discord bot` [README](https://github.com/jsdelivr/globalping-chat-bots/tree/master/packages/discord).

## Slack Application Setup

<a href="https://bots.globalping.io/slack/install"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>

Refer to the `slack bot` [README](https://github.com/jsdelivr/globalping-chat-bots/tree/master/packages/slack).

## Github Application Setup

Refer to the `github bot` [README](https://github.com/jsdelivr/globalping-chat-bots/tree/master/packages/github).

## Deployment

Build command: `pnpm install`
Start command: `pnpm start`
