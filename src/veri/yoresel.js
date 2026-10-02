// İllerin yöresel görünüşü: ev mimarisi, bahçe ağaçları, tarlalar ve ilin simgesi.
// Yalnızca veri — mantık kodu yok. İkisini src/oyun/gezinti.js → yoreselGorunum birleştirir
// ve simgenin haritadaki yerini ayırır; çizimi src/arayuz/cizimler/karolar.js yapar.
//
// Kırmızı çizgiler (plan.md Bölüm 2): simgeler arasında ibadethane, tanrı heykeli ya da
// put yoktur; yalnız saat kuleleri, kaleler, kuleler ve taş köprüler bulunur.

// Bölgenin varsayılan ev mimarisi:
//   konak: taş zemin kat, sıvalı ve ahşap çatkılı üst kat, cumba, kiremit çatı
//   ev: badanalı taş ev, panjurlar, kiremit kırma çatı
//   kerpic: kerpiç duvar, düz toprak dam, çıkıntı yapan hatıllar
//   ahsap: taş temel üstünde ahşap ev, beşik çatı
//   kesme: bal rengi kesme taş, düz dam ve korkuluk, kemerli pencereler
//   toprak: moloz taş duvar, kalın toprak dam (kışın karlı)
//   kumbet: Harran'ın kerpiç kümbet evleri
export const BOLGE_EVI = {
  marmara: 'konak',
  ege: 'ev',
  akdeniz: 'ev',
  ic_anadolu: 'kerpic',
  karadeniz: 'ahsap',
  guneydogu: 'kesme',
  dogu_anadolu: 'toprak',
};

// Bölgenin varsayılan bahçesi: [ağaç türü, oranı] ve tarla türü (yoksa null).
export const BOLGE_BAHCESI = {
  marmara: { agac: null, tarla: null },
  ege: { agac: null, tarla: null },
  akdeniz: { agac: ['narenciye', 0.25], tarla: null },
  ic_anadolu: { agac: null, tarla: 'bugday' },
  karadeniz: { agac: ['findik', 0.25], tarla: null },
  guneydogu: { agac: ['fistik', 0.3], tarla: null },
  dogu_anadolu: { agac: null, tarla: null },
};

// İle özgü ayrıntılar (bölgenin varsayılanını ezer).
//   ev: mimari · agac: [tür, oran] · tarla: tarla türü
//   simge: { tur: 'saat_kulesi' | 'kale' | 'kule' | 'kopru', ad }
export const yoresel = {
  1: { tarla: 'pamuk', agac: ['narenciye', 0.4], simge: { tur: 'kopru', ad: 'Taşköprü' } },
  2: { agac: ['fistik', 0.4] },
  3: { simge: { tur: 'kale', ad: 'Afyon Kalesi' } },
  5: { ev: 'konak', agac: ['elma', 0.5], simge: { tur: 'kale', ad: 'Harşena Kalesi' } },
  6: { ev: 'konak', simge: { tur: 'kale', ad: 'Ankara Kalesi' } },
  7: { agac: ['narenciye', 0.5], simge: { tur: 'saat_kulesi', ad: 'Kaleiçi Saat Kulesi' } },
  8: { tarla: 'cay' },
  9: { tarla: 'pamuk' },
  10: { simge: { tur: 'saat_kulesi', ad: 'Balıkesir Saat Kulesi' } },
  13: { simge: { tur: 'kale', ad: 'Bitlis Kalesi' } },
  16: { simge: { tur: 'saat_kulesi', ad: 'Tophane Saat Kulesi' } },
  17: { simge: { tur: 'kale', ad: 'Kilitbahir Kalesi' } },
  19: { simge: { tur: 'saat_kulesi', ad: 'Çorum Saat Kulesi' } },
  20: { tarla: 'pamuk' },
  21: { simge: { tur: 'kale', ad: 'Diyarbakır Surları' } },
  22: { tarla: 'aycicegi', simge: { tur: 'kopru', ad: 'Meriç Köprüsü' } },
  23: { simge: { tur: 'kale', ad: 'Harput Kalesi' } },
  25: { simge: { tur: 'kale', ad: 'Erzurum Kalesi' } },
  27: { agac: ['fistik', 0.7], simge: { tur: 'kale', ad: 'Gaziantep Kalesi' } },
  28: { agac: ['findik', 0.6] },
  31: { agac: ['narenciye', 0.5] },
  32: { tarla: 'gul', agac: ['elma', 0.4] },
  33: { agac: ['narenciye', 0.5], simge: { tur: 'kale', ad: 'Kızkalesi' } },
  34: { simge: { tur: 'kule', ad: 'Galata Kulesi' } },
  35: { tarla: 'bag', simge: { tur: 'saat_kulesi', ad: 'Konak Saat Kulesi' } },
  36: { simge: { tur: 'kale', ad: 'Kars Kalesi' } },
  37: { ev: 'konak', simge: { tur: 'saat_kulesi', ad: 'Kastamonu Saat Kulesi' } },
  38: { simge: { tur: 'kale', ad: 'Kayseri Kalesi' } },
  39: { tarla: 'aycicegi' },
  41: { simge: { tur: 'saat_kulesi', ad: 'İzmit Saat Kulesi' } },
  43: { ev: 'konak', simge: { tur: 'kale', ad: 'Kütahya Kalesi' } },
  44: { agac: ['kayisi', 0.7], simge: { tur: 'saat_kulesi', ad: 'Malatya Saat Kulesi' } },
  45: { tarla: 'bag' },
  46: { simge: { tur: 'kale', ad: 'Maraş Kalesi' } },
  47: { simge: { tur: 'kale', ad: 'Mardin Kalesi' } },
  48: { simge: { tur: 'kale', ad: 'Bodrum Kalesi' } },
  50: { ev: 'kesme' },
  51: { agac: ['elma', 0.5] },
  52: { agac: ['findik', 0.6] },
  53: { tarla: 'cay' },
  54: { agac: ['findik', 0.4] },
  55: { simge: { tur: 'saat_kulesi', ad: 'Samsun Saat Kulesi' } },
  56: { agac: ['fistik', 0.6] },
  57: { simge: { tur: 'kale', ad: 'Sinop Kalesi' } },
  59: { tarla: 'aycicegi' },
  60: { ev: 'konak', tarla: 'bag', simge: { tur: 'kale', ad: 'Tokat Kalesi' } },
  61: { agac: ['findik', 0.5], simge: { tur: 'kale', ad: 'Trabzon Kalesi' } },
  63: { ev: 'kumbet', tarla: 'pamuk', agac: ['fistik', 0.4], simge: { tur: 'kale', ad: 'Urfa Kalesi' } },
  65: { simge: { tur: 'kale', ad: 'Van Kalesi' } },
  69: { simge: { tur: 'kale', ad: 'Bayburt Kalesi' } },
  72: { simge: { tur: 'kopru', ad: 'Malabadi Köprüsü' } },
  74: { ev: 'konak' },
  76: { agac: ['kayisi', 0.5] },
  78: { ev: 'konak', simge: { tur: 'saat_kulesi', ad: 'Safranbolu Saat Kulesi' } },
  81: { agac: ['findik', 0.6] },
};

// Simgenin haritada kapladığı alan (karo): köprü bir dere üstünden geçer, daha geniştir.
export const SIMGE_BOYU = {
  saat_kulesi: { g: 2, y: 2 },
  kule: { g: 2, y: 2 },
  kale: { g: 3, y: 2 },
  kopru: { g: 3, y: 2 },
};

