// Savaş motoru. Saf oyun mantığı — DOM'a dokunmaz.
// Savaş ayrı bir ekranda değil, il haritasında (gezinti ekranında) gerçek zamanlı geçer:
// oyuncu ve düşmanlar menzillerine girince belli aralıklarla birbirine vurur (kim, ne
// zaman, kime vurur: catisma.js). Bu dosya tek bir hamlenin sonucunu hesaplar.
// Her fonksiyon yeni değerler döndürür, verilenleri değiştirmez. Rastgelelik dışarıdan
// verilen `rng` (rastgele.js) ile gelir.
//
// Hamlelerin sonucu metin değil, olay nesneleridir ({ tip, ... }); arayüz bunları
// haritada uçan yazılara ve bildirimlere çevirir.
//
// Oyuncunun savaş etkileri (Korunma, güçlenme, Keskin göz, ürkme) oyun durumunda değil,
// gezintide tutulur ve her hamleye `etkiler` olarak verilir:
//   [{ etki: 'savunma' | 'guclenme' | 'kritik' | 'zayiflatma', deger, kalan }]
// 'savunma' düşmanın her vuruş hamlesinde, diğerleri oyuncunun her saldırısında bir azalır.
import {
  dusmanlar,
  OZEL_HAMLELER,
  OZEL_HAMLE_SANSI,
  BOSS_OZEL_HAMLE_SANSI,
  EVRE_OZEL_HAMLE_SANSI,
  EVRE_GUC_CARPANI,
  SINIF_XP_CARPANI,
  DUSMAN_MENZILI,
} from '../veri/dusmanlar.js';
import { siniflar } from '../veri/siniflar.js';
import { yemekler } from '../veri/yemekler.js';
import { yemekYe, yemekYeKontrol } from './envanter.js';
import { statlar, acikYetenekler, tamIyilestir } from './karakter.js';
import { aralik, sans, sec } from './rastgele.js';
import { sofraGucCarpani } from './ilerleme.js';
import { dusmanCarpanlari } from './rota.js';

// ── Formüller (plan.md Bölüm 5) ──────────────────────────

export const KRITIK_CARPANI = 1.5;
// Kritik şansı tavanı (%30) ve onun için gereken çeviklik (30 / 0,8 = 37,5).
export const KRITIK_SANS_TAVANI = 0.3;
export const KRITIK_TAVAN_CEVIKLIGI = KRITIK_SANS_TAVANI / 0.008;
// Tavanı aşan çeviklik boşa gitmez: yiğidin kritik vuruşunu güçlendirir. Tavanın üstündeki
// her çeviklik puanı kritik çarpanına 0,006 ekler; en çok +0,5 (×2,0).
export const KRITIK_EK_HASAR = { ceviklikBasi: 0.006, enCok: 0.5 };
export const BAYILMA_AKCE_KAYBI = 0.1;

// Aynı anda vuran yaratıkların her birinin vuruş gücü, sayıları arttıkça azalır (kalabalıkta
// herkes tam vuramaz). Savunma her vuruştan ayrıca düşüldüğü için toplam hasar sayıyla doğru
// orantılı artmaz; asıl tehlike düşürülecek can havuzunun büyümesidir. Bir yaratığı
// düşürmek ya da menzilinden çıkmak vuran sayısını azaltır.
export const TOPLU_HASAR_CARPANI = { 1: 1, 2: 0.55, 3: 0.38 };
export const EN_COK_SALDIRGAN = 3;

// max(1, round(güç × çarpan × rnd − savunma × 0.5)); kritik vuruş ×1.5 (yiğitte
// çevikliğine göre daha çok: kritikCarpani). `ek`: belirli düşman türlerine verilen ek hasar çarpanı.
export function hasarHesapla({ guc, savunma, rnd = 1, carpan = 1, kritik = false, kritikCarpi = KRITIK_CARPANI, ek = 1 }) {
  let hasar = guc * carpan * rnd - savunma * 0.5;
  if (kritik) hasar *= kritikCarpi;
  hasar *= ek;
  return Math.max(1, Math.round(hasar));
}

