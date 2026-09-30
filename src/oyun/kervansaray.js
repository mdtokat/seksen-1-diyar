// Kervansaray: dinlenme, bayılınca dönülen yer ve hızlı yolculuk.
// Saf oyun mantığı — DOM'a dokunmaz.
import { iller } from '../veri/iller.js';
import { bolgeler } from '../veri/bolgeler.js';
import { tamIyilestir } from './karakter.js';
import { arinmaYuzdesi, bolgeAcikMi } from './ilerleme.js';

export const YOLCULUK_TABAN_UCRETI = 15;
export const YOLCULUK_IL_BASI_UCRET = 5;

const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const bolgeHaritasi = new Map(bolgeler.map((b) => [b.anahtar, b]));

export function kervansarayVarMi(plaka) {
  const il = ilHaritasi.get(plaka);
  return bolgeHaritasi.get(il.bolge).kervansarayIlleri.includes(plaka);
}

export const KERVANSARAY_ILLERI = bolgeler.flatMap((b) => b.kervansarayIlleri);

// Kervansarayda dinlenmek: can ve nefes dolar, bayılınca buraya dönülür.
export function dinlen(durum) {
  if (!kervansarayVarMi(durum.konum)) return durum;
  return { ...durum, oyuncu: tamIyilestir(durum.oyuncu), sonKervansaray: durum.konum };
}

// İki il arasındaki en az il geçişi (kara komşulukları üzerinden BFS).
export function ilMesafesi(bas, hedef) {
  if (bas === hedef) return 0;
  const mesafe = new Map([[bas, 0]]);
  const kuyruk = [bas];
  while (kuyruk.length) {
    const p = kuyruk.shift();
    for (const k of ilHaritasi.get(p).komsular) {
      if (mesafe.has(k)) continue;
      mesafe.set(k, mesafe.get(p) + 1);
      if (k === hedef) return mesafe.get(k);
      kuyruk.push(k);
    }
  }
  return Infinity;
}

export function yolculukUcreti(bas, hedef) {
  return YOLCULUK_TABAN_UCRETI + YOLCULUK_IL_BASI_UCRET * ilMesafesi(bas, hedef);
}

// Hızlı yolculuk yalnızca arınmış illerdeki kervansaraylar arasında yapılır.
// neden: 'ayni_il' | 'kervansaray_yok' | 'hedef_kervansaray_degil' | 'kilitli_bolge'
//        | 'arinmamis_baslangic' | 'arinmamis_hedef' | 'akce_yetersiz'
export function hizliYolculukKontrol(durum, hedef) {
  if (hedef === durum.konum) return { olur: false, neden: 'ayni_il' };
  if (!kervansarayVarMi(durum.konum)) return { olur: false, neden: 'kervansaray_yok' };
  if (!kervansarayVarMi(hedef)) return { olur: false, neden: 'hedef_kervansaray_degil' };
  if (!bolgeAcikMi(durum, ilHaritasi.get(hedef).bolge)) return { olur: false, neden: 'kilitli_bolge' };
  if (arinmaYuzdesi(durum, durum.konum) < 100) return { olur: false, neden: 'arinmamis_baslangic' };
  if (arinmaYuzdesi(durum, hedef) < 100) return { olur: false, neden: 'arinmamis_hedef' };
  if (durum.akce < yolculukUcreti(durum.konum, hedef)) return { olur: false, neden: 'akce_yetersiz' };
  return { olur: true };
}

export function hizliYolculuk(durum, hedef) {
  if (!hizliYolculukKontrol(durum, hedef).olur) return durum;
  return { ...durum, konum: hedef, akce: durum.akce - yolculukUcreti(durum.konum, hedef) };
}

// Kervansaray ekranı için bütün kervansaraylar ve oraya yolculuk durumu.
export function yolculukListesi(durum) {
  return KERVANSARAY_ILLERI.filter((p) => p !== durum.konum).map((plaka) => ({
    plaka,
    ucret: yolculukUcreti(durum.konum, plaka),
    ...hizliYolculukKontrol(durum, plaka),
  }));
}
