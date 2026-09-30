// Oyun durumu ve abonelik. Saf oyun mantığı — DOM'a dokunmaz.
import { bolgeler } from '../veri/bolgeler.js';
import { yeniKarakter } from './karakter.js';
import { BASLANGIC_HEYBESI } from './envanter.js';

// Yeni bir oyunun başlangıç durumu: yalnızca ilk bölge açık,
// oyuncu o bölgenin giriş ilinde (İstanbul).
// `ad` ve `sinif` verilirse karakter de oluşturulur.
export function yeniOyunDurumu({ ad, sinif } = {}) {
  const ilkBolge = bolgeler.find((b) => b.sira === 1);
  return {
    konum: ilkBolge.giris,
    acikBolgeler: [ilkBolge.anahtar],
    arinma: {}, // { plaka: 0–100 }
    oyuncu: sinif ? yeniKarakter(ad, sinif) : null,
    akce: 0,
    heybe: BASLANGIC_HEYBESI.map((y) => ({ ...y })),
    yenilenBosslar: [], // bölge anahtarları
    yenilenMiniBosslar: [], // il plakaları
    sofra: null, // { bolge, kalan } — zafer sofrasının kalan savaş sayısı
    esyalar: [], // sahip olunan eşyalar (esyalar.js anahtarları)
    sonKervansaray: null, // en son dinlenilen kervansarayın ili; bayılınca buraya dönülür
    gorevler: {}, // { anahtar: { durum: 'aktif', sayac } | { durum: 'tamam' } }
    hayir: 0, // itibar (Hayır puanı)
    hediyeAlinan: [], // muhtarın köylüler adına hediye verdiği iller
    zulmetYenildi: false, // final savaşı kazanıldı mı (oyun bitti; sonrasında da sürer)
    basarimlar: [], // kazanılan başarımlar (basarimlar.js anahtarları)
    toplananYemekler: BASLANGIC_HEYBESI.map((y) => y.anahtar), // en az bir kez sahip olunan yemekler
    istatistik: { zafer: 0, bayilma: 0, bolgeBayilma: {} },
  };
}

// Tek bir oyun durumunu tutan depo. Durum değişmez (immutable) kabul edilir:
// oyun fonksiyonları yeni durum döndürür, depo aboneleri haberdar eder.
// `donustur(yeni, onceki)` verilirse her yeni durum abonelere gitmeden ondan geçer
// (ör. başarımların denetlenmesi).
export function durumDeposu(baslangic, { donustur = (d) => d } = {}) {
  let durum = donustur(baslangic, baslangic); // ilk durumda geçiş yoktur (ör. eski bosslar "Yiğit" saydırmaz)
  const aboneler = new Set();
  return {
    al: () => durum,
    ayarla(yeni) {
      if (yeni === durum) return;
      durum = donustur(yeni, durum);
      for (const abone of aboneler) abone(durum);
    },
    abone(fn) {
      aboneler.add(fn);
      return () => aboneler.delete(fn);
    },
  };
}