// min(%30, çeviklik × %0.8). `bonus` (ör. Kartal Gözü) bu sınırın üstüne eklenir.
export function kritikSansi(ceviklik, bonus = 0) {
  return Math.min(KRITIK_SANS_TAVANI, ceviklik * 0.008) + bonus;
}

// Yiğidin kritik vuruş çarpanı: 1,5; kritik şansını tavana taşıyan çevikliğin (37,5)
// üstündeki her puan 0,006 ekler, en çok 2,0. Düşmanlar her zaman 1,5 ile vurur.
export function kritikCarpani(ceviklik) {
  const artan = Math.max(0, ceviklik - KRITIK_TAVAN_CEVIKLIGI);
  return KRITIK_CARPANI + Math.min(KRITIK_EK_HASAR.enCok, artan * KRITIK_EK_HASAR.ceviklikBasi);
}

// Saldırılanın hamleden sıyrılma şansı: min(%20, çeviklik × %0.5).
export function kacinmaSansi(ceviklik) {
  return Math.min(0.2, ceviklik * 0.005);
}

// Düşman statları seviye ve tür çarpanıyla ölçeklenir. Çarpan, yaratığın bölgesinin
// rotadaki kademesine göredir (rota.js → dusmanCarpanlari; klasik rotada veridekiyle aynı).
export function dusmanStatlari(anahtar, seviye) {
  const c = dusmanCarpanlari(anahtar);
  return {
    can: Math.round((20 + seviye * 12) * c.can),
    guc: Math.round((6 + seviye * 2) * c.guc),
    savunma: Math.round((4 + seviye * 1.5) * c.savunma),
    ceviklik: Math.round((4 + seviye) * c.ceviklik),
  };
}

// Yenilen düşmanın verdiği XP: round((5 + sv × 10) × sınıf çarpanı).
// Gezgin bossların çarpanı sınıflarından bağımsızdır (SINIF_XP_CARPANI.gezgin).
export function xpOdulu(anahtar, seviye, carpan = SINIF_XP_CARPANI[dusmanlar[anahtar].sinif]) {
  return Math.round((5 + seviye * 10) * carpan);
}

// Yenilen bir düşmanın XP'si (gezgin bosslar kendi çarpanıyla).
export const dusmanXp = (d) => xpOdulu(d.anahtar, d.seviye, d.gezgin ? SINIF_XP_CARPANI.gezgin : undefined);

// ── Menziller ────────────────────────────────────────────

// Düşmanın vuruş menzili (karo): türüne göre (dusmanlar.js → DUSMAN_MENZILI).
export function dusmanMenzili(dusman) {
  return dusman.menzil ?? DUSMAN_MENZILI[dusman.tur] ?? 1;
}

export function yetenekBul(sinifAnahtari, yetenekAnahtari) {
  return siniflar[sinifAnahtari].yetenekler.find((y) => y.anahtar === yetenekAnahtari);
}

// Eylemin menzili: saldırıda sınıfın vuruş menzili, hasar yeteneğinde yeteneğin kendi
// menzili (yoksa sınıfınki). Hedef gerektirmeyen eylemlerde (yemek, şifa, güçlenme…) null.
export function eylemMenzili(sinif, eylem) {
  if (eylem?.tur === 'saldir') return siniflar[sinif].menzil;
  if (eylem?.tur !== 'yetenek') return null;
  const y = yetenekBul(sinif, eylem.anahtar);
  if (!y || y.etki !== 'hasar') return null;
  return y.menzil ?? siniflar[sinif].menzil;
}

// ── Savaşanlar ───────────────────────────────────────────

export function dusmanOlustur(anahtar, seviye) {
  const veri = dusmanlar[anahtar];
  if (!veri) throw new Error(`Bilinmeyen düşman: ${anahtar}`);
  const s = dusmanStatlari(anahtar, seviye);
  return {
    anahtar,
    ad: veri.ad,
    ikon: veri.ikon,
    tur: veri.tur,
    sinif: veri.sinif,
    takip: veri.takip ?? 'bekci',
    takipci: veri.takip === 'takipci',
    menzil: DUSMAN_MENZILI[veri.tur] ?? 1,
    seviye,
    canEnCok: s.can,
    can: s.can,
    guc: s.guc,
    savunma: s.savunma,
    ceviklik: s.ceviklik,
  };
}

