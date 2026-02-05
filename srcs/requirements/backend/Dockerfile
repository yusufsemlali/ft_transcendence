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

# Create entrypoint script to reinstall deps if node_modules is empty
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'export CI=true' >> /docker-entrypoint.sh && \
    echo 'if [ ! -d "/app/requirements/backend/node_modules/tsx" ]; then' >> /docker-entrypoint.sh && \
    echo '  echo "Installing dependencies..."' >> /docker-entrypoint.sh && \
    echo '  cd /app/requirements/backend && pnpm install' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo 'exec "$@"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["pnpm", "run", "dev"]
