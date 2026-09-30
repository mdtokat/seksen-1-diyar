// Seyyar tüccar: yollarda dolaşan, güçlü ekipman satan gezgin esnaf. Saf oyun mantığı —
// DOM'a dokunmaz.
//
// Ahi dükkânı yalnızca bölgenin sıradan ve nadir eşyalarını satar. Seyyar tüccar ise
// uzak diyarlardan getirdiği, oyuncunun sınıfına uygun güçlü malları satar: bulunduğu
// bölgenin efsanevi eşyaları ve bir sonraki bölgenin eşyaları. Yol masrafı yüzünden
// fiyatları Ahi'den yüksektir. Tüccar zararsızdır (savaşa girilmez), yolun kenarında bir
// süre bekler, sonra yoluna devam eder.
//
// Karşılaşma iki yolla olur: ile girildiğinde haritada bekliyor olabilir ya da oyuncu
// meydan dışında yürürken yakınlarda belirir.
import { esyalar } from '../veri/esyalar.js';
import { bolgeler } from '../veri/bolgeler.js';
import { iller } from '../veri/iller.js';
import { KARO, karo, mesafe, meydandaMi } from './gezinti.js';
import { rastgeleUreteci, sans, tamSayi } from './rastgele.js';

export const TUCCAR = {
  girisSansi: 0.22, // ile girildiğinde haritada tüccar bulunma şansı
  yolSansi: 0.006, // bekleme dolduktan sonra her adımda tüccarla karşılaşma şansı
  bekleme: 60, // tüccarın gelişi ya da gidişi arasındaki en az adım
  omur: [150, 260], // haritada kaç adım kalır
  fiyatCarpani: 1.5, // Ahi fiyatına yol masrafı
  stok: 3, // tezgâhındaki eşya sayısı
};

const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));

// Tüccarın tezgâhı: (il, tohum, sınıf) üçlüsünden türetilir; tohum tüccara doğarken
// verilir, böylece aynı tüccar hep aynı malları taşır.
// Havuz: bölgenin efsanevi eşyaları + sonraki bölgenin sıradan ve nadir eşyaları
// (son bölgede sonraki yoktur; onun yerine kendi nadir eşyaları). Yalnızca sınıfa uygun
// eşyalar getirilir.
export function tuccarMallari(plaka, tohum, sinif) {
  const bolge = bolgeler.find((b) => b.anahtar === ilHaritasi.get(plaka).bolge);
  const sonraki = bolgeler.find((b) => b.sira === bolge.sira + 1);
  const uygun = (e) => !e.sinif || e.sinif === sinif;
  const havuz = Object.keys(esyalar).filter((a) => {
    const e = esyalar[a];
    if (!uygun(e)) return false;
    if (e.bolge === bolge.anahtar && e.nadirlik === 'efsanevi') return true;
    if (sonraki) return e.bolge === sonraki.anahtar && e.nadirlik !== 'efsanevi';
    return e.bolge === bolge.anahtar && e.nadirlik === 'nadir';
  });
  const rng = rastgeleUreteci(tohum);
  const secilen = [];
  while (secilen.length < TUCCAR.stok && havuz.length) secilen.push(...havuz.splice(Math.floor(rng() * havuz.length), 1));
  return secilen.sort((a, b) => esyalar[a].fiyat - esyalar[b].fiyat);
}

export function tuccarFiyati(anahtar) {
  return Math.round((esyalar[anahtar].fiyat * TUCCAR.fiyatCarpani) / 5) * 5;
}

// neden: 'satilmiyor' | 'zaten_var' | 'akce_yetersiz'
export function tuccarAlKontrol(durum, anahtar, mallar) {
  if (!mallar.includes(anahtar)) return { olur: false, neden: 'satilmiyor' };
  if ((durum.esyalar ?? []).includes(anahtar)) return { olur: false, neden: 'zaten_var' };
  if (durum.akce < tuccarFiyati(anahtar)) return { olur: false, neden: 'akce_yetersiz' };
  return { olur: true };
}

export function tuccarAl(durum, anahtar, mallar) {
  if (!tuccarAlKontrol(durum, anahtar, mallar).olur) return durum;
  return { ...durum, akce: durum.akce - tuccarFiyati(anahtar), esyalar: [...(durum.esyalar ?? []), anahtar] };
}

// ── Haritada belirme ─────────────────────────────────────

// Tüccarın durabileceği karolar: meydandan ve çıkışlardan uzak yollar ve çimenlikler
// (yollar tercih edilir; tüccar yol boyunca dolaşır).
function adaylar(harita, oyuncu, dolu, enAz, enCok) {
  const yollar = [];
  const cimler = [];
  const m = harita.meydan;
  for (let y = 1; y < harita.yukseklik - 1; y++) {
    for (let x = 1; x < harita.genislik - 1; x++) {
      const t = karo(harita, x, y);
      if (t !== KARO.YOL && t !== KARO.CIM) continue;
      const meydanaUzaklik = Math.max(m.x1 - x, x - m.x2, 0) + Math.max(m.y1 - y, y - m.y2, 0);
      if (meydanaUzaklik < 3) continue;
      if (harita.kapilar.some((k) => mesafe(k, { x, y }) < 2)) continue;
      const u = mesafe(oyuncu, { x, y });
      if (u < enAz || u > enCok) continue;
      if (dolu.some((d) => mesafe(d, { x, y }) < 2)) continue;
      (t === KARO.YOL ? yollar : cimler).push({ x, y });
    }
  }
  return yollar.length ? yollar : cimler;
}

function tuccarKaydi(harita, rng, { oyuncu, dolu = [], enAz, enCok }) {
  const yerler = adaylar(harita, oyuncu, dolu, enAz, enCok);
  if (!yerler.length) return null;
  const yer = yerler[Math.floor(rng() * yerler.length)];
  return {
    x: yer.x,
    y: yer.y,
    tohum: Math.floor(rng() * 4294967296) >>> 0,
    omur: tamSayi(rng, ...TUCCAR.omur),
    yon: sans(rng, 0.5) ? 1 : -1,
    duyuruldu: false,
  };
}

// İle girerken: `girisSansi` olasılıkla haritada bir tüccar bekler (oyuncudan en az 4
// karo uzakta). `dolu`: haritadaki düşmanlar. Sonuç: tüccar kaydı ya da null.
export function tuccarYerlestir(harita, rng, { oyuncu, dolu = [] } = {}) {
  if (!sans(rng, TUCCAR.girisSansi)) return null;
  return tuccarKaydi(harita, rng, { oyuncu, dolu, enAz: 4, enCok: Infinity });
}

// Yürürken: haritada tüccar yoksa, son gelişten ya da gidişten bu yana en az `bekleme`
// adım geçtiyse ve oyuncu meydan dışındaysa, her adımda `yolSansi` olasılıkla
// oyuncunun görüş alanında (3–7 karo) bir tüccar belirir. Sonuç: tüccar kaydı ya da null.
// `adim`: son gelişten ya da gidişten bu yana atılan adım sayısı.
export function tuccarBelir(harita, { tuccar, oyuncu, dolu = [], adim }, rng) {
  if (tuccar || adim < TUCCAR.bekleme || meydandaMi(harita, oyuncu)) return null;
  if (!sans(rng, TUCCAR.yolSansi)) return null;
  return tuccarKaydi(harita, rng, { oyuncu, dolu, enAz: 3, enCok: 7 });
}

export const tuccarKonumdaMi = (tuccar, p) => Boolean(tuccar) && tuccar.x === p.x && tuccar.y === p.y;
