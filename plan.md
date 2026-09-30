# Seksen Bir Diyar — Geliştirme Planı

Türkiye'nin 81 ilinde geçen, tarayıcıda oynanan, sıra tabanlı bir RPG. Oyuncu illeri gezer, yaratıkları yener, seviye atlar ve yurdu zalim sihirbaz Zülmet'in kötülüğünden arındırır.

---

## 0. Claude Code İçin Çalışma Kuralları

Bu dosya projenin tek doğruluk kaynağıdır. "Planı uygula" dendiğinde şu kurallara uy:

1. Bu dosyayı baştan sona oku. Özellikle **Bölüm 2 (Kırmızı Çizgiler)** her fazda geçerlidir.
2. **Bölüm 8 (Durum Takibi)** tablosunda işaretlenmemiş **ilk fazı** bul. Yalnızca o fazı uygula. Sonraki fazlara ait kod yazma.
3. Fazın tüm görevlerini bitir. Ardından `npm run test` ve `npm run build` komutlarını çalıştır, ikisi de hatasız geçmeli.
4. Fazın **Kabul Kriterleri**ni tek tek kontrol et.
5. Bu dosyada tamamlanan görevleri `[x]` yap. Durum Takibi tablosunu güncelle.
6. Fazda belirtilen mesajla **tek commit** at.
7. Dur. Kullanıcıya kısa bir rapor ver: ne yapıldı, nasıl denenir (`npm run dev`), varsa bilinen eksikler. Bir sonraki faza **kullanıcı onay vermeden geçme**.
8. Plan ile kod arasında çelişki görürsen ya da bir karar planda yoksa, tahmin yürütme. Kullanıcıya sor.
9. Oyundaki tüm metinler Türkçe olmalı. Türkçe karakterler (ç, ğ, ı, İ, ö, ş, ü) her yerde doğru görünmeli. Dosya ve değişken adlarında Türkçe karakter kullanma (`savas.js`, `bolge`).

---

## 1. Oyunun Özeti

### Hikâye
**Zülmet** adlı zalim bir sihirbaz, yasak sihirle zalim cinleri ve ifritleri Anadolu'ya salmıştır. Köyler basılmış, yollar kesilmiş, kervanlar yağmalanmıştır. Oyuncu, mazlumu korumak için yola çıkan genç bir yiğit olan **Alp**'tir. İstanbul'dan başlar ve bölge bölge ilerler. Her bölgede Zülmet'in sihriyle azmış bir mahlûku yener. Sonunda Ağrı Dağı'ndaki kalede Zülmet'in sihrini bozar.

### Temel döngü
Oyuncu bir ile gider, orada **keşfe çıkar** ve bir **düşmanla karşılaşır**. Savaşı **sıra tabanlı** olarak yapar. Kazanınca **XP, akçe ve ganimet** alır, ilin **arınma yüzdesi** artar. Yeterli XP ile **seviye atlar**. Bölgede yeterince ilerleyince **bölge bossu** açılır. Boss yenilince **sonraki bölge** açılır.

### Uzun vadeli hedef
81 ilin tamamını %100 arındırmak ve Zülmet'i yenmek.

---

## 2. Kırmızı Çizgiler (Kültürel Kurallar)

Oyunun tüm kurgusu Türk ve İslam kültürüne uygun olmalıdır. Bu kurallar **her fazda** geçerlidir, hiçbir koşulda ihlal edilmez:

- **Tanrılar yok.** Kötülüğün kaynağı sihir, zulüm ve zalim cinlerdir. Hiçbir karakter ya da yaratık tanrı, ilah veya "yaratıcı" olarak sunulmaz. Eski Türk inancındaki tanrılar (Erlik Han vb.) kullanılmaz.
- **Sihir kötüdür.** Sihir yalnızca düşman tarafının gücüdür. Oyuncunun yetenekleri sihir değil, **beceri, yiğitlik ve manevi güç** (Nefes) olarak anlatılır.
- **Kutsal değerler mekanik olmaz.** Ayetler, Allah'ın isimleri (Esmâ-ül Hüsnâ), dualar, ibadetler, peygamber ve sahabe isimleri saldırı adı, eşya, yetenek ya da oyun mekaniği olarak **kullanılmaz**. Camiler savaş alanı değildir.
- **Alkol, domuz eti ve domuz ürünleri** hiçbir yerde yoktur: ne eşya, ne yemek, ne ganimet, ne metin. Yaban domuzu düşman olarak var olabilir ama ganimetinde et ya da ürün düşmez.
- **Kumar mantığı yoktur.** Şans kutusu, sandık açma, çark, bahis bulunmaz. Ganimetler savaş sonucunda açıkça düşer.
- **Görseller ve metinler edeplidir.** Müstehcenlik ve kaba küfür yoktur. Şiddet abartılmaz, kan ve vahşet tasvir edilmez. Yenilen düşmanlar "dağılır", "kaçar" ya da "sihri bozulur".
- **Öne çıkan değerler:** yiğitlik, adalet, misafirperverlik, mazluma yardım, esnaf ahlakı (Ahilik).
- **Bölgeler ve halklar** saygıyla anlatılır. Hiçbir il, bölge ya da topluluk küçümsenmez veya stereotiple alay konusu yapılmaz.

---

## 3. Teknik Yapı

### Teknoloji
- **Vite** ve **vanilla JavaScript** (ES modülleri). Framework kullanılmaz.
- **Vitest** ile testler.
- Harita için **SVG**.
- Kayıt için **localStorage**. Kayıt şeması versiyonlanır.
- Yayın **GitHub Pages** üzerinden, GitHub Actions ile otomatik yapılır.
- Önce mobil düşünülür (dikey telefon ekranında rahat oynanmalı), masaüstünde de düzgün görünür.

### Klasör yapısı
```
/
├─ index.html
├─ package.json
├─ vite.config.js
├─ plan.md
├─ README.md
├─ .github/workflows/deploy.yml
├─ public/
│  └─ favicon.svg
├─ src/
│  ├─ main.js                # giriş noktası, ekran yönetimi
│  ├─ oyun/                  # SAF OYUN MANTIĞI — DOM'a dokunmaz
│  │  ├─ durum.js            # oyun durumu + abonelik (subscribe/emit)
│  │  ├─ rastgele.js         # tohumlanabilir RNG (testler için)
│  │  ├─ karakter.js         # stat hesapları, seviye atlama
│  │  ├─ savas.js            # sıra tabanlı savaş motoru
│  │  ├─ kesif.js            # keşif, karşılaşma üretimi, arınma
│  │  ├─ envanter.js         # heybe, yemek kullanma
│  │  ├─ ekipman.js          # eşya kuşanma ve çıkarma
│  │  ├─ ticaret.js          # arasta ve Ahi esnafı alışverişi
│  │  ├─ kervansaray.js      # dinlenme ve hızlı yolculuk
│  │  ├─ gezinti.js          # il içi karo harita, yürüme, haritadaki düşmanlar
│  │  ├─ gorevler.js         # görev alma, ilerleme, teslim ve ödül
│  │  ├─ itibar.js           # Hayır puanı, unvan, arasta indirimi, köylülerin hediyesi
│  │  ├─ basarimlar.js       # başarımlar ve yemek defteri
│  │  ├─ ilerleme.js         # bölge kilitleri, boss koşulları
│  │  └─ kayit.js            # kaydet / yükle / şema göçü
│  ├─ veri/                  # SADECE VERİ — mantık yok
│  │  ├─ iller.js
│  │  ├─ bolgeler.js
│  │  ├─ yemekler.js
│  │  ├─ dusmanlar.js
│  │  ├─ siniflar.js
│  │  ├─ esyalar.js
│  │  ├─ gorevler.js
│  │  ├─ itibar.js
│  │  ├─ basarimlar.js
│  │  └─ metinler.js         # arayüz metinleri tek yerde
│  ├─ arayuz/
│  │  ├─ harita.js
│  │  ├─ yeniOyunEkrani.js   # isim ve sınıf seçimi
│  │  ├─ ilEkrani.js
│  │  ├─ savasEkrani.js
│  │  ├─ karakterEkrani.js
│  │  ├─ envanterEkrani.js
│  │  ├─ gorevEkrani.js      # muhtar ve Ahi Baba ile konuşma
│  │  ├─ gunlukEkrani.js     # görev günlüğü, itibar ve başarımlar
│  │  ├─ bitisEkrani.js      # bitiş sahnesi ve 81 ilin özeti
│  │  ├─ ses.js              # Web Audio ile sentezlenen ses efektleri
│  │  └─ bilesenler.js       # buton, çubuk, modal vb.
│  └─ stil/
│     └─ ana.css
└─ tests/
```

