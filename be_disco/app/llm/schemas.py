"""Provider-agnostic LLM message / tool / response shapes.

Every provider adapter maps these to and from its own wire format, so the rest
of the app (agent loop, tool registry) never imports a vendor SDK type.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

Role = Literal["system", "user", "assistant", "tool"]


class ToolCall(BaseModel):
    id: str
    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)


class Message(BaseModel):
    role: Role
    content: str | None = None
    # assistant turns may carry tool calls; tool turns carry the originating id
    tool_calls: list[ToolCall] = Field(default_factory=list)
    tool_call_id: str | None = None
    name: str | None = None


class ToolSpec(BaseModel):
    """A single tool definition, provider-neutral. JSON Schema for parameters."""

    name: str
    description: str
    parameters: dict[str, Any]


class LLMRequest(BaseModel):
    messages: list[Message]
    tools: list[ToolSpec] = Field(default_factory=list)
    tool_choice: Literal["auto", "required", "none"] = "auto"
    temperature: float = 0.7
    max_tokens: int | None = None
    # JSON-schema name to force structured output when no tools are in play
    response_format: dict[str, Any] | None = None


class Usage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0


class LLMResponse(BaseModel):
    message: Message
    finish_reason: str | None = None
    usage: Usage = Field(default_factory=Usage)


class StreamEvent(BaseModel):
    """One item from a streaming completion.

    `kind="text"` carries an incremental token chunk; `kind="done"` carries the
    fully-assembled `LLMResponse` (text + accumulated tool calls) so the agent
    loop can continue exactly as it does in the non-streaming path.
    """

    kind: Literal["text", "done"]
    text: str | None = None
    response: LLMResponse | None = None
