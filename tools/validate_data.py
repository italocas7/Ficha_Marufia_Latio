"""Validate the canonical and generated databases before publishing Latio."""

from __future__ import annotations

import json
import hashlib
import unicodedata
from collections import Counter
from pathlib import Path

from data_io import load_data_js, load_json
from data_rules import normalize_database


ROOT = Path(__file__).resolve().parents[1]
VALID_MAGIC_TYPES = {"Fina", "Impacto", "Densa", "Mundo", "Forte", "Etérea"}
EXPECTED_LAWS = {"Ofensivo": 24, "Defensivo": 23, "Utilitário": 29}
EXPECTED_LAW_FILTERS = {
    ("Ofensivo", "sem"): 22,
    ("Ofensivo", "com"): 11,
    ("Defensivo", "sem"): 23,
    ("Defensivo", "com"): 0,
    ("Utilitário", "sem"): 13,
    ("Utilitário", "com"): 16,
}


def fold(value: str) -> str:
    normalized = unicodedata.normalize("NFD", str(value or ""))
    return "".join(char for char in normalized if unicodedata.category(char) != "Mn").upper()


def all_spells(database: dict) -> list[dict]:
    regional = [spell for region in database.get("regions", []) for spell in region.get("magics", [])]
    return [*database.get("baseSpells", []), *regional]


def validate_unique_ids(items: list[dict], label: str, errors: list[str]) -> None:
    ids = [item.get("id") or item.get("ID") for item in items]
    missing = [index for index, value in enumerate(ids) if not value]
    duplicates = [value for value, count in Counter(ids).items() if value and count > 1]
    if missing:
        errors.append(f"{label}: IDs ausentes nos índices {missing}.")
    if duplicates:
        errors.append(f"{label}: IDs duplicados: {duplicates}.")


