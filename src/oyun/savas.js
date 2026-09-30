// Sıra tabanlı savaş motoru. Saf oyun mantığı — DOM'a dokunmaz.
// Her fonksiyon yeni bir savaş durumu döndürür, verilen durumu değiştirmez.
// Rastgelelik dışarıdan verilen `rng` (rastgele.js) ile gelir.
//
// Savaş günlüğü metin değil, olay nesneleridir ({ tip, ... }); arayüz bunları
// metinler.js'teki kalıplarla Türkçe cümlelere çevirir.
import {
  dusmanlar,
  OZEL_HAMLELER,
  OZEL_HAMLE_SANSI,
  BOSS_OZEL_HAMLE_SANSI,
  EVRE_OZEL_HAMLE_SANSI,
  EVRE_GUC_CARPANI,
  SINIF_XP_CARPANI,
} from '../veri/dusmanlar.js';
import { siniflar } from '../veri/siniflar.js';
import { yemekler } from '../veri/yemekler.js';
import { yemekAdedi, yemekCikar, yemekEtkisi } from './envanter.js';
import { statlar, acikYetenekler, xpEkle, tamIyilestir } from './karakter.js';
import { aralik, sans, sec } from './rastgele.js';
import { sofraTuket } from './ilerleme.js';
import { yeniYetenekleriYerlestir } from './kisayollar.js';

// ── Formüller (plan.md Bölüm 5) ──────────────────────────

export const KRITIK_CARPANI = 1.5;
export const BAYILMA_AKCE_KAYBI = 0.1;

// max(1, round(güç × çarpan × rnd − savunma × 0.5)); kritik vuruş ×1.5.
// `ek`: belirli düşman türlerine verilen ek hasar çarpanı.
export function hasarHesapla({ guc, savunma, rnd = 1, carpan = 1, kritik = false, ek = 1 }) {
  let hasar = guc * carpan * rnd - savunma * 0.5;
  if (kritik) hasar *= KRITIK_CARPANI;
  hasar *= ek;
  return Math.max(1, Math.round(hasar));
}

// min(%30, çeviklik × %0.8). `bonus` (ör. Kartal Gözü) bu sınırın üstüne eklenir.
export function kritikSansi(ceviklik, bonus = 0) {
  return Math.min(0.3, ceviklik * 0.008) + bonus;
}

// Saldırılanın hamleden sıyrılma şansı: min(%20, çeviklik × %0.5).
export function kacinmaSansi(ceviklik) {
  return Math.min(0.2, ceviklik * 0.005);
}

// min(%70, %35 + (oyuncuÇev − düşmanÇev) × %2), en az %0. Peşine takılan
// (takipçi) düşmanlardan kaçmak %15 daha zordur.
export const TAKIPCI_KACMA_CEZASI = 0.15;
export function kacmaSansi(oyuncuCev, dusmanCev, { takipci = false } = {}) {
  const sans = Math.min(0.7, 0.35 + (oyuncuCev - dusmanCev) * 0.02) - (takipci ? TAKIPCI_KACMA_CEZASI : 0);
  return Math.max(0, sans);
}

// Düşman statları seviye ve tür çarpanıyla ölçeklenir.
export function dusmanStatlari(anahtar, seviye) {
  const c = dusmanlar[anahtar].carpan;
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

// Bosslardan kaçılamaz; haritada dolaşan ya da sürpriz çıkan gezgin bosslardan kaçılır.
export function kacilabilirMi(dusman) {
  return Boolean(dusman.gezgin) || dusman.tur !== 'boss';
}

// ── Savaş durumu ─────────────────────────────────────────

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
    takipci: Boolean(veri.takipci),
    seviye,
    canEnCok: s.can,
    can: s.can,
    guc: s.guc,
    savunma: s.savunma,
    ceviklik: s.ceviklik,
  };
}

// Oyuncu karakteri ve oluşturulmuş bir düşmanla yeni savaş.
// `heybe`: savaşta yenebilecek yemekler; savaş sonunda oyun durumuna geri yazılır.
// `gucCarpani`: savaş boyunca oyuncunun gücüne uygulanan çarpan (ör. zafer sofrası).
export function savasBaslat(oyuncu, dusman, heybe = [], { gucCarpani = 1 } = {}) {
  const s = statlar(oyuncu);
  return {
    oyuncu: {
      ad: oyuncu.ad,
      sinif: oyuncu.sinif,
      seviye: oyuncu.seviye,
      canEnCok: s.can,
      can: Math.min(oyuncu.can, s.can),
      nefesEnCok: s.nefes,
      nefes: Math.min(oyuncu.nefes, s.nefes),
      guc: Math.round(s.guc * gucCarpani),
      gucCarpani,
      savunma: s.savunma,
      ceviklik: s.ceviklik,
      yetenekler: acikYetenekler(oyuncu).map((y) => y.anahtar),
    },
    dusman: { ...dusman },
    heybe,
    etkiler: [], // { hedef: 'oyuncu', etki, deger, kalan }
    tur: 1,
    evre: false, // bölge bossu güçlenme evresine girdi mi
    evreNo: 1, // Zülmet'in üç evreli savaşında bulunulan evre (1–3)
    // Gezgin bossların tehlikesi savaşın başında söylenir: kesilemezden kaçmak gerekir
    gunluk: [{ tip: 'baslangic' }, ...(dusman.gezgin ? [{ tip: 'gezgin', tehlike: dusman.tehlike }] : [])],
    sonuc: null, // null | 'zafer' | 'yenilgi' | 'kacis'
    xpOdulu: xpOdulu(dusman.anahtar, dusman.seviye, dusman.gezgin ? SINIF_XP_CARPANI.gezgin : undefined),
  };
}

