// Kaydet / yükle / şema göçü. Saf oyun mantığı — DOM'a dokunmaz.
// Depolama dışarıdan verilir (tarayıcıda localStorage, testlerde sahte depo).
// Depolamaya erişim her zaman try/catch içindedir: gizli sekme, dolu kota ya
// da kapalı depolama oyunu bozmaz, yalnızca kayıt yapılamaz.
import { iller } from '../veri/iller.js';
import { siniflar } from '../veri/siniflar.js';
import { yemekler } from '../veri/yemekler.js';
import { esyalar } from '../veri/esyalar.js';
import { gorevler as gorevVerisi } from '../veri/gorevler.js';
import { basarimlar as basarimVerisi } from '../veri/basarimlar.js';
import { bolgeler } from '../veri/bolgeler.js';
import { STATLAR } from './karakter.js';
import { KISAYOL_YUVA, kisayolGecerliMi, varsayilanKisayollar } from './kisayollar.js';
import { KLASIK_ROTA, rotaGecerliMi } from './rota.js';

export const KAYIT_ANAHTARI = 'seksen-bir-diyar/kayit';
export const KAYIT_SURUMU = 8;
// Önceki oyunların başladığı bölgeler (bu tur): yeni oyun bunlardan başlamaz (rota.js).
export const BASLANGIC_ANAHTARI = 'seksen-bir-diyar/baslangic-gecmisi';

function varsayilanDepo() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function kayitVerisi(durum) {
  return { surum: KAYIT_SURUMU, durum };
}

// Sürüm 1 → 2 (Faz 7): yenilen bosslar, mini bosslar ve zafer sofrası eklendi.
function birdenIkiye(veri) {
  return {
    surum: 2,
    durum: { yenilenBosslar: [], yenilenMiniBosslar: [], sofra: null, ...veri.durum },
  };
}

// Sürüm 2 → 3 (Faz 8): eşyalar, kuşanılanlar ve son kervansaray eklendi.
function ikidenUce(veri) {
  const d = veri.durum;
  return {
    surum: 3,
    durum: {
      esyalar: [],
      sonKervansaray: null,
      ...d,
      oyuncu: d.oyuncu && { kusanilan: { silah: null, zirh: null, aksesuar: null }, ...d.oyuncu },
    },
  };
}

// Sürüm 3 → 4 (Faz 9): görevler, Hayır puanı ve alınan hediyeler eklendi.
function ucdenDorde(veri) {
  return {
    surum: 4,
    durum: { gorevler: {}, hayir: 0, hediyeAlinan: [], ...veri.durum },
  };
}

// Sürüm 4 → 5 (Faz 10): final, başarımlar, yemek defteri ve istatistikler eklendi.
// Yemek defteri heybedeki yemeklerle başlar.
function dorttenBese(veri) {
  const d = veri.durum;
  return {
    surum: 5,
    durum: {
      zulmetYenildi: false,
      basarimlar: [],
      toplananYemekler: [...new Set((d.heybe ?? []).map((y) => y?.anahtar))].filter((a) => yemekler[a]),
      istatistik: { zafer: 0, bayilma: 0, bolgeBayilma: {} },
      ...d,
    },
  };
}

// Sürüm 5 → 6: savaş kısayol yuvaları eklendi (Saldır, ilk yetenekler, ilk yemek).
function bestenAltiya(veri) {
  const d = veri.durum;
  return { surum: 6, durum: { kisayollar: varsayilanKisayollar(d), ...d } };
}

// Sürüm 6 → 7: yolculuğun rotası (bölge sırası ve başlangıç ili) eklendi. Eski
// kayıtlar Marmara'dan başlayan klasik rotayla sürer.
function altidanYediye(veri) {
  return { surum: 7, durum: { rota: { bolgeler: [...KLASIK_ROTA.bolgeler], baslangic: KLASIK_ROTA.baslangic }, ...veri.durum } };
}

// Sürüm 7 → 8: savaş il haritasına taşındı; "Kaç" kısayolu kalktı, o yuvalar boşalır.
function yedidenSekize(veri) {
  const d = veri.durum;
  const kisayollar = Array.isArray(d.kisayollar) ? d.kisayollar.map((k) => (k?.tur === 'kac' ? null : k)) : d.kisayollar;
  return { surum: 8, durum: { ...d, kisayollar } };
}

// Eski sürümdeki bir kaydı adım adım güncel şemaya taşır. Tanınmayan sürüm → null.
export function goc(veri) {
  if (!veri || typeof veri !== 'object' || !veri.durum) return null;
  let v = veri;
  if (v.surum === 1) v = birdenIkiye(v);
  if (v.surum === 2) v = ikidenUce(v);
  if (v.surum === 3) v = ucdenDorde(v);
  if (v.surum === 4) v = dorttenBese(v);
  if (v.surum === 5) v = bestenAltiya(v);
  if (v.surum === 6) v = altidanYediye(v);
  if (v.surum === 7) v = yedidenSekize(v);
  return v.surum === KAYIT_SURUMU ? v : null;
}

const GOREV_KAYIT_DURUMLARI = new Set(['aktif', 'tamam']);
const bolgeAnahtarlari = new Set(bolgeler.map((b) => b.anahtar));