// Oyuncunun savaştaki değerleri: güncel statlar, zafer sofrasının güç çarpanı ve açık yetenekler.
export function savasci(durum) {
  const o = durum.oyuncu;
  const s = statlar(o);
  return {
    sinif: o.sinif,
    seviye: o.seviye,
    canEnCok: s.can,
    can: Math.min(o.can, s.can),
    nefesEnCok: s.nefes,
    nefes: Math.min(o.nefes, s.nefes),
    guc: Math.round(s.guc * sofraGucCarpani(durum)),
    savunma: s.savunma,
    ceviklik: s.ceviklik,
    yetenekler: acikYetenekler(o).map((y) => y.anahtar),
  };
}

// Eylem yapılabilir mi? Sonuç: { olur: true } ya da { olur: false, neden }.
// neden: 'bilinmeyen_eylem' | 'kilitli_yetenek' | 'nefes_yetersiz' | 'bilinmeyen_yemek'
//        | 'yemek_yok' | 'dolu' (yemeğin yenileyeceği bir şey yok)
// Menzil ve hedef burada denetlenmez; haritaya bağlıdır (catisma.js).
export function eylemKontrol(durum, eylem) {
  switch (eylem?.tur) {
    case 'saldir':
      return { olur: true };
    case 'yetenek': {
      const y = yetenekBul(durum.oyuncu.sinif, eylem.anahtar);
      if (!y || !acikYetenekler(durum.oyuncu).some((a) => a.anahtar === y.anahtar)) return { olur: false, neden: 'kilitli_yetenek' };
      if (savasci(durum).nefes < y.nefes) return { olur: false, neden: 'nefes_yetersiz' };
      return { olur: true };
    }
    case 'yemek': {
      if (!yemekler[eylem.anahtar]) return { olur: false, neden: 'bilinmeyen_yemek' };
      const k = yemekYeKontrol(durum, eylem.anahtar);
      return k.olur ? k : { olur: false, neden: k.neden === 'yok' ? 'yemek_yok' : 'dolu' };
    }
    default:
      return { olur: false, neden: 'bilinmeyen_eylem' };
  }
}

// ── Etkiler ──────────────────────────────────────────────

const etkiDegeri = (etkiler, etki) => etkiler.find((e) => e.etki === etki)?.deger ?? 0;

const etkiEkle = (etkiler, etki, deger, sure) => [
  ...etkiler.filter((e) => e.etki !== etki),
  { etki, deger, kalan: sure },
];

const etkiTuket = (etkiler, etkiAdlari) => etkiler
  .map((e) => (etkiAdlari.includes(e.etki) ? { ...e, kalan: e.kalan - 1 } : e))
  .filter((e) => e.kalan > 0);

// ── Oyuncunun hamlesi ────────────────────────────────────

// Sersemleyen düşman bu kadar tık yürüyemez ve vuramaz (catisma.js). Bosslar, mini bosslar
// ve gezgin bosslar sihirle korunur: sersemleme onlarda yarı sürer.
export function sersemSuresi(dusman, sure) {
  const korunakli = dusman.gezgin || !['siradan', 'yankesici'].includes(dusman.sinif);
  return korunakli ? Math.ceil(sure / 2) : sure;
}

// Oyuncunun bir düşmana tek vuruşu. `guc` ve `kritikBonusu` hamlenin başında etkilerle
// hesaplanmıştır. Sonuç: { hedef, olay }.
function oyuncuVurusu(o, hedef, rng, { guc, kritikBonusu = 0, carpan = 1, yetenek = null }) {
  const olay = { tip: yetenek ? 'yetenek' : 'saldiri', kim: 'oyuncu', yetenek: yetenek?.anahtar };
  if (sans(rng, kacinmaSansi(hedef.ceviklik))) return { hedef, olay: { ...olay, kacindi: true, hasar: 0 } };

  const kritik = sans(rng, kritikSansi(o.ceviklik, kritikBonusu));
  const ekHasar = Boolean(yetenek?.ekHasarTurleri?.includes(hedef.tur));
  const hasar = hasarHesapla({
    guc,
    savunma: hedef.savunma,
    rnd: aralik(rng, 0.9, 1.1),
    carpan,
    kritik,
    kritikCarpi: kritikCarpani(o.ceviklik),
    ek: ekHasar ? yetenek.ekHasarCarpani : 1,
  });
  const yeni = { ...hedef, can: Math.max(0, hedef.can - hasar) };
  const sersem = yetenek?.sersem && yeni.can > 0 ? { sersem: sersemSuresi(hedef, yetenek.sersem) } : {};
  return { hedef: yeni, olay: { ...olay, hasar, kritik, ekHasar, ...sersem } };
}

