import { describe, it, expect } from 'vitest';
import {
  arinmaArtir,
  ganimetUret,
  zaferUygula,
  yenilgiUygula,
  karsilasmaUret,
  YEMEK_DUSME_SANSI,
} from '../src/oyun/kesif.js';
import { dusmanOlustur } from '../src/oyun/savas.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import { gerekenXp, xpEkle, yeniKarakter } from '../src/oyun/karakter.js';
import { SOFRA } from '../src/oyun/ilerleme.js';
import { ilDurumu } from '../src/oyun/ilerleme.js';
import { yemekAdedi, HEYBE_YUVA } from '../src/oyun/envanter.js';
import { rastgeleUreteci } from '../src/oyun/rastgele.js';

const KOCAELI = 41;
const sabit = (x) => () => x;

const cakal = () => dusmanOlustur('cakal_surusu', 4);

describe('arınma', () => {
  it('her zaferde %12–18 artar', () => {
    const rng = rastgeleUreteci(11);
    const gorulen = new Set();
    for (let i = 0; i < 300; i++) {
      const r = arinmaArtir(yeniOyunDurumu(), KOCAELI, rng);
      expect(r.artis).toBeGreaterThanOrEqual(12);
      expect(r.artis).toBeLessThanOrEqual(18);
      gorulen.add(r.artis);
    }
    expect([...gorulen].sort((a, b) => a - b)).toEqual([12, 13, 14, 15, 16, 17, 18]);
  });

  it('%100\'de durur, il arınmış sayılır ve haritada yeşile döner', () => {
    const d = { ...yeniOyunDurumu(), arinma: { [KOCAELI]: 95 } };
    const r = arinmaArtir(d, KOCAELI, sabit(0.99));
    expect(r.yuzde).toBe(100);
    expect(r.artis).toBe(5);
    expect(r.arindi).toBe(true);
    expect(ilDurumu(r.durum, KOCAELI)).toBe('arinmis');
    const tekrar = arinmaArtir(r.durum, KOCAELI, sabit(0.99));
    expect(tekrar).toMatchObject({ yuzde: 100, artis: 0, arindi: false });
  });

  it('eski durumu değiştirmez', () => {
    const d = yeniOyunDurumu();
    arinmaArtir(d, KOCAELI, sabit(0.5));
    expect(d.arinma).toEqual({});
  });
});

describe('ganimet', () => {
  it('akçe seviyeyle artar, sınırlar içinde kalır', () => {
    const rng = rastgeleUreteci(4);
    for (let i = 0; i < 200; i++) {
      const g = ganimetUret(dusmanOlustur('ac_kurt', 1), 34, rng);
      expect(g.akce).toBeGreaterThanOrEqual(Math.round(5 * 0.8));
      expect(g.akce).toBeLessThanOrEqual(Math.round(5 * 1.2));
    }
    expect(ganimetUret(dusmanOlustur('ac_kurt', 10), 34, sabit(0.5)).akce).toBe(23);
    expect(ganimetUret(dusmanOlustur('gulyabani', 10), 34, sabit(0.5)).akce).toBe(69);
  });

  it('belirli bir şansla ilin yöresel yemeği düşer', () => {
    const rng = rastgeleUreteci(8);
    let dusen = 0;
    for (let i = 0; i < 2000; i++) {
      const g = ganimetUret(dusmanOlustur('ac_kurt', 5), KOCAELI, rng);
      if (g.yemek) {
        expect(g.yemek).toBe('pismaniye');
        dusen++;
      }
    }
    expect(dusen / 2000).toBeGreaterThan(YEMEK_DUSME_SANSI - 0.05);
    expect(dusen / 2000).toBeLessThan(YEMEK_DUSME_SANSI + 0.05);
  });
});

