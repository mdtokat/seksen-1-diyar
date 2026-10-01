// Yankesiciler: oyuncu meydan dışında yürürken ara sıra yolda beliren, kesesine göz
// diken yol haramileri. Saf oyun mantığı — DOM'a dokunmaz.
//
// Yankesici Zülmet'in yaratıklarından değildir; her bölgede çıkar ve gücü bulunulan ilin
// düşman seviyesine göredir. Oyuncuyu gözüne kestirip birkaç karo öteden çıkar ve hemen
// peşine düşer (gezinti.js → DAVRANIS.yankesici). Meydana sığınan ya da yeterince uzağa
// kaçan oyuncunun izini kaybeder ve haritadan çekip gider. Temas edince savaşılır:
// yenilirse kesesindeki akçeyi (bol) bırakıp kaçar; oyuncu kaçar ya da bayılırsa
// kesesinden bir miktar akçe aşırır (kesif.js → YANKESICI_CALMA). İlin arınmasına ve
// görevlere sayılmaz.
import { dusmanOlustur } from './savas.js';
import { ilSeviyesi } from './rota.js';
import { dusmanYurunurMu, meydandaMi, mesafe, yolBul, yankesiciMi } from './gezinti.js';
import { sans, tamSayi } from './rastgele.js';

export const YANKESICI = {
  bekleme: 45, // iki yankesici arasında (ya da ile girdikten sonra) en az adım
  sansi: 0.012, // bekleme dolduktan sonra her adımda yankesici çıkma şansı
  ikiliSansi: 0.3, // iki yankesicinin birlikte çıkma şansı
  uzaklik: [4, 6], // oyuncuya karo uzaklığı
};

// Yankesicinin çıkabileceği yerler: oyuncudan `uzaklik` kadar ötede, düşmanların yürüdüğü,
// boş ve oyuncuya yürüyerek kısa yoldan ulaşılabilen karolar.
function cikisYerleri(harita, oyuncu, dolu) {
  const [enAz, enCok] = YANKESICI.uzaklik;
  const yerler = [];
  for (let dy = -enCok; dy <= enCok; dy++) {
    for (let dx = -enCok; dx <= enCok; dx++) {
      const p = { x: oyuncu.x + dx, y: oyuncu.y + dy };
      const u = mesafe(p, oyuncu);
      if (u < enAz || u > enCok || !dusmanYurunurMu(harita, p.x, p.y)) continue;
      if (dolu.some((d) => d.x === p.x && d.y === p.y)) continue;
      const yol = yolBul(harita, p, oyuncu, { yurur: dusmanYurunurMu });
      if (yol && yol.length <= enCok + 3) yerler.push(p);
    }
  }
  return yerler;
}

// Yürürken: haritada yankesici yoksa, son çıkışından bu yana en az `bekleme` adım geçtiyse
// ve oyuncu meydan dışındaysa, her adımda `sansi` olasılıkla bir (bazen iki) yankesici çıkar.
// `adim`: son yankesiciden bu yana atılan adım sayısı; `engeller`: tüccar gibi diğer
// figürler. Sonuç: yeni düşman kayıtları (peşe düşmüş), çıkmadıysa boş dizi.
export function yankesiciBelir(harita, { dusmanlar, oyuncu, adim, ilkId, engeller = [] }, rng) {
  if (adim < YANKESICI.bekleme || meydandaMi(harita, oyuncu) || dusmanlar.some(yankesiciMi)) return [];
  if (!sans(rng, YANKESICI.sansi)) return [];
  const dolu = [...dusmanlar, ...engeller];
  const yerler = cikisYerleri(harita, oyuncu, dolu);
  if (!yerler.length) return [];
  const sayi = sans(rng, YANKESICI.ikiliSansi) ? 2 : 1;
  const seviyeler = ilSeviyesi(harita.plaka);
  const cikanlar = [];
  for (let i = 0; i < sayi; i++) {
    const uygun = yerler.filter((p) => cikanlar.every((c) => mesafe(c, p) >= 1 && mesafe(c, p) <= 3));
    if (!uygun.length) break;
    const yer = uygun[Math.floor(rng() * uygun.length)];
    cikanlar.push({
      id: ilkId + i,
      dusman: dusmanOlustur('yankesici', tamSayi(rng, ...seviyeler)),
      x: yer.x, y: yer.y, evX: yer.x, evY: yer.y,
      kovaliyor: true, birikim: 0, yon: Math.sign(oyuncu.x - yer.x) || -1,
    });
  }
  return cikanlar;
}

// İzini kaybettiren oyuncunun peşini bırakan yankesiciler haritadan çekilir.
// Sonuç: { dusmanlar (kalanlar), gidenler }.
export function yankesicileriCek(dusmanlar) {
  const gidenler = dusmanlar.filter((d) => yankesiciMi(d) && !d.kovaliyor);
  return { dusmanlar: gidenler.length ? dusmanlar.filter((d) => !gidenler.includes(d)) : dusmanlar, gidenler };
}
