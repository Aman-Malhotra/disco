from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

AgentName = Literal["advertiser", "publishers", "personas", "campaign", "creatives"]


class RouterDecision(BaseModel):
    """How to handle a follow-up message in an existing campaign conversation."""

    action: Literal["answer", "run_agents"]
    message: str = Field(
        description="Reply to the user (for 'answer'), or a short note on what you're re-running."
    )
    agents: list[AgentName] = Field(
        default_factory=list,
        description="Ordered agents to re-run when action='run_agents'. Empty for 'answer'.",
    )
