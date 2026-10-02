// İl içi gezinti: karo harita üretimi, yürüme, yol bulma ve haritadaki düşmanlar.
// Saf oyun mantığı — DOM'a dokunmaz.
//
// Her ilin haritası plakasından türetilen sabit bir tohumla üretilir; aynı il her
// açılışta aynı görünür. Harita genislik × yukseklik karodan oluşur, karolar satır
// satır tek bir dizide tutulur (sira = y × genislik + x).
//
// Haritanın büyüklüğü ilin gerçek yüzölçümüyle, en-boy oranı ilin sınırlarının
// kapladığı kutuyla orantılıdır: Konya en geniş, Yalova en küçük haritadır. Evlerin
// ve meydanda dolaşan halkın sayısı nüfusla artar: İstanbul en kalabalık ildir.
import { iller } from '../veri/iller.js';
import { bolgeler, final } from '../veri/bolgeler.js';
import { ilSinirlari } from '../veri/ilSinirlari.js';
import { karsilasmaUret } from './kesif.js';
import { dusmanOlustur, dusmanMenzili } from './savas.js';
import { bossDurumu, miniBossVarMi, finalDurumu } from './ilerleme.js';
import { rastgeleUreteci, tamSayi, sans } from './rastgele.js';
import { gezginBossUret, GEZGIN_BOSS } from './gezginBoss.js';
import { ilSeviyesi, bolgeSeviyesi, durumRotasi } from './rota.js';

// Harita boyutu: karo sayısı = TEMEL_KARO × (yüzölçümü / TEMEL_ALAN)^ALAN_USSU.
// Gerçek oranla (Konya/Yalova ≈ 51 kat) oynanabilir kalmayacağı için alan bir
// üsle sıkıştırılır; sıralama ve farklar korunur (Konya ≈ 9 kat Yalova).
const TEMEL_KARO = 450;
const TEMEL_ALAN = 800; // km²
const ALAN_USSU = 0.6;
const EN_AZ_KENAR = 21;
const EN_AZ_KARO = 525;
const EN_OR = 0.7; // genişlik / yükseklik sınırları
const EN_COK_OR = 1.4;
// Eski sabit harita (25 × 31); düşman sayısı buna göre ölçeklenir.
const OLCU_KARO = 775;

export const KARO = {
  CIM: 0,
  YOL: 1,
  YABANI: 2, // uzun otlar, çalılık
  AGAC: 3,
  KAYA: 4,
  SU: 5,
  EV: 6,
  MEYDAN: 7,
  CESME: 8,
  TEZGAH: 9,
  TABELA: 10,
  KAPI: 11, // komşu ile çıkış
  DUKKAN: 12, // Ahi esnafının silah ve zırh dükkânı
  KERVANSARAY: 13,
  MUHTAR: 14, // köy muhtarı: görev verir, ulaştırılan yemeği teslim alır, hediye verir
  AHI_BABA: 15, // Ahi esnafı olan illerde dükkânın yanında durur, görev verir
};

const OYUNCU_YURUR = new Set([KARO.CIM, KARO.YOL, KARO.YABANI, KARO.MEYDAN, KARO.KAPI]);
const DUSMAN_YURUR = new Set([KARO.CIM, KARO.YOL, KARO.YABANI]); // meydan ve çıkışlar güvenli
// Uzaktan vuruşlar (ok, ışık, sihir) bu karoların üstünden geçer; ağaç, kaya, ev ve
// meydandaki yapılar görüşü kapatır.
const GORUS_GECER = new Set([KARO.CIM, KARO.YOL, KARO.YABANI, KARO.SU, KARO.MEYDAN, KARO.KAPI]);

// Bölgeye göre doğa: kaç öbek ağaç, kaya, çalılık, su ve kaç ev.
// Kenar: haritayı çevreleyen engel türü.
const BOLGE_DOGASI = {
  marmara: { agac: 10, kaya: 3, yabani: 8, su: 2, ev: 6, kenar: KARO.AGAC },
  ege: { agac: 12, kaya: 5, yabani: 6, su: 1, ev: 6, kenar: KARO.AGAC },
  akdeniz: { agac: 10, kaya: 6, yabani: 6, su: 1, ev: 5, kenar: KARO.AGAC },
  ic_anadolu: { agac: 2, kaya: 10, yabani: 9, su: 0, ev: 5, kenar: KARO.KAYA },
  karadeniz: { agac: 18, kaya: 3, yabani: 6, su: 2, ev: 5, kenar: KARO.AGAC },
  guneydogu: { agac: 2, kaya: 8, yabani: 5, su: 0, ev: 7, kenar: KARO.KAYA },
  dogu_anadolu: { agac: 6, kaya: 9, yabani: 6, su: 2, ev: 4, kenar: KARO.KAYA },
};

const KAPI_ARALIGI = 4; // iki çıkış arasındaki en az karo
const DOLASMA_YARICAPI = 3;

// Düşmanların davranışı (her tıkta bir kez yürütülür; oyuncu her tıkta bir karo yürür).
// gorus: oyuncuyu fark ettiği uzaklık · birakma: peşini bıraktığı uzaklık ·
// hiz: kovalarken tık başına karo. Sıradan yaratıkların tavrı türüne göre değişir
// (dusmanlar.js → takip): takipçiler (kurtlar, parslar, kara cinler…) oyuncuyu uzaktan
// fark eder, neredeyse onun kadar hızlı koşar ve kolay kolay bırakmaz; bekçiler yalnızca
// yakına gelince saldırır; kayıtsızlar (hortlaklar, akrepler, taş devler…) peşe hiç düşmez.
// Gezgin bosslar (gezginBoss.js) ağır adımlıdır ama gözleri keskindir. Yankesiciler
// (yankesici.js) oyuncuyu gözüne kestirip çıkar, çevik koşar; meydana ya da uzağa kaçana
// dek bırakmaz. Oyuncunun vurduğu yaratık kızar (`kizgin`): peşini bırakana dek kovalar;
// kayıtsızlar da kızınca bekçi gibi davranır.
export const DAVRANIS = {
  bekci: { gorus: 4, birakma: 7, hiz: 0.55 },
  takipci: { gorus: 6, birakma: 13, hiz: 0.85 },
  kayitsiz: { gorus: 0, birakma: 0, hiz: 0 },
  gezgin: { gorus: 5, birakma: 10, hiz: 0.7 },
  yankesici: { gorus: 9, birakma: 12, hiz: 0.8 },
};
const DOLASMA_HIZI = 0.25;