// Bir düşmana art arda `kac` vuruş (Çifte Ok); düşen düşmana vurulmaz. Ardından evre
// denetlenir. `ek`: alan vuruşunda ek hedefin sırası (olaylara yazılır).
// Sonuç: { hedef, olaylar }.
function vuruslar(o, hedef, rng, { kac = 1, ek, ...secenek }) {
  const isaret = ek === undefined ? {} : { ek };
  const olaylar = [];
  let h = hedef;
  for (let i = 0; i < kac && h.can > 0; i++) {
    const r = oyuncuVurusu(o, h, rng, secenek);
    h = r.hedef;
    olaylar.push({ ...r.olay, ...isaret });
  }
  const evre = evreKontrol(h);
  if (evre.hedef.can <= 0) olaylar.push({ tip: 'dustu', kim: 'dusman', ...isaret });
  else if (evre.olay) olaylar.push({ ...evre.olay, ...isaret });
  return { hedef: evre.hedef, olaylar };
}

// Bölge bossu canı yarının altına düşünce bir kez güçlenir (gezgin bosslar güçlenmez).
// Zülmet ise üç evreli savaşır: canı her evre eşiğinin altına düşünce sıradaki evreye geçer.
// Evre bilgisi düşmanın üzerinde tutulur (evre, evreNo); güçlenmeden önceki gücü de
// (temelGuc) toparlanınca geri gelsin diye saklanır. Sonuç: { hedef, olay | null }.
function evreKontrol(d) {
  if (d.can <= 0) return { hedef: d, olay: null };
  if (d.sinif === 'final') {
    const evreler = dusmanlar[d.anahtar].evreler ?? [];
    const simdiki = d.evreNo ?? 1;
    const hedefEvre = 1 + evreler.filter((e) => d.can < d.canEnCok * e.can).length;
    if (hedefEvre <= simdiki) return { hedef: d, olay: null };
    let guc = d.guc;
    for (let n = simdiki; n < hedefEvre; n++) guc = Math.round(guc * evreler[n - 1].guc);
    return {
      hedef: { ...d, temelGuc: d.temelGuc ?? d.guc, guc, evre: true, evreNo: hedefEvre },
      olay: { tip: 'evre', kim: 'dusman', no: hedefEvre },
    };
  }
  if (d.sinif !== 'bolge_bossu' || d.gezgin || d.evre || d.can * 2 >= d.canEnCok) return { hedef: d, olay: null };
  return {
    hedef: { ...d, temelGuc: d.guc, guc: Math.round(d.guc * EVRE_GUC_CARPANI), evre: true },
    olay: { tip: 'evre', kim: 'dusman' },
  };
}