describe('haritada yenilen düşman', () => {
  it('zafer: XP, arınma, akçe ve (şans tutarsa) yemek', () => {
    const d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), konum: KOCAELI };
    const { durum, ozet } = zaferUygula(d, cakal(), KOCAELI, sabit(0)); // her şans tutar
    expect(ozet.sonuc).toBe('zafer');
    expect(ozet.xp).toBe(45);
    expect(ozet.arinmaArtisi).toBe(12);
    expect(durum.arinma[KOCAELI]).toBe(12);
    expect(ozet.akce).toBe(Math.round(11 * 0.8));
    expect(durum.akce).toBe(ozet.akce);
    expect(ozet.yemek).toBe('pismaniye');
    expect(yemekAdedi(durum.heybe, 'pismaniye')).toBe(1);
    expect(durum.istatistik.zafer).toBe(1);
  });

  it('zafer seviye atlatır, yeni yeteneği bildirir ve boş kısayol yuvasına koyar', () => {
    let o = yeniKarakter('A', 'akinci');
    while (o.seviye < 4) o = xpEkle(o, gerekenXp(o.seviye)).oyuncu;
    const d0 = yeniOyunDurumu({ ad: 'A', sinif: 'akinci' });
    const d = { ...d0, oyuncu: { ...o, xp: gerekenXp(4) - 10 }, kisayollar: [{ tur: 'saldir' }, null, null, null] };
    const { durum, ozet } = zaferUygula(d, dusmanOlustur('ac_kurt', 3), KOCAELI, sabit(0.5));
    expect(ozet).toMatchObject({ sonuc: 'zafer', xp: 35, seviyeler: [5] });
    expect(ozet.yeniYetenekler.map((y) => y.ad)).toEqual(['Kalkan Duruşu']);
    expect(durum.oyuncu).toMatchObject({ seviye: 5, xp: 25 });
    expect(durum.kisayollar[1]).toEqual({ tur: 'yetenek', anahtar: 'kalkan_durusu' });
  });

  it('her zafer sofradan bir zafer düşürür', () => {
    const d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), sofra: { bolge: 'marmara', kalan: SOFRA.zafer } };
    expect(zaferUygula(d, cakal(), KOCAELI, sabit(0.5)).durum.sofra.kalan).toBe(SOFRA.zafer - 1);
    expect(zaferUygula({ ...d, sofra: { bolge: 'marmara', kalan: 1 } }, cakal(), KOCAELI, sabit(0.5)).durum.sofra).toBeNull();
  });

  it('heybe doluysa yemek sığmaz ama diğer ganimet alınır', () => {
    const dolu = Array.from({ length: HEYBE_YUVA }, () => ({ anahtar: 'boyoz', adet: 10 }));
    const d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), konum: KOCAELI, heybe: dolu };
    const { durum, ozet } = zaferUygula(d, cakal(), KOCAELI, sabit(0));
    expect(ozet.yemekSigmadi).toBe(true);
    expect(yemekAdedi(durum.heybe, 'pismaniye')).toBe(0);
    expect(durum.akce).toBeGreaterThan(0);
  });

  it('bayılınca: arınma ve ganimet yok, akçenin %10\'u düşer, istatistiğe işlenir', () => {
    const d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), konum: KOCAELI, akce: 50 };
    const y = yenilgiUygula({ ...d, oyuncu: { ...d.oyuncu, can: 0 } }, KOCAELI);
    expect(y.ozet).toEqual({ sonuc: 'yenilgi', akceKaybi: 5, donulenIl: KOCAELI, kervansarayda: false, calinanAkce: 0 });
    expect(y.durum).toMatchObject({ akce: 45, arinma: {}, oyuncu: { can: d.oyuncu.can } });
    expect(y.durum.istatistik).toMatchObject({ bayilma: 1, bolgeBayilma: { marmara: 1 } });
  });

  it('karşılaşma ilin havuzundan gelir', () => {
    const d = karsilasmaUret(KOCAELI, rastgeleUreteci(1));
    expect(['cakal_surusu', 'yol_kesen_cin']).toContain(d.anahtar);
  });
});
