// Heybe ve yemekler. Saf oyun mantığı — DOM'a dokunmaz.
import { yemekler, YEMEK_TABANI } from '../veri/yemekler.js';
import { iller } from '../veri/iller.js';
import { bolgeler } from '../veri/bolgeler.js';

function bolgeCarpani(anahtar) {
  const il = iller.find((i) => i.plaka === yemekler[anahtar].il);
  return bolgeler.find((b) => b.anahtar === il.bolge).yemekCarpani;
}

// Yemeğin yenilediği can ya da nefes miktarı (plan.md Bölüm 7).
export function yemekGucu(anahtar) {
  return Math.round(YEMEK_TABANI[yemekler[anahtar].tur].guc * bolgeCarpani(anahtar));
}

// Yemeğin akçe cinsinden fiyatı (plan.md Bölüm 7).
export function yemekFiyati(anahtar) {
  return Math.round(YEMEK_TABANI[yemekler[anahtar].tur].fiyat * bolgeCarpani(anahtar));
}
