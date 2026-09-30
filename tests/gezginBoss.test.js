import { describe, it, expect } from 'vitest';
import {
  GEZGIN_BOSS,
  TEHLIKE,
  bossYaratiklari,
  gezginBossOlustur,
  gezginBossOlcekle,
  gezginBossUret,
} from '../src/oyun/gezginBoss.js';
import { savasBaslat, oyuncuEylemi, yetenekBul, kacilabilirMi, eylemKontrol, xpOdulu } from '../src/oyun/savas.js';
import { kesifSonucunuUygula } from '../src/oyun/kesif.js';
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

const sabit = (x) => () => x;
const ISTANBUL = 34;

function seviyeli(sinif, seviye) {
  let o = yeniKarakter('A', sinif);
  while (o.seviye < seviye) o = xpEkle(o, gerekenXp(o.seviye)).oyuncu;
  const s = statlar(o);
  return { ...o, can: s.can, nefes: s.nefes };
}

// Yeteneklerini kullanan, yemek yemeyen basit bir oyuncu: canı azalınca iyileşir,
// yoksa en sert vuruşunu yapar.
function eylemSec(s) {
  const o = s.oyuncu;
  const ys = o.yetenekler.map((a) => yetenekBul(o.sinif, a));
  const sifa = ys.find((y) => y.etki === 'sifa' && o.nefes >= y.nefes);
  if (sifa && o.can < o.canEnCok * 0.4) return { tur: 'yetenek', anahtar: sifa.anahtar };
  const hasar = ys.filter((y) => y.etki === 'hasar' && o.nefes >= y.nefes).sort((a, b) => b.carpan - a.carpan)[0];
  return hasar ? { tur: 'yetenek', anahtar: hasar.anahtar } : { tur: 'saldir' };
}

function kazanmaOrani(sinif, seviye, tehlike, rng, n = 200) {
  let zafer = 0;
  for (let i = 0; i < n; i++) {
    const o = seviyeli(sinif, seviye);
    let s = savasBaslat(o, gezginBossOlustur('gulyabani', o, rng, { tehlike }));
    for (let tur = 0; !s.sonuc && tur < 200; tur++) s = oyuncuEylemi(s, eylemSec(s), rng);
    if (s.sonuc === 'zafer') zafer++;
  }
  return zafer / n;
}

describe('gezgin boss yaratıkları', () => {
  it('bölgenin mini bossları ve bölge bossları gezgin olabilir, Zülmet olamaz', () => {
    expect(bossYaratiklari('marmara').sort()).toEqual(['bogaz_ejderi', 'gulyabani']);
    expect(bossYaratiklari('dogu_anadolu')).not.toContain('zulmet');
  });

  it('inde bekleyen boss gezgin olarak çıkmaz', () => {
    const o = seviyeli('akinci', 5);
    for (let i = 0; i < 20; i++) {
      expect(gezginBossUret('marmara', o, rastgeleUreteci(i), { haric: ['bogaz_ejderi'] }).anahtar).toBe('gulyabani');
    }
    expect(gezginBossUret('marmara', o, sabit(0.5), { haric: ['bogaz_ejderi', 'gulyabani'] })).toBeNull();
  });

  it('gücü her iki tehlikede de oyuncunun o anki gücünden fazladır', () => {
    const rng = rastgeleUreteci(3);
    for (const sinif of ['akinci', 'kemankes', 'alperen']) {
      for (const seviye of [1, 10, 30]) {
        const o = seviyeli(sinif, seviye);
        const s = statlar(o);
        for (const tehlike of ['zorlu', 'kesilemez']) {
          const d = gezginBossOlustur('bogaz_ejderi', o, rng, { tehlike });
          expect(d.guc).toBeGreaterThanOrEqual(Math.round(s.guc * TEHLIKE[tehlike].oran[0]));
          expect(d.guc).toBeGreaterThan(s.guc);
          expect(d.seviye).toBeGreaterThan(o.seviye);
          expect(d).toMatchObject({ gezgin: true, tehlike, anahtar: 'bogaz_ejderi', takipci: false });
        }
      }
    }
  });

  it('kesilemez bossun zırhı oyuncunun düz vuruşunu söndürür', () => {
    const o = seviyeli('akinci', 12);
    const d = gezginBossOlustur('gulyabani', o, sabit(0.5), { tehlike: 'kesilemez' });
    expect(d.savunma).toBeGreaterThanOrEqual(statlar(o).guc * 2.5);
    const s = oyuncuEylemi(savasBaslat(o, d), { tur: 'saldir' }, sabit(0.99));
    expect(s.gunluk.find((e) => e.kim === 'oyuncu').hasar).toBe(1);
  });

  it('tehlike verilmezse kesilemez olma şansı GEZGIN_BOSS.kesilemezSansi kadardır', () => {
    const o = seviyeli('akinci', 5);
    expect(gezginBossOlustur('gulyabani', o, sabit(GEZGIN_BOSS.kesilemezSansi - 0.01)).tehlike).toBe('kesilemez');
    expect(gezginBossOlustur('gulyabani', o, sabit(GEZGIN_BOSS.kesilemezSansi + 0.01)).tehlike).toBe('zorlu');
  });

  it('savaş başlarken gücü oyuncunun yeni gücüne göre yeniden ölçülür', () => {
    const d = gezginBossOlustur('gulyabani', seviyeli('akinci', 3), sabit(0.5), { tehlike: 'zorlu' });
    const guclu = seviyeli('akinci', 15);
    const yeni = gezginBossOlcekle(d, guclu);
    expect(yeni.guc).toBeGreaterThan(statlar(guclu).guc);
    expect(yeni.seviye).toBe(15 + d.seviyeFarki);
    expect(yeni.oran).toBe(d.oran);
    // Sıradan düşmanlara dokunulmaz
    const siradan = { anahtar: 'ac_kurt', guc: 5 };
    expect(gezginBossOlcekle(siradan, guclu)).toBe(siradan);
  });
});

