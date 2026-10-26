# Bundan Var Mı? - Admin Mobil (arg_bv_admin_mobile) Proje Durumu

> **ÖNEMLİ KURAL:** Bu projede her oturum açıldığında ve herhangi bir geliştirmeye başlanmadan önce İLK OLARAK bu dosya (`proje_status.md`) okunmalı, en son nerede kalındığı ve sıradaki görevler kontrol edilmelidir. Her tamamlanan işlem sonrasında bu dosya güncellenmelidir.

---

## 1. Projenin Amacı ve Ekosistemdeki Yeri

### Platform Genel Özeti ("Bundan Var Mı?")
Kullanıcıların aradıkları ürün/hizmetleri sisteme anlık talep olarak ilettiği ("... var mı?"), PostGIS tabanlı konum ve sektör/kategori eşleşmesiyle bölgedeki esnafa/firmalara anlık (SignalR ve arka plan bildirim servisleri ile) ulaştıran yeni nesil yerel ticaret platformudur. Esnaf "Bende Var" yanıtı verdiğinde anlık sohbet başlar; sistem iyzico abonelik/paket ve kota altyapısıyla çalışır.

### İncelenen İlgili Projeler:
1. **`arg.bv.web` (Müşteri & Esnaf Web Portalı):**
   - Son kullanıcıların talep oluşturduğu (`CreateDemandPage`), teklifleri gördüğü (`DemandOffersPage`), esnafla canlı mesajlaştığı (`ChatPage`).
   - Esnafların firma oluşturduğu (`CompanyCreatePage`), şube/personel tanımladığı (`CompanyUsersPage`), bölgeden gelen talepleri yanıtladığı web arayüzüdür.
   - **Ana Tema Renkleri:** Cyan (`#36B6C5`), Turuncu (`#FF6B00`), Slate Arka Plan (`#F1F5F9`), Koyu Metin (`#0F172A`).
2. **`arg.bv.web.admin` (Web Süper Yönetim Paneli):**
   - Sistem yöneticilerinin tüm platformu yönettiği React/Vite tabanlı masaüstü admin panelidir.
   - Sayfalar: Dashboard (`MainWeb`), Firma Onay/Ban/Rol (`Company001-004`), Talep Denetimi (`Demand001`), Şikayet/Moderasyon (`Report001`), Ödeme/Abonelik (`Payment001`), Paket/Plan (`PricePlan002`, `Feature002`), Kategori (`Category001-002`), Ürün (`Product001-002`), Duyurular (`Announcement001`), Site Ayarları (`SiteSetting001`), Kullanıcılar (`User001`).
3. **`arg_bv_admin_mobile` (Bu Proje - Yönetici Mobil Uygulaması):**
   - Platform yöneticisinin (Admin), masaüstü web paneline (`arg.bv.web.admin`) birebir pariteyle cep telefonundan tüm operasyonları eksiksiz yönetebilmesini sağlayan mobil uygulamadır.

---

## 2. Teknoloji Yığını & Mimarisi

- **Framework:** React Native (`0.86.3`) + Expo (`~57.0.26`)
- **Dil:** TypeScript (`~6.0.3`) + React (`19.2.3`)
- **Navigasyon:** `@react-navigation/native` + `@react-navigation/bottom-tabs` + `@react-navigation/native-stack`
- **Güvenli Depolama:** `expo-secure-store` (Token & Admin oturum bilgileri)
- **Ağ İstemcisi:** `axios` (Interceptor tabanlı token taşıma & hata yakalama)
- **İkon Seti:** `@expo/vector-icons` (Ionicons / MaterialIcons)
- **Tasarım Standartları:**
  - **Ana Tema Renkleri (`arg.bv.web` ile uyumlu):**
    - `Primary (Cyan / bundan)`: `#36B6C5`
    - `Secondary (Orange / varmi?)`: `#FF6B00`
    - `Background`: `#F1F5F9`
    - `Surface`: `#FFFFFF`
    - `TextPrimary`: `#0F172A`
    - `TextSecondary`: `#475569`
  - **Kritik Kurallar:**
    - ActivityIndicator: Her zaman `<ActivityIndicator color="#D71920" />` (veya `size="small"`).
    - Buton & İkonlar: `AppColors.accent` (`#FF6B00`) veya kurumsal renkler.
    - Eşitlik Kontrolleri: ResultType ve API enumlarında gevşek eşitlik (`==` / `!=`).

