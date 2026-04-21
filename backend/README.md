# Optional API

Bu servis, GitHub Pages dışındaki ortamlarda kaynak ekleme ve tarama tetikleme için kullanılır.

## Kurulum

```bash
pip install -e .[api]
uvicorn backend.app:app --reload
```

## Endpointler

- `GET /api/health`
- `GET /api/events`
- `GET /api/sources`
- `POST /api/sources`
- `GET /api/scan-jobs`
- `POST /api/scan-jobs`
- `POST /api/scan-run`
