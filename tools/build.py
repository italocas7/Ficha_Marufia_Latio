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
RUNTIME_FILES = [
    "index.html",
    "app.js",
    "data.js",
    "item_descriptions.js",
    "magic_cores.js",
    "pdf_import.js",
    "styles.css",
    "marufia_latio_design.css",
]
CORE_MODULES = ["src/core/state.js", "src/core/rules.js"]
HOSTING_FILES = [".openai/hosting.json", "server/index.js"]


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
    tests = sorted(str(path.relative_to(ROOT)) for path in (ROOT / "tests" / "js").glob("*.test.cjs"))
    run(node, "--test", *tests)


def validate_dist() -> None:
    node = os.environ.get("LATIO_NODE") or shutil.which("node")
    if not node:
        raise RuntimeError("Node.js não encontrado. Defina LATIO_NODE para validar a distribuição.")
    run(node, "--check", str(DIST / "app.js"))
    index = (DIST / "index.html").read_text(encoding="utf-8")
    if any(module in index for module in CORE_MODULES):
        raise RuntimeError("A distribuição ainda referencia módulos de desenvolvimento.")


def add_to_archive(archive: zipfile.ZipFile, source: Path, target: str | Path) -> None:
    info = zipfile.ZipInfo(str(target).replace("\\", "/"), date_time=(2020, 1, 1, 0, 0, 0))
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o644 << 16
    archive.writestr(info, source.read_bytes())


def build_dist() -> None:
    stage = ROOT / "dist.next"
    checked_remove_tree(stage)
    stage.mkdir()
    for relative in RUNTIME_FILES:
        if relative in {"index.html", "app.js"}:
            continue
        (stage / relative).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / relative, stage / relative)
    index = (ROOT / "index.html").read_text(encoding="utf-8")
    for module in CORE_MODULES:
        index = index.replace(f'    <script src="{module}"></script>\n', "")
    (stage / "index.html").write_text(index, encoding="utf-8")
    bundle_parts = [(ROOT / module).read_text(encoding="utf-8") for module in CORE_MODULES]
    bundle_parts.append((ROOT / "app.js").read_text(encoding="utf-8"))
    (stage / "app.js").write_text("\n;\n".join(bundle_parts).rstrip() + "\n", encoding="utf-8")
    for relative in HOSTING_FILES:
        (stage / relative).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / relative, stage / relative)
    shutil.copytree(ROOT / "vendor", stage / "vendor")
    checked_remove_tree(DIST)
    try:
        stage.rename(DIST)
    except PermissionError:
        shutil.copytree(stage, DIST)
        checked_remove_tree(stage)


def create_release() -> Path:
    RELEASE.mkdir(exist_ok=True)
    target = RELEASE / "Ficha_Marufia_Latio.zip"
    with zipfile.ZipFile(target, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for relative in RUNTIME_FILES:
            add_to_archive(archive, DIST / relative, relative)
        for path in sorted((DIST / "vendor").rglob("*")):
            if path.is_file():
                add_to_archive(archive, path, path.relative_to(DIST))
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
    validate_dist()
    if args.release:
        print(f"Pacote criado: {create_release()}")
    print("Build concluído com testes e distribuição sincronizada.")


if __name__ == "__main__":
    main()
