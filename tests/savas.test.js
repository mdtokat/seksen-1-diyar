import { describe, it, expect } from 'vitest';
import {
  hasarHesapla,
  kritikSansi,
  kritikCarpani,
  sersemSuresi,
  canEsigiEtkinMi,
  uzakNisanCarpani,
  pasifOzellik,
  KRITIK_CARPANI,
  KRITIK_TAVAN_CEVIKLIGI,
  kacinmaSansi,
  dusmanStatlari,
  dusmanOlustur,
  dusmanMenzili,
  eylemMenzili,
  xpOdulu,
  dusmanXp,
  savasci,
  eylemKontrol,
  oyuncuHamlesi,
  dusmanHamlesi,
  dusmanToparlan,
  bayilmaUygula,
} from '../src/oyun/savas.js';
import { karsilasmaUret } from '../src/oyun/kesif.js';
import { gezginBossOlustur } from '../src/oyun/gezginBoss.js';
import { yeniKarakter, xpEkle, gerekenXp, statlar } from '../src/oyun/karakter.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import { rastgeleUreteci } from '../src/oyun/rastgele.js';
import { yemekGucu } from '../src/oyun/envanter.js';
import { iller } from '../src/veri/iller.js';
import { siniflar } from '../src/veri/siniflar.js';
import { dusmanlar, DUSMAN_MENZILI, DUSMAN_TURLERI } from '../src/veri/dusmanlar.js';

// Hep aynı değeri veren sahte üreteç:
// 0.99 → kaçınma yok, kritik yok, özel hamle yok, rnd ≈ 1.098
// 0    → her şans tutar (kaçınma, kritik, özel hamle), rnd = 0.9
const sabit = (x) => () => x;

function seviyeliKarakter(sinif, seviye) {
  let o = yeniKarakter('Test', sinif);
  while (o.seviye < seviye) o = xpEkle(o, gerekenXp(o.seviye)).oyuncu;
  return o;
}

// Belli sınıf ve seviyede, isteğe bağlı can/nefes ve heybeyle oyun durumu
function durum(sinif = 'akinci', seviye = 1, { can, nefes, heybe } = {}) {
  const d = yeniOyunDurumu({ ad: 'A', sinif });
  const o = seviyeliKarakter(sinif, seviye);
  return { ...d, oyuncu: { ...o, can: can ?? o.can, nefes: nefes ?? o.nefes }, heybe: heybe ?? d.heybe };
}

describe('formüller', () => {
  it('hasar: max(1, round(güç × rnd − savunma × 0.5))', () => {
    expect(hasarHesapla({ guc: 12, savunma: 5, rnd: 1 })).toBe(10);
    expect(hasarHesapla({ guc: 12, savunma: 5, rnd: 0.9 })).toBe(8);
    expect(hasarHesapla({ guc: 12, savunma: 5, rnd: 1.1 })).toBe(11);
    expect(hasarHesapla({ guc: 1, savunma: 100 })).toBe(1);
  });

  it('kritik vuruş ×1.5, yetenek ve ek hasar çarpanları uygulanır', () => {
    expect(hasarHesapla({ guc: 12, savunma: 4, kritik: true })).toBe(15);
    expect(hasarHesapla({ guc: 10, savunma: 0, carpan: 1.4 })).toBe(14);
    expect(hasarHesapla({ guc: 10, savunma: 0, ek: 1.5 })).toBe(15);
  });

  it('kritik şansı: min(%30, çeviklik × %0.8) + bonus', () => {
    expect(kritikSansi(6)).toBeCloseTo(0.048);
    expect(kritikSansi(100)).toBe(0.3);
    expect(kritikSansi(10, 0.25)).toBeCloseTo(0.33);
  });

  it('kaçınma şansı çeviklikle artar, %20 ile sınırlı', () => {
    expect(kacinmaSansi(6)).toBeCloseTo(0.03);
    expect(kacinmaSansi(1000)).toBe(0.2);
  });

  it('düşman statları seviye ve tür çarpanıyla ölçeklenir', () => {
    expect(dusmanStatlari('ac_kurt', 1)).toEqual({ can: 29, guc: 7, savunma: 4, ceviklik: 6 });
    const sv1 = dusmanStatlari('boz_ayi', 1);
    const sv30 = dusmanStatlari('boz_ayi', 30);
    for (const s of ['can', 'guc', 'savunma', 'ceviklik']) expect(sv30[s]).toBeGreaterThan(sv1[s]);
    expect(dusmanStatlari('bogaz_ejderi', 10).can).toBeGreaterThan(dusmanStatlari('ac_kurt', 10).can * 2);
  });

  it('XP ödülü seviye ve düşman sınıfıyla artar; gezgin bosslar kendi çarpanıyla', () => {
    expect(xpOdulu('ac_kurt', 1)).toBe(15);
    expect(xpOdulu('ac_kurt', 5)).toBe(55);
    expect(xpOdulu('gulyabani', 5)).toBe(165);
    expect(dusmanXp(dusmanOlustur('ac_kurt', 5))).toBe(55);
    const gezgin = gezginBossOlustur('bogaz_ejderi', 34, sabit(0.5), { tehlike: 'zorlu' });
    expect(dusmanXp(gezgin)).toBe(xpOdulu('bogaz_ejderi', gezgin.seviye, 3));
  });

  it('karşılaşma, ilin düşman havuzundan ve seviye aralığından üretilir', () => {
    const rng = rastgeleUreteci(5);
    for (const il of iller.filter((i) => i.bolge === 'marmara')) {
      for (let i = 0; i < 20; i++) {
        const d = karsilasmaUret(il.plaka, rng);
        expect(il.dusmanlar).toContain(d.anahtar);
        expect(d.seviye).toBeGreaterThanOrEqual(il.seviye[0]);
        expect(d.seviye).toBeLessThanOrEqual(il.seviye[1]);
      }
    }
  });
});

