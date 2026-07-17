"""Normalization rules shared by Latio's importers and deterministic build."""

from __future__ import annotations

import re


VALID_MAGIC_TYPES = ("Fina", "Impacto", "Densa", "Mundo", "Forte", "Etérea")
VALID_ACTIONS = ("standard", "bonus", "movement", "reaction", "full", "free")
DEFAULT_ACTIONS = {
    "Fina": "bonus",
    "Impacto": "bonus",
    "Densa": "bonus",
    "Forte": "standard",
    "Etérea": "standard",
    "Mundo": "full",
}
TALENT_TAGS = {
    "passive": "Passivo",
    "conditional": "Ativável/Condicionável",
    "mixed": "Misto",
    "manual": "Manual",
}


def compact(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_spell_levels(spell: dict) -> None:
    entries = spell.get("levels", [])
    normalized: list[dict] = []
    for index, entry in enumerate(entries):
        expected = index + 1
        level = int(entry.get("level", 0) or 0)
        text = compact(entry.get("text"))
        if level != expected:
            snippet = text[:120] or "<sem texto>"
            raise ValueError(
                f"{spell.get('name')}: esperado nível {expected}, encontrado {level}; trecho: {snippet}"
            )
        normalized.append({**entry, "level": level, "text": text})
    levels = [entry["level"] for entry in normalized]
    if levels != list(range(1, 11)):
        expected = len(levels) + 1
        raise ValueError(f"{spell.get('name')}: esperado nível {expected}; trilha encontrada: {levels}.")
    spell["levels"] = normalized


def first_match(patterns: list[str], text: str) -> int | None:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return int(match.group(1))
    return None


def action_in_clause(text: str) -> str | None:
    folded = text.lower()
    if "ação completa" in folded:
        return "full"
    if "ação padrão" in folded:
        return "standard"
    if "ação de movimento" in folded or "ação movimento" in folded:
        return "movement"
    if "ação bônus" in folded:
        return "bonus"
    if "reação" in folded:
        return "reaction"
    if "ação livre" in folded:
        return "free"
    return None


def actions_in_text(text: str) -> list[str]:
    folded = text.lower()
    result: list[str] = []
    checks = [
        ("full", ("ação completa",)),
        ("standard", ("ação padrão",)),
        ("movement", ("ação de movimento", "ação movimento")),
        ("bonus", ("ação bônus",)),
        ("reaction", ("reação",)),
        ("free", ("ação livre",)),
    ]
    for action, terms in checks:
        if any(term in folded for term in terms):
            result.append(action)
    return result


def action_mechanics(text: str, magic_type: str) -> tuple[str, list[str], str]:
    clauses = re.split(r"(?<=[.!?])\s+", compact(text), maxsplit=1)
    explicit = action_in_clause(clauses[0]) if clauses else None
    activation = explicit or DEFAULT_ACTIONS[magic_type]
    secondary = [action for action in actions_in_text(clauses[1] if len(clauses) > 1 else "") if action != activation]
    return activation, secondary, "text" if explicit else "type-rule"


def spell_level_mechanics(text: str, magic_type: str, level: int) -> dict:
    activation = first_match(
        [
            r"(?:consumo\s+(?:[ée]\s+)?(?:de\s+)?|consome|custa|ativa\s+com|ativar\s+com|gastando|gasta)(?:\s*\([^)]*\))?\s*(\d+)\s*PM",
            r"(?:custo|consumo)\s*(?:final\s*)?(?:[ée:]\s*)?(\d+)\s*PM",
        ],
        text,
    )
    maintenance = first_match(
        [
            r"(\d+)\s*PM\s*(?:/\s*|por\s+(?:cada\s+)?)turno",
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
    activation_action, secondary_actions, action_source = action_mechanics(text, magic_type)
    automation = "complete" if activation is not None else "manual"
    return {
        "activationCost": activation,
        "maintenanceCost": maintenance if maintenance is not None else 0,
        "durationTurns": duration,
        "durationFormula": "",
        "activationAction": activation_action,
        "secondaryActions": secondary_actions,
        "action": activation_action,
        "automationLevel": automation,
        "automation": automation,
        "mechanicsSource": {
            "activationCost": "text" if activation is not None else "missing",
            "maintenanceCost": "text" if maintenance is not None else "not-stated",
            "duration": "text" if duration is not None else "not-stated",
            "activationAction": action_source,
            "secondaryActions": "text" if secondary_actions else "not-stated",
        },
    }


def apply_spell_overrides(spells: list[dict], payload: dict | None) -> None:
    overrides = payload.get("levels", []) if payload else []
    spell_by_id = {spell.get("id"): spell for spell in spells}
    seen: set[tuple[str, int]] = set()
    for override in overrides:
        spell_id = override.get("spellId")
        level = int(override.get("level", 0) or 0)
        key = (spell_id, level)
        if key in seen:
            raise ValueError(f"Override de magia duplicado: {spell_id} N{level}.")
        seen.add(key)
        spell = spell_by_id.get(spell_id)
        if not spell or not 1 <= level <= 10:
            raise ValueError(f"Override aponta para magia/nível inexistente: {spell_id} N{level}.")
        entry = spell["levels"][level - 1]
        action = override.get("activationAction", entry["activationAction"])
        secondary = override.get("secondaryActions", entry["secondaryActions"])
        if action not in VALID_ACTIONS or any(item not in VALID_ACTIONS for item in secondary):
            raise ValueError(f"Override de ação inválido: {spell_id} N{level}.")
        entry["activationAction"] = action
        entry["secondaryActions"] = list(dict.fromkeys(secondary))
        entry["action"] = action
        entry["mechanicsSource"]["activationAction"] = "override"
        entry["mechanicsSource"]["secondaryActions"] = "override"


def normalize_talents(database: dict, payload: dict | None) -> None:
    rules = payload.get("rules", {}) if payload else {}
    talents = database.get("talents", [])
    names = {talent.get("name") for talent in talents}
    missing = sorted(name for name in names if name not in rules)
    extra = sorted(name for name in rules if name not in names)
    if missing or extra:
        raise ValueError(f"Regras de talentos divergentes; ausentes={missing}, extras={extra}.")
    for talent in talents:
        rule = rules[talent["name"]]
        mode = rule.get("mode")
        if mode not in TALENT_TAGS:
            raise ValueError(f"{talent['name']}: modo de talento inválido {mode!r}.")
        passive = rule.get("passive", {})
        conditional = rule.get("conditional", {})
        talent.update(
            {
                "tag": TALENT_TAGS[mode],
                "mode": mode,
                "stackable": bool(rule.get("stackable", False)),
                "automationLevel": rule.get("automationLevel", "manual"),
                "skillMods": [
                    {**modifier, "source": talent["name"]} for modifier in passive.get("skillMods", [])
                ],
                "attributeMods": passive.get("attributeMods", {}),
                "resourceMods": passive.get("resourceMods", {}),
                "acMod": passive.get("acMod", 0),
                "conditionalMods": {
                    "skillMods": [
                        {**modifier, "source": talent["name"]} for modifier in conditional.get("skillMods", [])
                    ],
                    "attributeMods": conditional.get("attributeMods", {}),
                    "resourceMods": conditional.get("resourceMods", {}),
                    "acMod": conditional.get("acMod", 0),
                    "attackMod": conditional.get("attackMod", 0),
                },
            }
        )


def normalize_database(database: dict, talent_rules: dict | None = None, spell_overrides: dict | None = None) -> dict:
    spells = [*database.get("baseSpells", [])]
    spells.extend(spell for region in database.get("regions", []) for spell in region.get("magics", []))
    for spell in spells:
        if spell.get("name") == "Cúbito Da Balança":
            spell["baseType"] = "Densa"
        magic_type = spell.get("baseType")
        if magic_type not in VALID_MAGIC_TYPES:
            raise ValueError(f"{spell.get('name')}: tipo de magia inválido {magic_type!r}.")
        normalize_spell_levels(spell)
        inherited_cost = None
        inherited_from = None
        for entry in spell["levels"]:
            entry.update(spell_level_mechanics(entry["text"], magic_type, entry["level"]))
            if entry["activationCost"] is None:
                if inherited_cost is None:
                    raise ValueError(f"{spell.get('name')} N{entry['level']}: custo de ativação ausente e sem nível anterior.")
                entry["activationCost"] = inherited_cost
                entry["automationLevel"] = "complete"
                entry["automation"] = "complete"
                entry["mechanicsSource"]["activationCost"] = f"inherited:N{inherited_from}"
            else:
                inherited_cost = entry["activationCost"]
                inherited_from = entry["level"]
            if magic_type == "Mundo":
                entry["durationFormula"] = "1d4" if entry["level"] <= 4 else "1d4+2"
                entry["mechanicsSource"]["duration"] = "manual-rule"
    apply_spell_overrides(spells, spell_overrides)

    skills = database.setdefault("skills", [])
    if not any(skill.get("name") == "Percepção" for skill in skills):
        skills.append(
            {
                "name": "Percepção",
                "base": 15,
                "description": "Perceber detalhes, fluxos de energia, auras e manifestações mágicas.",
            }
        )
    normalize_talents(database, talent_rules)
    return database
