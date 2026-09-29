// Oyun durumu ve abonelik. Saf oyun mantığı — DOM'a dokunmaz.
import { bolgeler } from '../veri/bolgeler.js';

// Yeni bir oyunun başlangıç durumu: yalnızca ilk bölge açık,
// oyuncu o bölgenin giriş ilinde (İstanbul).
export function yeniOyunDurumu() {
  const ilkBolge = bolgeler.find((b) => b.sira === 1);
  return {
    konum: ilkBolge.giris,
    acikBolgeler: [ilkBolge.anahtar],
    arinma: {}, // { plaka: 0–100 }
  };
}

// Tek bir oyun durumunu tutan depo. Durum değişmez (immutable) kabul edilir:
// oyun fonksiyonları yeni durum döndürür, depo aboneleri haberdar eder.
export function durumDeposu(baslangic) {
  let durum = baslangic;
  const aboneler = new Set();
  return {
    al: () => durum,
    ayarla(yeni) {
      if (yeni === durum) return;
      durum = yeni;
      for (const abone of aboneler) abone(durum);
    },
    abone(fn) {
      aboneler.add(fn);
      return () => aboneler.delete(fn);
    },
  };
}
