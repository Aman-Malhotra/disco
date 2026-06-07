from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from app.models.advertiser import AdvertiserProfile
from app.models.campaign import CampaignConfig
from app.models.creative import Creative
from app.models.persona import PersonaSelection
from app.models.publisher import PublisherMatches


class AgentContext(BaseModel):
    """Shared state threaded through the pipeline stages."""

    advertiser_text: str
    advertiser_profile: AdvertiserProfile | None = None
    publishers: PublisherMatches | None = None
    personas: PersonaSelection | None = None
    campaign: CampaignConfig | None = None
    creatives: list[Creative] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
