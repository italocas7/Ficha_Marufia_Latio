"""Normalization rules shared by Latio's importers and deterministic build."""

from __future__ import annotations

import re


VALID_MAGIC_TYPES = ("Fina", "Impacto", "Densa", "Mundo", "Forte", "Etérea")
FALLBACK_PM_COSTS = {
    "Fina": [0, 1, 1, 2, 2, 4, 4, 5, 5, 8, 8],
    "Impacto": [0, 1, 1, 2, 3, 4, 5, 6, 8, 10, 12],
    "Densa": [0, 2, 3, 4, 4, 5, 5, 6, 6, 8, 12],
    "Forte": [0, 1, 1, 2, 2, 3, 3, 4, 4, 6, 8],
    "Etérea": [0, 1, 1, 2, 2, 3, 3, 4, 4, 6, 8],
    "Mundo": [0, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20],
}
DEFAULT_ACTIONS = {
    "Fina": "bonus",
    "Impacto": "bonus",
    "Densa": "bonus",
    "Forte": "standard",
    "Etérea": "standard",
    "Mundo": "full",
}


def compact(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_spell_levels(spell: dict) -> None:
    expected = 1
    normalized: list[dict] = []
    for entry in spell.get("levels", []):
        level = int(entry.get("level", 0) or 0)
        text = compact(entry.get("text"))
        if level == expected:
            normalized.append({**entry, "level": level, "text": text})
            expected += 1
        elif normalized:
            normalized[-1]["text"] = compact(f"{normalized[-1].get('text', '')} {text}")
        else:
            raise ValueError(f"{spell.get('name')}: nível inicial inválido ({level}).")
    levels = [entry["level"] for entry in normalized]
    if levels != list(range(1, 11)):
        raise ValueError(f"{spell.get('name')}: trilha incompleta após normalização: {levels}.")
    spell["levels"] = normalized


def first_match(patterns: list[str], text: str) -> int | None:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return int(match.group(1))
    return None


def action_from_text(text: str, magic_type: str) -> str:
    folded = text.lower()
    if "ação completa" in folded:
        return "full"
    if "reação" in folded:
        return "reaction"
    if "ação padrão" in folded:
        return "standard"
    if "ação de movimento" in folded or "ação movimento" in folded:
        return "movement"
    if "ação bônus" in folded:
        return "bonus"
    return DEFAULT_ACTIONS[magic_type]


def spell_level_mechanics(text: str, magic_type: str, level: int) -> dict:
    fallback = FALLBACK_PM_COSTS[magic_type][level]
    activation = first_match(
        [
            r"(?:consome|custa|ativa com|ativar com)\s*(\d+)\s*PM",
            r"(\d+)\s*PM\b",
        ],
        text,
    )
    maintenance = first_match(
        [
            r"(\d+)\s*PM\s*(?:/|por\s*)turno",
            r"(?:manter|manutenção)[^.;]{0,50}?(\d+)\s*PM",
            r"(\d+)\s*PM\s*para\s*manter",
        ],
        text,
    )
    duration = first_match(
        [
            r"(?:dura|duração(?: de)?|ativo por)\s*(\d+)\s*turnos?",
            r"(\d+)\s*turnos?",
        ],
        text,
    )
    return {
        "activationCost": fallback if activation is None else activation,
        "maintenanceCost": maintenance or 0,
        "durationTurns": duration,
        "action": action_from_text(text, magic_type),
        "automation": "full",
    }


def normalize_database(database: dict) -> dict:
    spells = [*database.get("baseSpells", [])]
    spells.extend(spell for region in database.get("regions", []) for spell in region.get("magics", []))
    for spell in spells:
        if spell.get("name") == "Cúbito Da Balança":
            spell["baseType"] = "Densa"
        magic_type = spell.get("baseType")
        if magic_type not in VALID_MAGIC_TYPES:
            raise ValueError(f"{spell.get('name')}: tipo de magia inválido {magic_type!r}.")
        normalize_spell_levels(spell)
        for entry in spell["levels"]:
            entry.update(spell_level_mechanics(entry["text"], magic_type, entry["level"]))

    skills = database.setdefault("skills", [])
    if not any(skill.get("name") == "Percepção" for skill in skills):
        skills.append(
            {
                "name": "Percepção",
                "base": 15,
                "description": "Perceber detalhes, fluxos de energia, auras e manifestações mágicas.",
            }
        )
    return database