const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const KOS39 = Math.cos((39 * Math.PI) / 180);

export const mesafe = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const icinde = (h, x, y) => x >= 0 && y >= 0 && x < h.genislik && y < h.yukseklik;
const YONLER = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

export function karo(harita, x, y) {
  return icinde(harita, x, y) ? harita.karolar[y * harita.genislik + x] : KARO.AGAC;
}

// Karonun dizideki sırası.
export const sira = (harita, x, y) => y * harita.genislik + x;

// İl sınırının (ilSinirlari.js) kapladığı kutunun genişlik / yükseklik oranı.
// Yollar yalnızca M (mutlak başlangıç), l (göreli çizgi) ve z komutlarından oluşur.
function sinirOrani(plaka) {
  const d = ilSinirlari[plaka];
  if (!d) return 1;
  const kutu = { x1: Infinity, x2: -Infinity, y1: Infinity, y2: -Infinity };
  for (const parca of d.split('M').filter(Boolean)) {
    const sayilar = parca.match(/-?\d*\.?\d+/g).map(Number);
    let x = 0;
    let y = 0;
    for (let i = 0; i + 1 < sayilar.length; i += 2) {
      if (i === 0) { x = sayilar[0]; y = sayilar[1]; } else { x += sayilar[i]; y += sayilar[i + 1]; }
      kutu.x1 = Math.min(kutu.x1, x); kutu.x2 = Math.max(kutu.x2, x);
      kutu.y1 = Math.min(kutu.y1, y); kutu.y2 = Math.max(kutu.y2, y);
    }
  }
  const g = kutu.x2 - kutu.x1;
  const y = kutu.y2 - kutu.y1;
  return g > 0 && y > 0 ? g / y : 1;
}

const tek = (n) => (n % 2 === 0 ? n + 1 : n); // meydanın tam ortada durması için kenarlar tektir

// Bir il için aday boyutlar, hataya göre sıralı. Kenarlar tek sayıdır; karo sayısı
// hedefe yakın, en-boy oranı ilin şekline yakın olan çiftler öndedir.
function adayBoyutlar(il) {
  const hedef = Math.max(EN_AZ_KARO, TEMEL_KARO * (il.yuzolcumu / TEMEL_ALAN) ** ALAN_USSU);
  const oran = Math.min(EN_COK_OR, Math.max(EN_OR, sinirOrani(il.plaka)));
  const orta = Math.sqrt(hedef * oran);
  const adaylar = [];
  for (let G = tek(Math.floor(orta) - 8); G <= orta + 8; G += 2) {
    if (G < EN_AZ_KENAR) continue;
    const y0 = tek(Math.floor(hedef / G)) - 2;
    for (const Y of [y0, y0 + 2, y0 + 4]) {
      if (Y < EN_AZ_KENAR) continue;
      const hata = Math.abs(G * Y - hedef) / hedef + 0.02 * Math.abs(Math.log(G / Y / oran));
      adaylar.push({ genislik: G, yukseklik: Y, hata });
    }
  }
  return adaylar.sort((x, y) => x.hata - y.hata);
}

// Tüm illerin boyutları bir kez hesaplanır: iller küçükten büyüğe dolaşılır ve her il,
// kendinden küçük illerin haritasından küçük olmayan en iyi adayı alır.
let BOYUTLAR = null;
function boyutlariHesapla() {
  BOYUTLAR = new Map();
  let onceki = 0;
  for (const il of [...iller].sort((a, b) => a.yuzolcumu - b.yuzolcumu)) {
    const adaylar = adayBoyutlar(il);
    const secilen = adaylar.find((c) => c.genislik * c.yukseklik >= onceki) ?? adaylar[0];
    BOYUTLAR.set(il.plaka, { genislik: secilen.genislik, yukseklik: secilen.yukseklik });
    onceki = secilen.genislik * secilen.yukseklik;
  }
}

// İlin harita boyutu: { genislik, yukseklik } (karo).
export function haritaBoyutu(plaka) {
  if (!BOYUTLAR) boyutlariHesapla();
  return { ...BOYUTLAR.get(plaka) };
}

export function yurunurMu(harita, x, y) {
  return OYUNCU_YURUR.has(karo(harita, x, y));
}

export function dusmanYurunurMu(harita, x, y) {
  return DUSMAN_YURUR.has(karo(harita, x, y));
}

// Harita kenarındaki karolar saat yönünde (köşeler hariç), çıkışların yerleşeceği yerler.
function cevreKarolari(G, Y) {
  const c = [];
  for (let x = 1; x < G - 1; x++) c.push({ x, y: 0, ix: x, iy: 1 });
  for (let y = 1; y < Y - 1; y++) c.push({ x: G - 1, y, ix: G - 2, iy: y });
  for (let x = G - 2; x > 0; x--) c.push({ x, y: Y - 1, ix: x, iy: Y - 2 });
  for (let y = Y - 2; y > 0; y--) c.push({ x: 0, y, ix: 1, iy: y });
  return c;
}

