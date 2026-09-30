// Keşif, karşılaşma üretimi, arınma ve ganimet. Saf oyun mantığı — DOM'a dokunmaz.
import { iller } from '../veri/iller.js';
import { dusmanlar, SINIF_XP_CARPANI } from '../veri/dusmanlar.js';
import { dusmanOlustur, savasSonucunuUygula } from './savas.js';
import { yemekEkle } from './envanter.js';
import { bossYenildi, zulmetYenildi, MINI_BOSS_ARINMA_ESIGI } from './ilerleme.js';
import { bolgeler } from '../veri/bolgeler.js';
import { esyalar } from '../veri/esyalar.js';
import { HAYIR } from '../veri/itibar.js';
import { gorevler } from '../veri/gorevler.js';
import { hayirEkle } from './itibar.js';
import { zaferIlerlemesi, gorevIlerlemesi, hazirGorevler } from './gorevler.js';
import { aralik, sans, sec, tamSayi } from './rastgele.js';
import { GEZGIN_BOSS } from './gezginBoss.js';

export const ARINMA_ARTISI = [12, 18]; // zafer başına % (iki uç dahil)
export const YEMEK_DUSME_SANSI = 0.3;

const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));

// Savaş sonucu istatistiklere işlenir: zafer ve bayılma sayıları; bayılmalar
// bölge bölge de tutulur ("Yiğit" başarımı için).
export function istatistikYaz(durum, sonuc, bolge) {
  const i = durum.istatistik ?? { zafer: 0, bayilma: 0, bolgeBayilma: {} };
  if (sonuc === 'zafer') return { ...durum, istatistik: { ...i, zafer: i.zafer + 1 } };
  if (sonuc !== 'yenilgi') return durum;
  return {
    ...durum,
    istatistik: { ...i, bayilma: i.bayilma + 1, bolgeBayilma: { ...i.bolgeBayilma, [bolge]: (i.bolgeBayilma[bolge] ?? 0) + 1 } },
  };
}

// İlin düşman havuzundan ve seviye aralığından rastgele bir düşman üretir.
export function karsilasmaUret(plaka, rng) {
  const il = ilHaritasi.get(plaka);
  const anahtar = sec(rng, il.dusmanlar);
  const seviye = tamSayi(rng, il.seviye[0], il.seviye[1]);
  return dusmanOlustur(anahtar, seviye);
}

// İlin arınmasını %12–18 artırır, %100'de durur. Sonuç: { durum, artis, yuzde, arindi }.
// arindi: bu zaferle il %100'e ulaştıysa true.
export function arinmaArtir(durum, plaka, rng) {
  const once = durum.arinma[plaka] ?? 0;
  const yuzde = Math.min(100, once + tamSayi(rng, ARINMA_ARTISI[0], ARINMA_ARTISI[1]));
  return {
    durum: { ...durum, arinma: { ...durum.arinma, [plaka]: yuzde } },
    artis: yuzde - once,
    yuzde,
    arindi: once < 100 && yuzde === 100,
  };
}

// Zafer ganimeti: akçe ve belli bir şansla ilin yöresel yemeği.
// Akçe: round((3 + sv × 2) × rnd(0.8–1.2) × sınıf çarpanı).
// XP ganimeti savaş motorunda hesaplanır (savas.js → xpOdulu).
// Gezgin bossların çarpanı sınıflarından bağımsızdır (SINIF_XP_CARPANI.gezgin).
export function ganimetUret(dusman, plaka, rng) {
  const carpan = dusman.gezgin ? SINIF_XP_CARPANI.gezgin : SINIF_XP_CARPANI[dusmanlar[dusman.anahtar].sinif];
  const akce = Math.round((3 + dusman.seviye * 2) * aralik(rng, 0.8, 1.2) * carpan);
  const yemek = sans(rng, YEMEK_DUSME_SANSI) ? ilHaritasi.get(plaka).yemek : null;
  return { akce, yemek };
}

// Bossların garanti eşya ganimeti (plan.md Faz 8): bölge bossu bölgenin efsanevi,
// mini boss nadir eşyalarından, oyuncunun sınıfına uygun ve henüz sahip olmadığı
// birini düşürür. Uygun eşya kalmadıysa null.
export function bossGanimeti(durum, bolge, nadirlik, rng) {
  const adaylar = Object.keys(esyalar).filter((a) => {
    const e = esyalar[a];
    return e.bolge === bolge && e.nadirlik === nadirlik
      && (!e.sinif || e.sinif === durum.oyuncu.sinif)
      && !(durum.esyalar ?? []).includes(a);
  });
  return adaylar.length ? sec(rng, adaylar) : null;
}

