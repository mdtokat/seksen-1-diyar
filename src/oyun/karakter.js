// Karakter: stat hesapları, XP eğrisi, seviye atlama ve stat puanları.
// Saf oyun mantığı — DOM'a dokunmaz.
import { siniflar, STAT_PUANI_SEVIYE_BASI, STAT_PUANI_DEGERI, DAL_SEVIYESI } from '../veri/siniflar.js';
import { esyaBilgisi } from './rota.js';

export const STATLAR = ['can', 'nefes', 'guc', 'savunma', 'ceviklik'];
export const AD_EN_FAZLA = 20;
export const VARSAYILAN_AD = 'Alp';

// Bir seviyeden sonrakine geçmek için gereken XP (plan.md Bölüm 5).
// XP her seviye atlamada sıfırlanır; artan kısım sonraki seviyeye aktarılır.
export function gerekenXp(seviye) {
  return Math.round(30 * seviye ** 1.35);
}

// Oyuncu adını temizler: baştaki/sondaki boşluklar atılır, uzunluk sınırlanır.
// Boş ad verilirse hikâyenin kahramanı Alp'in adı kullanılır.
export function adTemizle(ad) {
  const temiz = String(ad ?? '').replace(/\s+/g, ' ').trim().slice(0, AD_EN_FAZLA).trim();
  return temiz || VARSAYILAN_AD;
}

// 1. seviyede, canı ve nefesi dolu yeni bir karakter.
export function yeniKarakter(ad, sinifAnahtari) {
  const sinif = siniflar[sinifAnahtari];
  if (!sinif) throw new Error(`Bilinmeyen sınıf: ${sinifAnahtari}`);
  return {
    ad: adTemizle(ad),
    sinif: sinifAnahtari,
    seviye: 1,
    xp: 0,
    statPuani: 0,
    dagitilan: Object.fromEntries(STATLAR.map((s) => [s, 0])),
    can: sinif.baslangic.can,
    nefes: sinif.baslangic.nefes,
    kusanilan: { silah: null, zirh: null, aksesuar: null }, // esyalar.js anahtarları
    dal: null, // uzmanlık dalı (DAL_SEVIYESI'nde seçilir)
  };
}

// Kuşanılan eşyaların statlara toplam katkısı.
export function ekipmanStatlari(oyuncu) {
  const toplam = Object.fromEntries(STATLAR.map((s) => [s, 0]));
  for (const anahtar of Object.values(oyuncu.kusanilan ?? {})) {
    const esya = esyaBilgisi(anahtar);
    if (!esya) continue;
    for (const [stat, deger] of Object.entries(esya.statlar)) toplam[stat] += deger;
  }
  return toplam;
}

// Karakterin güncel statları: başlangıç + otomatik seviye artışları +
// dağıtılan stat puanları + kuşanılan eşyalar; uzmanlık dalı bunları oranla artırır.
// `can` ve `nefes` en yüksek değerlerdir.
export function statlar(oyuncu) {
  const sinif = siniflar[oyuncu.sinif];
  const ekipman = ekipmanStatlari(oyuncu);
  const dalStatlari = dalBilgisi(oyuncu)?.statlar ?? {};
  const sonuc = {};
  for (const s of STATLAR) {
    const toplam =
      sinif.baslangic[s] +
      (oyuncu.seviye - 1) * sinif.seviyeArtisi[s] +
      (oyuncu.dagitilan[s] ?? 0) * STAT_PUANI_DEGERI[s] +
      ekipman[s];
    sonuc[s] = dalStatlari[s] ? Math.round(toplam * (1 + dalStatlari[s])) : toplam;
  }
  return sonuc;
}

// ── Uzmanlık dalı ────────────────────────────────────────

// Oyuncunun seçtiği dalın verisi ya da null. `oyuncu`: { sinif, dal } taşıyan her nesne.
export function dalBilgisi(oyuncu) {
  return (oyuncu?.dal && siniflar[oyuncu.sinif]?.dallar?.[oyuncu.dal]) || null;
}

// Oyuncu şimdi dal seçebilir mi (seviyesi yetti ve henüz seçmedi)?
export const dalSecebilirMi = (oyuncu) => oyuncu.seviye >= DAL_SEVIYESI && !oyuncu.dal;

// Uzmanlık dalını seçer. Seçim kalıcıdır: seviye yetmiyorsa, dal zaten seçildiyse ya da
// dal o sınıfın değilse aynı oyuncu döner. Can ve nefes yeni en yüksek değerleri aşmaz.
export function dalSec(oyuncu, dal) {
  if (!dalSecebilirMi(oyuncu) || !siniflar[oyuncu.sinif].dallar?.[dal]) return oyuncu;
  const yeni = { ...oyuncu, dal };
  const enCok = statlar(yeni);
  return { ...yeni, can: Math.min(yeni.can, enCok.can), nefes: Math.min(yeni.nefes, enCok.nefes) };
}

// Oyuncunun seviyesinde açık olan yetenekler.
export function acikYetenekler(oyuncu) {
  return siniflar[oyuncu.sinif].yetenekler.filter((y) => y.seviye <= oyuncu.seviye);
}

// (eskiSeviye, yeniSeviye] aralığında açılan yetenekler.
export function acilanYetenekler(sinifAnahtari, eskiSeviye, yeniSeviye) {
  return siniflar[sinifAnahtari].yetenekler.filter(
    (y) => y.seviye > eskiSeviye && y.seviye <= yeniSeviye,
  );
}

// XP ekler, gerekirse art arda seviye atlatır. Her seviyede otomatik stat
// artışı ve STAT_PUANI_SEVIYE_BASI kadar dağıtılacak puan gelir; seviye
// atlanınca can ve nefes tamamen dolar.
// Sonuç: { oyuncu, seviyeler: [ulaşılan seviyeler], yeniYetenekler: [yetenek] }.
export function xpEkle(oyuncu, miktar) {
  let o = { ...oyuncu, xp: oyuncu.xp + Math.max(0, Math.round(miktar)) };
  const seviyeler = [];
  while (o.xp >= gerekenXp(o.seviye)) {
    o = {
      ...o,
      xp: o.xp - gerekenXp(o.seviye),
      seviye: o.seviye + 1,
      statPuani: o.statPuani + STAT_PUANI_SEVIYE_BASI,
    };
    seviyeler.push(o.seviye);
  }
  if (seviyeler.length > 0) {
    const enCok = statlar(o);
    o = { ...o, can: enCok.can, nefes: enCok.nefes };
  }
  return {
    oyuncu: o,
    seviyeler,
    yeniYetenekler: acilanYetenekler(o.sinif, oyuncu.seviye, o.seviye),
  };
}

// Bir stat puanını verilen stata harcar. Puan yoksa ya da stat geçersizse
// aynı oyuncuyu döndürür. Can ya da nefese verilen puan, güncel değeri de artırır.
export function statPuaniDagit(oyuncu, stat) {
  if (oyuncu.statPuani < 1 || !STATLAR.includes(stat)) return oyuncu;
  const yeni = {
    ...oyuncu,
    statPuani: oyuncu.statPuani - 1,
    dagitilan: { ...oyuncu.dagitilan, [stat]: (oyuncu.dagitilan[stat] ?? 0) + 1 },
  };
  if (stat === 'can' || stat === 'nefes') yeni[stat] = oyuncu[stat] + STAT_PUANI_DEGERI[stat];
  return yeni;
}

// Canı ve nefesi en yüksek değere doldurur.
export function tamIyilestir(oyuncu) {
  const enCok = statlar(oyuncu);
  return { ...oyuncu, can: enCok.can, nefes: enCok.nefes };
}
