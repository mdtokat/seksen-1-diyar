// Yöresel yemekler (can ve nefes iksirleri). Yalnızca veri — mantık kodu yok.
// tur: 'can' canı, 'nefes' nefesi yeniler.
// il: yemeğin ait olduğu ilin plakası. Güç ve fiyat, ilin bölge çarpanıyla
// hesaplanır (src/oyun/envanter.js). Taban değerler aşağıdadır (plan.md Bölüm 7).
// teyit: false → seçim kullanıcı tarafından henüz teyit edilmedi (plan.md'de ⚠).

export const YEMEK_TABANI = {
  can: { guc: 30, fiyat: 20 },
  nefes: { guc: 15, fiyat: 15 },
};

export const yemekler = {
  // ── Marmara ──────────────────────────────────────────────
  balik_ekmek: { ad: 'Balık ekmek', tur: 'can', il: 34, ikon: '🥪', aciklama: 'İstanbul kıyılarında közde pişen balığın ekmek arasındaki hâli.' },
  tava_ciger: { ad: 'Tava ciğer', tur: 'can', il: 22, ikon: '🍳', aciklama: 'Edirne\'nin ince kıyılıp kızartılan meşhur ciğeri.' },
  kirklareli_koftesi: { ad: 'Kırklareli köftesi', tur: 'can', il: 39, ikon: '🍢', teyit: false, aciklama: 'Kırklareli\'nin baharatlı ızgara köftesi.' },
  tekirdag_koftesi: { ad: 'Tekirdağ köftesi', tur: 'can', il: 59, ikon: '🍢', aciklama: 'Tekirdağ\'ın közde pişen, kendine has şekilli köftesi.' },
  peynir_helvasi: { ad: 'Peynir helvası', tur: 'nefes', il: 17, ikon: '🍮', aciklama: 'Çanakkale\'nin tuzsuz peynirle yapılan fırın helvası.' },
  hosmerim: { ad: 'Höşmerim', tur: 'nefes', il: 10, ikon: '🍮', aciklama: 'Balıkesir\'in taze peynirden yapılan tatlısı.' },
  iskender_kebap: { ad: 'İskender kebap', tur: 'can', il: 16, ikon: '🍖', aciklama: 'Bursa\'nın tereyağlı, yoğurtlu döner kebabı.' },
  osmaneli_ayva_tatlisi: { ad: 'Osmaneli ayva tatlısı', tur: 'nefes', il: 11, ikon: '🍐', teyit: false, aciklama: 'Bilecik Osmaneli\'nin kaymaklı ayva tatlısı.' },
  pismaniye: { ad: 'Pişmaniye', tur: 'nefes', il: 41, ikon: '🍬', aciklama: 'Kocaeli\'nin ipek gibi incecik telli tatlısı.' },
  islama_kofte: { ad: 'Islama köfte', tur: 'can', il: 54, ikon: '🍢', aciklama: 'Sakarya\'nın et suyuna batırılmış ekmekle sunulan köftesi.' },
  kaplica_suyu: { ad: 'Kaplıca suyu', tur: 'nefes', il: 77, ikon: '💧', teyit: false, aciklama: 'Yalova kaplıcalarının ferahlatan suyu.' },

  // ── Ege ──────────────────────────────────────────────────
  boyoz: { ad: 'Boyoz', tur: 'can', il: 35, ikon: '🥐', aciklama: 'İzmir kahvaltılarının vazgeçilmezi, katmerli hamur işi.' },
  mesir_macunu: { ad: 'Mesir macunu', tur: 'nefes', il: 45, ikon: '🍯', aciklama: 'Manisa\'nın onlarca baharatla yapılan asırlık macunu.' },
  incir: { ad: 'İncir', tur: 'nefes', il: 9, ikon: '🟣', aciklama: 'Aydın ovasının bal tadındaki incirleri.' },
  denizli_kebabi: { ad: 'Denizli kebabı', tur: 'can', il: 20, ikon: '🍖', aciklama: 'Denizli\'nin kuyu fırınında pişen kuzu kebabı.' },
  cokertme_kebabi: { ad: 'Çökertme kebabı', tur: 'can', il: 48, ikon: '🍖', aciklama: 'Muğla\'nın çıtır patates üzerinde yoğurtlu et kebabı.' },
  usak_tarhanasi: { ad: 'Uşak tarhanası', tur: 'can', il: 64, ikon: '🍲', aciklama: 'Uşak\'ın kışlık, doyurucu tarhana çorbası.' },
  afyon_kaymagi: { ad: 'Afyon kaymağı', tur: 'nefes', il: 3, ikon: '🥛', aciklama: 'Afyon\'un meşhur manda kaymağı.' },
  cimcik: { ad: 'Cimcik', tur: 'can', il: 43, ikon: '🥟', aciklama: 'Kütahya\'nın küçük kare hamurlu, yoğurtlu yemeği.' },

  // ── Akdeniz ──────────────────────────────────────────────
  antalya_piyazi: { ad: 'Antalya piyazı', tur: 'can', il: 7, ikon: '🥗', aciklama: 'Antalya\'nın tahinli, kendine has piyazı.' },
  burdur_sis: { ad: 'Burdur şiş', tur: 'can', il: 15, ikon: '🍢', aciklama: 'Burdur\'un tereyağında pişen şiş köftesi.' },
  gul_serbeti: { ad: 'Gül şerbeti', tur: 'nefes', il: 32, ikon: '🌹', aciklama: 'Isparta güllerinden yapılan ferahlatıcı şerbet.' },
  tantuni: { ad: 'Tantuni', tur: 'can', il: 33, ikon: '🌯', aciklama: 'Mersin\'in sacda pişen etiyle yapılan dürümü.' },
  adana_kebap: { ad: 'Adana kebap', tur: 'can', il: 1, ikon: '🍢', aciklama: 'Adana\'nın zırhla kıyılmış etten yapılan acılı kebabı.' },
  kunefe: { ad: 'Künefe', tur: 'nefes', il: 31, ikon: '🍮', aciklama: 'Hatay\'ın tel kadayıflı, peynirli sıcak tatlısı.' },
  yer_fistigi: { ad: 'Yer fıstığı', tur: 'nefes', il: 80, ikon: '🥜', aciklama: 'Osmaniye topraklarının meşhur yer fıstığı.' },
  maras_dondurmasi: { ad: 'Maraş dondurması', tur: 'nefes', il: 46, ikon: '🍨', aciklama: 'Kahramanmaraş\'ın salepli, dövülerek yapılan dondurması.' },

  // ── İç Anadolu ───────────────────────────────────────────
  ankara_tava: { ad: 'Ankara tava', tur: 'can', il: 6, ikon: '🍲', aciklama: 'Ankara\'nın kuzu etli, arpa şehriyeli fırın yemeği.' },
  etli_ekmek: { ad: 'Etli ekmek', tur: 'can', il: 42, ikon: '🫓', aciklama: 'Konya\'nın ince hamurlu, upuzun etli ekmeği.' },
  kayseri_mantisi: { ad: 'Kayseri mantısı', tur: 'can', il: 38, ikon: '🥟', aciklama: 'Kayseri\'nin minicik, yoğurtlu mantısı.' },
  sivas_koftesi: { ad: 'Sivas köftesi', tur: 'can', il: 58, ikon: '🍢', aciklama: 'Sivas\'ın közlenmiş biberle sunulan ızgara köftesi.' },
  ciborek: { ad: 'Çibörek', tur: 'can', il: 26, ikon: '🥟', aciklama: 'Eskişehir\'in Tatar mutfağından gelen, içi etli kızarmış hamuru.' },
  arabasi_corbasi: { ad: 'Arabaşı çorbası', tur: 'can', il: 66, ikon: '🍲', aciklama: 'Yozgat\'ın hamuruyla birlikte içilen, acılı tavuk çorbası.' },
  ugut_tatlisi: { ad: 'Uğut tatlısı', tur: 'nefes', il: 71, ikon: '🍮', teyit: false, aciklama: 'Kırıkkale\'nin çimlendirilmiş buğdaydan yapılan tatlısı.' },
  cullama: { ad: 'Çullama', tur: 'can', il: 40, ikon: '🍲', teyit: false, aciklama: 'Kırşehir\'in tavuklu, yufkalı yöresel yemeği.' },
  testi_kebabi: { ad: 'Testi kebabı', tur: 'can', il: 50, ikon: '🏺', aciklama: 'Nevşehir\'in toprak testide pişen kebabı.' },
  nigde_gazozu: { ad: 'Niğde gazozu', tur: 'nefes', il: 51, ikon: '🥤', aciklama: 'Niğde\'nin meşhur, ferahlatıcı gazozu.' },
  aksaray_tandiri: { ad: 'Aksaray tandırı', tur: 'can', il: 68, ikon: '🍖', teyit: false, aciklama: 'Aksaray\'ın tandırda ağır ağır pişen kuzu eti.' },
  divle_obruk_peyniri: { ad: 'Divle obruk peyniri', tur: 'can', il: 70, ikon: '🧀', aciklama: 'Karaman\'ın mağarada olgunlaşan tulum peyniri.' },
  eksili_kofte: { ad: 'Ekşili köfte', tur: 'can', il: 18, ikon: '🍲', teyit: false, aciklama: 'Çankırı\'nın ekşili, sulu köftesi.' },

  // ── Karadeniz ────────────────────────────────────────────
  eregli_cilegi: { ad: 'Ereğli çileği', tur: 'nefes', il: 67, ikon: '🍓', aciklama: 'Zonguldak Ereğli\'nin mis kokulu çileği.' },
  amasra_salatasi: { ad: 'Amasra salatası', tur: 'can', il: 74, ikon: '🥗', aciklama: 'Bartın Amasra\'nın bol yeşillikli taze salatası.' },
  safranbolu_lokumu: { ad: 'Safranbolu lokumu', tur: 'nefes', il: 78, ikon: '🍬', aciklama: 'Safranbolu\'nun cevizli, yumuşacık lokumu.' },
  findik_ezmesi: { ad: 'Fındık ezmesi', tur: 'nefes', il: 81, ikon: '🌰', teyit: false, aciklama: 'Düzce fındığından yapılan besleyici ezme.' },
  abant_alabaligi: { ad: 'Abant alabalığı', tur: 'can', il: 14, ikon: '🐟', aciklama: 'Abant Gölü\'nün taze alabalığı.' },
  tosya_pilavi: { ad: 'Tosya pilavı', tur: 'can', il: 37, ikon: '🍚', aciklama: 'Kastamonu Tosya pirincinden tane tane pilav.' },
  sinop_mantisi: { ad: 'Sinop mantısı', tur: 'can', il: 57, ikon: '🥟', aciklama: 'Sinop\'un cevizli, tereyağlı mantısı.' },
  bafra_pidesi: { ad: 'Bafra pidesi', tur: 'can', il: 55, ikon: '🫓', aciklama: 'Samsun Bafra\'nın incecik, upuzun kıymalı pidesi.' },
  amasya_elmasi: { ad: 'Amasya elması', tur: 'nefes', il: 5, ikon: '🍎', aciklama: 'Amasya\'nın mis kokulu, küçük misket elması.' },
  tokat_kebabi: { ad: 'Tokat kebabı', tur: 'can', il: 60, ikon: '🍢', aciklama: 'Tokat\'ın patlıcan ve kuzu etiyle şişte pişen kebabı.' },
  leblebi: { ad: 'Leblebi', tur: 'nefes', il: 19, ikon: '🫘', aciklama: 'Çorum\'un çıtır çıtır meşhur leblebisi.' },
  findik: { ad: 'Fındık', tur: 'nefes', il: 52, ikon: '🌰', aciklama: 'Ordu\'nun dünyaca bilinen fındığı.' },
  karalahana_corbasi: { ad: 'Karalahana çorbası', tur: 'can', il: 28, ikon: '🍲', aciklama: 'Giresun\'un mısır unlu karalahana çorbası.' },
  akcaabat_koftesi: { ad: 'Akçaabat köftesi', tur: 'can', il: 61, ikon: '🍢', aciklama: 'Trabzon Akçaabat\'ın ızgara köftesi.' },
  rize_cayi: { ad: 'Rize çayı', tur: 'nefes', il: 53, ikon: '🍵', aciklama: 'Rize\'nin yamaçlarında yetişen, taze demlenmiş çay.' },
  macahel_bali: { ad: 'Macahel balı', tur: 'nefes', il: 8, ikon: '🍯', aciklama: 'Artvin Macahel\'in Kafkas arılarından elde edilen balı.' },
  gumushane_pestili: { ad: 'Gümüşhane pestili', tur: 'nefes', il: 29, ikon: '🟫', aciklama: 'Gümüşhane\'nin dut suyundan yapılan pestili.' },
  tel_helva: { ad: 'Tel helva', tur: 'nefes', il: 69, ikon: '🍬', teyit: false, aciklama: 'Bayburt\'un ince telli helvası.' },

  // ── Güneydoğu Anadolu ────────────────────────────────────
  antep_baklavasi: { ad: 'Antep baklavası', tur: 'nefes', il: 27, ikon: '🥮', aciklama: 'Gaziantep\'in fıstıklı, çıtır baklavası.' },
  urfa_kebabi: { ad: 'Urfa kebabı', tur: 'can', il: 63, ikon: '🍢', aciklama: 'Şanlıurfa\'nın közlenmiş sebzeyle sunulan acısız kebabı.' },
  kaburga_dolmasi: { ad: 'Kaburga dolması', tur: 'can', il: 21, ikon: '🍖', aciklama: 'Diyarbakır\'ın pirinçle doldurulmuş kuzu kaburgası.' },
  mirra: { ad: 'Mırra', tur: 'nefes', il: 47, ikon: '☕', aciklama: 'Mardin\'in küçük fincanda içilen acı ve koyu kahvesi.' },
  icli_kofte: { ad: 'İçli köfte', tur: 'can', il: 72, ikon: '🧆', aciklama: 'Batman\'ın bulgur kabuklu, içi kıymalı köftesi.' },
  perde_pilavi: { ad: 'Perde pilavı', tur: 'can', il: 56, ikon: '🍚', aciklama: 'Siirt\'in ince hamurla örtülen tavuklu pilavı.' },
  cudi_bali: { ad: 'Cudi balı', tur: 'nefes', il: 73, ikon: '🍯', teyit: false, aciklama: 'Şırnak Cudi Dağı yaylalarının balı.' },
  adiyaman_cig_koftesi: { ad: 'Adıyaman çiğ köftesi', tur: 'can', il: 2, ikon: '🧆', aciklama: 'Adıyaman\'ın bulgurlu, baharatlı çiğ köftesi.' },
  kilis_tava: { ad: 'Kilis tava', tur: 'can', il: 79, ikon: '🍳', aciklama: 'Kilis\'in tepside pişen kıymalı sebze tavası.' },

  // ── Doğu Anadolu ─────────────────────────────────────────
  cag_kebabi: { ad: 'Cağ kebabı', tur: 'can', il: 25, ikon: '🍢', aciklama: 'Erzurum\'un yatay şişte pişen kuzu kebabı.' },
  tulum_peyniri: { ad: 'Tulum peyniri', tur: 'can', il: 24, ikon: '🧀', aciklama: 'Erzincan\'ın tulumda olgunlaşan peyniri.' },
  kaz_eti: { ad: 'Kaz eti', tur: 'can', il: 36, ikon: '🍗', aciklama: 'Kars\'ın kış sofralarını süsleyen kaz eti.' },
  ardahan_bali: { ad: 'Ardahan balı', tur: 'nefes', il: 75, ikon: '🍯', aciklama: 'Ardahan yaylalarının çiçek balı.' },
  bozbas: { ad: 'Bozbaş', tur: 'can', il: 76, ikon: '🍲', aciklama: 'Iğdır\'ın nohutlu, etli sulu yemeği.' },
  abdigor_koftesi: { ad: 'Abdigör köftesi', tur: 'can', il: 4, ikon: '🍢', aciklama: 'Ağrı\'nın dövülerek yapılan haşlama köftesi.' },
  otlu_peynir: { ad: 'Otlu peynir', tur: 'can', il: 65, ikon: '🧀', aciklama: 'Van\'ın dağ otlarıyla yapılan peyniri.' },
  mus_corbasi: { ad: 'Muş çorbası', tur: 'can', il: 49, ikon: '🍲', teyit: false, aciklama: 'Muş\'un yöresel, doyurucu çorbası.' },
  buryan_kebabi: { ad: 'Büryan kebabı', tur: 'can', il: 13, ikon: '🍖', aciklama: 'Bitlis\'in kuyuda pişen kuzu kebabı.' },
  bingol_bali: { ad: 'Bingöl balı', tur: 'nefes', il: 12, ikon: '🍯', aciklama: 'Bingöl yaylalarının balı.' },
  orcik: { ad: 'Orcik', tur: 'nefes', il: 23, ikon: '🍬', aciklama: 'Elazığ\'ın cevizli, pekmezli şekerlemesi.' },
  malatya_kayisisi: { ad: 'Malatya kayısısı', tur: 'nefes', il: 44, ikon: '🍑', aciklama: 'Malatya\'nın güneşte kurutulan kayısısı.' },
  munzur_bali: { ad: 'Munzur balı', tur: 'nefes', il: 62, ikon: '🍯', teyit: false, aciklama: 'Tunceli Munzur dağlarının balı.' },
  hakkari_bali: { ad: 'Hakkari balı', tur: 'nefes', il: 30, ikon: '🍯', teyit: false, aciklama: 'Hakkari dağlarının çiçek balı.' },
};
