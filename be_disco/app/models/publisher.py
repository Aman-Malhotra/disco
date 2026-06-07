from __future__ import annotations

from pydantic import BaseModel, Field


class PublisherMatch(BaseModel):
    publisher_id: str
    name: str
    fit_score: int = Field(ge=0, le=100)
    reasoning: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)


class PublisherMatches(BaseModel):
    matches: list[PublisherMatch]