---

## 3. Web Admin (`arg.bv.web.admin`) Sayfa Eşleşmesi ve Durum Özeti

| Web Admin Sayfası | Mobil Ekran Dosyası | Durum | Açıklama |
| :--- | :--- | :---: | :--- |
| **Giriş (Auth)** | `src/screens/LoginScreen.tsx` | Tamamlandı | Yönetici telefon/şifre girişi, JWT token saklama |
| **MainWeb** (Dashboard) | `src/screens/DashboardScreen.tsx` | Tamamlandı | KPI kartları, toplam tahsilat ciro kartı, tüm modüllere hızlı navigasyon |
| **Company001, 002, 003, 004** | `src/screens/CompaniesScreen.tsx` | Tamamlandı | Onay/Reddet, Askıya Al (Ban), Yasak Kaldır, Personel Listesi |
| **Demand001** (Talepler) | `src/screens/DemandsScreen.tsx` | Tamamlandı | Canlı talepler, Onay/Red, Yanıt Veren Firmaları görme, Silme |
| **User001** (Kullanıcılar) | `src/screens/UsersScreen.tsx` | Tamamlandı | Kullanıcı listesi, Pasife Al/Aktifleştir, Günlük Ceza/Ban, Yasak Kaldır |
| **Report001** (Şikayetler) | `src/screens/ReportsScreen.tsx` | Tamamlandı | Şikayet inceleme, Çözüldü/Kapatıldı aksiyonları, Moderasyon |
| **Payment001** (Ödemeler/Abonelik) | `src/screens/PaymentsScreen.tsx` | Tamamlandı | iyzico ödeme geçmişi, aktif paket abonelikleri, ciro özeti |
| **Category001, 002** (Kategoriler) | `src/screens/CategoriesScreen.tsx` | Tamamlandı | Kategori listeleme, arama, yeni kategori ekleme/düzenleme, silme |
| **PricePlan002, Product001** | `src/screens/PricePlansScreen.tsx` | Tamamlandı | Esnaf abonelik paketleri, aylık/yıllık fiyatlar, yeni paket tanımlama |
| **Announcement001** (Duyurular) | `src/screens/AnnouncementsScreen.tsx` | Tamamlandı | Sistem ve kullanıcı duyuruları, yeni duyuru yayınlama, silme |
| **SiteSetting001** (Ayarlar) | `src/screens/SiteSettingsScreen.tsx` | Tamamlandı | Sistem konfigürasyon anahtarları, değer güncelleme |
| **Settings (Admin Profil)** | `src/screens/SettingsScreen.tsx` | Tamamlandı | Oturum bilgisi, sunucu adresi ve güvenli çıkış (Logout) |

---

## 4. API Servis Katmanı (`src/services/serviceAdmin.ts`)

Web Admin'deki tüm servisler (`ServiceAdmin`, `ServiceCompany`, `ServiceDemand`, `ServiceUser`) mobil `serviceAdmin.ts` içerisinde tek çatı altında toplanmış ve backend `AdminController.cs` ile tam uyumlu hale getirilmiştir:
- `getDashboardSummary`
- `getUserList`, `updateUserStatus`, `banUser`, `unbanUser`
- `getCompanyList`, `approveCompany`, `rejectCompany`, `deleteCompany`, `banCompany`, `unbanCompany`, `saveCompany`, `getCompanyUsers`, `saveCompanyUser`, `deleteCompanyUser`, `updateCompanyUserRole`
- `getDemandList`, `approveDemand`, `rejectDemand`, `deleteDemand`, `getDemandCompanies`
- `getReportList`, `resolveReport`
- `getPaymentList`, `getSubscriptionList`
- `getCategoryList`, `saveCategory`, `deleteCategory`
- `getPricePlanList`, `savePricePlan`, `deletePricePlan`, `getFeatureList`, `getPricePlanFeatures`
- `getAnnouncementList`, `saveAnnouncement`, `deleteAnnouncement`
- `getSiteSettingList`, `saveSiteSettings`

