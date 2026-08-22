"""Generate and validate the executable Latio files in the project root."""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT_ORDER = [
    "data.js",
    "item_descriptions.js",
    "magic_cores.js",
    "vendor/pdf_file_loader.js",
    "pdf_import.js",
    "vendor/supabase.js",
    "src/online/version.js",
    "src/online/project.js",
    "src/online/config.js",
    "src/online/supabase.js",
    "src/core/storage.js",
    "src/core/state.js",
    "src/core/rules.js",
    "src/core/character_summary.js",
    "src/core/rolls.js",
    "app.js",
    "src/online/auth.js",
    "src/online/campaigns.js",
    "src/online/characters.js",
    "src/online/home.js",
    "src/online/gm_panel.js",
    "src/online/character_import.js",
    "src/online/character_realtime.js",
    "src/online/character_sync.js",
    "src/online/settings.js",
    "src/online/rolls.js",
    "src/online/live_rolls.js",
    "src/online/character_conflicts.js",
]
VIEWER_SCRIPT_ORDER = [
    "data.js",
    "item_descriptions.js",
    "magic_cores.js",
    "vendor/pdf_file_loader.js",
    "pdf_import.js",
    "src/core/storage.js",
    "src/core/state.js",
    "src/core/rules.js",
    "src/core/rolls.js",
    "app.js",
    "src/online/gm_view.js",
]
REQUIRED_FILES = [
    "index.html",
    "gm_view.html",
    "styles.css",
    "marufia_latio_design.css",
    "marufia_online_design.css",
    "og.png",
    "vendor/pdf.min.mjs",
    "vendor/pdf.worker.min.mjs",
    *SCRIPT_ORDER,
    "src/online/gm_view.js",
]


def run(*args: str, env: dict | None = None) -> None:
    subprocess.run(args, cwd=ROOT, check=True, env=env)


def node_executable() -> str:
    node = os.environ.get("LATIO_NODE") or shutil.which("node")
    if not node:
        raise RuntimeError("Node.js não encontrado. Defina LATIO_NODE para executar as validações JavaScript.")
    return node


def run_tests() -> None:
    run(sys.executable, "-m", "unittest", "discover", "-s", "tests", "-p", "test_*.py")
    tests = sorted(str(path.relative_to(ROOT)) for path in (ROOT / "tests" / "js").glob("*.test.cjs"))
    run(node_executable(), "--test", *tests)


def validate_root() -> None:
    obsolete = [path for path in [ROOT / "dist", ROOT / "release"] if path.exists()]
    ignored_parts = {".git", "node_modules", "test-results", "playwright-report"}
    obsolete.extend(
        path for path in ROOT.rglob("*")
        if path.is_file()
        and not ignored_parts.intersection(path.relative_to(ROOT).parts)
        and path.name.lower().endswith((".zip", ".rar", ".tar", ".tar.gz"))
    )
    if obsolete:
        raise RuntimeError(f"Artefatos duplicados ainda existem: {', '.join(str(path.relative_to(ROOT)) for path in obsolete)}")

    missing = [relative for relative in REQUIRED_FILES if not (ROOT / relative).is_file()]
    if missing:
        raise RuntimeError(f"Arquivos obrigatórios ausentes na pasta principal: {', '.join(missing)}")

    index = (ROOT / "index.html").read_text(encoding="utf-8")
    positions = [index.find(f'src="{relative}"') for relative in SCRIPT_ORDER]
    if any(position < 0 for position in positions) or positions != sorted(positions):
        raise RuntimeError("index.html não carrega os scripts obrigatórios na ordem esperada.")

    viewer = (ROOT / "gm_view.html").read_text(encoding="utf-8")
    viewer_positions = [viewer.find(f'src="{relative}"') for relative in VIEWER_SCRIPT_ORDER]
    if any(position < 0 for position in viewer_positions) or viewer_positions != sorted(viewer_positions):
        raise RuntimeError("gm_view.html não reutiliza os scripts da ficha na ordem esperada.")

    for relative in dict.fromkeys([*SCRIPT_ORDER, "src/online/gm_view.js"]):
        run(node_executable(), "--check", str(ROOT / relative))


def main() -> None:
    run(sys.executable, "tools/build_data.py")
    run(sys.executable, "tools/validate_data.py")
    run_tests()
    validate_root()
    print("Build concluído: pasta principal gerada e validada para uso offline.")


if __name__ == "__main__":
    main()
