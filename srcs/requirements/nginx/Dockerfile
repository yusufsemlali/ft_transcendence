# NGINX Dockerfile
# TLSv1.2/TLSv1.3 reverse proxy for ft_transcendence

FROM debian:bookworm

# Install NGINX and OpenSSL
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Create directories for SSL certificates
RUN mkdir -p /etc/nginx/ssl

# Copy configuration
COPY conf/nginx.conf /etc/nginx/nginx.conf

# Copy entrypoint script
COPY tools/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose HTTPS port only
EXPOSE 443

# Run NGINX in foreground
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