---

## 5. Sıradaki Görevler & Geliştirmeler (TODO)

- [ ] **Canlı Bildirimler (Push Notifications):** Yeni onay bekleyen firma, acil şikayet veya kritik ciro hareketlerinde Expo Push Notifications entegrasyonu.
- [ ] **Harita / Konum Önizleme (Spatial Map):** Web admindeki `ArgLocationViewer` ve `ArgDashboardMap` bileşenlerine benzer şekilde react-native-maps ile firma ve talep konumlarının harita üzerinde gösterilmesi.
- [ ] **Görsel Galeri Modalı:** Talep görsellerinin tam ekran kaydırılabilir (Carousel/Lightbox) olarak açılması.

---

## 6. Oturum / Geliştirme Günlüğü (Log)

- **2026-10-02 (Oturum 1):**
  - `arg.bv.web`, `arg.bv.web.admin` ve `arg.bv.service/AdminController.cs` derinlemesine incelendi.
  - Projenin amacı ve platform ekosistemindeki rolü analiz edilerek `proje_status.md` dokümanı oluşturuldu.
- **2026-10-02 (Oturum 2):**
  - `arg.bv.web/src/theme.ts` dosyasından ana tema renkleri (`#36B6C5` Cyan, `#FF6B00` Orange, `#F1F5F9` Slate BG, `#0F172A` Text) mobil `src/constants/theme.ts` içerisine aktarıldı.
  - `arg.bv.web.admin/src/pages` klasöründeki tüm sayfalar incelenerek mobil karşılıkları hazırlandı:
    - `UsersScreen.tsx` (User001)
    - `PaymentsScreen.tsx` (Payment001)
    - `CategoriesScreen.tsx` (Category001/002)
    - `PricePlansScreen.tsx` (PricePlan002/Product001)
    - `AnnouncementsScreen.tsx` (Announcement001)
    - `SiteSettingsScreen.tsx` (SiteSetting001)
    - `CompaniesScreen.tsx` ve `DemandsScreen.tsx` web admin yetenekleriyle zenginleştirildi (Banlama, Personeller, Yanıt Veren Firmalar, Reddetme).
    - `DashboardScreen.tsx` tüm modülleri içeren yönetim merkezine dönüştürüldü.
  - `src/services/serviceAdmin.ts` tüm AdminController endpointleri ile tam senkronize edildi.
  - `src/navigation/RootNavigator.tsx` güncellenerek Bottom Tabs + Stack mimarisi kuruldu.
  - `SettingsScreen.tsx` içerisine dinamik API sunucu linki düzenleme ve varsayılana sıfırlama modalı eklendi; `apiClient.ts` istekleri dinamik olarak bu adrese yönlendirildi.
  - `DashboardScreen.tsx` içerisindeki tüm modül başlıklarından parantez içindeki sayfa kodları (`Company001`, `Demand001` vb.) temizlendi, sade ve anlaşılır hale getirildi.
  - IIS altında `http://local.argteknoloji.com/portal/arg-bv/BvService` servisleri kontrol edildi:
    - `/Token/Login` rotasının aktif olduğu (HTTP 200) doğrulandı.
    - `/Bv.Admin/...` çağrısının 404 verdiği, doğru controller rotasının doğrudan `/Admin/...` olduğu PowerShell ile test edilerek doğrulandı.
    - `appConfig.ts` varsayılan sunucu adresi `http://local.argteknoloji.com/portal` olarak ayarlandı.
    - `TokenController.Login` için `username` parametresi ve `accesstoken` yanıt eşleşmesi sağlandı.
  - Uygulama genelindeki tüm sayfalardan (`UsersScreen`, `CompaniesScreen`, `DemandsScreen`, `PaymentsScreen`, `CategoriesScreen`, `PricePlansScreen`, `AnnouncementsScreen`, `ReportsScreen`, `SiteSettingsScreen`, `DashboardScreen`, `LoginScreen`) hardcoded/mock veriler tamamen kaldırıldı; tüm listeler doğrudan canlı API yanıtına bağlandı.
  - `npx tsc --noEmit` ile tip kontrolü yapıldı, 0 hata ile doğrulandı.