// Komşu illerin çıkışlarını, komşunun gerçek yönüne bakan kenar karolarına yerleştirir.
function kapilariYerlestir(il, merkez, GENISLIK, YUKSEKLIK) {
  const CEVRE = cevreKarolari(GENISLIK, YUKSEKLIK);
  const istenen = il.komsular.map((plaka) => {
    const k = ilHaritasi.get(plaka);
    const dx = (k.lon - il.lon) * KOS39;
    const dy = il.lat - k.lat; // ekranda aşağısı güney
    // Merkezden bu yöne giden ışının harita kenarını kestiği nokta
    const tx = dx === 0 ? Infinity : (dx > 0 ? GENISLIK - 1 - merkez.x : -merkez.x) / dx;
    const ty = dy === 0 ? Infinity : (dy > 0 ? YUKSEKLIK - 1 - merkez.y : -merkez.y) / dy;
    const t = Math.min(tx, ty);
    const nokta = { x: merkez.x + dx * t, y: merkez.y + dy * t };
    let enIyi = 0;
    CEVRE.forEach((c, i) => {
      if (Math.hypot(c.x - nokta.x, c.y - nokta.y) < Math.hypot(CEVRE[enIyi].x - nokta.x, CEVRE[enIyi].y - nokta.y)) enIyi = i;
    });
    return { plaka, sira: enIyi };
  });
  // Birbirine çok yakın çıkışları çevre boyunca iterek aralarını aç
  const P = CEVRE.length;
  const sirali = [...istenen].sort((a, b) => a.sira - b.sira);
  for (let tur = 0; tur < 50; tur++) {
    let degisti = false;
    for (let i = 0; i < sirali.length && sirali.length > 1; i++) {
      const a = sirali[i];
      const b = sirali[(i + 1) % sirali.length];
      const ara = (b.sira - a.sira + P) % P;
      if (ara < KAPI_ARALIGI) {
        a.sira = (a.sira - 1 + P) % P;
        b.sira = (b.sira + 1) % P;
        degisti = true;
      }
    }
    if (!degisti) break;
  }
  return sirali.map(({ plaka, sira }) => ({ plaka, ...CEVRE[sira] }));
}

