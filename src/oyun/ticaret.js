// Arasta (yemek) ve Ahi esnafı (silah, zırh) alışverişi. Saf oyun mantığı — DOM'a dokunmaz.
import { iller } from '../veri/iller.js';
import { bolgeler } from '../veri/bolgeler.js';
import { esyalar } from '../veri/esyalar.js';
import { esyaBilgisi } from './rota.js';
import { yemekFiyati, yemekEkle } from './envanter.js';
import { kusaniliMi } from './ekipman.js';
import { indirimliFiyat } from './itibar.js';
import { rastgeleUreteci, sec } from './rastgele.js';

export const SATIS_ORANI = 0.5; // Ahi, eşyayı fiyatının yarısına geri alır
export const ARASTA_KOMSU_YEMEGI = 2;
export const AHI_STOK = 6; // bir Ahi tezgâhında aynı anda bulunan eşya sayısı
export const AHI_DONEM_ZAFERI = 4; // tezgâh kaç zaferde bir başka mallarla dolar

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

// Arastadaki fiyat: yemeğin fiyatı, oyuncunun itibarına göre indirimli (plan.md Faz 9).
export function arastaFiyati(durum, anahtar) {
  return indirimliFiyat(durum, yemekFiyati(anahtar));
}

// neden: 'satilmiyor' | 'akce_yetersiz' | 'heybe_dolu'
export function yemekAlKontrol(durum, anahtar) {
  if (!arastaMallari(durum.konum).includes(anahtar)) return { olur: false, neden: 'satilmiyor' };
  if (durum.akce < arastaFiyati(durum, anahtar)) return { olur: false, neden: 'akce_yetersiz' };
  if (yemekEkle(durum.heybe, anahtar).eklenen === 0) return { olur: false, neden: 'heybe_dolu' };
  return { olur: true };
}

export function yemekAl(durum, anahtar) {
  if (!yemekAlKontrol(durum, anahtar).olur) return durum;
  return {
    ...durum,
    akce: durum.akce - arastaFiyati(durum, anahtar),
    heybe: yemekEkle(durum.heybe, anahtar).heybe,
  };
}

// ── Ahi esnafı ───────────────────────────────────────────

export function ahiVarMi(plaka) {
  const il = ilHaritasi.get(plaka);
  return bolgeHaritasi.get(il.bolge).ahiIlleri.includes(plaka);
}

// Bölgenin Ahi esnafının satabileceği bütün eşyalar: sıradan ve nadir olanlar.
// Efsanevi eşyalar Ahi'de satılmaz; onları yalnızca bosslar düşürür (ve seyyar tüccar
// nadiren getirir, bkz. tuccar.js).
export function ahiTumMallari(plaka) {
  if (!ahiVarMi(plaka)) return [];
  const bolge = ilHaritasi.get(plaka).bolge;
  return Object.keys(esyalar).filter((a) => esyalar[a].bolge === bolge && esyalar[a].nadirlik !== 'efsanevi');
}

// Pazar dönemi: oyuncunun her `AHI_DONEM_ZAFERI` zaferinde bir artar. Ahi tezgâhları
// dönem değişince yeniden dizilir; kayda yeni alan gerekmez (zaferler zaten sayılıyor).
export function pazarDonemi(durum) {
  return Math.floor((durum.istatistik?.zafer ?? 0) / AHI_DONEM_ZAFERI);
}

// Yeni döneme kalan zafer sayısı (1 … AHI_DONEM_ZAFERI).
export function pazarYenilenmesineKalan(durum) {
  return AHI_DONEM_ZAFERI - ((durum.istatistik?.zafer ?? 0) % AHI_DONEM_ZAFERI);
}

const stokTohumu = (plaka, donem) => Math.imul(plaka * 1000 + donem + 1, 2654435761) >>> 0;

// Ahi tezgâhı: ilin `donem`indeki malları. Her tezgâh, bölgenin eşyalarından `AHI_STOK`
// tanesini taşır; seçim (plaka, dönem) çiftinden türetilir: aynı ilde, aynı dönemde hep
// aynı, başka il ya da başka dönemde başka. Her sınıf için en az bir silah ve en az bir
// zırh ya da kuşak her zaman bulunur, böylece hiçbir yiğit eli boş dönmez.
export function ahiMallari(plaka, donem = 0) {
  const havuz = ahiTumMallari(plaka);
  if (havuz.length <= AHI_STOK) return havuz;
  const rng = rastgeleUreteci(stokTohumu(plaka, donem));
  const gruplar = new Map();
  for (const a of havuz) {
    const e = esyaBilgisi(a);
    const grup = e.yuva === 'silah' ? e.sinif : 'giyim';
    gruplar.set(grup, [...(gruplar.get(grup) ?? []), a]);
  }
  const secilen = [...gruplar.values()].map((g) => sec(rng, g));
  const kalan = havuz.filter((a) => !secilen.includes(a));
  while (secilen.length < AHI_STOK && kalan.length) secilen.push(...kalan.splice(Math.floor(rng() * kalan.length), 1));
  return havuz.filter((a) => secilen.includes(a)); // veri sırası korunur
}

export function satisFiyati(anahtar) {
  return Math.floor(esyaBilgisi(anahtar).fiyat * SATIS_ORANI);
}

// neden: 'satilmiyor' | 'zaten_var' | 'akce_yetersiz'
export function esyaAlKontrol(durum, anahtar) {
  if (!ahiMallari(durum.konum, pazarDonemi(durum)).includes(anahtar)) return { olur: false, neden: 'satilmiyor' };
  if ((durum.esyalar ?? []).includes(anahtar)) return { olur: false, neden: 'zaten_var' };
  if (durum.akce < esyaBilgisi(anahtar).fiyat) return { olur: false, neden: 'akce_yetersiz' };
  return { olur: true };
}

export function esyaAl(durum, anahtar) {
  if (!esyaAlKontrol(durum, anahtar).olur) return durum;
  return { ...durum, akce: durum.akce - esyaBilgisi(anahtar).fiyat, esyalar: [...(durum.esyalar ?? []), anahtar] };
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
