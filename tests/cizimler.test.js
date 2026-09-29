import { describe, it, expect } from 'vitest';
import { sinifCizimi, SINIF_CIZIMLERI } from '../src/arayuz/cizimler/karakterler.js';
import { dusmanCizimi, DUSMAN_CIZIMLERI } from '../src/arayuz/cizimler/dusmanlar.js';
import { bolgeArkaPlani, ARKA_PLAN_BOLGELERI } from '../src/arayuz/cizimler/arkaplanlar.js';
import { ilSinirlari } from '../src/veri/ilSinirlari.js';
import { izdusum } from '../src/arayuz/harita.js';
import { siniflar } from '../src/veri/siniflar.js';
import { dusmanlar } from '../src/veri/dusmanlar.js';
import { bolgeler } from '../src/veri/bolgeler.js';
import { iller } from '../src/veri/iller.js';

const EMOJI = /\p{Extended_Pictographic}/u;

describe('savaşçı çizimleri', () => {
  it('her sınıfın emojisiz bir SVG çizimi var', () => {
    expect([...SINIF_CIZIMLERI].sort()).toEqual(Object.keys(siniflar).sort());
    for (const s of Object.keys(siniflar)) {
      const svg = sinifCizimi(s);
      expect(svg, s).toMatch(/^<svg[^>]*viewBox="0 0 120 120"/);
      expect(svg, s).not.toMatch(EMOJI);
      expect(svg, s).not.toMatch(/undefined|NaN/);
    }
  });

  it('her düşmanın (bosslar ve Zülmet dahil) emojisiz bir SVG çizimi var', () => {
    expect(Object.keys(DUSMAN_CIZIMLERI).sort()).toEqual(Object.keys(dusmanlar).sort());
    for (const a of Object.keys(dusmanlar)) {
      const svg = dusmanCizimi(a);
      expect(svg, a).toMatch(/^<svg/);
      expect(svg, a).not.toMatch(EMOJI);
      expect(svg, a).not.toMatch(/undefined|NaN/);
    }
  });

  it('bölge bossları ve Zülmet sihir halesiyle çizilir, sıradan düşmanlar çizilmez', () => {
    const haleVar = (a) => dusmanCizimi(a).includes('stroke-dasharray="3 6"');
    for (const [a, d] of Object.entries(dusmanlar)) {
      expect(haleVar(a), a).toBe(d.tur === 'boss');
    }
  });

  it('erişilebilirlik etiketi verilince çizim ekran okuyucuya adıyla sunulur', () => {
    expect(dusmanCizimi('ac_kurt', { etiket: 'Aç Kurt' })).toContain('role="img" aria-label="Aç Kurt"');
    expect(sinifCizimi('akinci')).toContain('aria-hidden="true"');
  });
});

describe('bölge arka planları', () => {
  it('her bölgenin bir arka planı var', () => {
    expect([...ARKA_PLAN_BOLGELERI].sort()).toEqual(bolgeler.map((b) => b.anahtar).sort());
    for (const b of bolgeler) {
      const svg = bolgeArkaPlani(b.anahtar);
      expect(svg, b.ad).toMatch(/^<svg class="arka-plan"/);
      expect(svg, b.ad).toContain(`gok-${b.anahtar}`);
      expect(svg, b.ad).not.toMatch(/undefined|NaN/);
    }
  });
});

// "M x y l dx dy dx dy …z" biçimindeki yolları çokgenlere çevirir.
function cokgenler(d) {
  return d.split('z').filter(Boolean).map((parca) => {
    const [bas, goreli] = parca.slice(1).split('l');
    const [x0, y0] = bas.trim().split(/\s+/).map(Number);
    const sayilar = goreli.match(/-?\d*\.?\d+/g).map(Number);
    const noktalar = [[x0, y0]];
    for (let i = 0; i < sayilar.length; i += 2) {
      const [px, py] = noktalar.at(-1);
      noktalar.push([px + sayilar[i], py + sayilar[i + 1]]);
    }
    return noktalar;
  });
}

function icindeMi([x, y], cokgen) {
  let ic = false;
  for (let i = 0, j = cokgen.length - 1; i < cokgen.length; j = i++) {
    const [xi, yi] = cokgen[i];
    const [xj, yj] = cokgen[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ic = !ic;
  }
  return ic;
}

describe('il sınırları (OpenStreetMap)', () => {
  it('81 ilin tamamı için sınır var ve plakalar eşleşiyor', () => {
    const plakalar = Object.keys(ilSinirlari).map(Number).sort((a, b) => a - b);
    expect(plakalar).toEqual(iller.map((il) => il.plaka).sort((a, b) => a - b));
    for (const [plaka, d] of Object.entries(ilSinirlari)) {
      expect(d, plaka).toMatch(/^M[\d.]+ [\d.]+l/);
      expect(d.endsWith('z'), plaka).toBe(true);
    }
  });

  // Kıyıdaki bazı şehir merkezleri (Sinop, Yalova) sadeleştirilmiş kıyı çizgisinin
  // birkaç km dışına düşer; bu yüzden kendi iline 5 birimden (≈5 km) yakınlık yeterlidir.
  // Asıl denetim: hiçbir ilin merkezi başka bir ilin içinde değildir (plaka kayması olmaz).
  const KIYI_PAYI = 5;

  it('her ilin merkezi kendi il sınırında, başka bir ilin içinde değil', () => {
    const sekiller = new Map(iller.map((il) => [il.plaka, cokgenler(ilSinirlari[il.plaka])]));
    const uzaklik = ([x, y], cs) =>
      Math.min(...cs.flatMap((c) => c.map(([px, py]) => Math.hypot(px - x, py - y))));
    let icerde = 0;
    for (const il of iller) {
      const { x, y } = izdusum(il.lat, il.lon);
      const kendi = sekiller.get(il.plaka);
      if (kendi.some((c) => icindeMi([x, y], c))) icerde++;
      else expect(uzaklik([x, y], kendi), il.ad).toBeLessThan(KIYI_PAYI);
      for (const [plaka, cs] of sekiller) {
        if (plaka !== il.plaka) expect(cs.some((c) => icindeMi([x, y], c)), `${il.ad} → ${plaka}`).toBe(false);
      }
    }
    expect(icerde).toBeGreaterThanOrEqual(79);
  });
});