export function yetenekBul(sinifAnahtari, yetenekAnahtari) {
  return siniflar[sinifAnahtari].yetenekler.find((y) => y.anahtar === yetenekAnahtari);
}

// Eylem yapılabilir mi? Sonuç: { olur: true } ya da { olur: false, neden }.
// neden: 'bitti' | 'bilinmeyen_eylem' | 'kilitli_yetenek' | 'nefes_yetersiz'
//        | 'bilinmeyen_yemek' | 'yemek_yok' | 'kacilamaz'
export function eylemKontrol(savas, eylem) {
  if (savas.sonuc) return { olur: false, neden: 'bitti' };
  switch (eylem?.tur) {
    case 'saldir':
      return { olur: true };
    case 'yetenek': {
      if (!savas.oyuncu.yetenekler.includes(eylem.anahtar)) return { olur: false, neden: 'kilitli_yetenek' };
      const y = yetenekBul(savas.oyuncu.sinif, eylem.anahtar);
      if (savas.oyuncu.nefes < y.nefes) return { olur: false, neden: 'nefes_yetersiz' };
      return { olur: true };
    }
    case 'yemek':
      if (!yemekler[eylem.anahtar]) return { olur: false, neden: 'bilinmeyen_yemek' };
      if (yemekAdedi(savas.heybe, eylem.anahtar) < 1) return { olur: false, neden: 'yemek_yok' };
      return { olur: true };
    case 'kac':
      return kacilabilirMi(savas.dusman) ? { olur: true } : { olur: false, neden: 'kacilamaz' };
    default:
      return { olur: false, neden: 'bilinmeyen_eylem' };
  }
}

// ── Etkiler ──────────────────────────────────────────────
// 'savunma'            → düşmanın her vuruş hamlesinde bir azalır.
// 'guclenme', 'kritik',
// 'zayiflatma'         → oyuncunun her saldırısında bir azalır.

function etkiDegeri(s, hedef, etki) {
  return s.etkiler.find((e) => e.hedef === hedef && e.etki === etki)?.deger ?? 0;
}

function etkiEkle(s, hedef, etki, deger, sure) {
  s.etkiler = [
    ...s.etkiler.filter((e) => !(e.hedef === hedef && e.etki === etki)),
    { hedef, etki, deger, kalan: sure },
  ];
}

function etkiTuket(s, hedef, etkiAdlari) {
  s.etkiler = s.etkiler
    .map((e) => (e.hedef === hedef && etkiAdlari.includes(e.etki) ? { ...e, kalan: e.kalan - 1 } : e))
    .filter((e) => e.kalan > 0);
}

// ── Hamleler ─────────────────────────────────────────────

function oyuncuVurusu(s, rng, { carpan = 1, yetenek = null } = {}) {
  const o = s.oyuncu;
  const d = s.dusman;
  const guc = o.guc * Math.max(0, 1 + etkiDegeri(s, 'oyuncu', 'guclenme') - etkiDegeri(s, 'oyuncu', 'zayiflatma'));
  const kritikBonusu = etkiDegeri(s, 'oyuncu', 'kritik');
  etkiTuket(s, 'oyuncu', ['guclenme', 'kritik', 'zayiflatma']);

  const olay = { tip: yetenek ? 'yetenek' : 'saldiri', kim: 'oyuncu', yetenek: yetenek?.anahtar };
  if (sans(rng, kacinmaSansi(d.ceviklik))) return { ...olay, kacindi: true, hasar: 0 };

  const kritik = sans(rng, kritikSansi(o.ceviklik, kritikBonusu));
  const ekHasar = Boolean(yetenek?.ekHasarTurleri?.includes(d.tur));
  const hasar = hasarHesapla({
    guc,
    savunma: d.savunma,
    rnd: aralik(rng, 0.9, 1.1),
    carpan,
    kritik,
    ek: ekHasar ? yetenek.ekHasarCarpani : 1,
  });
  d.can = Math.max(0, d.can - hasar);
  return { ...olay, hasar, kritik, ekHasar };
}

