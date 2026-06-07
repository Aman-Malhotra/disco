.PHONY: install dev lint format typecheck test migrate migration downgrade up up-db down nuke import-check

PORT ?= 4002

install:
	uv sync

dev:
	uv run uvicorn app.main:app --host 0.0.0.0 --port $(PORT) --reload --reload-dir app

lint:
	uv run ruff check .

format:
	uv run ruff format . && uv run ruff check . --fix

typecheck:
	uv run mypy app

test:
	uv run pytest

import-check:
	uv run python -c "from app.main import app; print('import ok')"

migrate:
	uv run alembic upgrade head

migration:
	uv run alembic revision --autogenerate -m "$(m)"

downgrade:
	uv run alembic downgrade -1

# Wipe chat data but keep the schema (fast; truncates the tables).
db-clean:
	docker exec disco_postgres psql -U disco -d disco -c "TRUNCATE chat_sessions, chat_messages RESTART IDENTITY CASCADE;"

# Full reset: drop every table, then re-apply all migrations.
db-reset:
	uv run alembic downgrade base
	uv run alembic upgrade head

# Compose lives at the repo root and orchestrates the whole stack.
COMPOSE = docker compose -f ../docker-compose.yml

up:
	$(COMPOSE) up --build

up-db:
	$(COMPOSE) up -d postgres

down:
	$(COMPOSE) down

nuke:
	$(COMPOSE) down -v
