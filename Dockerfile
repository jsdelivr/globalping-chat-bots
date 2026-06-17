FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates git \
	&& rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/bot-utils/package.json packages/bot-utils/package.json
COPY packages/discord/package.json packages/discord/package.json
COPY packages/github/package.json packages/github/package.json
COPY packages/slack/package.json packages/slack/package.json
COPY packages/main/package.json packages/main/package.json

RUN pnpm install --frozen-lockfile --prod=false

COPY packages ./packages

RUN pnpm -r build \
	&& pnpm --filter main deploy --prod /prod/main

FROM node:20-slim

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=node:node /prod/main ./

USER node

EXPOSE 3000

CMD [ "node", "dist/src/main.js" ]
