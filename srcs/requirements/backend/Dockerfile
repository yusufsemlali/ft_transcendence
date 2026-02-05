FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

# Copy shared contracts
COPY shared/contracts ./shared/contracts

# Setup backend
WORKDIR /app/backend
COPY backend/package.json backend/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY backend/ .

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
