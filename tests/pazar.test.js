import { describe, it, expect } from 'vitest';
import { esyalar } from '../src/veri/esyalar.js';
import { iller } from '../src/veri/iller.js';
import { bolgeler } from '../src/veri/bolgeler.js';
import { siniflar } from '../src/veri/siniflar.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import {
  AHI_STOK,
  AHI_DONEM_ZAFERI,
  ahiVarMi,
  ahiMallari,
  ahiTumMallari,
  pazarDonemi,
  pazarYenilenmesineKalan,
  esyaAlKontrol,
} from '../src/oyun/ticaret.js';
import {
  TUCCAR,
  tuccarMallari,
  tuccarFiyati,
  tuccarAl,
  tuccarAlKontrol,
  tuccarYerlestir,
  tuccarBelir,
} from '../src/oyun/tuccar.js';
import { ilHaritasiUret, yurunurMu, ulasilabilir, KARO, karo, mesafe, meydandaMi, dusmanlariYurut } from '../src/oyun/gezinti.js';
import { rastgeleUreteci } from '../src/oyun/rastgele.js';

const sabit = (x) => () => x;
const ahiIlleri = iller.filter((il) => ahiVarMi(il.plaka));
const bolgeSira = new Map(bolgeler.map((b) => [b.anahtar, b.sira]));
const durumIle = (sinif, ek = {}) => ({ ...yeniOyunDurumu({ ad: 'A', sinif }), ...ek });

describe('Ahi tezgâhı: dönen mallar', () => {
  it('pazar dönemi zaferlerle ilerler', () => {
    const d = yeniOyunDurumu({ ad: 'A', sinif: 'akinci' });
    const zaferli = (n) => ({ ...d, istatistik: { ...d.istatistik, zafer: n } });
    expect(pazarDonemi(d)).toBe(0);
    expect(pazarDonemi(zaferli(AHI_DONEM_ZAFERI - 1))).toBe(0);
    expect(pazarDonemi(zaferli(AHI_DONEM_ZAFERI))).toBe(1);
    expect(pazarDonemi({ ...d, istatistik: undefined })).toBe(0);
    expect(pazarYenilenmesineKalan(d)).toBe(AHI_DONEM_ZAFERI);
    expect(pazarYenilenmesineKalan(zaferli(AHI_DONEM_ZAFERI - 1))).toBe(1);
  });

  it('tezgâh sabit boyutlu, bölgenin eşyalarından ve tekrarsızdır; efsanevi satılmaz', () => {
    for (const il of ahiIlleri) {
      const tum = ahiTumMallari(il.plaka);
      for (let donem = 0; donem < 12; donem++) {
        const m = ahiMallari(il.plaka, donem);
        expect(m, `${il.ad} ${donem}`).toHaveLength(AHI_STOK);
        expect(new Set(m).size).toBe(m.length);
        for (const a of m) {
          expect(tum).toContain(a);
          expect(esyalar[a].nadirlik).not.toBe('efsanevi');
        }
      }
    }
  });

  it('aynı il ve dönemde hep aynı mallar çıkar', () => {
    for (const il of ahiIlleri) expect(ahiMallari(il.plaka, 3)).toEqual(ahiMallari(il.plaka, 3));
  });

  it('her tezgâhta her sınıf için silah ve bir zırh ya da kuşak vardır', () => {
    for (const il of ahiIlleri) {
      for (let donem = 0; donem < 12; donem++) {
        const m = ahiMallari(il.plaka, donem).map((a) => esyalar[a]);
        for (const sinif of Object.keys(siniflar)) {
          expect(m.some((e) => e.yuva === 'silah' && e.sinif === sinif), `${il.ad} ${sinif} ${donem}`).toBe(true);
        }
        expect(m.some((e) => e.yuva !== 'silah'), `${il.ad} giyim ${donem}`).toBe(true);
      }
    }
  });

  it('dönem değişince tezgâh değişir; aynı bölgedeki dükkânlar da birbirinden farklıdır', () => {
    let degisen = 0;
    for (const il of ahiIlleri) {
      const seri = Array.from({ length: 10 }, (_, d) => ahiMallari(il.plaka, d).join());
      if (new Set(seri).size > 1) degisen++;
    }
    expect(degisen).toBe(ahiIlleri.length); // hiçbir tezgâh hep aynı kalmaz
    // On dönem boyunca bir dükkân bölgenin bütün eşyalarını (sıradan + nadir) sergiler
    const il = ahiIlleri[0];
    const gorulen = new Set(Array.from({ length: 30 }, (_, d) => ahiMallari(il.plaka, d)).flat());
    expect(gorulen.size).toBe(ahiTumMallari(il.plaka).length);
    // Aynı bölgenin iki dükkânı aynı dönemde aynı malları taşımaz (en az bir dönemde ayrışır)
    const bolgedekiler = ahiIlleri.filter((i) => i.bolge === il.bolge);
    expect(bolgedekiler.length).toBeGreaterThan(1);
    const ayrisan = Array.from({ length: 10 }, (_, d) => d)
      .some((d) => ahiMallari(bolgedekiler[0].plaka, d).join() !== ahiMallari(bolgedekiler[1].plaka, d).join());
    expect(ayrisan).toBe(true);
  });

  it('satın alma yalnızca o dönemin tezgâhındaki eşyaya izin verir', () => {
    const d = durumIle('akinci', { akce: 100000, konum: ahiIlleri[0].plaka });
    const tum = ahiTumMallari(d.konum);
    const donem = pazarDonemi(d);
    for (const a of tum) {
      const beklenen = ahiMallari(d.konum, donem).includes(a);
      expect(esyaAlKontrol(d, a).olur, a).toBe(beklenen);
    }
    // Zafer sayısı dönemi değiştirince alınabilen eşyalar da değişir
    let sonra = d;
    const ilkTezgah = ahiMallari(d.konum, donem).join();
    for (let n = 0; n < 40; n++) {
      sonra = { ...sonra, istatistik: { ...sonra.istatistik, zafer: sonra.istatistik.zafer + AHI_DONEM_ZAFERI } };
      if (ahiMallari(d.konum, pazarDonemi(sonra)).join() !== ilkTezgah) break;
    }
    const yeniTezgah = ahiMallari(d.konum, pazarDonemi(sonra));
    expect(yeniTezgah.join()).not.toBe(ilkTezgah);
    for (const a of tum) expect(esyaAlKontrol(sonra, a).olur, a).toBe(yeniTezgah.includes(a));
  });
});

