FROM node:24-alpine AS builder
# Enable pnpm
RUN corepack enable

WORKDIR /app
# Copy the whole monorepo to build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/agent ./apps/agent
COPY packages/shared ./packages/shared
# (Assuming shared is heavily used, better to bring related packages)

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @ovpn/agent build

# Production image
FROM node:24-alpine AS runner
WORKDIR /app

# Only copy what's necessary to run
COPY --from=builder /app/apps/agent/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/agent/node_modules ./apps/agent/node_modules
COPY --from=builder /app/apps/agent/package.json ./

# Start daemon
CMD ["node", "dist/index.js"]