- **2026-10-02 (Oturum 3):**
  - **Veri Yüklenmeme ve Toplam Talep 0 Görünme Sorunu Çözüldü:**
    1. **API Yanıt Normalizasyonu (`apiClient.ts`):** ASP.NET Core backend `Result<T>` sınıfı PascalCase (`ResultType`, `Data`, `Description`) döndürdüğü için, mobil ekranlardaki `res.resulttype == 1` kontrolleri `undefined` alarak veriyi yüklemiyordu. `apiClient.interceptors.response` içerisinde normalizasyon yapılarak `resulttype`/`ResultType`, `data`/`Data`/`value`, `description`/`Description` alanları çift yönlü desteklenir hale getirildi.
    2. **Özet Metrikleri Küçük/Büyük Harf Eşleşmesi (`DashboardScreen.tsx`):** Backend `AdminDashboardSummaryEntity` alanları PostgreSQL şemasıyla tamamen küçük harfli (`totaldemands`, `activedemands`, `totalusers`, `totalcompanies`, `totalsuccessrevenue` vb.) dönüyordu. `DashboardScreen` içindeki `loadData` fonksiyonunda web admindeki `MainWeb.tsx` ile birebir aynı mapping (`val.totaldemands ?? val.totalDemands ?? 0` vb.) yapıldı.
    3. **Toplam Talep KPI Kartı:** Web admin ile tam uyumlu hale getirilerek `stats.totalDemands` (veritabanındaki toplam 2 talep) ve altında `${stats.activeDemands} Aktif / Yayında` rozeti konumlandırıldı.
    4. **Yetki / Bağlantı Uyarısı:** Olası token süresi dolması (401) veya sunucu erişim problemlerinde sessizce 0 kalmaması için standart info kutusu (`MaterialIcons`, `#D71920` uyumlu) ile kullanıcıya anlık bildirim sağlandı.
    5. `DemandsScreen.tsx` arama filtresine null koruması eklendi, `userdisplayname` alanı desteklendi. `npx tsc --noEmit` ile tip kontrolü 0 hata ile doğrulandı.
    6. **Dinamik Canlı/Lokal Servis URL Altyapısı (`SettingsScreen.tsx`, `appConfig.ts`, `serviceStorage.ts`):** Kullanıcının doğrudan servis linki (`.../portal/arg-bv/BvService`), portal linki (`.../portal`) veya domain girmesi durumlarında otomatik tam servis adresine tamamlayan `normalizeServiceUrl` motoru yazıldı. Ayarlar ekranına tek dokunuşla "Canlı Servis" (`https://admin.bundanvarmi.com/portal/arg-bv/BvService`) ve "Lokal IIS" (`http://local.argteknoloji.com/portal/arg-bv/BvService`) geçiş butonları ile canlı önizleme eklendi.
