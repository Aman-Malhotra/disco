from __future__ import annotations

import json
import uuid
from collections.abc import AsyncIterator
from typing import Any

from app.agents.context import AgentContext
from app.agents.router_agent import RouterAgent
from app.core.errors import NotFoundError
from app.core.logging import get_logger
from app.llm.factory import build_provider
from app.llm.prompts import render
from app.llm.schemas import LLMRequest, Message
from app.modules.chat.models import ChatMessage, ChatSession
from app.modules.chat.repository import ChatRepository
from app.orchestration.pipeline import AdGenerationPipeline

log = get_logger("chat.service")

# One SSE frame: (event name, JSON payload string).
SseFrame = tuple[str, str]


class ChatService:
    def __init__(self, repository: ChatRepository) -> None:
        self.repository = repository

    async def create_session(self) -> ChatSession:
        session = await self.repository.create_session()
        await self.repository.db.commit()
        return session

    async def get_session(self, session_id: uuid.UUID) -> ChatSession:
        session = await self.repository.get_session(session_id)
        if session is None:
            raise NotFoundError(
                message="Chat session not found", details={"session_id": str(session_id)}
            )
        return session

    async def list_sessions(self) -> list[ChatSession]:
        return await self.repository.list_sessions()

    async def _generate_title(self, message: str) -> str:
        try:
            provider = build_provider()
            response = await provider.complete(
                LLMRequest(
                    messages=[Message(role="user", content=render("thread_title", brief=message))],
                    temperature=0.3,
                    max_tokens=24,
                )
            )
            title = (response.message.content or "").strip().strip('"')
            return title[:120] or message[:60]
        except Exception as exc:
            log.warning("chat.title_failed", error=str(exc))
            return message[:60]

    async def stream_chat(self, session_id: uuid.UUID, message: str) -> AsyncIterator[SseFrame]:
        session = await self.get_session(session_id)
        prior_pkg = _latest_package(session.messages)
        is_first = len(session.messages) == 0

        user_seq = await self.repository.next_seq(session_id)
        await self.repository.add_message(session_id, user_seq, role="user", content=message)
        await self.repository.db.commit()

        if is_first or not session.title:
            title = await self._generate_title(message)
            await self.repository.set_title(session_id, title)
            await self.repository.db.commit()
            yield ("session", _json({"id": str(session_id), "title": title}))

        content: str | None = None
        artifact: dict[str, Any] | None = None

        if prior_pkg is None:
            # First campaign for this thread → run the full workflow.
            try:
                async for event in AdGenerationPipeline().stream(message):
                    if event.type == "final":
                        artifact = event.data
                    yield (event.type, event.model_dump_json(exclude_none=True))
            except Exception as exc:
                log.error("chat.full_failed", error=str(exc))
                yield ("error", _json({"message": str(exc)}))
        else:
            # Follow-up → route on intent (answer vs selective re-run).
            decision = None
            try:
                decision = await RouterAgent().execute(
                    context=_context_summary(prior_pkg), query=message
                )
            except Exception as exc:
                log.error("chat.router_failed", error=str(exc))
                yield ("error", _json({"message": str(exc)}))

            if decision is not None:
                content = decision.message
                yield ("message", _json({"text": decision.message}))
                if decision.action == "run_agents" and decision.agents:
                    prior_ctx = AgentContext.model_validate(prior_pkg)
                    try:
                        async for event in AdGenerationPipeline().run_selected(
                            prior_ctx, message, list(decision.agents)
                        ):
                            if event.type == "final":
                                artifact = event.data
                            yield (event.type, event.model_dump_json(exclude_none=True))
                    except Exception as exc:
                        log.error("chat.selective_failed", error=str(exc))
                        yield ("error", _json({"message": str(exc)}))

        assistant_seq = await self.repository.next_seq(session_id)
        await self.repository.add_message(
            session_id, assistant_seq, role="assistant", content=content, artifact=artifact
        )
        await self.repository.db.commit()
        yield ("done", "{}")


def _latest_package(messages: list[ChatMessage]) -> dict[str, Any] | None:
    for m in reversed(messages):
        if m.role == "assistant" and m.artifact:
            return m.artifact
    return None


def _context_summary(pkg: dict[str, Any]) -> dict[str, Any]:
    """Compact summary of prior agent outcomes for the router."""
    profile = pkg.get("advertiser_profile")
    pubs = (pkg.get("publishers") or {}).get("matches", []) if pkg.get("publishers") else []
    pers = (pkg.get("personas") or {}).get("personas", []) if pkg.get("personas") else []
    creatives = pkg.get("creatives") or []
    return {
        "brief": pkg.get("advertiser_text"),
        "advertiser_profile": profile,
        "publishers": [{"name": p["name"], "fit_score": p["fit_score"]} for p in pubs],
        "personas": [{"name": p["name"], "score": p["score"]} for p in pers],
        "campaign": pkg.get("campaign"),
        "creatives": [{"persona": c["persona_name"], "headline": c["headline"]} for c in creatives],
    }


def _json(data: dict[str, Any]) -> str:
    return json.dumps(data, default=str)
