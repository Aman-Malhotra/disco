# Disco — one command to set up and run the whole stack after clone.
#
#   make          → setup (db, deps, migrations, .env) then run FE + BE
#   make setup    → just provision (deps, Postgres, migrations, .env files)
#   make dev      → run FE (:4001) + BE (:4002) together (assumes setup done)
#   make down     → stop Postgres
#
# Prerequisites: Docker, uv, Node 20+.

.PHONY: default setup db be-setup fe-setup migrate dev down

default: dev

# ---- run both dev servers together (Ctrl+C stops both) ----
dev: setup
	@echo ""
	@grep -q "OPENROUTER_API_KEY=." be_disco/.env || \
	  echo "⚠️  Set OPENROUTER_API_KEY in be_disco/.env for the agents to work."
	@echo "→ Backend :4002 · Frontend :4001  (Ctrl+C to stop both)"
	@trap 'kill 0' INT TERM; \
	  $(MAKE) -C be_disco dev & \
	  $(MAKE) -C fe_disco dev & \
	  wait

# ---- provision everything ----
setup: db be-setup fe-setup migrate

db:
	docker compose up -d postgres
	@echo "→ waiting for Postgres…"
	@until docker exec disco_postgres pg_isready -U disco -d disco >/dev/null 2>&1; do sleep 1; done

be-setup:
	@test -f be_disco/.env || cp be_disco/.env.example be_disco/.env
	cd be_disco && uv sync

fe-setup:
	@test -f fe_disco/.env || cp fe_disco/.env.example fe_disco/.env
	cd fe_disco && npm install

migrate:
	cd be_disco && uv run alembic upgrade head

down:
	docker compose down
