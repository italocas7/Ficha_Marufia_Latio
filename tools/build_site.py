"""Create the Sites-ready web package without changing the offline build contract."""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

import build as offline_build


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
STAGE = ROOT / "dist.next"
CLIENT_FILES = [*dict.fromkeys(offline_build.REQUIRED_FILES)]
SERVER_ENTRY = "server/index.js"
UPDATE_MANIFEST = "app-update.json"
UPDATE_MANIFEST_ASSET = ".marufia/app-update.json"
PROJECT_CONFIG = "src/online/project.js"


def checked_remove_tree(path: Path) -> None:
    resolved = path.resolve()
    if resolved.parent != ROOT.resolve() or resolved.name not in {"dist", "dist.next"}:
        raise RuntimeError(f"Recusa de remoção fora do diretório de build: {resolved}")
    if resolved.exists():
        shutil.rmtree(resolved)


def copy_site() -> None:
    checked_remove_tree(STAGE)
    STAGE.mkdir()
    for relative in CLIENT_FILES:
        source = ROOT / relative
        target = STAGE / "client" / relative
        if relative == UPDATE_MANIFEST:
            target = STAGE / "client" / UPDATE_MANIFEST_ASSET
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
    subprocess.run(
        [
            offline_build.node_executable(),
            "tools/public_config.cjs",
            "render",
            str(STAGE / "client" / PROJECT_CONFIG),
        ],
        cwd=ROOT,
        check=True,
    )
    server_source = ROOT / SERVER_ENTRY
    server_target = STAGE / SERVER_ENTRY
    server_target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(server_source, server_target)
    checked_remove_tree(DIST)
    try:
        STAGE.rename(DIST)
    except PermissionError:
        shutil.copytree(STAGE, DIST)
        checked_remove_tree(STAGE)


def validate_site() -> None:
    missing = [
        f"client/{UPDATE_MANIFEST_ASSET if relative == UPDATE_MANIFEST else relative}"
        for relative in CLIENT_FILES
        if not (
            DIST
            / "client"
            / (UPDATE_MANIFEST_ASSET if relative == UPDATE_MANIFEST else relative)
        ).is_file()
    ]
    if not (DIST / SERVER_ENTRY).is_file():
        missing.append(SERVER_ENTRY)
    if missing:
        raise RuntimeError(f"Arquivos ausentes no pacote web: {', '.join(missing)}")
    subprocess.run(
        [offline_build.node_executable(), "--check", str(DIST / "server/index.js")],
        cwd=ROOT,
        check=True,
    )
    for page in ["index.html", "gm_view.html"]:
        html = (DIST / "client" / page).read_text(encoding="utf-8")
        if "Ficha de Marufia" not in html:
            raise RuntimeError(f"Página inválida no pacote web: {page}")
    project_config = (DIST / "client" / PROJECT_CONFIG).read_text(encoding="utf-8")
    if "__MARUFIA_PUBLIC_CONFIG__" in project_config:
        raise RuntimeError("A configuração pública não foi gerada no pacote web.")
    subprocess.run(
        [offline_build.node_executable(), "--check", str(DIST / "client" / PROJECT_CONFIG)],
        cwd=ROOT,
        check=True,
    )


def main() -> None:
    checked_remove_tree(DIST)
    checked_remove_tree(STAGE)
    subprocess.run([sys.executable, "tools/build.py"], cwd=ROOT, check=True)
    copy_site()
    validate_site()
    print("Pacote web de teste gerado e validado em dist/.")


if __name__ == "__main__":
    main()
