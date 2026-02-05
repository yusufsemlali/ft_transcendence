FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

# Copy the shared package first
COPY ./requirements/shared /requirements/shared

# Copy frontend package files
COPY ./requirements/frontend/package*.json ./requirements/frontend/pnpm-lock.yaml* ./

# Install dependencies
WORKDIR /app/requirements/frontend
RUN pnpm install

# Copy the rest of the frontend source
COPY ./requirements/frontend /app/requirements/frontend

EXPOSE 3000

CMD ["pnpm", "run", "dev"]
