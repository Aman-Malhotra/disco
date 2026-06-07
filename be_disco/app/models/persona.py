from __future__ import annotations

from pydantic import BaseModel, Field


class PersonaMatch(BaseModel):
    persona_id: str
    name: str
    score: int = Field(ge=0, le=100)
    reasoning: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)


class PersonaSelection(BaseModel):
    personas: list[PersonaMatch]