### Mimari ilkeler
- `src/oyun/` altındaki her şey **saf fonksiyonlardır**. Girdi alır, yeni durum döndürür, DOM'a erişmez. Böylece testlerle doğrulanabilir.
- Rastgelelik yalnızca `rastgele.js` üzerinden gelir. Testlerde sabit tohum kullanılır.
- Arayüz, durumu okur ve oyuncu eylemlerini `oyun/` fonksiyonlarına iletir.
- Oyun verisi (iller, yemekler, düşmanlar) kod içine gömülmez. Hepsi `src/veri/` altında durur, kolayca düzenlenebilir.

### Görsel stil
- Renk paleti İznik ve Kütahya çinisinden esinlenir: turkuaz, lacivert, mercan kırmızısı, altın ve krem zemin.
- Çerçevelerde ve ayraçlarda sade geometrik (Selçuklu yıldızı tarzı) motifler kullanılır. Bunlar CSS veya SVG ile çizilir, harici görsel kullanılmaz.
- Başlıklarda Türkçe karakter destekli bir serif font, metinlerde okunaklı bir sans-serif font kullanılır.
- Karakter ve düşmanlar koddan üretilen stilize SVG çizimlerle temsil edilir (Faz 5; `src/arayuz/cizimler/`). Emojiler yalnızca yemek ve arayüz simgelerinde kullanılır. İnsan figürleri edepli ve stilize olur.
- Savaş arka planlarında ibadethane silueti ve tanrı heykeli ya da put bulunmaz.

---

## 4. Dünya

### Bölgeler

Bölgeler aşağıdaki **sırayla** açılır:

| Sıra | Bölge | İl | Seviye | Giriş İli | Boss | Boss İli |
|---|---|---|---|---|---|---|
| 1 | Marmara | 11 | 1–10 | İstanbul (34) | Boğaz Ejderi | İstanbul (34) |
| 2 | Ege | 8 | 8–18 | Manisa (45) | Yelbegen | İzmir (35) |
| 3 | Akdeniz | 8 | 15–25 | Antalya (07) | Şahmeran | Mersin (33) |
| 4 | İç Anadolu | 13 | 20–32 | Konya (42) | Albastı | Nevşehir (50) |
| 7 | Karadeniz | 18 | 28–40 | Bolu (14) | Karakoncolos | Trabzon (61) |
| 8 | Güneydoğu | 9 | 35–45 | Gaziantep (27) | Tepegöz | Şanlıurfa (63) |
| 9 | Doğu Anadolu | 14 | 42–50 | Malatya (44) | Van Gölü Canavarı | Van (65) |
| Final | — | — | 48+ | — | **Zülmet** | Ağrı (04) |

Bölge bossları tanrı değildir. Hepsi Zülmet'in sihriyle azmış mahlûklardır.

### İl verisi şeması (`src/veri/iller.js`)
```js
{
  plaka: 34,
  ad: "İstanbul",
  bolge: "marmara",
  lat: 41.01, lon: 28.98,        // il merkezinin yaklaşık koordinatı
  komsular: [39, 59, 41],        // kara sınırı olan iller (plaka)
  seviye: [1, 3],                // bu ildeki düşman seviye aralığı
  dusmanlar: ["ac_kurt", "yol_kesen_cin"],
  yemek: "balik_ekmek"           // yemekler.js anahtarı
}
```

### Komşuluk kuralları
- Komşuluk, illerin **gerçek kara sınırlarına** göre belirlenir. Deniz geçişi yoktur.
- Komşuluk **simetrik** olmalıdır: A, B'nin komşusuysa B de A'nın komşusudur.
- Tüm iller tek bir bağlı çizge oluşturmalıdır.
- Komşuluklar OpenStreetMap il sınırlarıyla karşılaştırılarak doğrulandı (Faz 1). OSM'deki deniz (karasuları) sınırları — İstanbul–Yalova, İstanbul–Bursa, Balıkesir–Tekirdağ — komşuluk sayılmaz.
- Doğrulama testleri yazılır. Örnek kontroller:
  - İstanbul'un komşuları tam olarak {Kırklareli, Tekirdağ, Kocaeli} olmalı.
  - Ankara'nın komşuları tam olarak {Çankırı, Kırıkkale, Kırşehir, Aksaray, Konya, Eskişehir, Bolu} olmalı.

### İl seviyeleri
Her bölgede, giriş iline yakın iller düşük seviyeli, uzak iller yüksek seviyeli olur. Mesafe, bölge içinde giriş ilinden başlayan BFS ile hesaplanır. Seviye aralıkları bölgenin genel aralığını kademeli olarak kaplar.

Formül (Faz 1): bölge aralığı `[a, b]`, en uzak mesafe `D` ve `kademe = (b − a) / (D + 1)` olmak üzere, `d` mesafedeki ilin aralığı `[a + round(d × kademe), a + round((d + 1) × kademe)]` olur. Hesap `src/oyun/ilerleme.js` içindedir, sonuçlar `iller.js`'e yazılıdır ve testlerle eşitliği denetlenir.

### Harita
- İller, `lat`/`lon` değerlerinden basit bir izdüşümle SVG koordinatına çevrilir: `x = (lon − 25.5) × k × cos(39°)`, `y = (42.2 − lat) × k`.
- İller gerçek sınırlarıyla (OpenStreetMap, `src/veri/ilSinirlari.js`) boyanır; üzerlerinde her il bir düğüm, her komşuluk bir çizgi olarak çizilir.
- Düğüm renkleri: kilitli (gri), açık (bölge rengi), bulunulan il (altın halka), %100 arınmış (yeşil). Yeşil yalnızca arınmış iller için kullanılır; bu yüzden Karadeniz'in bölge rengi fındık kahvesidir. Arınmış iller renge ek olarak düğümde ✓ işaretiyle ve il şeklinde çizgili desenle de gösterilir.
- Harita mobilde parmakla kaydırılabilir ve yakınlaştırılabilir olmalıdır.

---

## 5. Karakter ve Savaş

### Statlar
- **Can:** Sıfıra düşerse oyuncu bayılır.
- **Nefes:** Yetenek kullanmak için harcanır.
- **Güç:** Verilen hasarı belirler.
- **Savunma:** Alınan hasarı azaltır.
- **Çeviklik:** Kritik vuruş, kaçınma ve kaçma şansını etkiler.

### Sınıflar (`src/veri/siniflar.js`)

| Sınıf | Tarif | Can | Nefes | Güç | Savunma | Çeviklik |
|---|---|---|---|---|---|---|
| Akıncı | Kılıçlı öncü süvari, dayanıklı | 120 | 30 | 12 | 10 | 6 |
| Kemankeş | Osmanlı okçusu, çevik ve isabetli | 90 | 40 | 11 | 6 | 12 |
| Alperen | Gazi-derviş geleneğinden, manevi güçle savaşır | 85 | 70 | 9 | 7 | 8 |

Her seviyede sınıfa özgü otomatik stat artışı gelir. Ayrıca oyuncuya dağıtılacak **3 stat puanı** verilir.

### Yetenekler

| Sınıf | Sv 1 | Sv 5 | Sv 12 | Sv 20 | Sv 32 |
|---|---|---|---|---|---|
| Akıncı | Kılıç Darbesi | Kalkan Duruşu | Akın Hamlesi | Yiğit Nârası | Tufan Kılıcı |
| Kemankeş | Nişan Oku | Çifte Ok | Ok Yağmuru | Kartal Gözü | Menzil Atışı |
| Alperen | Asa Darbesi | Şifa Nefesi | Hikmet Kalkanı | Arınma Işığı | Gönül Dirliği |

