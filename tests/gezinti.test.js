import { describe, it, expect } from 'vitest';
import {
  GENISLIK,
  YUKSEKLIK,
  KARO,
  ilHaritasiUret,
  ulasilabilir,
  yurunurMu,
  dusmanYurunurMu,
  yolBul,
  girisNoktasi,
  kapiBul,
  meydandaMi,
  etkilesimTuru,
  karo,
  mesafe,
  dusmanSayisi,
  dusmanlariYerlestir,
  dusmanDogur,
  dusmanlariYurut,
  temasEdenDusman,
} from '../src/oyun/gezinti.js';
import { iller } from '../src/veri/iller.js';
import { rastgeleUreteci } from '../src/oyun/rastgele.js';

const ISTANBUL = 34;
const KOCAELI = 41;
const TEKIRDAG = 59;
const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));

describe('il haritası üretimi', () => {
  it('aynı il her seferinde aynı haritayı üretir, farklı iller farklıdır', () => {
    expect(ilHaritasiUret(ISTANBUL)).toEqual(ilHaritasiUret(ISTANBUL));
    expect(ilHaritasiUret(ISTANBUL).karolar).not.toEqual(ilHaritasiUret(KOCAELI).karolar);
  });

  it('81 ilin tamamında: her komşuya bir çıkış, kenarda, tekrarsız ve meydandan erişilebilir', () => {
    for (const il of iller) {
      const h = ilHaritasiUret(il.plaka);
      expect(h.karolar, il.ad).toHaveLength(GENISLIK * YUKSEKLIK);
      expect(h.kapilar.map((k) => k.plaka).sort(), il.ad).toEqual([...il.komsular].sort());
      expect(new Set(h.kapilar.map((k) => `${k.x},${k.y}`)).size, il.ad).toBe(h.kapilar.length);
      const ulasilan = ulasilabilir(h, h.dogus);
      for (const k of h.kapilar) {
        const kenarda = k.x === 0 || k.y === 0 || k.x === GENISLIK - 1 || k.y === YUKSEKLIK - 1;
        expect(kenarda, `${il.ad} → ${k.plaka}`).toBe(true);
        expect(karo(h, k.x, k.y)).toBe(KARO.KAPI);
        expect(ulasilan.has(k.y * GENISLIK + k.x), `${il.ad} → ${k.plaka}`).toBe(true);
      }
    }
  });

  it('meydanda çeşme, tezgâh ve tabela var; doğuş noktası meydanda ve yürünür', () => {
    for (const il of iller) {
      const h = ilHaritasiUret(il.plaka);
      expect(etkilesimTuru(h, h.cesme.x, h.cesme.y), il.ad).toBe('cesme');
      expect(etkilesimTuru(h, h.tezgah.x, h.tezgah.y), il.ad).toBe('tezgah');
      expect(etkilesimTuru(h, h.tabela.x, h.tabela.y), il.ad).toBe('tabela');
      expect(meydandaMi(h, h.dogus), il.ad).toBe(true);
      expect(yurunurMu(h, h.dogus.x, h.dogus.y), il.ad).toBe(true);
    }
  });

  it('yürünebilen her karo meydandan erişilebilir (kapalı cep yok)', () => {
    for (const plaka of [ISTANBUL, 6, 61, 65, 63]) {
      const h = ilHaritasiUret(plaka);
      const ulasilan = ulasilabilir(h, h.dogus);
      for (let y = 0; y < YUKSEKLIK; y++) {
        for (let x = 0; x < GENISLIK; x++) {
          if (yurunurMu(h, x, y)) expect(ulasilan.has(y * GENISLIK + x), `${plaka} ${x},${y}`).toBe(true);
        }
      }
    }
  });

  it('çıkışlar komşunun gerçek yönündedir: İstanbul\'da Kocaeli doğuda, Tekirdağ batıda', () => {
    const h = ilHaritasiUret(ISTANBUL);
    const kocaeli = h.kapilar.find((k) => k.plaka === KOCAELI);
    const tekirdag = h.kapilar.find((k) => k.plaka === TEKIRDAG);
    expect(kocaeli.x).toBe(GENISLIK - 1);
    expect(tekirdag.x).toBe(0);
  });

  it('kıyıdan kıyıya çıkış yönleri genel olarak tutarlıdır', () => {
    // Her komşu için: komşu doğudaysa çıkış haritanın doğu yarısında olmalı (belirgin farklarda)
    for (const il of iller) {
      const h = ilHaritasiUret(il.plaka);
      for (const k of h.kapilar) {
        const komsu = ilHaritasi.get(k.plaka);
        const dogu = (komsu.lon - il.lon) * Math.cos((39 * Math.PI) / 180);
        const guney = il.lat - komsu.lat;
        if (Math.abs(dogu) > 2 * Math.abs(guney)) {
          expect(Math.sign(k.x - (GENISLIK - 1) / 2), `${il.ad} → ${komsu.ad}`).toBe(Math.sign(dogu));
        }
      }
    }
  });
});

