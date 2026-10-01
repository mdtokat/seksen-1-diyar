// Oyun durumu ve abonelik. Saf oyun mantığı — DOM'a dokunmaz.
import { yeniKarakter } from './karakter.js';
import { baslangicHeybesi } from './envanter.js';
import { varsayilanKisayollar } from './kisayollar.js';
import { KLASIK_ROTA } from './rota.js';

// Yeni bir oyunun başlangıç durumu: yalnızca rotanın ilk bölgesi açık, oyuncu rotanın
// başlangıç ilinde. Oyun her yeni yolculukta rota.js → rotaOlustur ile yeni bir rota
// verir (Marmara dışındaki bir bölgenin küçük bir ili); rota verilmezse klasik rota
// (İstanbul) kullanılır. `ad` ve `sinif` verilirse karakter de oluşturulur.
export function yeniOyunDurumu({ ad, sinif, rota = KLASIK_ROTA } = {}) {
  const heybe = baslangicHeybesi(rota);
  const durum = {
    rota: { bolgeler: [...rota.bolgeler], baslangic: rota.baslangic },
    konum: rota.baslangic,
    acikBolgeler: [rota.bolgeler[0]],
    arinma: {}, // { plaka: 0–100 }
    oyuncu: sinif ? yeniKarakter(ad, sinif) : null,
    akce: 0,
    heybe,
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
    toplananYemekler: heybe.map((y) => y.anahtar), // en az bir kez sahip olunan yemekler
    istatistik: { zafer: 0, bayilma: 0, bolgeBayilma: {} },
  };
  // Savaş kısayol yuvaları (1–4 tuşları): kisayollar.js
  return { ...durum, kisayollar: varsayilanKisayollar(durum) };
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
