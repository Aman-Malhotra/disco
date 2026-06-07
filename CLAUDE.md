# Disco — conventions for Claude

Two sibling projects: `be_disco/` (FastAPI) and `fe_disco/` (React). Ports: **FE 4001 · API 4002 · Postgres 4003**. One `docker-compose.yml` at the root (Postgres always; `api`/`web` behind the `full` profile). Local dev uses `uv`/`vite`, not Docker.

## Product

A chat-driven ad-campaign studio. The landing page (`/`) is a centered chat box; a brief opens a campaign thread (`/c/$id`). A **tool-driven LLM agent** orchestrates: it calls tools, discovers use cases, and emits a structured `CampaignPlan`, streamed over SSE. No auth (anonymous threads).

## be_disco (Python 3.11, uv)

- **Layout:** `core/` (config·errors·logging·middleware), `db/` (async SQLAlchemy + Alembic), `llm/` (provider factory + neutral schemas + prompt loader), `agent/` (tool-use loop + `ToolRegistry`), `modules/<feature>/` each = `models·schemas·repository·service·router`.
- **Pattern:** repository → service → router; DI via `Depends`. Settings via pydantic-settings (`app/core/config.py`). Structlog everywhere.
- **LLM:** providers (`openai`/`gemini`/`openrouter`) behind `LLMProvider`; tools are provider-agnostic `ToolSpec`s adapted per vendor. Add a provider in `llm/factory.py`, a tool in `modules/campaigns/tools.py`.
- **Prompts** live in `prompts/*.md`, loaded by `llm/prompts.py`. **Data pack** is static JSON in `data/`, loaded in-memory by `modules/catalog`.
- **Gates:** `make lint` (ruff) · `make typecheck` (mypy --strict) · `make test` (pytest). All must pass.
- New model → add to `db/models.py` aggregator → `make migration m="..."` → `make migrate`.

## fe_disco (React 19, Vite, TS strict)

- **Layout:** `app/` (env·providers·router), `shared/` (api·ui·lib), `entities/<name>/` (`model` + `api` + `ui`), `modules/<feature>/ui`. Public surface only via barrel `index.ts`; cross-layer deep imports are ESLint-errors.
- **Data:** TanStack Query for server state; fetch wrapper + Zod validation at the boundary (`shared/api`); SSE via `postEventStream` (POST + stream reader, not EventSource).
- **Entities mirror backend schemas** with Zod (`entities/campaign` ↔ `CampaignPlan`). Keep them in sync when the backend contract changes.
- **Aesthetic "Midnight Disco":** dark ink-navy canvas, brand blue→violet gradient (from the logo) as glow/accent, grain overlay. Fonts: Clash Display (display) · Geist (body) · Geist Mono (data). Tokens in `tailwind.config.js` — use `canvas/ink/brand/signal`, not raw hex.
- **Gates:** `npm run typecheck` · `npm run lint` · `npm run build`.

## When changing the campaign contract

Edit `be_disco/.../campaigns/schemas.py` AND `fe_disco/src/entities/campaign/model/campaign.schema.ts` together — the agent fills it, the UI renders it.