Arınma Işığı, cin ve ifrit türü düşmanlara ekstra hasar verir.

### Başlangıç formülleri
Bu formüller ilk sürüm içindir. Faz 3'te dengelendi; hesaplar `src/oyun/karakter.js` ve `src/oyun/savas.js` içindedir.

- **Gereken XP:** `round(30 × sv^1.35)` — bir seviyeden sonrakine geçmek için (Faz 10 dengelemesi; ilk sürümde `round(40 × sv^1.6)`). Seviye atlayınca XP sıfırlanır, artan kısım aktarılır.
- **Seviye atlama:** sınıfın otomatik stat artışı + 3 stat puanı gelir, can ve nefes tamamen dolar.
- **Stat puanı değeri:** 1 puan = +5 can, +3 nefes, +1 güç, +1 savunma ya da +1 çeviklik.
- **Hasar:** `max(1, round(güç × yetenekÇarpanı × rnd(0.9–1.1) − savunma × 0.5))`
- **Kritik şansı:** `min(30%, çeviklik × 0.8%)` (+ Kartal Gözü bonusu). Kritik vuruş ×1.5 hasar verir.
- **Kaçınma şansı:** `min(20%, çeviklik × 0.5%)` — saldırılan taraf hamleden sıyrılır, hasar almaz.
- **Kaçma şansı:** `max(0%, min(70%, 35% + (oyuncuÇev − düşmanÇev) × 2%) − takipçi cezası)`. Peşine takılan (takipçi) düşmanlarda ceza %15'tir. Bosslardan kaçılamaz.
- **Düşman statları:** seviye ve tür çarpanıyla ölçeklenir:
  `can = (20 + sv × 12) × c.can`, `güç = (6 + sv × 2) × c.güç`, `savunma = (4 + sv × 1.5) × c.savunma`, `çeviklik = (4 + sv) × c.çeviklik` (hepsi yuvarlanır).
- **XP ödülü:** `round((5 + sv × 10) × sınıfÇarpanı)`; sınıf çarpanı sıradan 1, mini boss 3, bölge bossu 8, final 15.
- **Düşman yapay zekâsı:** %20 ihtimalle türüne özgü özel hamle (hayvan, cin, ifrit, dev ve boss için güçlü vuruş; hortlak için oyuncunun gücünü 2 saldırı boyunca %25 azaltan ürkütme), aksi hâlde normal saldırı.
- **Yetenek etkileri:** Kalkan Duruşu / Hikmet Kalkanı düşmanın sonraki N hamlesinde hasarı yarıya indirir; Yiğit Nârası (%30 güç) ve Kartal Gözü (+%25 kritik) oyuncunun sonraki 3 saldırısını etkiler.
- **Denge ölçümü (Faz 3):** Sv 1 Akıncı, Sv 1 Aç Kurt'u yalnızca saldırarak ortalama ~3,2 turda yener (500 savaşlık testle denetlenir).

