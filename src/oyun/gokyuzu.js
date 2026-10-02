// Gökyüzü: günün vakti ve havanın durumu. Saf mantık — DOM'a dokunmaz; çizimi
// src/arayuz/gokyuzuKatmani.js yapar.
//
// Oyunun bir günü GUN_MS sürer ve gerçek saatten türetilir (Date.now()); böylece il
// değiştirmek ya da oyunu yeniden açmak vakti sıfırlamaz. Gecenin karanlığı oynanışı
// zorlaştırmayacak ölçüdedir: yiğidin çevresi, pencereler ve meşaleler aydınlıktır.
//
// Hava her HAVA_MS'de bir değişir; ilin bölgesine göre olasılıklıdır (Doğu Anadolu'da
// kar, Karadeniz'de yağmur ve sis, Güneydoğu'da sıcak hava titreşimi) ve aynı ilde
// aynı anda herkes için aynıdır.

export const GUN_MS = 16 * 60 * 1000;
export const HAVA_MS = 4 * 60 * 1000;
const GECIS_MS = 20 * 1000; // havanın gelip gitmesi

// Günün durakları: t (0–1), karanlık (0–1) ve ışığın rengi [r, g, b, saydamlık].
const DURAKLAR = [
  { t: 0, karanlik: 0.56, ton: [20, 30, 72, 0] },
  { t: 0.06, karanlik: 0.26, ton: [255, 150, 120, 0.16] },
  { t: 0.12, karanlik: 0, ton: [255, 220, 170, 0.07] },
  { t: 0.2, karanlik: 0, ton: [255, 255, 255, 0] },
  { t: 0.55, karanlik: 0, ton: [255, 255, 255, 0] },
  { t: 0.62, karanlik: 0, ton: [255, 150, 70, 0.17] },
  { t: 0.68, karanlik: 0.3, ton: [210, 90, 90, 0.18] },
  { t: 0.75, karanlik: 0.56, ton: [20, 30, 72, 0] },
  { t: 1, karanlik: 0.56, ton: [20, 30, 72, 0] },
];

const ara = (a, b, o) => a + (b - a) * o;

// Günün vakti: { t, evre: 'safak' | 'gunduz' | 'aksam' | 'gece', karanlik, ton }.
export function gunVakti(ms = Date.now()) {
  const t = (((ms % GUN_MS) + GUN_MS) % GUN_MS) / GUN_MS;
  const i = DURAKLAR.findIndex((d) => d.t > t);
  const a = DURAKLAR[i - 1];
  const b = DURAKLAR[i];
  const o = (t - a.t) / (b.t - a.t);
  const evre = t < 0.12 ? 'safak' : t < 0.58 ? 'gunduz' : t < 0.7 ? 'aksam' : 'gece';
  return {
    t,
    evre,
    karanlik: ara(a.karanlik, b.karanlik, o),
    ton: a.ton.map((v, k) => ara(v, b.ton[k], o)),
  };
}

// Bölgenin havası: her türün olasılığı (gerisi açık hava).
const BOLGE_HAVASI = {
  marmara: { yagmur: 0.25, sis: 0.1 },
  ege: { yagmur: 0.1 },
  akdeniz: { yagmur: 0.08, sicak: 0.2 },
  ic_anadolu: { sicak: 0.3 },
  karadeniz: { yagmur: 0.45, sis: 0.3 },
  guneydogu: { sicak: 0.6 },
  dogu_anadolu: { kar: 0.55, sis: 0.1 },
};

// İl ve zaman diliminden türetilen, her açılışta aynı sayı (0 ≤ n < 1).
function karma(a, b) {
  let h = Math.imul(a ^ 0x9e3779b9, 2654435761) ^ Math.imul(b + 0x7f4a7c15, 1597334677);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h = Math.imul(h ^ (h >>> 13), 3266489917);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Havanın durumu: { tur: 'acik' | 'yagmur' | 'kar' | 'sis' | 'sicak', siddet: 0–1 }.
// Şiddet zaman diliminin başında ve sonunda yavaşça artar ve azalır.
export function havaDurumu(plaka, bolge, ms = Date.now()) {
  const dilim = Math.floor(ms / HAVA_MS);
  const r = karma(plaka, dilim);
  let toplam = 0;
  let tur = 'acik';
  for (const [t, olasilik] of Object.entries(BOLGE_HAVASI[bolge] ?? {})) {
    toplam += olasilik;
    if (r < toplam) {
      tur = t;
      break;
    }
  }
  if (tur === 'acik') return { tur, siddet: 0 };
  const icinde = ms - dilim * HAVA_MS;
  const gecis = Math.min(1, icinde / GECIS_MS, (HAVA_MS - icinde) / GECIS_MS);
  return { tur, siddet: (0.55 + karma(dilim, plaka) * 0.45) * gecis };
}
