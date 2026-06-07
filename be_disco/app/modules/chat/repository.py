from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.chat.models import ChatMessage, ChatSession


class ChatRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_session(self, title: str | None = None) -> ChatSession:
        session = ChatSession(title=title)
        self.db.add(session)
        await self.db.flush()
        return session

    async def get_session(self, session_id: uuid.UUID) -> ChatSession | None:
        result = await self.db.execute(
            select(ChatSession)
            .where(ChatSession.id == session_id)
            .options(selectinload(ChatSession.messages))
        )
        return result.scalar_one_or_none()

    async def list_sessions(self) -> list[ChatSession]:
        result = await self.db.execute(
            select(ChatSession).order_by(ChatSession.updated_at.desc())
        )
        return list(result.scalars().all())

    async def next_seq(self, session_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.coalesce(func.max(ChatMessage.seq), -1)).where(
                ChatMessage.session_id == session_id
            )
        )
        return int(result.scalar_one()) + 1

    async def add_message(
        self,
        session_id: uuid.UUID,
        seq: int,
        role: str,
        content: str | None,
        artifact: dict[str, Any] | None = None,
    ) -> ChatMessage:
        message = ChatMessage(
            session_id=session_id, seq=seq, role=role, content=content, artifact=artifact
        )
        self.db.add(message)
        await self.db.flush()
        return message

    async def set_title(self, session_id: uuid.UUID, title: str) -> None:
        session = await self.db.get(ChatSession, session_id)
        if session is not None:
            session.title = title