describe('menziller', () => {
  it('sınıflar farklı uzaklıktan vurur: Akıncı yakından, Alperen iki karo, Kemankeş beş karo öteden', () => {
    expect(eylemMenzili('akinci', { tur: 'saldir' })).toBe(1);
    expect(eylemMenzili('alperen', { tur: 'saldir' })).toBe(2);
    expect(eylemMenzili('kemankes', { tur: 'saldir' })).toBe(5);
    for (const s of Object.values(siniflar)) {
      expect(s.menzil).toBeGreaterThanOrEqual(1);
      expect(s.menzil > 1 ? ['ok', 'isik'] : [null, 'isik']).toContain(s.mermi);
    }
  });

  it('hasar yetenekleri kendi menzilini ya da sınıfınkini kullanır; diğer yetenekler ve yemek hedefsizdir', () => {
    expect(eylemMenzili('akinci', { tur: 'yetenek', anahtar: 'kilic_darbesi' })).toBe(1);
    expect(eylemMenzili('akinci', { tur: 'yetenek', anahtar: 'akin_hamlesi' })).toBe(3);
    expect(eylemMenzili('alperen', { tur: 'yetenek', anahtar: 'arinma_isigi' })).toBe(4);
    expect(eylemMenzili('kemankes', { tur: 'yetenek', anahtar: 'menzil_atisi' })).toBe(7);
    expect(eylemMenzili('akinci', { tur: 'yetenek', anahtar: 'kalkan_durusu' })).toBeNull();
    expect(eylemMenzili('alperen', { tur: 'yetenek', anahtar: 'sifa_nefesi' })).toBeNull();
    expect(eylemMenzili('akinci', { tur: 'yemek', anahtar: 'boyoz' })).toBeNull();
  });

  it('düşmanların menzili türlerine göredir: cinler ve ifritler uzaktan vurur', () => {
    for (const tur of DUSMAN_TURLERI) expect(DUSMAN_MENZILI[tur], tur).toBeGreaterThanOrEqual(1);
    expect(dusmanMenzili(dusmanOlustur('ac_kurt', 1))).toBe(1);
    expect(dusmanMenzili(dusmanOlustur('yol_kesen_cin', 1))).toBe(3);
    expect(dusmanMenzili(dusmanOlustur('bogaz_ejderi', 10))).toBe(DUSMAN_MENZILI.boss);
    expect(gezginBossOlustur('bogaz_ejderi', 34, sabit(0.5)).menzil).toBe(DUSMAN_MENZILI.boss);
    // Kayıtlardan gelen menzilsiz düşmanda türüne bakılır
    const { menzil, ...eski } = dusmanOlustur('yol_kesen_cin', 1);
    expect(dusmanMenzili(eski)).toBe(3);
    expect(Object.values(dusmanlar).every((d) => DUSMAN_MENZILI[d.tur])).toBe(true);
  });
});

