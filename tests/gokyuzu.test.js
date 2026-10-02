import { describe, it, expect } from 'vitest';
import { gunVakti, havaDurumu, GUN_MS, HAVA_MS } from '../src/oyun/gokyuzu.js';

describe('günün vakti', () => {
  it('gün şafak, gündüz, akşam ve gece evrelerinden geçer; gündüz karanlık yok', () => {
    const evreler = new Set();
    for (let i = 0; i < 100; i++) evreler.add(gunVakti((i / 100) * GUN_MS).evre);
    expect([...evreler].sort()).toEqual(['aksam', 'gece', 'gunduz', 'safak']);
    expect(gunVakti(0.35 * GUN_MS).karanlik).toBe(0);
    expect(gunVakti(0.9 * GUN_MS).karanlik).toBeGreaterThan(0.4);
  });

  it('gecenin karanlığı oynanışı engellemeyecek ölçüde; geçişler yumuşak', () => {
    let onceki = gunVakti(0);
    for (let i = 1; i <= 400; i++) {
      const v = gunVakti((i / 400) * GUN_MS);
      expect(v.karanlik).toBeLessThanOrEqual(0.6);
      expect(Math.abs(v.karanlik - onceki.karanlik)).toBeLessThan(0.05);
      onceki = v;
    }
    // Gün döner: bir gün sonra aynı vakit
    expect(gunVakti(123456 + GUN_MS)).toEqual(gunVakti(123456));
  });
});

describe('hava', () => {
  const turler = (plaka, bolge) => {
    const g = new Set();
    for (let i = 0; i < 400; i++) g.add(havaDurumu(plaka, bolge, i * HAVA_MS + HAVA_MS / 2).tur);
    return g;
  };

  it('bölgeye uygun: Doğu Anadolu karlı, Karadeniz yağmurlu ve sisli, Güneydoğu sıcak', () => {
    expect(turler(25, 'dogu_anadolu').has('kar')).toBe(true);
    expect(turler(61, 'karadeniz')).toEqual(new Set(['acik', 'yagmur', 'sis']));
    expect(turler(63, 'guneydogu')).toEqual(new Set(['acik', 'sicak']));
    expect(turler(35, 'ege').has('kar')).toBe(false);
  });

  it('aynı ilde aynı anda aynı; hava yavaşça gelip gider', () => {
    expect(havaDurumu(61, 'karadeniz', 5e6)).toEqual(havaDurumu(61, 'karadeniz', 5e6));
    for (let i = 0; i < 50; i++) {
      const bas = havaDurumu(25, 'dogu_anadolu', i * HAVA_MS + 1000);
      const orta = havaDurumu(25, 'dogu_anadolu', i * HAVA_MS + HAVA_MS / 2);
      if (orta.tur !== 'acik') expect(bas.siddet).toBeLessThan(orta.siddet);
      expect(orta.siddet).toBeLessThanOrEqual(1);
    }
  });
});
