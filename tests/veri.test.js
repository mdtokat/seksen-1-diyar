import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { iller } from '../src/veri/iller.js';
import { bolgeler, final } from '../src/veri/bolgeler.js';
import { yemekler, YEMEK_TABANI } from '../src/veri/yemekler.js';
import { dusmanlar, DUSMAN_TURLERI, OZEL_HAMLELER, SINIF_XP_CARPANI, TAKIP_TURLERI } from '../src/veri/dusmanlar.js';
import { siniflar, STAT_PUANI_DEGERI } from '../src/veri/siniflar.js';
import { metinler } from '../src/veri/metinler.js';
import { esyalar } from '../src/veri/esyalar.js';
import { gorevler } from '../src/veri/gorevler.js';
import { itibarKademeleri } from '../src/veri/itibar.js';
import { basarimlar } from '../src/veri/basarimlar.js';
import { ilSeviyeleriniHesapla, bolgeIciMesafeler } from '../src/oyun/ilerleme.js';

const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const plakaBul = (ad) => iller.find((il) => il.ad === ad).plaka;
const adlar = (plakalar) => plakalar.map((p) => ilHaritasi.get(p).ad).sort();

describe('iller', () => {
  it('tam 81 il var, plakalar 1–81 arası ve tekrarsız', () => {
    expect(iller).toHaveLength(81);
    const plakalar = iller.map((il) => il.plaka).sort((a, b) => a - b);
    expect(plakalar).toEqual(Array.from({ length: 81 }, (_, i) => i + 1));
    expect(new Set(iller.map((il) => il.ad)).size).toBe(81);
  });

  it('bölge başına il sayıları doğru', () => {
    const beklenen = {
      marmara: 11, ege: 8, akdeniz: 8, ic_anadolu: 13,
      karadeniz: 18, guneydogu: 9, dogu_anadolu: 14,
    };
    for (const [bolge, sayi] of Object.entries(beklenen)) {
      expect(iller.filter((il) => il.bolge === bolge), bolge).toHaveLength(sayi);
    }
  });

  it('koordinatlar Türkiye sınırları içinde', () => {
    for (const il of iller) {
      expect(il.lat, il.ad).toBeGreaterThan(35.8);
      expect(il.lat, il.ad).toBeLessThan(42.2);
      expect(il.lon, il.ad).toBeGreaterThan(25.6);
      expect(il.lon, il.ad).toBeLessThan(44.9);
    }
  });

  it('komşuluklar geçerli, tekrarsız ve kendini içermiyor', () => {
    for (const il of iller) {
      expect(new Set(il.komsular).size, il.ad).toBe(il.komsular.length);
      expect(il.komsular, il.ad).not.toContain(il.plaka);
      for (const k of il.komsular) expect(ilHaritasi.has(k), `${il.ad} → ${k}`).toBe(true);
    }
  });

  it('komşuluk simetrik', () => {
    for (const il of iller) {
      for (const k of il.komsular) {
        expect(ilHaritasi.get(k).komsular, `${il.ad} ↔ ${ilHaritasi.get(k).ad}`).toContain(il.plaka);
      }
    }
  });

  it('tüm iller tek bir bağlı çizge oluşturuyor', () => {
    const gorulen = new Set([34]);
    const kuyruk = [34];
    while (kuyruk.length) {
      for (const k of ilHaritasi.get(kuyruk.shift()).komsular) {
        if (!gorulen.has(k)) {
          gorulen.add(k);
          kuyruk.push(k);
        }
      }
    }
    expect(gorulen.size).toBe(81);
  });

  it('her bölge kendi içinde bağlı (giriş ilinden tüm illere ulaşılıyor)', () => {
    for (const bolge of bolgeler) {
      const mesafeler = bolgeIciMesafeler(iller, bolge);
      const bolgeIlSayisi = iller.filter((il) => il.bolge === bolge.anahtar).length;
      expect(Object.keys(mesafeler), bolge.ad).toHaveLength(bolgeIlSayisi);
    }
  });

  it('İstanbul\'un komşuları tam olarak Kırklareli, Tekirdağ, Kocaeli', () => {
    expect(adlar(ilHaritasi.get(34).komsular)).toEqual(['Kırklareli', 'Kocaeli', 'Tekirdağ'].sort());
  });

  it('Ankara\'nın komşuları tam olarak plandaki 7 il', () => {
    const beklenen = ['Çankırı', 'Kırıkkale', 'Kırşehir', 'Aksaray', 'Konya', 'Eskişehir', 'Bolu'];
    expect(adlar(ilHaritasi.get(6).komsular)).toEqual(beklenen.sort());
  });

  it('bilinen bazı kara sınırları doğru', () => {
    const komsu = (a, b) => ilHaritasi.get(plakaBul(a)).komsular.includes(plakaBul(b));
    expect(komsu('Çanakkale', 'Edirne')).toBe(true);
    expect(komsu('Kocaeli', 'Yalova')).toBe(true);
    expect(komsu('Hakkari', 'Van')).toBe(true);
    expect(komsu('Kilis', 'Gaziantep')).toBe(true);
    expect(komsu('Amasya', 'Yozgat')).toBe(true);
    expect(komsu('Bilecik', 'Kocaeli')).toBe(true);
    expect(komsu('Bursa', 'Sakarya')).toBe(false);
    expect(komsu('Çorum', 'Tokat')).toBe(false);
    expect(komsu('Mardin', 'Siirt')).toBe(false);
    // Deniz geçişi yok
    expect(komsu('İstanbul', 'Yalova')).toBe(false);
    expect(komsu('İstanbul', 'Bursa')).toBe(false);
    expect(komsu('Balıkesir', 'Tekirdağ')).toBe(false);
    expect(ilHaritasi.get(plakaBul('Kilis')).komsular).toEqual([27]);
  });

  it('her ilin geçerli bir yemeği var ve yemeğin ili o il', () => {
    for (const il of iller) {
      expect(yemekler[il.yemek], `${il.ad}: ${il.yemek}`).toBeDefined();
      expect(yemekler[il.yemek].il, il.ad).toBe(il.plaka);
    }
    expect(new Set(iller.map((il) => il.yemek)).size).toBe(81);
  });

  it('her ilin kendi bölgesinden 2–3 sıradan düşmanı var', () => {
    for (const il of iller) {
      expect(il.dusmanlar.length, il.ad).toBeGreaterThanOrEqual(2);
      expect(il.dusmanlar.length, il.ad).toBeLessThanOrEqual(3);
      for (const anahtar of il.dusmanlar) {
        const d = dusmanlar[anahtar];
        expect(d, `${il.ad}: ${anahtar}`).toBeDefined();
        expect(d.bolge, `${il.ad}: ${anahtar}`).toBe(il.bolge);
        expect(d.sinif, `${il.ad}: ${anahtar}`).toBe('siradan');
      }
    }
  });

  it('seviye aralıkları BFS kuralıyla hesaplanan değerlerle aynı', () => {
    const hesaplanan = ilSeviyeleriniHesapla(iller, bolgeler);
    for (const il of iller) {
      expect(il.seviye, `${il.ad} — iller.js yeniden hesaplanmalı`).toEqual(hesaplanan[il.plaka]);
    }
  });

  it('seviye aralıkları bölge aralığı içinde ve giriş ili en düşük', () => {
    for (const bolge of bolgeler) {
      const bolgeIlleri = iller.filter((il) => il.bolge === bolge.anahtar);
      for (const il of bolgeIlleri) {
        expect(il.seviye[0], il.ad).toBeLessThan(il.seviye[1]);
        expect(il.seviye[0], il.ad).toBeGreaterThanOrEqual(bolge.seviye[0]);
        expect(il.seviye[1], il.ad).toBeLessThanOrEqual(bolge.seviye[1]);
      }
      expect(ilHaritasi.get(bolge.giris).seviye[0]).toBe(bolge.seviye[0]);
      expect(Math.max(...bolgeIlleri.map((il) => il.seviye[1]))).toBe(bolge.seviye[1]);
    }
    expect(ilHaritasi.get(34).seviye).toEqual([1, 3]);
  });
});