// Oyuncunun bir hamlesi:
//   { tur: 'saldir' }            → hedefe vuruş
//   { tur: 'yetenek', anahtar }  → nefes harcar; hasar yeteneği hedefe vurur, diğerleri
//                                  yiğidin kendisine etki eder (şifa, korunma, güçlenme…)
//   { tur: 'yemek', anahtar }    → heybeden bir yemek yer
// `hedef`: vurulacak düşman (saldırı ve hasar yeteneğinde gerekir). `ekHedefler`: alan
// vuruşunda (yetenek.alan) hedefin yanında vurulacak düşmanlar; hangilerinin alanda olduğu
// haritaya bağlıdır (catisma.js). Yapılamayan hamlede her şey olduğu gibi döner ve olay
// listesi boştur.
// Sonuç: { durum, hedef (güncel düşman ya da null), ekHedefler, etkiler, olaylar }.
// Güçlenme, kritik ve ürkme etkileri hamle başına bir kez azalır (çok vuruşlu yetenekte de).
// Hedef düşerse olaylara { tip: 'dustu' } eklenir; bossun evre değişimi { tip: 'evre' }.
// Ek hedeflerin olayları `ek` (ekHedefler sırası) taşır.
export function oyuncuHamlesi(durum, eylem, rng, { hedef = null, ekHedefler = [], etkiler = [] } = {}) {
  const bos = { durum, hedef, ekHedefler, etkiler, olaylar: [] };
  if (!eylemKontrol(durum, eylem).olur) return bos;
  const o = savasci(durum);

  if (eylem.tur === 'yemek') {
    const r = yemekYe(durum, eylem.anahtar);
    return { ...bos, durum: r.durum, olaylar: [{ tip: 'yemek', kim: 'oyuncu', yemek: eylem.anahtar, yenilenen: r.tur, miktar: r.miktar }] };
  }

  const yetenek = eylem.tur === 'yetenek' ? yetenekBul(o.sinif, eylem.anahtar) : null;
  const vurus = !yetenek || yetenek.etki === 'hasar';
  if (vurus && (!hedef || hedef.can <= 0)) return bos;

  const yeniOyuncu = { ...durum.oyuncu, can: o.can, nefes: o.nefes - (yetenek?.nefes ?? 0) };
  let yeniEtkiler = etkiler;
  let yeniHedef = hedef;
  let yeniEkler = ekHedefler;
  const olaylar = [];

  if (vurus) {
    const guc = o.guc * Math.max(0, 1 + etkiDegeri(etkiler, 'guclenme') - etkiDegeri(etkiler, 'zayiflatma'));
    const secenek = { guc, kritikBonusu: etkiDegeri(etkiler, 'kritik'), yetenek };
    yeniEtkiler = etkiTuket(etkiler, ['guclenme', 'kritik', 'zayiflatma']);
    const r = vuruslar(o, hedef, rng, { ...secenek, carpan: yetenek?.carpan ?? 1, kac: yetenek?.vurus ?? 1 });
    yeniHedef = r.hedef;
    olaylar.push(...r.olaylar);
    if (yetenek?.alan) {
      yeniEkler = ekHedefler.map((ekHedef, ek) => {
        if (ekHedef.can <= 0) return ekHedef;
        const e = vuruslar(o, ekHedef, rng, { ...secenek, carpan: yetenek.alanCarpani, ek });
        olaylar.push(...e.olaylar);
        return e.hedef;
      });
    }
  } else if (yetenek.etki === 'sifa') {
    const miktar = Math.min(o.canEnCok - o.can, Math.round(o.canEnCok * yetenek.deger));
    yeniOyuncu.can += miktar;
    const olay = { tip: 'yetenek', kim: 'oyuncu', yetenek: yetenek.anahtar, etki: 'sifa', miktar };
    if (yetenek.arindirir && etkiler.some((e) => e.etki === 'zayiflatma')) {
      yeniEtkiler = etkiler.filter((e) => e.etki !== 'zayiflatma');
      olay.arindi = true;
    }
    olaylar.push(olay);
  } else {
    yeniEtkiler = etkiEkle(etkiler, yetenek.etki, yetenek.deger, yetenek.sure);
    olaylar.push({ tip: 'yetenek', kim: 'oyuncu', yetenek: yetenek.anahtar, etki: yetenek.etki, sure: yetenek.sure });
  }

  return { durum: { ...durum, oyuncu: yeniOyuncu }, hedef: yeniHedef, ekHedefler: yeniEkler, etkiler: yeniEtkiler, olaylar };
}

// ── Düşmanın hamlesi ─────────────────────────────────────

// Düşmanın özel hamleleri: bosslar ve mini bosslar kendi listelerini, diğerleri
// türlerinin hamlesini kullanır. Zülmet her evrede yeni hamleler kullanır.
export function ozelHamleler(dusman, evreNo = dusman.evreNo ?? 1) {
  const veri = dusmanlar[dusman.anahtar];
  if (evreNo > 1 && veri?.evreler) return veri.evreler[evreNo - 2].ozelHamleler;
  return veri?.ozelHamleler ?? [OZEL_HAMLELER[dusman.tur]].filter(Boolean);
}

