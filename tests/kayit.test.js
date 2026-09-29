import { describe, it, expect } from 'vitest';
import {
  kaydet,
  yukle,
  kayitSil,
  kayitVarMi,
  goc,
  KAYIT_ANAHTARI,
  KAYIT_SURUMU,
} from '../src/oyun/kayit.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import { xpEkle } from '../src/oyun/karakter.js';

// localStorage yerine geçen sahte depo
function sahteDepo() {
  const veri = new Map();
  return {
    getItem: (k) => (veri.has(k) ? veri.get(k) : null),
    setItem: (k, v) => veri.set(k, String(v)),
    removeItem: (k) => veri.delete(k),
    ham: veri,
  };
}

const bozukDepo = {
  getItem() { throw new Error('erişim yok'); },
  setItem() { throw new Error('kota doldu'); },
  removeItem() { throw new Error('erişim yok'); },
};

function ornekDurum() {
  const d = yeniOyunDurumu({ ad: 'Şükrü Öğüt', sinif: 'alperen' });
  return {
    ...d,
    konum: 41,
    akce: 37,
    arinma: { 34: 100, 41: 27 },
    oyuncu: xpEkle(d.oyuncu, 200).oyuncu,
  };
}

describe('kaydet / yükle', () => {
  it('kaydet → yükle döngüsü durumu aynen geri getirir', () => {
    const depo = sahteDepo();
    const d = ornekDurum();
    expect(kaydet(d, depo)).toBe(true);
    expect(yukle(depo)).toEqual(d);
    expect(kayitVarMi(depo)).toBe(true);
  });

  it('kayıtta sürüm alanı bulunur', () => {
    const depo = sahteDepo();
    kaydet(ornekDurum(), depo);
    const ham = JSON.parse(depo.ham.get(KAYIT_ANAHTARI));
    expect(ham.surum).toBe(KAYIT_SURUMU);
    expect(ham.durum.oyuncu.ad).toBe('Şükrü Öğüt');
  });

  it('kayıt yoksa null döner', () => {
    expect(yukle(sahteDepo())).toBeNull();
    expect(kayitVarMi(sahteDepo())).toBe(false);
  });

  it('karakteri olmayan durum kaydedilmez', () => {
    const depo = sahteDepo();
    expect(kaydet(yeniOyunDurumu(), depo)).toBe(false);
    expect(depo.ham.size).toBe(0);
  });

  it('bozuk JSON, bilinmeyen sürüm ya da eksik alan null döner', () => {
    const depo = sahteDepo();
    depo.setItem(KAYIT_ANAHTARI, '{bozuk');
    expect(yukle(depo)).toBeNull();
    depo.setItem(KAYIT_ANAHTARI, JSON.stringify({ surum: 999, durum: ornekDurum() }));
    expect(yukle(depo)).toBeNull();
    const eksik = { ...ornekDurum(), heybe: undefined };
    depo.setItem(KAYIT_ANAHTARI, JSON.stringify({ surum: KAYIT_SURUMU, durum: eksik }));
    expect(yukle(depo)).toBeNull();
    const yanlisIl = { ...ornekDurum(), konum: 99 };
    depo.setItem(KAYIT_ANAHTARI, JSON.stringify({ surum: KAYIT_SURUMU, durum: yanlisIl }));
    expect(yukle(depo)).toBeNull();
  });

  it('depolama hata verirse oyun bozulmaz', () => {
    expect(kaydet(ornekDurum(), bozukDepo)).toBe(false);
    expect(yukle(bozukDepo)).toBeNull();
    expect(kayitSil(bozukDepo)).toBe(false);
    expect(kaydet(ornekDurum(), null)).toBe(false);
    expect(yukle(null)).toBeNull();
  });

  it('kayıt silinebilir', () => {
    const depo = sahteDepo();
    kaydet(ornekDurum(), depo);
    expect(kayitSil(depo)).toBe(true);
    expect(yukle(depo)).toBeNull();
  });

  it('göç: güncel sürüm aynen kalır, tanınmayan sürüm reddedilir', () => {
    const v = { surum: KAYIT_SURUMU, durum: ornekDurum() };
    expect(goc(v)).toBe(v);
    expect(goc({ surum: 0 })).toBeNull();
    expect(goc(null)).toBeNull();
  });
});
