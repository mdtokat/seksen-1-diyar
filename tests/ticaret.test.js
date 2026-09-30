import { describe, it, expect } from 'vitest';
import { esyalar, YUVALAR, NADIRLIKLER } from '../src/veri/esyalar.js';
import { bolgeler } from '../src/veri/bolgeler.js';
import { iller } from '../src/veri/iller.js';
import { siniflar } from '../src/veri/siniflar.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import { statlar, ekipmanStatlari, xpEkle, gerekenXp } from '../src/oyun/karakter.js';
import { kusan, kusanKontrol, cikar, kusaniliMi } from '../src/oyun/ekipman.js';
import {
  arastaMallari,
  yemekAl,
  yemekAlKontrol,
  ahiVarMi,
  ahiMallari,
  ahiTumMallari,
  pazarDonemi,
  esyaAl,
  esyaAlKontrol,
  esyaSat,
  esyaSatKontrol,
  satisFiyati,
} from '../src/oyun/ticaret.js';
import {
  kervansarayVarMi,
  dinlen,
  ilMesafesi,
  yolculukUcreti,
  hizliYolculuk,
  hizliYolculukKontrol,
  yolculukListesi,
  KERVANSARAY_ILLERI,
} from '../src/oyun/kervansaray.js';
import { dusmanOlustur, savasBaslat, oyuncuEylemi, savasSonucunuUygula } from '../src/oyun/savas.js';
import { kesifSonucunuUygula, bossGanimeti } from '../src/oyun/kesif.js';
import { yemekFiyati, yemekAdedi, HEYBE_YUVA } from '../src/oyun/envanter.js';
import { ilHaritasiUret, etkilesimTuru, ulasilabilir } from '../src/oyun/gezinti.js';
import { rastgeleUreteci } from '../src/oyun/rastgele.js';

const sabit = (x) => () => x;

function seviyeli(durum, seviye) {
  let o = durum.oyuncu;
  while (o.seviye < seviye) o = xpEkle(o, gerekenXp(o.seviye)).oyuncu;
  return { ...durum, oyuncu: o };
}

describe('eşya verisi', () => {
  it('her bölgede her sınıf için sıradan, nadir ve efsanevi silah var', () => {
    for (const b of bolgeler) {
      for (const sinif of Object.keys(siniflar)) {
        for (const nadirlik of NADIRLIKLER) {
          const bulunan = Object.values(esyalar).filter((e) => e.bolge === b.anahtar && e.sinif === sinif && e.yuva === 'silah' && e.nadirlik === nadirlik);
          expect(bulunan, `${b.ad} ${sinif} ${nadirlik}`).toHaveLength(1);
        }
      }
      const genel = Object.values(esyalar).filter((e) => e.bolge === b.anahtar && !e.sinif);
      expect(genel.filter((e) => e.nadirlik === 'efsanevi'), b.ad).toHaveLength(1);
      expect(genel.some((e) => e.yuva === 'zirh' && e.nadirlik === 'siradan'), b.ad).toBe(true);
    }
  });

  it('alanlar geçerli; adlar tekrarsız; plan örnekleri var', () => {
    const adlar = Object.values(esyalar).map((e) => e.ad);
    expect(new Set(adlar).size).toBe(adlar.length);
    for (const [a, e] of Object.entries(esyalar)) {
      expect(a).toMatch(/^[a-z0-9_]+$/);
      expect(YUVALAR, a).toContain(e.yuva);
      expect(NADIRLIKLER, a).toContain(e.nadirlik);
      expect(e.fiyat, a).toBeGreaterThan(0);
      expect(Object.keys(e.statlar).length, a).toBeGreaterThan(0);
      if (e.yuva === 'silah') expect(Object.keys(siniflar), a).toContain(e.sinif);
      expect(e.seviye, a).toBe(bolgeler.find((b) => b.anahtar === e.bolge).seviye[0]);
    }
    for (const ad of ['Sivas çakısı', 'Tokat yazması kuşak', 'Bursa ipeği cübbe']) expect(adlar).toContain(ad);
  });

  it('sonraki bölgenin eşyası daha güçlü ve daha pahalı', () => {
    const silah = (bolge, nadirlik) => Object.values(esyalar).find((e) => e.bolge === bolge && e.sinif === 'akinci' && e.nadirlik === nadirlik);
    const sira = [...bolgeler].sort((a, b) => a.sira - b.sira).map((b) => b.anahtar);
    for (let i = 1; i < sira.length; i++) {
      expect(silah(sira[i], 'siradan').statlar.guc).toBeGreaterThan(silah(sira[i - 1], 'siradan').statlar.guc);
      expect(silah(sira[i], 'siradan').fiyat).toBeGreaterThan(silah(sira[i - 1], 'siradan').fiyat);
    }
    expect(silah('marmara', 'nadir').statlar.guc).toBeGreaterThan(silah('marmara', 'siradan').statlar.guc);
    expect(silah('marmara', 'efsanevi').statlar.guc).toBeGreaterThan(silah('marmara', 'nadir').statlar.guc);
  });
});

