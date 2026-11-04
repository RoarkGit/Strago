# Shared base: pnpm at the version package.json pins, plus the manifests.
FROM node:alpine AS base

WORKDIR /usr

ENV PNPM_HOME="/pnpm"
# pnpm 11 puts global binaries in $PNPM_HOME/bin; older versions used $PNPM_HOME.
ENV PATH="$PNPM_HOME/bin:$PNPM_HOME:$PATH"

# Manifests first so the install layers cache independently of source changes.
# pnpm-workspace.yaml carries allowBuilds, without which pnpm install exits 1.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# package.json's packageManager field is the only place the pnpm version lives.
RUN PNPM_VERSION="$(node -p "require('./package.json').packageManager.split('@')[1].split('+')[0]")" \
 && npm install -g "pnpm@$PNPM_VERSION"

FROM base AS build

RUN apk add --no-cache git
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY .git .git
COPY .gitmodules .gitmodules

COPY src ./src
RUN git submodule update --init --recursive
RUN pnpm run build

FROM base

RUN pnpm install --prod --frozen-lockfile
RUN pnpm add -g pm2

COPY --from=build /usr/dist /usr/dist
COPY --from=build /usr/src/data ./data

CMD ["pm2-runtime", "dist", "index.js"]
