"""Run tests and create a deterministic offline distribution of Latio."""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
RELEASE = ROOT / "release"
FILES = [
    "index.html",
    "app.js",
    "data.js",
    "item_descriptions.js",
    "magic_cores.js",
    "pdf_import.js",
    "styles.css",
    "marufia_latio_design.css",
]


def run(*args: str, env: dict | None = None) -> None:
    subprocess.run(args, cwd=ROOT, check=True, env=env)


def checked_remove_tree(path: Path) -> None:
    resolved = path.resolve()
    if resolved.parent != ROOT.resolve() or resolved.name not in {"dist", "dist.next"}:
        raise RuntimeError(f"Recusa de remoção fora do diretório de build: {resolved}")
    if resolved.exists():
        shutil.rmtree(resolved)


def run_tests() -> None:
    run(sys.executable, "-m", "unittest", "discover", "-s", "tests", "-p", "test_*.py")
    node = os.environ.get("LATIO_NODE") or shutil.which("node")
    if not node:
        raise RuntimeError("Node.js não encontrado. Defina LATIO_NODE para executar os testes JavaScript.")
    run(node, "--test", "tests/js/smoke.test.cjs")


def build_dist() -> None:
    stage = ROOT / "dist.next"
    checked_remove_tree(stage)
    stage.mkdir()
    for relative in FILES:
        shutil.copy2(ROOT / relative, stage / relative)
    shutil.copytree(ROOT / "vendor", stage / "vendor")
    DIST.mkdir(exist_ok=True)
    for relative in FILES:
        shutil.copy2(stage / relative, DIST / relative)
    shutil.copytree(stage / "vendor", DIST / "vendor", dirs_exist_ok=True)
    checked_remove_tree(stage)


def create_release() -> Path:
    RELEASE.mkdir(exist_ok=True)
    target = RELEASE / "Ficha_Marufia_Latio.zip"
    with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for relative in FILES:
            archive.write(DIST / relative, relative)
        for path in sorted((DIST / "vendor").rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(DIST))
    return target


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--release", action="store_true")
    args = parser.parse_args()
    run(sys.executable, "tools/build_data.py")
    run(sys.executable, "tools/validate_data.py")
    run_tests()
    build_dist()
    run(sys.executable, "tools/validate_data.py", "--check-dist")
    if args.release:
        print(f"Pacote criado: {create_release()}")
    print("Build concluído com testes e distribuição sincronizada.")


if __name__ == "__main__":
    main()
