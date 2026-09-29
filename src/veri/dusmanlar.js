// Düşmanlar. Yalnızca veri — mantık kodu yok.
// tur: 'hayvan' | 'cin' | 'ifrit' | 'hortlak' | 'dev' | 'boss'
// sinif: 'siradan' (illerde karşılaşılır) | 'mini_boss' | 'bolge_bossu' | 'final'
// carpan: stat çarpanları. Örnek: can = (20 + sv × 12) × carpan.can (plan.md Bölüm 5).
//   Boss ve mini boss çarpanları Faz 7'de simülasyonla dengelendi (plan.md Faz 7).
// Yenilen düşmanlar ölmez; dağılır, kaçar ya da üzerindeki sihir bozulur.

export const DUSMAN_TURLERI = ['hayvan', 'cin', 'ifrit', 'hortlak', 'dev', 'boss'];

// Düşman yapay zekâsının ara sıra yaptığı özel hamle, türe göre (plan.md Bölüm 5).
// Mini bosslar ve bölge bossları kendi `ozelHamleler` listelerini kullanır.
// etki: 'hasar' → güce `carpan` uygulanmış bir vuruş;
//       'zayiflatma' → oyuncunun gücü sonraki `sure` saldırısında `deger` oranında azalır.
export const OZEL_HAMLE_SANSI = 0.2;
export const BOSS_OZEL_HAMLE_SANSI = 0.3; // mini boss ve bölge bossları
export const EVRE_OZEL_HAMLE_SANSI = 0.4; // güçlenme evresindeki bölge bossları
export const EVRE_GUC_CARPANI = 1.3; // bölge bossu canı yarının altına düşünce

export const OZEL_HAMLELER = {
  hayvan: { ad: 'Azgın Saldırı', etki: 'hasar', carpan: 1.5 },
  cin: { ad: 'Kara Sihir', etki: 'hasar', carpan: 1.6 },
  ifrit: { ad: 'Alev Dalgası', etki: 'hasar', carpan: 1.6 },
  hortlak: { ad: 'Ürkütücü Çığlık', etki: 'zayiflatma', deger: 0.25, sure: 2 },
  dev: { ad: 'Kaya Fırlatma', etki: 'hasar', carpan: 1.8 },
  boss: { ad: 'Zülmet\'in Sihri', etki: 'hasar', carpan: 1.7 },
};

// Yenilen düşmanın verdiği XP, düşman sınıfına göre bu çarpanla büyür.
export const SINIF_XP_CARPANI = {
  siradan: 1,
  mini_boss: 3,
  bolge_bossu: 8,
  final: 15,
};

