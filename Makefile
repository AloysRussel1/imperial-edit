.PHONY: up down build logs migrate makemigrations superuser shell test lint fmt

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

migrate:
	docker compose exec web python manage.py migrate

makemigrations:
	docker compose exec web python manage.py makemigrations

superuser:
	docker compose exec web python manage.py createsuperuser

shell:
	docker compose exec web python manage.py shell

test:
	docker compose exec web pytest

lint:
	docker compose exec web ruff check .
	docker compose exec frontend npm run lint

fmt:
	docker compose exec web ruff format .
	docker compose exec frontend npm run format