// Keşif savaşının sonucunu uygular: savaş sonucu (XP, seviye, bayılma) +
// zaferde arınma artışı, akçe, yemek, Hayır puanı ve görev ilerlemesi. Sonuç: { durum, ozet }.
// ozet, savasSonucunuUygula özetine ek olarak:
//   { arinmaArtisi, arinma, arindi, akce, yemek, yemekSigmadi,
//     bossYenildi (bölge anahtarı | null), acilanBolge, miniBossYenildi, miniBossBelirdi,
//     esya (düşen eşyanın anahtarı | null), hayir (kazanılan Hayır puanı),
//     gorevIlerlemesi ([{ anahtar, mevcut, hedef }]), hazirOlanGorevler ([anahtar]),
//     zulmetYenildi, gezginBoss ('zorlu' | 'kesilemez' | null) }
// Gezgin bosslar (gezginBoss.js) ilerlemeyi etkilemez: yenilmeleri bölge bossunu ya da
// mini bossu yenilmiş saydırmaz. Zorlu olanlar bazen bölgenin nadir eşyalarından birini,
// kesilemez olanlar (yenilebilirse) efsanevi bir eşyayı düşürür.
// İstatistikler (zafer ve bayılma sayıları, bölge bölge bayılmalar) de burada tutulur.
export function kesifSonucunuUygula(durum, savas, plaka, rng) {
  const r = savasSonucunuUygula(durum, savas);
  if (!r.ozet) return r;
  let yeni = istatistikYaz(r.durum, savas.sonuc, ilHaritasi.get(plaka).bolge);
  const ozet = {
    ...r.ozet,
    arinmaArtisi: 0,
    arinma: yeni.arinma[plaka] ?? 0,
    arindi: false,
    akce: 0,
    yemek: null,
    yemekSigmadi: false,
    bossYenildi: null,
    acilanBolge: null,
    miniBossYenildi: false,
    miniBossBelirdi: null,
    esya: null,
    hayir: 0,
    gorevIlerlemesi: [],
    hazirOlanGorevler: [],
    zulmetYenildi: false,
    gezginBoss: savas.dusman.gezgin ? savas.dusman.tehlike : null,
  };
  if (savas.sonuc !== 'zafer') return { durum: yeni, ozet };
  const onceHazir = new Set(hazirGorevler(durum));
  const onceArinma = yeni.arinma[plaka] ?? 0;

  const a = arinmaArtir(yeni, plaka, rng);
  yeni = a.durum;
  Object.assign(ozet, { arinmaArtisi: a.artis, arinma: a.yuzde, arindi: a.arindi });

  const g = ganimetUret(savas.dusman, plaka, rng);
  yeni = { ...yeni, akce: (yeni.akce ?? 0) + g.akce };
  ozet.akce = g.akce;
  if (g.yemek) {
    const e = yemekEkle(yeni.heybe, g.yemek);
    yeni = { ...yeni, heybe: e.heybe };
    ozet.yemek = g.yemek;
    ozet.yemekSigmadi = e.eklenen === 0;
  }

  const gezgin = Boolean(savas.dusman.gezgin);
  const sinif = gezgin ? 'gezgin' : dusmanlar[savas.dusman.anahtar].sinif;
  if (gezgin) {
    const kesilemez = savas.dusman.tehlike === 'kesilemez';
    if (kesilemez || sans(rng, GEZGIN_BOSS.esyaSansi)) {
      const esya = bossGanimeti(yeni, dusmanlar[savas.dusman.anahtar].bolge, kesilemez ? 'efsanevi' : 'nadir', rng);
      if (esya) {
        yeni = { ...yeni, esyalar: [...(yeni.esyalar ?? []), esya] };
        ozet.esya = esya;
      }
    }
  }
  if (sinif === 'bolge_bossu' || sinif === 'mini_boss') {
    const esya = bossGanimeti(yeni, dusmanlar[savas.dusman.anahtar].bolge, sinif === 'bolge_bossu' ? 'efsanevi' : 'nadir', rng);
    if (esya) {
      yeni = { ...yeni, esyalar: [...(yeni.esyalar ?? []), esya] };
      ozet.esya = esya;
    }
  }
  if (sinif === 'bolge_bossu') {
    const b = bossYenildi(yeni, dusmanlar[savas.dusman.anahtar].bolge);
    yeni = b.durum;
    ozet.bossYenildi = dusmanlar[savas.dusman.anahtar].bolge;
    ozet.acilanBolge = b.acilanBolge;
  } else if (sinif === 'mini_boss') {
    yeni = { ...yeni, yenilenMiniBosslar: [...new Set([...(yeni.yenilenMiniBosslar ?? []), plaka])] };
    ozet.miniBossYenildi = true;
  } else if (sinif === 'final') {
    yeni = zulmetYenildi(yeni);
    ozet.zulmetYenildi = true;
  }

  // İlin arınması eşiği geçtiyse ve bu ilde mini boss varsa ortaya çıkar
  const bolge = bolgeler.find((b) => b.anahtar === ilHaritasi.get(plaka).bolge);
  if (onceArinma <= MINI_BOSS_ARINMA_ESIGI && ozet.arinma > MINI_BOSS_ARINMA_ESIGI
      && bolge.miniBossIlleri.includes(plaka) && !(yeni.yenilenMiniBosslar ?? []).includes(plaka)) {
    ozet.miniBossBelirdi = bolge.miniBoss;
  }

  // Mazluma yardım Hayır puanı kazandırır (plan.md Faz 9)
  ozet.hayir = (ozet.arindi ? HAYIR.ilArindi : 0)
    + (sinif === 'mini_boss' ? HAYIR.miniBoss : 0)
    + (sinif === 'bolge_bossu' ? HAYIR.bolgeBossu : 0)
    + (sinif === 'final' ? HAYIR.final : 0);
  yeni = hayirEkle(yeni, ozet.hayir);

  const z = zaferIlerlemesi(yeni, savas.dusman.anahtar);
  yeni = z.durum;
  ozet.gorevIlerlemesi = z.ilerleyenler.map((anahtar) => ({ anahtar, ...gorevIlerlemesi(yeni, anahtar) }));
  // Ulaştırma görevleri heybeye bağlıdır; savaşta bulunan yemek onları "hazır" saydırmasın
  ozet.hazirOlanGorevler = hazirGorevler(yeni).filter((a) => !onceHazir.has(a) && gorevler[a].tur !== 'ulastir');
  return { durum: yeni, ozet };
}
