// Arasta (yemek) ve Ahi esnafı (silah, zırh) alışverişi. Saf oyun mantığı — DOM'a dokunmaz.
import { iller } from '../veri/iller.js';
import { bolgeler } from '../veri/bolgeler.js';
import { esyalar } from '../veri/esyalar.js';
import { yemekFiyati, yemekEkle } from './envanter.js';
import { kusaniliMi } from './ekipman.js';

export const SATIS_ORANI = 0.5; // Ahi, eşyayı fiyatının yarısına geri alır
export const ARASTA_KOMSU_YEMEGI = 2;

const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const bolgeHaritasi = new Map(bolgeler.map((b) => [b.anahtar, b]));

// ── Arasta ───────────────────────────────────────────────

// İlin arastasında satılan yemekler: ilin kendi yemeği ve komşu illerden (plaka
// sırasıyla) iki yemek.
export function arastaMallari(plaka) {
  const il = ilHaritasi.get(plaka);
  const komsular = [...il.komsular].sort((a, b) => a - b).slice(0, ARASTA_KOMSU_YEMEGI);
  return [...new Set([il.yemek, ...komsular.map((p) => ilHaritasi.get(p).yemek)])];
}

// neden: 'satilmiyor' | 'akce_yetersiz' | 'heybe_dolu'
export function yemekAlKontrol(durum, anahtar) {
  if (!arastaMallari(durum.konum).includes(anahtar)) return { olur: false, neden: 'satilmiyor' };
  if (durum.akce < yemekFiyati(anahtar)) return { olur: false, neden: 'akce_yetersiz' };
  if (yemekEkle(durum.heybe, anahtar).eklenen === 0) return { olur: false, neden: 'heybe_dolu' };
  return { olur: true };
}

export function yemekAl(durum, anahtar) {
  if (!yemekAlKontrol(durum, anahtar).olur) return durum;
  return {
    ...durum,
    akce: durum.akce - yemekFiyati(anahtar),
    heybe: yemekEkle(durum.heybe, anahtar).heybe,
  };
}

// ── Ahi esnafı ───────────────────────────────────────────

export function ahiVarMi(plaka) {
  const il = ilHaritasi.get(plaka);
  return bolgeHaritasi.get(il.bolge).ahiIlleri.includes(plaka);
}

// Ahi dükkânında satılan eşyalar: bölgenin sıradan ve nadir eşyaları.
// Efsanevi eşyalar satılmaz; yalnızca bosslar düşürür.
export function ahiMallari(plaka) {
  if (!ahiVarMi(plaka)) return [];
  const bolge = ilHaritasi.get(plaka).bolge;
  return Object.keys(esyalar).filter((a) => esyalar[a].bolge === bolge && esyalar[a].nadirlik !== 'efsanevi');
}

export function satisFiyati(anahtar) {
  return Math.floor(esyalar[anahtar].fiyat * SATIS_ORANI);
}

// neden: 'satilmiyor' | 'zaten_var' | 'akce_yetersiz'
export function esyaAlKontrol(durum, anahtar) {
  if (!ahiMallari(durum.konum).includes(anahtar)) return { olur: false, neden: 'satilmiyor' };
  if ((durum.esyalar ?? []).includes(anahtar)) return { olur: false, neden: 'zaten_var' };
  if (durum.akce < esyalar[anahtar].fiyat) return { olur: false, neden: 'akce_yetersiz' };
  return { olur: true };
}

export function esyaAl(durum, anahtar) {
  if (!esyaAlKontrol(durum, anahtar).olur) return durum;
  return { ...durum, akce: durum.akce - esyalar[anahtar].fiyat, esyalar: [...(durum.esyalar ?? []), anahtar] };
}

// neden: 'dukkan_yok' | 'sahip_degil' | 'kusanili'
export function esyaSatKontrol(durum, anahtar) {
  if (!ahiVarMi(durum.konum)) return { olur: false, neden: 'dukkan_yok' };
  if (!(durum.esyalar ?? []).includes(anahtar)) return { olur: false, neden: 'sahip_degil' };
  if (kusaniliMi(durum, anahtar)) return { olur: false, neden: 'kusanili' };
  return { olur: true };
}

export function esyaSat(durum, anahtar) {
  if (!esyaSatKontrol(durum, anahtar).olur) return durum;
  return {
    ...durum,
    akce: durum.akce + satisFiyati(anahtar),
    esyalar: durum.esyalar.filter((a) => a !== anahtar),
  };
}
