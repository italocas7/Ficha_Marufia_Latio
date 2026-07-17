import argparse
import hashlib
import json
import re
from pathlib import Path

from data_io import load_json, write_data_js, write_json
from data_rules import normalize_database


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "tmp" / "source_extracts"
DATA_SOURCE = ROOT / "data-src"


def read_text(name):
    return (SRC / name).read_text(encoding="utf-8")


def clean_lines(text):
    lines = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("===== PAGE"):
            continue
        if re.fullmatch(r"\d+", line):
            continue
        lines.append(line)
    return lines


def compact(text):
    return re.sub(r"\s+", " ", text).strip()


def normalize_magic_type(value):
    value = value.strip().replace("Éteria", "Etérea").replace("Eteria", "Etérea")
    for key in ["Fina", "Impacto", "Densa", "Mundo", "Forte", "Etérea"]:
        if key.lower() in value.lower():
            return key
    raise ValueError(f"Tipo de magia regional não reconhecido: {value!r}.")


def parse_bonuses(text):
    bonuses = []
    text = text.replace("L. Animais", "Lidar com Animais")
    for skill, value in re.findall(r"([A-Za-zÀ-ÿ/() .]+?)\s*([+-]\s*\d+)", text):
        skill = compact(skill).strip(" ,.;")
        value = int(value.replace(" ", ""))
        if skill:
            bonuses.append({"skill": skill, "value": value})
    return bonuses


def parse_levels(block):
    lines = clean_lines(block)
    start = 0
    for i, line in enumerate(lines):
        if line.lower().startswith("nível de aptidão"):
            start = i + 1
            break
    levels = []
    current = None
    expected = 1
    for line in lines[start:]:
        if line.startswith("Nível de Aptidão"):
            continue
        match = re.match(r"^(10|[1-9])(?:\s+\([^)]+\))?\s+(.+)", line)
        if match and int(match.group(1)) == expected:
            if current:
                current["text"] = compact(current["text"])
                levels.append(current)
            current = {"level": int(match.group(1)), "text": match.group(2).strip()}
            expected += 1
        elif current:
            current["text"] += " " + line
    if current:
        current["text"] = compact(current["text"])
        levels.append(current)
    parsed = [entry["level"] for entry in levels]
    if parsed != list(range(1, 11)):
        raise ValueError(f"Trilha de magia inválida: {parsed}; esperado 1 a 10.")
    return levels


def parse_base_magic(manual):
    anchors = [
        ("Fina", "\nMagia Fina\n"),
        ("Impacto", "\nMagia Impacto\n"),
        ("Densa", "\nMagia Densa:\n"),
        ("Etérea", "\nMagia Éteria\n"),
        ("Forte", "\nMagia Forte\n"),
        ("Mundo", "\nMUNDO\n"),
    ]
    result = []
    positions = []
    search_from = manual.find("MAGIA E APTIDÕES")
    for name, anchor in anchors:
        pos = manual.find(anchor, search_from)
        positions.append((name, pos))
    end = manual.find("CARACTERÍSTICAS PESSOAIS", positions[-1][1])
    for idx, (name, pos) in enumerate(positions):
        if pos == -1:
            continue
        next_pos = positions[idx + 1][1] if idx + 1 < len(positions) else end
        block = manual[pos:next_pos]
        before_table = block.split("Nível de Aptidão", 1)[0]
        desc = compact("\n".join(clean_lines(before_table)[1:]))
        result.append(
            {
                "id": name.lower().replace("é", "e"),
                "name": name,
                "baseType": name,
                "regional": False,
                "description": desc,
                "levels": parse_levels(block),
            }
        )
    return result


def is_culture_heading(lines, index):
    if index + 1 >= len(lines):
        return False
    line = lines[index]
    if line.startswith(("REGIÃO ", "Região ", "●", "o ")):
        return False
    if len(line) < 3 or ":" in line:
        return False
    return line == line.upper() and lines[index + 1].startswith("Língua Nativa:")


