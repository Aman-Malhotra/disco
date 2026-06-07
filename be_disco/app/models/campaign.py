from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class BudgetAllocation(BaseModel):
    publisher_id: str
    name: str
    pct: int = Field(ge=0, le=100, description="Share of daily budget")


class Targeting(BaseModel):
    age_min: int | None = None
    age_max: int | None = None
    genders: list[str] = Field(default_factory=list)
    geos: list[str] = Field(default_factory=list)
    income_tiers: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)


class BidStrategy(BaseModel):
    model: Literal["CPM", "CPC", "CPA"]
    suggested_bid_low_usd: float | None = None
    suggested_bid_high_usd: float | None = None
    rationale: str | None = None


class CampaignConfig(BaseModel):
    objective: str = Field(description="e.g. awareness | traffic | conversions")
    daily_budget_usd: float
    allocation: list[BudgetAllocation]
    targeting: Targeting
    bid_strategy: BidStrategy
    rationale: str | None = None