describe('gezgin boss savaşı', () => {
  it('zorlu boss bazen kesilir, bazen kesilemez; kesilemez boss neredeyse hiç kesilmez', () => {
    const rng = rastgeleUreteci(42);
    for (const sinif of ['akinci', 'kemankes']) {
      for (const seviye of [3, 15, 35]) {
        const zorlu = kazanmaOrani(sinif, seviye, 'zorlu', rng);
        expect(zorlu).toBeGreaterThan(0.2);
        expect(zorlu).toBeLessThan(0.8);
        expect(kazanmaOrani(sinif, seviye, 'kesilemez', rng, 100)).toBeLessThan(0.02);
      }
    }
  });

  it('kesilemez boss oyuncuya kaçmak için birkaç tur tanır', () => {
    const rng = rastgeleUreteci(7);
    let turlar = 0;
    for (let i = 0; i < 100; i++) {
      const o = seviyeli('kemankes', 10);
      let s = savasBaslat(o, gezginBossOlustur('gulyabani', o, rng, { tehlike: 'kesilemez' }));
      while (!s.sonuc) s = oyuncuEylemi(s, { tur: 'saldir' }, rng);
      turlar += s.tur - 1;
    }
    expect(turlar / 100).toBeGreaterThanOrEqual(4);
  });

  it('bölge bossu türünden olsa da gezgin bosstan kaçılabilir ve güçlenme evresine girmez', () => {
    const o = seviyeli('akinci', 10);
    const d = gezginBossOlustur('bogaz_ejderi', o, sabit(0.5), { tehlike: 'zorlu' });
    expect(d.tur).toBe('boss');
    expect(kacilabilirMi(d)).toBe(true);
    const s0 = savasBaslat(o, d);
    expect(eylemKontrol(s0, { tur: 'kac' }).olur).toBe(true);
    const s = oyuncuEylemi({ ...s0, dusman: { ...s0.dusman, can: Math.floor(d.canEnCok / 2) } }, { tur: 'saldir' }, sabit(0.99));
    expect(s.evre).toBe(false);
  });

  it('savaş günlüğü tehlikeyi bildirir, XP gezgin çarpanıyla verilir', () => {
    const o = seviyeli('akinci', 10);
    const d = gezginBossOlustur('bogaz_ejderi', o, sabit(0.5), { tehlike: 'kesilemez' });
    const s = savasBaslat(o, d);
    expect(s.gunluk).toEqual([{ tip: 'baslangic' }, { tip: 'gezgin', tehlike: 'kesilemez' }]);
    expect(s.xpOdulu).toBe(xpOdulu('bogaz_ejderi', d.seviye, GEZGIN_BOSS.xpCarpani));
  });

  it('zaferi ilerlemeyi etkilemez: bölge bossu yenilmiş sayılmaz', () => {
    const d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), konum: ISTANBUL };
    const boss = gezginBossOlustur('bogaz_ejderi', d.oyuncu, sabit(0.5), { tehlike: 'zorlu' });
    const s0 = savasBaslat(d.oyuncu, boss, d.heybe);
    const s = oyuncuEylemi({ ...s0, dusman: { ...s0.dusman, can: 1 } }, { tur: 'saldir' }, sabit(0.99));
    const { durum, ozet } = kesifSonucunuUygula(d, s, ISTANBUL, sabit(0.9));
    expect(ozet).toMatchObject({ sonuc: 'zafer', gezginBoss: 'zorlu', bossYenildi: null, miniBossYenildi: false, hayir: 0 });
    expect(durum.yenilenBosslar).toEqual([]);
    expect(durum.acikBolgeler).toEqual(['marmara']);
    expect(ozet.akce).toBeGreaterThan(0);
  });

  it('kesilemez boss yenilirse bölgenin efsanevi eşyalarından biri düşer', () => {
    const d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), konum: ISTANBUL };
    const boss = gezginBossOlustur('gulyabani', d.oyuncu, sabit(0.5), { tehlike: 'kesilemez' });
    const s0 = savasBaslat(d.oyuncu, boss, d.heybe);
    const s = oyuncuEylemi({ ...s0, dusman: { ...s0.dusman, can: 1 } }, { tur: 'saldir' }, sabit(0.99));
    const { durum, ozet } = kesifSonucunuUygula(d, s, ISTANBUL, sabit(0.5));
    expect(esyalar[ozet.esya]).toMatchObject({ bolge: 'marmara', nadirlik: 'efsanevi' });
    expect(durum.esyalar).toContain(ozet.esya);
    expect(durum.yenilenMiniBosslar).toEqual([]);
  });
});

