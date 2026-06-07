"""Loads prompt templates from the repo `prompts/` directory.

Prompts live as Markdown files so they are reviewable in the repo (and in the
`prompts/` directory the exercise asks for). They are read fresh on each call so
prompt edits take effect on the next turn without a server restart — the files
are tiny and this is off the hot path.
"""

from __future__ import annotations

from app.core.config import settings


def load_prompt(name: str) -> str:
    path = settings.prompts_dir / f"{name}.md"
    if not path.exists():
        raise FileNotFoundError(f"Prompt '{name}' not found at {path}")
    return path.read_text(encoding="utf-8")


def render(name: str, **kwargs: str) -> str:
    """Load a prompt and substitute {placeholders}."""
    template = load_prompt(name)
    return template.format(**kwargs) if kwargs else template