describe('bölgeler', () => {
  it('7 bölge doğru sırada ve plandaki değerlerle tanımlı', () => {
    const beklenen = [
      ['marmara', [1, 10], 34, 'bogaz_ejderi', 34, 1.0],
      ['ege', [8, 18], 45, 'yelbegen', 35, 1.5],
      ['akdeniz', [15, 25], 7, 'sahmeran', 33, 2.2],
      ['ic_anadolu', [20, 32], 42, 'albasti', 50, 3.0],
      ['karadeniz', [28, 40], 14, 'karakoncolos', 61, 4.0],
      ['guneydogu', [35, 45], 27, 'tepegoz', 63, 5.0],
      ['dogu_anadolu', [42, 50], 44, 'van_golu_canavari', 65, 6.0],
    ];
    expect(bolgeler).toHaveLength(7);
    beklenen.forEach(([anahtar, seviye, giris, boss, bossIli, carpan], i) => {
      const b = bolgeler[i];
      expect(b.sira).toBe(i + 1);
      expect([b.anahtar, b.seviye, b.giris, b.boss, b.bossIli, b.yemekCarpani])
        .toEqual([anahtar, seviye, giris, boss, bossIli, carpan]);
      expect(b.renk).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('giriş ve boss illeri kendi bölgesinde, bosslar tanımlı', () => {
    for (const b of bolgeler) {
      expect(ilHaritasi.get(b.giris).bolge, b.ad).toBe(b.anahtar);
      expect(ilHaritasi.get(b.bossIli).bolge, b.ad).toBe(b.anahtar);
      expect(dusmanlar[b.boss].tur, b.ad).toBe('boss');
      expect(dusmanlar[b.boss].sinif, b.ad).toBe('bolge_bossu');
      expect(dusmanlar[b.boss].bolge, b.ad).toBe(b.anahtar);
    }
  });

  it('final: Zülmet, Ağrı, seviye 48', () => {
    expect(final).toMatchObject({ boss: 'zulmet', il: 4, seviye: 48 });
    expect(final.dusmanSeviyesi).toBeGreaterThanOrEqual(final.seviye);
    expect(dusmanlar.zulmet.sinif).toBe('final');
  });
});

describe('yemekler', () => {
  it('81 yemek var, türü ve açıklaması geçerli', () => {
    expect(Object.keys(yemekler)).toHaveLength(81);
    for (const [anahtar, y] of Object.entries(yemekler)) {
      expect(['can', 'nefes'], anahtar).toContain(y.tur);
      expect(y.ad.length, anahtar).toBeGreaterThan(0);
      expect(y.aciklama.length, anahtar).toBeGreaterThan(10);
      expect(ilHaritasi.has(y.il), anahtar).toBe(true);
      expect(anahtar).toMatch(/^[a-z_]+$/);
    }
  });

  it('plandaki ⚠ işaretli 13 yemek teyit: false ile işaretli', () => {
    const teyitsiz = Object.values(yemekler)
      .filter((y) => y.teyit === false)
      .map((y) => y.il)
      .sort((a, b) => a - b);
    expect(teyitsiz).toEqual([11, 18, 30, 39, 40, 49, 62, 68, 69, 71, 73, 77, 81]);
  });

  it('taban değerler planla uyumlu', () => {
    expect(YEMEK_TABANI).toEqual({
      can: { guc: 30, fiyat: 20 },
      nefes: { guc: 15, fiyat: 15 },
    });
  });
});

describe('düşmanlar', () => {
  it('her düşmanın alanları geçerli', () => {
    const bolgeAnahtarlari = bolgeler.map((b) => b.anahtar);
    for (const [anahtar, d] of Object.entries(dusmanlar)) {
      expect(anahtar).toMatch(/^[a-z_]+$/);
      expect(DUSMAN_TURLERI, anahtar).toContain(d.tur);
      expect(['siradan', 'mini_boss', 'bolge_bossu', 'final', 'yankesici'], anahtar).toContain(d.sinif);
      // Yankesiciler her bölgede çıkar; bölgeleri yoktur
      if (d.sinif === 'yankesici') expect(d.bolge, anahtar).toBeUndefined();
      else expect(bolgeAnahtarlari, anahtar).toContain(d.bolge);
      if (d.sinif === 'siradan') expect(TAKIP_TURLERI, anahtar).toContain(d.takip);
      expect(d.aciklama.length, anahtar).toBeGreaterThan(10);
      for (const stat of ['can', 'guc', 'savunma', 'ceviklik']) {
        expect(d.carpan[stat], `${anahtar}.${stat}`).toBeGreaterThan(0);
      }
      if (d.sinif === 'bolge_bossu' || d.sinif === 'final') expect(d.tur, anahtar).toBe('boss');
    }
  });

  it('yaratıkların takip tavrı türden türe değişir: Marmara dışındaki her bölgede üç tavır da var', () => {
    for (const b of bolgeler.filter((x) => x.anahtar !== 'marmara')) {
      const tavirlar = Object.values(dusmanlar).filter((d) => d.bolge === b.anahtar && d.sinif === 'siradan').map((d) => d.takip);
      expect(new Set(tavirlar), b.ad).toEqual(new Set(TAKIP_TURLERI));
    }
  });

  it('her bölgede 3 sıradan düşman, en az 1 mini boss ve 1 boss var', () => {
    for (const b of bolgeler) {
      const bolgeninki = Object.values(dusmanlar).filter((d) => d.bolge === b.anahtar);
      expect(bolgeninki.filter((d) => d.sinif === 'siradan'), b.ad).toHaveLength(3);
      expect(bolgeninki.filter((d) => d.sinif === 'mini_boss').length, b.ad).toBeGreaterThanOrEqual(1);
      expect(bolgeninki.filter((d) => d.sinif === 'bolge_bossu'), b.ad).toHaveLength(1);
    }
  });

  it('her düşman türünün geçerli bir özel hamlesi var', () => {
    for (const tur of DUSMAN_TURLERI) {
      const h = OZEL_HAMLELER[tur];
      expect(h, tur).toBeDefined();
      expect(h.ad.length, tur).toBeGreaterThan(3);
      expect(['hasar', 'zayiflatma'], tur).toContain(h.etki);
      if (h.etki === 'hasar') expect(h.carpan, tur).toBeGreaterThan(1);
      else expect(h.sure, tur).toBeGreaterThan(0);
    }
  });

  it('her düşman sınıfının XP çarpanı var', () => {
    for (const d of Object.values(dusmanlar)) {
      expect(SINIF_XP_CARPANI[d.sinif], d.ad).toBeGreaterThan(0);
    }
  });
});

describe('sınıflar', () => {
  it('3 sınıf plandaki başlangıç statlarıyla tanımlı', () => {
    expect(siniflar.akinci.baslangic).toEqual({ can: 120, nefes: 30, guc: 12, savunma: 10, ceviklik: 6 });
    expect(siniflar.kemankes.baslangic).toEqual({ can: 90, nefes: 40, guc: 11, savunma: 6, ceviklik: 12 });
    expect(siniflar.alperen.baslangic).toEqual({ can: 85, nefes: 70, guc: 9, savunma: 7, ceviklik: 8 });
  });

  it('her sınıfın 7 yeteneği 1, 5, 12, 20, 32, 38, 45. seviyelerde açılıyor', () => {
    const beklenenAdlar = {
      akinci: ['Kılıç Darbesi', 'Kalkan Duruşu', 'Akın Hamlesi', 'Yiğit Nârası', 'Tufan Kılıcı', 'Kalkan Savuruşu', 'Akın Coşkusu'],
      kemankes: ['Nişan Oku', 'Çifte Ok', 'Ok Yağmuru', 'Kartal Gözü', 'Menzil Atışı', 'Yaylım Ateşi', 'Delici Ok'],
      alperen: ['Asa Darbesi', 'Şifa Nefesi', 'Hikmet Kalkanı', 'Arınma Işığı', 'Gönül Dirliği', 'Işık Çemberi', 'Çınar Sükûneti'],
    };
    for (const [anahtar, sinif] of Object.entries(siniflar)) {
      expect(sinif.yetenekler.map((y) => y.seviye)).toEqual([1, 5, 12, 20, 32, 38, 45]);
      expect(sinif.yetenekler.map((y) => y.ad)).toEqual(beklenenAdlar[anahtar]);
      expect(new Set(sinif.yetenekler.map((y) => y.anahtar)).size).toBe(7);
      for (const y of sinif.yetenekler) {
        expect(['hasar', 'savunma', 'sifa', 'guclenme', 'kritik', 'cosku'], y.ad).toContain(y.etki);
        if (y.etki === 'hasar') expect(y.carpan * (y.vurus ?? 1), y.ad).toBeGreaterThan(1);
        if (['savunma', 'guclenme', 'kritik', 'cosku'].includes(y.etki)) expect(y.sure, y.ad).toBeGreaterThan(0);
        if (y.etki !== 'hasar') expect(y.deger, y.ad).toBeGreaterThan(0);
        expect(y.nefes, y.ad).toBeGreaterThan(0);
      }
      for (const stat of ['can', 'nefes', 'guc', 'savunma', 'ceviklik']) {
        expect(sinif.seviyeArtisi[stat], `${anahtar}.${stat}`).toBeGreaterThan(0);
      }
    }
  });


  it('her sınıfın bilinen türde, açıklamalı bir pasif özelliği var', () => {
    const turler = { can_esigi: ['esik', 'guc'], uzak_nisan: ['uzaklik', 'hasar'], zafer_nefesi: ['nefes'] };
    const gorulen = new Set();
    for (const [anahtar, sinif] of Object.entries(siniflar)) {
      const p = sinif.pasif;
      expect(Object.keys(turler), anahtar).toContain(p.tur);
      expect(p.ad && p.aciklama && p.anahtar, anahtar).toBeTruthy();
      for (const alan of turler[p.tur]) expect(p[alan], `${anahtar}.${alan}`).toBeGreaterThan(0);
      gorulen.add(p.tur);
    }
    expect(gorulen.size).toBe(3);
  });
  it('her stat için stat puanı değeri tanımlı', () => {
    for (const stat of ['can', 'nefes', 'guc', 'savunma', 'ceviklik']) {
      expect(STAT_PUANI_DEGERI[stat], stat).toBeGreaterThan(0);
    }
  });

  it('Arınma Işığı cin ve ifritlere ek hasar veriyor', () => {
    const arinma = siniflar.alperen.yetenekler.find((y) => y.anahtar === 'arinma_isigi');
    expect(arinma.ekHasarTurleri).toEqual(['cin', 'ifrit']);
    expect(arinma.ekHasarCarpani).toBeGreaterThan(1);
  });
});

describe('kırmızı çizgiler (plan.md Bölüm 2)', () => {
  const tumVeri = JSON.stringify({ iller, bolgeler, final, yemekler, dusmanlar, OZEL_HAMLELER, siniflar, metinler, esyalar, gorevler, itibarKademeleri, basarimlar });
  const kelimeler = tumVeri.toLocaleLowerCase('tr').split(/[^\p{L}]+/u).filter(Boolean);
  const metin = kelimeler.join(' ');

  // Tam kelime olarak yasak olanlar ("bira" → "biraz" yanlış alarm vermesin)
  const yasakKelimeler = ['bira', 'birası', 'rakı', 'rakısı', 'viski', 'votka', 'likör', 'içki', 'sarhoş', 'meyhane', 'tanrı', 'tanrıça', 'ilah', 'ilahe', 'erlik', 'jambon', 'kumar', 'bahis', 'piyango', 'çark', 'sandık'];
  // Kök olarak yasak olanlar (çekimli biçimleri de yakalar)
  const yasakKokler = ['şarap', 'şarab', 'alkol', 'kumarhane', 'domuzeti', 'tanrısal'];
  // Kelime grupları
  const yasakGruplar = ['domuz eti', 'domuz yağı', 'domuz pastırması', 'şans kutusu', 'ganimet kutusu', 'sandık aç', 'yaratıcı tanrı'];

  it('yasaklı kelimeler hiçbir veride geçmiyor', () => {
    for (const k of kelimeler) {
      expect(yasakKelimeler, `yasak kelime: ${k}`).not.toContain(k);
      for (const kok of yasakKokler) expect(k.startsWith(kok), `yasak kök: ${k}`).toBe(false);
    }
    for (const grup of yasakGruplar) expect(metin, `yasak ifade: ${grup}`).not.toContain(grup);
  });

  it('tarama gerçekten çalışıyor (örnek metinle)', () => {
    const ornek = 'Biraz şarabı olan kumarhane'.toLocaleLowerCase('tr').split(/[^\p{L}]+/u);
    expect(ornek).not.toContain('bira');
    expect(ornek.some((k) => yasakKokler.some((kok) => k.startsWith(kok)))).toBe(true);
  });
});

describe('veri dosyaları', () => {
  const klasor = new URL('../src/veri/', import.meta.url);
  const dosyalar = readdirSync(klasor).filter((f) => f.endsWith('.js'));

  it('veri dosyalarında mantık kodu yok', () => {
    for (const dosya of dosyalar) {
      const kod = readFileSync(new URL(dosya, klasor), 'utf8').replace(/\/\/.*$/gm, '');
      expect(kod, dosya).not.toMatch(/\bfunction\b|=>|\bimport\b|\bif\s*\(|\bfor\s*\(|\breturn\b|\bclass\b/);
    }
  });

  it('dosya adları Türkçe karakter içermiyor', () => {
    for (const dosya of dosyalar) expect(dosya).toMatch(/^[a-zA-Z0-9_.]+$/);
  });
});
