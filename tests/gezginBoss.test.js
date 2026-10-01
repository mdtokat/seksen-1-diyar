import { describe, it, expect } from 'vitest';
import { GEZGIN_BOSS, TEHLIKE, bossYaratiklari, gezginBossOlustur, gezginBossUret } from '../src/oyun/gezginBoss.js';
import { oyuncuHamlesi, dusmanHamlesi, savasci, yetenekBul, xpOdulu, dusmanXp, dusmanStatlari } from '../src/oyun/savas.js';
import { zaferUygula } from '../src/oyun/kesif.js';
import {
  DAVRANIS,
  davranisi,
  dusmanDogur,
  dusmanlariYerlestir,
  ilHaritasiUret,
  meydandaMi,
  mesafe,
  dusmanYurunurMu,
  surprizBaskin,
} from '../src/oyun/gezinti.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import { yeniKarakter, xpEkle, gerekenXp, statlar } from '../src/oyun/karakter.js';
import { rastgeleUreteci } from '../src/oyun/rastgele.js';
import { esyalar } from '../src/veri/esyalar.js';
import { iller } from '../src/veri/iller.js';
import { SINIF_XP_CARPANI } from '../src/veri/dusmanlar.js';

const sabit = (x) => () => x;
const ISTANBUL = 34;
const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
// Her bölgeden örnek iller: İstanbul, Bursa, İzmir, Adana, Ankara, Trabzon, Adıyaman, Erzurum
const ORNEK_ILLER = [34, 16, 35, 1, 6, 61, 2, 25];

function seviyeli(sinif, seviye) {
  let o = yeniKarakter('A', sinif);
  while (o.seviye < seviye) o = xpEkle(o, gerekenXp(o.seviye)).oyuncu;
  const s = statlar(o);
  return { ...yeniOyunDurumu({ ad: 'A', sinif }), oyuncu: { ...o, can: s.can, nefes: s.nefes }, heybe: [] };
}

// Yeteneklerini kullanan, yemek yemeyen basit bir oyuncu: canı azalınca iyileşir,
// yoksa en sert vuruşunu yapar.
const saldiri = () => ({ tur: 'saldir' });
function eylemSec(d) {
  const o = savasci(d);
  const ys = o.yetenekler.map((a) => yetenekBul(o.sinif, a));
  const sifa = ys.find((y) => y.etki === 'sifa' && o.nefes >= y.nefes);
  if (sifa && o.can < o.canEnCok * 0.4) return { tur: 'yetenek', anahtar: sifa.anahtar };
  const hasar = ys.filter((y) => y.etki === 'hasar' && o.nefes >= y.nefes).sort((a, b) => b.carpan - a.carpan)[0];
  return hasar ? { tur: 'yetenek', anahtar: hasar.anahtar } : saldiri();
}

// Yiğit ve boss sırayla hamle eder. Sonuç: { kazandi, hamle (yiğidin hamle sayısı) }.
function duello(d, hedef, rng, sec = eylemSec) {
  let hamle = 0;
  while (hedef.can > 0 && d.oyuncu.can > 0 && hamle < 200) {
    const r = oyuncuHamlesi(d, sec(d), rng, { hedef });
    ({ durum: d, hedef } = r);
    hamle++;
    if (hedef.can > 0) d = dusmanHamlesi(d, hedef, rng).durum;
  }
  return { kazandi: hedef.can <= 0, hamle };
}

// `seviye` seviyesindeki oyuncunun, `plaka` ilinde çıkan gezgin bosslara karşı kazanma oranı.
function kazanmaOrani(sinif, seviye, plaka, tehlike, rng, n = 150) {
  let zafer = 0;
  for (let i = 0; i < n; i++) {
    if (duello(seviyeli(sinif, seviye), gezginBossUret(plaka, rng, { tehlike }), rng).kazandi) zafer++;
  }
  return zafer / n;
}

