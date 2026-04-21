from __future__ import annotations

from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape
from .io_json import load_events
from .settings import DATA_DIR, TEMPLATE_DIR, OUTPUT_DIR


def build_html() -> Path:
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template("index.html.j2")
    events = sorted(load_events(DATA_DIR / "events_master.json"), key=lambda e: (e.start_date, e.name))
    output = template.render(events=events)
    output_path = OUTPUT_DIR / "GAZ-FUAR_TAKVIMI-OTOMATIK.html"
    output_path.write_text(output, encoding="utf-8")
    return output_path


if __name__ == "__main__":
    path = build_html()
    print(f"HTML created: {path}")
