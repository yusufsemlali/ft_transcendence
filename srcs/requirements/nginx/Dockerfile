FROM debian:bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    openssl \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /etc/nginx/ssl

# Copy nginx config
COPY conf/nginx.conf /etc/nginx/nginx.conf

# Generate SSL certificate inline
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/server.key \
    -out /etc/nginx/ssl/server.crt \
    -subj "/CN=localhost" \
    2>/dev/null

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