describe('yürüme ve yol bulma', () => {
  const h = ilHaritasiUret(ISTANBUL);

  it('meydandan her çıkışa bitişik adımlarla yürünebilir bir yol var', () => {
    for (const k of h.kapilar) {
      const yol = yolBul(h, h.dogus, k);
      expect(yol, String(k.plaka)).not.toBeNull();
      let onceki = h.dogus;
      for (const p of yol) {
        expect(mesafe(onceki, p)).toBe(1);
        expect(yurunurMu(h, p.x, p.y)).toBe(true);
        onceki = p;
      }
      expect(yol.at(-1)).toEqual({ x: k.x, y: k.y });
      expect(kapiBul(h, yol.at(-1)).plaka).toBe(k.plaka);
    }
  });

  it('yürünemeyen hedefe (çeşme) gidilmek istenince yanına kadar yürünür', () => {
    const yol = yolBul(h, { x: 1, y: 15 }, h.cesme);
    expect(yol).not.toBeNull();
    expect(mesafe(yol.at(-1), h.cesme)).toBe(1);
  });

  it('zaten hedefteyken yol boştur, engellerden geçilmez', () => {
    expect(yolBul(h, h.dogus, h.dogus)).toEqual([]);
    const yol = yolBul(h, h.dogus, { x: h.dogus.x, y: h.dogus.y + 2 }, { engeller: [{ x: h.dogus.x, y: h.dogus.y + 1 }] });
    expect(yol.some((p) => p.x === h.dogus.x && p.y === h.dogus.y + 1)).toBe(false);
  });

  it('komşu ilden gelen, o ile giden çıkışın ağzından girer', () => {
    const kocaeli = ilHaritasiUret(KOCAELI);
    const giris = girisNoktasi(kocaeli, ISTANBUL);
    const kapi = kocaeli.kapilar.find((k) => k.plaka === ISTANBUL);
    expect(giris).toEqual({ x: kapi.ix, y: kapi.iy });
    expect(yurunurMu(kocaeli, giris.x, giris.y)).toBe(true);
    expect(girisNoktasi(kocaeli, 6)).toEqual(kocaeli.dogus);
  });
});

