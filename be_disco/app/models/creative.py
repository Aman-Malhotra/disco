from __future__ import annotations

from pydantic import BaseModel


class Creative(BaseModel):
    persona_id: str
    persona_name: str
    headline: str
    body: str
    reasoning: str | None = None
