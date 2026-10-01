import { describe, it, expect } from 'vitest';
import {
  BEKLEME,
  TOPARLANMA_UZAKLIGI,
  saldirganMi,
  vurabilirMi,
  hedefBul,
  oyuncuVurur,
  dusmanlarVurur,
  dusmanlariToparla,
  atilmaYeri,
} from '../src/oyun/catisma.js';
import { KARO, gorusAcikMi, menzildeMi, dusmanlariYurut, mesafe } from '../src/oyun/gezinti.js';
import { dusmanOlustur, eylemMenzili, TOPLU_HASAR_CARPANI } from '../src/oyun/savas.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import { yeniKarakter, xpEkle, gerekenXp } from '../src/oyun/karakter.js';
import { rastgeleUreteci } from '../src/oyun/rastgele.js';

// 0.99 → kaçınma yok, kritik yok, özel hamle yok · 0 → her şans tutar
const sabit = (x) => () => x;

// Çimenlik açık bir harita; meydan sol üst köşede (0–2), istenen karolara engel konur.
function acikHarita({ genislik = 24, yukseklik = 24, engeller = [], su = [] } = {}) {
  const karolar = new Array(genislik * yukseklik).fill(KARO.CIM);
  for (const p of engeller) karolar[p.y * genislik + p.x] = KARO.AGAC;
  for (const p of su) karolar[p.y * genislik + p.x] = KARO.SU;
  return {
    plaka: 34, bolge: 'marmara', genislik, yukseklik, karolar, kapilar: [],
    meydan: { x1: 0, x2: 2, y1: 0, y2: 2 }, dogus: { x: 1, y: 1 }, in: null,
  };
}

function durum(sinif = 'akinci', seviye = 1) {
  let o = yeniKarakter('A', sinif);
  while (o.seviye < seviye) o = xpEkle(o, gerekenXp(o.seviye)).oyuncu;
  return { ...yeniOyunDurumu({ ad: 'A', sinif }), oyuncu: o };
}

const kayit = (id, x, y, ek = {}, dusman = dusmanOlustur('ac_kurt', 3)) => ({ id, x, y, evX: x, evY: y, dusman, ...ek });

describe('görüş ve menzil', () => {
  it('ağaç, kaya ve ev görüşü kapatır; su ve çimen kapatmaz; iki uç sayılmaz', () => {
    const h = acikHarita({ engeller: [{ x: 10, y: 10 }], su: [{ x: 10, y: 14 }] });
    expect(gorusAcikMi(h, { x: 8, y: 10 }, { x: 12, y: 10 })).toBe(false);
    expect(gorusAcikMi(h, { x: 8, y: 11 }, { x: 12, y: 11 })).toBe(true);
    expect(gorusAcikMi(h, { x: 8, y: 14 }, { x: 12, y: 14 })).toBe(true);
    expect(gorusAcikMi(h, { x: 10, y: 10 }, { x: 13, y: 10 })).toBe(true); // engel başlangıçta
    expect(gorusAcikMi(h, { x: 5, y: 5 }, { x: 5, y: 5 })).toBe(true);
  });

  it('menzil karo yolu uzaklığıyla ölçülür ve görüş ister', () => {
    const h = acikHarita({ engeller: [{ x: 10, y: 10 }] });
    expect(menzildeMi(h, { x: 5, y: 5 }, { x: 8, y: 7 }, 5)).toBe(true);
    expect(menzildeMi(h, { x: 5, y: 5 }, { x: 8, y: 8 }, 5)).toBe(false);
    expect(menzildeMi(h, { x: 9, y: 10 }, { x: 11, y: 10 }, 5)).toBe(false);
    expect(menzildeMi(h, { x: 5, y: 5 }, { x: 5, y: 6 }, 1)).toBe(true);
    expect(menzildeMi(h, { x: 5, y: 5 }, { x: 6, y: 6 }, 1)).toBe(false);
  });
});