- **2026-10-02 (Oturum 4):**
  - **ARG Portal Oturum & Servis Mimarisi Entegrasyonu (`serviceAdmin.ts`, `LoginScreen.tsx`, `SettingsScreen.tsx`, `appConfig.ts`):**
    1. **SessionService ile Kimlik Doğrulama:** Web admin (`arg.bv.web.admin`) ile birebir aynı kurumsal oturum yapısına geçildi. Giriş işlemleri doğrudan `/arg-Session/SessionService/Token/Login` endpointine yönlendirildi.
    2. **Portal Parametreleri:** Giriş payload'ı `SystemCode` (Organizasyon, varsayılan: `arg`), `UserName` (varsayılan: `admin`) ve `Password` (şifre: `123qqqQ`) olarak yapılandırıldı.
    3. **Servis Yolu Ayrımı:** Portal kök adresi (`http://local.argteknoloji.com/portal` veya `https://admin.bundanvarmi.com/portal`) baz alınarak:
       - Kimlik Doğrulama: `/arg-Session/SessionService/Token/Login`
       - Admin İşlemleri: `/arg-bv/bvService/Admin/...` (GetAdminDashboardSummary, GetUserList, GetCompanyList, GetDemandList vb.)
    4. **Canlı ve Lokal Doğrulama:** Hem `local.argteknoloji.com/portal` hem de `admin.bundanvarmi.com/portal` üzerinde Python testleri ile oturum açılıp JWT token alındığı ve ardından `GetAdminDashboardSummary` servisinin başarıyla verileri getirdiği (Lokalde toplam 2 talep, 14 kullanıcı, 12 firma; Canlıda 4 talep, 7 kullanıcı, 4 firma) uçtan uca test edilip doğrulandı.
    5. **Arayüz İyileştirmeleri:** `LoginScreen.tsx` ekranına "Organizasyon Kodu", "Kullanıcı Adı" ve "Şifre" (göz ikonuyla gizle/göster) alanları eklendi. Varsayılan değerler kullanıcının verdiği bilgilerle hazırlandı. Hızlı sunucu değiştirme modalı "Canlı Portal" ve "Lokal IIS" seçenekleriyle tam uyumlu hale getirildi.
    6. `npx tsc --noEmit` ile tip kontrolleri yapıldı, 0 hata ile doğrulandı.
    7. **Android Yön Tuşları / Alt Bar Hizalaması (`RootNavigator.tsx`):** Android cihazlarda alttaki 3'lü yön tuşlarının (Geri, Ana Ekran, Son Uygulamalar) tab bar butonlarını kapatmasını engellemek için `useSafeAreaInsets` entegre edildi; Android için minimum 22px güvenli taban mesafesi (`safeBottom`) ve dinamik yükseklik (`56 + safeBottom`) ile gölge/elevasyon standartları uygulandı.
- **2026-10-02 (Oturum 5):**
  - **Kurumsal Logo Entegrasyonu (Tüm Uygulama Geneli):**
    1. **Logo Varlıkları:** Resmi 512x512 RGBA "Bundan Var Mı?" logosu `assets/logo.png` olarak projeye eklendi; Expo `icon.png`, `splash-icon.png` ve `android-icon-foreground.png` dosyaları bu logoyla güncellendi.
    2. **`AppLogo.tsx` Bileşeni:** Yeniden kullanılabilir, boyutlandırılabilir ve isteğe bağlı `ADMIN` rozeti barındıran kurumsal logo bileşeni oluşturuldu (`src/components/AppLogo.tsx`).
    3. **Giriş Ekranı (`LoginScreen.tsx`):** Giriş kartı başlığına büyük ve şık `ADMIN` rozetli kurumsal logo yerleştirildi.
    4. **Navigasyon Çubuğu (`RootNavigator.tsx`):** Tüm ana sekmelerin sol üst başlık alanına (`headerLeft`) ve alt sayfaların sağ üst alanına (`headerRight`) `AppLogo` eklendi.
    5. **Dashboard & Ayarlar:** `DashboardScreen.tsx` üst karşılama alanına ve `SettingsScreen.tsx` yönetici profil kartı avatarına logo entegre edildi.
    6. **Boş Liste Durumları:** `DemandsScreen.tsx`, `CompaniesScreen.tsx`, `UsersScreen.tsx` boş arama/liste durumlarına saydam logo filigranı uygulandı.
    7. `npx tsc --noEmit` ile tip kontrolü yapıldı, 0 hata ile doğrulandı.