describe('oyuncunun hamlesi', () => {
  const kurt = () => dusmanOlustur('ac_kurt', 1);

  it('savaşçı değerleri güncel statlardan ve zafer sofrasından gelir', () => {
    const d = durum('akinci', 1, { can: 80 });
    expect(savasci(d)).toMatchObject({ can: 80, canEnCok: 120, nefes: 30, guc: 12, savunma: 10, ceviklik: 6, yetenekler: ['kilic_darbesi'] });
    expect(savasci({ ...d, sofra: { bolge: 'marmara', kalan: 3 } }).guc).toBe(Math.round(12 * 1.1));
  });

  it('saldırı hedefin canını düşürür; durum ve hedef değişmez, yenileri döner', () => {
    const d = durum();
    const hedef = kurt();
    const r = oyuncuHamlesi(d, { tur: 'saldir' }, sabit(0.99), { hedef });
    // 12 × 1.098 − 4 × 0.5 = 11.18 → 11
    expect(r.hedef.can).toBe(29 - 11);
    expect(r.olaylar).toEqual([{ tip: 'saldiri', kim: 'oyuncu', yetenek: undefined, hasar: 11, kritik: false, ekHasar: false }]);
    expect(r.durum.oyuncu.can).toBe(120);
    expect(hedef.can).toBe(29);
  });

  it('kaçınma: şans tutunca düşman hamleden sıyrılır', () => {
    const r = oyuncuHamlesi(durum(), { tur: 'saldir' }, sabit(0), { hedef: kurt() });
    expect(r.hedef.can).toBe(29);
    expect(r.olaylar[0]).toMatchObject({ kim: 'oyuncu', kacindi: true, hasar: 0 });
  });

  it('kritik vuruş ×1.5 hasar verir', () => {
    // Kaçınma yok (0.5), kritik var (0.01) ve rnd = 0.9 + 0.5 × 0.2 = 1.0
    const degerler = [0.5, 0.01, 0.5];
    let i = 0;
    const r = oyuncuHamlesi(durum(), { tur: 'saldir' }, () => degerler[i++] ?? 0.99, { hedef: kurt() });
    expect(r.olaylar[0]).toMatchObject({ kritik: true, hasar: hasarHesapla({ guc: 12, savunma: 4, kritik: true }) });
  });

  it('yetenek nefes harcar ve çarpanla vurur', () => {
    const r = oyuncuHamlesi(durum(), { tur: 'yetenek', anahtar: 'kilic_darbesi' }, sabit(0.99), { hedef: kurt() });
    expect(r.durum.oyuncu.nefes).toBe(25);
    // 12 × 1.4 × 1.098 − 2 = 16.45 → 16
    expect(r.olaylar[0]).toMatchObject({ tip: 'yetenek', yetenek: 'kilic_darbesi', hasar: 16 });
  });

  it('kilitli yetenek, yetersiz nefes ya da hedefsiz vuruş yapılamaz; hiçbir şey değişmez', () => {
    const d = durum();
    const hedef = kurt();
    expect(eylemKontrol(d, { tur: 'yetenek', anahtar: 'tufan_kilici' })).toEqual({ olur: false, neden: 'kilitli_yetenek' });
    expect(oyuncuHamlesi(d, { tur: 'yetenek', anahtar: 'tufan_kilici' }, sabit(0.99), { hedef })).toEqual({ durum: d, hedef, ekHedefler: [], etkiler: [], olaylar: [] });
    const yorgun = durum('akinci', 1, { nefes: 4 });
    expect(eylemKontrol(yorgun, { tur: 'yetenek', anahtar: 'kilic_darbesi' })).toEqual({ olur: false, neden: 'nefes_yetersiz' });
    expect(oyuncuHamlesi(yorgun, { tur: 'yetenek', anahtar: 'kilic_darbesi' }, sabit(0.99), { hedef }).olaylar).toEqual([]);
    expect(oyuncuHamlesi(d, { tur: 'saldir' }, sabit(0.99)).olaylar).toEqual([]);
    expect(oyuncuHamlesi(d, { tur: 'saldir' }, sabit(0.99), { hedef: { ...hedef, can: 0 } }).olaylar).toEqual([]);
    expect(eylemKontrol(d, { tur: 'kac' })).toEqual({ olur: false, neden: 'bilinmeyen_eylem' });
  });

  it('düşmanın canı biterse düştüğü bildirilir', () => {
    const r = oyuncuHamlesi(durum(), { tur: 'saldir' }, sabit(0.99), { hedef: { ...kurt(), can: 5 } });
    expect(r.hedef.can).toBe(0);
    expect(r.olaylar.at(-1)).toEqual({ tip: 'dustu', kim: 'dusman' });
  });

  it('Arınma Işığı cin ve ifritlere ek hasar verir', () => {
    const d = durum('alperen', 20);
    const eylem = { tur: 'yetenek', anahtar: 'arinma_isigi' };
    const cin = dusmanOlustur('yol_kesen_cin', 20);
    const r = oyuncuHamlesi(d, eylem, sabit(0.99), { hedef: cin });
    expect(r.olaylar[0].ekHasar).toBe(true);
    expect(oyuncuHamlesi(d, eylem, sabit(0.99), { hedef: dusmanOlustur('ac_kurt', 20) }).olaylar[0].ekHasar).toBe(false);
    expect(r.olaylar[0].hasar).toBe(
      hasarHesapla({ guc: statlar(d.oyuncu).guc, savunma: cin.savunma, rnd: 0.9 + 0.99 * 0.2, carpan: 2.2, ek: 1.5 }),
    );
  });

  it('Şifa Nefesi hedefsiz yapılır, canı yeniler, en yüksek canı aşmaz', () => {
    const tam = durum('alperen', 5);
    const enCok = statlar(tam.oyuncu).can;
    const r = oyuncuHamlesi(durum('alperen', 5, { can: 20 }), { tur: 'yetenek', anahtar: 'sifa_nefesi' }, sabit(0.99));
    const miktar = Math.round(enCok * 0.35);
    expect(r.olaylar[0]).toMatchObject({ etki: 'sifa', miktar });
    expect(r.durum.oyuncu.can).toBe(20 + miktar);
    expect(oyuncuHamlesi(tam, { tur: 'yetenek', anahtar: 'sifa_nefesi' }, sabit(0.99)).olaylar[0].miktar).toBe(0);
  });

  it('güçlenme ve kritik etkileri sonraki saldırıları etkiler, her saldırıda bir azalır', () => {
    const d = durum('akinci', 20);
    const ayi = dusmanOlustur('boz_ayi', 20);
    const nara = oyuncuHamlesi(d, { tur: 'yetenek', anahtar: 'yigit_narasi' }, sabit(0.99));
    expect(nara.etkiler).toEqual([{ etki: 'guclenme', deger: 0.3, kalan: 3 }]);
    const guclu = oyuncuHamlesi(nara.durum, { tur: 'saldir' }, sabit(0.99), { hedef: ayi, etkiler: nara.etkiler });
    const normal = oyuncuHamlesi(d, { tur: 'saldir' }, sabit(0.99), { hedef: ayi });
    expect(guclu.olaylar[0].hasar).toBeGreaterThan(normal.olaylar[0].hasar);
    expect(guclu.etkiler).toEqual([{ etki: 'guclenme', deger: 0.3, kalan: 2 }]);
    const k = oyuncuHamlesi(durum('kemankes', 20), { tur: 'yetenek', anahtar: 'kartal_gozu' }, sabit(0.99));
    expect(k.etkiler).toEqual([{ etki: 'kritik', deger: 0.25, kalan: 3 }]);
  });

  it('yemek heybeden düşer, canı ya da nefesi yeniler; gerekmeyen ya da olmayan yemek yenmez', () => {
    const heybe = [{ anahtar: 'balik_ekmek', adet: 2 }, { anahtar: 'hosmerim', adet: 1 }];
    const yarali = durum('akinci', 1, { can: 50, nefes: 10, heybe });
    const c = oyuncuHamlesi(yarali, { tur: 'yemek', anahtar: 'balik_ekmek' }, sabit(0.99));
    expect(c.olaylar).toEqual([{ tip: 'yemek', kim: 'oyuncu', yemek: 'balik_ekmek', yenilenen: 'can', miktar: yemekGucu('balik_ekmek') }]);
    expect(c.durum.heybe).toEqual([{ anahtar: 'balik_ekmek', adet: 1 }, { anahtar: 'hosmerim', adet: 1 }]);
    const n = oyuncuHamlesi(yarali, { tur: 'yemek', anahtar: 'hosmerim' }, sabit(0.99));
    expect(n.durum.oyuncu.nefes).toBe(10 + yemekGucu('hosmerim'));
    expect(eylemKontrol(n.durum, { tur: 'yemek', anahtar: 'hosmerim' })).toEqual({ olur: false, neden: 'yemek_yok' });
    expect(eylemKontrol(yarali, { tur: 'yemek', anahtar: 'sarap' })).toEqual({ olur: false, neden: 'bilinmeyen_yemek' });
    expect(eylemKontrol(durum('akinci', 1, { heybe }), { tur: 'yemek', anahtar: 'balik_ekmek' })).toEqual({ olur: false, neden: 'dolu' });
    expect(heybe).toHaveLength(2); // verilen heybe değişmez
  });
});

