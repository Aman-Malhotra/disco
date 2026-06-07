"""Minimal tool scaffolding.

The structured pipeline doesn't need autonomous tool-calling, but agents can
declare tools in their scope. This is the seam we'll build out when we design
the agent/tool structure in detail.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any


class Tool(ABC):
    """A capability an agent can be granted. Name + a callable definition."""

    name: str

    @abstractmethod
    async def execute(self, **kwargs: Any) -> Any: ...