describe('ekipman', () => {
  const durumIle = (sinif, ...esya) => ({ ...yeniOyunDurumu({ ad: 'A', sinif }), esyalar: esya });

  it('kuşanılan eşya statlara yansır, çıkarınca geri alınır', () => {
    const d = durumIle('akinci', 'bursa_celigi_pala', 'bursa_ipegi_cubbe');
    const once = statlar(d.oyuncu);
    let k = kusan(d, 'bursa_celigi_pala');
    k = kusan(k, 'bursa_ipegi_cubbe');
    const sonra = statlar(k.oyuncu);
    expect(sonra.guc).toBe(once.guc + esyalar.bursa_celigi_pala.statlar.guc);
    expect(sonra.savunma).toBe(once.savunma + esyalar.bursa_ipegi_cubbe.statlar.savunma);
    expect(sonra.can).toBe(once.can + esyalar.bursa_celigi_pala.statlar.can + esyalar.bursa_ipegi_cubbe.statlar.can);
    expect(ekipmanStatlari(k.oyuncu).guc).toBe(esyalar.bursa_celigi_pala.statlar.guc);
    expect(kusaniliMi(k, 'bursa_celigi_pala')).toBe(true);
    const c = cikar(k, 'silah');
    expect(statlar(c.oyuncu).guc).toBe(once.guc);
    expect(c.oyuncu.kusanilan.silah).toBeNull();
  });

  it('savaşta ekipmanın güç farkı hissedilir', () => {
    const d = kusan(durumIle('akinci', 'bogaz_kilici'), 'bogaz_kilici');
    const dusman = dusmanOlustur('ac_kurt', 3);
    const ciplak = oyuncuEylemi(savasBaslat(yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }).oyuncu, dusman), { tur: 'saldir' }, sabit(0.99));
    const silahli = oyuncuEylemi(savasBaslat(d.oyuncu, dusman), { tur: 'saldir' }, sabit(0.99));
    expect(silahli.gunluk[1].hasar).toBeGreaterThan(ciplak.gunluk[1].hasar);
  });

  it('yuvadaki eski eşya yenisiyle değişir', () => {
    let d = durumIle('akinci', 'edirne_kilici', 'bursa_celigi_pala');
    d = kusan(d, 'edirne_kilici');
    d = kusan(d, 'bursa_celigi_pala');
    expect(d.oyuncu.kusanilan.silah).toBe('bursa_celigi_pala');
  });

  it('sahip olunmayan, başka sınıfın ya da yüksek seviyeli eşya kuşanılamaz', () => {
    const d = durumIle('akinci', 'talim_yayi', 'ege_palasi');
    expect(kusanKontrol(d, 'edirne_kilici')).toEqual({ olur: false, neden: 'sahip_degil' });
    expect(kusanKontrol(d, 'talim_yayi')).toEqual({ olur: false, neden: 'sinif' });
    expect(kusanKontrol(d, 'ege_palasi')).toEqual({ olur: false, neden: 'seviye' });
    expect(kusan(d, 'talim_yayi')).toBe(d);
    expect(kusanKontrol(seviyeli(d, 8), 'ege_palasi')).toEqual({ olur: true });
  });

  it('can bonuslu eşya çıkarılınca güncel can en yüksek değeri aşmaz', () => {
    let d = kusan(durumIle('akinci', 'bursa_ipegi_cubbe'), 'bursa_ipegi_cubbe');
    d = { ...d, oyuncu: { ...d.oyuncu, can: statlar(d.oyuncu).can } };
    const c = cikar(d, 'zirh');
    expect(c.oyuncu.can).toBe(statlar(c.oyuncu).can);
  });
});