describe('gezgin boss yaratıkları', () => {
  it('bölgenin mini bossları ve bölge bossları gezgin olabilir, Zülmet olamaz', () => {
    expect(bossYaratiklari('marmara').sort()).toEqual(['bogaz_ejderi', 'gulyabani']);
    expect(bossYaratiklari('dogu_anadolu')).not.toContain('zulmet');
  });

  it('ilin bölgesinden çıkar; inde bekleyen boss gezgin olarak çıkmaz', () => {
    for (let i = 0; i < 20; i++) {
      expect(gezginBossUret(ISTANBUL, rastgeleUreteci(i), { haric: ['bogaz_ejderi'] }).anahtar).toBe('gulyabani');
      expect(bossYaratiklari('ege')).toContain(gezginBossUret(35, rastgeleUreteci(i)).anahtar);
    }
    expect(gezginBossUret(ISTANBUL, sabit(0.5), { haric: ['bogaz_ejderi', 'gulyabani'] })).toBeNull();
  });

  it('seviyesi karaktere göre değil, ilin düşman seviyesine göre belirlenir', () => {
    const rng = rastgeleUreteci(3);
    for (const plaka of ORNEK_ILLER) {
      const ust = ilHaritasi.get(plaka).seviye[1];
      for (const tehlike of ['zorlu', 'kesilemez']) {
        const [a, b] = TEHLIKE[tehlike].seviyeFarki;
        for (let i = 0; i < 10; i++) {
          const d = gezginBossUret(plaka, rng, { tehlike });
          expect(d.seviye).toBeGreaterThanOrEqual(ust + a);
          expect(d.seviye).toBeLessThanOrEqual(ust + b);
          expect(d).toMatchObject({ gezgin: true, tehlike, takipci: false });
        }
      }
    }
  });

  it('statları boss yaratığın kendi çarpanlarından gelir ve ilin sıradan düşmanlarından güçlüdür', () => {
    for (const plaka of ORNEK_ILLER) {
      const il = ilHaritasi.get(plaka);
      const enGuclu = Math.max(...il.dusmanlar.map((a) => dusmanStatlari(a, il.seviye[1]).guc));
      const enCanli = Math.max(...il.dusmanlar.map((a) => dusmanStatlari(a, il.seviye[1]).can));
      for (const anahtar of bossYaratiklari(il.bolge)) {
        for (const tehlike of ['zorlu', 'kesilemez']) {
          const d = gezginBossOlustur(anahtar, plaka, sabit(0), { tehlike });
          const s = dusmanStatlari(anahtar, d.seviye);
          const c = TEHLIKE[tehlike].carpan;
          expect(d).toMatchObject({ anahtar, savunma: Math.round(s.savunma * c.savunma) });
          expect(d.guc).toBeGreaterThanOrEqual(Math.round(s.guc * c.guc));
          expect(d.can).toBe(d.canEnCok);
          expect(d.can).toBeGreaterThan(enCanli);
          expect(d.guc).toBeGreaterThanOrEqual(enGuclu);
        }
      }
    }
  });

  it('kesilemez bossun zırhı zorlu olanınkinin katlarıdır', () => {
    const zorlu = gezginBossOlustur('gulyabani', ISTANBUL, sabit(0), { tehlike: 'zorlu' });
    const kesilemez = gezginBossOlustur('gulyabani', ISTANBUL, sabit(0), { tehlike: 'kesilemez' });
    expect(kesilemez.savunma).toBeGreaterThan(zorlu.savunma * 2.5);
    expect(kesilemez.seviye).toBeGreaterThan(zorlu.seviye);
  });

  it('tehlike verilmezse kesilemez olma şansı GEZGIN_BOSS.kesilemezSansi kadardır', () => {
    expect(gezginBossOlustur('gulyabani', ISTANBUL, sabit(GEZGIN_BOSS.kesilemezSansi - 0.01)).tehlike).toBe('kesilemez');
    expect(gezginBossOlustur('gulyabani', ISTANBUL, sabit(GEZGIN_BOSS.kesilemezSansi + 0.01)).tehlike).toBe('zorlu');
  });

  it('bilinmeyen düşman ya da il hata verir', () => {
    expect(() => gezginBossOlustur('yok', ISTANBUL, sabit(0))).toThrow();
    expect(() => gezginBossOlustur('gulyabani', 999, sabit(0))).toThrow();
  });
});