export const dusmanlar = {
  // ── Marmara ──────────────────────────────────────────────
  ac_kurt: {
    ad: 'Aç Kurt',
    tur: 'hayvan',
    sinif: 'siradan',
    bolge: 'marmara',
    ikon: '🐺',
    carpan: { can: 0.9, guc: 0.9, savunma: 0.8, ceviklik: 1.1 },
    aciklama: 'Zülmet\'in sihriyle azmış, köylerin çevresinde dolaşan aç bir kurt.',
  },
  cakal_surusu: {
    ad: 'Çakal Sürüsü',
    tur: 'hayvan',
    sinif: 'siradan',
    bolge: 'marmara',
    ikon: '🦊',
    carpan: { can: 1.0, guc: 0.8, savunma: 0.7, ceviklik: 1.2 },
    aciklama: 'Yolcuları taciz eden, gürültücü ve kurnaz bir çakal sürüsü.',
  },
  yol_kesen_cin: {
    ad: 'Yol Kesen Cin',
    tur: 'cin',
    sinif: 'siradan',
    bolge: 'marmara',
    ikon: '👤',
    carpan: { can: 0.9, guc: 1.1, savunma: 0.8, ceviklik: 1.0 },
    aciklama: 'Zülmet\'in saldığı, kervan yollarını kesen zalim bir cin.',
  },
  gulyabani: {
    ad: 'Gulyabani',
    tur: 'hortlak',
    sinif: 'mini_boss',
    bolge: 'marmara',
    ikon: '👹',
    carpan: { can: 2.6, guc: 1.43, savunma: 1.2, ceviklik: 0.9 },
    ozelHamleler: [{ ad: 'Ürkütücü Uluma', etki: 'zayiflatma', deger: 0.25, sure: 2 }, { ad: 'Uzun Kollar', etki: 'hasar', carpan: 1.6 }],
    aciklama: 'Issız yerlerde yolcuları korkutan, sihirle güçlenmiş bir hortlak.',
  },
  bogaz_ejderi: {
    ad: 'Boğaz Ejderi',
    tur: 'boss',
    sinif: 'bolge_bossu',
    bolge: 'marmara',
    ikon: '🐉',
    carpan: { can: 2.4, guc: 1.05, savunma: 1.12, ceviklik: 1.0 },
    ozelHamleler: [{ ad: 'Dalga Çarpması', etki: 'hasar', carpan: 1.8 }, { ad: 'Sis Perdesi', etki: 'zayiflatma', deger: 0.25, sure: 2 }],
    aciklama: 'Zülmet\'in sihriyle azıp Boğaz\'ın sularını bulandıran dev bir ejder.',
  },

  // ── Ege ──────────────────────────────────────────────────
  yaban_domuzu: {
    ad: 'Yaban Domuzu',
    tur: 'hayvan',
    sinif: 'siradan',
    bolge: 'ege',
    ikon: '🐗',
    carpan: { can: 1.2, guc: 1.0, savunma: 1.1, ceviklik: 0.8 },
    aciklama: 'Tarlaları talan eden, sihirle azmış öfkeli bir yaban domuzu.',
  },
  zeytinlik_hortlagi: {
    ad: 'Zeytinlik Hortlağı',
    tur: 'hortlak',
    sinif: 'siradan',
    bolge: 'ege',
    ikon: '👻',
    carpan: { can: 1.0, guc: 1.0, savunma: 0.9, ceviklik: 1.0 },
    aciklama: 'Gece zeytinliklerde dolaşıp bahçıvanları korkutan bir hortlak.',
  },
  kara_cin: {
    ad: 'Kara Cin',
    tur: 'cin',
    sinif: 'siradan',
    bolge: 'ege',
    ikon: '👤',
    carpan: { can: 0.9, guc: 1.2, savunma: 0.8, ceviklik: 1.1 },
    aciklama: 'Zülmet\'e hizmet eden, gölgelerde saklanan zalim bir cin.',
  },
  carsamba_karisi: {
    ad: 'Çarşamba Karısı',
    tur: 'cin',
    sinif: 'mini_boss',
    bolge: 'ege',
    ikon: '🧹',
    carpan: { can: 2.6, guc: 1.43, savunma: 1.1, ceviklik: 1.1 },
    ozelHamleler: [{ ad: 'Süpürge Savuruşu', etki: 'hasar', carpan: 1.7 }, { ad: 'Kara Fısıltı', etki: 'zayiflatma', deger: 0.25, sure: 2 }],
    aciklama: 'Masallarda anılan, sihirle azıp evlere musallat olan bir cin.',
  },
  yelbegen: {
    ad: 'Yelbegen',
    tur: 'boss',
    sinif: 'bolge_bossu',
    bolge: 'ege',
    ikon: '🗿',
    carpan: { can: 3.0, guc: 1.05, savunma: 1.04, ceviklik: 0.9 },
    ozelHamleler: [{ ad: 'Yel Savuruşu', etki: 'hasar', carpan: 1.8 }, { ad: 'Üç Başlı Kükreyiş', etki: 'zayiflatma', deger: 0.3, sure: 2 }],
    aciklama: 'Masallardaki çok başlı dev; Zülmet\'in sihriyle azıp Ege yollarını kesmiş.',
  },

  // ── Akdeniz ──────────────────────────────────────────────
  akrep_surusu: {
    ad: 'Akrep Sürüsü',
    tur: 'hayvan',
    sinif: 'siradan',
    bolge: 'akdeniz',
    ikon: '🦂',
    carpan: { can: 0.9, guc: 1.1, savunma: 1.0, ceviklik: 1.1 },
    aciklama: 'Taşların altından çıkıp yolcuların önünü kesen bir akrep sürüsü.',
  },
  anadolu_parsi: {
    ad: 'Anadolu Parsı',
    tur: 'hayvan',
    sinif: 'siradan',
    bolge: 'akdeniz',
    ikon: '🐆',
    carpan: { can: 1.0, guc: 1.2, savunma: 0.9, ceviklik: 1.3 },
    aciklama: 'Toros ormanlarının sihirle azmış, çevik ve güçlü parsı.',
  },
  magara_ifriti: {
    ad: 'Mağara İfriti',
    tur: 'ifrit',
    sinif: 'siradan',
    bolge: 'akdeniz',
    ikon: '🔥',
    carpan: { can: 1.1, guc: 1.2, savunma: 1.0, ceviklik: 0.9 },
    aciklama: 'Kıyı mağaralarına yerleşmiş, alev saçan zalim bir ifrit.',
  },
  yilan_beyi: {
    ad: 'Yılan Beyi',
    tur: 'hayvan',
    sinif: 'mini_boss',
    bolge: 'akdeniz',
    ikon: '🐍',
    carpan: { can: 2.73, guc: 1.43, savunma: 1.1, ceviklik: 1.2 },
    ozelHamleler: [{ ad: 'Zehirli Isırık', etki: 'hasar', carpan: 1.7 }, { ad: 'Kıvrılıp Dolanma', etki: 'zayiflatma', deger: 0.25, sure: 2 }],
    aciklama: 'Yılanların başına geçmiş, sihirle azmış iri bir yılan.',
  },
  sahmeran: {
    ad: 'Şahmeran',
    tur: 'boss',
    sinif: 'bolge_bossu',
    bolge: 'akdeniz',
    ikon: '🐍',
    carpan: { can: 3.2, guc: 1.05, savunma: 1.04, ceviklik: 1.2 },
    ozelHamleler: [{ ad: 'Kıvrılıp Sıkma', etki: 'hasar', carpan: 1.8 }, { ad: 'Büyülü Bakış', etki: 'zayiflatma', deger: 0.3, sure: 2 }],
    aciklama: 'Efsanelerin yılanlar şahı; Zülmet\'in sihriyle aklı bulanıp mazlumlara saldırıyor.',
  },

  // ── İç Anadolu ───────────────────────────────────────────
  bozkir_kurdu: {
    ad: 'Bozkır Kurdu',
    tur: 'hayvan',
    sinif: 'siradan',
    bolge: 'ic_anadolu',
    ikon: '🐺',
    carpan: { can: 1.0, guc: 1.1, savunma: 0.9, ceviklik: 1.2 },
    aciklama: 'Bozkırın uçsuz ovalarında sürüsünden ayrılmış, azgın bir kurt.',
  },
  peri_bacasi_cini: {
    ad: 'Peri Bacası Cini',
    tur: 'cin',
    sinif: 'siradan',
    bolge: 'ic_anadolu',
    ikon: '👤',
    carpan: { can: 0.9, guc: 1.2, savunma: 0.9, ceviklik: 1.1 },
    aciklama: 'Kapadokya\'nın kaya oyuklarına saklanan zalim bir cin.',
  },
  toz_ifriti: {
    ad: 'Toz İfriti',
    tur: 'ifrit',
    sinif: 'siradan',
    bolge: 'ic_anadolu',
    ikon: '🌪️',
    carpan: { can: 1.1, guc: 1.1, savunma: 1.0, ceviklik: 1.0 },
    aciklama: 'Kavurucu toz fırtınalarıyla gelen, sihirle beslenen bir ifrit.',
  },
  golge_albasti: {
    ad: 'Gölge Albastı',
    tur: 'cin',
    sinif: 'mini_boss',
    bolge: 'ic_anadolu',
    ikon: '🌑',
    carpan: { can: 2.73, guc: 1.54, savunma: 1.1, ceviklik: 1.1 },
    ozelHamleler: [{ ad: 'Gölge Pençesi', etki: 'hasar', carpan: 1.7 }, { ad: 'Karabasan', etki: 'zayiflatma', deger: 0.25, sure: 2 }],
    aciklama: 'Albastı\'nın gölgesinden doğan, köyleri tedirgin eden bir cin.',
  },
  albasti: {
    ad: 'Albastı',
    tur: 'boss',
    sinif: 'bolge_bossu',
    bolge: 'ic_anadolu',
    ikon: '🌘',
    carpan: { can: 3.4, guc: 1.05, savunma: 1.12, ceviklik: 1.1 },
    ozelHamleler: [{ ad: 'Kızıl Pençe', etki: 'hasar', carpan: 1.9 }, { ad: 'Karabasan Gecesi', etki: 'zayiflatma', deger: 0.3, sure: 2 }],
    aciklama: 'Halk anlatılarının korkulan varlığı; Zülmet\'in sihriyle azıp bozkıra çökmüş.',
  },

  // ── Karadeniz ────────────────────────────────────────────
  boz_ayi: {
    ad: 'Boz Ayı',
    tur: 'hayvan',
    sinif: 'siradan',
    bolge: 'karadeniz',
    ikon: '🐻',
    carpan: { can: 1.3, guc: 1.2, savunma: 1.1, ceviklik: 0.8 },
    aciklama: 'Yayla yollarını kesen, sihirle azmış iri bir boz ayı.',
  },
  sis_cini: {
    ad: 'Sis Cini',
    tur: 'cin',
    sinif: 'siradan',
    bolge: 'karadeniz',
    ikon: '🌫️',
    carpan: { can: 0.9, guc: 1.1, savunma: 0.9, ceviklik: 1.3 },
    aciklama: 'Yaylaları kaplayan sisin içinden yolcuları şaşırtan bir cin.',
  },
  orman_hortlagi: {
    ad: 'Orman Hortlağı',
    tur: 'hortlak',
    sinif: 'siradan',
    bolge: 'karadeniz',
    ikon: '👻',
    carpan: { can: 1.1, guc: 1.1, savunma: 1.0, ceviklik: 1.0 },
    aciklama: 'Sık ormanların derinliğinde dolaşan, sihirle uyanmış bir hortlak.',
  },
  yayla_devi: {
    ad: 'Yayla Devi',
    tur: 'dev',
    sinif: 'mini_boss',
    bolge: 'karadeniz',
    ikon: '🗿',
    carpan: { can: 2.99, guc: 1.54, savunma: 1.3, ceviklik: 0.8 },
    ozelHamleler: [{ ad: 'Yayla Kayası', etki: 'hasar', carpan: 1.8 }, { ad: 'Yer Sarsıntısı', etki: 'zayiflatma', deger: 0.25, sure: 2 }],
    aciklama: 'Yayla evlerini tehdit eden, sihirle azmış koca bir dev.',
  },
  karakoncolos: {
    ad: 'Karakoncolos',
    tur: 'boss',
    sinif: 'bolge_bossu',
    bolge: 'karadeniz',
    ikon: '❄️',
    carpan: { can: 4.0, guc: 1.05, savunma: 1.12, ceviklik: 1.0 },
    ozelHamleler: [{ ad: 'Kış Soluğu', etki: 'hasar', carpan: 1.9 }, { ad: 'Buz Kilidi', etki: 'zayiflatma', deger: 0.3, sure: 2 }],
    aciklama: 'Kış gecelerinin korkulu mahlûku; Zülmet\'in sihriyle güçlenmiş.',
  },

  // ── Güneydoğu Anadolu ────────────────────────────────────
  col_akrebi: {
    ad: 'Çöl Akrebi',
    tur: 'hayvan',
    sinif: 'siradan',
    bolge: 'guneydogu',
    ikon: '🦂',
    carpan: { can: 1.0, guc: 1.2, savunma: 1.1, ceviklik: 1.1 },
    aciklama: 'Kızgın kumların altında pusuya yatan, sihirle azmış iri bir akrep.',
  },
  kum_ifriti: {
    ad: 'Kum İfriti',
    tur: 'ifrit',
    sinif: 'siradan',
    bolge: 'guneydogu',
    ikon: '🌪️',
    carpan: { can: 1.1, guc: 1.2, savunma: 1.0, ceviklik: 1.0 },
    aciklama: 'Kum fırtınalarının içinde dolaşan zalim bir ifrit.',
  },
  tas_dev: {
    ad: 'Taş Dev',
    tur: 'dev',
    sinif: 'siradan',
    bolge: 'guneydogu',
    ikon: '🪨',
    carpan: { can: 1.4, guc: 1.1, savunma: 1.3, ceviklik: 0.7 },
    aciklama: 'Sihirle canlanıp yolları tıkayan taştan bir dev.',
  },
  tepegozun_muhafizi: {
    ad: 'Tepegöz\'ün Muhafızı',
    tur: 'dev',
    sinif: 'mini_boss',
    bolge: 'guneydogu',
    ikon: '🛡️',
    carpan: { can: 2.99, guc: 1.54, savunma: 1.3, ceviklik: 0.9 },
    ozelHamleler: [{ ad: 'Kalkan Darbesi', etki: 'hasar', carpan: 1.7 }, { ad: 'Duvar Gibi Duruş', etki: 'zayiflatma', deger: 0.25, sure: 2 }],
    aciklama: 'Tepegöz\'ün inini bekleyen, sihirle azmış iri yarı bir dev.',
  },
  tepegoz: {
    ad: 'Tepegöz',
    tur: 'boss',
    sinif: 'bolge_bossu',
    bolge: 'guneydogu',
    ikon: '👁️',
    carpan: { can: 4.4, guc: 1.05, savunma: 1.12, ceviklik: 0.9 },
    ozelHamleler: [{ ad: 'Kaya Savurma', etki: 'hasar', carpan: 2.0 }, { ad: 'Tek Göz Bakışı', etki: 'zayiflatma', deger: 0.3, sure: 2 }],
    aciklama: 'Dede Korkut hikâyelerindeki tek gözlü dev; Zülmet\'in sihriyle yeniden uyanmış.',
  },

  // ── Doğu Anadolu ─────────────────────────────────────────
  karli_dag_kurdu: {
    ad: 'Karlı Dağ Kurdu',
    tur: 'hayvan',
    sinif: 'siradan',
    bolge: 'dogu_anadolu',
    ikon: '🐺',
    carpan: { can: 1.1, guc: 1.2, savunma: 1.0, ceviklik: 1.2 },
    aciklama: 'Karlı doruklarda avlanan, sihirle azmış iri bir kurt.',
  },
  buz_cini: {
    ad: 'Buz Cini',
    tur: 'cin',
    sinif: 'siradan',
    bolge: 'dogu_anadolu',
    ikon: '🧊',
    carpan: { can: 1.0, guc: 1.2, savunma: 1.0, ceviklik: 1.1 },
    aciklama: 'Dondurucu rüzgârlarla gelen, zalim bir cin.',
  },
  zulmetin_muhafizi: {
    ad: 'Zülmet\'in Muhafızı',
    tur: 'dev',
    sinif: 'siradan',
    bolge: 'dogu_anadolu',
    ikon: '🛡️',
    carpan: { can: 1.3, guc: 1.2, savunma: 1.3, ceviklik: 0.9 },
    aciklama: 'Zülmet\'in kalesine giden yolları bekleyen, sihre bağlanmış bir muhafız.',
  },
  tipi_ifriti: {
    ad: 'Tipi İfriti',
    tur: 'ifrit',
    sinif: 'mini_boss',
    bolge: 'dogu_anadolu',
    ikon: '🌨️',
    carpan: { can: 2.99, guc: 1.54, savunma: 1.2, ceviklik: 1.1 },
    ozelHamleler: [{ ad: 'Tipi Çarpması', etki: 'hasar', carpan: 1.8 }, { ad: 'Ayaz', etki: 'zayiflatma', deger: 0.25, sure: 2 }],
    aciklama: 'Tipiyle birlikte gelip yolları kapatan zalim bir ifrit.',
  },
  van_golu_canavari: {
    ad: 'Van Gölü Canavarı',
    tur: 'boss',
    sinif: 'bolge_bossu',
    bolge: 'dogu_anadolu',
    ikon: '🌊',
    carpan: { can: 4.4, guc: 1.1, savunma: 1.2, ceviklik: 1.0 },
    ozelHamleler: [{ ad: 'Göl Dalgası', etki: 'hasar', carpan: 1.9 }, { ad: 'Derin Girdap', etki: 'zayiflatma', deger: 0.3, sure: 2 }],
    aciklama: 'Gölün derinliklerinden çıkan, Zülmet\'in sihriyle azmış dev bir mahlûk.',
  },

  // ── Final ────────────────────────────────────────────────
  zulmet: {
    ad: 'Zülmet',
    tur: 'boss',
    sinif: 'final',
    bolge: 'dogu_anadolu',
    ikon: '🧙',
    carpan: { can: 5.0, guc: 2.0, savunma: 1.6, ceviklik: 1.2 },
    ozelHamleler: [{ ad: 'Kara Sihir Fırtınası', etki: 'hasar', carpan: 2.0 }, { ad: 'Zulüm Gölgesi', etki: 'zayiflatma', deger: 0.3, sure: 2 }],
    aciklama: 'Yasak sihirle cinleri ve ifritleri Anadolu\'ya salan zalim sihirbaz.',
  },
};
