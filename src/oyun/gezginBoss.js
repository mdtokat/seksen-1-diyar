// Gezgin ve sürpriz bosslar. Saf oyun mantığı — DOM'a dokunmaz.
//
// İnlerde bekleyen bosslardan ayrı olarak, bölgenin boss yaratıkları (mini bosslar ve
// bölge bossları) haritada sıradan düşmanlar gibi belirip dolaşabilir; oyuncu yürürken
// de ara sıra hiç beklemediği bir anda önüne çıkabilir (sürpriz baskın).
//
// Bu yaratıkların gücü karaktere göre değil, bulundukları ilin haritasına göre belirlenir:
// seviyeleri ilin düşman seviyesinin üst ucundan başlar, statları boss yaratığın kendi
// çarpanlarıyla hesaplanır. İki tehlike düzeyi vardır:
//   'zorlu'     → kesilebilir: o ilin seviyesindeki bir yiğit iyi dövüşürse yener.
//   'kesilemez' → zırhı vuruşları neredeyse tümüyle savar; o ilin seviyesindeki bir yiğit
//                 yenemez, akıllıca olan uzaklaşıp kaçmaktır (ağır adımlıdır, peşini bırakır).
//                 İlin çok üstünde seviyeye ulaşmış bir yiğit ise onu da kesebilir.
// Gezgin bosslar ilerlemeyi etkilemez (bölge bossu yenilmiş sayılmaz, mühür çözülmez).
import { dusmanlar, DUSMAN_MENZILI } from '../veri/dusmanlar.js';
import { iller } from '../veri/iller.js';
import { dusmanStatlari } from './savas.js';
import { sans, sec, tamSayi } from './rastgele.js';
import { ilSeviyesi } from './rota.js';

export const GEZGIN_BOSS = {
  dogusSansi: 0.12, // yeni doğan düşmanın boss yaratık olma şansı
  kesilemezSansi: 0.35, // boss yaratığın kesilemez olma şansı
  surprizSansi: 0.015, // bekleme dolduktan sonra her adımda sürpriz baskın şansı
  surprizBekleme: 50, // iki sürpriz baskın arasındaki en az adım
  esyaSansi: 0.35, // zorlu bossu yenince bölgenin nadir eşyalarından biri düşer
};

// seviyeFarki: seviyenin ilin düşman seviyesinin üst ucundan fazlası ·
// carpan: boss yaratığın kendi statlarına (dusmanlar.js → carpan) ek çarpan. Gücü, aynı
// seviyedeki ilin en sert sıradan düşmanından az olamaz.
// Kesilemezliğin kaynağı zırhtır: savunması vuruşları söndürür.
// Değerler savaş motoruyla simülasyonla dengelendi: ilin üst seviyesindeki, yeteneklerini
// kullanan ama yemek yemeyen, eşyasız bir yiğit zorlu bossların kabaca %30–85'ini yener;
// kesilemezleri yenemez ama kaçmaya fırsat bulur (tests/gezginBoss.test.js).
export const TEHLIKE = {
  zorlu: { seviyeFarki: [0, 2], carpan: { can: 0.65, guc: 1, savunma: 1, ceviklik: 1 } },
  kesilemez: { seviyeFarki: [5, 8], carpan: { can: 1.5, guc: 1, savunma: 2.5, ceviklik: 1 } },
};

const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));

// Bölgenin haritada dolaşabilecek boss yaratıkları (Zülmet hariç).
export function bossYaratiklari(bolge) {
  return Object.keys(dusmanlar).filter((a) => {
    const d = dusmanlar[a];
    return d.bolge === bolge && (d.sinif === 'mini_boss' || d.sinif === 'bolge_bossu');
  });
}

// Boss yaratıktan, bulunduğu ilin haritasına göre güçlü bir gezgin boss üretir.
// tehlike verilmezse rastgele seçilir.
export function gezginBossOlustur(anahtar, plaka, rng, { tehlike = null } = {}) {
  const veri = dusmanlar[anahtar];
  if (!veri) throw new Error(`Bilinmeyen düşman: ${anahtar}`);
  const il = ilHaritasi.get(plaka);
  if (!il) throw new Error(`Bilinmeyen il: ${plaka}`);
  const t = tehlike ?? (sans(rng, GEZGIN_BOSS.kesilemezSansi) ? 'kesilemez' : 'zorlu');
  const seviye = ilSeviyesi(plaka)[1] + tamSayi(rng, ...TEHLIKE[t].seviyeFarki);
  const s = dusmanStatlari(anahtar, seviye);
  const c = TEHLIKE[t].carpan;
  const can = Math.round(s.can * c.can);
  // Canı bol ama vuruşu hafif bölge bossları da ilin en sert sıradan düşmanı kadar vurur
  const ilinEnSerti = Math.max(...il.dusmanlar.map((a) => dusmanStatlari(a, seviye).guc));
  return {
    anahtar,
    ad: veri.ad,
    ikon: veri.ikon,
    tur: veri.tur,
    sinif: veri.sinif,
    takipci: false,
    menzil: DUSMAN_MENZILI[veri.tur] ?? 1,
    gezgin: true,
    tehlike: t,
    seviye,
    canEnCok: can,
    can,
    guc: Math.max(Math.round(s.guc * c.guc), ilinEnSerti),
    savunma: Math.round(s.savunma * c.savunma),
    ceviklik: Math.round(s.ceviklik * c.ceviklik),
  };
}

// İlin bölgesindeki boss yaratıklarından (`haric` dışındakilerden) rastgele biri; yoksa null.
export function gezginBossUret(plaka, rng, { haric = [], ...secenekler } = {}) {
  const il = ilHaritasi.get(plaka);
  const havuz = bossYaratiklari(il.bolge).filter((a) => !haric.includes(a));
  return havuz.length ? gezginBossOlustur(sec(rng, havuz), plaka, rng, secenekler) : null;
}