// Belirli bir ilin karo haritasını üretir (aynı plaka → aynı harita).
export function ilHaritasiUret(plaka) {
  const il = ilHaritasi.get(plaka);
  if (!il) throw new Error(`Bilinmeyen il: ${plaka}`);
  const doga = BOLGE_DOGASI[il.bolge];
  const rng = rastgeleUreteci((plaka * 2654435761) >>> 0);
  const { genislik: G, yukseklik: Y } = haritaBoyutu(plaka);
  const boyut = { genislik: G, yukseklik: Y };
  const olcek = (G * Y) / OLCU_KARO; // doğa öbekleri harita alanıyla çoğalır
  const k = new Array(G * Y).fill(KARO.CIM);
  const koy = (x, y, tur) => {
    if (icinde(boyut, x, y)) k[y * G + x] = tur;
  };
  const al = (x, y) => k[y * G + x];

  // 1. Doğa: düzensiz öbekler
  const obek = (tur, sayi, rEnAz, rEnCok) => {
    for (let n = 0; n < sayi; n++) {
      const cx = tamSayi(rng, 2, G - 3);
      const cy = tamSayi(rng, 2, Y - 3);
      const r = tamSayi(rng, rEnAz, rEnCok);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r + rng() * (r + 1)) koy(cx + dx, cy + dy, tur);
        }
      }
    }
  };
  const kac = (n) => Math.round(n * olcek);
  obek(KARO.YABANI, kac(doga.yabani), 1, 3);
  obek(KARO.SU, kac(doga.su), 2, 3);
  obek(KARO.AGAC, kac(doga.agac), 1, 2);
  obek(KARO.KAYA, kac(doga.kaya), 0, 1);

  // 2. Kenar
  for (let x = 0; x < G; x++) {
    koy(x, 0, doga.kenar);
    koy(x, Y - 1, doga.kenar);
  }
  for (let y = 0; y < Y; y++) {
    koy(0, y, doga.kenar);
    koy(G - 1, y, doga.kenar);
  }

  // 3. Meydan (7×5) ve çevresinde bir karo boşluk
  const merkez = { x: (G - 1) / 2, y: (Y - 1) / 2 };
  const meydan = { x1: merkez.x - 3, x2: merkez.x + 3, y1: merkez.y - 2, y2: merkez.y + 2 };
  for (let y = meydan.y1 - 1; y <= meydan.y2 + 1; y++) {
    for (let x = meydan.x1 - 1; x <= meydan.x2 + 1; x++) {
      const ic = x >= meydan.x1 && x <= meydan.x2 && y >= meydan.y1 && y <= meydan.y2;
      koy(x, y, ic ? KARO.MEYDAN : KARO.CIM);
    }
  }

  // 4. Çıkışlar ve meydana uzanan yollar
  const kapilar = kapilariYerlestir(il, merkez, G, Y);
  for (const kapi of kapilar) {
    koy(kapi.x, kapi.y, KARO.KAPI);
    let p = { x: kapi.ix, y: kapi.iy };
    const hedef = {
      x: Math.min(meydan.x2, Math.max(meydan.x1, p.x)),
      y: Math.min(meydan.y2, Math.max(meydan.y1, p.y)),
    };
    for (let adim = 0; adim < 200 && (p.x !== hedef.x || p.y !== hedef.y); adim++) {
      if (al(p.x, p.y) !== KARO.MEYDAN) koy(p.x, p.y, KARO.YOL);
      const kalanX = hedef.x - p.x;
      const kalanY = hedef.y - p.y;
      const yatay = Math.abs(kalanX) > 0 && (Math.abs(kalanY) === 0 || rng() < Math.abs(kalanX) / (Math.abs(kalanX) + Math.abs(kalanY)));
      if (yatay) p = { x: p.x + Math.sign(kalanX), y: p.y };
      else p = { x: p.x, y: p.y + Math.sign(kalanY) };
    }
  }

  // 5. Evler: meydanın çevresinde, çimenlik karolarda. Kalabalık illerde mahalle büyür.
  // Her ev 2×2 karo kaplar (yiğitten büyük görünsün); sol üst karosu `x, y`dir.
  const evSayisi = evSayisiHesapla(il, doga);
  const mahalle = 5 + Math.floor(evSayisi / 6);
  const evler = [];
  for (let deneme = 0; deneme < 60 * evSayisi && evler.length < evSayisi; deneme++) {
    const x = tamSayi(rng, meydan.x1 - mahalle, meydan.x2 + mahalle);
    const y = tamSayi(rng, meydan.y1 - mahalle, meydan.y2 + mahalle);
    if (x < 2 || y < 2 || x + 1 > G - 3 || y + 1 > Y - 3) continue;
    if ([[0, 0], [1, 0], [0, 1], [1, 1]].some(([dx, dy]) => al(x + dx, y + dy) !== KARO.CIM)) continue;
    // Evler arasında en az bir karo boşluk: çatılar birbirinin cephesini örtmesin
    if (evler.some((e) => Math.abs(e.x - x) < 3 && Math.abs(e.y - y) < 3)) continue;
    if (x + 1 >= meydan.x1 - 1 && x <= meydan.x2 + 1 && y + 1 >= meydan.y1 - 1 && y <= meydan.y2 + 1) continue;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) koy(x + dx, y + dy, KARO.EV);
    evler.push({ x, y });
  }

  // 6. Meydandaki yapılar
  const tezgah = { x: merkez.x - 2, y: merkez.y - 1 };
  const cesme = { x: merkez.x, y: merkez.y - 1 };
  const tabela = { x: merkez.x + 2, y: merkez.y - 1 };
  koy(tezgah.x, tezgah.y, KARO.TEZGAH);
  koy(cesme.x, cesme.y, KARO.CESME);
  koy(tabela.x, tabela.y, KARO.TABELA);
  const bolgeVerisi = bolgeler.find((b) => b.anahtar === il.bolge);
  const dukkan = bolgeVerisi.ahiIlleri.includes(plaka) ? { x: merkez.x - 2, y: merkez.y + 1 } : null;
  const kervansaray = bolgeVerisi.kervansarayIlleri.includes(plaka) ? { x: merkez.x + 2, y: merkez.y + 1 } : null;
  if (dukkan) koy(dukkan.x, dukkan.y, KARO.DUKKAN);
  if (kervansaray) koy(kervansaray.x, kervansaray.y, KARO.KERVANSARAY);
  // Görev verenler (Faz 9): muhtar tabelanın yanında, Ahi Baba dükkânın yanında
  const muhtar = { x: merkez.x + 3, y: merkez.y - 1 };
  const ahiBaba = dukkan ? { x: merkez.x - 3, y: merkez.y + 1 } : null;
  koy(muhtar.x, muhtar.y, KARO.MUHTAR);
  if (ahiBaba) koy(ahiBaba.x, ahiBaba.y, KARO.AHI_BABA);
  const dogus = { x: merkez.x, y: merkez.y + 1 };

  // 7. Bağlantı: meydandan yürünerek ulaşılamayan açık alanlar engelle doldurulur
  const harita = { plaka, bolge: il.bolge, genislik: G, yukseklik: Y, karolar: k, kapilar, meydan, dogus, evler, tezgah, cesme, tabela, dukkan, kervansaray, muhtar, ahiBaba };
  const ulasilan = ulasilabilir(harita, dogus, yurunurMu);
  for (let y = 0; y < Y; y++) {
    for (let x = 0; x < G; x++) {
      if (yurunurMu(harita, x, y) && !ulasilan.has(y * G + x)) koy(x, y, doga.kenar);
    }
  }

  // 8. İn: meydandan yürüyerek en uzak açık karo (çıkışlardan uzakta). Boss ve mini
  // bosslar burada bekler.
  harita.in = enUzakKaro(harita);
  return harita;
}

// Evlerin sayısı nüfusla artar (Bayburt ≈ 5, İstanbul ≈ 25); bölgenin mimarisi de katkı yapar.
function evSayisiHesapla(il, doga) {
  return Math.round(doga.ev * 0.5 + Math.sqrt(il.nufus) / 180);
}

function enUzakKaro(harita) {
  const uzaklik = new Map([[sira(harita, harita.dogus.x, harita.dogus.y), 0]]);
  const kuyruk = [harita.dogus];
  let enIyi = harita.dogus;
  let enIyiUzaklik = -1;
  while (kuyruk.length) {
    const p = kuyruk.shift();
    const u = uzaklik.get(sira(harita, p.x, p.y));
    const t = karo(harita, p.x, p.y);
    const uygun = (t === KARO.CIM || t === KARO.YABANI) && !harita.kapilar.some((k) => mesafe(k, p) < 4);
    if (uygun && u > enIyiUzaklik) {
      enIyi = p;
      enIyiUzaklik = u;
    }
    for (const { dx, dy } of YONLER) {
      const x = p.x + dx;
      const y = p.y + dy;
      const s = sira(harita, x, y);
      if (icinde(harita, x, y) && !uzaklik.has(s) && yurunurMu(harita, x, y)) {
        uzaklik.set(s, u + 1);
        kuyruk.push({ x, y });
      }
    }
  }
  return { x: enIyi.x, y: enIyi.y };
}

