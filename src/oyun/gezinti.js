// İl içi gezinti: karo harita üretimi, yürüme, yol bulma ve haritadaki düşmanlar.
// Saf oyun mantığı — DOM'a dokunmaz.
//
// Her ilin haritası plakasından türetilen sabit bir tohumla üretilir; aynı il her
// açılışta aynı görünür. Harita GENISLIK × YUKSEKLIK karodan oluşur, karolar satır
// satır tek bir dizide tutulur (sira = y × GENISLIK + x).
import { iller } from '../veri/iller.js';
import { bolgeler } from '../veri/bolgeler.js';
import { karsilasmaUret } from './kesif.js';
import { dusmanOlustur } from './savas.js';
import { bossDurumu, miniBossVarMi } from './ilerleme.js';
import { rastgeleUreteci, tamSayi, sans } from './rastgele.js';

export const GENISLIK = 25;
export const YUKSEKLIK = 31;

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
};

const OYUNCU_YURUR = new Set([KARO.CIM, KARO.YOL, KARO.YABANI, KARO.MEYDAN, KARO.KAPI]);
const DUSMAN_YURUR = new Set([KARO.CIM, KARO.YOL, KARO.YABANI]); // meydan ve çıkışlar güvenli

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
const KOVALAMA_MENZILI = 4;
const DOLASMA_YARICAPI = 3;

const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const KOS39 = Math.cos((39 * Math.PI) / 180);

export const mesafe = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const icinde = (x, y) => x >= 0 && y >= 0 && x < GENISLIK && y < YUKSEKLIK;
const YONLER = [
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
];

export function karo(harita, x, y) {
  return icinde(x, y) ? harita.karolar[y * GENISLIK + x] : KARO.AGAC;
}

export function yurunurMu(harita, x, y) {
  return OYUNCU_YURUR.has(karo(harita, x, y));
}

export function dusmanYurunurMu(harita, x, y) {
  return DUSMAN_YURUR.has(karo(harita, x, y));
}

// Harita kenarındaki karolar saat yönünde (köşeler hariç), çıkışların yerleşeceği yerler.
function cevreKarolari() {
  const c = [];
  for (let x = 1; x < GENISLIK - 1; x++) c.push({ x, y: 0, ix: x, iy: 1 });
  for (let y = 1; y < YUKSEKLIK - 1; y++) c.push({ x: GENISLIK - 1, y, ix: GENISLIK - 2, iy: y });
  for (let x = GENISLIK - 2; x > 0; x--) c.push({ x, y: YUKSEKLIK - 1, ix: x, iy: YUKSEKLIK - 2 });
  for (let y = YUKSEKLIK - 2; y > 0; y--) c.push({ x: 0, y, ix: 1, iy: y });
  return c;
}
const CEVRE = cevreKarolari();

