# Architecture

## Faz 1

- `events_master.json` ana veri kaynağıdır.
- `build_html.py` HTML üretir.
- `export_excel.py` Excel üretir.
- UI dosyası veri taşımaz; yalnızca render eder.

## Faz 2

- `config/sources.yaml` içindeki kaynaklar taranır.
- `collectors/http_html.py` statik HTML kaynaklarını işler.
- `collectors/playwright_collector.py` JS yüklü sayfaları işler.
- `.github/workflows/update-events.yml` pipeline'ı cron ile çalıştırır.

## Faz 3

- `discovery.py` yeni aday fuarları keşfeder.
- `validation.py` kalite kapısı uygular.
- `dedupe.py` duplicate tespit eder.
- `merge.py` kaynak önceliğine göre kayıt günceller.
- `data/candidates.json` insan gözünden geçmesi gereken kayıtları tutar.