### Savaş akışı
- Her turda oyuncu **Saldır / Yetenek / Yemek / Kaç** seçeneklerinden birini seçer, ardından düşman hamlesini yapar.
- Savaş günlüğü kısa, edepli ve Türkçe cümlelerle ekranda akar.
- **Bayılma** durumunda oyuncu, en son uğradığı kervansaraya (Faz 8'den önce bulunduğu ilin merkezine) döner ve akçesinin %10'unu (aşağı yuvarlanır) kaybeder. Kendine geldiğinde canı ve nefesi dolar.

---

## 6. Düşmanlar

Her bölgenin kendine özgü bir düşman havuzu vardır. İller, kendi bölgesinin havuzundan 2–3 düşman türü alır.

| Bölge | Düşmanlar | Mini boss örneği |
|---|---|---|
| Marmara | Aç Kurt, Çakal Sürüsü, Yol Kesen Cin | Gulyabani |
| Ege | Yaban Domuzu, Zeytinlik Hortlağı, Kara Cin | Çarşamba Karısı |
| Akdeniz | Akrep Sürüsü, Anadolu Parsı, Mağara İfriti | Yılan Beyi |
| İç Anadolu | Bozkır Kurdu, Peri Bacası Cini, Toz İfriti | Gölge Albastı |
| Karadeniz | Boz Ayı, Sis Cini, Orman Hortlağı | Yayla Devi |
| Güneydoğu | Çöl Akrebi, Kum İfriti, Taş Dev | Tepegöz'ün Muhafızı |
| Doğu Anadolu | Karlı Dağ Kurdu, Buz Cini, Zülmet'in Muhafızı | Tipi İfriti |

Her düşmanın bir `tur` alanı vardır: `hayvan`, `cin`, `ifrit`, `hortlak`, `dev` veya `boss`. Yetenek bonusları bu alana göre çalışır.

---

## 7. Yöresel Yemekler (Can ve Nefes İksirleri)

Her ilin meşhur yemeği, o ilde düşmanlardan düşer ve arastada satılır.

- **Can (C)** yemekleri canı yeniler. Ana yemekler bu gruptadır.
- **Nefes (N)** yemekleri nefesi yeniler. Tatlılar, içecekler, meyveler ve bal bu gruptadır.

Yemeğin gücü bölge çarpanıyla belirlenir. Can yemeklerinin taban değeri 30, nefes yemeklerinin taban değeri 15'tir.

Taban fiyat: can yemekleri 20 akçe, nefes yemekleri 15 akçe (kullanıcı kararı, Faz 1).

| Bölge | Marmara | Ege | Akdeniz | İç Anadolu | Karadeniz | Güneydoğu | Doğu |
|---|---|---|---|---|---|---|---|
| Çarpan | 1.0 | 1.5 | 2.2 | 3.0 | 4.0 | 5.0 | 6.0 |

Fiyat (akçe) da aynı çarpanla ölçeklenir. Her yemeğin kısa, bilgilendirici ve Türkçe bir açıklaması olur, örneğin: "Afyon'un meşhur manda kaymağı."

⚠ işaretli seçimler kullanıcı tarafından sonra teyit edilecek. Bu yemekler `yemekler.js` içinde tek satırdan değiştirilebilir olmalı.

### Marmara
| Plaka | İl | Yemek | Tür |
|---|---|---|---|
| 34 | İstanbul | Balık ekmek | C |
| 22 | Edirne | Tava ciğer | C |
| 39 | Kırklareli | Kırklareli köftesi ⚠ | C |
| 59 | Tekirdağ | Tekirdağ köftesi | C |
| 17 | Çanakkale | Peynir helvası | N |
| 10 | Balıkesir | Höşmerim | N |
| 16 | Bursa | İskender kebap | C |
| 11 | Bilecik | Osmaneli ayva tatlısı ⚠ | N |
| 41 | Kocaeli | Pişmaniye | N |
| 54 | Sakarya | Islama köfte | C |
| 77 | Yalova | Kaplıca suyu ⚠ | N |

### Ege
| Plaka | İl | Yemek | Tür |
|---|---|---|---|
| 35 | İzmir | Boyoz | C |
| 45 | Manisa | Mesir macunu | N |
| 09 | Aydın | İncir | N |
| 20 | Denizli | Denizli kebabı | C |
| 48 | Muğla | Çökertme kebabı | C |
| 64 | Uşak | Uşak tarhanası | C |
| 03 | Afyonkarahisar | Afyon kaymağı | N |
| 43 | Kütahya | Cimcik | C |

### Akdeniz
| Plaka | İl | Yemek | Tür |
|---|---|---|---|
| 07 | Antalya | Antalya piyazı | C |
| 15 | Burdur | Burdur şiş | C |
| 32 | Isparta | Gül şerbeti | N |
| 33 | Mersin | Tantuni | C |
| 01 | Adana | Adana kebap | C |
| 31 | Hatay | Künefe | N |
| 80 | Osmaniye | Yer fıstığı | N |
| 46 | Kahramanmaraş | Maraş dondurması | N |

### İç Anadolu
| Plaka | İl | Yemek | Tür |
|---|---|---|---|
| 06 | Ankara | Ankara tava | C |
| 42 | Konya | Etli ekmek | C |
| 38 | Kayseri | Kayseri mantısı | C |
| 58 | Sivas | Sivas köftesi | C |
| 26 | Eskişehir | Çibörek | C |
| 66 | Yozgat | Arabaşı çorbası | C |
| 71 | Kırıkkale | Uğut tatlısı ⚠ | N |
| 40 | Kırşehir | Çullama ⚠ | C |
| 50 | Nevşehir | Testi kebabı | C |
| 51 | Niğde | Niğde gazozu | N |
| 68 | Aksaray | Aksaray tandırı ⚠ | C |
| 70 | Karaman | Divle obruk peyniri | C |
| 18 | Çankırı | Ekşili köfte ⚠ | C |

### Karadeniz
| Plaka | İl | Yemek | Tür |
|---|---|---|---|
| 67 | Zonguldak | Ereğli çileği | N |
| 74 | Bartın | Amasra salatası | C |
| 78 | Karabük | Safranbolu lokumu | N |
| 81 | Düzce | Fındık ezmesi ⚠ | N |
| 14 | Bolu | Abant alabalığı | C |
| 37 | Kastamonu | Tosya pilavı | C |
| 57 | Sinop | Sinop mantısı | C |
| 55 | Samsun | Bafra pidesi | C |
| 05 | Amasya | Amasya elması | N |
| 60 | Tokat | Tokat kebabı | C |
| 19 | Çorum | Leblebi | N |
| 52 | Ordu | Fındık | N |
| 28 | Giresun | Karalahana çorbası | C |
| 61 | Trabzon | Akçaabat köftesi | C |
| 53 | Rize | Rize çayı | N |
| 08 | Artvin | Macahel balı | N |
| 29 | Gümüşhane | Gümüşhane pestili | N |
| 69 | Bayburt | Tel helva ⚠ | N |

### Güneydoğu Anadolu
| Plaka | İl | Yemek | Tür |
|---|---|---|---|
| 27 | Gaziantep | Antep baklavası | N |
| 63 | Şanlıurfa | Urfa kebabı | C |
| 21 | Diyarbakır | Kaburga dolması | C |
| 47 | Mardin | Mırra | N |
| 72 | Batman | İçli köfte | C |
| 56 | Siirt | Perde pilavı | C |
| 73 | Şırnak | Cudi balı ⚠ | N |
| 02 | Adıyaman | Adıyaman çiğ köftesi | C |
| 79 | Kilis | Kilis tava | C |

### Doğu Anadolu
| Plaka | İl | Yemek | Tür |
|---|---|---|---|
| 25 | Erzurum | Cağ kebabı | C |
| 24 | Erzincan | Tulum peyniri | C |
| 36 | Kars | Kaz eti | C |
| 75 | Ardahan | Ardahan balı | N |
| 76 | Iğdır | Bozbaş | C |
| 04 | Ağrı | Abdigör köftesi | C |
| 65 | Van | Otlu peynir | C |
| 49 | Muş | Muş çorbası ⚠ | C |
| 13 | Bitlis | Büryan kebabı | C |
| 12 | Bingöl | Bingöl balı | N |
| 23 | Elazığ | Orcik | N |
| 44 | Malatya | Malatya kayısısı | N |
| 62 | Tunceli | Munzur balı ⚠ | N |
| 30 | Hakkari | Hakkari balı ⚠ | N |

### Zafer sofrası
Bir bölge bossu yenildiğinde, o bölgenin yemeklerinden oluşan bir sofra kurulur. Sofra canı ve nefesi tamamen doldurur, ayrıca 10 savaş boyunca %10 güç bonusu verir.

---

## 8. Durum Takibi

| Faz | Başlık | Durum |
|---|---|---|
| 0 | Proje kurulumu | ✅ |
| 1 | Veri katmanı | ✅ |
| 2 | Harita ve seyahat | ✅ |
| 3 | Karakter ve savaş motoru | ✅ |
| 4 | Keşif, yemekler ve kayıt (**oynanabilir ilk sürüm**) | ✅ |
| 5 | Görsel yenileme (SVG çizimler, savaş sahnesi, il sınırlı harita) | ✅ |
| 6 | İl içi gezinti (kuşbakışı yürüme, haritada düşmanlar) | ✅ |
| 7 | Bosslar ve bölge ilerlemesi | ✅ |
| 8 | Arasta, Ahi esnafı, ekipman ve kervansaray | ✅ |
| 9 | Görevler ve itibar | ✅ |
| 10 | Final, ses, animasyon ve cila | ✅ |

Durum işaretleri: ⬜ başlanmadı · 🟨 devam ediyor · ✅ tamamlandı

---

## 9. Fazlar

### Faz 0 — Proje Kurulumu
**Hedef:** Boş ama çalışan, test edilebilen ve yayınlanabilen bir proje iskeleti.

- [x] Vite + vanilla JS projesini kur. `npm run dev`, `npm run build` ve `npm run test` komutları çalışmalı.
- [x] Vitest'i kur ve örnek bir test ekle.
- [x] Bölüm 3'teki klasör yapısını boş modüllerle oluştur.
- [x] `index.html` içine `lang="tr"`, viewport meta etiketi ve başlığı ekle. Ekranda "Seksen Bir Diyar" başlık ekranı görünsün.
- [x] `ana.css` içinde renk değişkenlerini (Bölüm 3 paleti), fontları ve temel mobil düzeni tanımla.
- [x] `vite.config.js` içinde GitHub Pages için `base` ayarını yap.
- [x] `.github/workflows/deploy.yml` ile `main` dalına her push'ta GitHub Pages'e otomatik yayın ayarla.
- [x] `README.md` yaz: oyunun kısa tanımı, kurulum ve çalıştırma komutları, plan.md'ye bağlantı.
- [x] `.gitignore` ekle.

**Kabul kriterleri:** `npm run dev` ile başlık ekranı açılıyor. Test ve build hatasız geçiyor. Telefon genişliğinde (375px) düzen bozulmuyor.

**Commit:** `Faz 0: proje kurulumu`

---

### Faz 1 — Veri Katmanı
**Hedef:** 81 ilin, bölgelerin, yemeklerin, düşmanların ve sınıfların doğrulanmış verisi.

- [x] `bolgeler.js`: 7 bölgeyi anahtar, ad, sıra, seviye aralığı, giriş ili, boss, boss ili, renk ve yemek çarpanıyla tanımla (Bölüm 4 ve 7).
- [x] `iller.js`: 81 ili Bölüm 4'teki şemayla tanımla. Plaka, ad, bölge, yaklaşık koordinat ve gerçek kara komşulukları eksiksiz olmalı.
- [x] İllerin seviye aralıklarını Bölüm 4'teki BFS kuralıyla hesaplayan bir yardımcı yaz (ya da hesaplanmış değerleri veriye yaz).
- [x] `yemekler.js`: Bölüm 7'deki 81 yemeği ad, tür (`can`/`nefes`), il plakası ve kısa açıklamayla tanımla. Güç ve fiyat bölge çarpanından hesaplansın. ⚠ işaretli yemekleri kodda `teyit: false` alanıyla işaretle.
- [x] `dusmanlar.js`: Bölüm 6'daki düşmanları anahtar, ad, tür, bölge, stat çarpanları ve kısa açıklamayla tanımla. Bölge bosslarını ve Zülmet'i de ekle.
- [x] `siniflar.js`: 3 sınıfı başlangıç statları, seviye başı artışları ve yetenekleriyle tanımla (Bölüm 5).
- [x] Veri doğrulama testlerini yaz:
  - Tam 81 il var ve plakalar 1–81 arası, tekrarsız.
  - Bölge başına il sayıları doğru (11, 8, 8, 13, 18, 9, 14).
  - Komşuluk simetrik ve çizge bağlı.
  - İstanbul ve Ankara komşu kontrolleri (Bölüm 4) geçiyor.
  - Her ilin geçerli bir yemeği ve en az 2 düşmanı var.
  - Hiçbir veride Bölüm 2'ye aykırı içerik yok. Yasaklı kelime listesiyle basit bir tarama testi yaz (ör. şarap, rakı, bira, domuz eti, kumar).

**Kabul kriterleri:** Tüm veri testleri geçiyor. Veri dosyalarında mantık kodu yok.

**Commit:** `Faz 1: veri katmanı`

---

### Faz 2 — Harita ve Seyahat
**Hedef:** Türkiye haritasında illeri görmek ve komşu iller arasında gezmek.

- [x] `durum.js`: tek bir oyun durumu nesnesi ve abonelik mekanizması kur.
- [x] `harita.js`: illeri koordinatlarına göre SVG düğümleri, komşulukları çizgiler olarak çiz.
- [x] Düğüm renklerini uygula: kilitli, açık, bulunulan il, arınmış (Bölüm 4).
- [x] Bir ile dokununca bilgi kartı açılsın: il adı, bölge, seviye aralığı, meşhur yemek, arınma yüzdesi.
- [x] Yalnızca **bulunulan ilin komşularına** ve yalnızca **açık bölgelere** gidilebilsin. Diğerleri için neden gidilemediğini açıklayan bir mesaj göster.
- [x] Başlangıçta yalnızca Marmara açık olsun, oyuncu İstanbul'da başlasın.
- [x] Mobilde parmakla kaydırma ve yakınlaştırma çalışsın.
- [x] Seyahat kurallarının testlerini yaz.

**Kabul kriterleri:** Harita Türkiye şeklini tanınır biçimde veriyor. İstanbul'dan Kocaeli'ye gidilebiliyor, Ankara'ya gidilemiyor. Telefonda rahat kullanılıyor.

**Commit:** `Faz 2: harita ve seyahat`

---

### Faz 3 — Karakter ve Savaş Motoru
**Hedef:** Sınıf seçimi ve tam çalışan sıra tabanlı savaş.

- [x] Yeni oyun ekranı: oyuncu isim girer ve 3 sınıftan birini seçer. Her sınıfın tarifi ve statları gösterilir.
- [x] `karakter.js`: stat hesapları, XP eğrisi, seviye atlama, otomatik stat artışı ve dağıtılacak stat puanları.
- [x] `savas.js`: Saldır / Yetenek / Yemek / Kaç eylemleri. Hasar, kritik, kaçınma, nefes tüketimi, düşman yapay zekâsı (basit: çoğunlukla saldırır, bazen özel hamle yapar).
- [x] Bayılma kuralını uygula (Bölüm 5).
- [x] `savasEkrani.js`: can ve nefes çubukları, eylem butonları ve savaş günlüğü.
- [x] `karakterEkrani.js`: statlar, seviye, XP çubuğu, açık yetenekler ve stat puanı dağıtma.
- [x] Seviye atlayınca kutlama bildirimi göster, yeni yetenek açıldıysa belirt.
- [x] Testleri yaz: hasar formülü, kritik, kaçma, XP eğrisi, seviye atlama, yetenek açılışı (sabit tohumla).
- [x] Dengeleme: Sv 1 bir Akıncı, Sv 1 bir Aç Kurt'u ortalama 3–5 turda yenebilmeli. Formüllerde değişiklik yaparsan Bölüm 5'i güncelle.

**Kabul kriterleri:** Üç sınıf da seçilebiliyor. Savaş baştan sona oynanabiliyor. Seviye atlama ve yetenek açılışı çalışıyor.

**Commit:** `Faz 3: karakter ve savaş motoru`

---

### Faz 4 — Keşif, Yemekler ve Kayıt (Oynanabilir İlk Sürüm)
**Hedef:** Oyunun temel döngüsünün baştan sona oynanabilmesi.

- [x] `ilEkrani.js`: bulunulan ilin ekranı. İl adı, meşhur yemek, arınma yüzdesi ve "Keşfe Çık" butonu. (Faz 6'da "Keşfe Çık" yerini ilde gezintiye bıraktı; ekran il bilgisi olarak kaldı.)
- [x] `kesif.js`: keşfe çıkınca ilin düşman havuzundan ve seviye aralığından bir düşman üret. Kazanınca arınma artsın (%8–12 arası; Faz 10 dengelemesinde %12–18 oldu). %100 olunca il arınmış sayılsın ve haritada yeşile dönsün.
- [x] Ganimet: XP, akçe ve belirli bir şansla o ilin yöresel yemeği düşsün.
- [x] `envanter.js`: heybe (20 yuva, aynı yemekler üst üste biner, en fazla 10'a kadar). Yemek kullanımı savaş içinde ve dışında çalışsın.
- [x] `envanterEkrani.js`: yemekler ikon, ad, açıklama ve etkiyle listelensin.
- [x] Başlangıç envanterine 3 balık ekmek ve 2 höşmerim ekle.
- [x] `kayit.js`: her önemli olaydan sonra (savaş sonu, seyahat, seviye atlama) otomatik kayıt. Başlık ekranında "Devam Et" ve "Yeni Oyun" seçenekleri olsun. Kayıt şemasında `surum` alanı bulunsun. localStorage erişimi try/catch içinde olsun.
- [x] Testleri yaz: arınma artışı, ganimet üretimi, heybe kuralları, kaydet/yükle döngüsü.

**Faz 4 kararları:**
- **Akçe ganimeti:** `round((3 + sv × 2) × rnd(0.8–1.2) × sınıfÇarpanı)` (sınıf çarpanı XP ile aynı).
- **Yemek düşme şansı:** her zaferde %30 ihtimalle ilin yöresel yemeği.
- **Heybe:** 20 yuva; bir yuvada aynı yemekten en fazla 10 durur, fazlası yeni yuvaya geçer. Heybe doluysa bulunan yemek alınamaz (oyuncuya söylenir).
- **Yemek yeme:** can ya da nefes zaten doluyken savaş dışında yemek yenmez (boşa gitmesin diye).
- **Kayıt:** oyun durumu her değiştiğinde otomatik kaydedilir (savaş sonu, seyahat, seviye atlama, yemek, stat puanı). Kayıt anahtarı `seksen-bir-diyar/kayit`, şema `{ surum: 1, durum }`. Bozuk ya da tanınmayan kayıt yok sayılır.
- **Akış:** Başlık → (Devam Et | Yeni Oyun) → İl ekranı. İl ekranından keşfe çıkılır; savaş bitince il ekranına dönülür. Haritadan başka ile gidilir.

**Kabul kriterleri:** Oyuncu yeni oyun başlatıp Marmara'nın illerini gezebiliyor, savaşabiliyor, yemek toplayıp kullanabiliyor, seviye atlayabiliyor. Sayfa yenilenince kaldığı yerden devam ediyor.

**Commit:** `Faz 4: keşif, yemekler ve kayıt — ilk oynanabilir sürüm`

---

### Faz 5 — Görsel Yenileme
**Hedef:** Emojiye bağlı kalmayan, tutarlı, çini paletine uygun ve telefonda akıcı bir 2D görsel dil.

Kullanıcı kararı: 3D yerine **güçlendirilmiş 2D** (SVG + CSS). Oyun mantığı (`src/oyun/`) ve veriler (`src/veri/`) bu fazdan etkilenmez; yalnızca arayüz değişir.

- [x] **Özgün SVG çizimler:** 3 sınıf ve tüm düşmanlar (bosslar dahil) için stilize, edepli SVG çizimler. Emojiler savaşçıları temsil etmez. Çizimler harici dosya değil, koddan üretilir; aynı türden yaratıklar ortak bir iskeletten türetilip renk ve ayrıntıyla ayrışabilir.
- [x] **Bölge arka planları:** 7 bölgenin her biri için katmanlı SVG savaş arka planı (ör. Marmara: Boğaz ve kıyı; İç Anadolu: bozkır ve peri bacaları; Karadeniz: sisli yayla).
- [x] **Savaş sahnesi:** oyuncu ve düşman karşı karşıya durur. Hasar sayıları, vurulanın sarsılması ve vuruş efekti. `prefers-reduced-motion` açıksa hareket azaltılır.
- [x] **Gerçek il sınırlı harita:** OpenStreetMap il sınırları sadeleştirilip SVG yollarına çevrilir, iller şekilleriyle boyanır (kilitli, açık, arınmış renkleri korunur). Seyahat kuralları ve komşuluklar değişmez. OSM atfı (© OpenStreetMap katkıcıları, ODbL) haritada ve README'de gösterilir.
- [x] Testleri yaz: her sınıf ve düşman için çizim var; her bölge için arka plan var; il sınır verisi 81 ili kapsıyor ve plakalar eşleşiyor.

**Faz 5 kararları:**
- **Sınır verisi:** OSM kaynaklı geoBoundaries (gbOpen TUR ADM1, 2023) sadeleştirilmiş sürümü, mapshaper ile komşu kenarlar korunarak %8'e indirildi (~43 KB, gzip ile ~15 KB). OSM servislerine bu ortamdan doğrudan erişilemediği için geoBoundaries'in GitHub'daki kopyası kullanıldı.
- **Çizimler:** 22 beden iskeleti; 36 düşman renk ve ayrıntıyla ayrışır. Bölge bossları ve Zülmet sihir halesiyle çizilir.
- **Savaş sahnesi:** olaylar sırayla oynatılır (vuruş ~0,5 sn); oynatma sırasında butonlar beklemeye alınır. Hareket azaltma açıkken figürler kıpırdamaz, yalnızca sayılar kısa süre görünür.
- **Arınmış il:** haritada çizgili yeşil desen (yalnızca renge dayanmaz).

**Kabul kriterleri:** Hiçbir savaşçı emojiyle gösterilmiyor. Harita il şekilleriyle tanınır biçimde Türkiye'yi veriyor. Telefon genişliğinde (375px) düzen bozulmuyor, animasyonlar akıcı.

**Commit:** `Faz 5: görsel yenileme`

---

### Faz 6 — İl İçi Gezinti
**Hedef:** Oyuncunun karakterini kendisi yürüterek illerin içinde gezmesi; düşmanlarla haritada karşılaşması.

Kullanıcı kararları: kuşbakışı görünüm; düşmanlar haritada görünür; il haritaları koddan üretilir; telefonda hem dokun-yürü hem de ekran yön tuşları (masaüstünde ok tuşları ve WASD).

- [x] `gezinti.js`: her il için sabit tohumla üretilen karo harita (her açılışta aynı). Bölgeye göre doku ve engeller (Karadeniz'de köknar ve dere, İç Anadolu'da bozkır ve peri bacaları, Güneydoğu'da kum ve kümbet evler, Doğu'da kar ve göl vb.).
- [x] Her ilde il meydanı (çeşme, ilin yemeğini satan esnaf tezgâhı, il tabelası) ve her komşu ile giden, komşunun gerçek yönüne yerleştirilmiş bir çıkış yolu. Tüm çıkışlar meydandan yürünerek erişilebilir.
- [x] Yürüme: haritaya dokununca en kısa yoldan yürüme, ekran yön tuşları, ok tuşları ve WASD. Kamera oyuncuyu izler.
- [x] Çıkış yoluna yürüyünce komşu ile geçilir (seyahat kuralları aynen geçerli; kilitli bölgenin yolu sihirli bir engelle kapalıdır). Yeni ile, geri dönen yolun ağzından girilir.
- [x] Düşmanlar ilin havuzundan ve seviye aralığından üretilip haritada dolaşır; oyuncu yaklaşınca peşine düşer, temas edince sıra tabanlı savaş başlar. Meydan güvenli bölgedir, düşmanlar giremez.
- [x] Yenilen düşman haritadan kalkar, bir süre sonra başka bir yerde yenisi belirir. Kaçınca oyuncu kısa süre dokunulmaz olur. Bayılınca il meydanında kendine gelir.
- [x] "Keşfe Çık" yerine ilde gezinti; il bilgisi tabeladan ve üst çubuktan açılır.
- [x] Testleri yaz: harita üretiminin tekrarlanabilirliği, 81 ilin tamamında çıkış sayısı ve erişilebilirliği, yol bulma, düşman yerleşimi ve hareket kuralları.

**Faz 6 kararları:**
- **Harita:** 25×31 karo; meydan 7×5 ve ortada. Doğa öbekleri bölgeye göre (`BOLGE_DOGASI`). Meydandan ulaşılamayan açık alanlar engelle doldurulur.
- **Çıkışlar:** komşunun gerçek yönündeki kenar karosuna; iki çıkış arasında en az 4 karo. Kilitli bölgeye giden yol mor sihirli engelle kapalıdır; üzerine yürüyünce oyuncu geri çekilir ve nedeni söylenir.
- **Düşmanlar:** arınmamış ilde 4, arınmış ilde 2; büyük illerde karo sayısının kareköküyle artar (Konya ≈ 10). Oyuncu görüş uzaklığına girince peşine düşer ve hemen bir adım atılır (meydandayken ya da dokunulmazken düşmez), bırakma uzaklığını aşınca yuvasına döner. Bekçiler: görüş 4, bırakma 7, hız 0,55 karo/tık; takipçiler (düşman verisinde `takipci: true`, her bölgede en az bir tür): görüş 6, bırakma 13, hız 0,85 karo/tık. Oyuncu tık başına bir karo yürür. Yenilen düşmanın yerine 25 adım sonra, oyuncudan en az 7 karo uzakta yenisi belirir. Kaçıştan sonra 4, bayılmadan sonra 8 adım dokunulmazlık.
- **İl boyutu:** karo sayısı ≈ 450 × (yüzölçümü / 800 km²)^0,6 (en az 525), en-boy oranı il sınırının kutusundan (0,7–1,4); kenarlar tektir ve büyük il hiçbir zaman küçük ilden küçük haritaya sahip olmaz. Evler ≈ bölge katkısı + √nüfus / 180, meydandaki halk √nüfus / 400 (1–10).
- **Savaş kısayol yuvaları:** dört yuva (`durum.kisayollar`, kayıt sürümü 6), içerik: Saldır, Kaç, yetenek ya da yemek. Sıra oyuncudayken 1–4 tuşlarıyla kullanılır.
- **Hız:** oyuncu karo başına 0,17 sn; düşmanlar 0,65 sn'de bir hamle.
- **Kayıt:** oyuncunun il içindeki yeri ve düşmanlar kaydedilmez; oyun yüklenince il meydanından başlanır.
- **Yön tuşları:** dokunmatik cihazlarda varsayılan açık; 🎮 düğmesiyle gizlenir (tercih cihazda saklanır).

**Kabul kriterleri:** Oyuncu İstanbul meydanından yürüyerek Kocaeli'ye geçebiliyor. Düşmanlar haritada görünüyor ve temas edince savaş başlıyor. Telefonda (375px) dokunarak ve yön tuşlarıyla rahat oynanıyor.

**Commit:** `Faz 6: il içi gezinti`

---

### Faz 7 — Bosslar ve Bölge İlerlemesi
**Hedef:** Bölgelerin sırayla açılması ve boss savaşları.

- [x] `ilerleme.js`: boss açılma koşulu şu olsun: bölgedeki illerin ortalama arınması en az %60 **ve** oyuncu seviyesi en az (bölge üst seviyesi − 1). Açılınca bildirim göster.
- [x] Boss savaşları: bosslardan kaçılamaz. Her bossun en az bir özel hamlesi ve can yarının altına düşünce güçlenme evresi olsun.
- [x] Boss yenilince sonraki bölge açılsın ve harita güncellensin. Kısa bir hikâye metni göster.
- [x] Zafer sofrasını uygula (Bölüm 7).
- [x] Her bölgeye 1–2 mini boss yerleştir (Bölüm 6). Mini bosslar ilin arınması %50'yi geçince çıksın.
- [x] Testleri yaz: boss açılma koşulu, bölge kilidi açılışı, zafer sofrası etkisi.

**Faz 7 kararları:**
- **Boss ini:** her ilin meydandan yürüyerek en uzak açık karosu. Bölge bossu, yenilene dek kendi ilinin ininde bekler; koşullar sağlanana dek mühürlüdür (yaklaşınca eksik koşullar söylenir). Mühür çözülünce bildirim gelir. Boss ve mini bosslar ininden ayrılmaz.
- **Eşik:** ortalama arınma yuvarlanmadan karşılaştırılır (%59,5 yetmez); ekranda aşağı yuvarlanmış değer gösterilir.
- **Boss savaşı:** bossların ve mini bossların kendi özel hamleleri vardır (bir güçlü vuruş, bir zayıflatma), özel hamle şansı %30. Bölge bossu canı yarının altına düşünce bir kez güçlenir: güç ×1,3, özel hamle şansı %40.
- **Mini boss illeri:** Marmara: Bursa, Edirne · Ege: Denizli, Muğla · Akdeniz: Adana, Isparta · İç Anadolu: Kayseri, Sivas · Karadeniz: Kastamonu, Rize · Güneydoğu: Diyarbakır, Mardin · Doğu Anadolu: Erzurum, Kars. Mini boss seviyesi: ilin üst seviyesi + 1.
- **Zafer sofrası:** bölgenin tüm yemeklerinden kurulur; can ve nefes dolar, sonraki 10 savaş (sonucu ne olursa olsun) boyunca güç ×1,1.
- **Denge (simülasyonla):** oyuncu mührün açıldığı seviyede, stat puanları dağıtılmış ve heybesinde bölgenin yemekleriyle; bosslar ~10–16 turda, sınıfa göre %74–98 zaferle; mini bosslar 6–20 turda %78–100 zaferle yenilir. Boss çarpanları: can 2,4 (Marmara) → 4,4 (Doğu), güç 1,05 (Van Gölü Canavarı 1,1); mini boss canı ×1,3, gücü ×1,1.
- **Kayıt:** şema sürüm 2 (`yenilenBosslar`, `yenilenMiniBosslar`, `sofra`). Sürüm 1 kayıtlar otomatik taşınır.

**Kabul kriterleri:** Marmara'dan başlayarak bölgeler sırayla açılıyor. Kilitli bölgeye erişilemiyor.

**Commit:** `Faz 7: bosslar ve bölge ilerlemesi`

---

### Faz 8 — Arasta, Ahi Esnafı, Ekipman ve Kervansaray
**Hedef:** Ekonomi, ekipman ve rahat seyahat.

- [x] **Arasta:** her ilde o ilin yöresel yemeği ve komşu illerden 1–2 yemek satılsın.
- [x] **Ahi esnafı:** silah ve zırh satan bir dükkân. Her 3–4 ilde bir, esnafın ahlakını yansıtan kısa ve samimi selamlama metinleriyle.
- [x] `esyalar.js`: sınıfa uygun silahlar (Akıncı: kılıç, Kemankeş: yay, Alperen: asa) ve zırhlar. Nadirlik seviyeleri: sıradan, nadir, efsanevi. Örnek: Sivas çakısı, Tokat yazması kuşak (zırh aksesuarı), Bursa ipeği cübbe.
- [x] Ekipman takma ve çıkarma, statlara yansıma.
- [x] Bosslar garanti efsanevi eşya düşürsün.
- [x] **Kervansaray:** bölgelerdeki belirli illerde bulunsun. Burada dinlenince can ve nefes dolsun. Bayılınca buraya dönülsün.
- [x] **Hızlı yolculuk:** arınmış illerdeki kervansaraylar arasında akçe karşılığı anında yolculuk.
- [x] Testleri yaz: alışveriş, ekipman stat etkisi, hızlı yolculuk koşulları.

**Faz 8 kararları:**
- **Eşyalar (91):** her bölgede sınıf başına bir sıradan, bir nadir ve bir efsanevi silah; bir sıradan ve bir nadir zırh; bir nadir kuşak; bir efsanevi zırh ya da kuşak. Yuvalar: silah, zırh, kuşak. Kuşanmak için bölgenin alt seviyesi gerekir. Statlar ve fiyatlar oyuncunun bölgedeki beklenen gücüne ve akçe kazancına oranlıdır (formüller `esyalar.js` başında).
- **Arasta:** meydandaki tezgâh; ilin yemeği ve komşu illerden (plaka sırasıyla) iki yemek, Bölüm 7 fiyatlarıyla.
- **Ahi esnafı (23 il):** bölgenin sıradan ve nadir eşyalarını satar, sahip olunan eşyayı yarı fiyatına geri alır (kuşanılı eşya satılmaz). Efsanevi eşya satılmaz. Her ustanın selamı Ahilik ahlakını yansıtır.
- **Ganimet:** bölge bossu bölgenin efsanevi eşyalarından, mini boss nadir eşyalarından sınıfa uygun ve sahip olunmayan birini garanti düşürür.
- **Kervansaray (17 il):** dinlenmek ücretsizdir; can ve nefes dolar, bayılınca bu kervansarayda kendine gelinir (hiç dinlenilmediyse bulunulan ilin meydanında).
- **Hızlı yolculuk:** hem bulunulan hem hedef il %100 arınmış olmalı; ücret 15 + 5 × (iller arası en kısa kara yolu). Açılmamış bölgelerin kervansarayları listede görünmez.
- **Kayıt:** şema sürüm 3 (`esyalar`, `sonKervansaray`, `oyuncu.kusanilan`); eski kayıtlar zincirleme taşınır.
- **Not:** bossların dengesi (Faz 7) ekipmansız ölçüldü; ekipmanla savaşlar kolaylaşır. Genel dengeleme Faz 10'da yapılacak.

**Kabul kriterleri:** Akçenin anlamlı bir kullanımı var. Ekipman güç farkı hissediliyor. Uzak bölgelere yürümek zorunlu değil.

**Commit:** `Faz 8: arasta, ahi esnafı, ekipman ve kervansaray`

---

### Faz 9 — Görevler ve İtibar
**Hedef:** İllere hikâye ve anlam katmak.

- [x] Görev sistemi: köy muhtarları ve Ahi Babalar görev verir. Türleri şunlar olsun: belirli düşmandan N tane yen, bir ili belirli yüzdeye kadar arındır, bir yemeği başka bir ile ulaştır.
- [x] Her bölgede en az 3 görev olsun. Görev metinleri yöreye özgü, saygılı ve sıcak olsun.
- [x] **İtibar (Hayır) puanı:** görevler ve mazluma yardım itibar kazandırır. Yüksek itibar arastada indirim ve köylülerden hediye yemek getirir.
- [x] Görev günlüğü ekranı.
- [x] Testleri yaz: görev ilerlemesi, tamamlanma, ödül ve itibar etkisi.

**Faz 9 kararları:**
- **Görev verenler:** her ilin meydanında tabelanın yanında bir muhtar, Ahi esnafı olan illerde dükkânın yanında bir Ahi Baba durur. Başlarındaki işaret: `!` alınabilir görev, `?` teslim edilecek görev, 🎁 hediye. Kişilere özel isim verilmez (yalnızca "Muhtar", "Ahi Baba"); böylece peygamber ya da sahabe isimleri hiçbir yerde geçmez.
- **Görevler (28):** her bölgede 4 görev: 2 düşman yenme, 1 arındırma, 1 ulaştırma; görevleri 2 muhtar ve 2 Ahi Baba verir (Marmara'da 3 muhtar, 1 Ahi Baba) (`src/veri/gorevler.js`). Görevler bölge açılınca alınabilir, aynı anda istenen sayıda görev yürütülebilir, her görev bir kez yapılır.
  - **Yen:** veren ilin düşman havuzundan bir tür, 3–4 tane; yalnızca görev alındıktan sonraki zaferler (herhangi bir ilde) sayılır.
  - **Arındır:** veren ilin kendisi, %70 (Tekirdağ) ya da %80; ilerleme ilin güncel arınmasıdır (görevden önce yapılan arınma da sayılır).
  - **Ulaştır:** veren kişi, görev alınınca ilinin yöresel yemeğinden birini heybeye koyar (heybe doluysa görev alınamaz); yemek bölgedeki komşu ilin muhtarına teslim edilir. Yemek yenirse ilin arastasından yenisi alınabilir.
  - Yen ve arındır görevleri verene, ulaştırma görevleri hedef ilin muhtarına teslim edilir.
- **Ödül:** veren ilin üst seviyesi `sv` olmak üzere XP = `round((5 + sv × 10) × 4)`, akçe = `round((3 + sv × 2) × 5)`; Hayır: yen 10, ulaştır 10, arındır 15.
- **Mazluma yardım:** bir ili %100 arındırmak +5, mini bossu yenmek +5, bölge bossunu yenmek +10 Hayır.
- **Unvanlar:** Yolcu (0) · Tanınan Yiğit (25; arastada %5 indirim) · Sevilen Yiğit (75; %10, hediye 1) · Halkın Yiğidi (175; %15, hediye 2) · Diyarın Kahramanı (350; %20, hediye 3). Unvan yükselince bildirim gelir. İndirim yalnızca arastadaki yemeklerdedir (Ahi esnafı fiyatları herkese aynıdır).
- **Köylülerin hediyesi:** Sevilen Yiğit ve üstü unvanda her ilin muhtarı, köylüler adına ilin yöresel yemeğinden unvana göre 1–3 tane bir kez hediye eder (şans yoktur).
- **Görev günlüğü:** gezintideki 📜 düğmesiyle açılır; itibar ve ayrıcalıklar, üstlenilen görevler (hazır olanlar önce), açık bölgelerde bekleyen görevler ve bölge bölge tamamlananlar. Harita kartında da ildeki görev verenler gösterilir.
- **Kayıt:** şema sürüm 4 (`gorevler`, `hayir`, `hediyeAlinan`); eski kayıtlar zincirleme taşınır.

**Kabul kriterleri:** Oyuncunun her bölgede savaş dışında da yapacak anlamlı işleri var.

**Commit:** `Faz 9: görevler ve itibar`

---

### Faz 10 — Final, Ses, Animasyon ve Cila
**Hedef:** Oyunu tamamlamak ve parlatmak.

- [x] **Final:** Van Gölü Canavarı yenilip seviye 48'e ulaşınca Ağrı'daki kale açılsın. Zülmet ile üç evreli final savaşı yapılsın. Ardından hikâyeyi kapatan bir bitiş sahnesi ve 81 ilin özeti gelsin.
- [x] Oyun sonrası: oyuncu kalan illeri arındırmaya devam edebilsin.
- [x] **Başarımlar:** örneğin "İlk İl Arındı", "Bir Bölge Tamam", "81 Diyar", "Sofra Ustası" (tüm yemekleri toplamak), "Yiğit" (hiç bayılmadan bir bossu yenmek).
- [x] **Ses:** Web Audio API ile sentezlenmiş sade efektler (vuruş, kritik, seviye atlama, yemek). Ses açma/kapama ayarı olsun. Müzik eklenecekse telifsiz ve geleneksel çalgı tınılı olsun.
- [x] **Animasyonlar:** seviye atlama parıltısı, harita geçişleri (hasar sayıları ve sarsılma Faz 5'te yapıldı).
- [x] Erişilebilirlik: butonlar yeterince büyük, renkler yeterince kontrastlı, sadece renkle anlam taşınmıyor.
- [x] Genel dengeleme turu. Bir bölgenin ortalama 30–60 dakikada bitmesi hedeflenir.
- [x] README'yi güncelle: ekran görüntüleri, oyun rehberi ve yayın linki.

**Faz 10 kararları:**
- **Kale:** Ağrı haritasının ininde (meydandan en uzak açık karo) Zülmet'in kalesi çizilir; Zülmet (Sv 50) kapının önünde bekler. Doğu Anadolu açılınca görünür, Van Gölü Canavarı yenilip oyuncu Sv 48 olana dek mühürlüdür (yaklaşınca eksik koşullar söylenir; mühür çözülünce bildirim gelir).
- **Üç evre:** Zülmet'in canı %66'nın altına düşünce "gölge evresine", %33'ün altına düşünce "son direnişe" geçer. Her geçişte gücü ×1,15 olur, yeni özel hamleler kullanır (özel hamle şansı %30 → %35 → %45); sahne kararır. Tek vuruşta iki eşik geçilirse doğrudan 3. evreye geçilir. Kaçılamaz.
- **Final dengesi (simülasyonla):** çarpanlar can 5,0, güç 1,1, savunma 1,25. Sv 48, stat puanları dağıtılmış, Doğu Anadolu nadir ekipmanı ve bölge yemekleriyle: Akıncı %94, Kemankeş %69, Alperen %100 zafer; 10–18 tur. Efsanevi silahla Kemankeş %75.
- **Zafer ve sonrası:** Zülmet yenilince +25 Hayır, can ve nefes dolar, bitiş sahnesi (hikâye, yolculuğun özeti, bölge bölge 81 ilin arınması) gelir. Ardından oyun sürer; bitiş sahnesi görev günlüğünden yeniden izlenebilir.
- **Başarımlar (10):** İlk Zafer, İlk İl Arındı, Bir Bölge Tamam, Yiğit, Efsanenin Sahibi, Halkın Yiğidi, Hizmet Ehli (28 görev), Sofra Ustası, Zulmete Son, 81 Diyar. Her durum değişikliğinde denetlenir, kazanılınca bildirim ve ses gelir; görev günlüğünde listelenir. **Yiğit:** bayılmalar bölge bölge sayılır; bölge bossu yenildiği anda o bölgede hiç bayılınmamışsa kazanılır. **Sofra Ustası:** heybeye en az bir kez giren yemekler "yemek defterine" yazılır.
- **Ses:** dosya yok, Web Audio ile sentez: vuruş, düşman vuruşu, kritik, sıyrılma, yetenek, yemek, seviye atlama, zafer, yenilgi, evre, başarım. Ezgili sesler Hicaz makamının ilk seslerinden, mızrap vuruşunu andıran tellerle. Gezintideki 🔊 düğmesiyle açılıp kapanır (tercih cihazda saklanır). Müzik eklenmedi.
- **Animasyonlar:** ekranlar arası yumuşak geçiş; yeni ile girince bölge ve il adı afişi; seviye atlayınca ekranı saran altın kıvılcımlar. Hareket azaltma açıkken kıvılcım ve geçişler kapanır, afiş yalnızca belirip kaybolur.
- **Erişilebilirlik:** küçük metin ve rozet renkleri ölçüldü; turkuaz ve mercan metinler için koyu tonlar kullanıldı (beyaz ya da krem üstünde ≥ 4,5:1). Etkileşimli öğeler en az 44 px. Görev durumu, başarım, arınma ve mühür renge ek olarak yazı ya da simgeyle de gösterilir.
- **Genel dengeleme (oyunu baştan sona oynayan simülasyonla):** XP eğrisi `round(30 × sv^1.35)` (önce `round(40 × sv^1.6)`; Sv 20'de bir seviye ~24 savaş sürüyordu, şimdi ~8), zafer başına arınma %12–18 (önce %8–12), Kemankeş'in seviye başı can artışı 11 (önce 9). Tahmini süre (savaş başına ~15 sn yürüme, tur başına ~3 sn; görevler, alışveriş hariç): Marmara ~39, Ege ~37, Akdeniz ~46, İç Anadolu ~56, Karadeniz ~65, Güneydoğu ~47, Doğu Anadolu ~52 dakika (ortalama ~49). Bosslar genellikle ilk denemede yenilir.
- **Kayıt:** şema sürüm 5 (`zulmetYenildi`, `basarimlar`, `toplananYemekler`, `istatistik`); eski kayıtlar zincirleme taşınır, yemek defteri heybeyle başlar.
- **Kırmızı çizgiler:** tüm veri ve metinler (görevler, başarımlar, bitiş hikâyesi dahil) yasaklı kelime testinden geçiyor ve elle gözden geçirildi.

**Kabul kriterleri:** Oyun baştan sona bitirilebiliyor. Kırmızı çizgiler (Bölüm 2) son bir kez tüm metin ve verilerde kontrol edildi.

**Commit:** `Faz 10: final, ses, animasyon ve cila`

---

## 10. Sonraki Fikirler (Kapsam Dışı)

Bu fikirler şimdilik uygulanmaz. Kullanıcı isterse yeni fazlar olarak planlanır:

- Mevsimler (Karadeniz'de kış gelince Karakoncolos gücü artar).
- İllerin tarihî ve doğal yerlerine özel keşif alanları (Kapadokya, Pamukkale, Nemrut vb.).
- Yöresel yemeklerin kısa hikâyelerini içeren bir "Sofra Defteri" koleksiyon ekranı.
- Birden fazla kayıt yuvası.
