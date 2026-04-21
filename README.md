# Gas Fair Calendar

GitHub'da yayınlanmaya hazır, otomatik güncellenebilir bir gaz / LNG / LPG / endüstriyel enerji fuar takvimi projesi.

Bu repo şunları üretir:
- HTML dashboard
- Excel export
- JSON master dataset
- aday havuzu
- run report
- otomatik backup

## Bu sürümde ne düzeltildi

- eski kayıtların kaybolmasını önlemek için **merge-first** akış kuruldu
- her update öncesi `data/backups/` içine otomatik snapshot alınıyor
- legacy HTML içindeki `EV` dizisini içe aktarabilen `seed-html` komutu eklendi
- repo, GitHub Actions ile çalışacak şekilde hazırlandı
- başlangıç verisi olarak eski HTML takvimindeki **27 fuar** master datasete geri yüklendi

## Hızlı başlangıç

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -e .[dev]
python -m playwright install chromium
gas-fair-calendar validate
gas-fair-calendar build-html
gas-fair-calendar export-excel
```

Tam pipeline:

```bash
gas-fair-calendar update
```

Legacy HTML'den tekrar seed almak için:

```bash
gas-fair-calendar seed-html GAZ-FUAR_TAKVIMI-2026.html
```

## CLI komutları

- `gas-fair-calendar update`
- `gas-fair-calendar build-html`
- `gas-fair-calendar export-excel`
- `gas-fair-calendar validate`
- `gas-fair-calendar stats`
- `gas-fair-calendar seed-html <html-file>`

## GitHub'da yayınlama

Yeni bir repo açtıktan sonra:

```bash
git init
git add .
git commit -m "Initial release"
git branch -M main
git remote add origin https://github.com/<username>/gas-fair-calendar.git
git push -u origin main
```

## GitHub Actions

- `.github/workflows/update-events.yml` veri güncelleme işini çalıştırır
- `.github/workflows/pages.yml` HTML dashboard'u GitHub Pages'e yayınlar

## Üretim notları

- düşük öncelikli kaynak yüksek öncelikli kaydı otomatik ezmez
- çakışmalı değişiklikte kayıt `needs_review` durumuna çekilir
- `events_master.json` atomik yazılır
- her koşudan önce backup alınır

## Lisans

MIT
