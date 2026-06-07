"""Loads the static data pack into typed models (cached on first read)."""

from __future__ import annotations

import json
from functools import lru_cache

from app.core.config import settings
from app.models.catalog import Persona, Publisher


@lru_cache(maxsize=1)
def load_publishers() -> list[Publisher]:
    raw = json.loads((settings.data_dir / "publishers.json").read_text(encoding="utf-8"))
    return [Publisher.model_validate(p) for p in raw]


@lru_cache(maxsize=1)
def load_personas() -> list[Persona]:
    raw = json.loads((settings.data_dir / "shopper_personas.json").read_text(encoding="utf-8"))
    return [Persona.model_validate(p) for p in raw]
