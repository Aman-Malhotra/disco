"""The structured agentic pipeline.

A multi-stage workflow (NOT an autonomous ReAct loop): each stage is an agent
that makes a bounded decision. Matching is reason-based — the publisher/persona
agents score the full catalog by meaning — and the LLM also handles synthesis
and creative.

`stream()` yields a `PipelineEvent` as each stage starts/completes so the chat
layer can stream progress over SSE; `run()` collects the final package.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from typing import Any, Literal

from pydantic import BaseModel

from app.agents.advertiser_agent import AdvertiserAgent
from app.agents.campaign_agent import CampaignPlannerAgent
from app.agents.context import AgentContext
from app.agents.creative_agent import CreativeGenerationAgent
from app.agents.persona_agent import PersonaAgent
from app.agents.publisher_agent import PublisherAgent
from app.catalog import load_personas, load_publishers
from app.core.logging import get_logger
from app.llm.factory import build_provider
from app.models.advertiser import AdvertiserProfile
from app.models.creative import Creative

log = get_logger("pipeline")


class PipelineEvent(BaseModel):
    """One SSE-bound event.

    `type="step"` drives the FE stepper: `step` is the stable stage key,
    `status` is progress|completed, `label` is the human line. Completed steps
    carry that stage's `data`. `type="final"` carries the whole package.
    """

    type: Literal["step", "final", "error"]
    step: str | None = None
    status: Literal["progress", "completed"] | None = None
    label: str | None = None
    data: Any | None = None


# Stable step keys + labels, in display order (the FE can pre-render the stepper).
STEPS: list[tuple[str, str]] = [
    ("advertiser", "Understanding the business"),
    ("publishers", "Matching publishers"),
    ("personas", "Figuring the target audience"),
    ("campaign", "Planning campaign details"),
    ("creatives", "Writing ad creatives"),
]
_LABEL = dict(STEPS)


def _start(step: str) -> PipelineEvent:
    return PipelineEvent(type="step", step=step, status="progress", label=_LABEL[step])


def _done(step: str, data: Any) -> PipelineEvent:
    return PipelineEvent(type="step", step=step, status="completed", label=_LABEL[step], data=data)


class AdGenerationPipeline:
    """Advertiser text → profile → (publishers ∥ personas) → campaign → creatives."""

    def __init__(self) -> None:
        provider = build_provider()  # one client shared across stages
        self.advertiser = AdvertiserAgent(provider)
        self.publisher = PublisherAgent(provider)
        self.persona = PersonaAgent(provider)
        self.campaign = CampaignPlannerAgent(provider)
        self.creative = CreativeGenerationAgent(provider)

    async def stream(self, advertiser_text: str) -> AsyncIterator[PipelineEvent]:
        ctx = AgentContext(advertiser_text=advertiser_text)

        # Stage 1 — advertiser profile (canonical state)
        yield _start("advertiser")
        profile = await self.advertiser.execute(advertiser_text=advertiser_text)
        ctx.advertiser_profile = profile
        yield _done("advertiser", profile.model_dump())

        # Stages 2 & 3 — reason-based matching over the full catalog (parallel)
        yield _start("publishers")
        yield _start("personas")
        publishers, personas = await asyncio.gather(
            self.publisher.execute(
                advertiser_profile=profile.model_dump(), publishers=load_publishers()
            ),
            self.persona.execute(
                advertiser_profile=profile.model_dump(), personas=load_personas()
            ),
        )
        ctx.publishers = publishers
        ctx.personas = personas
        yield _done("publishers", publishers.model_dump())
        yield _done("personas", personas.model_dump())

        # Stage 4 — campaign planner (synthesis)
        yield _start("campaign")
        campaign = await self.campaign.execute(
            advertiser_profile=profile.model_dump(),
            publishers=publishers.model_dump(),
            personas=personas.model_dump(),
        )
        ctx.campaign = campaign
        yield _done("campaign", campaign.model_dump())

        # Stage 5 — one creative per selected persona (parallel)
        yield _start("creatives")
        personas_by_id = {p["id"]: p for p in load_personas()}
        creative_tasks = [
            self._creative_for(
                profile,
                personas_by_id.get(pm.persona_id, {"id": pm.persona_id, "name": pm.name}),
            )
            for pm in personas.personas
        ]
        ctx.creatives = list(await asyncio.gather(*creative_tasks))
        yield _done("creatives", [c.model_dump() for c in ctx.creatives])

        yield PipelineEvent(type="final", data=ctx.model_dump())

    async def run(self, advertiser_text: str) -> AgentContext:
        ctx = AgentContext(advertiser_text=advertiser_text)
        async for event in self.stream(advertiser_text):
            if event.type == "final" and event.data is not None:
                ctx = AgentContext.model_validate(event.data)
        return ctx

    async def _creative_for(self, profile: AdvertiserProfile, persona: dict[str, Any]) -> Creative:
        creative = await self.creative.execute(
            advertiser_profile=profile.model_dump(), persona=persona
        )
        creative.persona_id = str(persona.get("id", creative.persona_id))
        creative.persona_name = str(persona.get("name", creative.persona_name))
        return creative