function yetenekKullan(s, yetenek, rng) {
  const o = s.oyuncu;
  o.nefes -= yetenek.nefes;
  switch (yetenek.etki) {
    case 'hasar':
      return oyuncuVurusu(s, rng, { carpan: yetenek.carpan, yetenek });
    case 'sifa': {
      const miktar = Math.min(o.canEnCok - o.can, Math.round(o.canEnCok * yetenek.deger));
      o.can += miktar;
      return { tip: 'yetenek', kim: 'oyuncu', yetenek: yetenek.anahtar, etki: 'sifa', miktar };
    }
    default:
      etkiEkle(s, 'oyuncu', yetenek.etki, yetenek.deger, yetenek.sure);
      return { tip: 'yetenek', kim: 'oyuncu', yetenek: yetenek.anahtar, etki: yetenek.etki, sure: yetenek.sure };
  }
}

function yemekYe(s, anahtar) {
  const o = s.oyuncu;
  const { tur, miktar } = yemekEtkisi(anahtar, o, { can: o.canEnCok, nefes: o.nefesEnCok });
  o[tur] += miktar;
  s.heybe = yemekCikar(s.heybe, anahtar);
  return { tip: 'yemek', kim: 'oyuncu', yemek: anahtar, yenilenen: tur, miktar };
}

// Zülmet'in bulunduğu evrenin verisi (1. evrede null).
function finalEvresi(s) {
  return s.evreNo > 1 ? dusmanlar[s.dusman.anahtar].evreler[s.evreNo - 2] : null;
}

// Düşmanın özel hamleleri: bosslar ve mini bosslar kendi listelerini, diğerleri
// türlerinin hamlesini kullanır. Zülmet her evrede yeni hamleler kullanır.
export function ozelHamleler(dusman, evreNo = 1) {
  const veri = dusmanlar[dusman.anahtar];
  if (evreNo > 1 && veri?.evreler) return veri.evreler[evreNo - 2].ozelHamleler;
  return veri?.ozelHamleler ?? [OZEL_HAMLELER[dusman.tur]].filter(Boolean);
}

function ozelHamleSansi(s) {
  const evre = finalEvresi(s);
  if (evre) return evre.ozelHamleSansi;
  if (s.evre) return EVRE_OZEL_HAMLE_SANSI;
  return s.dusman.sinif === 'siradan' ? OZEL_HAMLE_SANSI : BOSS_OZEL_HAMLE_SANSI;
}

// Bölge bossu canı yarının altına düşünce bir kez güçlenir (gezgin bosslar güçlenmez).
// Zülmet ise üç evreli savaşır: canı her evre eşiğinin altına düşünce sıradaki evreye geçer.
function evreKontrol(s) {
  const d = s.dusman;
  if (d.can <= 0) return null;
  if (d.sinif === 'final') {
    const evreler = dusmanlar[d.anahtar].evreler ?? [];
    const hedef = 1 + evreler.filter((e) => d.can < d.canEnCok * e.can).length;
    if (hedef <= s.evreNo) return null;
    for (let n = s.evreNo; n < hedef; n++) d.guc = Math.round(d.guc * evreler[n - 1].guc);
    s.evreNo = hedef;
    s.evre = true;
    return { tip: 'evre', kim: 'dusman', no: hedef };
  }
  if (d.sinif !== 'bolge_bossu' || d.gezgin || s.evre || d.can * 2 >= d.canEnCok) return null;
  s.evre = true;
  d.guc = Math.round(d.guc * EVRE_GUC_CARPANI);
  return { tip: 'evre', kim: 'dusman' };
}

// Düşman yapay zekâsı: çoğunlukla saldırır, bazen özel hamle yapar.
function dusmanHamlesi(s, rng) {
  const o = s.oyuncu;
  const d = s.dusman;
  const hamleler = ozelHamleler(d, s.evreNo);
  const ozelMi = hamleler.length > 0 && sans(rng, ozelHamleSansi(s));
  const ozel = ozelMi ? sec(rng, hamleler) : null;

  if (ozelMi && ozel.etki === 'zayiflatma') {
    etkiEkle(s, 'oyuncu', 'zayiflatma', ozel.deger, ozel.sure);
    return { tip: 'ozel_hamle', kim: 'dusman', hamle: ozel.ad, etki: 'zayiflatma', sure: ozel.sure };
  }

  const savunmaEtkisi = etkiDegeri(s, 'oyuncu', 'savunma');
  etkiTuket(s, 'oyuncu', ['savunma']);
  const olay = ozelMi
    ? { tip: 'ozel_hamle', kim: 'dusman', hamle: ozel.ad, etki: 'hasar' }
    : { tip: 'saldiri', kim: 'dusman' };
  if (sans(rng, kacinmaSansi(o.ceviklik))) return { ...olay, kacindi: true, hasar: 0 };

  const kritik = sans(rng, kritikSansi(d.ceviklik));
  let hasar = hasarHesapla({
    guc: d.guc,
    savunma: o.savunma,
    rnd: aralik(rng, 0.9, 1.1),
    carpan: ozelMi ? ozel.carpan : 1,
    kritik,
  });
  if (savunmaEtkisi > 0) hasar = Math.max(1, Math.round(hasar * (1 - savunmaEtkisi)));
  o.can = Math.max(0, o.can - hasar);
  return { ...olay, hasar, kritik, korundu: savunmaEtkisi > 0 };
}

