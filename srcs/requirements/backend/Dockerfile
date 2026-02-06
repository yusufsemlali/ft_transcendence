FROM node:20-alpine

WORKDIR /app/backend

RUN npm install -g pnpm

# Copy package files first for caching
COPY backend/package.json backend/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY backend/ .

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