// Bir noktadan yürünerek ulaşılabilen karoların sıra numaraları.
export function ulasilabilir(harita, bas, yurur = yurunurMu) {
  const gorulen = new Set([sira(harita, bas.x, bas.y)]);
  const kuyruk = [bas];
  while (kuyruk.length) {
    const p = kuyruk.shift();
    for (const { dx, dy } of YONLER) {
      const x = p.x + dx;
      const y = p.y + dy;
      const s = sira(harita, x, y);
      if (icinde(harita, x, y) && !gorulen.has(s) && yurur(harita, x, y)) {
        gorulen.add(s);
        kuyruk.push({ x, y });
      }
    }
  }
  return gorulen;
}

// ── Yürüme ───────────────────────────────────────────────

export function meydandaMi(harita, p) {
  const m = harita.meydan;
  return p.x >= m.x1 && p.x <= m.x2 && p.y >= m.y1 && p.y <= m.y2;
}

export function kapiBul(harita, p) {
  return harita.kapilar.find((k) => k.x === p.x && k.y === p.y);
}

// Engelle karşılaşılan karo bir yapıysa ya da görev verense türü:
// 'cesme' | 'tezgah' | 'tabela' | 'dukkan' | 'kervansaray' | 'muhtar' | 'ahi_baba'.
export function etkilesimTuru(harita, x, y) {
  return {
    [KARO.CESME]: 'cesme',
    [KARO.TEZGAH]: 'tezgah',
    [KARO.TABELA]: 'tabela',
    [KARO.DUKKAN]: 'dukkan',
    [KARO.KERVANSARAY]: 'kervansaray',
    [KARO.MUHTAR]: 'muhtar',
    [KARO.AHI_BABA]: 'ahi_baba',
  }[karo(harita, x, y)] ?? null;
}

// İlk adımı ile birlikte en kısa yol (başlangıç hariç). Hedef yürünemiyorsa ona
// komşu en yakın yürünür karoya gidilir. Ulaşılamazsa null.
// `engeller`: geçilemeyecek ek noktalar (ör. düşmanlar).
export function yolBul(harita, bas, hedef, { yurur = yurunurMu, engeller = [] } = {}) {
  const G = harita.genislik;
  const engel = new Set(engeller.map((p) => p.y * G + p.x));
  const gecer = (x, y) => yurur(harita, x, y) && !engel.has(y * G + x);
  const hedefler = new Set();
  if (gecer(hedef.x, hedef.y)) hedefler.add(hedef.y * G + hedef.x);
  else {
    for (const { dx, dy } of YONLER) {
      const x = hedef.x + dx;
      const y = hedef.y + dy;
      if (icinde(harita, x, y) && gecer(x, y)) hedefler.add(y * G + x);
    }
  }
  const basSira = bas.y * G + bas.x;
  if (hedefler.has(basSira)) return [];
  const onceki = new Map([[basSira, -1]]);
  const kuyruk = [bas];
  while (kuyruk.length) {
    const p = kuyruk.shift();
    for (const { dx, dy } of YONLER) {
      const x = p.x + dx;
      const y = p.y + dy;
      const s = y * G + x;
      if (!icinde(harita, x, y) || onceki.has(s) || !gecer(x, y)) continue;
      onceki.set(s, p.y * G + p.x);
      if (hedefler.has(s)) {
        const yol = [];
        for (let c = s; c !== basSira; c = onceki.get(c)) yol.push({ x: c % G, y: Math.floor(c / G) });
        return yol.reverse();
      }
      kuyruk.push({ x, y });
    }
  }
  return null;
}

// Bir ile girerken oyuncunun duracağı yer: gelinen ilin çıkışının ağzı ya da meydan.
export function girisNoktasi(harita, oncekiPlaka) {
  const kapi = harita.kapilar.find((k) => k.plaka === oncekiPlaka);
  return kapi ? { x: kapi.ix, y: kapi.iy } : { ...harita.dogus };
}

// ── Haritadaki düşmanlar ─────────────────────────────────

// İldeki sıradan düşman sayısı: arınmamış ilde 4, arınmış ilde 2; büyük illerin
// geniş haritalarında karo sayısının kareköküyle artar (Konya'da ≈ 10).
export function dusmanSayisi(arinma, harita = null) {
  const temel = arinma >= 100 ? 2 : 4;
  if (!harita) return temel;
  return Math.max(temel, Math.round(temel * Math.sqrt((harita.genislik * harita.yukseklik) / OLCU_KARO)));
}

// Yeni düşmanın belirebileceği karolar: meydandan ve çıkışlardan uzak açık alanlar.
export function dogusNoktalari(harita) {
  const noktalar = [];
  const m = harita.meydan;
  for (let y = 1; y < harita.yukseklik - 1; y++) {
    for (let x = 1; x < harita.genislik - 1; x++) {
      const t = karo(harita, x, y);
      if (t !== KARO.CIM && t !== KARO.YABANI) continue;
      const meydanaUzaklik = Math.max(m.x1 - x, x - m.x2, 0) + Math.max(m.y1 - y, y - m.y2, 0);
      if (meydanaUzaklik < 4) continue;
      if (harita.kapilar.some((k) => mesafe(k, { x, y }) < 3)) continue;
      if (harita.in && mesafe(harita.in, { x, y }) < 4) continue;
      noktalar.push({ x, y, yabani: t === KARO.YABANI });
    }
  }
  return noktalar;
}