describe('oyuncunun hedefi', () => {
  const h = acikHarita();
  const oyuncu = { x: 10, y: 10 };

  it('seçili hedef menzildeyse o; değilse saldıran en yakın düşman; kendi hâlindekiler kendiliğinden seçilmez', () => {
    const secili = kayit(1, 10, 14);
    const saldiran = kayit(2, 12, 10, { kovaliyor: true });
    const yakinSaldiran = kayit(3, 9, 10, { kizgin: true });
    const dolasan = kayit(4, 10, 11);
    const hepsi = [secili, saldiran, yakinSaldiran, dolasan];
    expect(hedefBul(h, oyuncu, hepsi, { menzil: 5, hedefId: 1 })).toBe(secili);
    expect(hedefBul(h, oyuncu, hepsi, { menzil: 1, hedefId: 1 })).toBe(yakinSaldiran);
    expect(hedefBul(h, oyuncu, hepsi, { menzil: 5 })).toBe(yakinSaldiran);
    expect(hedefBul(h, oyuncu, [dolasan], { menzil: 5 })).toBeNull();
    expect(hedefBul(h, oyuncu, [dolasan], { menzil: 5, hedefId: 4 })).toBe(dolasan);
    expect(hedefBul(h, oyuncu, hepsi, { menzil: 5, vurulamaz: (d) => d.id !== 2 })).toBe(saldiran);
    expect(hedefBul(h, oyuncu, hepsi, { menzil: null })).toBeNull();
  });

  it('meydandan vurulmaz', () => {
    expect(hedefBul(h, { x: 2, y: 2 }, [kayit(1, 3, 2, { kovaliyor: true })], { menzil: 5, hedefId: 1 })).toBeNull();
  });

  it('ininde bekleyen boss saldırgandır', () => {
    expect(saldirganMi(kayit(1, 5, 5, { sabit: true }))).toBe(true);
    expect(saldirganMi(kayit(1, 5, 5))).toBe(false);
  });
});

describe('oyuncu vurur', () => {
  it('vurulan düşman kızar ve peşe düşer; düşen haritadan kalkar', () => {
    const d = durum();
    const kurt = kayit(1, 5, 6);
    const r = oyuncuVurur(d, [kurt, kayit(2, 9, 9)], { tur: 'saldir' }, sabit(0.99), { hedef: kurt });
    expect(r.dusmanlar[0]).toMatchObject({ id: 1, kizgin: true, kovaliyor: true });
    expect(r.dusmanlar[0].dusman.can).toBeLessThan(kurt.dusman.can);
    expect(r.dusenler).toEqual([]);
    const zayif = { ...kurt, dusman: { ...kurt.dusman, can: 1 } };
    const z = oyuncuVurur(d, [zayif, kayit(2, 9, 9)], { tur: 'saldir' }, sabit(0.99), { hedef: zayif });
    expect(z.dusenler).toMatchObject([{ id: 1, dusman: { can: 0 } }]);
    expect(z.dusmanlar.map((x) => x.id)).toEqual([2]);
  });

  it('ıskalasa da düşman kızar; ininden ayrılmayan boss kovalamaz', () => {
    const kurt = kayit(1, 5, 6);
    expect(oyuncuVurur(durum(), [kurt], { tur: 'saldir' }, sabit(0), { hedef: kurt }).dusmanlar[0]).toMatchObject({ kizgin: true });
    const boss = kayit(1, 5, 6, { sabit: true }, dusmanOlustur('bogaz_ejderi', 10));
    expect(oyuncuVurur(durum(), [boss], { tur: 'saldir' }, sabit(0.99), { hedef: boss }).dusmanlar[0]).toMatchObject({ kizgin: true, kovaliyor: false });
  });

  it('hedefsiz hamlelerde (yemek, şifa) düşmanlara dokunulmaz', () => {
    const d = { ...durum(), oyuncu: { ...durum().oyuncu, can: 30 } };
    const dusmanlar = [kayit(1, 5, 6)];
    const r = oyuncuVurur(d, dusmanlar, { tur: 'yemek', anahtar: d.heybe[0].anahtar }, sabit(0.99));
    expect(r.dusmanlar).toBe(dusmanlar);
    expect(r.durum.oyuncu.can).toBeGreaterThan(30);
  });
});

