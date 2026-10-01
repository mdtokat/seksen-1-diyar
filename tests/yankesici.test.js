import { describe, it, expect, afterEach } from 'vitest';
import { YANKESICI, yankesiciBelir, yankesicileriCek } from '../src/oyun/yankesici.js';
import {
  DAVRANIS,
  ilHaritasiUret,
  dusmanlariYerlestir,
  dusmanlariYurut,
  davranisi,
  siradanDusmanSayisi,
  yolBul,
  dusmanYurunurMu,
  meydandaMi,
  mesafe,
  yankesiciMi,
} from '../src/oyun/gezinti.js';
import { dusmanOlustur, dusmanMenzili } from '../src/oyun/savas.js';
import { zaferUygula, yenilgiUygula, yankesiciCalmasi, ganimetUret, YANKESICI_CALMA, YANKESICI_AKCE_CARPANI } from '../src/oyun/kesif.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import { rotaAyarla, ilSeviyesi } from '../src/oyun/rota.js';
import { dusmanlar } from '../src/veri/dusmanlar.js';
import { DUSMAN_CIZIMLERI, dusmanCizimi } from '../src/arayuz/cizimler/dusmanlar.js';
import { rastgeleUreteci } from '../src/oyun/rastgele.js';

const KOCAELI = 41;
const sabit = (x) => () => x;
const h = ilHaritasiUret(KOCAELI);

// Meydanın dışında, çevresi açık bir yer
function acikYer() {
  for (let y = 2; y < h.yukseklik - 2; y++) {
    for (let x = 2; x < h.genislik - 2; x++) {
      const p = { x, y };
      if (meydandaMi(h, p) || !dusmanYurunurMu(h, x, y)) continue;
      if (mesafe(p, h.dogus) < 8) continue;
      let acik = 0;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (dusmanYurunurMu(h, x + dx, y + dy)) acik++;
      if (acik > 40) return p;
    }
  }
  throw new Error('açık yer yok');
}

afterEach(() => rotaAyarla(null));

describe('yankesici verisi', () => {
  it('her bölgede çıkan insan düşman; yakından vurur, çizimi var', () => {
    const v = dusmanlar.yankesici;
    expect(v).toMatchObject({ tur: 'insan', sinif: 'yankesici' });
    expect(v.bolge).toBeUndefined();
    const d = dusmanOlustur('yankesici', 5);
    expect(dusmanMenzili(d)).toBe(1);
    expect(d.takipci).toBe(false);
    expect(DUSMAN_CIZIMLERI.yankesici).toBeDefined();
    expect(dusmanCizimi('yankesici')).toMatch(/^<svg/);
  });
});

describe('yankesicinin belirmesi', () => {
  const oyuncu = acikYer();

  it('bekleme dolmadan, meydanda ya da haritada yankesici varken çıkmaz', () => {
    const temel = { dusmanlar: [], oyuncu, adim: YANKESICI.bekleme, ilkId: 500 };
    expect(yankesiciBelir(h, { ...temel, adim: YANKESICI.bekleme - 1 }, sabit(0))).toEqual([]);
    expect(yankesiciBelir(h, { ...temel, oyuncu: { ...h.dogus } }, sabit(0))).toEqual([]);
    expect(yankesiciBelir(h, temel, sabit(0.99))).toEqual([]);
    const [var1] = yankesiciBelir(h, temel, sabit(0));
    expect(yankesiciBelir(h, { ...temel, dusmanlar: [var1] }, sabit(0))).toEqual([]);
  });

  it('oyuncunun birkaç karo ötesinde, ilin seviyesinde çıkar ve hemen peşine düşer', () => {
    const rng = rastgeleUreteci(4);
    let ikili = 0;
    let sayi = 0;
    for (let i = 0; i < 300; i++) {
      const cikanlar = yankesiciBelir(h, { dusmanlar: [], oyuncu, adim: 999, ilkId: 500 }, () => (rng() < 0.05 ? 0 : rng()));
      if (!cikanlar.length) continue;
      sayi++;
      if (cikanlar.length === 2) ikili++;
      expect(cikanlar.length).toBeLessThanOrEqual(2);
      for (const d of cikanlar) {
        expect(yankesiciMi(d)).toBe(true);
        expect(d.kovaliyor).toBe(true);
        const u = mesafe(d, oyuncu);
        expect(u).toBeGreaterThanOrEqual(YANKESICI.uzaklik[0]);
        expect(u).toBeLessThanOrEqual(YANKESICI.uzaklik[1]);
        expect(dusmanYurunurMu(h, d.x, d.y)).toBe(true);
        expect(d.dusman.seviye).toBeGreaterThanOrEqual(ilSeviyesi(KOCAELI)[0]);
        expect(d.dusman.seviye).toBeLessThanOrEqual(ilSeviyesi(KOCAELI)[1]);
      }
      if (cikanlar.length === 2) expect(cikanlar[0].x === cikanlar[1].x && cikanlar[0].y === cikanlar[1].y).toBe(false);
    }
    expect(sayi).toBeGreaterThan(5);
    expect(ikili).toBeGreaterThan(0);
  });

  it('gücü rotaya göre değişir', () => {
    rotaAyarla({ bolgeler: ['karadeniz', 'marmara', 'ege', 'akdeniz', 'ic_anadolu', 'dogu_anadolu', 'guneydogu'], baslangic: 69 });
    const [d] = yankesiciBelir(h, { dusmanlar: [], oyuncu, adim: 999, ilkId: 1 }, sabit(0));
    expect(d.dusman.seviye).toBe(ilSeviyesi(KOCAELI)[0]);
    expect(ilSeviyesi(KOCAELI)[0]).toBeGreaterThanOrEqual(8); // Marmara ikinci bölge (klasik rotada 3–6)
  });

  it('peşinden kurtulunca çekip gider; meydana sığınan oyuncuyu bırakır', () => {
    const [d] = yankesiciBelir(h, { dusmanlar: [], oyuncu, adim: 999, ilkId: 1 }, sabit(0));
    expect(davranisi(d)).toBe(DAVRANIS.yankesici);
    const kovalayan = dusmanlariYurut(h, [d], oyuncu, sabit(0.5));
    expect(kovalayan[0].kovaliyor).toBe(true);
    expect(yankesicileriCek(kovalayan).gidenler).toEqual([]);
    const birakan = dusmanlariYurut(h, [d], { ...h.dogus }, sabit(0.5));
    expect(birakan[0].kovaliyor).toBe(false);
    expect(yankesicileriCek(birakan)).toEqual({ dusmanlar: [], gidenler: [birakan[0]] });
  });

  it('ilin yaratık sayısına sayılmaz', () => {
    const yaratiklar = dusmanlariYerlestir(h, 0, rastgeleUreteci(1));
    const [y] = yankesiciBelir(h, { dusmanlar: [], oyuncu, adim: 999, ilkId: 900 }, sabit(0));
    expect(siradanDusmanSayisi([...yaratiklar, y])).toBe(yaratiklar.length);
  });
});

