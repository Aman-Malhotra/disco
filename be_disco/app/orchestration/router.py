from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.agents.context import AgentContext
from app.orchestration.pipeline import AdGenerationPipeline

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


class GenerateRequest(BaseModel):
    advertiser_text: str = Field(min_length=1)


@router.post("/generate", response_model=AgentContext)
async def generate(body: GenerateRequest) -> AgentContext:
    """Run the full structured pipeline and return the assembled package."""
    return await AdGenerationPipeline().run(body.advertiser_text)
