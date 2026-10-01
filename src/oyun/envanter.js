// Heybe ve yemekler. Saf oyun mantığı — DOM'a dokunmaz.
// Heybe, yuvalardan oluşan bir dizidir: [{ anahtar, adet }].
// Aynı yemekler bir yuvada üst üste biner; bir yuva en fazla YIGIN_EN_FAZLA
// yemek alır, fazlası yeni yuvaya geçer.
import { yemekler, YEMEK_TABANI } from '../veri/yemekler.js';
import { iller } from '../veri/iller.js';
import { statlar } from './karakter.js';
import { yemekCarpani, klasikMi, bolgeIciMesafeler } from './rota.js';

export const HEYBE_YUVA = 20;
export const YIGIN_EN_FAZLA = 10;

// Klasik rotanın (İstanbul'dan başlayan) başlangıç heybesi (plan.md Faz 4).
export const BASLANGIC_HEYBESI = [
  { anahtar: 'balik_ekmek', adet: 3 },
  { anahtar: 'hosmerim', adet: 2 },
];

const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));

// Yeni oyunun başlangıç heybesi: başlangıç ilinin yöresel yemeğinden 3, bölgeden öbür
// türde (can yerine nefes ya da tersi) bir yemekten 2 tane. Öbür tür yemek başlangıç
// iline en yakın (bölge içinden yürüyerek) ilden seçilir; eşitlikte plaka sırası geçerli.
export function baslangicHeybesi(rota) {
  if (klasikMi(rota)) return BASLANGIC_HEYBESI.map((y) => ({ ...y }));
  const il = ilHaritasi.get(rota.baslangic);
  const tur = yemekler[il.yemek].tur;
  const uzaklik = bolgeIciMesafeler(iller, { anahtar: il.bolge, giris: il.plaka });
  const adaylar = Object.keys(uzaklik).map(Number).sort((a, b) => uzaklik[a] - uzaklik[b] || a - b).map((p) => ilHaritasi.get(p));
  const ikinci = adaylar.find((k) => yemekler[k.yemek].tur !== tur);
  return [{ anahtar: il.yemek, adet: 3 }, ...(ikinci ? [{ anahtar: ikinci.yemek, adet: 2 }] : [])];
}

// Yemeğin gücü, ilinin bölgesinin rotadaki kademesine göre artar.
function bolgeCarpani(anahtar) {
  return yemekCarpani(ilHaritasi.get(yemekler[anahtar].il).bolge);
}

// Yemeğin yenilediği can ya da nefes miktarı (plan.md Bölüm 7).
export function yemekGucu(anahtar) {
  return Math.round(YEMEK_TABANI[yemekler[anahtar].tur].guc * bolgeCarpani(anahtar));
}

// Yemeğin akçe cinsinden fiyatı (plan.md Bölüm 7).
export function yemekFiyati(anahtar) {
  return Math.round(YEMEK_TABANI[yemekler[anahtar].tur].fiyat * bolgeCarpani(anahtar));
}

// ── Heybe ────────────────────────────────────────────────

export function yemekAdedi(heybe, anahtar) {
  return heybe.reduce((t, y) => (y.anahtar === anahtar ? t + y.adet : t), 0);
}

// Heybeye yemek ekler: önce yarım yuvaları doldurur, sonra boş yuva açar.
// Sonuç: { heybe, eklenen, sigmayan }.
export function yemekEkle(heybe, anahtar, adet = 1) {
  if (!yemekler[anahtar] || adet < 1) return { heybe, eklenen: 0, sigmayan: Math.max(0, adet) };
  let kalan = adet;
  const yeni = heybe.map((y) => {
    if (y.anahtar !== anahtar || kalan === 0 || y.adet >= YIGIN_EN_FAZLA) return y;
    const eklenecek = Math.min(kalan, YIGIN_EN_FAZLA - y.adet);
    kalan -= eklenecek;
    return { ...y, adet: y.adet + eklenecek };
  });
  while (kalan > 0 && yeni.length < HEYBE_YUVA) {
    const eklenecek = Math.min(kalan, YIGIN_EN_FAZLA);
    yeni.push({ anahtar, adet: eklenecek });
    kalan -= eklenecek;
  }
  return { heybe: yeni, eklenen: adet - kalan, sigmayan: kalan };
}

// Heybeden bir yemek çıkarır (son yuvadan başlayarak). Yemek yoksa aynı heybeyi döndürür.
export function yemekCikar(heybe, anahtar) {
  const sira = heybe.findLastIndex((y) => y.anahtar === anahtar && y.adet > 0);
  if (sira === -1) return heybe;
  return heybe
    .map((y, i) => (i === sira ? { ...y, adet: y.adet - 1 } : y))
    .filter((y) => y.adet > 0);
}

// Yemeğin güncel can ya da nefese katacağı miktar (en yüksek değer aşılmaz).
// `mevcut`: { can, nefes }, `enCok`: { can, nefes }.
export function yemekEtkisi(anahtar, mevcut, enCok) {
  const tur = yemekler[anahtar].tur;
  return { tur, miktar: Math.max(0, Math.min(enCok[tur] - mevcut[tur], yemekGucu(anahtar))) };
}

// Savaş dışında yemek yeme. Yemek yeme sebebi yoksa ya da heybede yoksa
// aynı durumu döndürür. Sonuç: { durum, tur, miktar }.
// neden (olmazsa): 'yok' | 'dolu'
export function yemekYeKontrol(durum, anahtar) {
  if (yemekAdedi(durum.heybe, anahtar) < 1) return { olur: false, neden: 'yok' };
  const { miktar } = yemekEtkisi(anahtar, durum.oyuncu, statlar(durum.oyuncu));
  if (miktar === 0) return { olur: false, neden: 'dolu' };
  return { olur: true };
}

export function yemekYe(durum, anahtar) {
  if (!yemekYeKontrol(durum, anahtar).olur) return { durum, tur: null, miktar: 0 };
  const { tur, miktar } = yemekEtkisi(anahtar, durum.oyuncu, statlar(durum.oyuncu));
  return {
    durum: {
      ...durum,
      heybe: yemekCikar(durum.heybe, anahtar),
      oyuncu: { ...durum.oyuncu, [tur]: durum.oyuncu[tur] + miktar },
    },
    tur,
    miktar,
  };
}
