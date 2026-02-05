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

# Create entrypoint script to reinstall deps if node_modules is empty
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'export CI=true' >> /docker-entrypoint.sh && \
    echo 'if [ ! -d "/app/requirements/frontend/node_modules/next" ]; then' >> /docker-entrypoint.sh && \
    echo '  echo "Installing dependencies..."' >> /docker-entrypoint.sh && \
    echo '  cd /app/requirements/frontend && pnpm install' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo 'exec "$@"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["pnpm", "run", "dev"]
