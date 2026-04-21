from __future__ import annotations

import shutil
from pathlib import Path

from .frontend import build_frontend_json
from .settings import BASE_DIR, BUILD_DIR


def build_html() -> Path:
    build_frontend_json()
    src = BASE_DIR / "index.html"
    dst = BUILD_DIR / "GAZ-FUAR_TAKVIMI-OTOMATIK.html"
    shutil.copy2(src, dst)
    return dst


if __name__ == "__main__":
    path = build_html()
    print(f"HTML created: {path}")
