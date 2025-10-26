# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=22.18.0
FROM node:${NODE_VERSION}-trixie-slim AS base

LABEL fly_launch_runtime="Node.js"

# Set default shell used for running commands
SHELL ["/bin/bash", "-o", "pipefail", "-o", "errexit", "-c"]

# Node.js app lives here
WORKDIR /app

# Configure pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Set production environment
ENV \
  # Configure the IP to bind to when serving traffic
  HOST="0.0.0.0" \
  # Use production settings for nodejs based tools
  NODE_ENV="production"

RUN apt-get update -qq && apt-get install --no-install-recommends -y dumb-init

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

WORKDIR /build

# Copy package.json for Corepack
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Configure Corepack
RUN \
  corepack enable; \
  corepack prepare --activate;

# Install node modules
RUN pnpm install --prefer-frozen-lockfile

# Copy application code
COPY . .

# Build application
RUN pnpm build

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /build/dist /app
COPY --from=build /build/migrations /app/migrations
COPY --from=build /build/pnpm-lock.yaml /build/package.json /app/

# Configure Corepack
RUN \
  corepack enable; \
  corepack prepare --activate;

RUN pnpm install --prod --prefer-frozen-lockfile

RUN echo $(which dumb-init)

# Set container dumb-init as default entry point
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "node", "bin/start.js" ]
