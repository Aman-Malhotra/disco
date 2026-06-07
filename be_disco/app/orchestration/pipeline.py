"""The structured agentic pipeline.

A multi-stage workflow (NOT an autonomous ReAct loop). `stream()` runs the full
pipeline for a fresh brief; `run_selected()` re-runs only chosen agents for a
follow-up, seeded from the prior package. Both emit a `plan` (the steps that
will run) then `step` events, so the FE stepper shows exactly what happens.
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
from app.core.errors import AppError
from app.core.logging import get_logger
from app.llm.factory import build_provider
from app.models.advertiser import AdvertiserProfile
from app.models.catalog import Persona
from app.models.creative import Creative
from app.models.persona import PersonaSelection

log = get_logger("pipeline")

StepKey = Literal["advertiser", "publishers", "personas", "campaign", "creatives"]

_LABEL: dict[str, str] = {
    "advertiser": "Understanding the business",
    "publishers": "Matching publishers",
    "personas": "Figuring the target audience",
    "campaign": "Planning campaign details",
    "creatives": "Writing ad creatives",
}


class PipelineEvent(BaseModel):
    type: Literal["plan", "step", "final", "error"]
    step: str | None = None
    status: Literal["progress", "completed"] | None = None
    label: str | None = None
    data: Any | None = None
    steps: list[dict[str, str]] | None = None  # for `plan`


def _plan(keys: list[str]) -> PipelineEvent:
    return PipelineEvent(type="plan", steps=[{"key": k, "label": _LABEL[k]} for k in keys])


def _start(step: str) -> PipelineEvent:
    return PipelineEvent(type="step", step=step, status="progress", label=_LABEL[step])


def _done(step: str, data: Any) -> PipelineEvent:
    return PipelineEvent(type="step", step=step, status="completed", label=_LABEL[step], data=data)


class AdGenerationPipeline:
    def __init__(self) -> None:
        provider = build_provider()  # one client shared across stages
        self.advertiser = AdvertiserAgent(provider)
        self.publisher = PublisherAgent(provider)
        self.persona = PersonaAgent(provider)
        self.campaign = CampaignPlannerAgent(provider)
        self.creative = CreativeGenerationAgent(provider)

    # --- per-agent steps (guidance is the follow-up instruction, "" on fresh runs) ---

    async def _run_advertiser(self, text: str) -> AdvertiserProfile:
        return await self.advertiser.execute(advertiser_text=text)

    async def _run_publishers(self, profile: AdvertiserProfile, guidance: str = "") -> Any:
        catalog = [p.model_dump() for p in load_publishers()]
        return await self.publisher.execute(
            advertiser_profile=profile.model_dump(), publishers=catalog, guidance=guidance
        )

    async def _run_personas(self, profile: AdvertiserProfile, guidance: str = "") -> PersonaSelection:
        catalog = [p.model_dump() for p in load_personas()]
        return await self.persona.execute(
            advertiser_profile=profile.model_dump(), personas=catalog, guidance=guidance
        )

    async def _run_campaign(
        self, profile: AdvertiserProfile, publishers: Any, personas: Any, guidance: str = ""
    ) -> Any:
        return await self.campaign.execute(
            advertiser_profile=profile.model_dump(),
            publishers=publishers.model_dump(),
            personas=personas.model_dump(),
            guidance=guidance,
        )

    async def _run_creatives(
        self, profile: AdvertiserProfile, personas: PersonaSelection, guidance: str = ""
    ) -> list[Creative]:
        by_id = {p.id: p for p in load_personas()}
        tasks = [
            self._creative_for(profile, by_id.get(pm.persona_id), pm.persona_id, pm.name, guidance)
            for pm in personas.personas
        ]
        return list(await asyncio.gather(*tasks))

    async def _creative_for(
        self,
        profile: AdvertiserProfile,
        persona: Persona | None,
        persona_id: str,
        persona_name: str,
        guidance: str = "",
    ) -> Creative:
        persona_data = persona.model_dump() if persona else {"id": persona_id, "name": persona_name}
        creative = await self.creative.execute(
            advertiser_profile=profile.model_dump(), persona=persona_data, guidance=guidance
        )
        creative.persona_id = persona.id if persona else persona_id
        creative.persona_name = persona.name if persona else persona_name
        return creative

    # --- full run (fresh brief) ---

    async def stream(self, advertiser_text: str) -> AsyncIterator[PipelineEvent]:
        ctx = AgentContext(advertiser_text=advertiser_text)
        yield _plan(["advertiser", "publishers", "personas", "campaign", "creatives"])

        yield _start("advertiser")
        profile = await self._run_advertiser(advertiser_text)
        ctx.advertiser_profile = profile
        yield _done("advertiser", profile.model_dump())

        yield _start("publishers")
        yield _start("personas")
        publishers, personas = await asyncio.gather(
            self._run_publishers(profile), self._run_personas(profile)
        )
        ctx.publishers = publishers
        ctx.personas = personas
        yield _done("publishers", publishers.model_dump())
        yield _done("personas", personas.model_dump())

        yield _start("campaign")
        campaign = await self._run_campaign(profile, publishers, personas)
        ctx.campaign = campaign
        yield _done("campaign", campaign.model_dump())

        yield _start("creatives")
        ctx.creatives = await self._run_creatives(profile, personas)
        yield _done("creatives", [c.model_dump() for c in ctx.creatives])

        yield PipelineEvent(type="final", data=ctx.model_dump())

    # --- selective re-run (follow-up), seeded from the prior package ---

    async def run_selected(
        self, prior: AgentContext, query: str, agents: list[str]
    ) -> AsyncIterator[PipelineEvent]:
        ctx = prior.model_copy(deep=True)
        if ctx.advertiser_profile is None and "advertiser" not in agents:
            agents = ["advertiser", *agents]

        yield _plan(agents)
        for agent in agents:
            yield _start(agent)
            data = await self._run_one(ctx, agent, query)
            yield _done(agent, data)

        yield PipelineEvent(type="final", data=ctx.model_dump())

    async def _run_one(self, ctx: AgentContext, agent: str, guidance: str) -> Any:
        profile = ctx.advertiser_profile
        if agent == "advertiser":
            ctx.advertiser_profile = await self._run_advertiser(guidance)
            return ctx.advertiser_profile.model_dump()
        if profile is None:
            raise AppError(code="missing_profile", message="No advertiser profile to build on.")
        if agent == "publishers":
            ctx.publishers = await self._run_publishers(profile, guidance)
            return ctx.publishers.model_dump()
        if agent == "personas":
            ctx.personas = await self._run_personas(profile, guidance)
            return ctx.personas.model_dump()
        if agent == "campaign":
            ctx.campaign = await self._run_campaign(profile, ctx.publishers, ctx.personas, guidance)
            return ctx.campaign.model_dump()
        if agent == "creatives":
            if ctx.personas is None:
                raise AppError(code="missing_personas", message="No personas to write creatives for.")
            ctx.creatives = await self._run_creatives(profile, ctx.personas, guidance)
            return [c.model_dump() for c in ctx.creatives]
        raise AppError(code="unknown_agent", message=f"Unknown agent '{agent}'.")

    async def run(self, advertiser_text: str) -> AgentContext:
        ctx = AgentContext(advertiser_text=advertiser_text)
        async for event in self.stream(advertiser_text):
            if event.type == "final" and event.data is not None:
                ctx = AgentContext.model_validate(event.data)
        return ctx
