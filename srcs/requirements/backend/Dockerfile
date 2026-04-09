FROM node:20-alpine

WORKDIR /app/backend

RUN npm install -g pnpm@9

# Install shared deps first (cached separately)
COPY shared/contracts/package.json /app/shared/contracts/
RUN cd /app/shared/contracts && pnpm install

# Install backend deps (fresh resolve from package.json)
COPY backend/package.json ./
RUN pnpm install --no-frozen-lockfile

# Copy source
COPY backend/ .

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