describe('düşmanlar vurur', () => {
  const h = acikHarita();
  const oyuncu = { x: 10, y: 10 };

  // Belli sayıda tık oynatır; her tıkta olan vuruşların sayısını döndürür.
  function tiklar(n, dusmanlar, { d = durum('akinci', 10), ...secenek } = {}) {
    const vuruslar = [];
    let ds = dusmanlar;
    let dd = d;
    for (let i = 0; i < n; i++) {
      const r = dusmanlarVurur(h, dd, ds, oyuncu, sabit(0.99), secenek);
      ds = r.dusmanlar;
      dd = r.durum;
      vuruslar.push(r.olaylar.length);
    }
    return { vuruslar, dusmanlar: ds, durum: dd };
  }

  it('menzile giren düşman önce kısa bir an hazırlanır, sonra bekleme aralığıyla vurur', () => {
    const { vuruslar, dusmanlar } = tiklar(16, [kayit(1, 10, 11, { kovaliyor: true })]);
    expect(vuruslar.indexOf(1)).toBe(BEKLEME.hazirlik - 1);
    const anlar = vuruslar.flatMap((v, i) => (v ? [i] : []));
    expect(anlar[1] - anlar[0]).toBe(BEKLEME.dusman);
    expect(dusmanlar[0].vurdu).toBe(true);
  });

  it('uzaktan vuranlar menzilinden vurur; yakından vuranlar bitişik olmalı', () => {
    const cin = kayit(1, 10, 13, { kovaliyor: true }, dusmanOlustur('yol_kesen_cin', 3));
    const kurt = kayit(2, 13, 10, { kovaliyor: true });
    expect(vurabilirMi(h, cin, oyuncu)).toBe(true);
    expect(vurabilirMi(h, kurt, oyuncu)).toBe(false);
    const { vuruslar, dusmanlar } = tiklar(3, [cin, kurt]);
    expect(vuruslar.reduce((a, b) => a + b)).toBe(1);
    expect(dusmanlar[1].bekleme).toBeGreaterThanOrEqual(BEKLEME.hazirlik);
  });

  it('kendi hâlinde dolaşan, mühürlü ya da güvendeki oyuncuya vurulmaz', () => {
    const dolasan = kayit(1, 10, 11);
    const peste = kayit(2, 11, 10, { kovaliyor: true });
    expect(tiklar(8, [dolasan]).vuruslar.every((v) => v === 0)).toBe(true);
    expect(tiklar(8, [peste], { guvende: true }).vuruslar.every((v) => v === 0)).toBe(true);
    expect(tiklar(8, [peste], { vurmaz: () => true }).vuruslar.every((v) => v === 0)).toBe(true);
  });

  it('kalabalıkta her düşmanın vuruşu, o an vurabilenlerin sayısı kadar zayıflar', () => {
    const d = durum('akinci', 5);
    const tek = dusmanlarVurur(h, d, [kayit(1, 10, 11, { kovaliyor: true, bekleme: 1 })], oyuncu, sabit(0.99));
    const ikili = dusmanlarVurur(h, d, [
      kayit(1, 10, 11, { kovaliyor: true, bekleme: 1 }),
      kayit(2, 11, 10, { kovaliyor: true, bekleme: 9 }),
    ], oyuncu, sabit(0.99));
    expect(ikili.olaylar).toHaveLength(1);
    expect(ikili.olaylar[0].olay.hasar).toBeLessThan(tek.olaylar[0].olay.hasar);
    expect(TOPLU_HASAR_CARPANI[2]).toBeLessThan(1);
  });

  it('oyuncu bayılınca kalanlar vurmaz', () => {
    const d = { ...durum(), oyuncu: { ...durum().oyuncu, can: 1 } };
    const guclu = { ...dusmanOlustur('ac_kurt', 3), guc: 999 };
    const r = dusmanlarVurur(h, d, [
      kayit(1, 10, 11, { kovaliyor: true, bekleme: 1 }, guclu),
      kayit(2, 11, 10, { kovaliyor: true, bekleme: 1 }, guclu),
    ], oyuncu, sabit(0.99));
    expect(r.bayildi).toBe(true);
    expect(r.olaylar).toHaveLength(1);
    expect(r.durum.oyuncu.can).toBe(0);
  });
});

