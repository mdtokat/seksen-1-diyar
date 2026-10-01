import { describe, it, expect } from 'vitest';
import {
  KISAYOL_YUVA,
  varsayilanKisayollar,
  kisayolAta,
  kisayolGecerliMi,
  kisayolEylemi,
  yeniYetenekleriYerlestir,
} from '../src/oyun/kisayollar.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import { goc, yukle, kaydet, KAYIT_SURUMU } from '../src/oyun/kayit.js';
import { savasBaslat, oyuncuEylemi, dusmanOlustur, savasSonucunuUygula } from '../src/oyun/savas.js';
import { xpEkle } from '../src/oyun/karakter.js';
import { dusmanlar } from '../src/veri/dusmanlar.js';
import { bolgeler } from '../src/veri/bolgeler.js';
import { rastgeleUreteci } from '../src/oyun/rastgele.js';

function sahteDepo() {
  const veri = new Map();
  return { getItem: (k) => veri.get(k) ?? null, setItem: (k, v) => veri.set(k, String(v)), removeItem: (k) => veri.delete(k) };
}

describe('savaş kısayol yuvaları', () => {
  it('yeni oyunda dört yuva var: Saldır, ilk yetenek ve heybedeki ilk yemek', () => {
    const d = yeniOyunDurumu({ ad: 'Alp', sinif: 'akinci' });
    expect(d.kisayollar).toHaveLength(KISAYOL_YUVA);
    expect(d.kisayollar[0]).toEqual({ tur: 'saldir' });
    expect(d.kisayollar[1]).toEqual({ tur: 'yetenek', anahtar: 'kilic_darbesi' });
    expect(d.kisayollar[2]).toBeNull();
    expect(d.kisayollar[3]).toEqual({ tur: 'yemek', anahtar: d.heybe[0].anahtar });
    expect(d.kisayollar.every((k) => kisayolGecerliMi(k, 'akinci'))).toBe(true);
  });

  it('yuvaya yetenek, yemek, saldır ya da kaç konur; aynı içerik başka yuvadan taşınır', () => {
    let d = yeniOyunDurumu({ ad: 'Alp', sinif: 'akinci' });
    d = kisayolAta(d, 2, { tur: 'kac' });
    expect(d.kisayollar[2]).toEqual({ tur: 'kac' });
    d = kisayolAta(d, 2, { tur: 'saldir' });
    expect(d.kisayollar[2]).toEqual({ tur: 'saldir' });
    expect(d.kisayollar[0]).toBeNull();
    d = kisayolAta(d, 3, null);
    expect(d.kisayollar[3]).toBeNull();
  });

  it('geçersiz atamalar durumu değiştirmez', () => {
    const d = yeniOyunDurumu({ ad: 'Alp', sinif: 'akinci' });
    expect(kisayolAta(d, 4, { tur: 'saldir' })).toBe(d);
    expect(kisayolAta(d, -1, { tur: 'saldir' })).toBe(d);
    expect(kisayolAta(d, 1, { tur: 'yetenek', anahtar: 'sifa_duasi_yok' })).toBe(d);
    expect(kisayolAta(d, 1, { tur: 'yemek', anahtar: 'yok_boyle_yemek' })).toBe(d);
    expect(kisayolAta(d, 1, { tur: 'uc' })).toBe(d);
    // Başka sınıfın yeteneği konamaz
    const baska = yeniOyunDurumu({ ad: 'Alp', sinif: 'alperen' }).kisayollar[1];
    expect(kisayolAta(d, 2, baska)).toBe(d);
    expect(kisayolAta(d, 0, { tur: 'saldir' })).toBe(d); // zaten orada
  });

  it('yuva içeriği savaş eylemine çevrilir ve savaşta kullanılır', () => {
    expect(kisayolEylemi(null)).toBeNull();
    expect(kisayolEylemi({ tur: 'saldir' })).toEqual({ tur: 'saldir' });
    expect(kisayolEylemi({ tur: 'yemek', anahtar: 'boyoz' })).toEqual({ tur: 'yemek', anahtar: 'boyoz' });
    const d = yeniOyunDurumu({ ad: 'Alp', sinif: 'akinci' });
    const savas = savasBaslat(d.oyuncu, dusmanOlustur('ac_kurt', 1), d.heybe);
    const sonra = oyuncuEylemi(savas, kisayolEylemi(d.kisayollar[1]), rastgeleUreteci(1));
    expect(sonra.gunluk[1]).toMatchObject({ tip: 'yetenek', yetenek: 'kilic_darbesi' });
  });

  it('yeni açılan yetenek boş yuvaya yerleşir; yer yoksa dokunulmaz', () => {
    expect(yeniYetenekleriYerlestir([{ tur: 'saldir' }, null, null, null], [{ anahtar: 'kalkan_durusu' }]))
      .toEqual([{ tur: 'saldir' }, { tur: 'yetenek', anahtar: 'kalkan_durusu' }, null, null]);
    const dolu = [{ tur: 'saldir' }, { tur: 'kac' }, { tur: 'yemek', anahtar: 'boyoz' }, { tur: 'yetenek', anahtar: 'kilic_darbesi' }];
    expect(yeniYetenekleriYerlestir(dolu, [{ anahtar: 'kalkan_durusu' }])).toEqual(dolu);
  });

  it('seviye atlayıp yetenek açılınca yetenek yuvaya kendiliğinden konur', () => {
    let d = yeniOyunDurumu({ ad: 'Alp', sinif: 'akinci' });
    d = { ...d, oyuncu: xpEkle(d.oyuncu, 0).oyuncu };
    // Sv 4'ten 5'e geçiren bir zafer
    let o = d.oyuncu;
    while (o.seviye < 4) o = xpEkle(o, 50).oyuncu;
    d = { ...d, oyuncu: o };
    const savas = { ...savasBaslat(o, dusmanOlustur('ac_kurt', 30), d.heybe), sonuc: 'zafer' };
    const r = savasSonucunuUygula(d, { ...savas, xpOdulu: 100000 });
    expect(r.ozet.yeniYetenekler.length).toBeGreaterThan(0);
    expect(r.durum.kisayollar).toContainEqual({ tur: 'yetenek', anahtar: 'kalkan_durusu' });
  });

  it('kayıt: sürüm 5 kaydına varsayılan yuvalar eklenir; bozuk yuvalı kayıt reddedilir', () => {
    const d = yeniOyunDurumu({ ad: 'Alp', sinif: 'kemankes' });
    const { kisayollar, ...eski } = d;
    const v = goc({ surum: 5, durum: eski });
    expect(v.surum).toBe(KAYIT_SURUMU);
    expect(v.durum.kisayollar).toEqual(varsayilanKisayollar(eski));
    const depo = sahteDepo();
    expect(kaydet({ ...d, kisayollar: [{ tur: 'saldir' }] }, depo)).toBe(true);
    expect(yukle(depo)).toBeNull();
    kaydet(kisayolAta(d, 2, { tur: 'kac' }), depo);
    expect(yukle(depo).kisayollar[2]).toEqual({ tur: 'kac' });
    expect(kisayollar).toHaveLength(KISAYOL_YUVA);
  });
});

describe('takipçi düşmanlar', () => {
  it('her bölgede peşe takılan (takipçi) en az bir sıradan düşman var', () => {
    for (const b of bolgeler) {
      const takipciler = Object.values(dusmanlar).filter((d) => d.bolge === b.anahtar && d.sinif === 'siradan' && d.takip === 'takipci');
      expect(takipciler.length, b.ad).toBeGreaterThan(0);
    }
    expect(dusmanOlustur('ac_kurt', 3).takipci).toBe(true);
    expect(dusmanOlustur('yaban_domuzu', 3).takipci).toBe(false);
  });
});