- **2026-10-03 (Oturum 6):**
  - **Oturum Kalıcılığı (Persistent Session) ve Yetkisiz Oturum (401) Önleme Mimarisi:**
    1. **Çoklu Platform Depolama & Bellek Önbelleği (`serviceStorage.ts`):** Web (localStorage) ve Native (SecureStore) ortamları şeffaf bir katman altında birleştirildi. Bellek içi (in-memory) değişkenlerle token ve kullanıcı bilgisi anlık erişilebilir kılındı.
    2. **Oturum Kimlik Bilgilerinin Saklanması:** Giriş anında `setSavedCredentials` ile kullanıcı bilgileri saklanarak, uygulama yeniden başlatıldığında veya sayfa yenilendiğinde otomatik oturum açma (silent auto-login) altyapısı sağlandı.
    3. **HTTP 401 Durumunda Arka Planda Sessiz Yenileme (`apiClient.ts`):** Token süresi dolduğunda veya yetki uyarısı alınabilecek durumlarda, `apiClient` Axios yanıt interceptor'ı devreye girerek arka planda `/arg-Session/SessionService/Token/Login` üzerinden yeni token alıp başarısız olan isteği otomatik olarak tekrarlar. Böylece kullanıcı "Oturum süresi dolmuş veya yetkiniz yok (401)" uyarısıyla karşılaşmaz.
    4. **Aktif Canlı Portal Varsayılanı (`appConfig.ts` & `LoginScreen.tsx`):** Varsayılan portal URL'i aktif çalışan canlı sunucuya (`https://admin.bundanvarmi.com/portal`) bağlandı.
    5. **Açılışta Oturum Kurtarma (`RootNavigator.tsx`):** Token veya kayıtlı kimlik bilgisi tespit edildiğinde kullanıcı tekrar giriş ekranına düşmeden doğrudan sisteme aktarılır.
    6. **Temiz Oturum Kapatma (`SettingsScreen.tsx`):** Kullanıcı yalnızca "Oturumu Kapat" butonuna bastığında tüm token, bellek ve kimlik bilgileri silinerek giriş ekranına yönlendirilir.
    7. `npx tsc --noEmit` ile derleme doğrulaması yapıldı, 0 hata ile tamamlandı.
- **2026-10-03 (Oturum 7):**
  - **Kurumsal Logo & Açılış (Splash/Icon) Güncellemesi (`logoyazi512.png`):**
    1. **Bileşen Güncellemesi (`AppLogo.tsx`):** Uygulama genelinde kullanılan kurumsal logo kaynağı doğrudan `assets/logoyazi512.png` olarak güncellendi.
    2. **Açılış ve Uygulama İkonları Senkronizasyonu (`app.json` & `assets/`):** Uygulama açılış ekranı (`splash`), uygulama ikonu (`icon`), Android uyarlanabilir ikonu (`adaptiveIcon`) ve web favicon varlıkları `logoyazi512.png` ile senkronize edildi; açılış arka plan rengi kurumsal beyaz (`#ffffff`) olarak yapılandırıldı.
    3. `npx tsc --noEmit` ile tip kontrolleri yapıldı, 0 hata ile doğrulandı.