def parse_culture(name, block, region_code, region_name):
    joined = "\n".join(block)
    get = lambda a, b=None: ""
    def field(start, end=None):
        pattern = re.escape(start) + r"(.*?)" + (re.escape(end) if end else r"\Z")
        match = re.search(pattern, joined, flags=re.S)
        return compact(match.group(1)) if match else ""

    native = field("Língua Nativa:", "Descrição:")
    description = field("Descrição:", "● Arma Cultural:")
    weapon = field("● Arma Cultural:", "● Bônus em Perícias:")
    bonus_text = field("● Bônus em Perícias:", "● Habilidade Especial:")
    ability = field("● Habilidade Especial:", "● Fraqueza:")
    weakness = field("● Fraqueza:")
    ability = ability.replace(" o ", " | ")
    return {
        "id": re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"),
        "name": name.title(),
        "regionCode": region_code,
        "region": region_name,
        "nativeLanguage": native,
        "description": description,
        "weapon": weapon,
        "skillBonusesText": bonus_text,
        "skillBonuses": parse_bonuses(bonus_text),
        "ability": ability,
        "weakness": weakness,
        "weaknessBonuses": parse_bonuses(weakness),
    }


def parse_region_magic(title, block, region_code, region_name):
    joined = "\n".join(block)
    base_match = re.search(r"Base:\s*Magia\s+([A-Za-zÀ-ÿ]+)", joined)
    if base_match:
        base_type = normalize_magic_type(base_match.group(1))
    else:
        inferred = next((kind for kind in ("Fina", "Impacto", "Densa", "Mundo", "Forte", "Etérea") if re.search(rf"\b{kind}\b", joined, re.IGNORECASE)), None)
        if not inferred:
            raise ValueError(f"{title}: tipo regional ausente e não inferível.")
        base_type = inferred
    lines = clean_lines(joined)
    first_level = len(lines)
    for idx, line in enumerate(lines):
        if re.match(r"^(10|[1-9])(?:\s+\([^)]+\))?\s+(.+)", line):
            first_level = idx
            break
    description = "\n".join(lines[:first_level])
    if "Nível de Aptidão" in joined:
        description = joined.split("Nível de Aptidão", 1)[0]
    description = re.sub(r"Base:\s*Magia\s+[A-Za-zÀ-ÿ]+", "", description)
    return {
        "id": re.sub(r"[^a-z0-9]+", "-", f"{region_code}-{title}".lower()).strip("-"),
        "name": compact(title.title()),
        "regionCode": region_code,
        "region": region_name,
        "baseType": base_type,
        "regional": True,
        "description": compact(description),
        "levels": parse_levels(joined),
    }


def parse_regions(manual):
    start = manual.find("Região A - Ilhas Albiônicas", manual.find("Todos os Povos"))
    end = manual.find("ANTECEDENTES", start)
    lines = clean_lines(manual[start:end])
    regions = []
    current = None
    i = 0
    while i < len(lines):
        line = lines[i]
        region_match = re.match(r"^Região\s+([A-Z])\s+[–-]\s+(.+)$", line)
        if region_match:
            current = {
                "code": region_match.group(1),
                "name": compact(region_match.group(2)),
                "label": f"Região {region_match.group(1)} - {compact(region_match.group(2))}",
                "cultures": [],
                "magics": [],
            }
            regions.append(current)
            i += 1
            continue

        magic_match = re.match(r"^REGIÃO\s+([A-Z])\s+[–-]\s+(.+)$", line)
        if magic_match and current:
            title = magic_match.group(2)
            block = [line]
            i += 1
            while i < len(lines):
                if re.match(r"^REGIÃO\s+[A-Z]\s+[–-]\s+", lines[i]):
                    break
                if re.match(r"^Região\s+[A-Z]\s+[–-]\s+", lines[i]):
                    break
                if is_culture_heading(lines, i):
                    break
                block.append(lines[i])
                i += 1
            current["magics"].append(parse_region_magic(title, block, current["code"], current["name"]))
            continue

        if current and is_culture_heading(lines, i):
            name = line
            block = []
            i += 1
            while i < len(lines):
                if re.match(r"^REGIÃO\s+[A-Z]\s+[–-]\s+", lines[i]):
                    break
                if re.match(r"^Região\s+[A-Z]\s+[–-]\s+", lines[i]):
                    break
                if is_culture_heading(lines, i):
                    break
                block.append(lines[i])
                i += 1
            current["cultures"].append(parse_culture(name, block, current["code"], current["name"]))
            continue
        i += 1
    return regions


