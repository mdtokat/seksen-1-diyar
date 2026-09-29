// Keşif, karşılaşma üretimi, arınma ve ganimet. Saf oyun mantığı — DOM'a dokunmaz.
import { iller } from '../veri/iller.js';
import { dusmanlar, SINIF_XP_CARPANI } from '../veri/dusmanlar.js';
import { dusmanOlustur, savasSonucunuUygula } from './savas.js';
import { yemekEkle } from './envanter.js';
import { bossYenildi, MINI_BOSS_ARINMA_ESIGI } from './ilerleme.js';
import { bolgeler } from '../veri/bolgeler.js';
import { aralik, sans, sec, tamSayi } from './rastgele.js';

export const ARINMA_ARTISI = [8, 12]; // zafer başına % (iki uç dahil)
export const YEMEK_DUSME_SANSI = 0.3;

const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));

// İlin düşman havuzundan ve seviye aralığından rastgele bir düşman üretir.
export function karsilasmaUret(plaka, rng) {
  const il = ilHaritasi.get(plaka);
  const anahtar = sec(rng, il.dusmanlar);
  const seviye = tamSayi(rng, il.seviye[0], il.seviye[1]);
  return dusmanOlustur(anahtar, seviye);
}

// İlin arınmasını %8–12 artırır, %100'de durur. Sonuç: { durum, artis, yuzde, arindi }.
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
export function ganimetUret(dusman, plaka, rng) {
  const carpan = SINIF_XP_CARPANI[dusmanlar[dusman.anahtar].sinif];
  const akce = Math.round((3 + dusman.seviye * 2) * aralik(rng, 0.8, 1.2) * carpan);
  const yemek = sans(rng, YEMEK_DUSME_SANSI) ? ilHaritasi.get(plaka).yemek : null;
  return { akce, yemek };
}

// Keşif savaşının sonucunu uygular: savaş sonucu (XP, seviye, bayılma) +
// zaferde arınma artışı, akçe ve yemek. Sonuç: { durum, ozet }.
// ozet, savasSonucunuUygula özetine ek olarak:
//   { arinmaArtisi, arinma, arindi, akce, yemek, yemekSigmadi,
//     bossYenildi (bölge anahtarı | null), acilanBolge, miniBossYenildi, miniBossBelirdi }
export function kesifSonucunuUygula(durum, savas, plaka, rng) {
  const r = savasSonucunuUygula(durum, savas);
  if (!r.ozet) return r;
  let yeni = r.durum;
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
  };
  if (savas.sonuc !== 'zafer') return { durum: yeni, ozet };
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

  const sinif = dusmanlar[savas.dusman.anahtar].sinif;
  if (sinif === 'bolge_bossu') {
    const b = bossYenildi(yeni, dusmanlar[savas.dusman.anahtar].bolge);
    yeni = b.durum;
    ozet.bossYenildi = dusmanlar[savas.dusman.anahtar].bolge;
    ozet.acilanBolge = b.acilanBolge;
  } else if (sinif === 'mini_boss') {
    yeni = { ...yeni, yenilenMiniBosslar: [...new Set([...(yeni.yenilenMiniBosslar ?? []), plaka])] };
    ozet.miniBossYenildi = true;
  }

  // İlin arınması eşiği geçtiyse ve bu ilde mini boss varsa ortaya çıkar
  const bolge = bolgeler.find((b) => b.anahtar === ilHaritasi.get(plaka).bolge);
  if (onceArinma <= MINI_BOSS_ARINMA_ESIGI && ozet.arinma > MINI_BOSS_ARINMA_ESIGI
      && bolge.miniBossIlleri.includes(plaka) && !(yeni.yenilenMiniBosslar ?? []).includes(plaka)) {
    ozet.miniBossBelirdi = bolge.miniBoss;
  }
  return { durum: yeni, ozet };
}
