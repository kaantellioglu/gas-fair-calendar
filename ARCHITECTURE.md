# Architecture

## Core idea

Frontend statik olarak GitHub Pages üzerinde yayınlanır. Veri güncellemesi ise Python pipeline tarafından yapılır.

## Flow

1. `data/sources.json` okunur
2. aktif kaynaklardan otomatik scan job oluşturulur
3. `events_master.json` boşsa seed veriden yeniden kurulur
4. güvenli merge / backup uygulanır
5. `events_frontend.json` yeniden üretilir
6. HTML ve Excel çıktıları oluşturulur
7. GitHub Actions isterse değişiklikleri commit eder

## Files

- `data/events_master.json`: normalize edilmiş ana veri
- `data/events_frontend.json`: UI'ye özel veri
- `data/scan_jobs.json`: job kayıtları
- `data/sources.json`: kaynak havuzu
- `build/`: çıktılar

## Automation

- Local: `gas-fair-calendar auto-update`
- CI: `.github/workflows/update-events.yml`

## Safety rules

- overwrite öncesi backup alınır
- çok küçük veri seti gelirse overwrite yapılmaz
- seed veri üzerinden geri kurulum mümkündür
