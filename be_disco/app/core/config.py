from pathlib import Path
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

# Repo root: .../be_disco
BASE_DIR = Path(__file__).resolve().parents[2]

LLMProviderName = Literal["openai", "openrouter"]


class Settings(BaseSettings):
    app_name: str = "Disco"
    environment: str = "local"

    # Required in real runs; default keeps imports cheap for tooling/tests.
    database_url: str = "postgresql+asyncpg://disco:disco@localhost:4003/disco"

    cors_origins: Annotated[list[str], NoDecode] = Field(default_factory=list)

    # LLM
    llm_provider: LLMProviderName = "openrouter"
    llm_model: str = "openai/gpt-4o-mini"
    openai_api_key: str | None = None
    openrouter_api_key: str | None = None

    # Agent
    agent_max_steps: int = 12

    # Data pack location (static catalog)
    data_dir: Path = BASE_DIR / "data"
    prompts_dir: Path = BASE_DIR / "prompts"

    log_http_bodies: bool = False
    log_max_body_bytes: int = 4096

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors(cls, value: str | list[str] | None) -> list[str]:
        if isinstance(value, str):
            return [v.strip() for v in value.split(",") if v.strip()]
        return value or []

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


settings = Settings()
