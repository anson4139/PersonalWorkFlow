"""
AI Agent pipeline entry point.
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

from src.agent import Agent
from src.config import load_config


def main() -> None:
    config = load_config()
    agent = Agent(config)
    agent.run()


if __name__ == "__main__":
    main()
