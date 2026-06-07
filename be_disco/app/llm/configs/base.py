from pydantic import BaseModel


class BaseLLMConfig(BaseModel):
    api_key: str
    model: str
    base_url: str | None = None
    timeout_s: float = 60.0
