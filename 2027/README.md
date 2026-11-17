# Gaz Takvimi 2027

2027 dünya fuar envanteri. Doğal gaz, LPG, LNG, endüstriyel gaz, gaz altyapısı, vana, filtrasyon, proses, brülör, kazan, ısıtma ve biyogaz kapsamındadır. İlgili fuarlar ticari önceliğe göre elenmez. Ücret ve kayıt doğrulanmadığında alan boş kalır.

## Açma ve derleme

`site/index.html` çift tıklanarak açılabilir. Node.js 24 ile proje kökünden `node scripts/build.cjs` çalıştırıldığında kaynak veri doğrulanır ve yayımlanabilir dosyalar yeniden üretilir.

## GitHub Pages

Bu katalog mevcut gas-fair-calendar deposunun /2027/ dizininde yayımlanır. Depoda 2027/data/catalog.json güncellendikten sonra kökten node 2027/scripts/build.cjs ile çıktıları üretin ve 2027 klasöründeki güncellenen dosyaları beraber kaydedin. Pages ana dalın kökünü yayımlar.

Yayın adresindeki calendar.ics Outlook web aboneliği, events.json veri entegrasyonu, events.csv Excel/Power BI ve report.json veri kapsamı raporu içindir. Outlook webde Takvim ekle → Web’den abone ol yolunu kullanın. ICS içe aktarma tek seferlik bir kopyadır.

## Veri bakımı

`data/catalog.json` tek kaynak dosyadır. Var olan etkinlik kimliğini koruyun, son kontrolü güncelleyin ve yeni fiyat için `feeSource` girin. Tarihler yerel etkinlik gününü temsil eder. Son gün ICS için özel bitişe çevrilir. Günü duyurulmamış etkinlikler takvim akışına girmez. Kişisel takip listesi tarayıcıda tutulur.

Üst menüdeki **Takvimi güncelle** bağlantısından GitHub Actions'a gidip **Run workflow** seçin. Kaynak değişiklikleri, erişim hataları ve desteklenen sayfalardaki yapılandırılmış 2027 etkinlik adayları **source-report** çıktısına yazılır. Doğrulanmış değişiklikleri kataloğa işleyin. JavaScript, PDF, görsel ve bot engeli olan sayfalarda ayrıca elle kontrol gerekir. Yerel kaynak kontrolü: `node scripts/monitor.cjs`.

### Yeni etkinlik araması

- Her turda Afrika, Avrupa, Kuzey ve Güney Amerika, Asya, Orta Doğu ve Okyanusya için organizatör, fuar merkezi, sektör birliği ve ülke fuar takvimlerini tara. İngilizce adın yanında yerel dilde gaz dağıtımı, brülör/kazan, vana ve filtrasyon terimlerini kullan.
- Geniş enerji, HVAC ve endüstri fuarlarını gaz veya ilgili ürün kategorisi/programı bulunduğunda dahil et. Ürün ve alıcı uyumu kullanıcı seçimine kalır.
- 2027 edisyonu duyurulmuş fakat kesin günü açıklanmamışsa **Takipte** olarak kaydet. Resmî kaynakların çelişkisini not et; bir önceki yılın günlerini kopyalama.
- Yeni ve mevcut kayıtları ad, ülke, şehir ve edisyonla karşılaştır. Aynı etkinliğin isim varyasyonlarını birleştir; ayrı kayıt/katılımcı kapsamı olan eş zamanlı fuarları ayrı kaydet.
- Tarama kapsamı doğrulanabilen kaynaklarla sınırlıdır. Bulgu olmaması, bir ülkede uygun fuar bulunmadığı anlamına gelmez.

Kaynak okuma için [GitHub Pages](https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically) ve [Outlook takvim aboneliği](https://support.microsoft.com/en-gb/outlook/share-your-calendar-in-outlook-on-the-web).
