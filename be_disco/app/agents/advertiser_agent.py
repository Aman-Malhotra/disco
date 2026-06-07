from __future__ import annotations

from app.agents.base import BaseAgent
from app.models.advertiser import AdvertiserProfile


class AdvertiserAgent(BaseAgent[AdvertiserProfile]):
    """Extracts the canonical advertiser profile from free text."""

    prompt_name = "advertiser_profile"
    output_schema = AdvertiserProfile
    temperature = 0.2