describe('arasta', () => {
  it('ilin yemeği ve komşu illerden iki yemek satılır', () => {
    const mallar = arastaMallari(34); // İstanbul: komşular 39, 41, 59 → 39 ve 41
    expect(mallar).toEqual(['balik_ekmek', 'kirklareli_koftesi', 'pismaniye']);
    for (const il of iller) {
      const m = arastaMallari(il.plaka);
      expect(m[0], il.ad).toBe(il.yemek);
      expect(m.length, il.ad).toBeGreaterThanOrEqual(2);
      expect(m.length, il.ad).toBeLessThanOrEqual(3);
    }
  });

  it('yemek akçe karşılığı heybeye girer; akçe yetmezse ya da heybe doluysa alınamaz', () => {
    const d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), akce: 50 };
    const s = yemekAl(d, 'pismaniye');
    expect(s.akce).toBe(50 - yemekFiyati('pismaniye'));
    expect(yemekAdedi(s.heybe, 'pismaniye')).toBe(1);
    expect(yemekAlKontrol({ ...d, akce: 5 }, 'pismaniye')).toEqual({ olur: false, neden: 'akce_yetersiz' });
    expect(yemekAlKontrol(d, 'tantuni')).toEqual({ olur: false, neden: 'satilmiyor' });
    const dolu = Array.from({ length: HEYBE_YUVA }, () => ({ anahtar: 'boyoz', adet: 10 }));
    expect(yemekAlKontrol({ ...d, heybe: dolu }, 'pismaniye')).toEqual({ olur: false, neden: 'heybe_dolu' });
  });
});

describe('Ahi esnafı', () => {
  it('her 3–4 ilde bir Ahi dükkânı var ve efsanevi eşya satılmaz', () => {
    const dukkanlar = iller.filter((il) => ahiVarMi(il.plaka));
    expect(dukkanlar.length).toBeGreaterThanOrEqual(Math.floor(81 / 4));
    expect(dukkanlar.length).toBeLessThanOrEqual(Math.ceil(81 / 3));
    for (const il of dukkanlar) {
      const mallar = ahiMallari(il.plaka);
      expect(mallar.length, il.ad).toBeGreaterThan(0);
      for (const a of mallar) {
        expect(esyalar[a].bolge).toBe(il.bolge);
        expect(esyalar[a].nadirlik).not.toBe('efsanevi');
      }
    }
    expect(ahiMallari(41)).toEqual([]); // Kocaeli'de dükkân yok
  });

  it('eşya alınır, aynı eşya ikinci kez alınamaz, akçe yetmezse alınamaz', () => {
    const d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), akce: 500 };
    // Tezgâhta hangi eşyaların olduğu döneme göre değişir; satılan bir Akıncı silahı seçilir
    const [a] = ahiMallari(34, pazarDonemi(d)).filter((x) => esyalar[x].sinif === 'akinci');
    const s = esyaAl(d, a);
    expect(s.akce).toBe(500 - esyalar[a].fiyat);
    expect(s.esyalar).toEqual([a]);
    expect(esyaAlKontrol(s, a)).toEqual({ olur: false, neden: 'zaten_var' });
    expect(esyaAlKontrol({ ...d, akce: 10 }, a)).toEqual({ olur: false, neden: 'akce_yetersiz' });
    expect(esyaAlKontrol(d, 'bogaz_kilici')).toEqual({ olur: false, neden: 'satilmiyor' });
    expect(esyaAlKontrol({ ...d, konum: 41 }, a)).toEqual({ olur: false, neden: 'satilmiyor' });
    // Tezgâhta olmayan (ama bölgede satılabilir) eşya alınamaz
    const yok = ahiTumMallari(34).find((x) => !ahiMallari(34, pazarDonemi(d)).includes(x));
    expect(esyaAlKontrol(d, yok)).toEqual({ olur: false, neden: 'satilmiyor' });
  });

  it('eşya yarı fiyatına satılır; kuşanılı eşya satılamaz', () => {
    let d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), akce: 0, esyalar: ['edirne_kilici', 'kece_yelek'] };
    d = kusan(d, 'kece_yelek');
    expect(esyaSatKontrol(d, 'kece_yelek')).toEqual({ olur: false, neden: 'kusanili' });
    const s = esyaSat(d, 'edirne_kilici');
    expect(s.akce).toBe(satisFiyati('edirne_kilici'));
    expect(satisFiyati('edirne_kilici')).toBe(Math.floor(esyalar.edirne_kilici.fiyat / 2));
    expect(s.esyalar).toEqual(['kece_yelek']);
    expect(esyaSatKontrol({ ...d, konum: 41 }, 'edirne_kilici')).toEqual({ olur: false, neden: 'dukkan_yok' });
  });
});

