FROM node:18.15-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/bot-utils/package.json packages/bot-utils/package.json
COPY packages/discord/package.json packages/discord/package.json
COPY packages/github/package.json packages/github/package.json
COPY packages/slack/package.json packages/slack/package.json

RUN npm install -g pnpm

RUN pnpm i

CMD pnpm dev
