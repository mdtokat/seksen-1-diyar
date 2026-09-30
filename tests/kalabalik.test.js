import { describe, it, expect } from 'vitest';
import {
  TOPLU_HASAR_CARPANI,
  EN_COK_SALDIRGAN,
  TOPLU_KACMA_CEZASI,
  dusmanOlustur,
  savasBaslat,
  oyuncuEylemi,
  eylemKontrol,
  hedefSec,
  canlilar,
  kalabalikMi,
  kacmaSansi,
  yetenekBul,
} from '../src/oyun/savas.js';
import { kesifSonucunuUygula } from '../src/oyun/kesif.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import { yeniKarakter, xpEkle, gerekenXp, statlar } from '../src/oyun/karakter.js';
import { gorevAl } from '../src/oyun/gorevler.js';
import { gorevler } from '../src/veri/gorevler.js';
import { dusmanlar as dusmanVerisi } from '../src/veri/dusmanlar.js';
import { iller } from '../src/veri/iller.js';
import {
  SURU,
  TOPLU_SALDIRI,
  ilHaritasiUret,
  dusmanlariYerlestir,
  dusmanSayisi,
  suruUyeleri,
  saldiriGrubu,
  mesafe,
} from '../src/oyun/gezinti.js';
import { olayMetni, yaratikAdi } from '../src/arayuz/savasEkrani.js';
import { rastgeleUreteci } from '../src/oyun/rastgele.js';

// 0.99 → kaçınma yok, kritik yok, özel hamle yok, rnd ≈ 1.098 · 0 → her şans tutar
const sabit = (x) => () => x;

function karakter(sinif, seviye = 1) {
  let o = yeniKarakter('Test', sinif);
  while (o.seviye < seviye) o = xpEkle(o, gerekenXp(o.seviye)).oyuncu;
  const s = statlar(o);
  return { ...o, can: s.can, nefes: s.nefes };
}

const kurt = (seviye = 3) => dusmanOlustur('ac_kurt', seviye);
const grupSavasi = (n = 3, { oyuncu = karakter('akinci', 5), seviye = 3 } = {}) =>
  savasBaslat(oyuncu, kurt(seviye), [], { yoldaslar: Array.from({ length: n - 1 }, () => kurt(seviye)) });