describe('kervansaray', () => {
  it('her bölgede en az iki kervansaray var', () => {
    for (const b of bolgeler) expect(b.kervansarayIlleri.length, b.ad).toBeGreaterThanOrEqual(2);
    expect(kervansarayVarMi(34)).toBe(true);
    expect(kervansarayVarMi(41)).toBe(false);
  });

  it('dinlenince can ve nefes dolar, bayılınca buraya dönülür', () => {
    const d0 = yeniOyunDurumu({ ad: 'A', sinif: 'kemankes' });
    const yorgun = { ...d0, oyuncu: { ...d0.oyuncu, can: 3, nefes: 1 } };
    const d = dinlen(yorgun);
    expect(d.oyuncu.can).toBe(statlar(d.oyuncu).can);
    expect(d.oyuncu.nefes).toBe(statlar(d.oyuncu).nefes);
    expect(d.sonKervansaray).toBe(34);
    expect(dinlen({ ...yorgun, konum: 41 })).toEqual({ ...yorgun, konum: 41 });

    // Kocaeli'de bayılan oyuncu İstanbul kervansarayında kendine gelir
    const uzakta = { ...d, konum: 41, akce: 100 };
    const s0 = savasBaslat(uzakta.oyuncu, dusmanOlustur('ac_kurt', 1));
    const s = oyuncuEylemi({ ...s0, oyuncu: { ...s0.oyuncu, can: 1 }, dusman: { ...s0.dusman, guc: 999 } }, { tur: 'saldir' }, sabit(0.99));
    const { durum, ozet } = savasSonucunuUygula(uzakta, s);
    expect(durum.konum).toBe(34);
    expect(ozet).toMatchObject({ donulenIl: 34, kervansarayda: true, akceKaybi: 10 });
  });

  it('il mesafesi ve yolculuk ücreti', () => {
    expect(ilMesafesi(34, 34)).toBe(0);
    expect(ilMesafesi(34, 41)).toBe(1);
    expect(ilMesafesi(34, 16)).toBe(2); // İstanbul → Kocaeli → Bursa
    expect(yolculukUcreti(34, 16)).toBe(15 + 5 * 2);
  });

  it('hızlı yolculuk yalnızca arınmış illerdeki kervansaraylar arasında, akçe karşılığı', () => {
    const d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), akce: 1000, arinma: { 34: 100, 17: 100 } };
    expect(hizliYolculukKontrol(d, 17)).toEqual({ olur: true });
    const s = hizliYolculuk(d, 17);
    expect(s.konum).toBe(17);
    expect(s.akce).toBe(1000 - yolculukUcreti(34, 17));
    expect(hizliYolculukKontrol(d, 34)).toEqual({ olur: false, neden: 'ayni_il' });
    expect(hizliYolculukKontrol(d, 16)).toEqual({ olur: false, neden: 'hedef_kervansaray_degil' });
    expect(hizliYolculukKontrol({ ...d, konum: 41 }, 17)).toEqual({ olur: false, neden: 'kervansaray_yok' });
    expect(hizliYolculukKontrol({ ...d, arinma: { 17: 100 } }, 17)).toEqual({ olur: false, neden: 'arinmamis_baslangic' });
    expect(hizliYolculukKontrol({ ...d, arinma: { 34: 100 } }, 17)).toEqual({ olur: false, neden: 'arinmamis_hedef' });
    expect(hizliYolculukKontrol({ ...d, akce: 5 }, 17)).toEqual({ olur: false, neden: 'akce_yetersiz' });
    expect(hizliYolculukKontrol({ ...d, arinma: { 34: 100, 45: 100 } }, 45)).toEqual({ olur: false, neden: 'kilitli_bolge' });
    expect(hizliYolculuk({ ...d, akce: 5 }, 17)).toEqual({ ...d, akce: 5 });
  });

  it('yolculuk listesi bütün diğer kervansarayları içerir', () => {
    const d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), akce: 1000, arinma: { 34: 100, 17: 100 } };
    const liste = yolculukListesi(d);
    expect(liste).toHaveLength(KERVANSARAY_ILLERI.length - 1);
    expect(liste.find((y) => y.plaka === 17)).toMatchObject({ olur: true, ucret: yolculukUcreti(34, 17) });
  });
});