describe('seyyar tüccarın malları', () => {
  it('sınıfa uygun, güçlü mallar satar: bölgenin efsanevi ya da sonraki bölgenin eşyaları', () => {
    for (const il of iller) {
      const sira = bolgeSira.get(il.bolge);
      for (const sinif of Object.keys(siniflar)) {
        for (let tohum = 1; tohum <= 8; tohum++) {
          const m = tuccarMallari(il.plaka, tohum, sinif);
          expect(m, `${il.ad} ${sinif}`).toHaveLength(TUCCAR.stok);
          expect(new Set(m).size).toBe(m.length);
          for (const a of m) {
            const e = esyalar[a];
            expect(!e.sinif || e.sinif === sinif, `${a} sınıfa uygun`).toBe(true);
            const buBolgeninEfsanesi = e.bolge === il.bolge && e.nadirlik === 'efsanevi';
            const ilerisi = bolgeSira.get(e.bolge) === sira + 1 && e.nadirlik !== 'efsanevi';
            const sonBolge = sira === bolgeler.length && e.bolge === il.bolge && e.nadirlik === 'nadir';
            expect(buBolgeninEfsanesi || ilerisi || sonBolge, `${il.ad}: ${a}`).toBe(true);
          }
        }
      }
    }
  });

  it('aynı tohum aynı mallar, farklı tohumlar çeşitli mallar getirir', () => {
    expect(tuccarMallari(34, 42, 'akinci')).toEqual(tuccarMallari(34, 42, 'akinci'));
    const gorulen = new Set();
    for (let tohum = 1; tohum <= 60; tohum++) tuccarMallari(34, tohum, 'kemankes').forEach((a) => gorulen.add(a));
    expect(gorulen.size).toBeGreaterThan(TUCCAR.stok * 2);
    // Sıradan bir Ahi tezgâhından daha güçlü mal getirdiği görülür
    const enGuclu = (liste) => Math.max(...liste.map((a) => esyalar[a].statlar.guc ?? 0));
    expect(enGuclu([...gorulen])).toBeGreaterThan(enGuclu(ahiTumMallari(34)));
    expect([...gorulen].some((a) => esyalar[a].nadirlik === 'efsanevi')).toBe(true);
  });

  it('fiyat Ahi fiyatından yüksektir (yol masrafı)', () => {
    for (const a of Object.keys(esyalar)) expect(tuccarFiyati(a)).toBeGreaterThan(esyalar[a].fiyat);
    expect(tuccarFiyati('edirne_kilici')).toBe(180);
  });

  it('satın alınır; yetersiz akçe, sahip olunan ve tezgâhta olmayan eşya alınamaz', () => {
    const mallar = tuccarMallari(34, 7, 'akinci');
    const [a, b] = mallar;
    const d = durumIle('akinci', { akce: 100000 });
    const s = tuccarAl(d, a, mallar);
    expect(s.akce).toBe(100000 - tuccarFiyati(a));
    expect(s.esyalar).toEqual([a]);
    expect(tuccarAlKontrol(s, a, mallar)).toEqual({ olur: false, neden: 'zaten_var' });
    expect(tuccarAl(s, a, mallar)).toBe(s);
    expect(tuccarAlKontrol({ ...d, akce: tuccarFiyati(b) - 1 }, b, mallar)).toEqual({ olur: false, neden: 'akce_yetersiz' });
    expect(tuccarAlKontrol(d, 'edirne_kilici', mallar)).toEqual({ olur: false, neden: 'satilmiyor' });
    expect(tuccarAl(d, 'edirne_kilici', mallar)).toBe(d);
  });
});

