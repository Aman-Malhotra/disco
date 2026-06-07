from __future__ import annotations

from app.core.config import LLMProviderName, settings
from app.core.errors import AppError
from app.llm.configs.base import BaseLLMConfig
from app.llm.providers.base import LLMProvider
from app.llm.providers.openai_provider import OpenAIProvider
from app.llm.providers.openrouter_provider import OpenRouterProvider

# Central registry of provider implementations. Add a provider here and it is
# usable everywhere through `build_provider()` — the single interface the rest
# of the app uses to talk to any LLM.
_REGISTRY: dict[LLMProviderName, type[LLMProvider]] = {
    "openai": OpenAIProvider,
    "openrouter": OpenRouterProvider,
}


def _api_key_for(provider: LLMProviderName) -> str:
    key = {
        "openai": settings.openai_api_key,
        "openrouter": settings.openrouter_api_key,
    }[provider]
    if not key:
        raise AppError(
            code="missing_api_key",
            message=f"No API key configured for provider '{provider}'.",
            details={"provider": provider},
        )
    return key


def build_provider(
    provider: LLMProviderName | None = None, model: str | None = None
) -> LLMProvider:
    """Construct the configured LLM provider.

    This is the central factory: callers ask for a provider (defaulting to
    settings) and get back an `LLMProvider` exposing `complete()` and
    `stream()`. Selection of the concrete vendor is hidden here.
    """
    name = provider or settings.llm_provider
    provider_cls = _REGISTRY.get(name)
    if provider_cls is None:
        raise AppError(code="unknown_provider", message=f"Unknown LLM provider '{name}'.")
    config = BaseLLMConfig(api_key=_api_key_for(name), model=model or settings.llm_model)
    return provider_cls(config)
