# be_disco

Backend for Disco — ad placement & creative generation. A **tool-driven LLM agent** over FastAPI + Postgres. The model is the orchestrator: it reads the advertiser's brief and drives the campaign build by calling tools (`list_publishers`, `list_personas`, `submit_campaign_plan`). Everything streams back to the UI over SSE.

## Stack

FastAPI · Python 3.11 · async SQLAlchemy + asyncpg + Alembic · pydantic-settings · structlog · ruff + mypy (strict) · pytest · uv. LLM providers: **openai · gemini · openrouter** behind one provider-agnostic abstraction.

## Layout

```
app/
├── core/        config · errors · logging · middleware
├── db/          async session · mixins · alembic migrations
├── llm/         factory + providers (openai/gemini/openrouter) · neutral schemas · prompt loader
├── agent/       tool-use loop + ToolRegistry (provider-agnostic)
└── modules/
    ├── catalog/     loads the static data pack (publishers + personas)
    ├── campaigns/   CampaignPlan contract + the agent's tools
    └── chat/        ChatSession/ChatMessage · SSE turn endpoint · LLM-titled threads
data/      the exercise data pack (publishers, personas, examples)
prompts/   every prompt the system uses (loaded at runtime)
```

## Run locally

```bash
cp .env.example .env          # set OPENAI_API_KEY (or gemini/openrouter)
make up-db                    # starts Postgres on :4003 via the root compose
make install                  # uv sync
make migrate                  # alembic upgrade head
make dev                      # uvicorn on :4002  → http://localhost:4002/docs
```

Quality gates: `make lint` · `make typecheck` · `make test`.

## Key endpoints (all under `/api/v1`)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/publishers`, `/personas` | the catalog (for the UI) |
| `POST` | `/sessions` | create a campaign thread |
| `GET` | `/sessions`, `/sessions/{id}` | list / load threads + messages |
| `POST` | `/sessions/{id}/messages` | run one agent turn, **streamed as SSE** |

## The campaign contract

The agent fills `app/modules/campaigns/schemas.py::CampaignPlan` — a brief interpretation plus one proposal per discovered use case (ranked publishers + exclusions, persona-tuned creatives, and a campaign config: objective, daily budget, targeting, per-publisher allocation, bid strategy). It is persisted as the assistant message's `artifact` jsonb and rendered directly by the frontend.

## Why this shape

- **Tools, not a pipeline.** The capabilities are provider-agnostic tools the LLM invokes — adding a provider (or a tool) doesn't touch the agent loop. `ToolRegistry.specs()` is converted to each vendor's function-calling format by its adapter.
- **Postgres for threads only.** The catalog is static JSON loaded in-memory; persistence is just chat sessions/messages + their structured artifacts, so reopening a thread rebuilds the full result with no re-run.
- **SSE** streams every tool call/result as the agent works — that is the "show your work" requirement, end to end.