// Oyuncudan en az `enAzUzaklik` uzakta, boş bir doğuş noktasına yeni bir düşman koyar.
// Çalılıklar tercih edilir. Uygun yer yoksa null.
// `bosslar` true ise düşman bazen bölgenin boss yaratıklarından biri, ilin haritasına
// göre güçlü bir gezgin boss olur (gezginBoss.js).
export function dusmanDogur(harita, plaka, rng, { dolu = [], oyuncu = null, enAzUzaklik = 6, id = 0, bosslar = false } = {}) {
  const adaylar = dogusNoktalari(harita).filter(
    (n) => !dolu.some((d) => mesafe(d, n) < 3) && (!oyuncu || mesafe(oyuncu, n) >= enAzUzaklik),
  );
  if (adaylar.length === 0) return null;
  const yabaniler = adaylar.filter((n) => n.yabani);
  const havuz = yabaniler.length && sans(rng, 0.7) ? yabaniler : adaylar;
  const n = havuz[Math.floor(rng() * havuz.length)];
  const boss = bosslar && sans(rng, GEZGIN_BOSS.dogusSansi)
    ? gezginBossUret(plaka, rng, { haric: inBosslari(dolu) })
    : null;
  return { id, dusman: boss ?? karsilasmaUret(plaka, rng), x: n.x, y: n.y, evX: n.x, evY: n.y };
}

// Haritadaki inlerde bekleyen boss yaratıkları: gezgin olarak bir daha çıkmazlar.
const inBosslari = (dusmanlar) => dusmanlar.filter((d) => d.sabit).map((d) => d.dusman.anahtar);

// Sürü: kurt, çakal gibi takipçi yaratıklar bazen tek başına değil, 2–3'lü sürü hâlinde
// doğar. Sürü üyeleri aynı türdendir ve öncünün 1–2 karo çevresinde durur; oyuncuyu birlikte
// kovalar ve birlikte saldırırlar.
export const SURU = {
  sansi: 0.4, // doğan takipçinin sürüyle gelme şansı
  ucluSansi: 0.25, // sürünün 2 yerine 3 yaratık olma şansı
};

// `onc` bir takipçiyse yanına (0–2) sürü üyesi üretir. `dolu`: haritada duran yaratıklar.
export function suruUyeleri(harita, onc, rng, { dolu = [], ilkId = 1 } = {}) {
  if (onc.sabit || onc.dusman.gezgin || !onc.dusman.takipci || !sans(rng, SURU.sansi)) return [];
  const uyeler = [];
  for (let i = 0; i < (sans(rng, SURU.ucluSansi) ? 2 : 1); i++) {
    const yerler = dogusNoktalari(harita).filter((n) => {
      const u = mesafe(n, onc);
      return u >= 1 && u <= 2 && ![...dolu, onc, ...uyeler].some((d) => d.x === n.x && d.y === n.y);
    });
    if (!yerler.length) break;
    const n = yerler[Math.floor(rng() * yerler.length)];
    uyeler.push({
      id: ilkId + i,
      dusman: dusmanOlustur(onc.dusman.anahtar, tamSayi(rng, ...ilSeviyesi(harita.plaka))),
      x: n.x, y: n.y, evX: n.x, evY: n.y,
    });
  }
  return uyeler;
}

// İlin düşmanlarını yerleştirir (arınmış illerde daha az düşman olur).
// `bosslar` true ise aralarında gezgin bosslar da bulunabilir; `dolu` ise haritada
// zaten duran düşmanlardır (inlerdeki bosslar).
export function dusmanlariYerlestir(harita, arinma, rng, { oyuncu = null, ilkId = 1, bosslar = false, dolu = [] } = {}) {
  const dusmanlar = [];
  const enCok = dusmanSayisi(arinma, harita);
  // Sürü üyeleri de toplam düşman sayısından sayılır
  for (let i = 0; i < enCok && dusmanlar.length < enCok; i++) {
    const d = dusmanDogur(harita, harita.plaka, rng, { dolu: [...dolu, ...dusmanlar], oyuncu, id: ilkId + dusmanlar.length, bosslar });
    if (!d) continue;
    dusmanlar.push(d);
    const suru = suruUyeleri(harita, d, rng, { dolu: [...dolu, ...dusmanlar], ilkId: ilkId + dusmanlar.length });
    dusmanlar.push(...suru.slice(0, enCok - dusmanlar.length));
  }
  return dusmanlar;
}

export const yankesiciMi = (d) => d.dusman?.sinif === 'yankesici';

export function davranisi(d) {
  if (d.dusman?.gezgin) return DAVRANIS.gezgin;
  if (yankesiciMi(d)) return DAVRANIS.yankesici;
  const dav = DAVRANIS[d.dusman?.takip] ?? (d.dusman?.takipci ? DAVRANIS.takipci : DAVRANIS.bekci);
  return d.kizgin && dav.hiz === 0 ? DAVRANIS.bekci : dav;
}

// ── Görüş ve menzil ──────────────────────────────────────

// İki karo arasında görüş açık mı? Aradaki karolar (iki uç hariç) Bresenham çizgisiyle
// taranır; ağaç, kaya, ev ya da yapı varsa görüş kapalıdır.
export function gorusAcikMi(harita, a, b) {
  const dx = Math.abs(b.x - a.x);
  const dy = -Math.abs(b.y - a.y);
  const sx = a.x < b.x ? 1 : -1;
  const sy = a.y < b.y ? 1 : -1;
  let hata = dx + dy;
  let x = a.x;
  let y = a.y;
  for (;;) {
    if (x === b.x && y === b.y) return true;
    if ((x !== a.x || y !== a.y) && !GORUS_GECER.has(karo(harita, x, y))) return false;
    const e2 = 2 * hata;
    if (e2 >= dy) { hata += dy; x += sx; }
    if (e2 <= dx) { hata += dx; y += sy; }
  }
}

// `b`, `a`'nın `menzil` karo erimi içinde (karo yolu uzaklığıyla) ve görüşünde mi?
export function menzildeMi(harita, a, b, menzil) {
  return mesafe(a, b) <= menzil && gorusAcikMi(harita, a, b);
}

