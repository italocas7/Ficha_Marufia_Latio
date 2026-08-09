"""Importa o catálogo textual definitivo de Leis do Mundo."""

from __future__ import annotations

import argparse
import re
import unicodedata
from pathlib import Path

from data_io import write_json


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "data-src" / "world_laws_definitive.txt"
DEFAULT_OUTPUT = ROOT / "data-src" / "world_laws.json"
EXPECTED_COUNTS = {"Ofensivo": 24, "Defensivo": 22, "Utilitário": 28}
SOURCE_LABEL = "Leis do Mundo definitivas fornecidas pelo usuário em 2026-08-08"
LEVEL_KEYS = {
    1: "N1 (Mundo 1-4)",
    2: "N2 (Mundo 5-9)",
    3: "N3 (Mundo 10)",
}


def compact(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def fold(value: object) -> str:
    normalized = unicodedata.normalize("NFD", str(value or ""))
    return "".join(char for char in normalized if unicodedata.category(char) != "Mn").upper()


def pretty_title(value: str) -> str:
    connectors = {"A", "AO", "AOS", "DA", "DAS", "DE", "DO", "DOS", "E", "EM", "PARA", "POR"}
    acronyms = {"CA", "PM"}
    result: list[str] = []
    for index, word in enumerate(compact(value).split(" ")):
        key = fold(word)
        if word == "—":
            result.append(word)
        elif key in acronyms:
            result.append(key)
        elif index and key in connectors:
            result.append(word.lower())
        else:
            result.append(word.lower().capitalize())
    return " ".join(result)


DUAL_TITLES = {
    "DANO EM ALVO",
    "DANO EM AREA",
    "AREA DE DANO AJUSTAVEL",
    "AUMENTO DE PENALIDADE",
    "DANO AO REALIZAR ACAO",
    "PENALIDADE EM FORMA DE ALCANCE",
    "EMPURRAO",
    "REDUCAO DE CA",
    "PUXAO",
}

COM_ONLY_TITLES = {
    "DANO EM MULTIPLOS ALVOS",
    "ACERTO SURPRESA",
    "AREA DE CONDICAO",
    "CONDICAO EM ALVO",
    "MOVIMENTO INSTANTANEO EM ALVO",
    "REMOVER ACAO EM ALVO",
    "REDUCAO DE MOVIMENTO EM AREA FIXA",
    "REDUCAO DE MOVIMENTO EM ALVO",
    "CONDICAO EM ACERTO",
    "REDUCAO DE MAGIA EM ALVO",
    "REDUCAO DE MAGIA EM AREA",
    "AUMENTO DE MAGIA EM AREA FIXA",
    "REDUCAO DE MAGIA EM AREA FIXA",
    "ACERTO EM ALVO",
    "REDUCAO DE SABEDORIA EM ALVO",
    "REDUCAO DE ESQUIVA EM ALVO",
    "DESTRUIR ARMA EM ALVO",
}

RESISTANCES = {
    "DANO EM ALVO": "CON ou POD, definida ao aprender a Lei",
    "DANO EM AREA": "Não especificada no texto definitivo",
    "AREA DE DANO AJUSTAVEL": "Não especificada no texto definitivo",
    "DANO EM MULTIPLOS ALVOS": "CON ou POD",
    "AUMENTO DE PENALIDADE": "POD",
    "DANO AO REALIZAR ACAO": "POD",
    "PENALIDADE EM FORMA DE ALCANCE": "POD",
    "ACERTO SURPRESA": "POD ou SAB",
    "EMPURRAO": "FOR ou CON",
    "REDUCAO DE CA": "DES ou POD",
    "PUXAO": "FOR ou CON",
    "AREA DE CONDICAO": "Apropriada à condição escolhida",
    "CONDICAO EM ALVO": "Apropriada à condição escolhida",
    "MOVIMENTO INSTANTANEO EM ALVO": "DES ou POD para alvo involuntário",
    "REMOVER ACAO EM ALVO": "POD",
    "REDUCAO DE MOVIMENTO EM AREA FIXA": "FOR ou CON",
    "REDUCAO DE MOVIMENTO EM ALVO": "FOR ou CON",
    "CONDICAO EM ACERTO": "Apropriada à condição escolhida",
    "REDUCAO DE MAGIA EM ALVO": "POD",
    "REDUCAO DE MAGIA EM AREA": "POD",
    "AUMENTO DE MAGIA EM AREA FIXA": "POD",
    "REDUCAO DE MAGIA EM AREA FIXA": "POD",
    "ACERTO EM ALVO": "POD ou SAB",
    "REDUCAO DE SABEDORIA EM ALVO": "POD",
    "REDUCAO DE ESQUIVA EM ALVO": "DES ou POD",
    "DESTRUIR ARMA EM ALVO": "POD para o portador",
}


def dual_levels(*levels: tuple[str, str]) -> dict[str, dict[str, str]]:
    return {
        "sem": {LEVEL_KEYS[index]: values[0] for index, values in enumerate(levels, 1)},
        "com": {LEVEL_KEYS[index]: values[1] for index, values in enumerate(levels, 1)},
    }


DUAL_EFFECTS = {
    "DANO EM ALVO": dual_levels(
        ("Causa 30 de dano mágico instantâneo.", "Em falha, causa 45 de dano mágico; em sucesso, causa 20."),
        ("Causa 60 de dano mágico instantâneo.", "Em falha, causa 80 de dano mágico; em sucesso, causa 50."),
        ("Causa 85 de dano mágico instantâneo.", "Em falha, causa 110 de dano mágico; em sucesso, causa 75."),
    ),
    "DANO EM AREA": dual_levels(
        ("Círculo de 3 m de raio; causa 15 de dano por criatura.", "Círculo de 3 m de raio; causa 30 em falha e 10 em sucesso."),
        ("Círculo de 6 m de raio; causa 30 de dano por criatura.", "Círculo de 6 m de raio; causa 50 em falha e 20 em sucesso."),
        ("Círculo de 12 m de raio; causa 45 de dano por criatura.", "Círculo de 12 m de raio; causa 70 em falha e 35 em sucesso."),
    ),
    "AREA DE DANO AJUSTAVEL": dual_levels(
        ("Raios de 1,5/3 m causam, respectivamente, 20/15 de dano.", "Raios de 1,5/3 m causam 35/25 em falha e 10/5 em sucesso."),
        ("Raios de 1,5/3/6 m causam, respectivamente, 50/40/25 de dano.", "Raios de 1,5/3/6 m causam 70/60/45 em falha e 40/30/15 em sucesso."),
        ("Raios de 3/6/12 m causam, respectivamente, 70/55/40 de dano.", "Raios de 3/6/12 m causam 95/80/65 em falha e 60/45/30 em sucesso."),
    ),
    "AUMENTO DE PENALIDADE": dual_levels(
        ("Aumenta a penalidade existente em 15.", "Aumenta a penalidade em 20 na falha ou 10 no sucesso."),
        ("Aumenta a penalidade existente em 30.", "Aumenta a penalidade em 40 na falha ou 25 no sucesso."),
        ("Aumenta a penalidade existente em 60.", "Aumenta a penalidade em 85 na falha ou 45 no sucesso."),
    ),
    "DANO AO REALIZAR ACAO": dual_levels(
        ("Até três vezes, cada ação válida causa 10 de dano.", "Até três vezes, cada ação válida causa 25 na falha ou 0 no sucesso."),
        ("Até três vezes, cada ação válida causa 20 de dano.", "Até três vezes, cada ação válida causa 40 na falha ou 10 no sucesso."),
        ("Até três vezes, cada ação válida causa 30 de dano.", "Até três vezes, cada ação válida causa 55 na falha ou 20 no sucesso."),
    ),
    "PENALIDADE EM FORMA DE ALCANCE": dual_levels(
        ("Cone ou linha de 6 m aplica -15.", "Cone ou linha de 6 m aplica -30 na falha ou -5 no sucesso."),
        ("Cone ou linha de 12 m aplica -30.", "Cone ou linha de 12 m aplica -50 na falha ou -20 no sucesso."),
        ("Cone ou linha de 24 m aplica -45.", "Cone ou linha de 24 m aplica -70 na falha ou -35 no sucesso."),
    ),
    "EMPURRAO": dual_levels(
        ("Empurra o alvo 6 m.", "Empurra 21 m na falha ou 0 m no sucesso."),
        ("Empurra o alvo 12 m.", "Empurra 32 m na falha ou 2 m no sucesso."),
        ("Empurra o alvo 18 m.", "Empurra 43 m na falha ou 8 m no sucesso."),
    ),
    "REDUCAO DE CA": dual_levels(
        ("Reduz a CA em 20.", "Reduz a CA em 35 na falha ou 10 no sucesso."),
        ("Reduz a CA em 35.", "Reduz a CA em 55 na falha ou 25 no sucesso."),
        ("Reduz a CA em 55.", "Reduz a CA em 80 na falha ou 45 no sucesso."),
    ),
    "PUXAO": dual_levels(
        ("Puxa o alvo 6 m.", "Puxa 21 m na falha ou 0 m no sucesso."),
        ("Puxa o alvo 12 m.", "Puxa 32 m na falha ou 2 m no sucesso."),
        ("Puxa o alvo 18 m.", "Puxa 43 m na falha ou 8 m no sucesso."),
    ),
}


def parse_sections(text: str) -> list[dict[str, str]]:
    marker = re.compile(r"^\s*LEIS\s+(OFENSIVAS|DEFENSIVAS|UTILITÁRIAS)\s*:?\s*$", re.MULTILINE)
    matches = list(marker.finditer(text))
    if len(matches) != 3:
        raise ValueError(f"Esperadas 3 seções de Leis; encontradas {len(matches)}.")
    category_map = {"OFENSIVAS": "Ofensivo", "DEFENSIVAS": "Defensivo", "UTILITÁRIAS": "Utilitário"}
    parsed: list[dict[str, str]] = []
    for index, match in enumerate(matches):
        category = category_map[match.group(1)]
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        body = text[match.end():end].strip()
        for block in re.split(r"\n\s*\n+", body):
            lines = [compact(line) for line in block.splitlines() if compact(line)]
            if not lines:
                continue
            record = {"Categoria": category, "Título": lines[0]}
            current = ""
            for line in lines[1:]:
                label = re.match(r"^(ALCANCE|DESCRIÇÃO|PRÓXIMOS NÍVEIS):\s*(.*)$", line)
                if label:
                    current = label.group(1)
                    record[current] = label.group(2)
                elif current:
                    record[current] = compact(f"{record[current]} {line}")
            missing = [field for field in ("ALCANCE", "DESCRIÇÃO", "PRÓXIMOS NÍVEIS") if not record.get(field)]
            if missing:
                raise ValueError(f"{record['Título']}: campos ausentes {missing}.")
            parsed.append(record)
    return parsed


def modes_for(title_key: str) -> list[str]:
    if title_key in DUAL_TITLES:
        return ["sem", "com"]
    if title_key in COM_ONLY_TITLES:
        return ["com"]
    return ["sem"]


def split_progression(value: str) -> tuple[str, str]:
    text = compact(value)
    n2_match = re.search(r"\b(?:no\s+)?nível\s+2\b", text, re.IGNORECASE)
    n3_match = re.search(r"\b(?:no\s+)?nível\s+3\b", text[n2_match.end():] if n2_match else "", re.IGNORECASE)
    if not n2_match or not n3_match:
        raise ValueError(f"Progressão sem marcadores Nível 2/Nível 3: {text}")
    n3_start = n2_match.end() + n3_match.start()
    between_start = n2_match.end()
    separators = [
        (match.start(), match.end())
        for match in re.finditer(r"(?:\.\s+|;\s+|\s+e\s+)", text[between_start:n3_start], re.IGNORECASE)
    ]
    if separators:
        separator_start, separator_end = separators[-1]
        split_start = between_start + separator_end
        n2_end = between_start + separator_start
    else:
        split_start = n3_start
        n2_end = n3_start
    n2 = compact(text[:n2_end]).rstrip(";,")
    n3 = compact(text[split_start:])
    if not n2 or not n3:
        raise ValueError(f"Não foi possível separar a progressão: {text}")
    if "NIVEL 3" in fold(n2) or "NIVEL 2" in fold(n3):
        raise ValueError(f"Progressão cruzada após separação: N2={n2!r}; N3={n3!r}")
    def label(effect: str, level: int) -> str:
        cleaned = re.sub(rf"\b(?:no\s+)?nível\s+{level}\b\s*,?", "", effect, flags=re.IGNORECASE)
        cleaned = compact(cleaned).strip(" ;,.")
        cleaned = re.sub(r"\s+([.,;:])", r"\1", cleaned)
        cleaned = re.sub(r"(?<=[.!?])\s+([a-zá-ú])", lambda match: f" {match.group(1).upper()}", cleaned)
        cleaned = cleaned[:1].upper() + cleaned[1:]
        return f"Nível {level}: {cleaned}."

    return label(n2, 2), label(n3, 3)


def parse_laws(source: Path) -> list[dict]:
    records = parse_sections(source.read_text(encoding="utf-8-sig"))
    counters = {category: 0 for category in EXPECTED_COUNTS}
    prefixes = {"Ofensivo": "OFE", "Defensivo": "DEF", "Utilitário": "UTI"}
    laws: list[dict] = []
    for record in records:
        category = record["Categoria"]
        counters[category] += 1
        title_key = fold(record["Título"])
        modes = modes_for(title_key)
        n2_effect, n3_effect = split_progression(record["PRÓXIMOS NÍVEIS"])
        levels = {
            LEVEL_KEYS[1]: record["DESCRIÇÃO"],
            LEVEL_KEYS[2]: n2_effect,
            LEVEL_KEYS[3]: n3_effect,
        }
        structured = DUAL_EFFECTS.get(title_key)
        if structured:
            levels = {
                key: f"Sem: {structured['sem'][key]} Com: {structured['com'][key]}"
                for key in LEVEL_KEYS.values()
            }
        resistance = RESISTANCES.get(title_key, "Não se aplica")
        has_resistance = "com" in modes
        law = {
            "ID": f"{prefixes[category]}-{counters[category]:02d}",
            "Categoria": category,
            "Lei do Mundo": pretty_title(record["Título"]),
            **levels,
            "Alvo": record["ALCANCE"],
            "Resistência sugerida": resistance,
            "Se falhar": "Aplica o resultado de falha descrito no efeito do nível atual." if has_resistance else "Sem teste direto.",
            "Se passar": "Aplica o resultado de sucesso descrito no efeito do nível atual." if has_resistance else "Sem teste direto.",
            "Modos de Resistência": modes,
            "Descrição": record["DESCRIÇÃO"],
            "Próximos níveis": record["PRÓXIMOS NÍVEIS"],
            "Força": "Definitiva",
            "Observações de equilíbrio": f"{record['DESCRIÇÃO']} {record['PRÓXIMOS NÍVEIS']}",
            "Fonte": SOURCE_LABEL,
        }
        if structured:
            law["Efeitos por modo"] = structured
        laws.append(law)

    if counters != EXPECTED_COUNTS:
        raise ValueError(f"Contagem importada incorreta: {counters}; esperado {EXPECTED_COUNTS}.")
    if set(DUAL_TITLES) != {fold(law["Lei do Mundo"]) for law in laws if law["Modos de Resistência"] == ["sem", "com"]}:
        raise ValueError("A classificação das Leis duplas ficou inconsistente.")
    return laws


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", nargs="?", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    laws = parse_laws(args.source)
    write_json(args.output, laws)
    counts = {category: sum(law["Categoria"] == category for law in laws) for category in EXPECTED_COUNTS}
    print(f"Importação concluída: {len(laws)} Leis definitivas {counts}.")


if __name__ == "__main__":
    main()
