from abc import ABC, abstractmethod
from collections.abc import AsyncIterator

from app.llm.configs.base import BaseLLMConfig
from app.llm.schemas import LLMRequest, LLMResponse, StreamEvent


class LLMProvider(ABC):
    """A chat-completions provider that supports tool calling.

    Adapters translate the neutral `LLMRequest`/`LLMResponse` to and from the
    vendor SDK. Keeping this surface tiny is what lets the agent loop stay
    provider-agnostic.
    """

    name: str

    def __init__(self, config: BaseLLMConfig) -> None:
        self.config = config

    @abstractmethod
    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Run one chat completion (possibly returning tool calls)."""

    async def stream(self, request: LLMRequest) -> AsyncIterator[StreamEvent]:
        """Stream a completion as text deltas, ending with the assembled response.

        Default falls back to a single non-streamed call (no token-by-token
        output). Providers that support streaming override this. Callers always
        consume it with `async for ... in provider.stream(req)`.
        """
        response = await self.complete(request)
        if response.message.content:
            yield StreamEvent(kind="text", text=response.message.content)
        yield StreamEvent(kind="done", response=response)
