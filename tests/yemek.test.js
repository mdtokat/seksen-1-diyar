import { describe, it, expect } from 'vitest';
import { yemekGucu, yemekFiyati } from '../src/oyun/envanter.js';
import { yemekler } from '../src/veri/yemekler.js';

describe('yemek gücü ve fiyatı', () => {
  it('Marmara yemekleri taban değerde', () => {
    expect(yemekGucu('balik_ekmek')).toBe(30);
    expect(yemekFiyati('balik_ekmek')).toBe(20);
    expect(yemekGucu('hosmerim')).toBe(15);
    expect(yemekFiyati('hosmerim')).toBe(15);
  });

  it('bölge çarpanıyla ölçekleniyor', () => {
    expect(yemekGucu('afyon_kaymagi')).toBe(23); // 15 × 1.5 = 22.5
    expect(yemekGucu('adana_kebap')).toBe(66); // 30 × 2.2
    expect(yemekFiyati('adana_kebap')).toBe(44); // 20 × 2.2
    expect(yemekGucu('etli_ekmek')).toBe(90); // 30 × 3
    expect(yemekGucu('rize_cayi')).toBe(60); // 15 × 4
    expect(yemekGucu('urfa_kebabi')).toBe(150); // 30 × 5
    expect(yemekGucu('cag_kebabi')).toBe(180); // 30 × 6
    expect(yemekFiyati('malatya_kayisisi')).toBe(90); // 15 × 6
  });

  it('tüm yemekler için pozitif güç ve fiyat', () => {
    for (const anahtar of Object.keys(yemekler)) {
      expect(yemekGucu(anahtar), anahtar).toBeGreaterThan(0);
      expect(yemekFiyati(anahtar), anahtar).toBeGreaterThan(0);
    }
  });
});
