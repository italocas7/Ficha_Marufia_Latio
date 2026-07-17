"""Helpers for reading and writing Latio's generated JavaScript database."""

from __future__ import annotations

import json
from pathlib import Path


PREFIX = "window.MARUFIA_DB = "


def load_data_js(path: Path) -> dict:
    text = path.read_text(encoding="utf-8-sig").strip()
    if not text.startswith(PREFIX) or not text.endswith(";"):
        raise ValueError(f"{path} não possui o formato window.MARUFIA_DB esperado.")
    return json.loads(text[len(PREFIX) : -1])


def write_data_js(path: Path, database: dict) -> None:
    payload = PREFIX + json.dumps(database, ensure_ascii=False, indent=2) + ";\n"
    path.write_text(payload, encoding="utf-8")


def load_json(path: Path) -> dict | list:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict | list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

