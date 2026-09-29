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
│  │  ├─ envanter.js         # heybe, yemek kullanma, ekipman
│  │  ├─ ilerleme.js         # bölge kilitleri, boss koşulları
│  │  └─ kayit.js            # kaydet / yükle / şema göçü
│  ├─ veri/                  # SADECE VERİ — mantık yok
│  │  ├─ iller.js
│  │  ├─ bolgeler.js
│  │  ├─ yemekler.js
│  │  ├─ dusmanlar.js
│  │  ├─ siniflar.js
│  │  ├─ esyalar.js
│  │  └─ metinler.js         # arayüz metinleri tek yerde
│  ├─ arayuz/
│  │  ├─ harita.js
│  │  ├─ ilEkrani.js
│  │  ├─ savasEkrani.js
│  │  ├─ karakterEkrani.js
│  │  ├─ envanterEkrani.js
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
- Karakter ve düşmanlar sade SVG ikonlar veya emoji ile temsil edilir. İnsan figürleri edepli ve stilize olur.

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
| 5 | Karadeniz | 18 | 28–40 | Bolu (14) | Karakoncolos | Trabzon (61) |
| 6 | Güneydoğu | 9 | 35–45 | Gaziantep (27) | Tepegöz | Şanlıurfa (63) |
| 7 | Doğu Anadolu | 14 | 42–50 | Malatya (44) | Van Gölü Canavarı | Van (65) |
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
- Her il bir düğüm, her komşuluk bir çizgi olarak çizilir.
- Düğüm renkleri: kilitli (gri), açık (bölge rengi), bulunulan il (altın halka), %100 arınmış (yeşil).
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
Bu formüller ilk sürüm içindir. Faz 3'te dengeleme yapılabilir, değişiklik olursa bu dosyaya da yazılır.

- **Gereken XP:** `round(40 × sv^1.6)`
- **Hasar:** `max(1, round(güç × rnd(0.9–1.1) − savunma × 0.5))`
- **Kritik şansı:** `min(30%, çeviklik × 0.8%)`. Kritik vuruş ×1.5 hasar verir.
- **Kaçma şansı:** `min(80%, 40% + (oyuncuÇev − düşmanÇev) × 2%)`. Bosslardan kaçılamaz.
- **Düşman statları:** seviye ve tür çarpanıyla ölçeklenir, örneğin `can = (20 + sv × 12) × türÇarpanı`.

