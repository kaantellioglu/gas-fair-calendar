# Gas Fair Calendar

GitHub Pages üzerinde çalışan, gaz / LNG / LPG / enerji fuarlarını takip etmek için hazırlanmış ürünleşmiş proje.

## Ne var?

- mevcut dashboard UX'i korunmuş ana sayfa
- dinamik veri yükleme (`data/events_frontend.json`)
- kaynak yönetim paneli
- tarama istek paneli
- kullanıcı eklediği kaynakları tarayıcıda saklama (`localStorage`)
- Python tabanlı veri/Excel araçları
- GitHub Pages uyumlu yayın yapısı
- opsiyonel backend API klasörü

## GitHub Pages

`index.html` doğrudan yayın girişidir. Sayfa root'tan açılır.

## Yerel çalıştırma

```bash
python -m http.server 8000
```

## Python araçları

```bash
python scripts/export_excel.py
```

## Not

GitHub Pages statik çalışır. Bu yüzden sayfadaki **Tarama Başlat** paneli:
- GitHub Pages üzerinde tarama isteği üretir / dışa aktarır
- backend API kurulursa gerçek tarama job'ı başlatabilir

Opsiyonel backend için `backend/README.md` dosyasına bak.
