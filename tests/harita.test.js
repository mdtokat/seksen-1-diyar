import { describe, it, expect } from 'vitest';
import {
  izdusum,
  OLCEK,
  kapsayanKutu,
  sigdir,
  yakinlastir,
  kaydir,
  sinirla,
} from '../src/arayuz/harita.js';
import { sablon } from '../src/arayuz/bilesenler.js';

describe('izdüşüm', () => {
  it('plandaki formülü uygular', () => {
    const p = izdusum(41.01, 28.98);
    expect(p.x).toBeCloseTo((28.98 - 25.5) * OLCEK * Math.cos((39 * Math.PI) / 180));
    expect(p.y).toBeCloseTo((42.2 - 41.01) * OLCEK);
  });

  it('doğudaki iller sağda, güneydeki iller aşağıda', () => {
    const istanbul = izdusum(41.01, 28.98);
    const van = izdusum(38.5, 43.38);
    const antalya = izdusum(36.89, 30.71);
    expect(van.x).toBeGreaterThan(istanbul.x);
    expect(antalya.y).toBeGreaterThan(istanbul.y);
  });
});

describe('görünüm matematiği', () => {
  const kutu = { minX: 0, minY: 0, maxX: 1000, maxY: 500 };

  it('sigdir kutuyu ekrana sığdırır', () => {
    const g = sigdir(kutu, 500, 500);
    expect(g.s).toBeCloseTo(0.5);
    expect(g.x).toBeCloseTo(0);
    expect(g.y + 250 / g.s).toBeCloseTo(250); // dikeyde ortalı
  });

  it('yakınlaştırmada imlecin altındaki nokta sabit kalır', () => {
    const g = { x: 100, y: 50, s: 1 };
    const y = yakinlastir(g, 200, 100, 2);
    expect(y.s).toBe(2);
    expect(y.x + 200 / y.s).toBeCloseTo(g.x + 200 / g.s);
    expect(y.y + 100 / y.s).toBeCloseTo(g.y + 100 / g.s);
  });

  it('kaydırma piksel farkını dünya koordinatına çevirir', () => {
    expect(kaydir({ x: 0, y: 0, s: 2 }, 20, -10)).toEqual({ x: -10, y: 5, s: 2 });
  });

  it('sinirla ölçeği ve merkezi sınırlar içinde tutar', () => {
    const g = sinirla({ x: 0, y: 0, s: 10 }, 400, 400, kutu, 0.2, 4);
    expect(g.s).toBe(4);
    const uzak = sinirla({ x: 5000, y: -5000, s: 1 }, 400, 400, kutu, 0.2, 4);
    expect(uzak.x + 200).toBeCloseTo(1000);
    expect(uzak.y + 200).toBeCloseTo(0);
  });

  it('kapsayanKutu boşluk ekler', () => {
    expect(kapsayanKutu([{ x: 0, y: 0 }, { x: 10, y: 5 }], 2)).toEqual({ minX: -2, minY: -2, maxX: 12, maxY: 7 });
  });
});

describe('şablon', () => {
  it('yer tutucuları doldurur, bilinmeyenleri bırakır', () => {
    expect(sablon('{hedef}, {konum} ile komşu değil {x}', { hedef: 'Ankara', konum: 'İstanbul' }))
      .toBe('Ankara, İstanbul ile komşu değil {x}');
  });
});
