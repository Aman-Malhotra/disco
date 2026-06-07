from __future__ import annotations

from pydantic import BaseModel, Field


class AdvertiserProfile(BaseModel):
    """Canonical structured state extracted from the advertiser's free text.

    This is the single source of truth the rest of the pipeline reads from.
    """

    category: str = Field(description="Top-level category, e.g. 'pet', 'apparel', 'beauty'")
    subcategory: str | None = Field(default=None, description="e.g. 'dog food', 'activewear'")
    product: str | None = Field(default=None, description="What they actually sell, in plain words")
    positioning: str | None = Field(default=None, description="premium | mid | value")
    benefits: list[str] = Field(default_factory=list, description="Key product benefits / claims")
    audience_traits: list[str] = Field(default_factory=list, description="Traits of the buyer")
    summary: str | None = Field(default=None, description="One-line read of the business")