const plakalar = new Set(iller.map((il) => il.plaka));
const sayiMi = (x) => typeof x === 'number' && Number.isFinite(x);

// Kaydın bozuk olup olmadığını denetler.
export function durumGecerliMi(d) {
  if (!d || typeof d !== 'object') return false;
  if (!plakalar.has(d.konum)) return false;
  if (!rotaGecerliMi(d.rota)) return false;
  if (!Array.isArray(d.acikBolgeler) || d.acikBolgeler.length === 0) return false;
  if (!d.arinma || typeof d.arinma !== 'object') return false;
  if (!sayiMi(d.akce) || d.akce < 0) return false;
  if (!Array.isArray(d.yenilenBosslar) || !Array.isArray(d.yenilenMiniBosslar)) return false;
  if (d.sofra !== null && !(d.sofra && sayiMi(d.sofra.kalan))) return false;
  if (!Array.isArray(d.heybe) || !d.heybe.every((y) => yemekler[y?.anahtar] && sayiMi(y.adet) && y.adet > 0)) return false;
  const o = d.oyuncu;
  if (!o || !siniflar[o.sinif] || typeof o.ad !== 'string') return false;
  if (![o.seviye, o.xp, o.statPuani, o.can, o.nefes].every(sayiMi) || o.seviye < 1) return false;
  if (!o.dagitilan || !STATLAR.every((s) => sayiMi(o.dagitilan[s]))) return false;
  if (!Array.isArray(d.esyalar) || !d.esyalar.every((a) => esyalar[a])) return false;
  if (d.sonKervansaray !== null && !plakalar.has(d.sonKervansaray)) return false;
  if (!o.kusanilan || !Object.values(o.kusanilan).every((a) => a === null || d.esyalar.includes(a))) return false;
  if (!d.gorevler || typeof d.gorevler !== 'object' || Array.isArray(d.gorevler)) return false;
  if (!Object.entries(d.gorevler).every(([a, k]) => gorevVerisi[a] && GOREV_KAYIT_DURUMLARI.has(k?.durum)
      && (k.durum !== 'aktif' || sayiMi(k.sayac)))) return false;
  if (!sayiMi(d.hayir) || d.hayir < 0) return false;
  if (!Array.isArray(d.hediyeAlinan) || !d.hediyeAlinan.every((p) => plakalar.has(p))) return false;
  if (typeof d.zulmetYenildi !== 'boolean') return false;
  if (!Array.isArray(d.basarimlar) || !d.basarimlar.every((a) => basarimVerisi[a])) return false;
  if (!Array.isArray(d.toplananYemekler) || !d.toplananYemekler.every((a) => yemekler[a])) return false;
  const i = d.istatistik;
  if (!i || !sayiMi(i.zafer) || !sayiMi(i.bayilma) || !i.bolgeBayilma || typeof i.bolgeBayilma !== 'object') return false;
  if (!Object.entries(i.bolgeBayilma).every(([b, n]) => bolgeAnahtarlari.has(b) && sayiMi(n))) return false;
  if (!Array.isArray(d.kisayollar) || d.kisayollar.length !== KISAYOL_YUVA
      || !d.kisayollar.every((k) => kisayolGecerliMi(k, o.sinif))) return false;
  return true;
}

// Durumu kaydeder. Başarılıysa true döner.
export function kaydet(durum, depo = varsayilanDepo()) {
  if (!depo || !durum?.oyuncu) return false;
  try {
    depo.setItem(KAYIT_ANAHTARI, JSON.stringify(kayitVerisi(durum)));
    return true;
  } catch {
    return false;
  }
}

// Kayıtlı durumu yükler. Kayıt yoksa, okunamıyorsa ya da bozuksa null döner.
export function yukle(depo = varsayilanDepo()) {
  if (!depo) return null;
  try {
    const metin = depo.getItem(KAYIT_ANAHTARI);
    if (!metin) return null;
    const veri = goc(JSON.parse(metin));
    return veri && durumGecerliMi(veri.durum) ? veri.durum : null;
  } catch {
    return null;
  }
}

// Bu turda başlanmış bölgeler (sonuncusu en yenisi). Kayıt yoksa ya da bozuksa boş dizi.
export function baslangicGecmisi(depo = varsayilanDepo()) {
  if (!depo) return [];
  try {
    const liste = JSON.parse(depo.getItem(BASLANGIC_ANAHTARI) ?? '[]');
    return Array.isArray(liste) ? liste.filter((b) => bolgeAnahtarlari.has(b)) : [];
  } catch {
    return [];
  }
}

export function baslangicGecmisiniYaz(gecmis, depo = varsayilanDepo()) {
  if (!depo) return false;
  try {
    depo.setItem(BASLANGIC_ANAHTARI, JSON.stringify(gecmis));
    return true;
  } catch {
    return false;
  }
}

export function kayitVarMi(depo = varsayilanDepo()) {
  return yukle(depo) !== null;
}

export function kayitSil(depo = varsayilanDepo()) {
  if (!depo) return false;
  try {
    depo.removeItem(KAYIT_ANAHTARI);
    return true;
  } catch {
    return false;
  }
}
