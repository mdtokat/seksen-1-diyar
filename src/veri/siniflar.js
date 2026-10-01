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
//   arindirir: şifa yeteneği ürkme (zayıflatma) etkisini de giderir.
// Savaş il haritasında, gezinti ekranında geçer (savas.js, catisma.js). Sınıfın
// `menzil` değeri vuruş erimidir: 1 yakın dövüştür (yalnızca bitişik karo), büyük
// değerler uzaktan vurur; arada ağaç, kaya ya da ev varsa görüş kapanır.
// `mermi`: uzaktan vuruşun görünüşü ('ok' | 'isik'); yakın dövüşte null.
// Değerler ilk sürüm içindir; Faz 3'te dengelenebilir.

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
    baslangic: { can: 120, nefes: 30, guc: 12, savunma: 10, ceviklik: 6 },
    seviyeArtisi: { can: 12, nefes: 3, guc: 2, savunma: 2, ceviklik: 1 },
    yetenekler: [
      { anahtar: 'kilic_darbesi', ad: 'Kılıç Darbesi', seviye: 1, nefes: 5, etki: 'hasar', carpan: 1.4, aciklama: 'Güçlü ve isabetli bir kılıç darbesi.' },
      { anahtar: 'kalkan_durusu', ad: 'Kalkan Duruşu', seviye: 5, nefes: 8, etki: 'savunma', deger: 0.5, sure: 2, aciklama: 'Kalkanını kaldırır, düşmanın sonraki iki hamlesinde alınan hasarı yarıya indirir.' },
      { anahtar: 'akin_hamlesi', ad: 'Akın Hamlesi', seviye: 12, nefes: 12, etki: 'hasar', carpan: 2.0, menzil: 3, atilma: true, sersem: 6, aciklama: 'Atını mahmuzlayıp üç karo öteden düşmanın üzerine yıldırım gibi atılır; çarptığı düşman bir an sersemler.' },
      { anahtar: 'yigit_narasi', ad: 'Yiğit Nârası', seviye: 20, nefes: 15, etki: 'guclenme', deger: 0.3, sure: 3, sersemAlan: 2, sersem: 4, aciklama: 'Gür bir nâra atar; sonraki üç saldırısında gücü artar, iki karo çevresindeki düşmanlar sinip bir an duraksar.' },
      { anahtar: 'tufan_kilici', ad: 'Tufan Kılıcı', seviye: 32, nefes: 25, etki: 'hasar', carpan: 3.0, alan: 1, alanMerkezi: 'oyuncu', alanCarpani: 1.8, aciklama: 'Ardı ardına inen, durdurulamaz kılıç darbeleri; yanı başındaki bütün düşmanlar da nasibini alır.' },
    ],
  },
  kemankes: {
    ad: 'Kemankeş',
    ikon: '🏹',
    tarif: 'Osmanlı okçusu. Çevik ve isabetlidir, beş karo öteden ok atar.',
    menzil: 5,
    mermi: 'ok',
    baslangic: { can: 90, nefes: 40, guc: 11, savunma: 6, ceviklik: 12 },
    seviyeArtisi: { can: 11, nefes: 4, guc: 2, savunma: 1, ceviklik: 2 },
    yetenekler: [
      { anahtar: 'nisan_oku', ad: 'Nişan Oku', seviye: 1, nefes: 5, etki: 'hasar', carpan: 1.4, aciklama: 'Dikkatle nişan alınmış tek bir ok.' },
      { anahtar: 'cifte_ok', ad: 'Çifte Ok', seviye: 5, nefes: 9, etki: 'hasar', carpan: 1.0, vurus: 2, aciklama: 'Yayından iki ok birden fırlatır; her ok ayrı vurur, ayrı kritik olabilir.' },
      { anahtar: 'ok_yagmuru', ad: 'Ok Yağmuru', seviye: 12, nefes: 14, etki: 'hasar', carpan: 2.0, alan: 1, alanCarpani: 1.2, aciklama: 'Hedefin üzerine ok yağdırır; bir karo çevresindeki düşmanlar da oklardan nasibini alır.' },
      { anahtar: 'kartal_gozu', ad: 'Kartal Gözü', seviye: 20, nefes: 15, etki: 'kritik', deger: 0.25, sure: 3, aciklama: 'Kartal gibi keskin bakar; sonraki üç saldırısında kritik vuruş şansı artar.' },
      { anahtar: 'menzil_atisi', ad: 'Menzil Atışı', seviye: 32, nefes: 25, etki: 'hasar', carpan: 3.0, menzil: 7, sersem: 8, aciklama: 'Kemankeşlerin efsanevi uzun menzil atışı: yedi karo öteyi vurur; oku yiyen düşman bir süre yerinden kıpırdayamaz.' },
    ],
  },
  alperen: {
    ad: 'Alperen',
    ikon: '🌿',
    tarif: 'Gazi-derviş geleneğinden gelir. Uzun asası ve manevi gücüyle (Nefes) iki karo öteye erişir, iyileşir.',
    menzil: 2,
    mermi: 'isik',
    baslangic: { can: 85, nefes: 70, guc: 9, savunma: 7, ceviklik: 8 },
    seviyeArtisi: { can: 8, nefes: 7, guc: 2, savunma: 1, ceviklik: 1 },
    yetenekler: [
      { anahtar: 'asa_darbesi', ad: 'Asa Darbesi', seviye: 1, nefes: 5, etki: 'hasar', carpan: 1.4, aciklama: 'Sağlam meşe asasıyla indirilen bir darbe.' },
      { anahtar: 'sifa_nefesi', ad: 'Şifa Nefesi', seviye: 5, nefes: 12, etki: 'sifa', deger: 0.35, aciklama: 'Derin bir nefesle toparlanır; canının bir kısmını yeniler.' },
      { anahtar: 'hikmet_kalkani', ad: 'Hikmet Kalkanı', seviye: 12, nefes: 14, etki: 'savunma', deger: 0.5, sure: 3, aciklama: 'Sükûnetini korur; düşmanın sonraki üç hamlesinde alınan hasar yarıya iner.' },
      { anahtar: 'arinma_isigi', ad: 'Arınma Işığı', seviye: 20, nefes: 18, etki: 'hasar', carpan: 2.2, menzil: 4, ekHasarTurleri: ['cin', 'ifrit'], ekHasarCarpani: 1.5, alan: 1, alanCarpani: 1.1, aciklama: 'Gönlündeki aydınlık dört karo öteye uzanır ve hedefin çevresine yayılır; zalim cinleri ve ifritleri sarsar, onlara ek hasar verir.' },
      { anahtar: 'gonul_dirligi', ad: 'Gönül Dirliği', seviye: 32, nefes: 25, etki: 'sifa', deger: 0.7, arindirir: true, aciklama: 'Gönül huzuruyla toparlanır; canının büyük kısmını yeniler, ürküntüsünü de giderir.' },
    ],
  },
};