describe('savaş durumu: birden fazla yaratık', () => {
  it('tek yaratıklı savaş eskisi gibidir: numara yok, yoldaş yok', () => {
    const s = savasBaslat(karakter('akinci'), kurt());
    expect(kalabalikMi(s)).toBe(false);
    expect(s.yoldaslar).toEqual([]);
    expect(s.grup).toHaveLength(1);
    expect(s.dusman.no).toBeUndefined();
    expect(s.gunluk).toEqual([{ tip: 'baslangic' }]);
    const a = oyuncuEylemi(s, { tur: 'saldir' }, sabit(0.99));
    expect(a.gunluk.slice(1).every((o) => o.no === undefined)).toBe(true);
  });

  it('yaratıklar 1’den numaralanır, en çok üç yaratık; XP hepsinin toplamıdır', () => {
    const s = grupSavasi(3);
    expect(kalabalikMi(s)).toBe(true);
    expect(s.dusman.no).toBe(1);
    expect(s.yoldaslar.map((d) => d.no)).toEqual([2, 3]);
    expect(s.grup.map((d) => d.no)).toEqual([1, 2, 3]);
    expect(s.xpOdulu).toBe(3 * savasBaslat(karakter('akinci', 5), kurt()).xpOdulu);
    const fazla = savasBaslat(karakter('akinci'), kurt(), [], { yoldaslar: [kurt(), kurt(), kurt(), kurt()] });
    expect(fazla.grup).toHaveLength(EN_COK_SALDIRGAN);
    expect(canlilar(s).map((d) => d.no)).toEqual([1, 2, 3]);
  });

  it('canlı her yaratık her turda saldırır ve olaylar yaratığın numarasını taşır', () => {
    const s = oyuncuEylemi(grupSavasi(3), { tur: 'saldir' }, sabit(0.99));
    const olaylar = s.gunluk.slice(1);
    expect(olaylar[0]).toMatchObject({ tip: 'saldiri', kim: 'oyuncu', no: 1 });
    const saldirilar = olaylar.filter((o) => o.kim === 'dusman');
    expect(saldirilar.map((o) => o.no)).toEqual([1, 2, 3]);
    expect(saldirilar.every((o) => o.hasar > 0)).toBe(true);
  });

  it('kalabalıkta her yaratığın vuruşu, çarpan kadar zayıflar', () => {
    // Zayıf bir yiğit, güçlü yaratıklar: hasar en az 1 tabanına takılmasın
    const oyuncu = karakter('akinci', 1);
    const guclu = { oyuncu, seviye: 14 };
    const tek = oyuncuEylemi(savasBaslat(oyuncu, kurt(14)), { tur: 'saldir' }, sabit(0.99)).gunluk.at(-1).hasar;
    const iki = oyuncuEylemi(grupSavasi(2, guclu), { tur: 'saldir' }, sabit(0.99)).gunluk.filter((o) => o.kim === 'dusman');
    const uc = oyuncuEylemi(grupSavasi(3, guclu), { tur: 'saldir' }, sabit(0.99)).gunluk.filter((o) => o.kim === 'dusman');
    expect(iki).toHaveLength(2);
    expect(uc).toHaveLength(3);
    expect(iki[0].hasar).toBeLessThan(tek);
    expect(uc[0].hasar).toBeLessThan(iki[0].hasar);
    expect(TOPLU_HASAR_CARPANI[1]).toBe(1);
  });

  it('hedef seçilir; saldırı seçilen yaratığa gider, sıra harcanmaz', () => {
    const s0 = grupSavasi(3);
    const s = hedefSec(s0, 3);
    expect(s.dusman.no).toBe(3);
    expect(s.yoldaslar.map((d) => d.no)).toEqual([1, 2]);
    expect(s.tur).toBe(s0.tur);
    expect(s.gunluk).toBe(s0.gunluk);
    expect(hedefSec(s, 3)).toBe(s); // zaten hedef
    expect(hedefSec(s, 9)).toBe(s); // öyle yaratık yok
    const a = oyuncuEylemi(s, { tur: 'saldir' }, sabit(0.99));
    expect(a.gunluk[1]).toMatchObject({ kim: 'oyuncu', no: 3 });
    expect(canlilar(a).find((d) => d.no === 3).can).toBeLessThan(s.dusman.can);
    expect(canlilar(a).filter((d) => d.no !== 3).every((d) => d.can === d.canEnCok)).toBe(true);
    // Savaş bitince hedef değişmez
    expect(hedefSec({ ...s0, sonuc: 'kacis' }, 2).dusman.no).toBe(1);
  });

  it('düşen yaratığın yerine sıradaki hedef olur; son yaratık düşünce zafer gelir', () => {
    let s = grupSavasi(3);
    const zayif = (savas, no) => ({
      ...savas,
      dusman: savas.dusman.no === no ? { ...savas.dusman, can: 1 } : savas.dusman,
      yoldaslar: savas.yoldaslar.map((d) => (d.no === no ? { ...d, can: 1 } : d)),
    });
    s = oyuncuEylemi(zayif(s, 1), { tur: 'saldir' }, sabit(0.99));
    expect(s.gunluk.some((o) => o.tip === 'dusman_dustu' && o.no === 1)).toBe(true);
    expect(s.sonuc).toBeNull();
    expect(s.dusman.no).toBe(2);
    expect(s.dusenler.map((d) => d.no)).toEqual([1]);
    expect(canlilar(s).map((d) => d.no)).toEqual([2, 3]);
    // Kalan iki yaratık o turda yine saldırmıştır
    expect(s.gunluk.filter((o) => o.kim === 'dusman' && o.no === 1)).toHaveLength(0);
    expect(s.gunluk.filter((o) => o.kim === 'dusman').length).toBeGreaterThanOrEqual(2);

    s = oyuncuEylemi(zayif(s, 2), { tur: 'saldir' }, sabit(0.99));
    expect(s.dusman.no).toBe(3);
    s = oyuncuEylemi(zayif(s, 3), { tur: 'saldir' }, sabit(0.99));
    expect(s.sonuc).toBe('zafer');
    expect(s.gunluk.at(-1)).toEqual({ tip: 'zafer', xp: s.xpOdulu });
    expect(s.gunluk.filter((o) => o.tip === 'dusman_dustu').map((o) => o.no)).toEqual([1, 2, 3]);
    expect(eylemKontrol(s, { tur: 'saldir' })).toEqual({ olur: false, neden: 'bitti' });
  });

  it('oyuncu bayılırsa kalan yaratıklar vurmaz', () => {
    const s0 = grupSavasi(3);
    const s = oyuncuEylemi({ ...s0, oyuncu: { ...s0.oyuncu, can: 1 } }, { tur: 'saldir' }, sabit(0.99));
    expect(s.sonuc).toBe('yenilgi');
    expect(s.gunluk.filter((o) => o.kim === 'dusman')).toHaveLength(1);
  });

  it('korunma etkisi bütün yaratıklara karşı geçerlidir ve turda bir kez azalır', () => {
    const oyuncu = karakter('akinci', 1);
    const s0 = { ...grupSavasi(3, { oyuncu, seviye: 14 }), etkiler: [{ hedef: 'oyuncu', etki: 'savunma', deger: 0.5, kalan: 2 }] };
    const korunan = oyuncuEylemi(s0, { tur: 'saldir' }, sabit(0.99));
    const korumasiz = oyuncuEylemi({ ...s0, etkiler: [] }, { tur: 'saldir' }, sabit(0.99));
    const vurus = (s) => s.gunluk.filter((o) => o.kim === 'dusman');
    expect(vurus(korunan).every((o) => o.korundu)).toBe(true);
    expect(vurus(korunan)[2].hasar).toBeLessThan(vurus(korumasiz)[2].hasar);
    expect(korunan.etkiler).toEqual([{ hedef: 'oyuncu', etki: 'savunma', deger: 0.5, kalan: 1 }]);
  });
});

