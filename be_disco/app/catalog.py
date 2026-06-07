"""Loads the static data pack (publishers + personas) as raw dicts."""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from app.core.config import settings


@lru_cache(maxsize=1)
def load_publishers() -> list[dict[str, Any]]:
    data: list[dict[str, Any]] = json.loads(
        (settings.data_dir / "publishers.json").read_text(encoding="utf-8")
    )
    return data


@lru_cache(maxsize=1)
def load_personas() -> list[dict[str, Any]]:
    data: list[dict[str, Any]] = json.loads(
        (settings.data_dir / "shopper_personas.json").read_text(encoding="utf-8")
    )
    return data