- **2026-10-03 (Oturum 8):**
  - **Web Admin Eşitlemesi (Kategori, Talep Detayları ve Site Yönetimi Metin Düzenlemeleri):**
    1. **Kategori Ekranı Düzeltmesi (`CategoriesScreen.tsx` & `types/index.ts`):** Web admindeki `Category001.tsx` ve `Category002.tsx` ile backend `CategoryEntity` (`categoryname`, `parentid`, `orderby`, `isactive`) yapısına tam uyumlu hale getirildi. Backend'in reddettiği hatalı alan isimleri düzeltildi; üst kategori seçimi, sıra numarası ve aktiflik durumu desteği eklendi.
    2. **Talep Ekranı Zenginleştirmesi (`DemandsScreen.tsx`):** Web admindeki `Demand001.tsx` sayfasının tüm yetenekleri mobile aktarıldı:
       - Fotoğraf önizleme şeridi ve tam ekran fotoğraf görüntüleme (zoom) modalı,
       - 🔥 Acil Talep rozeti ve filtre sekmesi,
       - Hedefleme modu (Akıllı Çap, Sabit Çap, İl/İlçe, Favoriler) ve Arama adımı rozetleri,
       - Reddedilen talepler için gerekçe açıklama kutusu (`searchstatustext`),
       - Detaylı Talep İnceleme Modalı (tüm meta veriler, fotoğraflar ve firma yanıtları ile doğrudan onay/red aksiyonları).
    3. **Site Yönetimi Metin Taşması Çözümü (`SiteSettingsScreen.tsx`):** Değer kutusu dikey ve saran (`flexShrink: 1`, `lineHeight: 18`) yapıya kavuşturuldu; düzenleme modalındaki text input multiline hale getirilerek uzun metin ve URL'lerin taşması önlendi; grup filtre sekmeleri eklendi.
    4. **Duyuru Yönetimi İyileştirmesi (`AnnouncementsScreen.tsx`):** Modal Header Standardı ve `AppColors.accent` buton standartları uygulandı.
    5. `npx tsc --noEmit` ile tip kontrolleri yapıldı, 0 hata ile doğrulandı.
- **2026-10-03 (Oturum 9):**
  - **Ödemeler & Abonelik Takibi Durum ve Hoşgeldin Paketi Düzeltmesi (`PaymentsScreen.tsx` & `types/index.ts`):**
    1. **Kök Neden Tespiti:** Web admin (`Payment001.tsx`) ve backend `PaymentStatus`/`SubscriptionStatus` enum değerlerinde `Success` / `Active` durumu **`2`** iken; mobil ekranda hatalı olarak `status == 1` kontrolü yapılıyordu (`1 = Pending / Ödeme Bekliyor`). Bu nedenle 0 TL Hoşgeldin Paketleri (status: 2) "Başarısız", aktif abonelikler ise "Süresi Doldu" olarak görünüyordu. Ayrıca toplam ciro hesabında `status == 1` filtresi kullanıldığı için başarılı tahsilatlar toplama dahil edilmiyordu.
    2. **Ödeme Durum ve Tutar Eşlemesi:**
       - `status: 2` -> "Başarılı" (`#166534`, yeşil rozet).
       - `status: 1` -> "Ödeme Bekliyor" (`#92400e`, sarı rozet).
       - `status: 4` -> "Zaman Aşımı / İptal" (`#991b1b`, kırmızı rozet).
       - `status: 3` -> "Başarısız" (`#991b1b`, kırmızı rozet).
       - 0 TL ve `paymentprovider === 'free'` kayıtları için `0 ₺ (Ücretsiz)` / `Hoşgeldin Paketi` özel etiketlemesi yapıldı.
       - Hata mesajı içeren (ör. "Ödeme oturumu zaman aşımına uğradı") işlemler için belirgin uyarı kutusu eklendi.
    3. **Abonelik Durum Eşlemesi:**
       - `status: 2` -> "Aktif Abonelik" (`#166534`, yeşil rozet).
       - `status: 1` -> "Ödeme Bekliyor" (`#b45309`, sarı rozet).
       - `status: 3` -> "Süresi Doldu" (`#991b1b`, kırmızı rozet).
       - `status: 4` -> "İptal Edildi" (`#475569`, gri rozet).
       - Ödenen tutar, başlangıç/bitiş tarihleri ve otomatik yenileme durumu kartlara entegre edildi.
    4. **Web Admin Paritesi ve Filtreleme:**
       - Ödemeler sekmesi için: Tümü, Başarılı, Ödeme Bekliyor, Hatalı/İptal alt filtre çipleri eklendi.
       - Abonelikler sekmesi için: Tümü, Aktif, Süresi Dolan/Diğer filtre çipleri eklendi.
       - Toplam başarılı tahsilat cirosu `status: 2` üzerinden doğru şekilde hesaplandı.
    5. **İşlem Detay ve Raw Log Modalı (Modal Header Standard):**
       - Herhangi bir ödeme işlemine tıklandığında açılan, sağlayıcı işlem no, tarih, varsa sağlayıcı hata mesajı ile `rawrequest` ve `rawresponse` ham loglarını renkli JSON formatında gösteren detay modalı eklendi.
    6. `npx tsc --noEmit` ile tip kontrolleri yapıldı, 0 hata ile doğrulandı.
