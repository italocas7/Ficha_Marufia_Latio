"""Create the normalized, versioned data source from the current database."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

from data_io import load_data_js, write_json
from data_rules import normalize_database


ROOT = Path(__file__).resolve().parents[1]
DATA_SOURCE = ROOT / "data-src"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true", help="Sobrescreve a fonte existente.")
    args = parser.parse_args()
    database_path = DATA_SOURCE / "database.json"
    if database_path.exists() and not args.force:
        raise SystemExit("A fonte canônica já existe. Use --force para recriá-la deliberadamente.")

    database = load_data_js(ROOT / "data.js")
    laws = database.pop("worldLaws", [])
    normalize_database(database)

    write_json(database_path, database)
    write_json(DATA_SOURCE / "world_laws.json", laws)
    manifest = {
        "schema": "latio-data-source-1",
        "sources": database.get("sourceNotes", []),
        "bootstrap": {"file": "data.js", "sha256": sha256(ROOT / "data.js")},
    }
    write_json(DATA_SOURCE / "source_manifest.json", manifest)
    print(f"Fonte canônica criada em {DATA_SOURCE}.")


if __name__ == "__main__":
    main()
