# Gaz Takvimi 2027

2027 doğal gaz, LNG, LPG, gaz ekipmanı ile gaz programı içeren petrol ve enerji etkinlikleri. Kaynak bağlantıları, tarih durumu, ziyaretçi ve delege fiyatları ve incelenme tarihleri veri setinde bulunur. Ücret ve kayıt verisi eksikse ilgili alan boş bırakılır. Tarihleri çelişen veya yalnızca bir takvimde yer alan kayıtlar ekranda işaretlenir. Kapsam 17 Kasım 2026 itibarıyla duyurulmuş ve bulunabilmiş kayıtlarla sınırlıdır.

## Açma ve derleme

`site/index.html` çift tıklanarak açılabilir. Node.js 24 ile proje kökünden `node scripts/build.cjs` çalıştırıldığında kaynak veri doğrulanır ve yayımlanabilir dosyalar yeniden üretilir.

## GitHub Pages

Bu katalog mevcut gas-fair-calendar deposunun /2027/ dizininde yayımlanır. Depoda 2027/data/catalog.json güncellendikten sonra kökten node 2027/scripts/build.cjs ile çıktıları üretin ve 2027 klasöründeki güncellenen dosyaları beraber kaydedin. Pages ana dalın kökünü yayımlar.

Yayın adresindeki calendar.ics Outlook web aboneliği, events.json veri entegrasyonu, events.csv Excel/Power BI ve report.json veri kapsamı raporu içindir. Outlook webde Takvim ekle → Web’den abone ol yolunu kullanın. ICS içe aktarma tek seferlik bir kopyadır.

## Veri bakımı

`data/catalog.json` tek kaynak dosyadır. Var olan etkinlik kimliğini koruyun, son kontrolü güncelleyin ve yeni fiyat için `feeSource` girin. Tarihler yerel etkinlik gününü temsil eder. Son gün ICS için özel bitişe çevrilir. Günü duyurulmamış etkinlikler takvim akışına girmez. Kişisel takip listesi tarayıcıda tutulur.

Pazartesi 08.23 Türkiye saatiyle kaynak kontrolü planlandı. GitHub Actions ilk çalıştırmada erişilebilen sayfaların imzasını alır, sonraki çalıştırmalarda farkları ve erişim hatalarını **source-report** çıktısında listeler. Raporu inceleyip doğrulanan değişiklikleri veri dosyasında işleyin. Sayfa değişiklikleri otomatik olarak katalog verisine yazılmaz. Kaynak sitenin JavaScript, bot engeli veya değişken içeriği ek kontrol gerektirebilir. Elle çalıştırma için `node scripts/monitor.cjs`.

Kaynak okuma için [GitHub Pages](https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically) ve [Outlook takvim aboneliği](https://support.microsoft.com/en-gb/outlook/share-your-calendar-in-outlook-on-the-web).
