"""
Agent class — orchestrates tools and LLM calls.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass
class AgentConfig:
    provider: str
    model: str
    temperature: float
    max_tokens: int


class Agent:
    def __init__(self, config: AgentConfig) -> None:
        self.config = config

    def run(self, query: str | None = None) -> str:
        """Main agent loop. Override or extend this."""
        raise NotImplementedError("Implement the agent run loop.")