// ── Sürpriz baskın ───────────────────────────────────────
// Oyuncu meydan dışında yürürken, son baskından bu yana en az `surprizBekleme` adım
// geçtiyse, her adımda `surprizSansi` olasılıkla bölgenin boss yaratıklarından biri
// hemen yanı başında belirir. Sonuç: yeni düşman kaydı (kovalıyor) ya da null.
// `adim`: son baskından bu yana atılan adım sayısı.
export function surprizBaskin(harita, { dusmanlar, oyuncu, adim, id }, rng) {
  if (adim < GEZGIN_BOSS.surprizBekleme || meydandaMi(harita, oyuncu)) return null;
  if (!sans(rng, GEZGIN_BOSS.surprizSansi)) return null;
  const yerler = YONLER.map(({ dx, dy }) => ({ x: oyuncu.x + dx, y: oyuncu.y + dy })).filter(
    (p) => dusmanYurunurMu(harita, p.x, p.y) && !dusmanlar.some((d) => d.x === p.x && d.y === p.y),
  );
  if (!yerler.length) return null;
  const dusman = gezginBossUret(harita.plaka, rng, { haric: inBosslari(dusmanlar) });
  if (!dusman) return null;
  const yer = yerler[Math.floor(rng() * yerler.length)];
  return {
    id, dusman, x: yer.x, y: yer.y, evX: yer.x, evY: yer.y,
    kovaliyor: true, surpriz: true, yon: Math.sign(oyuncu.x - yer.x) || -1,
  };
}

// Düşmanların bir tıkı. Oyuncu görüş uzaklığına girince düşman peşine düşer ve
// hemen bir adım atılır; oyuncu bırakma uzaklığından öteye kaçana, meydana girene
// ya da dokunulmaz olana dek kovalar (bırakınca kızgınlığı da geçer). Kovalarken oyuncu
// vuruş menziline girdiyse durup vurur: uzaktan vuranlar (cinler, ifritler) yaklaşmaz.
// Sersemleyen düşman (kayıttaki `sersem`) yerinden kıpırdamaz; sersemliği catisma.js azaltır.
// Kovalamayan düşman yuvasına döner ve çevresinde
// gezinir; gezinirken oyuncunun yanı başına sokulmaz (kayıtsız yaratıklarla ancak
// oyuncu üstlerine varırsa dövüşülür). Hız, tık başına biriken adım payıyla uygulanır. Meydana ve çıkışlara
// girmez, birbirinin ve oyuncunun üstüne basmaz; `engeller` (ör. seyyar tüccar) de
// geçilmez. Yeni dizi döndürür.
export function dusmanlariYurut(harita, dusmanlar, oyuncu, rng, { dokunulmaz = false, engeller = [] } = {}) {
  const sonuc = dusmanlar.map((d) => ({ ...d }));
  const dolu = (x, y, ben) =>
    (x === oyuncu.x && y === oyuncu.y)
    || engeller.some((e) => e.x === x && e.y === y)
    || sonuc.some((d) => d !== ben && d.x === x && d.y === y);
  const guvende = dokunulmaz || meydandaMi(harita, oyuncu);
  for (const d of sonuc) {
    if (d.sabit) continue; // boss ve mini bosslar ininden ayrılmaz
    if (d.sersem > 0) continue; // sersemleyen düşman yerinden kıpırdayamaz
    const dav = davranisi(d);
    const uzaklik = mesafe(d, oyuncu);
    if (guvende || uzaklik > dav.birakma) {
      d.kovaliyor = false;
      d.kizgin = false;
    } else if (!d.kovaliyor && (uzaklik <= dav.gorus || d.kizgin)) {
      d.kovaliyor = true;
      d.birikim = Math.max(d.birikim ?? 0, 1); // fark edince atılır
    }
    if (d.kovaliyor && menzildeMi(harita, d, oyuncu, dusmanMenzili(d.dusman))) {
      d.yon = Math.sign(oyuncu.x - d.x) || d.yon || -1;
      continue; // menzilde: yerinde durup vurur (catisma.js)
    }
    d.birikim = (d.birikim ?? 0) + (d.kovaliyor ? dav.hiz : DOLASMA_HIZI);
    if (d.birikim < 1) continue;
    d.birikim -= 1;
    let hedef = null;
    const ev = { x: d.evX, y: d.evY };
    if (d.kovaliyor) {
      const yol = yolBul(harita, d, oyuncu, { yurur: dusmanYurunurMu });
      if (yol && yol.length) hedef = yol[0];
    } else if (mesafe(d, ev) > DOLASMA_YARICAPI) {
      const yol = yolBul(harita, d, ev, { yurur: dusmanYurunurMu });
      if (yol && yol.length) hedef = yol[0];
    } else if (sans(rng, 0.5)) {
      const yon = YONLER[Math.floor(rng() * 4)];
      const aday = { x: d.x + yon.dx, y: d.y + yon.dy };
      if (mesafe(aday, ev) <= DOLASMA_YARICAPI) hedef = aday;
    }
    if (hedef && !d.kovaliyor && mesafe(hedef, oyuncu) <= 1) hedef = null;
    if (hedef && dusmanYurunurMu(harita, hedef.x, hedef.y) && !dolu(hedef.x, hedef.y, d)) {
      d.yon = Math.sign(hedef.x - d.x) || d.yon || -1;
      d.x = hedef.x;
      d.y = hedef.y;
    }
  }
  return sonuc;
}

// Bu tıkta oyuncunun peşine yeni düşen düşmanlar (önceki ve sonraki diziler karşılaştırılır).
export function yeniKovalayanlar(onceki, sonraki) {
  const eski = new Map(onceki.map((d) => [d.id, d]));
  return sonraki.filter((d) => d.kovaliyor && !eski.get(d.id)?.kovaliyor);
}

// ── Halk ─────────────────────────────────────────────────
// Meydanda ve çevresindeki sokaklarda dolaşan köylüler: yalnızca görünüştür, savaşa
// karışmazlar. Sayıları nüfusla artar (Bayburt'ta 1, İstanbul'da 10).