describe('boss ganimeti', () => {
  it('bölge bossu sınıfa uygun garanti bir efsanevi eşya düşürür', () => {
    const d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'kemankes' }), konum: 34 };
    for (let t = 1; t <= 20; t++) {
      const a = bossGanimeti(d, 'marmara', 'efsanevi', rastgeleUreteci(t));
      expect(['dalga_yayi', 'ejder_pulu_zirh']).toContain(a);
    }
    const hepsi = { ...d, esyalar: ['dalga_yayi', 'ejder_pulu_zirh'] };
    expect(bossGanimeti(hepsi, 'marmara', 'efsanevi', rastgeleUreteci(1))).toBeNull();
  });

  it('boss zaferinde eşya çantaya girer, mini boss nadir eşya düşürür', () => {
    const d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'alperen' }), konum: 34 };
    const zafer = (dusman) => {
      const s0 = savasBaslat(d.oyuncu, dusman, d.heybe);
      return oyuncuEylemi({ ...s0, dusman: { ...s0.dusman, can: 1 } }, { tur: 'saldir' }, sabit(0.99));
    };
    const r = kesifSonucunuUygula(d, zafer(dusmanOlustur('bogaz_ejderi', 10)), 34, sabit(0.1));
    expect(esyalar[r.ozet.esya].nadirlik).toBe('efsanevi');
    expect(r.durum.esyalar).toContain(r.ozet.esya);
    const m = kesifSonucunuUygula({ ...d, konum: 16 }, zafer(dusmanOlustur('gulyabani', 9)), 16, sabit(0.1));
    expect(esyalar[m.ozet.esya].nadirlik).toBe('nadir');
    expect([undefined, 'alperen']).toContain(esyalar[m.ozet.esya].sinif);
    const siradan = kesifSonucunuUygula(d, zafer(dusmanOlustur('ac_kurt', 1)), 34, sabit(0.1));
    expect(siradan.ozet.esya).toBeNull();
  });
});

describe('il haritasında dükkân ve kervansaray', () => {
  it('Ahi ve kervansaray illerinde meydanda yapıları var, meydan hâlâ bağlı', () => {
    for (const il of iller) {
      const h = ilHaritasiUret(il.plaka);
      expect(Boolean(h.dukkan), il.ad).toBe(ahiVarMi(il.plaka));
      expect(Boolean(h.kervansaray), il.ad).toBe(kervansarayVarMi(il.plaka));
      if (h.dukkan) expect(etkilesimTuru(h, h.dukkan.x, h.dukkan.y)).toBe('dukkan');
      if (h.kervansaray) expect(etkilesimTuru(h, h.kervansaray.x, h.kervansaray.y)).toBe('kervansaray');
      const u = ulasilabilir(h, h.dogus);
      for (const k of h.kapilar) expect(u.has(k.y * h.genislik + k.x), il.ad).toBe(true);
    }
  });
});
