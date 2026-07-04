from __future__ import annotations

import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"

EXCLUDED_TOP_LEVEL = {
    ".git",
    ".github",
    "dist",
    "node_modules",
    "scripts",
    ".wrangler",
    "__pycache__",
}

EXCLUDED_FILES = {
    "serve.py",
    "start.command",
    "package.json",
    "package-lock.json",
    "wrangler.json",
    "wrangler.jsonc",
    "wrangler.toml",
    ".env",
    ".env.local",
    ".env.example",
    ".gitignore",
    "DEPLOY-CLOUDFLARE-PAGES.md",
}

ALLOWED_SUFFIXES = {
    ".html",
    ".css",
    ".js",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".svg",
    ".gif",
    ".pdf",
    ".ico",
    ".txt",
    ".json",
    ".woff",
    ".woff2",
}


def should_copy(path: Path) -> bool:
    relative = path.relative_to(ROOT)
    if relative.parts and relative.parts[0] in EXCLUDED_TOP_LEVEL:
        return False
    if path.name in EXCLUDED_FILES:
        return False
    if path.is_dir():
        return False
    return path.suffix.lower() in ALLOWED_SUFFIXES


def main() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True, exist_ok=True)

    copied_files = 0
    for path in ROOT.rglob("*"):
        if not should_copy(path):
            continue
        destination = DIST / path.relative_to(ROOT)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, destination)
        copied_files += 1

    print(f"Built static site into {DIST} with {copied_files} files.")


if __name__ == "__main__":
    main()
