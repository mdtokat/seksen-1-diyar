import { describe, it, expect } from 'vitest';
import {
  hasarHesapla,
  kritikSansi,
  kacinmaSansi,
  kacmaSansi,
  dusmanStatlari,
  dusmanOlustur,
  xpOdulu,
  savasBaslat,
  eylemKontrol,
  oyuncuEylemi,
  savasSonucunuUygula,
  bayilmaUygula,
} from '../src/oyun/savas.js';
import { karsilasmaUret } from '../src/oyun/kesif.js';
import { yeniKarakter, xpEkle, gerekenXp, statlar } from '../src/oyun/karakter.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import { rastgeleUreteci } from '../src/oyun/rastgele.js';
import { yemekGucu } from '../src/oyun/envanter.js';
import { iller } from '../src/veri/iller.js';
import { olayMetni } from '../src/arayuz/savasEkrani.js';

// Hep aynı değeri veren sahte üreteç:
// 0.99 → kaçınma yok, kritik yok, özel hamle yok, rnd ≈ 1.098
// 0    → her şans tutar (kaçınma, kritik, özel hamle, kaçış), rnd = 0.9
const sabit = (x) => () => x;

function seviyeliKarakter(sinif, seviye) {
  let o = yeniKarakter('Test', sinif);
  while (o.seviye < seviye) o = xpEkle(o, gerekenXp(o.seviye)).oyuncu;
  return o;
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

  it('kaçma şansı: min(%80, %40 + çeviklik farkı × %2), en az %0', () => {
    expect(kacmaSansi(10, 10)).toBeCloseTo(0.4);
    expect(kacmaSansi(12, 7)).toBeCloseTo(0.5);
    expect(kacmaSansi(40, 10)).toBe(0.8);
    expect(kacmaSansi(10, 40)).toBe(0);
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
    expect(dusmanStatlari('bogaz_ejderi', 10).can).toBeGreaterThan(dusmanStatlari('ac_kurt', 10).can * 3);
  });

  it('XP ödülü seviye ve düşman sınıfıyla artar', () => {
    expect(xpOdulu('ac_kurt', 1)).toBe(15);
    expect(xpOdulu('ac_kurt', 5)).toBe(55);
    expect(xpOdulu('gulyabani', 5)).toBe(165);
  });
});

