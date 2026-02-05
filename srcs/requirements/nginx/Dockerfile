FROM debian:bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    openssl \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /etc/nginx/ssl

# Adjust paths to match new build context (srcs/)
COPY ./requirements/nginx/conf/nginx.conf /etc/nginx/nginx.conf
COPY ./requirements/nginx/tools/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
