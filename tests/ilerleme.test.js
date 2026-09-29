import { describe, it, expect } from 'vitest';
import { bolgeIciMesafeler, ilSeviyeleriniHesapla } from '../src/oyun/ilerleme.js';

// Küçük örnek çizge: A(1) – B(2) – C(3), B – D(4); E(5) başka bölgede ama B'ye komşu.
const iller = [
  { plaka: 1, bolge: 'x', komsular: [2] },
  { plaka: 2, bolge: 'x', komsular: [1, 3, 4, 5] },
  { plaka: 3, bolge: 'x', komsular: [2] },
  { plaka: 4, bolge: 'x', komsular: [2] },
  { plaka: 5, bolge: 'y', komsular: [2] },
];
const bolgeler = [
  { anahtar: 'x', giris: 1, seviye: [1, 10] },
  { anahtar: 'y', giris: 5, seviye: [20, 30] },
];

describe('bolgeIciMesafeler', () => {
  it('giriş ilinden BFS mesafelerini yalnızca bölge içinde hesaplar', () => {
    expect(bolgeIciMesafeler(iller, bolgeler[0])).toEqual({ 1: 0, 2: 1, 3: 2, 4: 2 });
    expect(bolgeIciMesafeler(iller, bolgeler[1])).toEqual({ 5: 0 });
  });
});

describe('ilSeviyeleriniHesapla', () => {
  it('mesafe kademeleriyle bölge aralığını kaplar', () => {
    const s = ilSeviyeleriniHesapla(iller, bolgeler);
    expect(s[1]).toEqual([1, 4]);
    expect(s[2]).toEqual([4, 7]);
    expect(s[3]).toEqual([7, 10]);
    expect(s[4]).toEqual([7, 10]);
    expect(s[5]).toEqual([20, 30]);
  });
});
