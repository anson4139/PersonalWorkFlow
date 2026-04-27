"""
Load configuration from YAML + environment variables.
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

import os
import yaml
from pathlib import Path
from dotenv import load_dotenv
from src.agent import AgentConfig

load_dotenv()

_SPEC_DIR = Path(__file__).parent.parent / "specs" / "ai"


def load_config() -> AgentConfig:
    model_config_path = _SPEC_DIR / "model-config.yaml"
    with open(model_config_path, encoding="utf-8") as f:
        raw = yaml.safe_load(f)

    primary = raw["primary"]
    return AgentConfig(
        provider=primary["provider"],
        model=primary["model"],
        temperature=primary["temperature"],
        max_tokens=primary["max_tokens"],
    )