describe('seyyar tüccarın haritada belirmesi', () => {
  const oyuncuIle = (h) => ({ ...h.dogus });

  it('ile girerken bazen bekler; her ilde geçerli, ulaşılabilir bir yerde durur', () => {
    let var_ = 0;
    let toplam = 0;
    for (const il of iller) {
      const h = ilHaritasiUret(il.plaka);
      const oyuncu = { x: h.kapilar[0].ix, y: h.kapilar[0].iy };
      const ulasilan = ulasilabilir(h, h.dogus);
      for (let tohum = 1; tohum <= 12; tohum++) {
        const t = tuccarYerlestir(h, rastgeleUreteci(tohum * 977 + il.plaka), { oyuncu });
        toplam++;
        if (!t) continue;
        var_++;
        expect([KARO.YOL, KARO.CIM], il.ad).toContain(karo(h, t.x, t.y));
        expect(meydandaMi(h, t), il.ad).toBe(false);
        expect(mesafe(t, oyuncu), il.ad).toBeGreaterThanOrEqual(4);
        expect(h.kapilar.every((k) => mesafe(k, t) >= 2), il.ad).toBe(true);
        expect(ulasilan.has(t.y * h.genislik + t.x), `${il.ad} ulaşılabilir`).toBe(true);
        expect(t.omur).toBeGreaterThanOrEqual(TUCCAR.omur[0]);
        expect(t.omur).toBeLessThanOrEqual(TUCCAR.omur[1]);
        expect(Number.isInteger(t.tohum)).toBe(true);
      }
    }
    // Şans, kabaca girişSansı kadardır: ne hiç çıkar ne de hep
    expect(var_ / toplam).toBeGreaterThan(TUCCAR.girisSansi * 0.5);
    expect(var_ / toplam).toBeLessThan(TUCCAR.girisSansi * 1.6);
  });

  it('şans tutmazsa tüccar yoktur; düşmanların yakınına konmaz', () => {
    const h = ilHaritasiUret(34);
    expect(tuccarYerlestir(h, sabit(0.99), { oyuncu: oyuncuIle(h) })).toBeNull();
    const dusman = { x: 3, y: 3 };
    for (let tohum = 1; tohum <= 30; tohum++) {
      const t = tuccarYerlestir(h, rastgeleUreteci(tohum), { oyuncu: oyuncuIle(h), dolu: [dusman] });
      if (t) expect(mesafe(t, dusman)).toBeGreaterThanOrEqual(2);
    }
  });

  it('yürürken bekleme dolunca, meydan dışında, oyuncunun görüş alanında belirir', () => {
    const h = ilHaritasiUret(34);
    // Meydandan uzak, yürünebilir bir nokta
    const oyuncu = { x: h.kapilar[0].ix, y: h.kapilar[0].iy };
    expect(meydandaMi(h, oyuncu)).toBe(false);
    const dene = (ek = {}, rng = sabit(0)) => tuccarBelir(h, { tuccar: null, oyuncu, dolu: [], adim: TUCCAR.bekleme, ...ek }, rng);
    let t = null;
    for (let tohum = 1; tohum <= 40 && !t; tohum++) t = dene({}, (() => {
      const r = rastgeleUreteci(tohum);
      let ilk = true;
      return () => (ilk ? ((ilk = false), 0) : r()); // şans tutar, sonrası rastgele
    })());
    expect(t).not.toBeNull();
    expect(mesafe(t, oyuncu)).toBeGreaterThanOrEqual(3);
    expect(mesafe(t, oyuncu)).toBeLessThanOrEqual(7);
    expect(meydandaMi(h, t)).toBe(false);
    expect(dene({ adim: TUCCAR.bekleme - 1 })).toBeNull(); // bekleme dolmadı
    expect(dene({ tuccar: { x: 1, y: 1 } })).toBeNull(); // haritada zaten var
    expect(dene({ oyuncu: { ...h.dogus } })).toBeNull(); // meydanda belirmez
    expect(dene({}, sabit(0.99))).toBeNull(); // şans tutmadı
  });

  it('yürürken karşılaşma ihtimali gerçekten var (uzun bir yürüyüşte çıkar)', () => {
    const h = ilHaritasiUret(34);
    const oyuncu = { x: h.kapilar[0].ix, y: h.kapilar[0].iy };
    const rng = rastgeleUreteci(2024);
    let karsilasma = 0;
    for (let yuruyus = 0; yuruyus < 100; yuruyus++) {
      for (let adim = 1; adim <= 600; adim++) {
        if (tuccarBelir(h, { tuccar: null, oyuncu, dolu: [], adim }, rng)) {
          karsilasma++;
          break;
        }
      }
    }
    expect(karsilasma).toBeGreaterThan(90); // 600 adımda (≈ %96) neredeyse kesin karşılaşılır
    // Ama kısa bir yürüyüşte de her seferinde değil
    let kisa = 0;
    for (let yuruyus = 0; yuruyus < 200; yuruyus++) {
      for (let adim = 1; adim <= 150; adim++) {
        if (tuccarBelir(h, { tuccar: null, oyuncu, dolu: [], adim }, rng)) {
          kisa++;
          break;
        }
      }
    }
    expect(kisa).toBeGreaterThan(0);
    expect(kisa).toBeLessThan(200);
  });
});

describe('tüccar ve düşmanlar', () => {
  it('düşmanlar tüccarın bulunduğu karoya basmaz', () => {
    const h = ilHaritasiUret(34);
    const oyuncu = { x: h.kapilar[0].ix, y: h.kapilar[0].iy };
    // Düşmanın yanı başındaki yürünebilir karoya tüccar konur; düşman peşinden gelirken o karoyu kullanamaz
    const komsular = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: oyuncu.x + dx, y: oyuncu.y + dy }));
    const bos = komsular.find((p) => yurunurMu(h, p.x, p.y));
    const dusman = { id: 1, dusman: { anahtar: 'ac_kurt', takipci: true }, x: oyuncu.x + 4, y: oyuncu.y, evX: oyuncu.x + 4, evY: oyuncu.y, kovaliyor: true, birikim: 1 };
    let ds = [dusman];
    const tuccar = { x: bos.x, y: bos.y };
    for (let i = 0; i < 8; i++) {
      ds = dusmanlariYurut(h, ds, { x: oyuncu.x, y: oyuncu.y }, sabit(0.9), { engeller: [tuccar] });
      expect(ds[0].x === tuccar.x && ds[0].y === tuccar.y).toBe(false);
    }
  });
});