### Savaş akışı
- Her turda oyuncu **Saldır / Yetenek / Yemek / Kaç** seçeneklerinden birini seçer, ardından düşman hamlesini yapar.
- Savaş günlüğü kısa, edepli ve Türkçe cümlelerle ekranda akar.
- **Bayılma** durumunda oyuncu, en son uğradığı kervansaraya (Faz 6'dan önce il merkezine) döner ve akçesinin %10'unu kaybeder.

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
| 2 | Harita ve seyahat | ⬜ |
| 3 | Karakter ve savaş motoru | ⬜ |
| 4 | Keşif, yemekler ve kayıt (**oynanabilir ilk sürüm**) | ⬜ |
| 5 | Bosslar ve bölge ilerlemesi | ⬜ |
| 6 | Arasta, Ahi esnafı, ekipman ve kervansaray | ⬜ |
| 7 | Görevler ve itibar | ⬜ |
| 8 | Final, ses, animasyon ve cila | ⬜ |

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

- [ ] `durum.js`: tek bir oyun durumu nesnesi ve abonelik mekanizması kur.
- [ ] `harita.js`: illeri koordinatlarına göre SVG düğümleri, komşulukları çizgiler olarak çiz.
- [ ] Düğüm renklerini uygula: kilitli, açık, bulunulan il, arınmış (Bölüm 4).
- [ ] Bir ile dokununca bilgi kartı açılsın: il adı, bölge, seviye aralığı, meşhur yemek, arınma yüzdesi.
- [ ] Yalnızca **bulunulan ilin komşularına** ve yalnızca **açık bölgelere** gidilebilsin. Diğerleri için neden gidilemediğini açıklayan bir mesaj göster.
- [ ] Başlangıçta yalnızca Marmara açık olsun, oyuncu İstanbul'da başlasın.
- [ ] Mobilde parmakla kaydırma ve yakınlaştırma çalışsın.
- [ ] Seyahat kurallarının testlerini yaz.

**Kabul kriterleri:** Harita Türkiye şeklini tanınır biçimde veriyor. İstanbul'dan Kocaeli'ye gidilebiliyor, Ankara'ya gidilemiyor. Telefonda rahat kullanılıyor.

**Commit:** `Faz 2: harita ve seyahat`

---

### Faz 3 — Karakter ve Savaş Motoru
**Hedef:** Sınıf seçimi ve tam çalışan sıra tabanlı savaş.

- [ ] Yeni oyun ekranı: oyuncu isim girer ve 3 sınıftan birini seçer. Her sınıfın tarifi ve statları gösterilir.
- [ ] `karakter.js`: stat hesapları, XP eğrisi, seviye atlama, otomatik stat artışı ve dağıtılacak stat puanları.
- [ ] `savas.js`: Saldır / Yetenek / Yemek / Kaç eylemleri. Hasar, kritik, kaçınma, nefes tüketimi, düşman yapay zekâsı (basit: çoğunlukla saldırır, bazen özel hamle yapar).
- [ ] Bayılma kuralını uygula (Bölüm 5).
- [ ] `savasEkrani.js`: can ve nefes çubukları, eylem butonları ve savaş günlüğü.
- [ ] `karakterEkrani.js`: statlar, seviye, XP çubuğu, açık yetenekler ve stat puanı dağıtma.
- [ ] Seviye atlayınca kutlama bildirimi göster, yeni yetenek açıldıysa belirt.
- [ ] Testleri yaz: hasar formülü, kritik, kaçma, XP eğrisi, seviye atlama, yetenek açılışı (sabit tohumla).
- [ ] Dengeleme: Sv 1 bir Akıncı, Sv 1 bir Aç Kurt'u ortalama 3–5 turda yenebilmeli. Formüllerde değişiklik yaparsan Bölüm 5'i güncelle.

**Kabul kriterleri:** Üç sınıf da seçilebiliyor. Savaş baştan sona oynanabiliyor. Seviye atlama ve yetenek açılışı çalışıyor.

**Commit:** `Faz 3: karakter ve savaş motoru`

---

### Faz 4 — Keşif, Yemekler ve Kayıt (Oynanabilir İlk Sürüm)
**Hedef:** Oyunun temel döngüsünün baştan sona oynanabilmesi.

- [ ] `ilEkrani.js`: bulunulan ilin ekranı. İl adı, meşhur yemek, arınma yüzdesi ve "Keşfe Çık" butonu.
- [ ] `kesif.js`: keşfe çıkınca ilin düşman havuzundan ve seviye aralığından bir düşman üret. Kazanınca arınma artsın (%8–12 arası). %100 olunca il arınmış sayılsın ve haritada yeşile dönsün.
- [ ] Ganimet: XP, akçe ve belirli bir şansla o ilin yöresel yemeği düşsün.
- [ ] `envanter.js`: heybe (20 yuva, aynı yemekler üst üste biner, en fazla 10'a kadar). Yemek kullanımı savaş içinde ve dışında çalışsın.
- [ ] `envanterEkrani.js`: yemekler ikon, ad, açıklama ve etkiyle listelensin.
- [ ] Başlangıç envanterine 3 balık ekmek ve 2 höşmerim ekle.
- [ ] `kayit.js`: her önemli olaydan sonra (savaş sonu, seyahat, seviye atlama) otomatik kayıt. Başlık ekranında "Devam Et" ve "Yeni Oyun" seçenekleri olsun. Kayıt şemasında `surum` alanı bulunsun. localStorage erişimi try/catch içinde olsun.
- [ ] Testleri yaz: arınma artışı, ganimet üretimi, heybe kuralları, kaydet/yükle döngüsü.

**Kabul kriterleri:** Oyuncu yeni oyun başlatıp Marmara'nın illerini gezebiliyor, savaşabiliyor, yemek toplayıp kullanabiliyor, seviye atlayabiliyor. Sayfa yenilenince kaldığı yerden devam ediyor.

**Commit:** `Faz 4: keşif, yemekler ve kayıt — ilk oynanabilir sürüm`

---

### Faz 5 — Bosslar ve Bölge İlerlemesi
**Hedef:** Bölgelerin sırayla açılması ve boss savaşları.

- [ ] `ilerleme.js`: boss açılma koşulu şu olsun: bölgedeki illerin ortalama arınması en az %60 **ve** oyuncu seviyesi en az (bölge üst seviyesi − 1). Açılınca bildirim göster.
- [ ] Boss savaşları: bosslardan kaçılamaz. Her bossun en az bir özel hamlesi ve can yarının altına düşünce güçlenme evresi olsun.
- [ ] Boss yenilince sonraki bölge açılsın ve harita güncellensin. Kısa bir hikâye metni göster.
- [ ] Zafer sofrasını uygula (Bölüm 7).
- [ ] Her bölgeye 1–2 mini boss yerleştir (Bölüm 6). Mini bosslar ilin arınması %50'yi geçince çıksın.
- [ ] Testleri yaz: boss açılma koşulu, bölge kilidi açılışı, zafer sofrası etkisi.

**Kabul kriterleri:** Marmara'dan başlayarak bölgeler sırayla açılıyor. Kilitli bölgeye erişilemiyor.

**Commit:** `Faz 5: bosslar ve bölge ilerlemesi`

---

### Faz 6 — Arasta, Ahi Esnafı, Ekipman ve Kervansaray
**Hedef:** Ekonomi, ekipman ve rahat seyahat.

- [ ] **Arasta:** her ilde o ilin yöresel yemeği ve komşu illerden 1–2 yemek satılsın.
- [ ] **Ahi esnafı:** silah ve zırh satan bir dükkân. Her 3–4 ilde bir, esnafın ahlakını yansıtan kısa ve samimi selamlama metinleriyle.
- [ ] `esyalar.js`: sınıfa uygun silahlar (Akıncı: kılıç, Kemankeş: yay, Alperen: asa) ve zırhlar. Nadirlik seviyeleri: sıradan, nadir, efsanevi. Örnek: Sivas çakısı, Tokat yazması kuşak (zırh aksesuarı), Bursa ipeği cübbe.
- [ ] Ekipman takma ve çıkarma, statlara yansıma.
- [ ] Bosslar garanti efsanevi eşya düşürsün.
- [ ] **Kervansaray:** bölgelerdeki belirli illerde bulunsun. Burada dinlenince can ve nefes dolsun. Bayılınca buraya dönülsün.
- [ ] **Hızlı yolculuk:** arınmış illerdeki kervansaraylar arasında akçe karşılığı anında yolculuk.
- [ ] Testleri yaz: alışveriş, ekipman stat etkisi, hızlı yolculuk koşulları.

**Kabul kriterleri:** Akçenin anlamlı bir kullanımı var. Ekipman güç farkı hissediliyor. Uzak bölgelere yürümek zorunlu değil.

**Commit:** `Faz 6: arasta, ahi esnafı, ekipman ve kervansaray`

---

### Faz 7 — Görevler ve İtibar
**Hedef:** İllere hikâye ve anlam katmak.

- [ ] Görev sistemi: köy muhtarları ve Ahi Babalar görev verir. Türleri şunlar olsun: belirli düşmandan N tane yen, bir ili belirli yüzdeye kadar arındır, bir yemeği başka bir ile ulaştır.
- [ ] Her bölgede en az 3 görev olsun. Görev metinleri yöreye özgü, saygılı ve sıcak olsun.
- [ ] **İtibar (Hayır) puanı:** görevler ve mazluma yardım itibar kazandırır. Yüksek itibar arastada indirim ve köylülerden hediye yemek getirir.
- [ ] Görev günlüğü ekranı.
- [ ] Testleri yaz: görev ilerlemesi, tamamlanma, ödül ve itibar etkisi.

**Kabul kriterleri:** Oyuncunun her bölgede savaş dışında da yapacak anlamlı işleri var.

**Commit:** `Faz 7: görevler ve itibar`

---

### Faz 8 — Final, Ses, Animasyon ve Cila
**Hedef:** Oyunu tamamlamak ve parlatmak.

- [ ] **Final:** Van Gölü Canavarı yenilip seviye 48'e ulaşınca Ağrı'daki kale açılsın. Zülmet ile üç evreli final savaşı yapılsın. Ardından hikâyeyi kapatan bir bitiş sahnesi ve 81 ilin özeti gelsin.
- [ ] Oyun sonrası: oyuncu kalan illeri arındırmaya devam edebilsin.
- [ ] **Başarımlar:** örneğin "İlk İl Arındı", "Bir Bölge Tamam", "81 Diyar", "Sofra Ustası" (tüm yemekleri toplamak), "Yiğit" (hiç bayılmadan bir bossu yenmek).
- [ ] **Ses:** Web Audio API ile sentezlenmiş sade efektler (vuruş, kritik, seviye atlama, yemek). Ses açma/kapama ayarı olsun. Müzik eklenecekse telifsiz ve geleneksel çalgı tınılı olsun.
- [ ] **Animasyonlar:** hasar sayıları, düşmanın sarsılması, seviye atlama parıltısı, harita geçişleri.
- [ ] Erişilebilirlik: butonlar yeterince büyük, renkler yeterince kontrastlı, sadece renkle anlam taşınmıyor.
- [ ] Genel dengeleme turu. Bir bölgenin ortalama 30–60 dakikada bitmesi hedeflenir.
- [ ] README'yi güncelle: ekran görüntüleri, oyun rehberi ve yayın linki.

**Kabul kriterleri:** Oyun baştan sona bitirilebiliyor. Kırmızı çizgiler (Bölüm 2) son bir kez tüm metin ve verilerde kontrol edildi.

**Commit:** `Faz 8: final, ses, animasyon ve cila`

---

## 10. Sonraki Fikirler (Kapsam Dışı)

Bu fikirler şimdilik uygulanmaz. Kullanıcı isterse yeni fazlar olarak planlanır:

- Mevsimler (Karadeniz'de kış gelince Karakoncolos gücü artar).
- İllerin tarihî ve doğal yerlerine özel keşif alanları (Kapadokya, Pamukkale, Nemrut vb.).
- Yöresel yemeklerin kısa hikâyelerini içeren bir "Sofra Defteri" koleksiyon ekranı.
- Birden fazla kayıt yuvası.