// Komşu illerin çıkışlarını, komşunun gerçek yönüne bakan kenar karolarına yerleştirir.
function kapilariYerlestir(il, merkez) {
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
  const G = GENISLIK;
  const Y = YUKSEKLIK;
  const k = new Array(G * Y).fill(KARO.CIM);
  const koy = (x, y, tur) => {
    if (icinde(x, y)) k[y * G + x] = tur;
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
  obek(KARO.YABANI, doga.yabani, 1, 3);
  obek(KARO.SU, doga.su, 2, 3);
  obek(KARO.AGAC, doga.agac, 1, 2);
  obek(KARO.KAYA, doga.kaya, 0, 1);

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
  const kapilar = kapilariYerlestir(il, merkez);
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

  // 5. Evler: meydanın çevresinde, çimenlik karolarda
  let ev = 0;
  for (let deneme = 0; deneme < 200 && ev < doga.ev; deneme++) {
    const x = tamSayi(rng, meydan.x1 - 5, meydan.x2 + 5);
    const y = tamSayi(rng, meydan.y1 - 5, meydan.y2 + 5);
    if (x < 2 || y < 2 || x > G - 3 || y > Y - 3) continue;
    if (al(x, y) !== KARO.CIM) continue;
    if (x >= meydan.x1 - 1 && x <= meydan.x2 + 1 && y >= meydan.y1 - 1 && y <= meydan.y2 + 1) continue;
    koy(x, y, KARO.EV);
    ev++;
  }

  // 6. Meydandaki yapılar
  const tezgah = { x: merkez.x - 2, y: merkez.y - 1 };
  const cesme = { x: merkez.x, y: merkez.y - 1 };
  const tabela = { x: merkez.x + 2, y: merkez.y - 1 };
  koy(tezgah.x, tezgah.y, KARO.TEZGAH);
  koy(cesme.x, cesme.y, KARO.CESME);
  koy(tabela.x, tabela.y, KARO.TABELA);
  const dogus = { x: merkez.x, y: merkez.y + 1 };

  // 7. Bağlantı: meydandan yürünerek ulaşılamayan açık alanlar engelle doldurulur
  const harita = { plaka, bolge: il.bolge, karolar: k, kapilar, meydan, dogus, tezgah, cesme, tabela };
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

function enUzakKaro(harita) {
  const uzaklik = new Map([[harita.dogus.y * GENISLIK + harita.dogus.x, 0]]);
  const kuyruk = [harita.dogus];
  let enIyi = harita.dogus;
  let enIyiUzaklik = -1;
  while (kuyruk.length) {
    const p = kuyruk.shift();
    const u = uzaklik.get(p.y * GENISLIK + p.x);
    const t = karo(harita, p.x, p.y);
    const uygun = (t === KARO.CIM || t === KARO.YABANI) && !harita.kapilar.some((k) => mesafe(k, p) < 4);
    if (uygun && u > enIyiUzaklik) {
      enIyi = p;
      enIyiUzaklik = u;
    }
    for (const { dx, dy } of YONLER) {
      const x = p.x + dx;
      const y = p.y + dy;
      const s = y * GENISLIK + x;
      if (icinde(x, y) && !uzaklik.has(s) && yurunurMu(harita, x, y)) {
        uzaklik.set(s, u + 1);
        kuyruk.push({ x, y });
      }
    }
  }
  return { x: enIyi.x, y: enIyi.y };
}

// Bir noktadan yürünerek ulaşılabilen karoların sıra numaraları.
export function ulasilabilir(harita, bas, yurur = yurunurMu) {
  const gorulen = new Set([bas.y * GENISLIK + bas.x]);
  const kuyruk = [bas];
  while (kuyruk.length) {
    const p = kuyruk.shift();
    for (const { dx, dy } of YONLER) {
      const x = p.x + dx;
      const y = p.y + dy;
      const s = y * GENISLIK + x;
      if (icinde(x, y) && !gorulen.has(s) && yurur(harita, x, y)) {
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

// Engelle karşılaşılan karo bir yapıysa türü: 'cesme' | 'tezgah' | 'tabela'.
export function etkilesimTuru(harita, x, y) {
  return { [KARO.CESME]: 'cesme', [KARO.TEZGAH]: 'tezgah', [KARO.TABELA]: 'tabela' }[karo(harita, x, y)] ?? null;
}

// İlk adımı ile birlikte en kısa yol (başlangıç hariç). Hedef yürünemiyorsa ona
// komşu en yakın yürünür karoya gidilir. Ulaşılamazsa null.
// `engeller`: geçilemeyecek ek noktalar (ör. düşmanlar).
export function yolBul(harita, bas, hedef, { yurur = yurunurMu, engeller = [] } = {}) {
  const engel = new Set(engeller.map((p) => p.y * GENISLIK + p.x));
  const gecer = (x, y) => yurur(harita, x, y) && !engel.has(y * GENISLIK + x);
  const hedefler = new Set();
  if (gecer(hedef.x, hedef.y)) hedefler.add(hedef.y * GENISLIK + hedef.x);
  else {
    for (const { dx, dy } of YONLER) {
      const x = hedef.x + dx;
      const y = hedef.y + dy;
      if (icinde(x, y) && gecer(x, y)) hedefler.add(y * GENISLIK + x);
    }
  }
  const basSira = bas.y * GENISLIK + bas.x;
  if (hedefler.has(basSira)) return [];
  const onceki = new Map([[basSira, -1]]);
  const kuyruk = [bas];
  while (kuyruk.length) {
    const p = kuyruk.shift();
    for (const { dx, dy } of YONLER) {
      const x = p.x + dx;
      const y = p.y + dy;
      const s = y * GENISLIK + x;
      if (!icinde(x, y) || onceki.has(s) || !gecer(x, y)) continue;
      onceki.set(s, p.y * GENISLIK + p.x);
      if (hedefler.has(s)) {
        const yol = [];
        for (let c = s; c !== basSira; c = onceki.get(c)) yol.push({ x: c % GENISLIK, y: Math.floor(c / GENISLIK) });
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

export function dusmanSayisi(arinma) {
  return arinma >= 100 ? 2 : 4;
}

// Yeni düşmanın belirebileceği karolar: meydandan ve çıkışlardan uzak açık alanlar.
export function dogusNoktalari(harita) {
  const noktalar = [];
  const m = harita.meydan;
  for (let y = 1; y < YUKSEKLIK - 1; y++) {
    for (let x = 1; x < GENISLIK - 1; x++) {
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
export function dusmanDogur(harita, plaka, rng, { dolu = [], oyuncu = null, enAzUzaklik = 6, id = 0 } = {}) {
  const adaylar = dogusNoktalari(harita).filter(
    (n) => !dolu.some((d) => mesafe(d, n) < 3) && (!oyuncu || mesafe(oyuncu, n) >= enAzUzaklik),
  );
  if (adaylar.length === 0) return null;
  const yabaniler = adaylar.filter((n) => n.yabani);
  const havuz = yabaniler.length && sans(rng, 0.7) ? yabaniler : adaylar;
  const n = havuz[Math.floor(rng() * havuz.length)];
  return { id, dusman: karsilasmaUret(plaka, rng), x: n.x, y: n.y, evX: n.x, evY: n.y };
}

// İlin düşmanlarını yerleştirir (arınmış illerde daha az düşman olur).
export function dusmanlariYerlestir(harita, arinma, rng, { oyuncu = null, ilkId = 1 } = {}) {
  const dusmanlar = [];
  for (let i = 0; i < dusmanSayisi(arinma); i++) {
    const d = dusmanDogur(harita, harita.plaka, rng, { dolu: dusmanlar, oyuncu, id: ilkId + i });
    if (d) dusmanlar.push(d);
  }
  return dusmanlar;
}

// Düşmanların bir hamlesi: oyuncu yakındaysa (ve dokunulmaz değilse) peşine düşer,
// değilse yuvasının çevresinde gezinir. Meydana ve çıkışlara girmez, birbirinin ve
// oyuncunun üstüne basmaz. Yeni dizi döndürür.
export function dusmanlariYurut(harita, dusmanlar, oyuncu, rng, { dokunulmaz = false } = {}) {
  const sonuc = dusmanlar.map((d) => ({ ...d }));
  const dolu = (x, y, ben) =>
    (x === oyuncu.x && y === oyuncu.y) || sonuc.some((d) => d !== ben && d.x === x && d.y === y);
  for (const d of sonuc) {
    if (d.sabit) continue; // boss ve mini bosslar ininden ayrılmaz
    let hedef = null;
    if (!dokunulmaz && !meydandaMi(harita, oyuncu) && mesafe(d, oyuncu) <= KOVALAMA_MENZILI) {
      const yol = yolBul(harita, d, oyuncu, { yurur: dusmanYurunurMu });
      if (yol && yol.length) hedef = yol[0];
    } else if (sans(rng, 0.5)) {
      const yon = YONLER[Math.floor(rng() * 4)];
      const aday = { x: d.x + yon.dx, y: d.y + yon.dy };
      if (Math.abs(aday.x - d.evX) + Math.abs(aday.y - d.evY) <= DOLASMA_YARICAPI) hedef = aday;
    }
    if (hedef && dusmanYurunurMu(harita, hedef.x, hedef.y) && !dolu(hedef.x, hedef.y, d)) {
      d.yon = Math.sign(hedef.x - d.x) || d.yon || -1;
      d.x = hedef.x;
      d.y = hedef.y;
    }
  }
  return sonuc;
}

// Oyuncuya değen (aynı ya da bitişik karodaki) ilk düşman. Meydanda temas olmaz.
export function temasEdenDusman(harita, dusmanlar, oyuncu) {
  if (meydandaMi(harita, oyuncu)) return null;
  return dusmanlar.find((d) => mesafe(d, oyuncu) <= 1) ?? null;
}

// ── Boss ve mini boss inleri (plan.md Faz 7) ─────────────

// Bu ilin ininde bekleyen boss ya da mini boss (sabit düşman kaydı), yoksa boş dizi.
// Bölge bossu, yenilene dek (mühürlü olsa da) bossun ilinde görünür; mini boss ise
// ilin arınması eşiği geçince ortaya çıkar.
export function ozelDusmanlar(harita, durum) {
  const il = ilHaritasi.get(harita.plaka);
  const bolge = bolgeler.find((b) => b.anahtar === il.bolge);
  const kayit = (id, anahtar, seviye, tur) => ({
    id, dusman: dusmanOlustur(anahtar, seviye), x: harita.in.x, y: harita.in.y,
    evX: harita.in.x, evY: harita.in.y, sabit: true, tur, yon: -1,
  });
  if (bolge.bossIli === harita.plaka && bossDurumu(durum, bolge.anahtar) !== 'yenildi') {
    return [kayit('boss', bolge.boss, bolge.seviye[1], 'boss')];
  }
  if (miniBossVarMi(durum, harita.plaka)) {
    return [kayit('mini', bolge.miniBoss, il.seviye[1] + 1, 'mini')];
  }
  return [];
}

export function siradanDusmanSayisi(dusmanlar) {
  return dusmanlar.filter((d) => !d.sabit).length;
}
