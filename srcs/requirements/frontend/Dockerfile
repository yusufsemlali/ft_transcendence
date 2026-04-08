FROM node:20-alpine

WORKDIR /app/frontend

RUN npm install -g pnpm@9

# Install shared deps first (cached separately)
COPY shared/contracts/package.json /app/shared/contracts/
RUN cd /app/shared/contracts && pnpm install

# Install frontend deps (cached separately)
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install

# Copy source
COPY frontend/ .

EXPOSE 3000
CMD ["sh" , "-c","pnpm run dev"]
#CMD ["sh", "-c", "pnpm run build && pnpm run start"]
