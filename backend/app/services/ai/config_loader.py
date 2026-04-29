"""YAML-based provider config loader."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml


CONFIG_DIR = Path(__file__).resolve().parents[3] / "config"


def _normalize_config(value: Any) -> dict:
    if isinstance(value, dict):
        return value
    return {}


@lru_cache()
def load_config(name: str) -> dict:
    path = CONFIG_DIR / f"{name}.yaml"
    if not path.exists():
        return {}
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    return _normalize_config(data)


def provider_order(config: dict) -> list[str]:
    if not isinstance(config, dict):
        return []
    if isinstance(config.get("failover"), list):
        return [str(item) for item in config.get("failover") if item]
    default = config.get("default")
    providers = list((config.get("providers") or {}).keys())
    if default and default in providers:
        providers.remove(default)
        return [str(default)] + providers
    return providers
