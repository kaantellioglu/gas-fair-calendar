from __future__ import annotations

from pathlib import Path

from .io_json import save_json
from .settings import BUILD_DIR
from .utils import now_utc


def write_run_report(*, issues: list[str], added: int, updated: int, duplicates: list[str], sources_scanned: int = 0, job_name: str = "auto-update") -> tuple[Path, Path]:
    timestamp = now_utc().isoformat()
    md_path = BUILD_DIR / "run_report.md"
    json_path = BUILD_DIR / "run_report.json"

    md = [
        f"# Run Report\n",
        f"- job: **{job_name}**\n",
        f"- timestamp: `{timestamp}`\n",
        f"- sources scanned: **{sources_scanned}**\n",
        f"- added: **{added}**\n",
        f"- updated: **{updated}**\n",
        f"- duplicates: **{len(duplicates)}**\n",
        f"- issues: **{len(issues)}**\n",
        "\n## Issues\n",
    ]
    if issues:
        md.extend([f"- {issue}\n" for issue in issues])
    else:
        md.append("- none\n")
    md.append("\n## Duplicates\n")
    if duplicates:
        md.extend([f"- {row}\n" for row in duplicates])
    else:
        md.append("- none\n")
    md_path.write_text("".join(md), encoding="utf-8")

    save_json(json_path, {
        "job": job_name,
        "timestamp": timestamp,
        "sources_scanned": sources_scanned,
        "added": added,
        "updated": updated,
        "issues": issues,
        "duplicates": duplicates,
    })
    return md_path, json_path
