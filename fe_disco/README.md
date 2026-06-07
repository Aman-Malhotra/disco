# fe_disco

Frontend for Disco — a chat-driven ad-campaign studio. Landing page is a single centered chat box (the first thing every user lands on); typing a brief spins up a **campaign thread** where the agent streams its work and renders the resulting plan. A side panel lists every thread.

**Aesthetic — "Midnight Disco":** dark ink-navy canvas, the brand logo's blue→violet gradient as the spotlight glow / accent, film-grain overlay. Display type **Clash Display**, body **Geist**, data **Geist Mono**.

## Stack

React 19 · Vite · TypeScript (strict) · TanStack Router + Query · Zod · Tailwind. Layered `app / shared / entities / modules` with barrel-export boundaries (ESLint-enforced).

## Layout

```
src/
├── app/        env (zod) · QueryProvider · router ("/" + "/c/$sessionId")
├── shared/     api (fetch client + SSE reader) · ui (ChatBox, Button, …) · lib
├── entities/
│   ├── campaign/   the CampaignPlan zod schema (mirrors the backend contract)
│   └── chat/       session/message schemas · queries · streamTurn service
└── modules/
    ├── landing/    centered chat-box hero + example-brief chips
    └── chat/       AppShell (side panel) · ThreadPage · live AgentTrace · plan/ panels
```

## Run locally

```bash
cp .env.example .env     # VITE_API_BASE_URL=/api (proxied to the backend)
npm install
npm run dev              # http://localhost:4001
```

Vite proxies `/api` → `http://localhost:4002` (the backend), so run `be_disco` alongside. Quality gates: `npm run typecheck` · `npm run lint` · `npm run build`.

## How it works

- The landing chat box creates a session (`POST /sessions`), stashes the brief, and routes to `/c/$id`.
- `ThreadPage` opens an **SSE** turn (`POST /sessions/{id}/messages`) and renders each agent step live — tool calls (reading the catalog, assembling the plan) appear as they happen (the "show your work" requirement).
- On completion the thread refetches; the persisted assistant message carries a structured `CampaignPlan` artifact, rendered as proposal cards: ranked publishers + exclusions, persona-tuned creative variants, and the campaign config (targeting, allocation, bid strategy).