describe('kalabalıktan kaçış', () => {
  it('kalabalıkta kaçmak daha zordur; başarısız kaçışta hepsi saldırır', () => {
    const o = karakter('kemankes', 5);
    const tek = savasBaslat(o, kurt());
    const uc = grupSavasi(3, { oyuncu: o });
    // Şansı kaçış eşiğinin hemen altına ayarlayan üreteç: tek yaratıkta kaçılır, üçünde kaçılamaz
    const sans1 = Math.max(0, kacmaSansi(tek.oyuncu.ceviklik, tek.dusman.ceviklik, { takipci: true }));
    const sansUc = Math.max(0, kacmaSansi(uc.oyuncu.ceviklik, uc.dusman.ceviklik, { takipci: true }) - 2 * TOPLU_KACMA_CEZASI);
    expect(sansUc).toBeLessThan(sans1);
    const rng = (deger) => { let ilk = true; return () => (ilk ? ((ilk = false), deger) : 0.99); };
    const esik = (sans1 + sansUc) / 2;
    expect(oyuncuEylemi(tek, { tur: 'kac' }, rng(esik)).sonuc).toBe('kacis');
    const basarisiz = oyuncuEylemi(uc, { tur: 'kac' }, rng(esik));
    expect(basarisiz.sonuc).toBeNull();
    expect(basarisiz.gunluk[1]).toEqual({ tip: 'kacis', basarili: false });
    expect(basarisiz.gunluk.filter((x) => x.kim === 'dusman')).toHaveLength(3);
  });

  it('içlerinde boss varsa kaçılamaz', () => {
    const boss = dusmanOlustur('bogaz_ejderi', 10);
    expect(boss.tur).toBe('boss');
    const s = savasBaslat(karakter('akinci', 5), kurt(), [], { yoldaslar: [boss] });
    expect(eylemKontrol(s, { tur: 'kac' })).toEqual({ olur: false, neden: 'kacilamaz' });
    expect(eylemKontrol(grupSavasi(2), { tur: 'kac' })).toEqual({ olur: true });
  });
});

