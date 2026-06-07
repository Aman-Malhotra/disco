from __future__ import annotations

from app.agents.base import BaseAgent
from app.models.persona import PersonaSelection


class PersonaAgent(BaseAgent[PersonaSelection]):
    """Explains the ranking of pre-scored candidate personas."""

    prompt_name = "persona_selection"
    output_schema = PersonaSelection
    temperature = 0.3
