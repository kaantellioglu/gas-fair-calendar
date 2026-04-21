# Gas Fair Calendar

Gaz, LNG, LPG ve ilgili endüstriyel enerji fuarları için hazırlanmış, **GitHub Pages + Python otomasyon** tabanlı bitmiş üründür.

## Ne yapar?

- mevcut dashboard UX'ini ana sayfa olarak korur
- `data/sources.json` içindeki aktif kaynakları okur
- Python ile otomatik **scan job** oluşturur
- seed veri boşsa `events_frontend.json` üzerinden `events_master.json`'ı yeniden kurar
- veri kaybını önlemek için **backup** alır
- `events_master.json` → `events_frontend.json` dönüşümünü yapar
- `index.html` ve build çıktısını günceller
- Excel export üretir
- GitHub Actions ile zamanlanabilir
- istenirse FastAPI ile interaktif backend olarak da çalışır

## Klasör yapısı

```text
backend/                 Opsiyonel FastAPI servis
build/                   Üretilen HTML, JSON ve Excel çıktıları
config/                  Ek konfigürasyon alanı
data/
  backups/               Otomatik yedekler
  events_master.json     Normalize edilmiş ana veri
  events_frontend.json   UI'nin doğrudan kullandığı veri
  candidates.json        İnceleme bekleyen kayıtlar
  scan_jobs.json         Çalıştırılan job geçmişi
  sources.json           Tarama kaynakları
scripts/
  auto_update.py         Tek komutla tam güncelleme
src/gas_fair_calendar/   Paket kodu
index.html               GitHub Pages ana giriş dosyası
```

## Hızlı başlangıç

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e .[dev,api]
python -m playwright install chromium
```

## Tek komutla otomatik güncelleme

```bash
gas-fair-calendar auto-update
```

Bu komut şunları yapar:

1. backup alır
2. scan job oluşturur
3. veri setini kontrol eder
4. `events_frontend.json` dosyasını yeniden üretir
5. `build/GAZ-FUAR_TAKVIMI-OTOMATIK.html` dosyasını günceller
6. `build/events_master.xlsx` üretir
7. `build/run_report.*` raporlarını yazar

## Diğer komutlar

```bash
gas-fair-calendar seed-master
gas-fair-calendar build-frontend
gas-fair-calendar build-html
gas-fair-calendar export-excel
gas-fair-calendar stats
```

## GitHub Pages

`index.html` doğrudan root'ta yer alır. GitHub Pages için:

- Source: **Deploy from branch**
- Branch: **main**
- Folder: **/ (root)**

## GitHub Actions

Repo içinde zamanlanmış workflow hazırdır. Varsayılan akış:

- günlük otomatik güncelleme
- workflow_dispatch ile manuel çalıştırma
- çıktı değişirse otomatik commit/push

## Opsiyonel API

```bash
uvicorn backend.app:app --reload
```

API endpointleri:

- `GET /api/health`
- `GET /api/events`
- `GET /api/sources`
- `POST /api/sources`
- `GET /api/scan-jobs`
- `POST /api/scan-jobs`
- `POST /api/scan-run`

## Önemli not

Bu sürüm **ürünleşmiş ve çalışır temel sistemdir**. Kaynak bazlı gerçek scraper'lar ileride eklenebilir; ancak mevcut yapı, veri kaybına karşı güvenli, GitHub'a uygun ve otomatik çalışma mantığıyla hazırdır.
