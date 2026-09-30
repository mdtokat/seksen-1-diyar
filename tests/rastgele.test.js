import { describe, it, expect } from 'vitest';
import { rastgeleUreteci, aralik, tamSayi, sec, sans, yeniTohum } from '../src/oyun/rastgele.js';

describe('tohumlanabilir RNG', () => {
  it('aynı tohum aynı diziyi üretir', () => {
    const a = rastgeleUreteci(42);
    const b = rastgeleUreteci(42);
    const diziA = Array.from({ length: 20 }, a);
    expect(Array.from({ length: 20 }, b)).toEqual(diziA);
  });

  it('farklı tohum farklı dizi üretir', () => {
    const a = Array.from({ length: 5 }, rastgeleUreteci(1));
    const b = Array.from({ length: 5 }, rastgeleUreteci(2));
    expect(a).not.toEqual(b);
  });

  it('değerler [0, 1) aralığında ve dağılım makul', () => {
    const rng = rastgeleUreteci(7);
    let toplam = 0;
    for (let i = 0; i < 10000; i++) {
      const x = rng();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      toplam += x;
    }
    expect(toplam / 10000).toBeCloseTo(0.5, 1);
  });

  it('yardımcılar sınırlar içinde kalır', () => {
    const rng = rastgeleUreteci(3);
    const gorulen = new Set();
    for (let i = 0; i < 500; i++) {
      const t = tamSayi(rng, 1, 3);
      gorulen.add(t);
      const a = aralik(rng, 0.9, 1.1);
      expect(a).toBeGreaterThanOrEqual(0.9);
      expect(a).toBeLessThan(1.1);
      expect(['x', 'y']).toContain(sec(rng, ['x', 'y']));
    }
    expect([...gorulen].sort()).toEqual([1, 2, 3]);
    expect(sans(rng, 0)).toBe(false);
    expect(sans(rng, 1)).toBe(true);
  });

  it('yeni tohum 32 bitlik pozitif tam sayıdır', () => {
    const t = yeniTohum();
    expect(Number.isInteger(t)).toBe(true);
    expect(t).toBeGreaterThanOrEqual(0);
    expect(t).toBeLessThan(2 ** 32);
  });
});
