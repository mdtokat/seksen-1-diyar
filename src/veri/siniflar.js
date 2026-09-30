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
//   ekHasarTurleri / ekHasarCarpani: belirli düşman türlerine ek hasar.
// Değerler ilk sürüm içindir; Faz 3'te dengelenebilir.

export const STAT_PUANI_SEVIYE_BASI = 3;

// Dağıtılan bir stat puanının statı ne kadar artırdığı.
export const STAT_PUANI_DEGERI = { can: 5, nefes: 3, guc: 1, savunma: 1, ceviklik: 1 };

export const siniflar = {
  akinci: {
    ad: 'Akıncı',
    ikon: '⚔️',
    tarif: 'Kılıçlı öncü süvari. Dayanıklıdır, ön safta göğüs gerer.',
    baslangic: { can: 120, nefes: 30, guc: 12, savunma: 10, ceviklik: 6 },
    seviyeArtisi: { can: 12, nefes: 3, guc: 2, savunma: 2, ceviklik: 1 },
    yetenekler: [
      { anahtar: 'kilic_darbesi', ad: 'Kılıç Darbesi', seviye: 1, nefes: 5, etki: 'hasar', carpan: 1.4, aciklama: 'Güçlü ve isabetli bir kılıç darbesi.' },
      { anahtar: 'kalkan_durusu', ad: 'Kalkan Duruşu', seviye: 5, nefes: 8, etki: 'savunma', deger: 0.5, sure: 2, aciklama: 'Kalkanını kaldırır, düşmanın sonraki iki hamlesinde alınan hasarı yarıya indirir.' },
      { anahtar: 'akin_hamlesi', ad: 'Akın Hamlesi', seviye: 12, nefes: 12, etki: 'hasar', carpan: 2.0, aciklama: 'Atını mahmuzlayıp düşmanın üzerine yıldırım gibi atılır.' },
      { anahtar: 'yigit_narasi', ad: 'Yiğit Nârası', seviye: 20, nefes: 15, etki: 'guclenme', deger: 0.3, sure: 3, aciklama: 'Gür bir nâra atar; sonraki üç saldırısında gücü artar.' },
      { anahtar: 'tufan_kilici', ad: 'Tufan Kılıcı', seviye: 32, nefes: 25, etki: 'hasar', carpan: 3.0, aciklama: 'Ardı ardına inen, durdurulamaz kılıç darbeleri.' },
    ],
  },
  kemankes: {
    ad: 'Kemankeş',
    ikon: '🏹',
    tarif: 'Osmanlı okçusu. Çevik ve isabetlidir, uzaktan vurur.',
    baslangic: { can: 90, nefes: 40, guc: 11, savunma: 6, ceviklik: 12 },
    seviyeArtisi: { can: 11, nefes: 4, guc: 2, savunma: 1, ceviklik: 2 },
    yetenekler: [
      { anahtar: 'nisan_oku', ad: 'Nişan Oku', seviye: 1, nefes: 5, etki: 'hasar', carpan: 1.4, aciklama: 'Dikkatle nişan alınmış tek bir ok.' },
      { anahtar: 'cifte_ok', ad: 'Çifte Ok', seviye: 5, nefes: 9, etki: 'hasar', carpan: 1.8, aciklama: 'Yayından aynı anda iki ok birden fırlatır.' },
      { anahtar: 'ok_yagmuru', ad: 'Ok Yağmuru', seviye: 12, nefes: 14, etki: 'hasar', carpan: 2.2, aciklama: 'Düşmanın üzerine ok yağdırır.' },
      { anahtar: 'kartal_gozu', ad: 'Kartal Gözü', seviye: 20, nefes: 15, etki: 'kritik', deger: 0.25, sure: 3, aciklama: 'Kartal gibi keskin bakar; sonraki üç saldırısında kritik vuruş şansı artar.' },
      { anahtar: 'menzil_atisi', ad: 'Menzil Atışı', seviye: 32, nefes: 25, etki: 'hasar', carpan: 3.0, aciklama: 'Kemankeşlerin efsanevi uzun menzil atışı.' },
    ],
  },
  alperen: {
    ad: 'Alperen',
    ikon: '🌿',
    tarif: 'Gazi-derviş geleneğinden gelir. Manevi gücü (Nefes) ile savaşır ve iyileşir.',
    baslangic: { can: 85, nefes: 70, guc: 9, savunma: 7, ceviklik: 8 },
    seviyeArtisi: { can: 8, nefes: 7, guc: 2, savunma: 1, ceviklik: 1 },
    yetenekler: [
      { anahtar: 'asa_darbesi', ad: 'Asa Darbesi', seviye: 1, nefes: 5, etki: 'hasar', carpan: 1.4, aciklama: 'Sağlam meşe asasıyla indirilen bir darbe.' },
      { anahtar: 'sifa_nefesi', ad: 'Şifa Nefesi', seviye: 5, nefes: 12, etki: 'sifa', deger: 0.35, aciklama: 'Derin bir nefesle toparlanır; canının bir kısmını yeniler.' },
      { anahtar: 'hikmet_kalkani', ad: 'Hikmet Kalkanı', seviye: 12, nefes: 14, etki: 'savunma', deger: 0.5, sure: 3, aciklama: 'Sükûnetini korur; düşmanın sonraki üç hamlesinde alınan hasar yarıya iner.' },
      { anahtar: 'arinma_isigi', ad: 'Arınma Işığı', seviye: 20, nefes: 18, etki: 'hasar', carpan: 2.2, ekHasarTurleri: ['cin', 'ifrit'], ekHasarCarpani: 1.5, aciklama: 'Gönlündeki aydınlık, zalim cinleri ve ifritleri sarsar; onlara ek hasar verir.' },
      { anahtar: 'gonul_dirligi', ad: 'Gönül Dirliği', seviye: 32, nefes: 25, etki: 'sifa', deger: 0.7, aciklama: 'Gönül huzuruyla toparlanır; canının büyük kısmını yeniler.' },
    ],
  },
};
