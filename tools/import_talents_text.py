"""Importa o catálogo definitivo de Talentos para a fonte canônica da ficha."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_SOURCE = ROOT / "data-src"
SOURCE_PATH = DATA_SOURCE / "talents_definitive.txt"
DATABASE_PATH = DATA_SOURCE / "database.json"
RULES_PATH = DATA_SOURCE / "talent_rules.json"
EXPECTED_TALENTS = 88

LOWERCASE_WORDS = {"a", "as", "da", "das", "de", "do", "dos", "e", "em", "o", "os", "pela", "pelo"}
NAME_OVERRIDES = {
    "AMADO PELA MAGIA": "Amado Pela Magia",
    "PORTA-ESTANDARTE": "Porta-Estandarte",
    "QUEBRA-GUARDA": "Quebra-Guarda",
    "RHO AIAS": "Rho Aias",
}

PASSIVE_TALENTS = {
    "Alerta",
    "Inexpugnável",
    "Mobilidade",
    "Perito",
    "Resiliente",
    "Robusto",
    "Aparador Preciso",
    "Amado Pela Magia",
    "Mundo Extensivo",
    "Veia Densa",
    "Absorção Completa",
}

MIXED_TALENTS = {
    "Adepto Marcial",
    "Arremesso Múltiplo",
    "Atleta",
    "Líder",
    "Sorrateiro",
    "Rédea de Ferro",
    "Ungido pela Magia",
}

STACKABLE_TALENTS = {"Amado Pela Magia", "Perito"}
COMPLETE_AUTOMATION = {"Alerta", "Amado Pela Magia", "Robusto"}

AUTOMATIC_EFFECTS = {
    "Adepto Marcial": {
        "passive": {
            "skillMods": [
                {"skill": "Lutar (Brigar)", "value": 5},
                {"skill": "Esquivar", "value": 5},
            ]
        }
    },
    "Alerta": {
        "passive": {
            "skillMods": [
                {"skill": "Percepção", "value": 10},
                {"skill": "Encontrar", "value": 10},
                {"skill": "Escutar", "value": 10},
            ]
        }
    },
    "Ambidestro": {"conditional": {"acMod": 5}},
    "Arremesso Múltiplo": {
        "passive": {
            "skillMods": [
                {"skill": "Arremessar", "value": 5},
                {"skill": "Lutar (Armas de Arremesso)", "value": 5},
            ]
        }
    },
    "Atacante Furioso": {"conditional": {"acMod": -10}},
    "Atleta": {
        "passive": {
            "skillMods": [{"skill": "Atletismo", "value": 10}],
            "attributeMods": {"FOR": 5, "DES": 5},
        }
    },
    "Cavaleiro de Justas": {
        "conditional": {
            "skillMods": [{"skill": "Cavalgar", "value": 10}],
            "attackMod": 10,
        }
    },
    "Curandeiro": {
        "conditional": {"skillMods": [{"skill": "Medicina", "value": 10}]}
    },
    "Duelista": {
        "conditional": {
            "skillMods": [{"skill": "Esquivar", "value": 5}],
            "acMod": 5,
            "attackMod": 5,
        }
    },
    "Líder": {
        "passive": {
            "skillMods": [
                {"skill": "Tática", "value": 10},
                {"skill": "Charme", "value": 5},
                {"skill": "Persuasão", "value": 5},
                {"skill": "Diplomacia", "value": 5},
            ]
        }
    },
    "Lobo Solitário": {"conditional": {"acMod": 5, "attackMod": 5}},
    "Queda Controlada": {
        "conditional": {"skillMods": [{"skill": "Atletismo", "value": 5}]}
    },
    "Corredor de Cerco": {
        "conditional": {
            "skillMods": [{"skill": "Atletismo", "value": 10}],
            "acMod": 10,
        }
    },
    "Cavaleiro Arqueiro": {"conditional": {"attackMod": 10}},
    "Rédea de Ferro": {
        "passive": {"skillMods": [{"skill": "Cavalgar", "value": 10}]}
    },
    "Rastreador de Caça": {
        "conditional": {
            "skillMods": [
                {"skill": "Rastrear", "value": 10},
                {"skill": "Encontrar", "value": 5},
            ],
            "attackMod": 5,
        }
    },
    "Artesão de Campanha": {
        "conditional": {"skillMods": [{"skill": "Arte/Ofício", "value": 5}]}
    },
    "Sorrateiro": {
        "passive": {"skillMods": [{"skill": "Furtividade", "value": 10}]}
    },
    "Amado Pela Magia": {"passive": {"resourceMods": {"pm": 5}}},
    "Ungido pela Magia": {"passive": {"resourceMods": {"pm": 20}}},
}


def fold(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(char for char in normalized if not unicodedata.combining(char)).upper().strip()


def title_pt(value: str) -> str:
    override = NAME_OVERRIDES.get(value.strip().upper())
    if override:
        return override
    words = value.strip().lower().split()
    return " ".join(
        word if index and word in LOWERCASE_WORDS else word[:1].upper() + word[1:]
        for index, word in enumerate(words)
    )


def parse_talents(path: Path = SOURCE_PATH, known_names: list[str] | None = None) -> list[dict]:
    lines = path.read_text(encoding="utf-8").splitlines()
    known_by_key = {fold(name): name for name in known_names or []}
    talents: list[dict] = []

    for index, line in enumerate(lines):
        match = re.match(r"^Pré-requisito:\s*(.+)$", line.strip(), flags=re.I)
        if not match:
            continue
        name_index = index - 1
        while name_index >= 0 and not lines[name_index].strip():
            name_index -= 1
        if name_index < 0:
            raise ValueError(f"Pré-requisito sem nome na linha {index + 1}.")
        raw_name = lines[name_index].strip()
        name = NAME_OVERRIDES.get(raw_name.upper(), known_by_key.get(fold(raw_name), title_pt(raw_name)))

        description_index = index + 1
        while description_index < len(lines) and not lines[description_index].strip():
            description_index += 1
        if description_index >= len(lines):
            raise ValueError(f"{name}: descrição ausente.")
        description_match = re.match(r"^Descrição:\s*(.+)$", lines[description_index].strip(), flags=re.I)
        if not description_match:
            raise ValueError(f"{name}: descrição inválida na linha {description_index + 1}.")

        talents.append(
            {
                "name": name,
                "prerequisite": match.group(1).strip(),
                "description": description_match.group(1).strip(),
            }
        )

    names = [talent["name"] for talent in talents]
    duplicates = sorted({name for name in names if names.count(name) > 1})
    if len(talents) != EXPECTED_TALENTS or duplicates:
        raise ValueError(
            f"Catálogo de talentos inválido: {len(talents)} itens; "
            f"esperado {EXPECTED_TALENTS}; duplicados={duplicates}."
        )
    return talents


def talent_rule(name: str) -> dict:
    mode = "passive" if name in PASSIVE_TALENTS else "mixed" if name in MIXED_TALENTS else "conditional"
    rule = {
        "mode": mode,
        "stackable": name in STACKABLE_TALENTS,
        "automationLevel": (
            "complete"
            if name in COMPLETE_AUTOMATION
            else "partial"
            if name in AUTOMATIC_EFFECTS
            else "manual"
        ),
    }
    rule.update(AUTOMATIC_EFFECTS.get(name, {}))
    return rule


def import_talents() -> tuple[list[dict], dict]:
    database = json.loads(DATABASE_PATH.read_text(encoding="utf-8"))
    known_names = [talent.get("name", "") for talent in database.get("talents", [])]
    talents = parse_talents(SOURCE_PATH, known_names)
    rules = {
        "schema": "latio-talent-rules-2",
        "rules": {talent["name"]: talent_rule(talent["name"]) for talent in talents},
    }
    database["talents"] = talents
    source_note = "Talentos definitivos fornecidos pelo usuário em 2026-08-09."
    database["sourceNotes"] = [
        note for note in database.get("sourceNotes", []) if fold(note) != "TALENTOS.DOCX"
    ]
    if source_note not in database["sourceNotes"]:
        database["sourceNotes"].append(source_note)
    DATABASE_PATH.write_text(json.dumps(database, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    RULES_PATH.write_text(json.dumps(rules, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return talents, rules


if __name__ == "__main__":
    imported, _ = import_talents()
    print(f"Talentos importados: {len(imported)}")