describe('düşmanın hamlesi', () => {
  it('düşman vurur: oyuncunun canı düşer', () => {
    const d = durum();
    const r = dusmanHamlesi(d, dusmanOlustur('ac_kurt', 1), sabit(0.99));
    // 7 × 1.098 − 10 × 0.5 = 2.69 → 3
    expect(r.olay).toEqual({ tip: 'saldiri', kim: 'dusman', hasar: 3, kritik: false, korundu: false });
    expect(r.durum.oyuncu.can).toBe(117);
    expect(d.oyuncu.can).toBe(120);
  });

  it('özel hamle ve kaçınma: şans tutunca düşman özel hamle yapar, oyuncu sıyrılır', () => {
    const r = dusmanHamlesi(durum(), dusmanOlustur('ac_kurt', 1), sabit(0));
    expect(r.olay).toMatchObject({ tip: 'ozel_hamle', hamle: 'Azgın Saldırı', kacindi: true });
  });

  it('kalabalık çarpanı vuruşu zayıflatır; can sıfırın altına inmez', () => {
    const d = durum('akinci', 5);
    const cin = dusmanOlustur('yol_kesen_cin', 8);
    const tek = dusmanHamlesi(d, cin, sabit(0.99)).olay.hasar;
    const kalabalik = dusmanHamlesi(d, cin, sabit(0.99), { hasarCarpani: 0.55 }).olay.hasar;
    expect(kalabalik).toBeLessThan(tek);
    expect(dusmanHamlesi(durum('akinci', 1, { can: 1 }), { ...cin, guc: 999 }, sabit(0.99)).durum.oyuncu.can).toBe(0);
  });

  it('Kalkan Duruşu alınan hasarı iki düşman vuruşu boyunca yarıya indirir', () => {
    const d = durum('akinci', 5);
    const cin = dusmanOlustur('yol_kesen_cin', 8);
    const duz = dusmanHamlesi(d, cin, sabit(0.99)).olay.hasar;
    const k = oyuncuHamlesi(d, { tur: 'yetenek', anahtar: 'kalkan_durusu' }, sabit(0.99));
    expect(k.etkiler).toEqual([{ etki: 'savunma', deger: 0.5, kalan: 2 }]);
    const v1 = dusmanHamlesi(k.durum, cin, sabit(0.99), { etkiler: k.etkiler });
    expect(v1.olay).toMatchObject({ korundu: true, hasar: Math.round(duz * 0.5) });
    expect(v1.etkiler).toEqual([{ etki: 'savunma', deger: 0.5, kalan: 1 }]);
    const v2 = dusmanHamlesi(v1.durum, cin, sabit(0.99), { etkiler: v1.etkiler });
    expect(v2.olay.korundu).toBe(true);
    expect(v2.etkiler).toEqual([]);
    expect(dusmanHamlesi(v2.durum, cin, sabit(0.99), { etkiler: v2.etkiler }).olay.korundu).toBe(false);
  });

  it('hortlağın ürkütmesi oyuncunun sonraki saldırılarının gücünü azaltır', () => {
    // 0.1: düşman özel hamle yapar (0.1 < 0.2); oyuncu vuruşunda kaçınma/kritik yok
    const d = durum('akinci', 8);
    const hortlak = dusmanOlustur('zeytinlik_hortlagi', 8);
    const r = dusmanHamlesi(d, hortlak, sabit(0.1));
    expect(r.olay).toMatchObject({ tip: 'ozel_hamle', etki: 'zayiflatma', sure: 2 });
    expect(r.etkiler).toEqual([{ etki: 'zayiflatma', deger: 0.25, kalan: 2 }]);
    const urkmus = oyuncuHamlesi(d, { tur: 'saldir' }, sabit(0.99), { hedef: hortlak, etkiler: r.etkiler });
    const normal = oyuncuHamlesi(d, { tur: 'saldir' }, sabit(0.99), { hedef: hortlak });
    expect(urkmus.olaylar[0].hasar).toBeLessThan(normal.olaylar[0].hasar);
    expect(urkmus.etkiler).toEqual([{ etki: 'zayiflatma', deger: 0.25, kalan: 1 }]);
  });

  it('savaştan uzaklaşan düşman toparlanır: canı dolar, evre güçlenmesi söner', () => {
    const kurt = dusmanOlustur('ac_kurt', 3);
    expect(dusmanToparlan(kurt)).toBe(kurt);
    expect(dusmanToparlan({ ...kurt, can: 3 })).toEqual(kurt);
    const boss = dusmanOlustur('bogaz_ejderi', 10);
    const guclenmis = { ...boss, can: 10, guc: boss.guc * 2, temelGuc: boss.guc, evre: true };
    expect(dusmanToparlan(guclenmis)).toEqual(boss);
  });
});

