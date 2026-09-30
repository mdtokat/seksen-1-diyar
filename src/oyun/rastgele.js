// Tohumlanabilir rastgele sayı üreteci. Saf oyun mantığı — DOM'a dokunmaz.
// Oyundaki tüm rastgelelik buradan gelir; testlerde sabit tohum kullanılır.

// mulberry32: küçük, hızlı ve tohumlanabilir bir üreteç.
// Döndürdüğü fonksiyon her çağrıda [0, 1) aralığında bir sayı verir.
export function rastgeleUreteci(tohum) {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Oyunda kullanılacak yeni bir tohum.
export function yeniTohum() {
  return Math.floor(Math.random() * 4294967296) >>> 0;
}

// [enAz, enCok) aralığında ondalıklı sayı.
export function aralik(rng, enAz, enCok) {
  return enAz + rng() * (enCok - enAz);
}

// [enAz, enCok] aralığında tam sayı (iki uç dahil).
export function tamSayi(rng, enAz, enCok) {
  return enAz + Math.floor(rng() * (enCok - enAz + 1));
}

// Diziden rastgele bir öğe.
export function sec(rng, dizi) {
  return dizi[Math.floor(rng() * dizi.length)];
}

// `olasilik` (0–1) ihtimalle true döner.
export function sans(rng, olasilik) {
  return rng() < olasilik;
}
