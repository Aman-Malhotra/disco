from __future__ import annotations

import json
import uuid
from collections.abc import AsyncIterator
from typing import Any

from app.core.errors import NotFoundError
from app.core.logging import get_logger
from app.llm.factory import build_provider
from app.llm.prompts import render
from app.llm.schemas import LLMRequest, Message
from app.modules.chat.models import ChatSession
from app.modules.chat.repository import ChatRepository
from app.orchestration.pipeline import AdGenerationPipeline

log = get_logger("chat.service")

# One SSE frame: (event name, JSON payload string).
SseFrame = tuple[str, str]


class ChatService:
    def __init__(self, repository: ChatRepository) -> None:
        self.repository = repository

    async def create_session(self) -> ChatSession:
        """Create an empty conversation; the id is used for subsequent /chat calls."""
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
        except Exception as exc:  # best-effort
            log.warning("chat.title_failed", error=str(exc))
            return message[:60]

    async def stream_chat(self, session_id: uuid.UUID, message: str) -> AsyncIterator[SseFrame]:
        """Run one turn: persist the message, (title if first), stream the pipeline,
        persist the assembled package. Yields SSE frames the router serializes."""
        session = await self.get_session(session_id)
        is_first = len(session.messages) == 0

        user_seq = await self.repository.next_seq(session_id)
        await self.repository.add_message(session_id, user_seq, role="user", content=message)
        await self.repository.db.commit()

        # First message with no title → summarize it into a conversation title.
        if is_first or not session.title:
            title = await self._generate_title(message)
            await self.repository.set_title(session_id, title)
            await self.repository.db.commit()
            yield ("session", _json({"id": str(session_id), "title": title}))

        package: dict[str, Any] | None = None
        try:
            async for event in AdGenerationPipeline().stream(message):
                if event.type == "final":
                    package = event.data
                yield (event.type, event.model_dump_json(exclude_none=True))
        except Exception as exc:
            log.error("chat.workflow_failed", error=str(exc), session_id=str(session_id))
            yield ("error", _json({"message": str(exc)}))

        assistant_seq = await self.repository.next_seq(session_id)
        await self.repository.add_message(
            session_id, assistant_seq, role="assistant", content=None, artifact=package
        )
        await self.repository.db.commit()
        yield ("done", "{}")


def _json(data: dict[str, Any]) -> str:
    return json.dumps(data, default=str)
