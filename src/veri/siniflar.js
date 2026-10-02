// Oyuncu sınıfları. Yalnızca veri — mantık kodu yok.
// Oyuncunun yetenekleri sihir değildir: beceri, yiğitlik ve manevi güç (Nefes).
// baslangic: 1. seviyedeki statlar. seviyeArtisi: her seviyede otomatik gelen artış.
// Yetenek alanları (plan.md Bölüm 5):
//   seviye: açıldığı seviye, nefes: harcadığı nefes,
//   etki: 'hasar' | 'savunma' | 'sifa' | 'guclenme' | 'kritik',
//   carpan: hasar yeteneklerinde güce uygulanan çarpan,
//   deger: diğer etkilerde oran (ör. 0.4 → %40),
//   sure: 'savunma' için düşmanın kaç hamlesini, 'guclenme' ve 'kritik' için
//         oyuncunun kaç saldırısını kapsadığı,
//   ekHasarTurleri / ekHasarCarpani: belirli düşman türlerine ek hasar,
//   menzil: hasar yeteneğinin karo cinsinden erimi (verilmezse sınıfın vuruş menzili),
//   atilma: vuruştan sonra yiğit hedefinin yanına atılır,
//   vurus: hedefe art arda kaç kez vurduğu (verilmezse 1; her vuruş ayrı hesaplanır),
//   alan / alanCarpani / alanMerkezi: alan vuruşu; merkezin `alan` karo çevresindeki
//         öteki düşmanlara da `alanCarpani` ile vurur. Merkez hedeftir ('hedef'),
//         'oyuncu' ise yiğidin kendi çevresidir,
//   sersem: vurduğu (düşmeyen) düşmanı kaç tık sersemlettiği (yürüyemez, vuramaz;
//         bosslarda yarı süre),
//   sersemAlan: hedefsiz yetenekte yiğidin bu kadar karo çevresindeki düşmanları
//         `sersem` tık sersemletir,
//   arindirir: şifa yeteneği ürkme (zayıflatma) etkisini de giderir,
//   zirhDelme: hasar yeteneğinin düşman savunmasının ne kadarını yok saydığı (1 → tamamı),
//   ekSifa: etki yeteneği (ör. korunma) ayrıca canın bu oranını hemen yeniler.
// 'cosku' etkisi: sonraki `sure` saldırıda verilen hasarın `deger` oranı kadar can yenilenir.
// pasif: sınıfın her zaman açık özelliği (savas.js, catisma.js). tur:
//   'can_esigi'    → canı `esik` oranının altındayken güç `guc` oranı kadar artar,
//   'uzak_nisan'   → en az `uzaklik` karo öteye vurduğu her vuruş `hasar` oranı kadar ağır iner,
//   'zafer_nefesi' → yendiği her düşmanla en yüksek nefesinin `nefes` oranı kadar nefes yenilenir,
//   'yemek_bereketi' → yediği yemekler `yemek` oranı kadar daha çok yeniler (envanter.js).
// Savaş il haritasında, gezinti ekranında geçer (savas.js, catisma.js). Sınıfın
// `menzil` değeri vuruş erimidir: 1 yakın dövüştür (yalnızca bitişik karo), büyük
// değerler uzaktan vurur; arada ağaç, kaya ya da ev varsa görüş kapanır.
// `mermi`: uzaktan vuruşun görünüşü ('ok' | 'isik'); yakın dövüşte null.
// Değerler ilk sürüm içindir; Faz 3'te dengelenebilir.

// Uzmanlık dalı (dallar): bu seviyede her sınıf iki daldan birini seçer; seçim kalıcıdır.
// Dal alanları (hepsi isteğe bağlı; karakter.js, savas.js, catisma.js uygular):
//   statlar: en son statlara oran olarak eklenir (ör. { guc: 0.15 } → güç ×1,15),
//   kritikSansi: kritik şansına eklenir, kritikHasari: kritik çarpanına eklenir,
//   pasif: sınıf özelliğinin değerlerini değiştirir (ör. Gözü Pek'te { guc: 0.35 }),
//   korunma: korunma (savunma) yeteneklerinin değerine eklenir (en çok 0,9),
//   sifaCarpani: şifa, ek şifa ve coşkunun yenilediği can bu oranda artar,
//   alanCarpani: alan vuruşunun ek hedeflere vuruşu bu oranda ağırlaşır,
//   ekHasar: { turler, carpan } → bu türlerdeki düşmanlara her vuruş bu çarpanla iner.
export const DAL_SEVIYESI = 20;