describe('kalabalık savaşın ödülleri', () => {
  const zafer = (n, durum) => {
    let s = grupSavasi(n);
    for (let i = 0; i < 400 && !s.sonuc; i++) s = oyuncuEylemi(s, { tur: 'saldir' }, sabit(0.99));
    expect(s.sonuc).toBe('zafer');
    return { s, r: kesifSonucunuUygula(durum, s, 34, rastgeleUreteci(5)) };
  };
  const bas = () => ({ ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), oyuncu: karakter('akinci', 5) });

  it('düşürülen her yaratık ayrı ayrı XP, akçe ve arınma getirir', () => {
    const d = bas();
    const bir = zafer(1, d).r;
    const uc = zafer(3, d).r;
    expect(uc.ozet.xp).toBe(3 * bir.ozet.xp);
    expect(uc.ozet.akce).toBeGreaterThan(bir.ozet.akce);
    expect(uc.ozet.arinmaArtisi).toBeGreaterThanOrEqual(3 * 12);
    expect(uc.durum.arinma[34]).toBe(Math.min(100, uc.ozet.arinmaArtisi));
    expect(uc.durum.istatistik.zafer).toBe(1); // savaş tek zafer sayılır
    expect(uc.durum.akce).toBe(uc.ozet.akce);
  });

  it('yemekler ozet.yemekler listesinde toplanır', () => {
    const d = bas();
    let bulundu = false;
    for (let t = 1; t <= 40; t++) {
      let s = grupSavasi(3);
      while (!s.sonuc) s = oyuncuEylemi(s, { tur: 'saldir' }, sabit(0.99));
      const { ozet } = kesifSonucunuUygula(d, s, 34, rastgeleUreteci(t));
      expect(ozet.yemekler.length).toBeLessThanOrEqual(3);
      if (ozet.yemekler.length) {
        expect(ozet.yemek).toBe(ozet.yemekler[0].yemek);
        bulundu = true;
      }
    }
    expect(bulundu).toBe(true);
  });

  it('görev sayacı her yaratık için ilerler', () => {
    const anahtar = Object.keys(gorevler).find((a) => gorevler[a].tur === 'yen' && gorevler[a].dusman === 'ac_kurt' && gorevler[a].sayi >= 3);
    const d = gorevAl(bas(), anahtar);
    const r = zafer(3, d).r;
    expect(r.durum.gorevler[anahtar].sayac).toBe(3);
    expect(r.ozet.gorevIlerlemesi.filter((g) => g.anahtar === anahtar)).toHaveLength(1);
  });

  it('tek yaratıklı savaş eskisi gibi tek ödül verir', () => {
    const d = bas();
    const { r } = zafer(1, d);
    expect(r.ozet.arinmaArtisi).toBeGreaterThanOrEqual(12);
    expect(r.ozet.arinmaArtisi).toBeLessThanOrEqual(18);
  });
});

