import { describe, it, expect } from 'vitest';
import { TOPLU_HASAR_CARPANI, EN_COK_SALDIRGAN, dusmanOlustur } from '../src/oyun/savas.js';
import { dusmanlarVurur } from '../src/oyun/catisma.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import { yeniKarakter, xpEkle, gerekenXp } from '../src/oyun/karakter.js';
import { dusmanlar as dusmanVerisi } from '../src/veri/dusmanlar.js';
import { iller } from '../src/veri/iller.js';
import { SURU, ilHaritasiUret, dusmanlariYerlestir, dusmanSayisi, suruUyeleri, mesafe } from '../src/oyun/gezinti.js';
import { rastgeleUreteci } from '../src/oyun/rastgele.js';

// 0.99 → kaçınma yok, kritik yok, özel hamle yok, rnd ≈ 1.098 · 0 → her şans tutar
const sabit = (x) => () => x;

const kurt = (seviye = 3) => dusmanOlustur('ac_kurt', seviye);

function durum(sinif = 'akinci', seviye = 5) {
  let o = yeniKarakter('A', sinif);
  while (o.seviye < seviye) o = xpEkle(o, gerekenXp(o.seviye)).oyuncu;
  return { ...yeniOyunDurumu({ ad: 'A', sinif }), oyuncu: o };
}

describe('aynı anda birden fazla yaratık', () => {
  // İstanbul haritasında, meydandan uzaktaki inin karosu ve çevresindeki dört karo
  const h = ilHaritasiUret(34);
  const oyuncu = { x: h.in.x, y: h.in.y };
  const yanlar = [[0, 1], [1, 0], [0, -1], [-1, 0]].map(([dx, dy]) => ({ x: oyuncu.x + dx, y: oyuncu.y + dy }));
  const kayit = (id, p) => ({ id, ...p, evX: p.x, evY: p.y, dusman: kurt(12), kovaliyor: true, bekleme: 1 });

  it('kalabalıkta her yaratık vurur ama vuruşu, vuranların sayısı kadar zayıflar', () => {
    const d = durum();
    const vur = (n) => dusmanlarVurur(h, d, yanlar.slice(0, n).map((p, i) => kayit(i + 1, p)), oyuncu, sabit(0.99));
    const tek = vur(1);
    const uclu = vur(3);
    expect(uclu.olaylar).toHaveLength(3);
    for (const { olay } of uclu.olaylar) expect(olay.hasar).toBeLessThanOrEqual(tek.olaylar[0].olay.hasar);
    // Üçten fazlası en kalabalık çarpanla vurur
    const dortlu = vur(4);
    expect(dortlu.olaylar).toHaveLength(4);
    expect(TOPLU_HASAR_CARPANI[EN_COK_SALDIRGAN]).toBeLessThan(TOPLU_HASAR_CARPANI[2]);
  });
});

describe('sürüler', () => {
  it('yalnız takipçiler sürü hâlinde doğar: aynı tür, öncünün 1–2 karo yakınında, benzersiz karolarda', () => {
    const h = ilHaritasiUret(34);
    let suruSayisi = 0;
    let deneme = 0;
    for (let t = 1; t <= 120; t++) {
      const rng = rastgeleUreteci(t);
      const onc = { id: 1, dusman: kurt(), x: 8, y: 8, evX: 8, evY: 8 };
      // Doğuş noktası olan bir karo bul
      const nokta = ilHaritasiUret(34);
      expect(nokta.plaka).toBe(34);
      const dogus = dusmanlariYerlestir(h, 0, rastgeleUreteci(t))[0];
      const lider = { ...onc, x: dogus.x, y: dogus.y, evX: dogus.x, evY: dogus.y };
      const uyeler = suruUyeleri(h, lider, rng, { ilkId: 10 });
      deneme++;
      if (!uyeler.length) continue;
      suruSayisi++;
      expect(uyeler.length).toBeLessThanOrEqual(2);
      const konumlar = new Set([`${lider.x},${lider.y}`]);
      for (const u of uyeler) {
        expect(u.dusman.anahtar).toBe('ac_kurt');
        expect(mesafe(u, lider)).toBeGreaterThanOrEqual(1);
        expect(mesafe(u, lider)).toBeLessThanOrEqual(2);
        expect(konumlar.has(`${u.x},${u.y}`)).toBe(false);
        konumlar.add(`${u.x},${u.y}`);
      }
      expect(new Set(uyeler.map((u) => u.id)).size).toBe(uyeler.length);
    }
    expect(suruSayisi / deneme).toBeGreaterThan(SURU.sansi * 0.6);
    expect(suruSayisi / deneme).toBeLessThan(SURU.sansi * 1.4);
    // Takipçi olmayan, boss ve gezgin öncü sürü getirmez
    const sabit0 = sabit(0);
    const takipsiz = Object.keys(dusmanVerisi).find((a) => dusmanVerisi[a].takip !== 'takipci' && dusmanVerisi[a].sinif === 'siradan');
    const lider = { id: 1, x: 8, y: 8, dusman: dusmanOlustur(takipsiz, 3) };
    expect(suruUyeleri(h, lider, sabit0)).toEqual([]);
    expect(suruUyeleri(h, { ...lider, dusman: kurt(), sabit: true }, sabit0)).toEqual([]);
    expect(suruUyeleri(h, { ...lider, dusman: { ...kurt(), gezgin: true } }, sabit0)).toEqual([]);
  });

  it('düşman yerleşiminde sürü üyeleri toplam sayıdan sayılır; sürüler gerçekten çıkar', () => {
    let suruluIl = 0;
    for (const il of iller) {
      const h = ilHaritasiUret(il.plaka);
      for (const arinma of [0, 100]) {
        for (let t = 1; t <= 3; t++) {
          const d = dusmanlariYerlestir(h, arinma, rastgeleUreteci(t * 7 + il.plaka));
          expect(d.length, il.ad).toBeLessThanOrEqual(dusmanSayisi(arinma, h));
          expect(new Set(d.map((x) => x.id)).size, il.ad).toBe(d.length);
          expect(new Set(d.map((x) => `${x.x},${x.y}`)).size, il.ad).toBe(d.length);
          if (d.some((a) => d.some((b) => a !== b && a.dusman.anahtar === b.dusman.anahtar && mesafe(a, b) <= 2))) suruluIl++;
        }
      }
    }
    expect(suruluIl).toBeGreaterThan(0);
  });
});
