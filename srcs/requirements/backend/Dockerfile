FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

# Copy the shared package first
COPY ./requirements/shared /requirements/shared

# Copy backend package files
COPY ./requirements/backend/package*.json ./requirements/backend/pnpm-lock.yaml* ./

# Install dependencies (including the link to shared)
WORKDIR /app/requirements/backend
RUN pnpm install

# Copy the rest of the backend source
COPY ./requirements/backend /app/requirements/backend

EXPOSE 8080

CMD ["pnpm", "run", "dev"]
