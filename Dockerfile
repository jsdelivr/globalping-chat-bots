FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/bot-utils/package.json packages/bot-utils/package.json
COPY packages/discord/package.json packages/discord/package.json
COPY packages/github/package.json packages/github/package.json
COPY packages/slack/package.json packages/slack/package.json
COPY packages/main/package.json packages/main/package.json

RUN npm install -g pnpm

RUN pnpm i

CMD pnpm start:dev