describe('haritada gezgin bosslar', () => {
  const harita = ilHaritasiUret(ISTANBUL);
  const karakter = seviyeli('akinci', 5);

  it('karakter verilince doğan düşman bazen gezgin boss olur', () => {
    const boss = dusmanDogur(harita, ISTANBUL, sabit(0.01), { karakter });
    expect(boss.dusman).toMatchObject({ gezgin: true });
    expect(bossYaratiklari('marmara')).toContain(boss.dusman.anahtar);
    const siradan = dusmanDogur(harita, ISTANBUL, sabit(0.5), { karakter });
    expect(siradan.dusman.gezgin).toBeUndefined();
    // Karakter verilmezse hep sıradan düşman doğar
    expect(dusmanDogur(harita, ISTANBUL, sabit(0.01)).dusman.gezgin).toBeUndefined();
  });

  it('ilde yerleşen düşmanların bir kısmı zaman zaman gezgin bosstur', () => {
    let gezgin = 0;
    let toplam = 0;
    for (let i = 0; i < 60; i++) {
      const ds = dusmanlariYerlestir(harita, 0, rastgeleUreteci(i), { karakter });
      toplam += ds.length;
      gezgin += ds.filter((d) => d.dusman.gezgin).length;
    }
    expect(gezgin / toplam).toBeGreaterThan(0.04);
    expect(gezgin / toplam).toBeLessThan(0.25);
  });

  it('gezgin bossun kendine özgü davranışı vardır', () => {
    const boss = dusmanDogur(harita, ISTANBUL, sabit(0.01), { karakter });
    expect(davranisi(boss)).toBe(DAVRANIS.gezgin);
  });
});

describe('sürpriz baskın', () => {
  const harita = ilHaritasiUret(ISTANBUL);
  const karakter = seviyeli('akinci', 5);
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
  const temel = { dusmanlar: [], oyuncu, karakter, adim: GEZGIN_BOSS.surprizBekleme, id: 500 };

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