describe('bayılma', () => {
  it('oyuncu il merkezinde kendine gelir, akçesinin %10\'unu kaybeder; can ve nefes dolar', () => {
    const d = { ...durum('kemankes', 1, { can: 0, nefes: 3 }), konum: 41, akce: 105 };
    const r = bayilmaUygula(d);
    expect(r).toMatchObject({ akceKaybi: 10, donulenIl: 41, kervansarayda: false });
    expect(r.durum).toMatchObject({ akce: 95, konum: 41, oyuncu: { can: 90, nefes: 40 } });
    const kervan = bayilmaUygula({ ...d, sonKervansaray: 16 });
    expect(kervan).toMatchObject({ donulenIl: 16, kervansarayda: true, durum: { konum: 16 } });
  });

  it('bayılma akçesi olmayan oyuncuda da çalışır', () => {
    const { durum: d, akceKaybi } = bayilmaUygula({ ...yeniOyunDurumu({ ad: 'A', sinif: 'alperen' }), akce: 0 });
    expect(akceKaybi).toBe(0);
    expect(d.akce).toBe(0);
  });
});

describe('düello (sabit tohum, vuruş vuruşa)', () => {
  // Oyuncu ve düşman sırayla vurur; hangisinin canı önce biterse o kaybeder.
  function duello(tohum, sinif = 'akinci', dusman = 'ac_kurt') {
    const rng = rastgeleUreteci(tohum);
    let d = durum(sinif);
    let hedef = dusmanOlustur(dusman, 1);
    let vurus = 0;
    while (hedef.can > 0 && d.oyuncu.can > 0) {
      const r = oyuncuHamlesi(d, { tur: 'saldir' }, rng, { hedef });
      d = r.durum;
      hedef = r.hedef;
      vurus++;
      if (hedef.can > 0) d = dusmanHamlesi(d, hedef, rng).durum;
    }
    return { kazandi: hedef.can <= 0, vurus, can: d.oyuncu.can };
  }

  it('aynı tohum aynı düelloyu üretir', () => {
    expect(duello(123)).toEqual(duello(123));
  });

  it('dengeleme: Sv 1 Akıncı, Sv 1 Aç Kurt\'u ortalama 3–5 vuruşta yener', () => {
    const N = 500;
    let toplam = 0;
    let zafer = 0;
    for (let t = 1; t <= N; t++) {
      const s = duello(t);
      toplam += s.vurus;
      if (s.kazandi) zafer++;
    }
    expect(toplam / N).toBeGreaterThanOrEqual(3);
    expect(toplam / N).toBeLessThanOrEqual(5);
    expect(zafer).toBe(N);
  });

  it('üç sınıf da Sv 1 Aç Kurt\'u yenebilir', () => {
    for (const sinif of ['akinci', 'kemankes', 'alperen']) {
      let zafer = 0;
      for (let t = 1; t <= 100; t++) if (duello(t, sinif).kazandi) zafer++;
      expect(zafer, sinif).toBeGreaterThanOrEqual(95);
    }
  });
});

// Sırayla verilen değerleri döndüren sahte üreteç (sonra başa döner)
const sirali = (...xs) => {
  let i = 0;
  return () => xs[i++ % xs.length];
};

describe('çeviklik tavanı: fazlası kritik hasarına gider', () => {
  it('kritik şansı 37,5 çeviklikte tavana varır; ötesindeki çeviklik kritik çarpanını büyütür', () => {
    expect(KRITIK_TAVAN_CEVIKLIGI).toBe(37.5);
    expect(kritikSansi(KRITIK_TAVAN_CEVIKLIGI)).toBeCloseTo(0.3);
    expect(kritikCarpani(10)).toBe(KRITIK_CARPANI);
    expect(kritikCarpani(KRITIK_TAVAN_CEVIKLIGI)).toBe(KRITIK_CARPANI);
    expect(kritikCarpani(60)).toBeCloseTo(1.5 + 22.5 * 0.006);
    expect(kritikCarpani(1000)).toBe(2);
  });

  it('hasar formülü verilen kritik çarpanını kullanır', () => {
    expect(hasarHesapla({ guc: 20, savunma: 0, kritik: true, kritikCarpi: 2 })).toBe(40);
    expect(hasarHesapla({ guc: 20, savunma: 0, kritik: false, kritikCarpi: 2 })).toBe(20);
  });

  it('çevik yiğidin kritik vuruşu daha ağır iner; düşmanlar ×1,5 ile vurur', () => {
    const d = durum('kemankes', 30);
    const s = statlar(d.oyuncu);
    expect(s.ceviklik).toBeGreaterThan(KRITIK_TAVAN_CEVIKLIGI);
    const ayi = dusmanOlustur('boz_ayi', 30);
    // 0.99 → sıyrılma yok · 0 → kritik · 0.5 → rnd = 1
    const r = oyuncuHamlesi(d, { tur: 'saldir' }, sirali(0.99, 0, 0.5), { hedef: ayi });
    expect(r.olaylar[0]).toMatchObject({ kritik: true });
    expect(r.olaylar[0].hasar).toBe(hasarHesapla({ guc: s.guc, savunma: ayi.savunma, kritik: true, kritikCarpi: kritikCarpani(s.ceviklik) }));
    expect(r.olaylar[0].hasar).toBeGreaterThan(hasarHesapla({ guc: s.guc, savunma: ayi.savunma, kritik: true }));
    const cevik = { ...dusmanOlustur('boz_ayi', 50) };
    expect(cevik.ceviklik).toBeGreaterThan(KRITIK_TAVAN_CEVIKLIGI);
    const v = dusmanHamlesi(d, cevik, sirali(0.99, 0.99, 0, 0.5));
    expect(v.olay.kritik).toBe(true);
    expect(v.olay.hasar).toBe(hasarHesapla({ guc: cevik.guc, savunma: s.savunma, kritik: true }));
  });
});

