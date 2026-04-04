# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

# Copy workspace config
COPY pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy workspace packages
COPY srcs/requirements/shared/contracts ./srcs/requirements/shared/contracts
COPY srcs/requirements/chat ./srcs/requirements/chat

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the chat service
RUN pnpm --filter ft_transcendence-chat build

# Prune for production - creates a self-contained bundle
# Using --legacy flag for pnpm v10 compatibility with workspaces
RUN pnpm --filter ft_transcendence-chat --prod deploy /pruned --legacy

# Production stage
FROM node:20-alpine

WORKDIR /app

# Only copy the pruned production bundle
COPY --from=builder /pruned .

EXPOSE 3000

CMD ["node", "dist/server.js"]