// Yoldaş (yoldas): bu seviyede her sınıfa bir yoldaş katılır; haritada yiğidin peşinden
// gelir ve savaşta kendi bekleme süresiyle (düşman tıkı) yardım eder (catisma.js).
//   eylem: 'vurus'  → yiğidin hedefine (yoksa en yakın saldırgana) `menzil` karo içinde vurur,
//          'alan'   → yiğidin `menzil` karo çevresindeki bütün saldırganlara vurur,
//          'sersem' → yiğidin `menzil` karo çevresindeki en yakın saldırgana vurur, `sersem` tık sersemletir,
//          'sifa'   → savaşta yiğidin canını `can`, can yerindeyse nefesini `nefes` oranında yeniler.
//   carpan: vuruşun yiğidin gücüne çarpanı, bekleme: iki yardım arası (tık), ucar: haritada uçar.
export const YOLDAS_SEVIYESI = 8;

export const STAT_PUANI_SEVIYE_BASI = 3;

// Dağıtılan bir stat puanının statı ne kadar artırdığı.
export const STAT_PUANI_DEGERI = { can: 5, nefes: 3, guc: 1, savunma: 1, ceviklik: 1 };

export const siniflar = {
  akinci: {
    ad: 'Akıncı',
    ikon: '⚔️',
    tarif: 'Kılıçlı öncü süvari. Dayanıklıdır, ön safta göğüs gerer; yakından vurur.',
    menzil: 1,
    mermi: null,
    dallar: {
      serdengecti: { ad: 'Serdengeçti', ikon: '🔥', tarif: 'Gözünü budaktan sakınmayan öncü; yalnızca saldırmayı bilir.', statlar: { guc: 0.15 }, kritikSansi: 0.05, pasif: { guc: 0.35 } },
      sipahi: { ad: 'Sipahi', ikon: '🛡️', tarif: 'Zırhlı atlı; dayanıklılığıyla cepheyi tutar, kolay kolay sarsılmaz.', statlar: { savunma: 0.2, can: 0.1 }, korunma: 0.15 },
    },
    yoldas: { anahtar: 'at', ad: 'Kırat', tur: 'At', eylem: 'alan', menzil: 1, carpan: 0.45, bekleme: 12, tarif: 'Akıncının sadık atı; yiğidin yanı başına sokulan düşmanlara çifte atar.' },
    pasif: { anahtar: 'gozu_pek', ad: 'Gözü Pek', tur: 'can_esigi', esik: 0.35, guc: 0.2, aciklama: 'Canı %35\'in altına düşünce yılmaz, daha da hırslanır: gücü %20 artar.' },
    baslangic: { can: 120, nefes: 30, guc: 12, savunma: 10, ceviklik: 6 },
    seviyeArtisi: { can: 12, nefes: 3, guc: 2, savunma: 2, ceviklik: 1 },
    yetenekler: [
      { anahtar: 'kilic_darbesi', ad: 'Kılıç Darbesi', seviye: 1, nefes: 5, etki: 'hasar', carpan: 1.4, aciklama: 'Güçlü ve isabetli bir kılıç darbesi.' },
      { anahtar: 'kalkan_durusu', ad: 'Kalkan Duruşu', seviye: 5, nefes: 8, etki: 'savunma', deger: 0.5, sure: 2, aciklama: 'Kalkanını kaldırır, düşmanın sonraki iki hamlesinde alınan hasarı yarıya indirir.' },
      { anahtar: 'akin_hamlesi', ad: 'Akın Hamlesi', seviye: 12, nefes: 12, etki: 'hasar', carpan: 2.0, menzil: 3, atilma: true, sersem: 6, aciklama: 'Atını mahmuzlayıp üç karo öteden düşmanın üzerine yıldırım gibi atılır; çarptığı düşman bir an sersemler.' },
      { anahtar: 'yigit_narasi', ad: 'Yiğit Nârası', seviye: 20, nefes: 15, etki: 'guclenme', deger: 0.3, sure: 3, sersemAlan: 2, sersem: 4, aciklama: 'Gür bir nâra atar; sonraki üç saldırısında gücü artar, iki karo çevresindeki düşmanlar sinip bir an duraksar.' },
      { anahtar: 'tufan_kilici', ad: 'Tufan Kılıcı', seviye: 32, nefes: 25, etki: 'hasar', carpan: 3.0, alan: 1, alanMerkezi: 'oyuncu', alanCarpani: 1.8, aciklama: 'Ardı ardına inen, durdurulamaz kılıç darbeleri; yanı başındaki bütün düşmanlar da nasibini alır.' },
      { anahtar: 'kalkan_savurusu', ad: 'Kalkan Savuruşu', seviye: 38, nefes: 22, etki: 'hasar', carpan: 1.6, alan: 1, alanMerkezi: 'oyuncu', alanCarpani: 1.6, sersem: 5, aciklama: 'Kalkanını çevresinde savurur; yanı başındaki bütün düşmanları vurup sersemletir.' },
      { anahtar: 'akin_coskusu', ad: 'Akın Coşkusu', seviye: 45, nefes: 24, etki: 'cosku', deger: 0.35, sure: 4, aciklama: 'Akının coşkusu damarlarını sarar; sonraki dört saldırısında verdiği hasarın üçte biri kadar canı yerine gelir.' },
    ],
  },
  kemankes: {
    ad: 'Kemankeş',
    ikon: '🏹',
    tarif: 'Osmanlı okçusu. Çevik ve isabetlidir, beş karo öteden ok atar.',
    menzil: 5,
    mermi: 'ok',
    dallar: {
      nisanci: { ad: 'Nişancı', ikon: '🎯', tarif: 'Tek oku tek düşmana; uzaktan, sessiz ve ölümcül.', statlar: { ceviklik: 0.1 }, kritikHasari: 0.25, pasif: { hasar: 0.3 } },
      avci: { ad: 'Avcı', ikon: '🐺', tarif: 'Sürülerle boğuşmaya alışık dağ avcısı; okları kalabalığa yağar.', statlar: { can: 0.1 }, alanCarpani: 0.3, ekHasar: { turler: ['hayvan'], carpan: 1.25 } },
    },
    yoldas: { anahtar: 'dogan', ad: 'Tuğrul', tur: 'Doğan', eylem: 'vurus', menzil: 6, carpan: 0.7, bekleme: 14, ucar: true, tarif: 'Gökten süzülen doğan; altı karo içindeki hedefe pençeleriyle dalar.' },
    pasif: { anahtar: 'uzak_nisan', ad: 'Uzak Nişan', tur: 'uzak_nisan', uzaklik: 3, hasar: 0.15, aciklama: 'Üç karo ve daha uzaktaki düşmana attığı oklar %15 daha ağır iner.' },
    baslangic: { can: 90, nefes: 40, guc: 11, savunma: 6, ceviklik: 12 },
    seviyeArtisi: { can: 11, nefes: 4, guc: 2, savunma: 1, ceviklik: 2 },
    yetenekler: [
      { anahtar: 'nisan_oku', ad: 'Nişan Oku', seviye: 1, nefes: 5, etki: 'hasar', carpan: 1.4, aciklama: 'Dikkatle nişan alınmış tek bir ok.' },
      { anahtar: 'cifte_ok', ad: 'Çifte Ok', seviye: 5, nefes: 9, etki: 'hasar', carpan: 1.0, vurus: 2, aciklama: 'Yayından iki ok birden fırlatır; her ok ayrı vurur, ayrı kritik olabilir.' },
      { anahtar: 'ok_yagmuru', ad: 'Ok Yağmuru', seviye: 12, nefes: 14, etki: 'hasar', carpan: 2.0, alan: 1, alanCarpani: 1.2, aciklama: 'Hedefin üzerine ok yağdırır; bir karo çevresindeki düşmanlar da oklardan nasibini alır.' },
      { anahtar: 'kartal_gozu', ad: 'Kartal Gözü', seviye: 20, nefes: 15, etki: 'kritik', deger: 0.25, sure: 3, aciklama: 'Kartal gibi keskin bakar; sonraki üç saldırısında kritik vuruş şansı artar.' },
      { anahtar: 'menzil_atisi', ad: 'Menzil Atışı', seviye: 32, nefes: 25, etki: 'hasar', carpan: 3.0, menzil: 7, sersem: 8, aciklama: 'Kemankeşlerin efsanevi uzun menzil atışı: yedi karo öteyi vurur; oku yiyen düşman bir süre yerinden kıpırdayamaz.' },
      { anahtar: 'yaylim_atesi', ad: 'Yaylım Ateşi', seviye: 38, nefes: 22, etki: 'hasar', carpan: 1.8, alan: 2, alanCarpani: 1.4, aciklama: 'Göğü oklarla doldurur; hedefin iki karo çevresindeki bütün düşmanlar okların altında kalır.' },
      { anahtar: 'delici_ok', ad: 'Delici Ok', seviye: 45, nefes: 28, etki: 'hasar', carpan: 2.8, menzil: 6, zirhDelme: 1, aciklama: 'Çelik temrenli ağır bir ok: altı karo öteyi vurur, zırhı deler; düşmanın savunması işe yaramaz.' },
    ],
  },
  alperen: {
    ad: 'Alperen',
    ikon: '🌿',
    tarif: 'Gazi-derviş geleneğinden gelir. Uzun asası ve manevi gücüyle (Nefes) iki karo öteye erişir, iyileşir.',
    menzil: 2,
    mermi: 'isik',
    dallar: {
      dervis: { ad: 'Derviş', ikon: '🌿', tarif: 'Gönül ehli bir yolcu; sabrı ve sükûnetiyle dayanır, çabuk toparlanır.', statlar: { nefes: 0.2 }, sifaCarpani: 0.3, pasif: { nefes: 0.18 } },
      gazi: { ad: 'Gazi', ikon: '⚔️', tarif: 'Asasını silah gibi kullanan yiğit; zalim cinlerin ve ifritlerin korkulu rüyası.', statlar: { guc: 0.15, savunma: 0.1 }, ekHasar: { turler: ['cin', 'ifrit'], carpan: 1.2 } },
    },
    yoldas: { anahtar: 'murit', ad: 'Kemal', tur: 'Mürit', eylem: 'sifa', can: 0.05, nefes: 0.08, bekleme: 18, tarif: 'Genç bir mürit; savaşta yiğidin yarasını sarar, yorulunca su verir.' },
    pasif: { anahtar: 'gonul_gucu', ad: 'Gönül Gücü', tur: 'zafer_nefesi', nefes: 0.1, aciklama: 'Yendiği her düşmanla gönlü ferahlar; nefesinin %10\'u yenilenir.' },
    baslangic: { can: 85, nefes: 70, guc: 9, savunma: 7, ceviklik: 8 },
    seviyeArtisi: { can: 8, nefes: 7, guc: 2, savunma: 1, ceviklik: 1 },
    yetenekler: [
      { anahtar: 'asa_darbesi', ad: 'Asa Darbesi', seviye: 1, nefes: 5, etki: 'hasar', carpan: 1.4, aciklama: 'Sağlam meşe asasıyla indirilen bir darbe.' },
      { anahtar: 'sifa_nefesi', ad: 'Şifa Nefesi', seviye: 5, nefes: 12, etki: 'sifa', deger: 0.35, aciklama: 'Derin bir nefesle toparlanır; canının bir kısmını yeniler.' },
      { anahtar: 'hikmet_kalkani', ad: 'Hikmet Kalkanı', seviye: 12, nefes: 14, etki: 'savunma', deger: 0.5, sure: 3, aciklama: 'Sükûnetini korur; düşmanın sonraki üç hamlesinde alınan hasar yarıya iner.' },
      { anahtar: 'arinma_isigi', ad: 'Arınma Işığı', seviye: 20, nefes: 18, etki: 'hasar', carpan: 2.2, menzil: 4, ekHasarTurleri: ['cin', 'ifrit'], ekHasarCarpani: 1.5, alan: 1, alanCarpani: 1.1, aciklama: 'Gönlündeki aydınlık dört karo öteye uzanır ve hedefin çevresine yayılır; zalim cinleri ve ifritleri sarsar, onlara ek hasar verir.' },
      { anahtar: 'gonul_dirligi', ad: 'Gönül Dirliği', seviye: 32, nefes: 25, etki: 'sifa', deger: 0.7, arindirir: true, aciklama: 'Gönül huzuruyla toparlanır; canının büyük kısmını yeniler, ürküntüsünü de giderir.' },
      { anahtar: 'isik_cemberi', ad: 'Işık Çemberi', seviye: 38, nefes: 24, etki: 'hasar', carpan: 1.8, alan: 2, alanMerkezi: 'oyuncu', alanCarpani: 1.5, ekHasarTurleri: ['cin', 'ifrit'], ekHasarCarpani: 1.5, aciklama: 'Çevresine aydınlıktan bir çember yayar; iki karo içindeki bütün düşmanları sarsar, cinlere ve ifritlere ek hasar verir.' },
      { anahtar: 'cinar_sukuneti', ad: 'Çınar Sükûneti', seviye: 45, nefes: 28, etki: 'savunma', deger: 0.6, sure: 4, ekSifa: 0.3, aciklama: 'Ulu bir çınar gibi kök salar; canının bir kısmını hemen yeniler, düşmanın sonraki dört hamlesinde alınan hasar çok azalır.' },
    ],
  },
  baci: {
    ad: 'Bacı',
    ikon: '🪢',
    varsayilanAd: 'Fatma', // ad boş bırakılırsa (Fatma Bacı'nın anısına)
    tarif: 'Bacıyân-ı Rûm\'dan, Ahi ocağında yetişmiş bir yiğit kadın. Sapanıyla üç karo öteyi vurur, düşmanı sersemletir; azığını iyi bilir.',
    menzil: 3,
    mermi: 'tas',
    dallar: {
      sapanci: { ad: 'Sapancı', ikon: '🪨', tarif: 'Taşı kıl payı şaşmaz; Bacıyân\'ın en keskin gözlüsü.', statlar: { guc: 0.1, ceviklik: 0.1 }, kritikHasari: 0.2 },
      sifaci: { ad: 'Şifacı', ikon: '🌼', tarif: 'Otları, merhemleri, şifalı aşları bilir; kendine de yoldaşına da derman olur.', statlar: { can: 0.15 }, sifaCarpani: 0.3, pasif: { yemek: 0.6 } },
    },
    yoldas: { anahtar: 'kangal', ad: 'Karabaş', tur: 'Kangal', eylem: 'sersem', menzil: 1, carpan: 0.5, sersem: 3, bekleme: 12, tarif: 'Sivas kangalı; Bacıya sokulan düşmanı ısırıp bir an yerine çakar.' },
    pasif: { anahtar: 'bereket', ad: 'Bereket', tur: 'yemek_bereketi', yemek: 0.3, aciklama: 'Ahi ocağında yetişmiştir; yediği her yemek %30 daha çok yeniler.' },
    baslangic: { can: 100, nefes: 50, guc: 10, savunma: 8, ceviklik: 10 },
    seviyeArtisi: { can: 10, nefes: 5, guc: 2, savunma: 1, ceviklik: 2 },
    yetenekler: [
      { anahtar: 'tas_atisi', ad: 'Taş Atışı', seviye: 1, nefes: 5, etki: 'hasar', carpan: 1.4, aciklama: 'Sapanını döndürüp sert bir taş savurur.' },
      { anahtar: 'sersemleten_tas', ad: 'Sersemleten Taş', seviye: 5, nefes: 8, etki: 'hasar', carpan: 1.2, sersem: 5, aciklama: 'Taşı alnın ortasına isabet ettirir; düşman bir an sersemler.' },
      { anahtar: 'uclu_tas', ad: 'Üçlü Taş', seviye: 12, nefes: 13, etki: 'hasar', carpan: 0.65, vurus: 3, aciklama: 'Sapana üç taş birden koyar; her taş ayrı vurur.' },
      { anahtar: 'ocak_sicakligi', ad: 'Ocak Sıcaklığı', seviye: 20, nefes: 15, etki: 'sifa', deger: 0.3, arindirir: true, aciklama: 'Ocak başındaki sıcaklığı hatırlar; canının bir kısmını yeniler, ürküntüsünü giderir.' },
      { anahtar: 'kement', ad: 'Kement', seviye: 32, nefes: 22, etki: 'hasar', carpan: 1.6, menzil: 4, sersem: 10, aciklama: 'Kementini dört karo öteye fırlatır; dolanan düşman uzun süre yerinden kıpırdayamaz.' },
      { anahtar: 'tas_firtinasi', ad: 'Taş Fırtınası', seviye: 38, nefes: 22, etki: 'hasar', carpan: 1.8, alan: 2, alanCarpani: 1.4, sersem: 3, aciklama: 'Taşları dolu gibi yağdırır; hedefin iki karo çevresindekiler de vurulup bir an sersemler.' },
      { anahtar: 'bacilarin_sancagi', ad: 'Bacıların Sancağı', seviye: 45, nefes: 26, etki: 'guclenme', deger: 0.35, sure: 4, ekSifa: 0.2, aciklama: 'Bacıyân sancağını açar; canının bir kısmı yerine gelir, sonraki dört saldırısında gücü artar.' },
    ],
  },
};