describe('gezgin boss savaşı', () => {
  it('ilin seviyesindeki yiğit zorlu bossu bazen keser bazen kesemez; kesilemezi kesemez', () => {
    const rng = rastgeleUreteci(42);
    for (const sinif of ['akinci', 'kemankes', 'alperen', 'baci']) {
      for (const plaka of [ISTANBUL, 35, 6, 25]) {
        const seviye = ilHaritasi.get(plaka).seviye[1];
        const zorlu = kazanmaOrani(sinif, seviye, plaka, 'zorlu', rng);
        expect(zorlu, `${sinif} ${plaka}`).toBeGreaterThan(0.2);
        expect(zorlu, `${sinif} ${plaka}`).toBeLessThan(0.95);
        expect(kazanmaOrani(sinif, seviye, plaka, 'kesilemez', rng, 80), `${sinif} ${plaka}`).toBeLessThan(0.02);
      }
    }
  });

  it('ilin çok üstüne çıkmış bir yiğit kesilemez bossu da keser', () => {
    const rng = rastgeleUreteci(9);
    expect(kazanmaOrani('akinci', ilHaritasi.get(ISTANBUL).seviye[1] + 30, ISTANBUL, 'kesilemez', rng, 60)).toBeGreaterThan(0.8);
  });

  it('kesilemez boss ilin seviyesindeki yiğidi hemen deviremez: uzaklaşıp kaçmaya zaman kalır', () => {
    const rng = rastgeleUreteci(7);
    let hamleler = 0;
    for (let i = 0; i < 100; i++) {
      hamleler += duello(seviyeli('kemankes', ilHaritasi.get(35).seviye[1]), gezginBossUret(35, rng, { tehlike: 'kesilemez' }), rng, saldiri).hamle;
    }
    expect(hamleler / 100).toBeGreaterThanOrEqual(4);
  });

  it('bölge bossu türünden olsa da gezgin boss güçlenme evresine girmez; peşini bırakır', () => {
    const d = gezginBossOlustur('bogaz_ejderi', ISTANBUL, sabit(0.5), { tehlike: 'zorlu' });
    expect(d.tur).toBe('boss');
    const r = oyuncuHamlesi(seviyeli('akinci', 10), saldiri(), sabit(0.99), { hedef: { ...d, can: Math.floor(d.canEnCok / 2) } });
    expect(r.hedef.evre).toBeFalsy();
    expect(DAVRANIS.gezgin.birakma).toBeLessThan(Infinity);
    expect(DAVRANIS.gezgin.hiz).toBeLessThan(1);
  });

  it('XP gezgin çarpanıyla verilir', () => {
    const d = gezginBossOlustur('bogaz_ejderi', ISTANBUL, sabit(0.5), { tehlike: 'kesilemez' });
    expect(dusmanXp(d)).toBe(xpOdulu('bogaz_ejderi', d.seviye, SINIF_XP_CARPANI.gezgin));
  });

  it('zaferi ilerlemeyi etkilemez: bölge bossu yenilmiş sayılmaz', () => {
    const d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), konum: ISTANBUL };
    const boss = gezginBossOlustur('bogaz_ejderi', ISTANBUL, sabit(0.5), { tehlike: 'zorlu' });
    const { durum, ozet } = zaferUygula(d, boss, ISTANBUL, sabit(0.9));
    expect(ozet).toMatchObject({ sonuc: 'zafer', gezginBoss: 'zorlu', bossYenildi: null, miniBossYenildi: false, hayir: 0 });
    expect(durum.yenilenBosslar).toEqual([]);
    expect(durum.acikBolgeler).toEqual(['marmara']);
    expect(ozet.akce).toBeGreaterThan(0);
  });

  it('kesilemez boss yenilirse bölgenin efsanevi eşyalarından biri düşer', () => {
    const d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), konum: ISTANBUL };
    const boss = gezginBossOlustur('gulyabani', ISTANBUL, sabit(0.5), { tehlike: 'kesilemez' });
    const { durum, ozet } = zaferUygula(d, boss, ISTANBUL, sabit(0.5));
    expect(esyalar[ozet.esya]).toMatchObject({ bolge: 'marmara', nadirlik: 'efsanevi' });
    expect(durum.esyalar).toContain(ozet.esya);
    expect(durum.yenilenMiniBosslar).toEqual([]);
  });
});

