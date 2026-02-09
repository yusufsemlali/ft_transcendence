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

logs:
	$(COMPOSE) logs -f

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

frontend:
	$(COMPOSE) up -d --build frontend

backend:
	$(COMPOSE) up -d --build backend

database:
	$(COMPOSE) up -d --build database

.PHONY: all down clean fclean re logs status db db-generate db-push db-migrate frontend backend