describe('haritada düşman davranışı', () => {
  const h = acikHarita();

  it('uzaktan vuran düşman menziline girince durur; yakından vuran yaklaşır', () => {
    const oyuncu = { x: 10, y: 10 };
    const cin = kayit(1, 10, 13, { kovaliyor: true }, dusmanOlustur('yol_kesen_cin', 3));
    const kurt = kayit(2, 14, 10, { kovaliyor: true, birikim: 1 });
    const [c, k] = dusmanlariYurut(h, [cin, kurt], oyuncu, sabit(0.5));
    expect({ x: c.x, y: c.y }).toEqual({ x: 10, y: 13 });
    expect(mesafe(k, oyuncu)).toBeLessThan(4);
  });

  it('vurulan kayıtsız yaratık kızar ve peşe düşer; uzaklaşınca kızgınlığı geçer', () => {
    const tasDev = dusmanOlustur('tas_dev', 5);
    expect(tasDev.takip).toBe('kayitsiz');
    let ds = [kayit(1, 14, 10, { kizgin: true }, tasDev)];
    for (let i = 0; i < 6; i++) ds = dusmanlariYurut(h, ds, { x: 10, y: 10 }, sabit(0.5));
    expect(ds[0].kovaliyor).toBe(true);
    expect(mesafe(ds[0], { x: 10, y: 10 })).toBeLessThan(4);
    ds = dusmanlariYurut(h, ds, { x: 0, y: 23 }, sabit(0.5));
    expect(ds[0]).toMatchObject({ kovaliyor: false, kizgin: false });
    // Kızmayan kayıtsız yaratık oyuncunun yanından geçse de peşe düşmez
    const sakin = dusmanlariYurut(h, [kayit(1, 11, 10, {}, tasDev)], { x: 10, y: 10 }, sabit(0.5));
    expect(sakin[0].kovaliyor).toBeFalsy();
  });

  it('savaştan uzak, peşinde olmayan yaralı düşmanlar toparlanır', () => {
    const yarali = (x, ek = {}) => kayit(1, x, 10, ek, { ...dusmanOlustur('ac_kurt', 3), can: 5 });
    const oyuncu = { x: 0, y: 10 };
    const uzak = dusmanlariToparla([yarali(TOPARLANMA_UZAKLIGI + 1, { kizgin: true })], oyuncu);
    expect(uzak[0].dusman.can).toBe(uzak[0].dusman.canEnCok);
    expect(uzak[0].kizgin).toBe(false);
    const yakin = [yarali(TOPARLANMA_UZAKLIGI)];
    expect(dusmanlariToparla(yakin, oyuncu)).toBe(yakin);
    const peste = [yarali(20, { kovaliyor: true })];
    expect(dusmanlariToparla(peste, oyuncu)).toBe(peste);
  });
});

describe('Akın Hamlesi: atılma', () => {
  it('yiğit menzil içindeki hedefin yanına atılır; uzaktaysa ya da yol kapalıysa atılmaz', () => {
    const h = acikHarita();
    expect(atilmaYeri(h, { x: 10, y: 10 }, { x: 13, y: 10 }, 3)).toEqual({ x: 12, y: 10 });
    expect(atilmaYeri(h, { x: 10, y: 10 }, { x: 15, y: 10 }, 3)).toBeNull();
    expect(atilmaYeri(h, { x: 10, y: 10 }, { x: 11, y: 10 }, 3)).toBeNull();
    const kapali = acikHarita({ engeller: [{ x: 11, y: 10 }, { x: 12, y: 9 }, { x: 12, y: 11 }, { x: 13, y: 9 }, { x: 13, y: 11 }, { x: 14, y: 10 }] });
    expect(atilmaYeri(kapali, { x: 10, y: 10 }, { x: 13, y: 10 }, 3)).toBeNull();
  });
});