// Oyuncunun bir eylemini ve ardından düşmanın hamlesini oynatır.
// eylem: { tur: 'saldir' } | { tur: 'yetenek', anahtar } | { tur: 'yemek', anahtar } | { tur: 'kac' }
// Eylem yapılamıyorsa aynı savaş durumunu döndürür (bkz. eylemKontrol).
export function oyuncuEylemi(savas, eylem, rng) {
  if (!eylemKontrol(savas, eylem).olur) return savas;

  const s = {
    ...savas,
    oyuncu: { ...savas.oyuncu },
    dusman: { ...savas.dusman },
    etkiler: [...savas.etkiler],
  };
  const olaylar = [];

  switch (eylem.tur) {
    case 'saldir':
      olaylar.push(oyuncuVurusu(s, rng));
      break;
    case 'yetenek':
      olaylar.push(yetenekKullan(s, yetenekBul(s.oyuncu.sinif, eylem.anahtar), rng));
      break;
    case 'yemek':
      olaylar.push(yemekYe(s, eylem.anahtar));
      break;
    case 'kac':
      if (sans(rng, kacmaSansi(s.oyuncu.ceviklik, s.dusman.ceviklik, { takipci: s.dusman.takipci }))) {
        s.sonuc = 'kacis';
        olaylar.push({ tip: 'kacis', basarili: true });
      } else {
        olaylar.push({ tip: 'kacis', basarili: false });
      }
      break;
  }

  if (!s.sonuc && s.dusman.can <= 0) {
    s.sonuc = 'zafer';
    olaylar.push({ tip: 'zafer', xp: s.xpOdulu });
  }
  const evre = s.sonuc ? null : evreKontrol(s);
  if (evre) olaylar.push(evre);
  if (!s.sonuc) {
    olaylar.push(dusmanHamlesi(s, rng));
    if (s.oyuncu.can <= 0) {
      s.sonuc = 'yenilgi';
      olaylar.push({ tip: 'yenilgi' });
    }
  }

  s.tur = savas.tur + 1;
  s.gunluk = [...savas.gunluk, ...olaylar];
  return s;
}

// ── Savaş sonu ───────────────────────────────────────────

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

// Biten savaşın sonucunu oyun durumuna yansıtır: can ve nefes aktarılır,
// zaferde XP eklenir (seviye atlama dahil), yenilgide bayılma uygulanır.
// Zafer sofrası varsa süresinden bir savaş düşer.
// Sonuç: { durum, ozet: { sonuc, xp, seviyeler, yeniYetenekler, akceKaybi } }.
export function savasSonucunuUygula(durum, savas) {
  if (!savas.sonuc) return { durum, ozet: null };
  let yeni = {
    ...sofraTuket(durum),
    heybe: savas.heybe,
    oyuncu: { ...durum.oyuncu, can: savas.oyuncu.can, nefes: savas.oyuncu.nefes },
  };
  const ozet = { sonuc: savas.sonuc, xp: 0, seviyeler: [], yeniYetenekler: [], akceKaybi: 0, donulenIl: null, kervansarayda: false };

  if (savas.sonuc === 'zafer') {
    const r = xpEkle(yeni.oyuncu, savas.xpOdulu);
    yeni = { ...yeni, oyuncu: r.oyuncu };
    // Yeni açılan yetenekler boş kısayol yuvalarına yerleşir
    if (r.yeniYetenekler.length && yeni.kisayollar) {
      yeni.kisayollar = yeniYetenekleriYerlestir(yeni.kisayollar, r.yeniYetenekler);
    }
    Object.assign(ozet, { xp: savas.xpOdulu, seviyeler: r.seviyeler, yeniYetenekler: r.yeniYetenekler });
  } else if (savas.sonuc === 'yenilgi') {
    const r = bayilmaUygula(yeni);
    yeni = r.durum;
    Object.assign(ozet, { akceKaybi: r.akceKaybi, donulenIl: r.donulenIl, kervansarayda: r.kervansarayda });
  }
  return { durum: yeni, ozet };
}
