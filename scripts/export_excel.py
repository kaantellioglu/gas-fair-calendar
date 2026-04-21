from pathlib import Path
import json
from openpyxl import Workbook

ROOT = Path(__file__).resolve().parents[1]
events = json.loads((ROOT / "data" / "events_frontend.json").read_text(encoding="utf-8"))
out = ROOT / "build" / "events_master.xlsx"
out.parent.mkdir(exist_ok=True)
wb = Workbook()
ws = wb.active
ws.title = "Events"
ws.append(["Name","Dates","City","Country","Region","Category","Organizer","Venue","Website","Ticket","Status","Confidence","Source URL"])
for e in events:
    ws.append([e["name"], e["dates"], e["city"], e["country"], e["region"], e["type"], e["org"], e["venue"], e["url"], e["ticket"], e.get("status","") , e.get("confidence",0), e.get("sourceUrl","")])
for col, width in {"A":42,"B":16,"C":18,"D":18,"E":12,"F":12,"G":26,"H":28,"I":34,"J":24,"K":12,"L":12,"M":34}.items():
    ws.column_dimensions[col].width = width
wb.save(out)
print(out)