def parse_skill_list(manual):
    start = manual.find("PERICIAS", manual.find("===== PAGE 166"))
    end = manual.find("===== PAGE 168", start)
    lines = clean_lines(manual[start:end])
    skills = []
    for line in lines:
        if not line.startswith("● "):
            continue
        match = re.match(r"●\s*(.*?)\s*\((.*?)\):\s*(.*)", line)
        if not match:
            continue
        name, base, desc = match.groups()
        base = base.replace("%", "").strip()
        skills.append(
            {
                "name": compact(name),
                "base": base if "DES" in base else int(re.sub(r"\D", "", base) or 0),
                "description": compact(desc),
            }
        )
    if not any(s["name"] == "Escalar" for s in skills):
        skills.append(
            {
                "name": "Escalar",
                "base": 20,
                "description": "Subir, descer ou atravessar superfícies difíceis. Incluída para compatibilidade com antecedentes do manual.",
            }
        )
    return skills


def parse_backgrounds(manual):
    start = manual.find("ANTECEDENTES", manual.find("===== PAGE 119"))
    end = manual.find("EQUIPAMENTO E ECONOMIA", start)
    section = "\n".join(clean_lines(manual[start:end]))
    family = section.split("ANTECEDENTES FAMILIARES:", 1)[1].split("ANTECEDENTES PESSOAIS:", 1)[0]
    personal = section.split("ANTECEDENTES PESSOAIS:", 1)[1]

    def entries(block):
        matches = list(re.finditer(r"(?m)^([A-ZÁ-ÿ][^\n:]+)\nDescrição:", block))
        parsed = []
        for idx, match in enumerate(matches):
            name = compact(match.group(1))
            begin = match.start()
            finish = matches[idx + 1].start() if idx + 1 < len(matches) else len(block)
            chunk = block[begin:finish]
            desc = re.search(r"Descrição:\s*(.*?)\nBônus:", chunk, flags=re.S)
            bonus = re.search(r"Bônus:\s*(.*?)(?:\n1d6|\Z)", chunk, flags=re.S)
            item = {
                "id": re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-"),
                "name": name,
                "description": compact(desc.group(1)) if desc else "",
                "bonusText": compact(bonus.group(1)) if bonus else "",
                "bonuses": parse_bonuses(bonus.group(1) if bonus else ""),
            }
            tables = {}
            for label, key in [
                ("Traços de Personalidade", "traits"),
                ("Ideias", "ideals"),
                ("Ideais", "ideals"),
                ("Vínculos", "bonds"),
                ("Defeitos", "flaws"),
            ]:
                tmatch = re.search(rf"1d6 {label}\s*(.*?)(?=\n1d6|\Z)", chunk, flags=re.S)
                if tmatch:
                    values = []
                    for n, text in re.findall(r"(?m)^([1-6])\s+(.+)$", tmatch.group(1)):
                        values.append(compact(text))
                    if values:
                        tables[key] = values
            if tables:
                item["tables"] = tables
            parsed.append(item)
        return parsed

    return {"family": entries(family), "personal": entries(personal)}


def talent_tags_and_effects(talent):
    return dict(talent)