describe('haritada gezgin bosslar', () => {
  const harita = ilHaritasiUret(ISTANBUL);

  it('bosslar açıkken doğan düşman bazen gezgin boss olur', () => {
    const boss = dusmanDogur(harita, ISTANBUL, sabit(0.01), { bosslar: true });
    expect(boss.dusman).toMatchObject({ gezgin: true });
    expect(bossYaratiklari('marmara')).toContain(boss.dusman.anahtar);
    const siradan = dusmanDogur(harita, ISTANBUL, sabit(0.5), { bosslar: true });
    expect(siradan.dusman.gezgin).toBeUndefined();
    // Bosslar kapalıyken hep sıradan düşman doğar
    expect(dusmanDogur(harita, ISTANBUL, sabit(0.01)).dusman.gezgin).toBeUndefined();
  });

  it('ilde yerleşen düşmanların bir kısmı zaman zaman gezgin bosstur', () => {
    let gezgin = 0;
    let toplam = 0;
    for (let i = 0; i < 60; i++) {
      const ds = dusmanlariYerlestir(harita, 0, rastgeleUreteci(i), { bosslar: true });
      toplam += ds.length;
      gezgin += ds.filter((d) => d.dusman.gezgin).length;
    }
    expect(gezgin / toplam).toBeGreaterThan(0.04);
    expect(gezgin / toplam).toBeLessThan(0.25);
  });

  it('gezgin bossun kendine özgü davranışı vardır', () => {
    const boss = dusmanDogur(harita, ISTANBUL, sabit(0.01), { bosslar: true });
    expect(davranisi(boss)).toBe(DAVRANIS.gezgin);
  });
});

describe('sürpriz baskın', () => {
  const harita = ilHaritasiUret(ISTANBUL);
  // Meydandan uzak, dört yanından en az biri düşmanın basabileceği bir karo
  const oyuncu = (() => {
    for (let y = 1; y < harita.yukseklik - 1; y++) {
      for (let x = 1; x < harita.genislik - 1; x++) {
        const p = { x, y };
        if (dusmanYurunurMu(harita, x, y) && !meydandaMi(harita, p) && dusmanYurunurMu(harita, x + 1, y)) return p;
      }
    }
    return null;
  })();
  const temel = { dusmanlar: [], oyuncu, adim: GEZGIN_BOSS.surprizBekleme, id: 500 };

  it('şans tutunca oyuncunun hemen yanında kovalayan bir gezgin boss belirir', () => {
    const d = surprizBaskin(harita, temel, sabit(0));
    expect(d).toMatchObject({ id: 500, kovaliyor: true, surpriz: true, dusman: { gezgin: true } });
    expect(mesafe(d, oyuncu)).toBe(1);
    expect(dusmanYurunurMu(harita, d.x, d.y)).toBe(true);
  });

  it('iki baskın arasında en az surprizBekleme adım geçer', () => {
    expect(surprizBaskin(harita, { ...temel, adim: GEZGIN_BOSS.surprizBekleme - 1 }, sabit(0))).toBeNull();
  });

  it('şans tutmazsa baskın olmaz', () => {
    expect(surprizBaskin(harita, temel, sabit(GEZGIN_BOSS.surprizSansi))).toBeNull();
  });

  it('meydan güvenlidir', () => {
    const meydan = { x: harita.meydan.x1, y: harita.meydan.y1 };
    expect(surprizBaskin(harita, { ...temel, oyuncu: meydan }, sabit(0))).toBeNull();
  });

  it('yanında boş yer yoksa baskın olmaz', () => {
    const komsular = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy], i) => ({ id: i, x: oyuncu.x + dx, y: oyuncu.y + dy }));
    expect(surprizBaskin(harita, { ...temel, dusmanlar: komsular }, sabit(0))).toBeNull();
  });
});
