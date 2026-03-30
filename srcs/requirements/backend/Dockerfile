FROM node:20-alpine

WORKDIR /app/backend

RUN npm install -g pnpm

# Install shared deps first (cached separately)
COPY shared/contracts/package.json /app/shared/contracts/
RUN cd /app/shared/contracts && pnpm install

# Install backend deps (cached separately)
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install

# Copy source
COPY backend/ .

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
