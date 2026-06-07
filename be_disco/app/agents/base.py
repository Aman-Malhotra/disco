"""The base agent — deliberately boring.

It owns ONLY the cross-cutting mechanics: prompt rendering, the LLM call,
structured-output validation, retries, and error handling. Everything
domain-specific lives in the child agents, which just declare a `prompt_name`
and an `output_schema`.
"""

from __future__ import annotations

import json
from abc import ABC
from typing import Any, ClassVar, Generic, TypeVar

from pydantic import BaseModel, ValidationError

from app.agents.tools import Tool
from app.core.errors import AppError
from app.core.logging import get_logger
from app.llm.factory import build_provider
from app.llm.prompts import load_prompt
from app.llm.providers.base import LLMProvider
from app.llm.schemas import LLMRequest, Message

T = TypeVar("T", bound=BaseModel)

log = get_logger("agent")


class BaseAgent(ABC, Generic[T]):
    # --- declared by each child agent ---
    prompt_name: ClassVar[str]
    output_schema: type[T]
    # --- tunables with sane defaults ---
    temperature: ClassVar[float] = 0.4
    max_retries: ClassVar[int] = 2
    # tools injected into this agent's scope (empty for the structured pipeline)
    tools: ClassVar[list[Tool]] = []

    def __init__(self, provider: LLMProvider | None = None) -> None:
        self.provider = provider or build_provider()

    def _build_prompt(self, **kwargs: Any) -> str:
        template = load_prompt(self.prompt_name)
        # Non-string inputs (profiles, candidate lists) go in as pretty JSON.
        rendered = {
            key: (value if isinstance(value, str) else json.dumps(value, default=str, indent=2))
            for key, value in kwargs.items()
        }
        body = template.format(**rendered) if rendered else template
        schema = json.dumps(self.output_schema.model_json_schema(), indent=2)
        return f"{body}\n\nReturn ONLY valid JSON (no prose, no markdown fences) matching this JSON Schema:\n{schema}"

    async def execute(self, **kwargs: Any) -> T:
        messages = [Message(role="user", content=self._build_prompt(**kwargs))]
        last_error: Exception | None = None

        for attempt in range(self.max_retries + 1):
            response = await self.provider.complete(
                LLMRequest(
                    messages=messages,
                    temperature=self.temperature,
                    response_format={"type": "json_object"},
                )
            )
            raw = response.message.content or ""
            try:
                data = json.loads(raw)
                result = self.output_schema.model_validate(data)
                log.info("agent.completed", agent=type(self).__name__, attempt=attempt)
                return result
            except (json.JSONDecodeError, ValidationError) as exc:
                last_error = exc
                log.warning(
                    "agent.invalid_output",
                    agent=type(self).__name__,
                    attempt=attempt,
                    error=str(exc)[:300],
                )
                messages.append(Message(role="assistant", content=raw))
                messages.append(
                    Message(
                        role="user",
                        content=(
                            f"That response was not valid. Error: {exc}. "
                            "Return ONLY corrected JSON matching the schema."
                        ),
                    )
                )

        raise AppError(
            code="agent_output_invalid",
            message=f"{type(self).__name__} failed to produce valid output after retries.",
            details={"error": str(last_error)},
        )
