# Disco — ad placement & creative generation

An advertiser describes their business in a sentence; Disco recommends **where to run** (publishers, scored with reasoning), **who to speak to** (shopper personas, scored), **what to say** (persona-tuned ad creatives), and a **launch-ready campaign config** (objective, budget, targeting, allocation, bid strategy) — inside a streaming, ChatGPT-style workspace.

Live: **https://disco.amanmalhotra.me**

## What I built

A **chat-driven, multi-agent pipeline** behind a persistent conversation.

```
           advertiser brief
                  │
                  ▼
   ┌─────────────────────┐
   │   Advertiser Agent  │ → structured profile (canonical state)
   └─────────────────────┘
                  │
                  ▼
   ┌─────────────────────┐
   │   Publisher Agent   │ ┐ run in parallel · reason-based matching
   │   Persona Agent     │ ┤ ≥60 recommended · 40–59 considered · <40 dropped
   └─────────────────────┘ ┘ + "what matches / what doesn't" pointers
                  │
                  ▼
   ┌─────────────────────┐
   │   Campaign Planner  │ → budget · targeting · allocation · bid strategy
   └─────────────────────┘
                  │
                  ▼
   ┌─────────────────────┐
   │    Creative Agent   │ → headline + body, tuned to each persona
   └─────────────────────┘
```

- **Structured agentic pipeline, not an autonomous ReAct loop** — each stage is a bounded LLM decision. A tiny `BaseAgent` owns prompt-rendering, the LLM call, JSON-schema validation, and retries; each child agent just declares a prompt + output schema.
- **Reason-based matching** — publishers/personas are scored by the LLM on *meaning*, not keyword overlap (e.g. a persona disinterested in "generic pet brands" is a *strong* fit for a *premium* pet brand).
- **Follow-up router** — after the first campaign, a controller LLM reads the conversation + prior outcomes and decides: just **answer** a question, or **re-run only the agents needed** (e.g. "make the creatives punchier" → creatives only). No blind re-runs.
- **SSE streaming** — every stage streams (`plan → step(progress/completed) → final`) so the UI shows a live stepper, then renders the campaign.
- **Stack** — FastAPI · Python 3.11 · async SQLAlchemy + Postgres + Alembic · provider-agnostic LLM factory (OpenAI / OpenRouter, streaming) · React 19 · Vite · TanStack Query · Tailwind. Catalog parsed into typed models; prompts live in `be_disco/prompts/`.

## How to run

**Prerequisites:** Docker, [uv](https://docs.astral.sh/uv/), Node 20+, and an OpenRouter API key.

```bash
git clone <repo> && cd disco
make setup                              # deps, Postgres (:4003), migrations, .env files
#  → add OPENROUTER_API_KEY to be_disco/.env
make                                    # runs backend (:4002) + frontend (:4001)
```

Open **http://localhost:4001**. (Ports: FE 4001 · API 4002 · Postgres 4003.) Production runs the same stack via `docker compose up -d --build` behind nginx.

## What I'd do next (with another week)

- **Human-in-the-loop review at every pipeline step.** The advertiser reviews each stage and steers it:
  - personas are scored → confirm they make sense, or request a re-recommendation (re-run that stage);
  - publishers are scored → confirm fit, or drop a specific publisher and re-plan;
  - creatives reviewed and **updated per-creative** on feedback.
- **Real creative visuals** - generate ad imagery alongside headlines + body copy.
- **Ad-space previews** - show how each creative actually looks across publishers in real placements: banner ads, full-page ads, in-feed/post ads, and video ads, with the recommended creatives rendered in-context.

## What I intentionally cut (and why)

- **User login / accounts.** No auth - all recommendations run against a **single anonymous entity**, not a per-user recommendation system. Out of scope for showing the core engine.
- **An ever-running agent loop.** There is deliberately **no never-ending ReAct loop**. The agentic flow is an intentional **deterministic pipeline** — more predictable, debuggable, and production-minded for this problem than giving an autonomous agent full control.

## Hard vs. easy — where the interesting work is

**Easy:** the CRUD, catalog loading, and rendering. 

**Genuinely hard, and where the real engineering lives:**

- **Orchestrating the agents** - sequencing the stages, keeping structured output reliable (schema + retry), and doing reason-based matching that's actually discriminating rather than padded.
- **Continuation on an existing campaign** - interpreting the advertiser's follow-up against the recommended campaign: is it a question, a tweak, or a redo? Routing it to the *minimal* set of agents, carrying the conversation context + prior outcomes forward, and re-proposing — instead of regenerating everything every turn. That intent-routing + selective re-run is an interesting part of the build.
