// Gezgin ve sürpriz bosslar. Saf oyun mantığı — DOM'a dokunmaz.
//
// İnlerde bekleyen bosslardan ayrı olarak, bölgenin boss yaratıkları (mini bosslar ve
// bölge bossları) haritada sıradan düşmanlar gibi belirip dolaşabilir; oyuncu yürürken
// de ara sıra hiç beklemediği bir anda önüne çıkabilir (sürpriz baskın).
//
// Bu yaratıkların gücü oyuncunun o anki gücünden fazladır. İki tehlike düzeyi vardır:
//   'zorlu'     → kesilebilir: oyuncudan biraz güçlüdür, iyi dövüşülürse yenilir.
//   'kesilemez' → zırhı oyuncunun vuruşlarını neredeyse tümüyle savar; yenmek pek mümkün
//                 değildir, akıllıca olan kaçmaktır. Bu yüzden gezgin bosslardan kaçılabilir.
// Gezgin bosslar ilerlemeyi etkilemez (bölge bossu yenilmiş sayılmaz, mühür çözülmez).
import { dusmanlar } from '../veri/dusmanlar.js';
import { statlar, acikYetenekler } from './karakter.js';
import { aralik, sans, sec, tamSayi } from './rastgele.js';

export const GEZGIN_BOSS = {
  dogusSansi: 0.12, // yeni doğan düşmanın boss yaratık olma şansı
  kesilemezSansi: 0.35, // boss yaratığın kesilemez olma şansı
  surprizSansi: 0.015, // bekleme dolduktan sonra her adımda sürpriz baskın şansı
  surprizBekleme: 50, // iki sürpriz baskın arasındaki en az adım
  xpCarpani: 3, // sıradan düşmana göre XP çarpanı
  akceCarpani: 3,
  esyaSansi: 0.35, // zorlu bossu yenince bölgenin nadir eşyalarından biri düşer
};

// Güç, oyuncunun o anki statlarından türetilir; böylece her seviyede aynı ölçüde zorludur.
// oran: bossun oyuncudan ne kadar güçlü olduğu (gücü en az oyuncunun gücü × oran) ·
// dayaniklilik: oyuncunun en sert vuruşundan kaçına dayandığı (× oran) · yikim: oyuncuyu kaç
// vuruşta yıktığı (÷ oran) · zirh: savunmasının oyuncunun gücüne en az oranı (kesilemezlik
// buradan gelir: vuruşlar zırhta söner) · can: canının oyuncunun canına en az oranı ·
// seviyeFarki: rozetteki seviyenin oyuncunun seviyesinden fazlası.
// Değerler savaş motoruyla simülasyonla dengelendi: tam canla, yeteneklerini kullanan ama
// yemek yemeyen bir oyuncu zorlu bossların kabaca yarısını yener (kendini iyileştiren
// Alperen daha çoğunu); kesilemezleri ise yenemez ama kaçmaya birkaç tur fırsatı bulur
// (tests/gezginBoss.test.js).
export const TEHLIKE = {
  zorlu: { oran: [1.1, 1.3], dayaniklilik: 4.5, yikim: 6, zirh: 0, can: 0, seviyeFarki: [1, 3] },
  kesilemez: { oran: [1.5, 1.8], dayaniklilik: 4.5, yikim: 11, zirh: 2.6, can: 3, seviyeFarki: [6, 10] },
};

// Bölgenin haritada dolaşabilecek boss yaratıkları (Zülmet hariç).
export function bossYaratiklari(bolge) {
  return Object.keys(dusmanlar).filter((a) => {
    const d = dusmanlar[a];
    return d.bolge === bolge && (d.sinif === 'mini_boss' || d.sinif === 'bolge_bossu');
  });
}

// Oyuncunun güncel statlarına göre gezgin bossun statları.
function gezginStatlari(oyuncu, tehlike, oran) {
  const s = statlar(oyuncu);
  const t = TEHLIKE[tehlike];
  const savunma = Math.round(Math.max(s.savunma * oran, s.guc * t.zirh));
  // Oyuncunun en sert vuruşu (açık yeteneklerinin en büyük çarpanıyla)
  const carpan = Math.max(1, ...acikYetenekler(oyuncu).filter((y) => y.etki === 'hasar').map((y) => y.carpan));
  const oyuncuVurusu = Math.max(1, s.guc * carpan - savunma * 0.5);
  const can = Math.round(Math.max(oyuncuVurusu * t.dayaniklilik * oran, s.can * t.can));
  return {
    canEnCok: can,
    can,
    guc: Math.round(Math.max(s.guc * oran, (s.can * oran) / t.yikim + s.savunma * 0.5)),
    savunma,
    ceviklik: s.ceviklik, // aynı çeviklik: kaçma şansı %35 civarında kalır
  };
}

// Boss yaratıktan, oyuncunun o anki gücünü aşan bir gezgin boss üretir.
// tehlike verilmezse rastgele seçilir.
export function gezginBossOlustur(anahtar, oyuncu, rng, { tehlike = null } = {}) {
  const veri = dusmanlar[anahtar];
  if (!veri) throw new Error(`Bilinmeyen düşman: ${anahtar}`);
  const t = tehlike ?? (sans(rng, GEZGIN_BOSS.kesilemezSansi) ? 'kesilemez' : 'zorlu');
  const oran = Math.round(aralik(rng, ...TEHLIKE[t].oran) * 100) / 100;
  const seviyeFarki = tamSayi(rng, ...TEHLIKE[t].seviyeFarki);
  return {
    anahtar,
    ad: veri.ad,
    ikon: veri.ikon,
    tur: veri.tur,
    sinif: veri.sinif,
    takipci: false,
    gezgin: true,
    tehlike: t,
    oran,
    seviyeFarki,
    seviye: oyuncu.seviye + seviyeFarki,
    ...gezginStatlari(oyuncu, t, oran),
  };
}

// Savaş başlarken statlar oyuncunun o anki gücüne göre yeniden hesaplanır
// (boss haritada dolaşırken oyuncu seviye atlamış ya da eşya kuşanmış olabilir).
export function gezginBossOlcekle(dusman, oyuncu) {
  if (!dusman.gezgin) return dusman;
  return {
    ...dusman,
    seviye: oyuncu.seviye + dusman.seviyeFarki,
    ...gezginStatlari(oyuncu, dusman.tehlike, dusman.oran),
  };
}

// Bölgenin boss yaratıklarından (`haric` dışındakilerden) rastgele biri; yoksa null.
export function gezginBossUret(bolge, oyuncu, rng, { haric = [], ...secenekler } = {}) {
  const havuz = bossYaratiklari(bolge).filter((a) => !haric.includes(a));
  return havuz.length ? gezginBossOlustur(sec(rng, havuz), oyuncu, rng, secenekler) : null;
}
