from __future__ import annotations

from app.agents.base import BaseAgent
from app.models.publisher import PublisherMatches


class PublisherAgent(BaseAgent[PublisherMatches]):
    """Explains the fit of pre-scored candidate publishers."""

    prompt_name = "publisher_fit"
    output_schema = PublisherMatches
    temperature = 0.3