describe('yetenek etkileri: çoklu vuruş, alan, sersemletme, arınma', () => {
  const ayi = (seviye) => dusmanOlustur('boz_ayi', seviye);

  it('Çifte Ok hedefe iki ayrı ok atar; güçlenme etkileri hamle başına bir kez azalır', () => {
    const d = durum('kemankes', 5);
    const hedef = ayi(5);
    const etkiler = [{ etki: 'kritik', deger: 0, kalan: 3 }];
    const r = oyuncuHamlesi(d, { tur: 'yetenek', anahtar: 'cifte_ok' }, sabit(0.99), { hedef, etkiler });
    const oklar = r.olaylar.filter((o) => o.yetenek === 'cifte_ok');
    expect(oklar).toHaveLength(2);
    expect(hedef.can - r.hedef.can).toBe(oklar[0].hasar + oklar[1].hasar);
    expect(r.etkiler).toEqual([{ etki: 'kritik', deger: 0, kalan: 2 }]);
    expect(r.durum.oyuncu.nefes).toBe(d.oyuncu.nefes - 9);
  });

  it('Çifte Ok\'un ilk oku düşürdüyse ikinci ok atılmaz', () => {
    const r = oyuncuHamlesi(durum('kemankes', 5), { tur: 'yetenek', anahtar: 'cifte_ok' }, sabit(0.99), { hedef: { ...ayi(5), can: 1 } });
    expect(r.olaylar.filter((o) => o.hasar !== undefined)).toHaveLength(1);
    expect(r.olaylar.at(-1)).toEqual({ tip: 'dustu', kim: 'dusman' });
  });

  it('Ok Yağmuru ek hedeflere alan çarpanıyla vurur; düşmüş ek hedefe vurulmaz', () => {
    const d = durum('kemankes', 12);
    const s = statlar(d.oyuncu);
    const yan = ayi(12);
    const r = oyuncuHamlesi(d, { tur: 'yetenek', anahtar: 'ok_yagmuru' }, sabit(0.99), {
      hedef: ayi(12), ekHedefler: [yan, { ...yan, can: 0 }, { ...yan, can: 1 }],
    });
    const ek0 = r.olaylar.find((o) => o.ek === 0 && o.hasar !== undefined);
    expect(ek0.hasar).toBe(hasarHesapla({ guc: s.guc, savunma: yan.savunma, rnd: 0.9 + 0.99 * 0.2, carpan: 1.2 }));
    expect(r.olaylar.some((o) => o.ek === 1)).toBe(false);
    expect(r.olaylar).toContainEqual({ tip: 'dustu', kim: 'dusman', ek: 2 });
    expect(r.ekHedefler.map((h) => h.can)).toEqual([yan.can - ek0.hasar, 0, 0]);
  });

  it('alanı olmayan vuruşta ek hedeflere dokunulmaz', () => {
    const ekHedefler = [ayi(3)];
    const r = oyuncuHamlesi(durum(), { tur: 'saldir' }, sabit(0.99), { hedef: ayi(3), ekHedefler });
    expect(r.ekHedefler).toBe(ekHedefler);
    expect(r.olaylar.some((o) => o.ek !== undefined)).toBe(false);
  });

  it('Akın Hamlesi vurduğunu sersemletir; bosslarda yarı süre; düşen sersemlemez', () => {
    const d = durum('akinci', 12);
    const eylem = { tur: 'yetenek', anahtar: 'akin_hamlesi' };
    expect(oyuncuHamlesi(d, eylem, sabit(0.99), { hedef: ayi(12) }).olaylar[0].sersem).toBe(6);
    const boss = dusmanOlustur('bogaz_ejderi', 12);
    expect(sersemSuresi(boss, 6)).toBe(3);
    expect(oyuncuHamlesi(d, eylem, sabit(0.99), { hedef: boss }).olaylar[0].sersem).toBe(3);
    expect(oyuncuHamlesi(d, eylem, sabit(0.99), { hedef: { ...ayi(12), can: 1 } }).olaylar[0].sersem).toBeUndefined();
    expect(oyuncuHamlesi(d, eylem, sabit(0), { hedef: ayi(12) }).olaylar[0]).toMatchObject({ kacindi: true });
    expect(oyuncuHamlesi(d, eylem, sabit(0), { hedef: ayi(12) }).olaylar[0].sersem).toBeUndefined();
  });

  it('Gönül Dirliği ürküntüyü giderir; Şifa Nefesi gidermez', () => {
    const etkiler = [{ etki: 'zayiflatma', deger: 0.2, kalan: 2 }, { etki: 'savunma', deger: 0.5, kalan: 1 }];
    const g = oyuncuHamlesi(durum('alperen', 32, { can: 20 }), { tur: 'yetenek', anahtar: 'gonul_dirligi' }, sabit(0.99), { etkiler });
    expect(g.etkiler).toEqual([{ etki: 'savunma', deger: 0.5, kalan: 1 }]);
    expect(g.olaylar[0]).toMatchObject({ etki: 'sifa', arindi: true });
    const s = oyuncuHamlesi(durum('alperen', 32, { can: 20 }), { tur: 'yetenek', anahtar: 'sifa_nefesi' }, sabit(0.99), { etkiler });
    expect(s.etkiler).toBe(etkiler);
    expect(s.olaylar[0].arindi).toBeUndefined();
  });
});

