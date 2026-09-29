// Keşif ve karşılaşmalar. Saf oyun mantığı — DOM'a dokunmaz.
// Faz 3: yalnızca karşılaşma üretimi. Arınma ve ganimet Faz 4'te eklenecek.
import { iller } from '../veri/iller.js';
import { dusmanOlustur } from './savas.js';
import { sec, tamSayi } from './rastgele.js';

const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));

// İlin düşman havuzundan ve seviye aralığından rastgele bir düşman üretir.
export function karsilasmaUret(plaka, rng) {
  const il = ilHaritasi.get(plaka);
  const anahtar = sec(rng, il.dusmanlar);
  const seviye = tamSayi(rng, il.seviye[0], il.seviye[1]);
  return dusmanOlustur(anahtar, seviye);
}
