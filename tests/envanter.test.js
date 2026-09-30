import { describe, it, expect } from 'vitest';
import {
  HEYBE_YUVA,
  YIGIN_EN_FAZLA,
  yemekEkle,
  yemekCikar,
  yemekAdedi,
  yemekYe,
  yemekYeKontrol,
  yemekGucu,
} from '../src/oyun/envanter.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import { statlar } from '../src/oyun/karakter.js';

describe('heybe kuralları', () => {
  it('yeni oyun 3 balık ekmek ve 2 höşmerimle başlar', () => {
    const d = yeniOyunDurumu({ ad: 'A', sinif: 'akinci' });
    expect(d.heybe).toEqual([
      { anahtar: 'balik_ekmek', adet: 3 },
      { anahtar: 'hosmerim', adet: 2 },
    ]);
    // Başlangıç heybesi paylaşılmaz: iki oyun birbirini etkilemez
    expect(yeniOyunDurumu().heybe[0]).not.toBe(d.heybe[0]);
  });

  it('aynı yemekler üst üste biner', () => {
    let { heybe } = yemekEkle([], 'boyoz');
    ({ heybe } = yemekEkle(heybe, 'boyoz', 3));
    expect(heybe).toEqual([{ anahtar: 'boyoz', adet: 4 }]);
  });

  it('bir yuva en fazla 10 alır, fazlası yeni yuvaya geçer', () => {
    const r = yemekEkle([{ anahtar: 'boyoz', adet: 8 }], 'boyoz', 5);
    expect(r.heybe).toEqual([
      { anahtar: 'boyoz', adet: YIGIN_EN_FAZLA },
      { anahtar: 'boyoz', adet: 3 },
    ]);
    expect(r.eklenen).toBe(5);
    expect(yemekAdedi(r.heybe, 'boyoz')).toBe(13);
  });

  it('heybe 20 yuvadır; dolunca yeni yemek sığmaz ama yarım yuva dolabilir', () => {
    const dolu = Array.from({ length: HEYBE_YUVA }, (_, i) => ({ anahtar: i === 0 ? 'boyoz' : 'incir', adet: i === 0 ? 9 : 10 }));
    const yeni = yemekEkle(dolu, 'tantuni');
    expect(yeni.eklenen).toBe(0);
    expect(yeni.sigmayan).toBe(1);
    expect(yeni.heybe).toEqual(dolu);
    const yarim = yemekEkle(dolu, 'boyoz', 3);
    expect(yarim.eklenen).toBe(1);
    expect(yarim.sigmayan).toBe(2);
    expect(yarim.heybe).toHaveLength(HEYBE_YUVA);
  });

  it('bilinmeyen yemek eklenmez', () => {
    expect(yemekEkle([], 'sarap').eklenen).toBe(0);
  });

  it('çıkarma son yuvadan başlar, boşalan yuva silinir', () => {
    const heybe = [{ anahtar: 'boyoz', adet: 10 }, { anahtar: 'incir', adet: 1 }, { anahtar: 'boyoz', adet: 1 }];
    expect(yemekCikar(heybe, 'boyoz')).toEqual([{ anahtar: 'boyoz', adet: 10 }, { anahtar: 'incir', adet: 1 }]);
    expect(yemekCikar(heybe, 'incir')).toEqual([{ anahtar: 'boyoz', adet: 10 }, { anahtar: 'boyoz', adet: 1 }]);
    expect(yemekCikar(heybe, 'tantuni')).toBe(heybe);
  });
});

describe('savaş dışında yemek yeme', () => {
  const yarali = () => {
    const d = yeniOyunDurumu({ ad: 'A', sinif: 'akinci' });
    return { ...d, oyuncu: { ...d.oyuncu, can: 50, nefes: 5 } };
  };

  it('can yemeği canı yeniler ve heybeden düşer', () => {
    const r = yemekYe(yarali(), 'balik_ekmek');
    expect(r).toMatchObject({ tur: 'can', miktar: yemekGucu('balik_ekmek') });
    expect(r.durum.oyuncu.can).toBe(50 + 30);
    expect(yemekAdedi(r.durum.heybe, 'balik_ekmek')).toBe(2);
  });

  it('nefes yemeği nefesi yeniler, en yüksek değeri aşmaz', () => {
    const r = yemekYe(yarali(), 'hosmerim');
    expect(r.durum.oyuncu.nefes).toBe(Math.min(statlar(r.durum.oyuncu).nefes, 5 + 15));
  });

  it('can doluyken ya da yemek yokken yenmez', () => {
    const d = yeniOyunDurumu({ ad: 'A', sinif: 'akinci' });
    expect(yemekYeKontrol(d, 'balik_ekmek')).toEqual({ olur: false, neden: 'dolu' });
    expect(yemekYe(d, 'balik_ekmek').durum).toBe(d);
    expect(yemekYeKontrol(yarali(), 'tantuni')).toEqual({ olur: false, neden: 'yok' });
  });

  it('yemek gücü bölge çarpanıyla ölçeklenir', () => {
    expect(yemekGucu('balik_ekmek')).toBe(30);
    expect(yemekGucu('hosmerim')).toBe(15);
    expect(yemekGucu('tantuni')).toBe(66);
  });
});
