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
	docker exec -it ft_database psql -U ft_user -d ft_transcendence

.PHONY: all down clean fclean re logs status db
