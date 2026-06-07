from app.llm.configs.base import BaseLLMConfig
from app.llm.providers.openai_provider import OpenAIProvider

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


class OpenRouterProvider(OpenAIProvider):
    """OpenRouter is OpenAI-wire-compatible; only the base_url differs."""

    name = "openrouter"

    def __init__(self, config: BaseLLMConfig) -> None:
        if not config.base_url:
            config = config.model_copy(update={"base_url": OPENROUTER_BASE_URL})
        super().__init__(config)
