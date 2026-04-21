# Optional API

Bu klasör, etkileşimli tarama ve kaynak yönetimi için opsiyonel FastAPI servisidir.

## Çalıştırma

```bash
pip install .[api]
uvicorn backend.app:app --reload
```

## Endpointler

- `GET /api/health`
- `GET /api/events`
- `GET /api/sources`
- `POST /api/sources`
- `POST /api/scan-jobs`
- `GET /api/scan-jobs`
