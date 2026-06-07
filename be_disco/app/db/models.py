"""Aggregator so Alembic autogenerate sees every ORM model.

Import each module's models here as they are built.
"""

from app.db.base import Base  # noqa: F401
from app.modules.chat.models import ChatMessage, ChatSession  # noqa: F401

__all__ = ["Base", "ChatSession", "ChatMessage"]