const HALK_YURUR = new Set([KARO.CIM, KARO.YOL, KARO.MEYDAN]);
const HALK_HIZI = 0.3;
export const HALK_TURLERI = 6; // çizimdeki kıyafet çeşidi

export function halkSayisi(plaka) {
  const il = ilHaritasi.get(plaka);
  return Math.max(1, Math.min(10, Math.round(Math.sqrt(il.nufus) / 400)));
}

// Halkın dolaşabileceği karo: meydan ya da meydana en çok `mahalle` karo uzaklıkta.
function halkYurunurMu(harita, x, y) {
  if (!HALK_YURUR.has(karo(harita, x, y))) return false;
  const m = harita.meydan;
  const uzaklik = Math.max(m.x1 - x, x - m.x2, 0) + Math.max(m.y1 - y, y - m.y2, 0);
  return uzaklik <= 3;
}

export function halkiYerlestir(harita, rng, { ilkId = 1 } = {}) {
  const adaylar = [];
  const m = harita.meydan;
  for (let y = m.y1 - 3; y <= m.y2 + 3; y++) {
    for (let x = m.x1 - 3; x <= m.x2 + 3; x++) {
      if (halkYurunurMu(harita, x, y) && !(x === harita.dogus.x && y === harita.dogus.y)) adaylar.push({ x, y });
    }
  }
  const halk = [];
  for (let i = 0; i < halkSayisi(harita.plaka) && adaylar.length; i++) {
    const [n] = adaylar.splice(Math.floor(rng() * adaylar.length), 1);
    halk.push({ id: ilkId + i, x: n.x, y: n.y, tur: tamSayi(rng, 0, HALK_TURLERI - 1), yon: sans(rng, 0.5) ? 1 : -1, birikim: rng() });
  }
  return halk;
}

// Halkın bir tıkı: ara sıra rastgele bir adım. Oyuncunun, düşmanların ve birbirlerinin
// üstüne basmazlar. Yeni dizi döndürür.
export function halkiYurut(harita, halk, oyuncu, dusmanlar, rng) {
  const sonuc = halk.map((h) => ({ ...h }));
  const dolu = (x, y, ben) =>
    (x === oyuncu.x && y === oyuncu.y)
    || dusmanlar.some((d) => mesafe(d, { x, y }) <= 1)
    || sonuc.some((h) => h !== ben && h.x === x && h.y === y);
  for (const h of sonuc) {
    h.birikim += HALK_HIZI;
    if (h.birikim < 1) continue;
    h.birikim -= 1;
    if (!sans(rng, 0.6)) continue;
    const yon = YONLER[Math.floor(rng() * 4)];
    const x = h.x + yon.dx;
    const y = h.y + yon.dy;
    if (halkYurunurMu(harita, x, y) && !dolu(x, y, h)) {
      h.yon = yon.dx || h.yon;
      h.x = x;
      h.y = y;
    }
  }
  return sonuc;
}

// ── Boss ve mini boss inleri (plan.md Faz 7) ─────────────
// İnlerdeki bosslar yerinden ayrılmaz ama menziline giren oyuncuya vurur.

// Bu ilin ininde bekleyen boss, mini boss ya da Zülmet (sabit düşman kaydı), yoksa boş dizi.
// Bölge bossu, yenilene dek (mühürlü olsa da) bossun ilinde görünür; mini boss ise
// ilin arınması eşiği geçince ortaya çıkar. Zülmet, Ağrı'daki kalede bekler.
export function ozelDusmanlar(harita, durum) {
  const il = ilHaritasi.get(harita.plaka);
  const bolge = bolgeler.find((b) => b.anahtar === il.bolge);
  const kayit = (id, anahtar, seviye, tur) => ({
    id, dusman: dusmanOlustur(anahtar, seviye), x: harita.in.x, y: harita.in.y,
    evX: harita.in.x, evY: harita.in.y, sabit: true, tur, yon: -1,
  });
  // Ağrı Dağı'ndaki kalede Zülmet bekler (kale açılana dek mühürlü)
  if (final.il === harita.plaka && ['muhurlu', 'acik'].includes(finalDurumu(durum))) {
    return [kayit('final', final.boss, final.dusmanSeviyesi, 'final')];
  }
  if (bolge.bossIli === harita.plaka && bossDurumu(durum, bolge.anahtar) !== 'yenildi') {
    return [kayit('boss', bolge.boss, bolgeSeviyesi(bolge.anahtar, durumRotasi(durum))[1], 'boss')];
  }
  if (miniBossVarMi(durum, harita.plaka)) {
    return [kayit('mini', bolge.miniBoss, ilSeviyesi(harita.plaka, durumRotasi(durum))[1] + 1, 'mini')];
  }
  return [];
}

// Haritadaki düşmanların inlerdekileri güncel duruma göre yenilenir (mini boss belirmiş,
// boss yenilmiş olabilir). Hâlâ inde bekleyen bossun kaydı (canı ve evresi) korunur.
export function ozelDusmanlariGuncelle(harita, dusmanlar, durum) {
  const eskiler = new Map(dusmanlar.filter((d) => d.sabit).map((d) => [d.id, d]));
  const yeniler = ozelDusmanlar(harita, durum).map((d) => {
    const eski = eskiler.get(d.id);
    return eski && eski.dusman.anahtar === d.dusman.anahtar ? eski : d;
  });
  return [...dusmanlar.filter((d) => !d.sabit), ...yeniler];
}

// İlin yaratık sayısı (inlerdeki bosslar ve yoldan geçen yankesiciler sayılmaz).
export function siradanDusmanSayisi(dusmanlar) {
  return dusmanlar.filter((d) => !d.sabit && !yankesiciMi(d)).length;
}
