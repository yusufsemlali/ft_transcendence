FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

# Copy shared contracts
COPY shared/contracts ./shared/contracts

# Setup frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY frontend/ .

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
