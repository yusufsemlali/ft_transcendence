COMPOSE = docker compose --env-file srcs/.env -f srcs/docker-compose.yml

all:
	$(COMPOSE) up --build -d

down:
	$(COMPOSE) down

clean:
	$(COMPOSE) down -v

fclean: clean
	$(COMPOSE) down --rmi all -v

re: fclean all

nuke: fclean
	@echo "🔥 Nuking all Docker containers, images, and volumes..."
	@docker stop $$(docker ps -qa) 2>/dev/null || true
# 	@docker run --rm -v ~/tmp:/clean alpine rm -rf /clean/db_data
	@docker rm -f $$(docker ps -qa) 2>/dev/null || true
	@docker rmi -f $$(docker images -qa) 2>/dev/null || true
	@docker volume rm $$(docker volume ls -q) 2>/dev/null || true
	@docker network rm $$(docker network ls -q | grep -v "bridge\|host\|none") 2>/dev/null || true
	@docker system prune -af --volumes
	@echo "✨ Docker is shiny and clean!"

logs-b:
	$(COMPOSE) logs -f backend

logs-f:
	$(COMPOSE) logs -f frontend

status:
	$(COMPOSE) ps

db:
	docker exec -it ft_database psql -U $(shell grep DB_USER srcs/.env | cut -d '=' -f 2) -d $(shell grep DB_NAME srcs/.env | cut -d '=' -f 2)

db-generate:
	docker exec -it ft_backend pnpm drizzle-kit generate

db-push:
	docker exec -it ft_backend pnpm drizzle-kit push

db-migrate:
	docker exec -it ft_backend pnpm drizzle-kit migrate

db-reset:
	$(COMPOSE) rm -fvs database
	docker run --rm -v ~/tmp:/clean alpine rm -rf /clean/db_data
	$(COMPOSE) up -d --build database

frontend:
	$(COMPOSE) up -d --build frontend

backend:
	$(COMPOSE) up -d --build backend

database:
	$(COMPOSE) up -d --build database

# Positional argument hack for admin command
%:
	@:

admin:
	@EMAIL=$(filter-out $@,$(MAKECMDGOALS)) && \
	if [ -z "$$EMAIL" ]; then echo "Usage: make admin user@example.com"; exit 1; fi; \
	U=$$(grep "^DB_USER=" srcs/.env | cut -d= -f2) && \
	D=$$(grep "^DB_NAME=" srcs/.env | cut -d= -f2) && \
	docker exec ft_database psql -U $$U -d $$D -c "UPDATE auth.users SET role = 'admin' WHERE email = '$$EMAIL';"

.PHONY: all down clean fclean re nuke logs status db db-generate db-push db-migrate db-reset frontend backend logs-b logs-f admin