describe('sınıfa göre çatışma (simülasyon)', () => {
  // Açık arazide yiğit durur; peşine düşmüş bir Aç Kurt `uzaklik` karo öteden üstüne gelir.
  // Her tık: düşmanlar yürür ve vurur, ardından beklemesi dolan yiğit menzilindeki hedefe vurur.
  function karsilasma(sinif, tohum, uzaklik = 6) {
    const h = acikHarita({ genislik: 30, yukseklik: 30 });
    const rng = rastgeleUreteci(tohum);
    const oyuncu = { x: 15, y: 15 };
    let d = durum(sinif);
    let ds = [kayit(1, 15 + uzaklik, 15, { kovaliyor: true }, dusmanOlustur('ac_kurt', 1))];
    let bekleme = 0;
    let ilkIsabettenOnce = 0;
    let isabetAldi = false;
    for (let tik = 0; tik < 200; tik++) {
      ds = dusmanlariYurut(h, ds, oyuncu, rng);
      const v = dusmanlarVurur(h, d, ds, oyuncu, rng);
      ds = v.dusmanlar;
      d = v.durum;
      if (v.olaylar.some((o) => o.olay.hasar > 0)) isabetAldi = true;
      if (v.bayildi) return { kazandi: false, ilkIsabettenOnce };
      if (bekleme > 0) bekleme--;
      const hedef = hedefBul(h, oyuncu, ds, { menzil: eylemMenzili(sinif, { tur: 'saldir' }) });
      if (bekleme === 0 && hedef) {
        const r = oyuncuVurur(d, ds, { tur: 'saldir' }, rng, { hedef });
        d = r.durum;
        ds = r.dusmanlar;
        bekleme = BEKLEME.oyuncu;
        if (!isabetAldi) ilkIsabettenOnce++;
        if (r.dusenler.length) return { kazandi: true, ilkIsabettenOnce, can: d.oyuncu.can };
      }
    }
    return { kazandi: false, ilkIsabettenOnce };
  }

  it('üç sınıf da Sv 1 Aç Kurt\'u yener', () => {
    for (const sinif of ['akinci', 'alperen', 'kemankes']) {
      for (let t = 1; t <= 30; t++) expect(karsilasma(sinif, t).kazandi, `${sinif} ${t}`).toBe(true);
    }
  });

  it('Kemankeş kurt yanına varmadan ok atar; Akıncı ancak yakından vurur', () => {
    let kemankes = 0;
    let akinci = 0;
    for (let t = 1; t <= 30; t++) {
      kemankes += karsilasma('kemankes', t).ilkIsabettenOnce;
      akinci += karsilasma('akinci', t).ilkIsabettenOnce;
    }
    expect(kemankes / 30).toBeGreaterThanOrEqual(1);
    expect(kemankes).toBeGreaterThan(akinci);
  });
});

