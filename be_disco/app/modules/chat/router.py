from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.schemas import ListResponse
from app.db.session import get_db_session
from app.modules.chat.repository import ChatRepository
from app.modules.chat.schemas import (
    ChatMessageRequest,
    MessageOut,
    SessionDetail,
    SessionSummary,
)
from app.modules.chat.service import ChatService

router = APIRouter(tags=["chat"])


def get_chat_service(db: AsyncSession = Depends(get_db_session)) -> ChatService:
    return ChatService(ChatRepository(db))


def _to_detail(session: Any) -> SessionDetail:
    return SessionDetail(
        id=session.id,
        title=session.title,
        status=session.status,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[MessageOut.model_validate(m) for m in session.messages],
    )


@router.post("/sessions", response_model=SessionSummary, status_code=201)
async def create_session(service: ChatService = Depends(get_chat_service)) -> SessionSummary:
    """Create a conversation; returns the chat_session_id for subsequent /chat calls."""
    session = await service.create_session()
    return SessionSummary.model_validate(session)


@router.get("/sessions", response_model=ListResponse[SessionSummary])
async def list_sessions(
    service: ChatService = Depends(get_chat_service),
) -> ListResponse[SessionSummary]:
    sessions = await service.list_sessions()
    return ListResponse(
        items=[SessionSummary.model_validate(s) for s in sessions], total=len(sessions)
    )


@router.get("/sessions/{session_id}", response_model=SessionDetail)
async def get_session(
    session_id: uuid.UUID, service: ChatService = Depends(get_chat_service)
) -> SessionDetail:
    session = await service.get_session(session_id)
    return _to_detail(session)


@router.post("/chat/{session_id}")
async def chat(
    session_id: uuid.UUID,
    body: ChatMessageRequest,
    service: ChatService = Depends(get_chat_service),
) -> StreamingResponse:
    """Send a message → stream every workflow state back as SSE."""

    async def event_stream() -> AsyncIterator[str]:
        async for event, data in service.stream_chat(session_id, body.message):
            yield f"event: {event}\ndata: {data}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
