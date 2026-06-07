from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

from openai import AsyncOpenAI

from app.llm.configs.base import BaseLLMConfig
from app.llm.providers.base import LLMProvider
from app.llm.schemas import LLMRequest, LLMResponse, Message, StreamEvent, ToolCall, Usage


class OpenAIProvider(LLMProvider):
    """OpenAI chat-completions adapter.

    OpenRouter is the same wire protocol with a different base_url, so the
    OpenRouter provider subclasses this and only swaps the endpoint.
    """

    name = "openai"

    def __init__(self, config: BaseLLMConfig) -> None:
        super().__init__(config)
        self.client = AsyncOpenAI(
            api_key=config.api_key,
            base_url=config.base_url,
            timeout=config.timeout_s,
        )

    def _to_wire_messages(self, messages: list[Message]) -> list[dict[str, Any]]:
        out: list[dict[str, Any]] = []
        for m in messages:
            if m.role == "assistant" and m.tool_calls:
                out.append(
                    {
                        "role": "assistant",
                        "content": m.content or "",
                        "tool_calls": [
                            {
                                "id": tc.id,
                                "type": "function",
                                "function": {"name": tc.name, "arguments": json.dumps(tc.arguments)},
                            }
                            for tc in m.tool_calls
                        ],
                    }
                )
            elif m.role == "tool":
                out.append({"role": "tool", "tool_call_id": m.tool_call_id, "content": m.content or ""})
            else:
                out.append({"role": m.role, "content": m.content or ""})
        return out

    def _to_wire_tools(self, request: LLMRequest) -> list[dict[str, Any]] | None:
        if not request.tools:
            return None
        return [
            {
                "type": "function",
                "function": {"name": t.name, "description": t.description, "parameters": t.parameters},
            }
            for t in request.tools
        ]

    def _request_kwargs(self, request: LLMRequest) -> dict[str, Any]:
        kwargs: dict[str, Any] = {
            "model": self.config.model,
            "messages": self._to_wire_messages(request.messages),
            "temperature": request.temperature,
        }
        if request.max_tokens:
            kwargs["max_tokens"] = request.max_tokens
        tools = self._to_wire_tools(request)
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = request.tool_choice
        elif request.response_format:
            kwargs["response_format"] = {"type": "json_object"}
        return kwargs

    async def complete(self, request: LLMRequest) -> LLMResponse:
        completion = await self.client.chat.completions.create(**self._request_kwargs(request))
        choice = completion.choices[0]
        raw = choice.message

        tool_calls: list[ToolCall] = []
        for tc in raw.tool_calls or []:
            try:
                args = json.loads(tc.function.arguments or "{}")
            except json.JSONDecodeError:
                args = {}
            tool_calls.append(ToolCall(id=tc.id, name=tc.function.name, arguments=args))

        usage = Usage()
        if completion.usage:
            usage = Usage(
                prompt_tokens=completion.usage.prompt_tokens,
                completion_tokens=completion.usage.completion_tokens,
            )

        return LLMResponse(
            message=Message(role="assistant", content=raw.content, tool_calls=tool_calls),
            finish_reason=choice.finish_reason,
            usage=usage,
        )

    async def stream(self, request: LLMRequest) -> AsyncIterator[StreamEvent]:
        kwargs = self._request_kwargs(request)
        kwargs["stream"] = True
        stream = await self.client.chat.completions.create(**kwargs)

        content_parts: list[str] = []
        # Tool calls stream as fragments keyed by index: name first, then the
        # arguments string in pieces. Accumulate and assemble at the end.
        tool_acc: dict[int, dict[str, str]] = {}
        finish_reason: str | None = None

        async for chunk in stream:
            if not chunk.choices:
                continue
            choice = chunk.choices[0]
            delta = choice.delta
            if choice.finish_reason:
                finish_reason = choice.finish_reason

            if delta.content:
                content_parts.append(delta.content)
                yield StreamEvent(kind="text", text=delta.content)

            for tc in delta.tool_calls or []:
                slot = tool_acc.setdefault(tc.index, {"id": "", "name": "", "args": ""})
                if tc.id:
                    slot["id"] = tc.id
                if tc.function and tc.function.name:
                    slot["name"] = tc.function.name
                if tc.function and tc.function.arguments:
                    slot["args"] += tc.function.arguments

        tool_calls: list[ToolCall] = []
        for _, slot in sorted(tool_acc.items()):
            try:
                args = json.loads(slot["args"] or "{}")
            except json.JSONDecodeError:
                args = {}
            tool_calls.append(ToolCall(id=slot["id"], name=slot["name"], arguments=args))

        response = LLMResponse(
            message=Message(
                role="assistant",
                content="".join(content_parts) or None,
                tool_calls=tool_calls,
            ),
            finish_reason=finish_reason,
        )
        yield StreamEvent(kind="done", response=response)