describe('savaş başlangıcı', () => {
  it('oyuncunun güncel statları ve açık yetenekleri savaşa aktarılır', () => {
    const o = { ...yeniKarakter('Alp', 'akinci'), can: 80 };
    const s = savasBaslat(o, dusmanOlustur('ac_kurt', 1));
    expect(s.oyuncu).toMatchObject({ can: 80, canEnCok: 120, nefes: 30, guc: 12, savunma: 10, ceviklik: 6 });
    expect(s.oyuncu.yetenekler).toEqual(['kilic_darbesi']);
    expect(s.dusman).toMatchObject({ ad: 'Aç Kurt', can: 29, canEnCok: 29, seviye: 1 });
    expect(s.sonuc).toBeNull();
    expect(s.xpOdulu).toBe(15);
    expect(s.gunluk).toEqual([{ tip: 'baslangic' }]);
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

describe('savaş eylemleri', () => {
  const yeniSavas = (sinif = 'akinci', dusman = 'ac_kurt', sv = 1, osv = 1) =>
    savasBaslat(seviyeliKarakter(sinif, osv), dusmanOlustur(dusman, sv));

  it('saldırı: oyuncu vurur, ardından düşman hamlesini yapar', () => {
    const once = yeniSavas();
    const s = oyuncuEylemi(once, { tur: 'saldir' }, sabit(0.99));
    // 12 × 1.098 − 4 × 0.5 = 11.18 → 11 ; 7 × 1.098 − 10 × 0.5 = 2.69 → 3
    expect(s.dusman.can).toBe(29 - 11);
    expect(s.oyuncu.can).toBe(120 - 3);
    expect(s.tur).toBe(2);
    expect(s.gunluk.slice(1)).toEqual([
      { tip: 'saldiri', kim: 'oyuncu', yetenek: undefined, hasar: 11, kritik: false, ekHasar: false },
      { tip: 'saldiri', kim: 'dusman', hasar: 3, kritik: false, korundu: false },
    ]);
    expect(once.dusman.can).toBe(29); // eski durum değişmez
  });

  it('kaçınma ve özel hamle: şans tutunca hamleden sıyrılınır, düşman özel hamle yapar', () => {
    const s = oyuncuEylemi(yeniSavas(), { tur: 'saldir' }, sabit(0));
    expect(s.dusman.can).toBe(29);
    expect(s.oyuncu.can).toBe(120);
    expect(s.gunluk[1]).toMatchObject({ kim: 'oyuncu', kacindi: true, hasar: 0 });
    expect(s.gunluk[2]).toMatchObject({ tip: 'ozel_hamle', hamle: 'Azgın Saldırı', kacindi: true });
  });

  it('kritik vuruş ×1.5 hasar verir', () => {
    // Kaçınma yok (0.5), kritik var (0.01) ve rnd = 0.9 + 0.5 × 0.2 = 1.0
    const degerler = [0.5, 0.01, 0.5];
    let i = 0;
    const rng = () => degerler[i++] ?? 0.99;
    const s = oyuncuEylemi(yeniSavas(), { tur: 'saldir' }, rng);
    expect(s.gunluk[1]).toMatchObject({ kritik: true, hasar: hasarHesapla({ guc: 12, savunma: 4, kritik: true }) });
  });

  it('yetenek nefes harcar ve çarpanla vurur', () => {
    const s = oyuncuEylemi(yeniSavas(), { tur: 'yetenek', anahtar: 'kilic_darbesi' }, sabit(0.99));
    expect(s.oyuncu.nefes).toBe(25);
    // 12 × 1.4 × 1.098 − 2 = 16.45 → 16
    expect(s.gunluk[1]).toMatchObject({ tip: 'yetenek', yetenek: 'kilic_darbesi', hasar: 16 });
  });

  it('kilitli yetenek ve yetersiz nefesle eylem yapılamaz', () => {
    const s = yeniSavas();
    expect(eylemKontrol(s, { tur: 'yetenek', anahtar: 'tufan_kilici' })).toEqual({ olur: false, neden: 'kilitli_yetenek' });
    expect(oyuncuEylemi(s, { tur: 'yetenek', anahtar: 'tufan_kilici' }, sabit(0.99))).toBe(s);
    const yorgun = { ...s, oyuncu: { ...s.oyuncu, nefes: 4 } };
    expect(eylemKontrol(yorgun, { tur: 'yetenek', anahtar: 'kilic_darbesi' })).toEqual({ olur: false, neden: 'nefes_yetersiz' });
    expect(oyuncuEylemi(yorgun, { tur: 'yetenek', anahtar: 'kilic_darbesi' }, sabit(0.99))).toBe(yorgun);
  });

  it('Kalkan Duruşu alınan hasarı iki düşman hamlesi boyunca yarıya indirir', () => {
    const duz = oyuncuEylemi(yeniSavas('akinci', 'yol_kesen_cin', 8, 5), { tur: 'saldir' }, sabit(0.99));
    const duzHasar = duz.gunluk[2].hasar;
    let s = oyuncuEylemi(yeniSavas('akinci', 'yol_kesen_cin', 8, 5), { tur: 'yetenek', anahtar: 'kalkan_durusu' }, sabit(0.99));
    expect(s.gunluk[2]).toMatchObject({ korundu: true, hasar: Math.round(duzHasar * 0.5) });
    expect(s.etkiler).toEqual([{ hedef: 'oyuncu', etki: 'savunma', deger: 0.5, kalan: 1 }]);
    s = oyuncuEylemi(s, { tur: 'saldir' }, sabit(0.99));
    expect(s.gunluk.at(-1).korundu).toBe(true);
    expect(s.etkiler).toEqual([]);
    s = oyuncuEylemi(s, { tur: 'saldir' }, sabit(0.99));
    expect(s.gunluk.at(-1).korundu).toBe(false);
  });

  it('Arınma Işığı cin ve ifritlere ek hasar verir', () => {
    const cin = oyuncuEylemi(yeniSavas('alperen', 'yol_kesen_cin', 20, 20), { tur: 'yetenek', anahtar: 'arinma_isigi' }, sabit(0.99));
    expect(cin.gunluk[1].ekHasar).toBe(true);
    const kurt = oyuncuEylemi(yeniSavas('alperen', 'ac_kurt', 20, 20), { tur: 'yetenek', anahtar: 'arinma_isigi' }, sabit(0.99));
    expect(kurt.gunluk[1].ekHasar).toBe(false);
    const o = seviyeliKarakter('alperen', 20);
    const d = dusmanOlustur('yol_kesen_cin', 20);
    expect(cin.gunluk[1].hasar).toBe(
      hasarHesapla({ guc: statlar(o).guc, savunma: d.savunma, rnd: 0.9 + 0.99 * 0.2, carpan: 2.2, ek: 1.5 }),
    );
  });

  it('Şifa Nefesi canı yeniler, en yüksek canı aşmaz', () => {
    const s0 = yeniSavas('alperen', 'ac_kurt', 1, 5);
    const yarali = { ...s0, oyuncu: { ...s0.oyuncu, can: 20 } };
    const s = oyuncuEylemi(yarali, { tur: 'yetenek', anahtar: 'sifa_nefesi' }, sabit(0.99));
    const miktar = Math.round(s0.oyuncu.canEnCok * 0.35);
    expect(s.gunluk[1]).toMatchObject({ etki: 'sifa', miktar });
    const dolu = oyuncuEylemi(s0, { tur: 'yetenek', anahtar: 'sifa_nefesi' }, sabit(0.99));
    expect(dolu.gunluk[1].miktar).toBe(0);
  });

  it('güçlenme ve kritik etkileri oyuncunun sonraki saldırılarını etkiler', () => {
    let s = oyuncuEylemi(yeniSavas('akinci', 'boz_ayi', 20, 20), { tur: 'yetenek', anahtar: 'yigit_narasi' }, sabit(0.99));
    expect(s.etkiler).toContainEqual({ hedef: 'oyuncu', etki: 'guclenme', deger: 0.3, kalan: 3 });
    const guclu = oyuncuEylemi(s, { tur: 'saldir' }, sabit(0.99)).gunluk.at(-2).hasar;
    const normal = oyuncuEylemi(yeniSavas('akinci', 'boz_ayi', 20, 20), { tur: 'saldir' }, sabit(0.99)).gunluk[1].hasar;
    expect(guclu).toBeGreaterThan(normal);
    const k = oyuncuEylemi(yeniSavas('kemankes', 'boz_ayi', 20, 20), { tur: 'yetenek', anahtar: 'kartal_gozu' }, sabit(0.99));
    expect(k.etkiler).toContainEqual({ hedef: 'oyuncu', etki: 'kritik', deger: 0.25, kalan: 3 });
  });

  it('hortlağın ürkütmesi oyuncunun gücünü azaltır', () => {
    // 0.1: oyuncu vuruşunda kaçınma/kritik yok; düşman özel hamle yapar (0.1 < 0.2)
    let s = oyuncuEylemi(yeniSavas('akinci', 'zeytinlik_hortlagi', 8), { tur: 'saldir' }, sabit(0.1));
    expect(s.gunluk.at(-1)).toMatchObject({ tip: 'ozel_hamle', etki: 'zayiflatma', sure: 2 });
    expect(s.etkiler).toContainEqual({ hedef: 'oyuncu', etki: 'zayiflatma', deger: 0.25, kalan: 2 });
    const ilk = s.gunluk[1].hasar;
    s = oyuncuEylemi(s, { tur: 'saldir' }, sabit(0.1));
    expect(s.gunluk.at(-2).hasar).toBeLessThan(ilk);
  });

  it('yemek heybeden düşer, canı ya da nefesi yeniler, ardından düşman hamle yapar', () => {
    const heybe = [{ anahtar: 'balik_ekmek', adet: 2 }, { anahtar: 'hosmerim', adet: 1 }];
    const s0 = savasBaslat(yeniKarakter('A', 'akinci'), dusmanOlustur('ac_kurt', 1), heybe);
    const yarali = { ...s0, oyuncu: { ...s0.oyuncu, can: 50, nefes: 10 } };
    const c = oyuncuEylemi(yarali, { tur: 'yemek', anahtar: 'balik_ekmek' }, sabit(0.99));
    expect(c.gunluk[1]).toEqual({ tip: 'yemek', kim: 'oyuncu', yemek: 'balik_ekmek', yenilenen: 'can', miktar: yemekGucu('balik_ekmek') });
    expect(c.gunluk).toHaveLength(3);
    expect(c.heybe).toEqual([{ anahtar: 'balik_ekmek', adet: 1 }, { anahtar: 'hosmerim', adet: 1 }]);
    const n = oyuncuEylemi(yarali, { tur: 'yemek', anahtar: 'hosmerim' }, sabit(0.99));
    expect(n.oyuncu.nefes).toBe(10 + yemekGucu('hosmerim'));
    expect(n.heybe).toEqual([{ anahtar: 'balik_ekmek', adet: 2 }]);
    expect(eylemKontrol(n, { tur: 'yemek', anahtar: 'hosmerim' })).toEqual({ olur: false, neden: 'yemek_yok' });
    expect(eylemKontrol(yarali, { tur: 'yemek', anahtar: 'sarap' }).olur).toBe(false);
    expect(heybe).toHaveLength(2); // verilen heybe değişmez
  });

  it('savaşta yenen yemekler savaş sonunda heybeden düşülür', () => {
    const durum = yeniOyunDurumu({ ad: 'A', sinif: 'akinci' });
    let s = savasBaslat({ ...durum.oyuncu, can: 40 }, dusmanOlustur('ac_kurt', 1), durum.heybe);
    s = oyuncuEylemi(s, { tur: 'yemek', anahtar: 'balik_ekmek' }, sabit(0.99));
    s = oyuncuEylemi({ ...s, dusman: { ...s.dusman, can: 1 } }, { tur: 'saldir' }, sabit(0.99));
    const { durum: sonra } = savasSonucunuUygula(durum, s);
    expect(sonra.heybe).toEqual([{ anahtar: 'balik_ekmek', adet: 2 }, { anahtar: 'hosmerim', adet: 2 }]);
  });
});

describe('kaçma', () => {
  it('şans tutarsa savaş biter, düşman hamle yapmaz', () => {
    const s = oyuncuEylemi(savasBaslat(yeniKarakter('A', 'kemankes'), dusmanOlustur('ac_kurt', 1)), { tur: 'kac' }, sabit(0));
    expect(s.sonuc).toBe('kacis');
    expect(s.gunluk.slice(1)).toEqual([{ tip: 'kacis', basarili: true }]);
  });

  it('şans tutmazsa düşman hamlesini yapar', () => {
    const s = oyuncuEylemi(savasBaslat(yeniKarakter('A', 'akinci'), dusmanOlustur('ac_kurt', 1)), { tur: 'kac' }, sabit(0.99));
    expect(s.sonuc).toBeNull();
    expect(s.gunluk[1]).toEqual({ tip: 'kacis', basarili: false });
    expect(s.gunluk[2].kim).toBe('dusman');
  });

  it('bosslardan kaçılamaz', () => {
    const s = savasBaslat(yeniKarakter('A', 'akinci'), dusmanOlustur('bogaz_ejderi', 10));
    expect(eylemKontrol(s, { tur: 'kac' })).toEqual({ olur: false, neden: 'kacilamaz' });
    expect(oyuncuEylemi(s, { tur: 'kac' }, sabit(0))).toBe(s);
  });
});

describe('savaş sonu', () => {
  it('düşman dağılınca zafer; düşman bir daha hamle yapmaz ve eylem kabul edilmez', () => {
    const s0 = savasBaslat(yeniKarakter('A', 'akinci'), dusmanOlustur('ac_kurt', 1));
    const s = oyuncuEylemi({ ...s0, dusman: { ...s0.dusman, can: 1 } }, { tur: 'saldir' }, sabit(0.99));
    expect(s.sonuc).toBe('zafer');
    expect(s.gunluk.at(-1)).toEqual({ tip: 'zafer', xp: 15 });
    expect(s.oyuncu.can).toBe(120);
    expect(oyuncuEylemi(s, { tur: 'saldir' }, sabit(0.99))).toBe(s);
    expect(eylemKontrol(s, { tur: 'saldir' })).toEqual({ olur: false, neden: 'bitti' });
  });

  it('zafer XP kazandırır, gerekirse seviye atlatır ve yeni yeteneği bildirir', () => {
    const durum = yeniOyunDurumu({ ad: 'A', sinif: 'akinci' });
    const o4 = seviyeliKarakter('akinci', 4);
    const d = { ...durum, oyuncu: { ...o4, xp: gerekenXp(4) - 10 } };
    const s0 = savasBaslat(d.oyuncu, dusmanOlustur('ac_kurt', 3));
    const s = oyuncuEylemi({ ...s0, dusman: { ...s0.dusman, can: 1 } }, { tur: 'saldir' }, sabit(0.99));
    const { durum: sonra, ozet } = savasSonucunuUygula(d, s);
    expect(ozet.sonuc).toBe('zafer');
    expect(ozet.xp).toBe(35);
    expect(ozet.seviyeler).toEqual([5]);
    expect(ozet.yeniYetenekler.map((y) => y.ad)).toEqual(['Kalkan Duruşu']);
    expect(sonra.oyuncu.seviye).toBe(5);
    expect(sonra.oyuncu.xp).toBe(25);
  });

  it('yenilgide oyuncu bayılır: il merkezinde kendine gelir, akçesinin %10\'unu kaybeder', () => {
    const durum = { ...yeniOyunDurumu({ ad: 'A', sinif: 'kemankes' }), konum: 41, akce: 105 };
    const s0 = savasBaslat(durum.oyuncu, dusmanOlustur('ac_kurt', 1));
    const s = oyuncuEylemi(
      { ...s0, oyuncu: { ...s0.oyuncu, can: 1 }, dusman: { ...s0.dusman, guc: 500 } },
      { tur: 'saldir' },
      sabit(0.99),
    );
    expect(s.sonuc).toBe('yenilgi');
    expect(s.oyuncu.can).toBe(0);
    const { durum: sonra, ozet } = savasSonucunuUygula(durum, s);
    expect(ozet).toMatchObject({ sonuc: 'yenilgi', akceKaybi: 10, xp: 0 });
    expect(sonra.akce).toBe(95);
    expect(sonra.konum).toBe(41);
    expect(sonra.oyuncu.can).toBe(90);
    expect(sonra.oyuncu.nefes).toBe(40);
  });

  it('bayılma akçesi olmayan oyuncuda da çalışır', () => {
    const { durum, akceKaybi } = bayilmaUygula({ ...yeniOyunDurumu({ ad: 'A', sinif: 'alperen' }), akce: 0 });
    expect(akceKaybi).toBe(0);
    expect(durum.akce).toBe(0);
  });

  it('kaçışta can ve nefes korunur, XP verilmez', () => {
    const durum = yeniOyunDurumu({ ad: 'A', sinif: 'akinci' });
    const s0 = savasBaslat(durum.oyuncu, dusmanOlustur('ac_kurt', 1));
    const s = oyuncuEylemi({ ...s0, oyuncu: { ...s0.oyuncu, can: 70, nefes: 12 } }, { tur: 'kac' }, sabit(0));
    const { durum: sonra, ozet } = savasSonucunuUygula(durum, s);
    expect(ozet.sonuc).toBe('kacis');
    expect(sonra.oyuncu).toMatchObject({ can: 70, nefes: 12, xp: 0 });
  });

  it('bitmemiş savaş durumu değiştirmez', () => {
    const durum = yeniOyunDurumu({ ad: 'A', sinif: 'akinci' });
    const s = savasBaslat(durum.oyuncu, dusmanOlustur('ac_kurt', 1));
    expect(savasSonucunuUygula(durum, s)).toEqual({ durum, ozet: null });
  });
});

describe('tam savaş (sabit tohum)', () => {
  function savasOyna(tohum, sinif = 'akinci', dusman = 'ac_kurt') {
    const rng = rastgeleUreteci(tohum);
    let s = savasBaslat(yeniKarakter('A', sinif), dusmanOlustur(dusman, 1));
    while (!s.sonuc) s = oyuncuEylemi(s, { tur: 'saldir' }, rng);
    return s;
  }

  it('aynı tohum aynı savaşı üretir', () => {
    expect(savasOyna(123).gunluk).toEqual(savasOyna(123).gunluk);
  });

  it('dengeleme: Sv 1 Akıncı, Sv 1 Aç Kurt\'u ortalama 3–5 turda yener', () => {
    const N = 500;
    let toplamTur = 0;
    let zafer = 0;
    for (let t = 1; t <= N; t++) {
      const s = savasOyna(t);
      toplamTur += s.tur - 1;
      if (s.sonuc === 'zafer') zafer++;
    }
    const ortalama = toplamTur / N;
    expect(ortalama).toBeGreaterThanOrEqual(3);
    expect(ortalama).toBeLessThanOrEqual(5);
    expect(zafer).toBe(N);
  });

  it('üç sınıf da Sv 1 Aç Kurt\'u yenebilir', () => {
    for (const sinif of ['akinci', 'kemankes', 'alperen']) {
      let zafer = 0;
      for (let t = 1; t <= 100; t++) if (savasOyna(t, sinif).sonuc === 'zafer') zafer++;
      expect(zafer, sinif).toBeGreaterThanOrEqual(95);
    }
  });
});

describe('savaş günlüğü metinleri', () => {
  it('olaylar Türkçe cümlelere çevrilir', () => {
    const s = savasBaslat(yeniKarakter('A', 'akinci'), dusmanOlustur('yol_kesen_cin', 2));
    expect(olayMetni({ tip: 'baslangic' }, s).metin).toBe('Yol Kesen Cin (Sv 2) yolunu kesti!');
    expect(olayMetni({ tip: 'saldiri', kim: 'oyuncu', hasar: 9, kritik: true }, s).metin).toBe('Saldırdın: 9 hasar. Kritik vuruş!');
    expect(olayMetni({ tip: 'saldiri', kim: 'dusman', hasar: 4 }, s).metin).toBe('Yol Kesen Cin saldırdı: 4 hasar aldın.');
    expect(olayMetni({ tip: 'yetenek', yetenek: 'kilic_darbesi', hasar: 14 }, s).metin).toBe('Kılıç Darbesi: 14 hasar.');
    expect(olayMetni({ tip: 'yemek', yemek: 'hosmerim', yenilenen: 'nefes', miktar: 15 }, s).metin).toBe('Höşmerim yedin: 15 nefes yeniledin.');
    expect(olayMetni({ tip: 'zafer', xp: 25 }, s).metin).toBe('Yol Kesen Cin üzerindeki sihir bozuldu, dağılıp gitti.');
  });

  it('gerçek bir savaşın her olayı boş olmayan bir cümleye dönüşür', () => {
    for (const [sinif, dusman] of [['akinci', 'zeytinlik_hortlagi'], ['alperen', 'yol_kesen_cin'], ['kemankes', 'tas_dev']]) {
      const rng = rastgeleUreteci(9);
      let s = savasBaslat(seviyeliKarakter(sinif, 12), dusmanOlustur(dusman, 10));
      const eylemler = [{ tur: 'yetenek', anahtar: s.oyuncu.yetenekler[1] }, { tur: 'saldir' }, { tur: 'yetenek', anahtar: s.oyuncu.yetenekler[2] }];
      for (let i = 0; !s.sonuc && i < 40; i++) {
        const yeni = oyuncuEylemi(s, eylemler[i % eylemler.length], rng);
        s = yeni === s ? oyuncuEylemi(s, { tur: 'saldir' }, rng) : yeni;
      }
      for (const olay of s.gunluk) {
        const { metin } = olayMetni(olay, s);
        expect(metin.length, JSON.stringify(olay)).toBeGreaterThan(5);
        expect(metin).not.toMatch(/\{\w+\}|undefined|NaN/);
      }
    }
  });
});