describe('sınıf özellikleri (pasifler) ve geç seviye yetenekleri', () => {
  const ayi = (seviye) => dusmanOlustur('boz_ayi', seviye);

  it('Gözü Pek: canı eşiğin altındaki Akıncı daha sert vurur; başka sınıflarda yoktur', () => {
    const tam = durum('akinci', 20);
    const enCok = statlar(tam.oyuncu).can;
    const yarali = durum('akinci', 20, { can: Math.floor(enCok * 0.3) });
    expect(canEsigiEtkinMi(savasci(tam))).toBe(false);
    expect(canEsigiEtkinMi(savasci(yarali))).toBe(true);
    const hedef = ayi(20);
    const normal = oyuncuHamlesi(tam, { tur: 'saldir' }, sabit(0.99), { hedef }).olaylar[0].hasar;
    const hirsli = oyuncuHamlesi(yarali, { tur: 'saldir' }, sabit(0.99), { hedef }).olaylar[0].hasar;
    const s = statlar(tam.oyuncu);
    expect(hirsli).toBe(hasarHesapla({ guc: s.guc * 1.2, savunma: hedef.savunma, rnd: 0.9 + 0.99 * 0.2 }));
    expect(hirsli).toBeGreaterThan(normal);
    const alperen = durum('alperen', 20, { can: 10 });
    expect(canEsigiEtkinMi(savasci(alperen))).toBe(false);
  });

  it('Uzak Nişan: Kemankeş üç karo ve ötesine daha ağır vurur; uzaklık bilinmezse etki yok', () => {
    expect(uzakNisanCarpani('kemankes', 2)).toBe(1);
    expect(uzakNisanCarpani('kemankes', 3)).toBeCloseTo(1.15);
    expect(uzakNisanCarpani('akinci', 5)).toBe(1);
    const d = durum('kemankes', 10);
    const hedef = ayi(10);
    const yakin = oyuncuHamlesi(d, { tur: 'saldir' }, sabit(0.99), { hedef, uzaklik: 1 }).olaylar[0].hasar;
    const uzak = oyuncuHamlesi(d, { tur: 'saldir' }, sabit(0.99), { hedef, uzaklik: 5 }).olaylar[0].hasar;
    const bilinmez = oyuncuHamlesi(d, { tur: 'saldir' }, sabit(0.99), { hedef }).olaylar[0].hasar;
    expect(uzak).toBeGreaterThan(yakin);
    expect(bilinmez).toBe(yakin);
  });

  it('Delici Ok düşmanın savunmasını yok sayar', () => {
    const d = durum('kemankes', 45);
    const s = statlar(d.oyuncu);
    const hedef = ayi(45);
    const r = oyuncuHamlesi(d, { tur: 'yetenek', anahtar: 'delici_ok' }, sabit(0.99), { hedef });
    expect(r.olaylar[0].hasar).toBe(hasarHesapla({ guc: s.guc, savunma: 0, rnd: 0.9 + 0.99 * 0.2, carpan: 2.8 }));
  });

  it('Akın Coşkusu: sonraki saldırılarda verilen hasarın bir kısmı kadar can yenilenir, hamle başına bir azalır', () => {
    const d = durum('akinci', 45, { can: 50 });
    const c = oyuncuHamlesi(d, { tur: 'yetenek', anahtar: 'akin_coskusu' }, sabit(0.99));
    expect(c.etkiler).toEqual([{ etki: 'cosku', deger: 0.35, kalan: 4 }]);
    const r = oyuncuHamlesi(c.durum, { tur: 'saldir' }, sabit(0.99), { hedef: ayi(45), etkiler: c.etkiler });
    const hasar = r.olaylar[0].hasar;
    expect(r.olaylar).toContainEqual({ tip: 'canlanma', kim: 'oyuncu', miktar: Math.round(hasar * 0.35) });
    expect(r.durum.oyuncu.can).toBe(50 + Math.round(hasar * 0.35));
    expect(r.etkiler).toEqual([{ etki: 'cosku', deger: 0.35, kalan: 3 }]);
    // Can doluyken yenilenecek bir şey yok
    const tam = durum('akinci', 45);
    const t = oyuncuHamlesi(tam, { tur: 'saldir' }, sabit(0.99), { hedef: ayi(45), etkiler: c.etkiler });
    expect(t.olaylar.some((o) => o.tip === 'canlanma')).toBe(false);
  });

  it('Çınar Sükûneti korur ve canı hemen yeniler', () => {
    const d = durum('alperen', 45, { can: 40 });
    const enCok = statlar(d.oyuncu).can;
    const r = oyuncuHamlesi(d, { tur: 'yetenek', anahtar: 'cinar_sukuneti' }, sabit(0.99));
    expect(r.etkiler).toEqual([{ etki: 'savunma', deger: 0.6, kalan: 4 }]);
    expect(r.olaylar[0]).toMatchObject({ etki: 'savunma', miktar: Math.round(enCok * 0.3) });
    expect(r.durum.oyuncu.can).toBe(40 + Math.round(enCok * 0.3));
  });

  it('geç yetenekler 38 ve 45. seviyede açılır', () => {
    expect(eylemKontrol(durum('kemankes', 37), { tur: 'yetenek', anahtar: 'yaylim_atesi' })).toEqual({ olur: false, neden: 'kilitli_yetenek' });
    expect(eylemKontrol(durum('kemankes', 38), { tur: 'yetenek', anahtar: 'yaylim_atesi' })).toEqual({ olur: true });
    expect(eylemKontrol(durum('alperen', 44), { tur: 'yetenek', anahtar: 'cinar_sukuneti' }).olur).toBe(false);
    expect(eylemKontrol(durum('alperen', 45), { tur: 'yetenek', anahtar: 'cinar_sukuneti' }).olur).toBe(true);
  });
});

