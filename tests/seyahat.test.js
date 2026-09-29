import { describe, it, expect } from 'vitest';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import {
  seyahatKontrol,
  seyahatEt,
  ilDurumu,
  bolgeAcikMi,
  arinmaYuzdesi,
} from '../src/oyun/ilerleme.js';

const ISTANBUL = 34;
const KOCAELI = 41;
const ANKARA = 6;
const BILECIK = 11;
const ESKISEHIR = 26;
const EDIRNE = 22;

describe('başlangıç durumu', () => {
  it('yalnızca Marmara açık, oyuncu İstanbul\'da', () => {
    const d = yeniOyunDurumu();
    expect(d.konum).toBe(ISTANBUL);
    expect(d.acikBolgeler).toEqual(['marmara']);
    expect(bolgeAcikMi(d, 'marmara')).toBe(true);
    expect(bolgeAcikMi(d, 'ege')).toBe(false);
  });

  it('il durumları: Marmara açık, diğerleri kilitli, arınma %0', () => {
    const d = yeniOyunDurumu();
    expect(ilDurumu(d, KOCAELI)).toBe('acik');
    expect(ilDurumu(d, ANKARA)).toBe('kilitli');
    expect(arinmaYuzdesi(d, KOCAELI)).toBe(0);
  });

  it('%100 arınmış il "arinmis" görünür', () => {
    const d = { ...yeniOyunDurumu(), arinma: { [KOCAELI]: 100, [EDIRNE]: 60 } };
    expect(ilDurumu(d, KOCAELI)).toBe('arinmis');
    expect(ilDurumu(d, EDIRNE)).toBe('acik');
    expect(arinmaYuzdesi(d, EDIRNE)).toBe(60);
  });
});

describe('seyahat kuralları', () => {
  it('İstanbul\'dan Kocaeli\'ye gidilebilir', () => {
    expect(seyahatKontrol(yeniOyunDurumu(), KOCAELI)).toEqual({ olur: true });
  });

  it('İstanbul\'dan Ankara\'ya gidilemez (kilitli bölge)', () => {
    expect(seyahatKontrol(yeniOyunDurumu(), ANKARA)).toEqual({ olur: false, neden: 'kilitli_bolge' });
  });

  it('açık bölgede komşu olmayan ile gidilemez', () => {
    expect(seyahatKontrol(yeniOyunDurumu(), EDIRNE)).toEqual({ olur: false, neden: 'komsu_degil' });
  });

  it('bulunulan ile tekrar gidilemez', () => {
    expect(seyahatKontrol(yeniOyunDurumu(), ISTANBUL)).toEqual({ olur: false, neden: 'ayni_il' });
  });

  it('komşu olsa da kilitli bölgeye gidilemez, bölge açılınca gidilir', () => {
    const d = { ...yeniOyunDurumu(), konum: BILECIK };
    expect(seyahatKontrol(d, ESKISEHIR)).toEqual({ olur: false, neden: 'kilitli_bolge' });
    const acik = { ...d, acikBolgeler: ['marmara', 'ic_anadolu'] };
    expect(seyahatKontrol(acik, ESKISEHIR)).toEqual({ olur: true });
  });

  it('seyahatEt konumu değiştirir ve eski durumu bozmaz', () => {
    const once = yeniOyunDurumu();
    const sonra = seyahatEt(once, KOCAELI);
    expect(sonra.konum).toBe(KOCAELI);
    expect(once.konum).toBe(ISTANBUL);
    expect(sonra).not.toBe(once);
  });

  it('gidilemeyen yere seyahatEt aynı durumu döndürür', () => {
    const once = yeniOyunDurumu();
    expect(seyahatEt(once, ANKARA)).toBe(once);
    expect(seyahatEt(once, EDIRNE)).toBe(once);
  });

  it('adım adım yol: İstanbul → Tekirdağ → Edirne', () => {
    let d = yeniOyunDurumu();
    d = seyahatEt(d, 59);
    d = seyahatEt(d, EDIRNE);
    expect(d.konum).toBe(EDIRNE);
  });
});
