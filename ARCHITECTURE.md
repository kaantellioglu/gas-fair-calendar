# Architecture

## 1. Data Layer

Ana veri kaynağı `data/events_master.json` dosyasıdır. HTML ve Excel doğrudan bu dosyadan üretilir.

## 2. Backup Strategy

Her update öncesi mevcut dataset `data/backups/` içine timestamp'li olarak kopyalanır.
Bu sayede GitHub Actions veya yerel koşular sırasında veri kaybı yaşanmaz.

## 3. Source Registry

`config/sources.yaml` izlenen kaynakları tanımlar.

## 4. Collectors

- `GenericHTMLCollector`: statik HTML
- `PlaywrightCollector`: JavaScript ile render edilen kaynaklar

## 5. Discovery

Discovery katmanı yeni fuar adaylarını `candidate` statüsüyle üretir.

## 6. Merge

Merge katmanı replace etmez; mevcut master dataset ile gelen kayıtları birleştirir.
Kaynak önceliği:
- official_site
- organizer
- association
- venue
- secondary_backup

## 7. Validation

Kontroller:
- tarih aralığı
- boş şehir / ülke
- beklenmeyen yıl
- düşük confidence
- duplicate adayları

## 8. Outputs

- HTML dashboard
- Excel export
- candidates.json
- run_report.json
- run_report.md

## 9. GitHub Delivery

- GitHub Actions ile otomatik update
- GitHub Pages ile dashboard yayını
- Docker ve CLI ile lokal kullanım