def build_database_from_extracts():
    manual = read_text("manual_pages.txt")
    talents = json.loads(read_text("talentos.json"))
    book = json.loads(read_text("book.json"))

    laws_header = book["Leis Balanceadas"][0]
    laws = []
    for row in book["Leis Balanceadas"][1:]:
        if not row or not row[0]:
            continue
        laws.append({laws_header[i]: row[i] if i < len(row) else "" for i in range(len(laws_header))})

    db = {
        "schema": "latio-db-1",
        "sourceNotes": [
            "Manual do Jogador Mundo de Marufia 3.1.pdf",
            "TALENTOS.docx",
            "Book.xlsx",
            "Ficha Marufia Automática.pdf usada como referência visual e de campos.",
        ],
        "attributes": ["FOR", "DES", "CON", "APA", "POD", "INT", "CAR", "SAB"],
        "bodyTable": [
            {"min": 2, "max": 64, "mod": "-1d4", "load": "15kg", "push": "50kg", "body": -1, "label": "Frágil, doente", "block": 0},
            {"min": 65, "max": 100, "mod": "0", "load": "45kg", "push": "175kg", "body": 0, "label": "Médio", "block": 0},
            {"min": 101, "max": 124, "mod": "+1d4", "load": "60kg", "push": "240kg", "body": 1, "label": "Forte", "block": 1},
            {"min": 125, "max": 164, "mod": "+1d6", "load": "80kg", "push": "320kg", "body": 2, "label": "Muito Forte", "block": 2},
            {"min": 165, "max": 204, "mod": "+2d6", "load": "110kg", "push": "440kg", "body": 3, "label": "Sobrehumano", "block": 3},
        ],
        "skills": parse_skill_list(manual),
        "backgrounds": parse_backgrounds(manual),
        "regions": parse_regions(manual),
        "baseSpells": parse_base_magic(manual),
        "talents": [talent_tags_and_effects(t) for t in talents],
        "worldLaws": laws,
        "weapons": [
            {"name": "Adaga", "damage": "1d4 perfurante", "weight": "0,5 kg", "property": "Finesse, Leve, Arremesso (6/18m)"},
            {"name": "Adaga de Misericórdia", "damage": "1d4 perfurante", "weight": "0,4 kg", "property": "Finesse, Leve, +1 dano em alvos caídos"},
            {"name": "Alabarda", "damage": "1d10 cortante", "weight": "3 kg", "property": "Duas Mãos, Alcance (3m)"},
            {"name": "Arco Composto", "damage": "1d8+1 perfurante", "weight": "1 kg", "property": "Duas Mãos, Alcance (9/45m)"},
            {"name": "Arco Curto", "damage": "1d6 perfurante", "weight": "1 kg", "property": "Duas Mãos, Alcance (9/24m)"},
            {"name": "Arco Longo", "damage": "1d10+2 perfurante", "weight": "1 kg", "property": "Duas Mãos, Alcance (45/180m)"},
            {"name": "Arpão", "damage": "1d6 perfurante", "weight": "2 kg", "property": "Arremesso (6/18m), Duas Mãos"},
            {"name": "Azagaia", "damage": "1d6 perfurante", "weight": "1 kg", "property": "Arremesso (9/36m), Leve"},
            {"name": "Bastão de Ferro", "damage": "1d6 contundente", "weight": "2 kg", "property": "Versátil (1d8)"},
            {"name": "Besta Leve", "damage": "2d8 perfurante", "weight": "2,5 kg", "property": "Duas Mãos, Alcance (24/96m), Carregamento"},
            {"name": "Besta Pesada", "damage": "2d10 perfurante", "weight": "8 kg", "property": "Duas Mãos, Alcance (30/120m), Carregamento"},
            {"name": "Besta de Mão", "damage": "2d6 perfurante", "weight": "1,5 kg", "property": "Munição (9/36m), Leve, Carregamento"},
            {"name": "Bordão", "damage": "1d6 contundente", "weight": "2 kg", "property": "Versátil (1d8)"},
            {"name": "Chicote", "damage": "1d4 cortante", "weight": "1,5 kg", "property": "Finesse, Alcance (3m)"},
            {"name": "Cimitarra", "damage": "1d6 cortante", "weight": "1,5 kg", "property": "Finesse, Leve"},
            {"name": "Clava", "damage": "1d4 contundente", "weight": "1 kg", "property": "Leve"},
            {"name": "Clava Espinhada", "damage": "1d6 contundente", "weight": "1,5 kg", "property": "Leve, +1 dano em sangramento"},
            {"name": "Clava Grande", "damage": "1d8 contundente", "weight": "5 kg", "property": "Pesada, Duas Mãos"},
            {"name": "Corrente com Bola", "damage": "1d8 contundente", "weight": "2 kg", "property": "Duas Mãos, Alcance (3m)"},
            {"name": "Dardo", "damage": "1d4 perfurante", "weight": "0,1 kg", "property": "Finesse, Arremesso (6/18m)"},
            {"name": "Espada Curta", "damage": "1d6 perfurante", "weight": "1 kg", "property": "Finesse, Leve"},
            {"name": "Espada de Duas Mãos", "damage": "2d6 cortante", "weight": "3 kg", "property": "Pesada, Duas Mãos"},
            {"name": "Espada Grande", "damage": "2d6 cortante", "weight": "3 kg", "property": "Pesada, Duas Mãos"},
            {"name": "Espada Longa", "damage": "1d8 cortante", "weight": "1,5 kg", "property": "Versátil (1d10)"},
            {"name": "Foice Curta", "damage": "1d4 cortante", "weight": "1 kg", "property": "Leve"},
            {"name": "Foice de Guerra", "damage": "1d6 cortante", "weight": "1,5 kg", "property": "Duas Mãos"},
            {"name": "Funda", "damage": "1d4 contundente", "weight": "0 kg", "property": "Munição (9/36m)"},
            {"name": "Gadanho de Guerra", "damage": "1d8 perfurante", "weight": "1,5 kg", "property": "Versátil (1d10)"},
            {"name": "Garrote", "damage": "1d4 contundente", "weight": "0,5 kg", "property": "Finesse, Especial (asfixia)"},
            {"name": "Glaive", "damage": "1d10 cortante", "weight": "3 kg", "property": "Pesada, Alcance (3m), Duas Mãos"},
            {"name": "Guandao", "damage": "1d10 cortante", "weight": "2 kg", "property": "Duas Mãos, Alcance (3m)"},
            {"name": "Kusarigama", "damage": "1d6 cortante", "weight": "1 kg", "property": "Finesse, Alcance (3m)"},
            {"name": "Lança", "damage": "1d6 perfurante", "weight": "1,5 kg", "property": "Arremesso (6/18m), Versátil (1d8)"},
            {"name": "Lança de Montaria", "damage": "1d12 perfurante", "weight": "3 kg", "property": "Alcance (3m), Especial"},
            {"name": "Lança Longa", "damage": "1d10 perfurante", "weight": "4 kg", "property": "Pesada, Alcance (3m), Duas Mãos"},
            {"name": "Maça", "damage": "1d6 contundente", "weight": "2 kg", "property": "-"},
            {"name": "Maça Estrela", "damage": "1d8 perfurante", "weight": "2 kg", "property": "-"},
            {"name": "Machadinha", "damage": "1d6 cortante", "weight": "1 kg", "property": "Leve, Arremesso (6/18m)"},
            {"name": "Machado de Batalha", "damage": "1d8 cortante", "weight": "2 kg", "property": "Versátil (1d10)"},
            {"name": "Machado Grande", "damage": "1d12 cortante", "weight": "3,5 kg", "property": "Pesada, Duas Mãos"},
            {"name": "Malho", "damage": "2d6 contundente", "weight": "5 kg", "property": "Pesada, Duas Mãos"},
            {"name": "Mangual", "damage": "1d8 contundente", "weight": "1 kg", "property": "-"},
            {"name": "Martelo de Guerra", "damage": "1d8 contundente", "weight": "1 kg", "property": "Versátil (1d10)"},
            {"name": "Martelo Leve", "damage": "1d4 contundente", "weight": "1 kg", "property": "Leve, Arremesso (6/18m)"},
            {"name": "Nunchaku", "damage": "1d6 contundente", "weight": "1 kg", "property": "Finesse, Leve"},
            {"name": "Picareta de Guerra", "damage": "1d8 perfurante", "weight": "1 kg", "property": "-"},
            {"name": "Porrete", "damage": "1d4 contundente", "weight": "1 kg", "property": "Leve"},
            {"name": "Rapieira", "damage": "1d8 perfurante", "weight": "1 kg", "property": "Finesse"},
            {"name": "Rede", "damage": "-", "weight": "1,5 kg", "property": "Especial, Arremesso (1,5/4,5m)"},
            {"name": "Sabre", "damage": "1d8 cortante", "weight": "1,5 kg", "property": "Finesse, Leve"},
            {"name": "Tridente", "damage": "1d6 perfurante", "weight": "2 kg", "property": "Arremesso (6/18m), Versátil (1d8)"},
            {"name": "Zarabatana", "damage": "1 perfurante", "weight": "0,5 kg", "property": "Munição (7,5/30m), Carregamento"},
        ],
        "armors": [
            {"name": "Armadura de Escamas", "ca": 18, "weight": "20 kg", "category": "Pesado", "block": {"cortante": 4, "perfurante": 2, "contundente": 1}, "property": "+10 de penalidade em ações de DESTREZA. Redução de 4 de dano em bloqueio."},
            {"name": "Armadura de Placas", "ca": 20, "weight": "30 kg", "category": "Pesado", "block": {"cortante": 5, "perfurante": 3, "contundente": 1}, "property": "+20 de penalidade em ações de DESTREZA, reduz movimento em 3m. Redução de 5 de dano em bloqueio."},
            {"name": "Cota de Malha", "ca": 15, "weight": "25 kg", "category": "Médio", "block": {"cortante": 3, "perfurante": 2, "contundente": 2}, "property": "+5 de penalidade em ações de DESTREZA. Redução de 3 de dano em bloqueio."},
            {"name": "Couro", "ca": 5, "weight": "5 kg", "category": "Leve", "block": {"cortante": 1, "perfurante": 1, "contundente": 1}, "property": "Redução de 1 de dano em bloqueio."},
            {"name": "Couro Batido", "ca": 10, "weight": "6 kg", "category": "Leve", "block": {"cortante": 2, "perfurante": 2, "contundente": 2}, "property": "Redução de 2 dano em bloqueio."},
            {"name": "Escudo", "ca": 5, "weight": "3 kg", "category": "Escudo", "block": {"cortante": 2, "perfurante": 2, "contundente": 2}, "property": "Requer uma mão livre. Redução de 2 dano em bloqueio."},
            {"name": "Peitoral", "ca": 12, "weight": "10 kg", "category": "Médio", "block": {"cortante": 2, "perfurante": 2, "contundente": 2}, "property": "Redução de 2 de dano em bloqueio."},
        ],
        "equipment": [
            "Ábaco", "Ácido (frasco)", "Água benta (frasco)", "Algemas", "Algibeira", "Aljava", "Ampulheta", "Antídoto (frasco)", "Arpéu", "Aríete portátil", "Armadilha de caça", "Balança de mercador", "Balde", "Baú", "Caneca", "Cesto", "Cobertor de inverno", "Corda de cânhamo (15m)", "Corda de seda (15m)", "Corrente (3m)", "Escada (3m)", "Esferas (sacola com 1.000)", "Espelho de aço", "Estrepes (bolsa com 20)", "Fechadura", "Jarra", "Grimório", "Giz (1 peça)", "Garrafa de vidro", "Veneno básico (frasco)", "Fogo alquímico (frasco)", "Sino", "Vara (3m)", "Lamparina", "Parafina (10)", "Lente de aumento", "Livro", "Luneta", "Manto", "Marreta", "Mochila", "Óleo (frasco)", "Pá", "Panela de ferro", "Papel (uma folha)", "Pederneira", "Pé de cabra", "Pedra de amolar", "Perfume (frasco)", "Pergaminho (uma folha)", "Picareta de minerador", "Píton", "Poção de erva curativa (1d4)", "Porta mapas ou pergaminhos", "Pregos de ferro (10)", "Rações de viagem (1 dia)", "Robes", "Roldana e polia", "Roupas comuns", "Roupas de viajante", "Roupas de entretenimento", "Roupas finas", "Sabão", "Saco", "Saco de dormir", "Símbolo sagrado (amuleto)", "Símbolo sagrado (sinete)", "Símbolo sagrado (emblema)", "Símbolo sagrado (relicário)", "Tenda para duas pessoas",
        ],
    }
    return db