describe('haritada kalabalık saldırı ve sürüler', () => {
  const kayit = (id, x, y, ek = {}, dusman = kurt()) => ({ id, x, y, evX: x, evY: y, dusman, ...ek });
  const oyuncu = { x: 10, y: 10 };

  it('peşinde koşan yakın düşmanlar temas edene katılır; en çok üç yaratık', () => {
    const ilk = kayit(1, 10, 11);
    const yakin = kayit(2, 12, 10, { kovaliyor: true });
    const yanda = kayit(3, 9, 10); // koşmuyor ama hemen yanında
    const uzak = kayit(4, 10, 20, { kovaliyor: true });
    const kosmayan = kayit(5, 14, 10); // orta uzaklıkta, koşmuyor
    const g = saldiriGrubu([ilk, yakin, yanda, uzak, kosmayan], oyuncu, ilk);
    expect(g.map((d) => d.id)).toEqual([1, 3, 2]);
    expect(g.length).toBeLessThanOrEqual(EN_COK_SALDIRGAN);
    expect(saldiriGrubu([ilk, yakin, yanda, kayit(6, 11, 10, { kovaliyor: true })], oyuncu, ilk)).toHaveLength(3);
    expect(mesafe(uzak, oyuncu)).toBeGreaterThan(TOPLU_SALDIRI.yaricap);
  });

  it('bosslar ve gezgin bosslar tek başına çıkar, onlara kimse katılmaz', () => {
    const boss = kayit(1, 10, 11, { sabit: true, tur: 'boss' });
    const gezgin = kayit(2, 10, 11, {}, { ...kurt(), gezgin: true, tehlike: 'zorlu' });
    const yakin = kayit(3, 11, 10, { kovaliyor: true });
    expect(saldiriGrubu([boss, yakin], oyuncu, boss)).toEqual([boss]);
    expect(saldiriGrubu([gezgin, yakin], oyuncu, gezgin)).toEqual([gezgin]);
    const sabitYakin = kayit(4, 11, 10, { kovaliyor: true, sabit: true });
    const gezginYakin = kayit(5, 11, 11, { kovaliyor: true }, { ...kurt(), gezgin: true });
    const ilk = kayit(6, 10, 11);
    expect(saldiriGrubu([ilk, sabitYakin, gezginYakin], oyuncu, ilk)).toEqual([ilk]);
  });

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
    const takipsiz = Object.keys(dusmanVerisi).find((a) => !dusmanVerisi[a].takipci && dusmanVerisi[a].sinif === 'siradan');
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

describe('kalabalık savaş metinleri', () => {
  it('başlangıç, düşme ve zafer metinleri; aynı türden yaratıklar numaralanır', () => {
    const s = grupSavasi(3);
    expect(olayMetni({ tip: 'baslangic' }, s).metin).toBe('Aç Kurt 1, Aç Kurt 2 ve Aç Kurt 3 birlikte saldırıya geçti! Hepsi aynı anda vuruyor; kalabalıktan kaçmak daha zor.');
    expect(olayMetni({ tip: 'saldiri', kim: 'dusman', no: 2, hasar: 4 }, s).metin).toBe('Aç Kurt 2 saldırdı: 4 hasar aldın.');
    expect(olayMetni({ tip: 'saldiri', kim: 'oyuncu', no: 3, kacindi: true, hasar: 0 }, s).metin).toBe('Aç Kurt 3 hamlenden sıyrıldı.');
    expect(olayMetni({ tip: 'dusman_dustu', no: 1 }, s).metin).toBe('Aç Kurt 1 geri çekilip kaçtı.');
    expect(olayMetni({ tip: 'zafer', xp: 9 }, s).metin).toBe('Saldıran yaratıkların hepsini püskürttün!');
    expect(olayMetni({ tip: 'kacis', basarili: false }, s).metin).toBe('Kaçamadın! Yaratıklar yolunu kesti.');
    const karisik = savasBaslat(karakter('akinci'), kurt(), [], { yoldaslar: [dusmanOlustur('kirim_kurdu' in dusmanVerisi ? 'kirim_kurdu' : 'ac_kurt', 3)] });
    expect(yaratikAdi(karisik.grup[0], karisik)).toBe(karisik.grup[0].anahtar === karisik.grup[1].anahtar ? 'Aç Kurt 1' : 'Aç Kurt');
    // Tek yaratıkta ad numaralanmaz
    expect(yaratikAdi(kurt(), savasBaslat(karakter('akinci'), kurt()))).toBe('Aç Kurt');
  });
});
