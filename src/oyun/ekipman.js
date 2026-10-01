// Ekipman: eşya kuşanma ve çıkarma. Saf oyun mantığı — DOM'a dokunmaz.
// Oyuncunun sahip olduğu eşyalar `durum.esyalar` (anahtar dizisi), kuşandıkları
// `durum.oyuncu.kusanilan` ({ silah, zirh, aksesuar }) içindedir.
import { esyaBilgisi } from './rota.js';
import { siniflar } from '../veri/siniflar.js';
import { statlar } from './karakter.js';

// Can ve nefes, yeni en yüksek değerleri aşmasın.
function sinirla(oyuncu) {
  const s = statlar(oyuncu);
  return { ...oyuncu, can: Math.min(oyuncu.can, s.can), nefes: Math.min(oyuncu.nefes, s.nefes) };
}

// Sonuç: { olur: true } ya da { olur: false, neden }.
// neden: 'bilinmeyen' | 'sahip_degil' | 'sinif' | 'seviye' | 'zaten_kusanili'
export function kusanKontrol(durum, anahtar) {
  const esya = esyaBilgisi(anahtar);
  if (!esya) return { olur: false, neden: 'bilinmeyen' };
  if (!(durum.esyalar ?? []).includes(anahtar)) return { olur: false, neden: 'sahip_degil' };
  const o = durum.oyuncu;
  if (esya.sinif && esya.sinif !== o.sinif) return { olur: false, neden: 'sinif' };
  if (o.seviye < esya.seviye) return { olur: false, neden: 'seviye' };
  if (o.kusanilan?.[esya.yuva] === anahtar) return { olur: false, neden: 'zaten_kusanili' };
  return { olur: true };
}

// Eşyayı yuvasına kuşanır (yuvadaki eski eşya çantaya döner).
export function kusan(durum, anahtar) {
  if (!kusanKontrol(durum, anahtar).olur) return durum;
  const o = durum.oyuncu;
  const kusanilan = { silah: null, zirh: null, aksesuar: null, ...o.kusanilan, [esyaBilgisi(anahtar).yuva]: anahtar };
  return { ...durum, oyuncu: sinirla({ ...o, kusanilan }) };
}

export function cikar(durum, yuva) {
  const o = durum.oyuncu;
  if (!o.kusanilan?.[yuva]) return durum;
  return { ...durum, oyuncu: sinirla({ ...o, kusanilan: { ...o.kusanilan, [yuva]: null } }) };
}

export function kusaniliMi(durum, anahtar) {
  return Object.values(durum.oyuncu.kusanilan ?? {}).includes(anahtar);
}

// Eşyayı bu sınıf kullanabilir mi (seviye hariç)?
export function sinifaUygunMu(anahtar, sinif) {
  const esya = esyaBilgisi(anahtar);
  return Boolean(esya) && (!esya.sinif || esya.sinif === sinif) && Boolean(siniflar[sinif]);
}