- **2026-10-03 (Oturum 10):**
  - **Talep Ekranı Konum (`-/-`) Temizliği ve Firma Yanıt Sayısı Senkronizasyonu (`DemandsScreen.tsx` & `serviceAdmin.ts`):**
    1. **`-/-` Konum Taşmasının Kaldırılması:** `formatLocation` yardımcı fonksiyonu yazıldı. Veritabanından gelen taleplerde il ve ilçe verisi bulunmadığında kartlarda ve detay modalında basılan `'-' / '-'` (yani `-/-`) tamamen kaldırıldı; yalnızca geçerli bir il veya ilçe adı olduğunda görüntülenmesi sağlandı.
    2. **Firma Yanıt Sayısı (Response Count) Senkronizasyonu:**
       - Backend `GetDemandList` sorgusunda yer almayan `respondedcount` değeri için, talepler yüklendiğinde arka planda asenkron olarak `loadCompanyCounts` tetiklendi ve her talep için ilgili esnaf sayısı çekilerek doğrudan kart üzerine yansıtıldı (`X Firma Yanıtı`).
       - `serviceAdmin.getDemandCompanyList` servisi eklendi.
       - "Firma Yanıtları" butonuna tıklandığında hem modalda anlık yanıt listesi güncellendi hem de talep state'indeki yanıt adedi senkronize edildi.
    3. **Yanıt Veren Firmalar Modalı Zenginleştirmesi:**
       - Modal başlığına toplam yanıt adedi eklendi (`Talebe Yanıt Veren Firmalar (X)`).
    4. **"Acil" Filtresi ve Rozetlerinin Kaldırılması:** Kullanıcının talebi doğrultusunda sistemde artık yer almayan "Acil" talep durumu, sekme filtrelerinden (`🔥 Acil`), filtreleme mantığından, talep kartlarından ve detay modalından tamamen temizlendi.
    5. **Üst Bilgi Kutusunun Kaldırılması:** Ekranın en tepesinde yer alan genel bilgilendirme kutusu kaldırıldı; arama çubuğu ve filtreler ekranın üst kısmına doğrudan yerleştirilerek daha ferah ve pratik bir liste alanı sağlandı.
    6. `npx tsc --noEmit` ile derleme doğrulaması yapıldı, 0 hata ile doğrulandı.
- **2026-10-03 (Oturum 11):**
  - **EAS Yapılandırması ve Android APK Derlemesi (`app.json`, `eas.json`, `.easignore`):**
    1. **EAS Proje Bağlantısı & Kimlik:** `app.json` dosyasına `"package": "com.arg.bv.admin"`, `"bundleIdentifier": "com.arg.bv.admin"` ve uygulama ismi (`Bundan Var Mı? Admin`) eklendi; Expo EAS projesi `israfilaysal/arg_bv_admin_mobile` ile eşleştirildi.
    2. **EAS Build Profili (`eas.json`):** Doğrudan cihaza kurulabilir bağımsız Android APK (`buildType: "apk"`) ve dahili iOS dağıtımı (`internal distribution`) profilleri tanımlandı.
    3. **Android APK Çıktısı:** `eas build --platform android --profile preview` çalıştırıldı ve bulutta başarıyla doğrudan indirilebilir `.apk` derlemesi tamamlandı.
       - İndirme & Kurulum Bağlantısı: `https://expo.dev/accounts/israfilaysal/projects/arg_bv_admin_mobile/builds/d0e19d3d-1184-4e2e-b2ba-b9cb0545a594`
    4. **iOS TestFlight'sız Kurulum Rehberi:** Expo Go (anında açma) ve Ad-Hoc / UDID profili (ana ekrana IPA kurma) seçenekleri hazırlandı.
