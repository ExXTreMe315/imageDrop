ARG NODE_VERSION=22.20.0

FROM node:${NODE_VERSION}-slim AS base

ARG PORT=3000

WORKDIR /src

# Build
FROM base AS build

RUN npm install -g pnpm

COPY --link package.json pnpm-lock.yaml ./
RUN pnpm install

COPY --link ../../Downloads/img-main .

RUN pnpm build

# Run
FROM base

ENV PORT=$PORT
ENV NODE_ENV=production

COPY --from=build /src/.output /src/.output
# Optional, only needed if you rely on unbundled dependencies
# COPY --from=build /src/node_modules /src/node_modules

CMD [ "node", ".output/server/index.mjs" ]
