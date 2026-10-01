// Savaş kısayol yuvaları: gezintide 1–4 tuşlarıyla (ya da yuvaya dokunarak) kullanılan
// dört yuva. Saf oyun mantığı — DOM'a dokunmaz.
//
// Yuva içeriği: null | { tur: 'saldir' } | { tur: 'yetenek', anahtar } | { tur: 'yemek', anahtar }
// (Savaş haritada geçtiği için "Kaç" yuvası yoktur: düşmandan uzaklaşmak kaçmaktır.)
// Yemek yuvası heybede o yemek kalmasa da durur; yemek yeniden bulununca kullanılır.
import { siniflar } from '../veri/siniflar.js';
import { yemekler } from '../veri/yemekler.js';
import { acikYetenekler } from './karakter.js';

export const KISAYOL_YUVA = 4;
export const KISAYOL_TURLERI = ['saldir', 'yetenek', 'yemek'];

export function bosKisayollar() {
  return Array(KISAYOL_YUVA).fill(null);
}

export const ayniKisayolMu = (a, b) =>
  Boolean(a && b && a.tur === b.tur && (a.anahtar ?? null) === (b.anahtar ?? null));

// Yuva içeriği geçerli mi? `sinif` verilirse yetenek o sınıfın olmalıdır.
export function kisayolGecerliMi(icerik, sinif = null) {
  if (icerik === null) return true;
  if (!icerik || typeof icerik !== 'object') return false;
  switch (icerik.tur) {
    case 'saldir':
      return true;
    case 'yetenek':
      return typeof icerik.anahtar === 'string' && (sinif
        ? siniflar[sinif]?.yetenekler.some((y) => y.anahtar === icerik.anahtar)
        : Object.values(siniflar).some((s) => s.yetenekler.some((y) => y.anahtar === icerik.anahtar)));
    case 'yemek':
      return Boolean(yemekler[icerik.anahtar]);
    default:
      return false;
  }
}

// Yeni oyunun (ya da eski kayıtların) yuvaları: Saldır, ilk iki açık yetenek ve
// heybedeki ilk yemek.
export function varsayilanKisayollar(durum) {
  const yuvalar = bosKisayollar();
  yuvalar[0] = { tur: 'saldir' };
  const yetenekler = durum.oyuncu ? acikYetenekler(durum.oyuncu).slice(0, 2) : [];
  yetenekler.forEach((y, i) => {
    yuvalar[1 + i] = { tur: 'yetenek', anahtar: y.anahtar };
  });
  const yemek = durum.heybe?.[0]?.anahtar;
  if (yemek) yuvalar[KISAYOL_YUVA - 1] = { tur: 'yemek', anahtar: yemek };
  return yuvalar;
}

// `sira` numaralı yuvaya içerik koyar (null → yuvayı boşaltır). Aynı içerik başka
// bir yuvadaysa oradan alınır. Geçersiz istekte durum aynen döner.
export function kisayolAta(durum, sira, icerik) {
  if (!Number.isInteger(sira) || sira < 0 || sira >= KISAYOL_YUVA) return durum;
  if (!kisayolGecerliMi(icerik, durum.oyuncu?.sinif)) return durum;
  const eski = durum.kisayollar ?? bosKisayollar();
  if (icerik === null ? eski[sira] === null : ayniKisayolMu(eski[sira], icerik)) return durum;
  const yeni = eski.map((y) => (icerik && ayniKisayolMu(y, icerik) ? null : y));
  yeni[sira] = icerik && { ...icerik };
  return { ...durum, kisayollar: yeni };
}

// Yeni açılan yetenekleri boş yuvalara yerleştirir (boş yuva yoksa dokunmaz).
export function yeniYetenekleriYerlestir(kisayollar, yeniYetenekler) {
  const yuvalar = [...kisayollar];
  for (const y of yeniYetenekler) {
    const icerik = { tur: 'yetenek', anahtar: y.anahtar ?? y };
    if (yuvalar.some((k) => ayniKisayolMu(k, icerik))) continue;
    const bos = yuvalar.indexOf(null);
    if (bos === -1) break;
    yuvalar[bos] = icerik;
  }
  return yuvalar;
}

// Yuva içeriğinin savaş eylemi (savas.js → oyuncuHamlesi). Boş yuva → null.
export function kisayolEylemi(icerik) {
  if (!icerik) return null;
  if (icerik.tur === 'yetenek' || icerik.tur === 'yemek') return { tur: icerik.tur, anahtar: icerik.anahtar };
  return { tur: icerik.tur };
}
