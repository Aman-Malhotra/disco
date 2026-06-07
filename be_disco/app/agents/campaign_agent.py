from __future__ import annotations

from app.agents.base import BaseAgent
from app.models.campaign import CampaignConfig


class CampaignPlannerAgent(BaseAgent[CampaignConfig]):
    """Synthesizes a campaign config from profile + publishers + personas."""

    prompt_name = "campaign_planner"
    output_schema = CampaignConfig
    temperature = 0.4
