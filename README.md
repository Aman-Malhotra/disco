# Disco — ad placement & creative generation

An advertiser describes their business in a sentence. Disco recommends publishers (with reasoning + exclusions), writes creative tuned to plausible shopper personas, and drafts a launch-ready campaign config — inside a **persistent, streaming chat workspace**.

The brain is a **tool-driven LLM agent**: the model is the orchestrator and our capabilities are provider-agnostic tools it calls (`list_publishers`, `list_personas`, `submit_campaign_plan`). It reads the catalog, interprets the brief, discovers plausible *use cases*, and emits one structured proposal per use case — streamed to the UI step-by-step so you watch it work.

```
disco/
├── be_disco/   FastAPI · tool-driven agent · Postgres (chat threads) · OpenAI/Gemini/OpenRouter
├── fe_disco/   React 19 · Vite · TanStack · Tailwind — "Midnight Disco" chat studio
├── data/ + prompts/  live inside be_disco/
└── docker-compose.yml   one file; Postgres on :4003
```

## Run it (local dev)

```bash
# 1. Postgres (Docker)
docker compose up -d postgres                      # :4003

# 2. Backend                          ports: API :4002
cd be_disco && cp .env.example .env                # set OPENAI_API_KEY
make install && make migrate && make dev

# 3. Frontend                         ports: web :4001
cd fe_disco && cp .env.example .env
npm install && npm run dev                         # open http://localhost:4001
```

The FE proxies `/api` → `:4002`. Without an LLM key the catalog/threads still work; the agent turn needs a key.

## Campaign config — the shape, and why

The agent fills `CampaignPlan` (`be_disco/app/modules/campaigns/schemas.py`): a brief interpretation + one proposal per use case. Each proposal carries **ranked publishers** (0–100 fit + rationale) and **exclusions**, **persona creatives** (3–5 personas, each with visible reasoning + headline/body variants), and a **campaign config**: objective, daily budget, targeting (age/gender/geo/income/affinity), per-publisher allocation, and a bid strategy (CPM/CPC/CPA + range + pacing). These are the minimum fields to actually launch: where, who, what, how much. The plan is persisted as the assistant message's `artifact`, so reopening a thread rebuilds the result with no re-run.

## With another week

Human-in-the-loop use-case selection before proposing; multi-agent fan-out (one proposal sub-agent per use case, in parallel); a fit-scoring tool with deterministic pre-filters to ground the LLM; eval harness over the example briefs; the private-API proxy (below).

## Intentionally cut

Auth/users (anonymous threads only) · Redis/workers (turns are synchronous) · the FE-only private-API gate (deferred; standard CORS for now) · a DB-backed catalog (static JSON in-memory is enough at this size) · Docker for app dev (kept for later; local `uv`/`vite` for iteration).

## Hard vs. easy, and where the real work is

**Easy:** the CRUD, the catalog loading, the rendering. **Genuinely hard:** (1) *matching* — separating a subtle fit from a plausible-looking miss, and articulating *why not* as well as *why*; (2) *messy input* — "idk just try it" should degrade gracefully into "here's the most plausible reading," not hallucinate confidence; (3) *creative that reads as written for a persona*, not a template fill. The interesting engineering lives in the **agent contract**: forcing the model to ground every claim in tool output, shaping the `CampaignPlan` schema tightly enough that structured output stays useful, and streaming the reasoning so the recommendation is trustable rather than a black box.
