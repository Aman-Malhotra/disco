from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import ForeignKey, Index, Integer, String, Text, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, IdMixin, TimestampMixin


class ChatSession(Base, IdMixin, TimestampMixin):
    """One conversation. Anonymous — no user ownership in this prototype."""

    __tablename__ = "chat_sessions"

    title: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(32), default="active")

    messages: Mapped[list[ChatMessage]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatMessage.seq",
    )


class ChatMessage(Base, IdMixin, TimestampMixin):
    __tablename__ = "chat_messages"
    __table_args__ = (Index("idx_chat_messages_session_seq", "session_id", "seq"),)

    session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE")
    )
    seq: Mapped[int] = mapped_column(Integer)
    role: Mapped[str] = mapped_column(String(16))  # user | assistant
    content: Mapped[str | None] = mapped_column(Text)
    # Assistant turns store the assembled campaign package (pipeline output).
    artifact: Mapped[dict[str, Any] | None] = mapped_column(JSONB)

    session: Mapped[ChatSession] = relationship(back_populates="messages")
