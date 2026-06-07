from __future__ import annotations

from app.agents.base import BaseAgent
from app.models.router import RouterDecision


class RouterAgent(BaseAgent[RouterDecision]):
    """Reads the conversation context + new query and decides what to do:
    answer directly, or re-run a subset of the pipeline agents."""

    prompt_name = "router"
    output_schema = RouterDecision
    temperature = 0.1