describe('uzmanlık dallarının savaştaki etkileri', () => {
  const ayi = (seviye) => dusmanOlustur('boz_ayi', seviye);
  const dalli = (sinif, dal, seviye = 25, ek = {}) => {
    const d = durum(sinif, seviye, ek);
    return { ...d, oyuncu: { ...d.oyuncu, dal } };
  };
  const vurus = (d, hedef, ek = {}) => oyuncuHamlesi(d, { tur: 'saldir' }, sabit(0.99), { hedef, ...ek }).olaylar[0].hasar;

  it('dal pasifi güçlendirir: Gözü Pek, Uzak Nişan, Gönül Gücü', () => {
    expect(pasifOzellik('akinci', 'serdengecti').guc).toBe(0.35);
    expect(pasifOzellik('akinci', 'sipahi').guc).toBe(0.2);
    expect(uzakNisanCarpani('kemankes', 4, 'nisanci')).toBeCloseTo(1.3);
    expect(pasifOzellik('alperen', 'dervis').nefes).toBe(0.18);
    expect(pasifOzellik('alperen').nefes).toBe(0.1);
  });

  it('Serdengeçti daha sert ve daha sık kritik vurur', () => {
    const hedef = ayi(25);
    expect(vurus(dalli('akinci', 'serdengecti'), hedef)).toBeGreaterThan(vurus(durum('akinci', 25), hedef));
    // Kritik şansı tavanı (%30) +%5: 0,32 ile normalde kritik olmaz, Serdengeçti'de olur
    const r = oyuncuHamlesi(dalli('akinci', 'serdengecti', 40), { tur: 'saldir' }, sirali(0.99, 0.32, 0.5), { hedef });
    expect(r.olaylar[0].kritik).toBe(true);
    expect(oyuncuHamlesi(durum('akinci', 40), { tur: 'saldir' }, sirali(0.99, 0.32, 0.5), { hedef }).olaylar[0].kritik).toBe(false);
  });

  it('Sipahi\'nin korunma yetenekleri daha çok korur', () => {
    const r = oyuncuHamlesi(dalli('akinci', 'sipahi'), { tur: 'yetenek', anahtar: 'kalkan_durusu' }, sabit(0.99));
    expect(r.etkiler).toEqual([{ etki: 'savunma', deger: 0.65, kalan: 2 }]);
  });

  it('Nişancı\'nın kritik vuruşu daha ağırdır', () => {
    const hedef = dusmanOlustur('yol_kesen_cin', 25); // hayvan değil: Avcı'nın ek hasarı karışmasın
    const nisanci = oyuncuHamlesi(dalli('kemankes', 'nisanci'), { tur: 'saldir' }, sirali(0.99, 0, 0.5), { hedef }).olaylar[0];
    const yalin = oyuncuHamlesi(dalli('kemankes', 'avci'), { tur: 'saldir' }, sirali(0.99, 0, 0.5), { hedef }).olaylar[0];
    expect(nisanci.kritik && yalin.kritik).toBe(true);
    expect(nisanci.hasar).toBeGreaterThan(yalin.hasar);
  });

  it('Avcı hayvanlara daha ağır vurur, alan vuruşu çevredekilere daha ağır iner', () => {
    const avci = dalli('kemankes', 'avci');
    const yalin = durum('kemankes', 25);
    expect(vurus(avci, ayi(25))).toBeGreaterThan(vurus(yalin, ayi(25)));
    const cin = dusmanOlustur('yol_kesen_cin', 25);
    expect(vurus(avci, cin)).toBe(vurus(yalin, cin));
    const yan = dusmanOlustur('yol_kesen_cin', 25);
    const alan = (d) => oyuncuHamlesi(d, { tur: 'yetenek', anahtar: 'ok_yagmuru' }, sabit(0.99), { hedef: cin, ekHedefler: [yan] })
      .olaylar.find((o) => o.ek === 0).hasar;
    expect(alan(avci)).toBeGreaterThan(alan(yalin));
  });

  it('Derviş daha çok iyileşir; Gazi cinlere ve ifritlere daha ağır vurur', () => {
    const yarali = (d) => ({ ...d, oyuncu: { ...d.oyuncu, can: 10 } });
    const sifa = (d) => oyuncuHamlesi(yarali(d), { tur: 'yetenek', anahtar: 'sifa_nefesi' }, sabit(0.99)).olaylar[0].miktar;
    const dervis = dalli('alperen', 'dervis');
    expect(sifa(dervis)).toBe(Math.round(statlar(dervis.oyuncu).can * 0.35 * 1.3));
    const cin = dusmanOlustur('yol_kesen_cin', 25);
    const gazi = dalli('alperen', 'gazi');
    const gaziSadece = { ...gazi, oyuncu: { ...gazi.oyuncu, dal: null } };
    // Aynı statlarla: Gazi'nin ek hasarı cinlere ×1,2
    expect(vurus(gazi, cin)).toBeGreaterThan(vurus(gaziSadece, cin));
    const s = savasci(gazi);
    expect(vurus(gazi, cin)).toBe(hasarHesapla({ guc: s.guc, savunma: cin.savunma, rnd: 0.9 + 0.99 * 0.2, ek: 1.2 }));
  });
});
