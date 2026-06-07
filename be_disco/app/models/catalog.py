"""Typed models for the static data pack (publishers.json, shopper_personas.json).

The catalog is parsed into these on load, so the rest of the code reads typed
attributes (`pub.avg_order_value_usd`, `persona.category_affinities`) instead of
raw dict keys.
"""

from __future__ import annotations

from pydantic import BaseModel


class GenderSplit(BaseModel):
    female: float = 0.0
    male: float = 0.0
    other: float = 0.0


class PublisherAudience(BaseModel):
    age_skew: str
    gender_split: GenderSplit
    top_geos: list[str]
    income_tier: str


class Publisher(BaseModel):
    id: str
    name: str
    category: str
    subcategories: list[str]
    monthly_impressions: int
    avg_order_value_usd: float
    audience: PublisherAudience
    notes: str


class Persona(BaseModel):
    id: str
    name: str
    age_range: str
    gender_skew: str
    description: str
    category_affinities: list[str]
    price_sensitivity: str
    messaging_preferences: list[str]
    disinterested_in: list[str]
    typical_aov_usd: float
