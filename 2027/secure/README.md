# Ortak ve parolalı Gaz Takvimi 2027

Bu klasör canlıya alınmadan önce aşağıdaki sunucu ve GitHub yetkileri kurulmalıdır. Statik GitHub Pages sayfasına yalnızca bir parola penceresi eklemek veriyi korumaz.

## Veri

Tek çalışma kaynağı özel bir GitHub deposudur. Önerilen depo: kaantellioglu/gas-fair-calendar-data.

- data/catalog.json: yayımlanmış katalogdan alınan ortak fuar ve kaynaklar.
- auth/password.json: salt, PBKDF2-HMAC-SHA256 özeti, 600.000 iterasyon ve parola sürümü.
- auth/login-budget.json: ortak giriş denemesi sayacı. Başlangıç: {"slot":0,"count":0}.

Tarayıcıdaki eski fuarlar, kaynaklar ve düzeltmeler aktarılmaz veya okunmaz. Kişisel takip listesi kişisel kalır. Yeni fuar, kaynak ve düzeltmeler doğrudan ortak katalog dosyasına yazılır.

Depo public ise sunucu veri işlemlerini reddeder. Parola, GitHub yazma anahtarı ve oturum imzalama anahtarı kaynak koduna veya public depoya konmaz.

## Yayın önkoşulları

1. GitHub hesabıyla özel veri deposunu oluşturun. Doğrulanmış mevcut katalog, auth/password.json özeti ve giriş sayacı bu özel depoya kaydedilir.
2. Vercel'de bu kaynak deponun güvenli dalını seçin; proje kökü 2027/secure, framework Other, build komutu npm run build olsun. Kaynak deponun gizli veriler içermesi gerekmez.
3. Sunucuda GitHub veri deposuna erişecek bir fine-grained token tanımlayın: yalnızca özel veri deposu için Contents: Read and write. Tokenı sohbet mesajına veya kaynak dosyasına yazmayın.
4. Production ortamında APP_ORIGIN, GITHUB_DATA_REPOSITORY, GITHUB_DATA_BRANCH, GITHUB_DATA_TOKEN ve en az 32 rastgele baytlık SESSION_SECRET ayarlayın. Son iki değeri secret olarak saklayın.
5. Parola özeti özel depoya yazılmadan ve token ayarlanmadan giriş çalışmaz. Bunlar olmadan canlı sitenin korunduğunu söylemeyin.
6. Canlıda yanlış parola, doğru parola, oturumsuz doğrudan JSON/CSV/ICS erişimi, iki ayrı tarayıcıdan ortak kayıt ve eş zamanlı düzenleme testlerini yapın.
7. Korunan yayın çalıştıktan sonra eski GitHub Pages adresini yeni adrese yönlendirin ve eski canlı veri indirmelerini kaldırın. Daha önce public olarak yayımlanmış verilerin geçmiş kopyaları bu işlemle geriye dönük gizlenmiş sayılmaz.

## Güvenlik davranışı

- Kontrol sunucuda yapılır; istemcide karşılaştırılacak parola veya parola özeti bulunmaz.
- Oturum: 8 saatlik imzalı __Host- cookie; HttpOnly, Secure, SameSite=Strict.
- Tüm yazmalar: tam Origin kontrolü, oturuma bağlı CSRF değeri ve JSON boyut sınırı.
- Katalog yazması: GitHub blob SHA ile sürüm kontrolü. Başka biri değiştirdiyse 409 döner, değişiklik ezilmez.
- Giriş denemeleri tüm sunucu örnekleri arasında GitHub'da ortak tutulur: beş dakikalık pencerede toplam 20 deneme. Başarılı girişler de bu bütçeye dahildir. Çakışan rezervasyon isteği yeniden parola denemek yerine 429 alır.
- Veri, API yanıtları ve korunan dosyalar cache'e açık verilmez.
- Her kayıtta GitHub commit geçmişi oluşur. Ortak parola kullanıldığı için değişiklikler kişi bazında kimliklendirilmez.
- Tarayıcıda eski kayıtlar sessizce birleştirilmez.
- Ortak veri değişirse diğer açık oturumlar yaklaşık bir dakika içinde yenileme bildirimi gösterir. Açık düzenleme formu zorla yenilenmez.
- Ortam bilgileri, auth/ klasörü ve sunucu kaynakları HTTP dosya listesinde bulunmaz.

## Outlook

ICS indirme, oturum açıldıktan sonra çalışır. Outlook'un arka planda şifreli oturum çerezini kullanamayacağı için public web aboneliği kapalıdır. Ayrı bir korumalı abonelik yöntemi kurulmadan anonim ICS adresi verilmez.

## Android ve iOS ana ekran uygulaması

Uygulama PWA olarak kurulabilir. Android Chrome'da "Uygulamayı yükle" butonu tarayıcının kurulum penceresini açar; iPhone'da Safari → Paylaş → Ana Ekrana Ekle yolunu gösterir.

Manifest, simgeler, kurulum betiği ve service worker kimlik doğrulaması olmadan sunulur. Bunlar **hiçbir ortak takvim verisi içermez**. Service worker ağ isteklerini yakalamaz ve özel veri önbelleğe alınmaz. Diğer tüm uygulama dosyaları ile JSON/CSV/ICS çıktıları oturum koruması altında kalır.

PWA kaynakları `public/` klasöründedir; `npm run build` bunları Vercel işlevinin `assets/` klasörüne kopyalar. Simgeler ESKA kurumsal renkleri ve takvim işaretiyle tasarlanmıştır.

## Kontrol

Proje kökünden:

node secure/build.cjs
node --test secure/test/*.test.cjs

Testler gerçek müşteri parolası veya gerçek GitHub erişim anahtarı kullanmaz; canlı GitHub yazması yaptığını iddia etmez.
