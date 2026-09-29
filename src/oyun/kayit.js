// Kaydet / yükle / şema göçü. Saf oyun mantığı — DOM'a dokunmaz.
// Depolama dışarıdan verilir (tarayıcıda localStorage, testlerde sahte depo).
// Depolamaya erişim her zaman try/catch içindedir: gizli sekme, dolu kota ya
// da kapalı depolama oyunu bozmaz, yalnızca kayıt yapılamaz.
import { iller } from '../veri/iller.js';
import { siniflar } from '../veri/siniflar.js';
import { yemekler } from '../veri/yemekler.js';
import { STATLAR } from './karakter.js';

export const KAYIT_ANAHTARI = 'seksen-bir-diyar/kayit';
export const KAYIT_SURUMU = 1;

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

// Eski sürümdeki bir kaydı güncel şemaya taşır. Tanınmayan sürüm → null.
// Yeni bir sürüm eklenirse buraya `if (veri.surum === 1) veri = birdenIkiye(veri)`
// gibi adımlar yazılır.
export function goc(veri) {
  if (!veri || typeof veri !== 'object') return null;
  if (veri.surum !== KAYIT_SURUMU) return null;
  return veri;
}

const plakalar = new Set(iller.map((il) => il.plaka));
const sayiMi = (x) => typeof x === 'number' && Number.isFinite(x);

// Kaydın bozuk olup olmadığını denetler.
export function durumGecerliMi(d) {
  if (!d || typeof d !== 'object') return false;
  if (!plakalar.has(d.konum)) return false;
  if (!Array.isArray(d.acikBolgeler) || d.acikBolgeler.length === 0) return false;
  if (!d.arinma || typeof d.arinma !== 'object') return false;
  if (!sayiMi(d.akce) || d.akce < 0) return false;
  if (!Array.isArray(d.heybe) || !d.heybe.every((y) => yemekler[y?.anahtar] && sayiMi(y.adet) && y.adet > 0)) return false;
  const o = d.oyuncu;
  if (!o || !siniflar[o.sinif] || typeof o.ad !== 'string') return false;
  if (![o.seviye, o.xp, o.statPuani, o.can, o.nefes].every(sayiMi) || o.seviye < 1) return false;
  if (!o.dagitilan || !STATLAR.every((s) => sayiMi(o.dagitilan[s]))) return false;
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
