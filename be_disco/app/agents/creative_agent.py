from __future__ import annotations

from app.agents.base import BaseAgent
from app.models.creative import Creative


class CreativeGenerationAgent(BaseAgent[Creative]):
    """Writes one ad creative tuned to a single persona. Run once per persona."""

    prompt_name = "creative_generation"
    output_schema = Creative
    temperature = 0.8