def validate_database(database: dict) -> list[str]:
    errors: list[str] = []
    spells = all_spells(database)
    validate_unique_ids(spells, "Magias", errors)
    for spell in spells:
        name = spell.get("name", "Magia sem nome")
        if spell.get("baseType") not in VALID_MAGIC_TYPES:
            errors.append(f"{name}: tipo inválido {spell.get('baseType')!r}.")
        levels = [entry.get("level") for entry in spell.get("levels", [])]
        if levels != list(range(1, 11)):
            errors.append(f"{name}: níveis {levels}; esperado 1 a 10.")
        for entry in spell.get("levels", []):
            required_mechanics = {
                "activationCost", "maintenanceCost", "durationTurns", "durationFormula", "activationAction",
                "secondaryActions", "action", "automationLevel", "automation", "mechanicsSource",
            }
            missing = sorted(required_mechanics - set(entry))
            if missing:
                errors.append(f"{name} N{entry.get('level')}: campos mecânicos ausentes {missing}.")
            if entry.get("action") not in {"standard", "bonus", "movement", "reaction", "full", "free"}:
                errors.append(f"{name} N{entry.get('level')}: ação inválida {entry.get('action')!r}.")
            if entry.get("automation") not in {"complete", "partial", "manual"}:
                errors.append(f"{name} N{entry.get('level')}: automação inválida {entry.get('automation')!r}.")
            if entry.get("activationCost") is None:
                errors.append(f"{name} N{entry.get('level')}: custo de ativação sem origem confirmada.")
            cost_source = entry.get("mechanicsSource", {}).get("activationCost", "")
            if cost_source not in {"text", "override"} and not cost_source.startswith("inherited:N"):
                errors.append(f"{name} N{entry.get('level')}: origem do custo de ativação inválida.")
            if entry.get("action") != entry.get("activationAction"):
                errors.append(f"{name} N{entry.get('level')}: alias action diverge de activationAction.")

    perception = next((skill for skill in database.get("skills", []) if skill.get("name") == "Percepção"), None)
    if not perception or perception.get("base") != 15:
        errors.append("Percepção deve existir na base com valor 15.")
    skills = database.get("skills", [])
    skill_names = {skill.get("name") for skill in skills}
    if len(skills) != 37:
        errors.append(f"Perícias: {len(skills)}; esperado 37 após remover Escalar.")
    if "Escalar" in skill_names:
        errors.append("Escalar não deve existir na tabela de perícias.")

    backgrounds = database.get("backgrounds", {})
    family_backgrounds = backgrounds.get("family", [])
    personal_backgrounds = backgrounds.get("personal", [])
    if len(family_backgrounds) != 12 or len(personal_backgrounds) != 12:
        errors.append(
            f"Antecedentes: {len(family_backgrounds)} familiares e {len(personal_backgrounds)} pessoais; esperado 12 de cada."
        )
    for background, expected_bonus_count in [
        *((item, 2) for item in family_backgrounds),
        *((item, 3) for item in personal_backgrounds),
    ]:
        bonuses = background.get("bonuses", [])
        if len(bonuses) != expected_bonus_count:
            errors.append(
                f"{background.get('name')}: {len(bonuses)} bônus estruturados; esperado {expected_bonus_count}."
            )
        invalid_skills = [bonus.get("skill") for bonus in bonuses if bonus.get("skill") not in skill_names]
        if invalid_skills:
            errors.append(f"{background.get('name')}: perícias de bônus inexistentes {invalid_skills}.")

    regions = database.get("regions", [])
    region_codes = {region.get("code") for region in regions}
    validate_unique_ids([culture for region in regions for culture in region.get("cultures", [])], "Culturas", errors)
    for region in regions:
        for culture in region.get("cultures", []):
            if culture.get("regionCode") not in region_codes:
                errors.append(f"{culture.get('name')}: região inexistente {culture.get('regionCode')!r}.")
            visible_skill_text = fold(f"{culture.get('skillBonusesText', '')} {culture.get('weakness', '')}")
            if "EM ESCALAR" in visible_skill_text or "ESCALAR +" in visible_skill_text:
                errors.append(f"{culture.get('name')}: referência visível a Escalar não foi convertida para Atletismo.")
            invalid_escalar_bonuses = [
                bonus.get("skill")
                for bonus in [*culture.get("skillBonuses", []), *culture.get("weaknessBonuses", [])]
                if "ESCALAR" in fold(bonus.get("skill"))
            ]
            if invalid_escalar_bonuses:
                errors.append(f"{culture.get('name')}: modificadores de Escalar inválidos {invalid_escalar_bonuses}.")

    laws = database.get("worldLaws", [])
    validate_unique_ids(laws, "Leis", errors)
    law_counts = Counter(law.get("Categoria") for law in laws)
    if dict(law_counts) != EXPECTED_LAWS:
        errors.append(f"Leis por categoria: {dict(law_counts)}; esperado {EXPECTED_LAWS}.")
    for law in laws:
        required = ["ID", "Categoria", "Lei do Mundo", "Alvo", "Resistência sugerida"]
        missing = [key for key in required if not str(law.get(key, "")).strip()]
        if missing:
            errors.append(f"{law.get('ID', 'Lei')}: campos ausentes {missing}.")
    siphon = next((law for law in laws if law.get("ID") == "UTI-29"), None)
    if not siphon or fold(siphon.get("Resistência sugerida")) in {"", "NAO SE APLICA"}:
        errors.append("UTI-29 Sifão de Mana deve ser uma Lei COM resistência.")
    filter_counts: Counter = Counter()
    for law in laws:
        title = fold(law.get("Lei do Mundo"))
        if "SEM/COM RESISTENCIA" in title or "COM/SEM RESISTENCIA" in title:
            modes = ("sem", "com")
        elif law.get("ID") == "UTI-29" or "COM RESISTENCIA" in title:
            modes = ("com",)
        else:
            modes = ("sem",)
        for mode in modes:
            filter_counts[(law.get("Categoria"), mode)] += 1
    for key, expected in EXPECTED_LAW_FILTERS.items():
        if filter_counts[key] != expected:
            errors.append(f"Filtro de Leis {key}: {filter_counts[key]}; esperado {expected}.")

    cubit = next((spell for spell in spells if fold(spell.get("name")) == "CUBITO DA BALANCA"), None)
    if not cubit or cubit.get("baseType") != "Densa":
        errors.append("Cúbito da Balança deve usar o tipo Densa.")
    for talent in database.get("talents", []):
        if talent.get("mode") not in {"passive", "conditional", "mixed", "manual"}:
            errors.append(f"{talent.get('name')}: modo de talento inválido.")
        if not isinstance(talent.get("stackable"), bool):
            errors.append(f"{talent.get('name')}: stackable deve ser booleano.")
        if not isinstance(talent.get("conditionalMods"), dict):
            errors.append(f"{talent.get('name')}: modificadores condicionais ausentes.")
    return errors


def load_canonical() -> dict:
    database = load_json(ROOT / "data-src" / "database.json")
    database["worldLaws"] = load_json(ROOT / "data-src" / "world_laws.json")
    return normalize_database(
        database,
        talent_rules=load_json(ROOT / "data-src" / "talent_rules.json"),
        spell_overrides=load_json(ROOT / "data-src" / "spell_mechanics_overrides.json"),
    )


def logical_json(database: dict) -> str:
    return json.dumps(database, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def main() -> None:
    canonical = load_canonical()
    generated = load_data_js(ROOT / "data.js")
    errors = validate_database(canonical)
    if logical_json(canonical) != logical_json(generated):
        errors.append("data.js diverge da fonte canônica.")
    manifest = load_json(ROOT / "data-src" / "source_manifest.json")
    current_hash = hashlib.sha256((ROOT / "data.js").read_bytes()).hexdigest()
    if manifest.get("bootstrap", {}).get("sha256") != current_hash:
        errors.append("source_manifest.json não corresponde ao data.js atual.")
    if errors:
        print("Falhas de integridade:")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)
    print(
        f"Base válida: {len(all_spells(canonical))} magias, "
        f"{len(canonical['skills'])} perícias e {len(canonical['worldLaws'])} Leis."
    )


if __name__ == "__main__":
    main()