function ozelHamleSansi(d) {
  if ((d.evreNo ?? 1) > 1) {
    const evre = dusmanlar[d.anahtar].evreler?.[d.evreNo - 2];
    if (evre) return evre.ozelHamleSansi;
  }
  if (d.evre) return EVRE_OZEL_HAMLE_SANSI;
  return d.sinif === 'siradan' ? OZEL_HAMLE_SANSI : BOSS_OZEL_HAMLE_SANSI;
}

// Düşmanın oyuncuya bir hamlesi: çoğunlukla vurur, bazen özel hamle yapar.
// `hasarCarpani`: kalabalık çarpanı (TOPLU_HASAR_CARPANI). Korunma etkisi vuruşun hasarını
// azaltır ve her vuruş hamlesinde bir azalır. Sonuç: { durum, etkiler, olay }.
export function dusmanHamlesi(durum, dusman, rng, { etkiler = [], hasarCarpani = 1 } = {}) {
  const o = savasci(durum);
  const hamleler = ozelHamleler(dusman);
  const ozelMi = hamleler.length > 0 && sans(rng, ozelHamleSansi(dusman));
  const ozel = ozelMi ? sec(rng, hamleler) : null;

  if (ozelMi && ozel.etki === 'zayiflatma') {
    return {
      durum,
      etkiler: etkiEkle(etkiler, 'zayiflatma', ozel.deger, ozel.sure),
      olay: { tip: 'ozel_hamle', kim: 'dusman', hamle: ozel.ad, etki: 'zayiflatma', sure: ozel.sure },
    };
  }

  const olay = ozelMi
    ? { tip: 'ozel_hamle', kim: 'dusman', hamle: ozel.ad, etki: 'hasar' }
    : { tip: 'saldiri', kim: 'dusman' };
  const savunmaEtkisi = etkiDegeri(etkiler, 'savunma');
  const kalan = etkiTuket(etkiler, ['savunma']);
  if (sans(rng, kacinmaSansi(o.ceviklik))) return { durum, etkiler: kalan, olay: { ...olay, kacindi: true, hasar: 0 } };

  const kritik = sans(rng, kritikSansi(dusman.ceviklik));
  let hasar = hasarHesapla({
    guc: dusman.guc,
    savunma: o.savunma,
    rnd: aralik(rng, 0.9, 1.1),
    carpan: (ozelMi ? ozel.carpan : 1) * hasarCarpani,
    kritik,
  });
  if (savunmaEtkisi > 0) hasar = Math.max(1, Math.round(hasar * (1 - savunmaEtkisi)));
  return {
    durum: { ...durum, oyuncu: { ...durum.oyuncu, can: Math.max(0, o.can - hasar) } },
    etkiler: kalan,
    olay: { ...olay, hasar, kritik, korundu: savunmaEtkisi > 0 },
  };
}

// Savaştan uzaklaşan düşman toparlanır: canı dolar, bossun evre güçlenmesi söner.
export function dusmanToparlan(d) {
  if (d.can >= d.canEnCok && !d.evre) return d;
  const { temelGuc, evre, evreNo, ...kalan } = d;
  return { ...kalan, can: d.canEnCok, guc: temelGuc ?? d.guc };
}

// ── Bayılma ──────────────────────────────────────────────

// Bayılma (plan.md Bölüm 5): oyuncu en son dinlendiği kervansarayda (hiç
// dinlenmediyse bulunduğu ilin merkezinde) kendine gelir, canı ve nefesi dolar,
// akçesinin %10'unu kaybeder. Sonuç: { durum, akceKaybi, donulenIl, kervansarayda }.
export function bayilmaUygula(durum) {
  const akce = durum.akce ?? 0;
  const akceKaybi = Math.floor(akce * BAYILMA_AKCE_KAYBI);
  const donulenIl = durum.sonKervansaray ?? durum.konum;
  return {
    durum: { ...durum, konum: donulenIl, akce: akce - akceKaybi, oyuncu: tamIyilestir(durum.oyuncu) },
    akceKaybi,
    donulenIl,
    kervansarayda: Boolean(durum.sonKervansaray),
  };
}