describe('alan vuruşları ve sersemletme', () => {
  const h = acikHarita();
  const ayi = (id, x, y, ek = {}) => kayit(id, x, y, ek, dusmanOlustur('boz_ayi', 12));
  const yetenek = (anahtar) => ({ tur: 'yetenek', anahtar });

  it('Ok Yağmuru hedefin bir karo çevresindekilere de iner; olaylar düşmanın kimliğini taşır', () => {
    const hedef = ayi(1, 10, 10);
    const yan = ayi(2, 11, 10);
    const alt = ayi(3, 10, 11, { dusman: { ...dusmanOlustur('boz_ayi', 12), can: 1 } });
    const uzak = ayi(4, 12, 10);
    const r = oyuncuVurur(durum('kemankes', 12), [hedef, yan, alt, uzak], yetenek('ok_yagmuru'), sabit(0.99), { hedef, oyuncu: { x: 5, y: 10 } });
    expect(new Set(r.olaylar.filter((o) => o.hasar !== undefined).map((o) => o.id))).toEqual(new Set([1, 2, 3]));
    expect(r.olaylar.every((o) => o.ek === undefined)).toBe(true);
    expect(r.dusmanlar.find((d) => d.id === 2)).toMatchObject({ kizgin: true, kovaliyor: true });
    expect(r.dusmanlar.find((d) => d.id === 2).dusman.can).toBeLessThan(yan.dusman.can);
    expect(r.dusmanlar.find((d) => d.id === 4)).toBe(uzak);
    expect(r.dusenler.map((d) => d.id)).toEqual([3]);
    expect(r.dusmanlar.map((d) => d.id)).toEqual([1, 2, 4]);
  });

  it('alanda olsa da vurulamayan düşmana (mühürlü boss) inmez', () => {
    const hedef = ayi(1, 10, 10);
    const muhurlu = ayi(2, 11, 10);
    const r = oyuncuVurur(durum('kemankes', 12), [hedef, muhurlu], yetenek('ok_yagmuru'), sabit(0.99), {
      hedef, vurulamaz: (d) => d.id === 2,
    });
    expect(r.dusmanlar[1]).toBe(muhurlu);
  });

  it('bir alan vuruşu birden çok düşmanı düşürebilir', () => {
    const zayif = (id, x, y) => ayi(id, x, y, { dusman: { ...dusmanOlustur('boz_ayi', 12), can: 1 } });
    const r = oyuncuVurur(durum('kemankes', 12), [zayif(1, 10, 10), zayif(2, 11, 10), zayif(3, 9, 10)], yetenek('ok_yagmuru'), sabit(0.99), { hedef: zayif(1, 10, 10) });
    expect(r.dusenler.map((d) => d.id).sort()).toEqual([1, 2, 3]);
    expect(r.dusmanlar).toEqual([]);
  });

  it('Tufan Kılıcı yiğidin yanı başındaki düşmanlara iner, hedefin ötesindekine inmez', () => {
    const oyuncu = { x: 10, y: 10 };
    const hedef = ayi(1, 11, 10);
    const sol = ayi(2, 9, 10);
    const ust = ayi(3, 10, 9);
    const oteki = ayi(4, 12, 10);
    const r = oyuncuVurur(durum('akinci', 32), [hedef, sol, ust, oteki], yetenek('tufan_kilici'), sabit(0.99), { hedef, oyuncu });
    const vurulanlar = new Set(r.olaylar.filter((o) => o.hasar !== undefined).map((o) => o.id));
    expect(vurulanlar).toEqual(new Set([1, 2, 3]));
    expect(r.dusmanlar.find((d) => d.id === 4)).toBe(oteki);
  });

  it('Akın Hamlesi vurduğu düşmanı sersemletir', () => {
    const hedef = ayi(1, 12, 10);
    const r = oyuncuVurur(durum('akinci', 12), [hedef], yetenek('akin_hamlesi'), sabit(0.99), { hedef, oyuncu: { x: 10, y: 10 } });
    expect(r.dusmanlar[0].sersem).toBe(6);
    expect(r.olaylar[0]).toMatchObject({ id: 1, sersem: 6 });
  });

  it('Yiğit Nârası iki karo çevredeki düşmanları sersemletir (boss yarı süre); uzaktakine dokunmaz', () => {
    const oyuncu = { x: 10, y: 10 };
    const yakin = ayi(1, 11, 11);
    const boss = kayit(2, 9, 10, { sabit: true }, dusmanOlustur('bogaz_ejderi', 20));
    const uzak = ayi(3, 14, 10);
    const r = oyuncuVurur(durum('akinci', 20), [yakin, boss, uzak], yetenek('yigit_narasi'), sabit(0.99), { oyuncu });
    expect(r.dusmanlar.map((d) => d.sersem)).toEqual([4, 2, undefined]);
    expect(r.dusmanlar[2]).toBe(uzak);
    expect(r.olaylar.filter((o) => o.tip === 'sersem').map((o) => o.id)).toEqual([1, 2]);
    expect(r.etkiler).toEqual([{ etki: 'guclenme', deger: 0.3, kalan: 3 }]);
    expect(r.dusmanlar[0].kizgin).toBeUndefined();
  });

  it('sersemleyen düşman vurmaz, yürümez; sersemliği geçince önce hazırlanır', () => {
    const oyuncu = { x: 10, y: 10 };
    let ds = [kayit(1, 10, 11, { kovaliyor: true, bekleme: 0, sersem: 2 })];
    const d = durum('akinci', 10);
    const anlar = [];
    for (let i = 0; i < 6; i++) {
      const r = dusmanlarVurur(h, d, ds, oyuncu, sabit(0.99));
      ds = r.dusmanlar;
      if (r.olaylar.length) anlar.push(i);
    }
    expect(anlar[0]).toBe(2 + BEKLEME.hazirlik - 1);
    expect(ds[0].sersem).toBe(0);

    const kurt = kayit(1, 14, 10, { kovaliyor: true, birikim: 1, sersem: 3 });
    const [k] = dusmanlariYurut(h, [kurt], oyuncu, sabit(0.5));
    expect({ x: k.x, y: k.y }).toEqual({ x: 14, y: 10 });
  });
});
