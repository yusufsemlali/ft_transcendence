FROM node:20-alpine

WORKDIR /app/frontend

RUN npm install -g pnpm

# Copy package files first for caching
COPY frontend/package.json frontend/pnpm-lock.yaml ./

RUN pnpm install

COPY frontend/ .

EXPOSE 3000

CMD ["sh", "-c", "pnpm run build && pnpm run start"]