def load_canonical_database():
    database = load_json(DATA_SOURCE / "database.json")
    database["worldLaws"] = load_json(DATA_SOURCE / "world_laws.json")
    return normalize_database(
        database,
        talent_rules=load_json(DATA_SOURCE / "talent_rules.json"),
        spell_overrides=load_json(DATA_SOURCE / "spell_mechanics_overrides.json"),
    )


def update_source_manifest(target: Path) -> None:
    manifest_path = DATA_SOURCE / "source_manifest.json"
    manifest = load_json(manifest_path)
    manifest["bootstrap"] = {
        "file": target.name,
        "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
    }
    write_json(manifest_path, manifest)


def main():
    parser = argparse.ArgumentParser(description="Gera data.js a partir da fonte canônica.")
    parser.add_argument("--refresh-sources", action="store_true", help="Recria database.json a partir dos extratos em tmp/source_extracts.")
    args = parser.parse_args()
    if args.refresh_sources:
        db = normalize_database(
            build_database_from_extracts(),
            talent_rules=load_json(DATA_SOURCE / "talent_rules.json"),
            spell_overrides=load_json(DATA_SOURCE / "spell_mechanics_overrides.json"),
        )
        laws = load_json(DATA_SOURCE / "world_laws.json") if (DATA_SOURCE / "world_laws.json").exists() else db.pop("worldLaws", [])
        db.pop("worldLaws", None)
        write_json(DATA_SOURCE / "database.json", db)
        write_json(DATA_SOURCE / "world_laws.json", laws)
    db = load_canonical_database()
    target = ROOT / "data.js"
    write_data_js(target, db)
    update_source_manifest(target)
    print(
        json.dumps(
            {
                "regions": len(db["regions"]),
                "cultures": sum(len(r["cultures"]) for r in db["regions"]),
                "regionalMagics": sum(len(r["magics"]) for r in db["regions"]),
                "skills": len(db["skills"]),
                "familyBackgrounds": len(db["backgrounds"]["family"]),
                "personalBackgrounds": len(db["backgrounds"]["personal"]),
                "talents": len(db["talents"]),
                "worldLaws": len(db["worldLaws"]),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
