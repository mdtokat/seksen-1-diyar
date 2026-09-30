// İtibar (Hayır puanı), unvanlar, arasta indirimi ve köylülerin hediyesi.
// Saf oyun mantığı — DOM'a dokunmaz.
import { itibarKademeleri } from '../veri/itibar.js';
import { iller } from '../veri/iller.js';
import { yemekEkle } from './envanter.js';

const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));

export function hayirPuani(durum) {
  return durum.hayir ?? 0;
}

export function hayirEkle(durum, miktar) {
  if (!miktar) return durum;
  return { ...durum, hayir: hayirPuani(durum) + miktar };
}

// Puanın ulaştığı en yüksek kademenin sırası.
export function kademeSirasi(hayir) {
  return itibarKademeleri.findLastIndex((k) => hayir >= k.esik);
}

export function itibarKademesi(durum) {
  return itibarKademeleri[kademeSirasi(hayirPuani(durum))];
}

// Sonraki kademe; en yüksek kademedeyse null.
export function sonrakiKademe(durum) {
  return itibarKademeleri[kademeSirasi(hayirPuani(durum)) + 1] ?? null;
}

export function arastaIndirimi(durum) {
  return itibarKademesi(durum).indirim;
}

// İndirimli fiyat (yuvarlanır, en az 1 akçe).
export function indirimliFiyat(durum, fiyat) {
  return Math.max(1, Math.round(fiyat * (1 - arastaIndirimi(durum))));
}

// ── Köylülerin hediyesi ──────────────────────────────────
// İtibarı yeterince yüksek olan yiğide her ilin muhtarı, köylüler adına ilin
// yöresel yemeğinden bir kez hediye verir; adet unvanla artar.

// neden: 'itibar_yetersiz' | 'alindi' | 'heybe_dolu'
export function hediyeKontrol(durum, plaka = durum.konum) {
  const adet = itibarKademesi(durum).hediye;
  if (adet < 1) return { olur: false, neden: 'itibar_yetersiz' };
  if ((durum.hediyeAlinan ?? []).includes(plaka)) return { olur: false, neden: 'alindi' };
  if (yemekEkle(durum.heybe, ilHaritasi.get(plaka).yemek).eklenen === 0) return { olur: false, neden: 'heybe_dolu' };
  return { olur: true, adet };
}

// Bulunulan ilin hediyesini alır. Heybeye en az bir tanesi sığmalıdır; sığmayan
// kısmı alınamaz ama hediye yine de alınmış sayılır.
// Sonuç: { durum, yemek, adet } — adet: heybeye giren yemek sayısı (alınamazsa 0).
export function hediyeAl(durum) {
  const k = hediyeKontrol(durum);
  const yemek = ilHaritasi.get(durum.konum).yemek;
  if (!k.olur) return { durum, yemek, adet: 0 };
  const e = yemekEkle(durum.heybe, yemek, k.adet);
  return {
    durum: { ...durum, heybe: e.heybe, hediyeAlinan: [...(durum.hediyeAlinan ?? []), durum.konum] },
    yemek,
    adet: e.eklenen,
  };
}