describe('haritadaki düşmanlar', () => {
  const h = ilHaritasiUret(ISTANBUL);
  const il = ilHaritasi.get(ISTANBUL);

  it('arınmamış ilde 4, arınmış ilde 2 düşman olur', () => {
    expect(dusmanSayisi(0)).toBe(4);
    expect(dusmanSayisi(99)).toBe(4);
    expect(dusmanSayisi(100)).toBe(2);
    expect(dusmanlariYerlestir(h, 0, rastgeleUreteci(3))).toHaveLength(4);
    expect(dusmanlariYerlestir(h, 100, rastgeleUreteci(3))).toHaveLength(2);
  });

  it('düşmanlar ilin havuzundan, meydandan ve çıkışlardan uzakta, açık alanda belirir', () => {
    for (let t = 1; t <= 30; t++) {
      const ds = dusmanlariYerlestir(h, 0, rastgeleUreteci(t));
      expect(new Set(ds.map((d) => d.id)).size).toBe(ds.length);
      for (const d of ds) {
        expect(il.dusmanlar).toContain(d.dusman.anahtar);
        expect(d.dusman.seviye).toBeGreaterThanOrEqual(il.seviye[0]);
        expect(d.dusman.seviye).toBeLessThanOrEqual(il.seviye[1]);
        expect(dusmanYurunurMu(h, d.x, d.y)).toBe(true);
        expect(meydandaMi(h, d)).toBe(false);
        expect(mesafe(d, h.dogus)).toBeGreaterThanOrEqual(4);
        for (const k of h.kapilar) expect(mesafe(d, k)).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('yeni düşman oyuncudan uzakta belirir', () => {
    const oyuncu = { x: 3, y: 5 };
    for (let t = 1; t <= 20; t++) {
      const d = dusmanDogur(h, ISTANBUL, rastgeleUreteci(t), { oyuncu, enAzUzaklik: 7 });
      expect(mesafe(d, oyuncu)).toBeGreaterThanOrEqual(7);
    }
  });

  it('düşmanlar yürürken meydana ve çıkışlara girmez, üst üste binmez', () => {
    const rng = rastgeleUreteci(9);
    let ds = dusmanlariYerlestir(h, 0, rng);
    let oyuncu = { ...h.dogus };
    for (let adim = 0; adim < 300; adim++) {
      // Oyuncu da rastgele gezinsin
      const yol = yolBul(h, oyuncu, { x: 1 + (adim * 7) % 22, y: 1 + (adim * 11) % 28 });
      if (yol && yol.length) oyuncu = yol[0];
      ds = dusmanlariYurut(h, ds, oyuncu, rng);
      const yerler = new Set();
      for (const d of ds) {
        expect(dusmanYurunurMu(h, d.x, d.y)).toBe(true);
        expect(meydandaMi(h, d)).toBe(false);
        expect(kapiBul(h, d)).toBeUndefined();
        expect(d.x === oyuncu.x && d.y === oyuncu.y).toBe(false);
        yerler.add(`${d.x},${d.y}`);
      }
      expect(yerler.size).toBe(ds.length);
    }
  });

  it('yakındaki oyuncunun peşine düşer; dokunulmaz oyuncunun peşine düşmez', () => {
    const [d] = dusmanlariYerlestir(h, 0, rastgeleUreteci(2));
    const yol = yolBul(h, d, h.dogus);
    const oyuncu = yol[3]; // düşmana 4 adım uzakta, açık alanda
    expect(meydandaMi(h, oyuncu)).toBe(false);
    const once = mesafe(d, oyuncu);
    const [kovalayan] = dusmanlariYurut(h, [d], oyuncu, rastgeleUreteci(1));
    expect(mesafe(kovalayan, oyuncu)).toBe(once - 1);
    const [sakin] = dusmanlariYurut(h, [d], oyuncu, () => 0.99, { dokunulmaz: true });
    expect(sakin).toMatchObject({ x: d.x, y: d.y });
  });

  it('temas: bitişik düşman savaşı başlatır, meydanda temas olmaz', () => {
    const d = { id: 1, x: 5, y: 5 };
    expect(temasEdenDusman(h, [d], { x: 5, y: 6 })).toBe(d);
    expect(temasEdenDusman(h, [d], { x: 5, y: 7 })).toBeNull();
    const kenar = { x: h.meydan.x1, y: h.meydan.y1 };
    expect(temasEdenDusman(h, [{ id: 2, x: kenar.x - 1, y: kenar.y }], kenar)).toBeNull();
  });
});