describe('yankesiciyle savaşın sonucu', () => {
  const durum = () => ({ ...yeniOyunDurumu({ ad: 'Alp', sinif: 'akinci' }), akce: 200 });

  it('yenilen yankesici bol akçe bırakır; il arınmaz, yemek çıkmaz', () => {
    const d = durum();
    const r = zaferUygula(d, dusmanOlustur('yankesici', 4), KOCAELI, sabit(0));
    expect(r.ozet.arinmaArtisi).toBe(0);
    expect(r.durum.arinma[KOCAELI] ?? 0).toBe(0);
    expect(r.ozet.yemek).toBeNull();
    expect(r.ozet.akce).toBeGreaterThan(0);
    expect(r.durum.akce).toBe(200 + r.ozet.akce);
    const g = ganimetUret(dusmanOlustur('yankesici', 4), KOCAELI, sabit(0.5));
    const kurt = ganimetUret(dusmanOlustur('ac_kurt', 4), KOCAELI, sabit(0.5));
    expect(g.akce).toBeGreaterThanOrEqual(kurt.akce * YANKESICI_AKCE_CARPANI);
  });

  it('vurduğu yiğit elinden kaçarsa kesesinden akçe aşırır; vuramadıysa eli boş gider', () => {
    const r = yankesiciCalmasi(durum(), 1);
    expect(r.calinan).toBe(Math.round(200 * YANKESICI_CALMA));
    expect(r.durum.akce).toBe(200 - r.calinan);
    expect(yankesiciCalmasi(durum(), 2).calinan).toBe(Math.round(200 * YANKESICI_CALMA * 2));
    const bos = durum();
    expect(yankesiciCalmasi(bos, 0)).toEqual({ durum: bos, calinan: 0 });
    expect(yankesiciCalmasi({ ...bos, akce: 0 }, 1).calinan).toBe(0);
  });

  it('bayılan yiğidin kesesinden de aşırır (bayılma kaybından sonra)', () => {
    const d = { ...durum(), konum: KOCAELI };
    const r = yenilgiUygula(d, KOCAELI, { yankesiciler: 1 });
    expect(r.ozet.akceKaybi).toBe(20);
    expect(r.ozet.calinanAkce).toBe(Math.round(180 * YANKESICI_CALMA));
    expect(r.durum.akce).toBe(180 - r.ozet.calinanAkce);
    expect(yenilgiUygula(d, KOCAELI).ozet.calinanAkce).toBe(0);
  });
});

describe('yaratıkların takip tavrı', () => {
  it('kayıtsız yaratık peşe düşmez, oyuncunun yanı başına da kendiliğinden sokulmaz', () => {
    const oyuncu = acikYer();
    const yer = { x: oyuncu.x + 2, y: oyuncu.y };
    const yol = yolBul(h, yer, oyuncu, { yurur: dusmanYurunurMu });
    expect(yol).not.toBeNull();
    let ds = [{ id: 1, dusman: dusmanOlustur('tas_dev', 3), x: yer.x, y: yer.y, evX: yer.x, evY: yer.y }];
    expect(ds[0].dusman.takip).toBe('kayitsiz');
    const rng = rastgeleUreteci(6);
    for (let i = 0; i < 200; i++) {
      ds = dusmanlariYurut(h, ds, oyuncu, rng);
      expect(ds[0].kovaliyor).toBe(false);
      expect(mesafe(ds[0], oyuncu)).toBeGreaterThan(1);
    }
  });

  it('bekçi yakındaki oyuncuya saldırır ama takipçiden çabuk bırakır', () => {
    expect(dusmanOlustur('boz_ayi', 3).takip).toBe('bekci');
    expect(dusmanOlustur('sis_cini', 3).takip).toBe('takipci');
    expect(davranisi({ dusman: dusmanOlustur('boz_ayi', 3) })).toBe(DAVRANIS.bekci);
    expect(davranisi({ dusman: dusmanOlustur('sis_cini', 3) })).toBe(DAVRANIS.takipci);
    expect(davranisi({ dusman: dusmanOlustur('orman_hortlagi', 3) })).toBe(DAVRANIS.kayitsiz);
    expect(DAVRANIS.kayitsiz.gorus).toBe(0);
    expect(DAVRANIS.bekci.birakma).toBeLessThan(DAVRANIS.takipci.birakma);
  });
});
