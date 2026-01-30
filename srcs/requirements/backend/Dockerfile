# Backend Dockerfile
# Node.js API server (runs behind NGINX)

FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose internal port (NOT public)
EXPOSE 8080

# Start development server with hot reload
CMD ["npm", "run", "dev"]
