"""Import the balanced Mundo laws from the official DOCX into data.js."""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path

from docx import Document


EXPECTED_TABLE_SIZES = (24, 23, 24, 5)
EXPECTED_COUNTS = {"Ofensivo": 24, "Defensivo": 23, "Utilitário": 29}
SOURCE_LABEL = "Leis_do_Mundo_Balanceadas_Marufia_v1.2.docx"


def compact(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def split_rule(cell_text: str) -> tuple[str, str]:
    lines = [compact(line) for line in cell_text.replace("\r", "\n").split("\n")]
    lines = [line for line in lines if line]
    if not lines:
        raise ValueError("Lei sem título na coluna 'Lei e regra comum'.")
    return lines[0], " ".join(lines[1:])


def first_sentence(text: str) -> str:
    match = re.match(r"(.+?[.!?])(?:\s|$)", text)
    return compact(match.group(1) if match else text)


def target_from(common_rule: str) -> str:
    explicit = re.search(r"(?:^|\s)Alvo:\s*(.+?)(?:\.|$)", common_rule, re.IGNORECASE)
    if explicit:
        return compact(explicit.group(1))
    return first_sentence(common_rule) or "Conforme regra comum."


def resistance_from(title: str, common_rule: str) -> str:
    fragments = re.split(r"(?<=[.!?;])\s+", common_rule)
    test_fragments = [
        fragment
        for fragment in fragments
        if re.search(r"\b(test\w*|resist\w*|use)\b", fragment, re.IGNORECASE)
    ]
    attributes: list[str] = []
    for fragment in test_fragments:
        for attribute in re.findall(r"\b(?:FOR|DES|CON|INT|SAB|POD)\b", fragment):
            if attribute not in attributes:
                attributes.append(attribute)
    if attributes:
        return " ou ".join(attributes)
    combined = f"{title} {common_rule}"
    if re.search(r"atributo apropriado", combined, re.IGNORECASE):
        return "Atributo apropriado"
    if re.search(r"resist|test\w*", combined, re.IGNORECASE):
        return "Conforme regra comum"
    return "Não se aplica"


def sentence_with(text: str, pattern: str) -> str | None:
    for sentence in re.split(r"(?<=[.!?])\s+", text):
        if re.search(pattern, sentence, re.IGNORECASE):
            return compact(sentence)
    return None


def outcome_fields(resistance: str, common_rule: str) -> tuple[str, str]:
    if resistance == "Não se aplica":
        return "Sem teste direto.", "Sem teste direto."
    on_failure = sentence_with(common_rule, r"\bem falha\b")
    on_success = sentence_with(common_rule, r"\bsucesso\b|\bse passar\b")
    return (
        on_failure or "Aplica o efeito integral descrito na Lei.",
        on_success or "Reduz ou evita o efeito conforme a regra comum.",
    )


def catalog_tables(document: Document):
    candidates = []
    for table in document.tables:
        if not table.rows or len(table.rows[0].cells) != 5:
            continue
        headers = [compact(cell.text) for cell in table.rows[0].cells]
        if headers == ["#", "Lei e regra comum", "N1", "N2", "N3"]:
            candidates.append(table)
    sizes = tuple(len(table.rows) - 1 for table in candidates)
    if sizes != EXPECTED_TABLE_SIZES:
        raise ValueError(
            f"Catálogo inesperado no DOCX: tabelas {sizes}; esperado {EXPECTED_TABLE_SIZES}."
        )
    return candidates


def parse_laws(source: Path) -> list[dict[str, str]]:
    document = Document(source)
    tables = catalog_tables(document)
    categories = ("Ofensivo", "Defensivo", "Utilitário", "Utilitário")
    prefixes = {"Ofensivo": "OFE", "Defensivo": "DEF", "Utilitário": "UTI"}
    counters = {category: 0 for category in EXPECTED_COUNTS}
    laws: list[dict[str, str]] = []

    for table, category in zip(tables, categories):
        for row in table.rows[1:]:
            title, common_rule = split_rule(row.cells[1].text)
            if not common_rule:
                raise ValueError(f"A lei '{title}' não possui regra comum.")
            counters[category] += 1
            resistance = resistance_from(title, common_rule)
            on_failure, on_success = outcome_fields(resistance, common_rule)
            laws.append(
                {
                    "ID": f"{prefixes[category]}-{counters[category]:02d}",
                    "Categoria": category,
                    "Lei do Mundo": title,
                    "N1 (Mundo 1-4)": compact(row.cells[2].text),
                    "N2 (Mundo 5-9)": compact(row.cells[3].text),
                    "N3 (Mundo 10)": compact(row.cells[4].text),
                    "Alvo": target_from(common_rule),
                    "Resistência sugerida": resistance,
                    "Se falhar": on_failure,
                    "Se passar": on_success,
                    "Força": "Conforme v1.2",
                    "Observações de equilíbrio": common_rule,
                    "Fonte": SOURCE_LABEL,
                }
            )

    if counters != EXPECTED_COUNTS:
        raise ValueError(f"Contagem importada incorreta: {counters}; esperado {EXPECTED_COUNTS}.")
    return laws


def category_key(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value or "")
    return "".join(char for char in normalized if unicodedata.category(char) != "Mn").upper()


def find_array_end(text: str, start: int) -> int:
    depth = 0
    in_string = False
    escaped = False
    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "[":
            depth += 1
        elif char == "]":
            depth -= 1
            if depth == 0:
                return index
    raise ValueError("Fim do array worldLaws não encontrado em data.js.")


def replace_world_laws(data_path: Path, imported_laws: list[dict[str, str]]) -> int:
    raw = data_path.read_bytes()
    has_bom = raw.startswith(b"\xef\xbb\xbf")
    text = raw.decode("utf-8-sig")
    marker = '"worldLaws":'
    marker_index = text.find(marker)
    if marker_index < 0:
        raise ValueError("Chave worldLaws não encontrada em data.js.")
    array_start = text.find("[", marker_index + len(marker))
    array_end = find_array_end(text, array_start)
    current_laws = json.loads(text[array_start : array_end + 1])
    hybrid_laws = [
        law for law in current_laws if "HIBRIDO" in category_key(law.get("Categoria", ""))
    ]
    replacement = json.dumps(imported_laws + hybrid_laws, ensure_ascii=False, indent=2)
    newline = "\r\n" if "\r\n" in text else "\n"
    replacement = replacement.replace("\n", newline + "  ")
    updated = text[:array_start] + replacement + text[array_end + 1 :]
    encoded = updated.encode("utf-8")
    if has_bom:
        encoded = b"\xef\xbb\xbf" + encoded
    data_path.write_bytes(encoded)
    return len(hybrid_laws)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Arquivo DOCX com o catálogo balanceado.")
    parser.add_argument(
        "--data",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "data.js",
        help="Arquivo data.js da ficha.",
    )
    args = parser.parse_args()
    laws = parse_laws(args.source)
    hybrid_count = replace_world_laws(args.data, laws)
    print(
        "Importação concluída: "
        f"{len(laws)} leis não híbridas e {hybrid_count} leis híbridas preservadas."
    )


if __name__ == "__main__":
    main()
