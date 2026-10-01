import { describe, it, expect, afterEach } from 'vitest';
import {
  BASLANGIC,
  KADEMELER,
  KLASIK_ROTA,
  rotaOlustur,
  rotaGecerliMi,
  rotaBilgisi,
  rotaAyarla,
  baslangicAdaylari,
  baslangicBolgesiAdaylari,
  baslangicGecmisiniGuncelle,
  bolgelerKomsuMu,
  ilSeviyesi,
  bolgeSeviyesi,
  esyaBilgisi,
  dusmanCarpanlari,
  yemekCarpani,
} from '../src/oyun/rota.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import { bossYenildi, bossKosullari, finalKosullari, seyahatKontrol } from '../src/oyun/ilerleme.js';
import { yemekGucu, BASLANGIC_HEYBESI } from '../src/oyun/envanter.js';
import { karsilasmaUret } from '../src/oyun/kesif.js';
import { dusmanStatlari } from '../src/oyun/savas.js';
import { ilHaritasiUret, ozelDusmanlar } from '../src/oyun/gezinti.js';
import { goc, durumGecerliMi, kaydet, yukle, baslangicGecmisi, baslangicGecmisiniYaz } from '../src/oyun/kayit.js';
import { yemekler } from '../src/veri/yemekler.js';
import { bolgeler } from '../src/veri/bolgeler.js';
import { iller } from '../src/veri/iller.js';
import { esyalar } from '../src/veri/esyalar.js';
import { dusmanlar } from '../src/veri/dusmanlar.js';
import { rastgeleUreteci } from '../src/oyun/rastgele.js';

const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const bolgeHaritasi = new Map(bolgeler.map((b) => [b.anahtar, b]));
const bolgeIlleri = (a) => iller.filter((il) => il.bolge === a);

// Doğu Anadolu'dan, Tunceli'den başlayan örnek rota
const DOGU_ROTASI = {
  bolgeler: ['dogu_anadolu', 'karadeniz', 'marmara', 'ege', 'ic_anadolu', 'akdeniz', 'guneydogu'],
  baslangic: 62,
};

function sahteDepo() {
  const veri = new Map();
  return {
    getItem: (k) => (veri.has(k) ? veri.get(k) : null),
    setItem: (k, v) => veri.set(k, String(v)),
    removeItem: (k) => veri.delete(k),
  };
}

afterEach(() => rotaAyarla(null));

describe('rota üretimi', () => {
  it('hiçbir zaman Marmara\'dan başlamaz; başlangıç ili bölgenin küçük illerinden biridir', () => {
    const rng = rastgeleUreteci(3);
    const gorulen = new Set();
    for (let i = 0; i < 400; i++) {
      const r = rotaOlustur(rng);
      expect(rotaGecerliMi(r)).toBe(true);
      expect(r.bolgeler[0]).not.toBe('marmara');
      expect(baslangicAdaylari(r.bolgeler[0])).toContain(r.baslangic);
      gorulen.add(r.bolgeler[0]);
    }
    expect([...gorulen].sort()).toEqual(bolgeler.map((b) => b.anahtar).filter((a) => a !== 'marmara').sort());
  });

  it('başlangıç adayları, bossun ili dışında nüfusça en küçük iller', () => {
    for (const b of bolgeler) {
      const adaylar = baslangicAdaylari(b.anahtar);
      expect(adaylar, b.ad).toHaveLength(BASLANGIC.adayIlSayisi);
      expect(adaylar).not.toContain(b.bossIli);
      const enBuyukAday = Math.max(...adaylar.map((p) => ilHaritasi.get(p).nufus));
      const digerleri = bolgeIlleri(b.anahtar).filter((il) => !adaylar.includes(il.plaka) && il.plaka !== b.bossIli);
      for (const il of digerleri) expect(il.nufus, il.ad).toBeGreaterThan(enBuyukAday);
    }
    expect(baslangicAdaylari('dogu_anadolu')).toEqual(expect.arrayContaining([62, 75]));
    expect(baslangicAdaylari('karadeniz')).toContain(69);
    expect(baslangicAdaylari('guneydogu')).toContain(79);
  });

  it('her bölge, rotada kendinden önceki bölgelerden birine kara sınırıyla bağlıdır', () => {
    const rng = rastgeleUreteci(8);
    for (let i = 0; i < 200; i++) {
      const r = rotaOlustur(rng);
      expect(new Set(r.bolgeler).size).toBe(bolgeler.length);
      r.bolgeler.slice(1).forEach((a, k) => {
        expect(r.bolgeler.slice(0, k + 1).some((o) => bolgelerKomsuMu(a, o)), a).toBe(true);
      });
    }
  });

  it('yeni oyunlar, altı bölgenin hepsinden başlanmadan aynı bölgeden başlamaz', () => {
    const rng = rastgeleUreteci(21);
    let gecmis = [];
    let onceki = null;
    for (let tur = 0; tur < 4; tur++) {
      const buTur = [];
      for (let i = 0; i < 6; i++) {
        const r = rotaOlustur(rng, { gecmis });
        expect(r.bolgeler[0]).not.toBe(onceki);
        buTur.push(r.bolgeler[0]);
        onceki = r.bolgeler[0];
        gecmis = baslangicGecmisiniGuncelle(gecmis, r.bolgeler[0]);
      }
      expect(new Set(buTur).size, `tur ${tur}`).toBe(6);
    }
    expect(baslangicBolgesiAdaylari(['ege'])).not.toContain('ege');
    expect(baslangicBolgesiAdaylari(['ege'])).not.toContain('marmara');
  });

  it('bozuk rotaları reddeder', () => {
    expect(rotaGecerliMi(KLASIK_ROTA)).toBe(true);
    expect(rotaGecerliMi(DOGU_ROTASI)).toBe(true);
    expect(rotaGecerliMi(null)).toBe(false);
    expect(rotaGecerliMi({ bolgeler: DOGU_ROTASI.bolgeler.slice(1), baslangic: 62 })).toBe(false);
    expect(rotaGecerliMi({ bolgeler: ['dogu_anadolu', ...DOGU_ROTASI.bolgeler.slice(0, 6)], baslangic: 62 })).toBe(false);
    expect(rotaGecerliMi({ ...DOGU_ROTASI, baslangic: 34 })).toBe(false); // başlangıç ilk bölgede değil
  });
});

describe('klasik rota (eski kayıtlar)', () => {
  it('veri dosyalarındaki değerlerle birebir aynıdır', () => {
    const b = rotaBilgisi(KLASIK_ROTA);
    for (const il of iller) expect(b.ilSeviyeleri[il.plaka], il.ad).toEqual(il.seviye);
    for (const bolge of bolgeler) {
      expect(b.girisler[bolge.anahtar], bolge.ad).toBe(bolge.giris);
      expect(b.seviyeler[bolge.anahtar]).toEqual(bolge.seviye);
      expect(b.yemekCarpanlari[bolge.anahtar]).toBe(bolge.yemekCarpani);
    }
    for (const a of Object.keys(esyalar)) expect(esyaBilgisi(a, KLASIK_ROTA)).toBe(esyalar[a]);
    for (const a of Object.keys(dusmanlar)) expect(dusmanCarpanlari(a, KLASIK_ROTA)).toEqual(dusmanlar[a].carpan);
  });

  it('rota verilmeyen yeni oyun klasik rotayla İstanbul\'da başlar', () => {
    const d = yeniOyunDurumu({ ad: 'Alp', sinif: 'akinci' });
    expect(d.rota).toEqual({ bolgeler: [...KLASIK_ROTA.bolgeler], baslangic: 34 });
    expect(d.konum).toBe(34);
    expect(d.heybe).toEqual(BASLANGIC_HEYBESI);
  });
});

describe('rotaya göre seviye dağılımı', () => {
  it('rotanın k. bölgesi k. kademenin seviye aralığını alır; başlangıç ili en kolay ildir', () => {
    const rng = rastgeleUreteci(5);
    for (let i = 0; i < 60; i++) {
      const r = rotaOlustur(rng);
      const b = rotaBilgisi(r);
      r.bolgeler.forEach((a, k) => {
        const [alt, ust] = KADEMELER[k].seviye;
        expect(bolgeSeviyesi(a, r)).toEqual([alt, ust]);
        const seviyeler = bolgeIlleri(a).map((il) => ilSeviyesi(il.plaka, r));
        for (const [enAz, enCok] of seviyeler) {
          expect(enAz).toBeGreaterThanOrEqual(alt);
          expect(enCok).toBeLessThanOrEqual(ust);
          expect(enAz).toBeLessThan(enCok);
        }
        expect(Math.max(...seviyeler.map((s) => s[1]))).toBe(ust);
        expect(ilSeviyesi(b.girisler[a], r)[0], a).toBe(alt);
        expect(ilHaritasi.get(b.girisler[a]).bolge).toBe(a);
      });
      expect(ilSeviyesi(r.baslangic, r)[0]).toBe(1);
      expect(b.girisler[r.bolgeler[0]]).toBe(r.baslangic);
      // Sonraki bölgelerin girişi bir önceki bölgeye sınırdır (ya da önce açılan bir bölgeye)
      r.bolgeler.slice(1).forEach((a, k) => {
        const komsuBolgeler = ilHaritasi.get(b.girisler[a]).komsular.map((p) => ilHaritasi.get(p).bolge);
        expect(komsuBolgeler.some((kb) => r.bolgeler.slice(0, k + 1).includes(kb)), a).toBe(true);
      });
    }
  });

  it('düşmanlar, gezgin bosslar ve inlerdeki bosslar rotaya göre seviyelenir', () => {
    rotaAyarla(DOGU_ROTASI);
    const rng = rastgeleUreteci(2);
    for (let i = 0; i < 50; i++) {
      const d = karsilasmaUret(62, rng);
      expect(d.seviye).toBeGreaterThanOrEqual(ilSeviyesi(62)[0]);
      expect(d.seviye).toBeLessThanOrEqual(ilSeviyesi(62)[1]);
      expect(d.seviye).toBeLessThanOrEqual(10);
    }
    const durum = { ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci', rota: DOGU_ROTASI }) };
    const [boss] = ozelDusmanlar(ilHaritasiUret(65), durum);
    expect(boss.dusman.anahtar).toBe('van_golu_canavari');
    expect(boss.dusman.seviye).toBe(10);
    // Gücü de ilk kademenin bossunun (Boğaz Ejderi) çarpanlarıyla hesaplanır
    expect(dusmanStatlari('van_golu_canavari', 10)).toEqual(
      (() => { rotaAyarla(null); const s = dusmanStatlari('bogaz_ejderi', 10); rotaAyarla(DOGU_ROTASI); return s; })(),
    );
  });

  it('sıradan yaratıklar karakterlerini korur, ortalama güçleri kademeye çekilir', () => {
    rotaAyarla(DOGU_ROTASI);
    const ortalama = (liste, s) => liste.reduce((t, a) => t + dusmanCarpanlari(a)[s], 0) / liste.length;
    const dogu = ['karli_dag_kurdu', 'buz_cini', 'zulmetin_muhafizi'];
    const marmara = ['ac_kurt', 'cakal_surusu', 'yol_kesen_cin'];
    for (const s of ['can', 'guc', 'savunma', 'ceviklik']) {
      rotaAyarla(null);
      const klasikMarmara = ortalama(marmara, s);
      rotaAyarla(DOGU_ROTASI);
      expect(ortalama(dogu, s)).toBeCloseTo(klasikMarmara, 2);
    }
    // Muhafız yine kurttan zırhlı, kurt yine muhafızdan çevik
    expect(dusmanCarpanlari('zulmetin_muhafizi').savunma).toBeGreaterThan(dusmanCarpanlari('karli_dag_kurdu').savunma);
    expect(dusmanCarpanlari('karli_dag_kurdu').ceviklik).toBeGreaterThan(dusmanCarpanlari('zulmetin_muhafizi').ceviklik);
  });

  it('eşyalar ve yemekler kademeye göre ölçeklenir', () => {
    rotaAyarla(DOGU_ROTASI);
    // Doğu Anadolu ilk bölge: eşyaları seviye 1'de kuşanılır, gücü Marmara eşyalarına yakın
    for (const [a, e] of Object.entries(esyalar).filter(([, e]) => e.bolge === 'dogu_anadolu')) {
      const yeni = esyaBilgisi(a);
      expect(yeni.seviye, a).toBe(1);
      expect(yeni.fiyat).toBeLessThan(e.fiyat);
      const ikiz = Object.values(esyalar).find((m) => m.bolge === 'marmara' && m.yuva === e.yuva && m.sinif === e.sinif && m.nadirlik === e.nadirlik);
      if (ikiz) {
        for (const [s, v] of Object.entries(yeni.statlar)) {
          if (ikiz.statlar[s]) expect(Math.abs(v - ikiz.statlar[s]), `${a}.${s}`).toBeLessThanOrEqual(Math.max(2, ikiz.statlar[s] * 0.25));
        }
        expect(Math.abs(yeni.fiyat - ikiz.fiyat), a).toBeLessThanOrEqual(ikiz.fiyat * 0.25);
      }
    }
    // Marmara üçüncü bölge: eşyaları Akdeniz kademesinde
    expect(esyaBilgisi('edirne_kilici').seviye).toBe(15);
    expect(esyaBilgisi('edirne_kilici').statlar.guc).toBeGreaterThan(esyalar.edirne_kilici.statlar.guc);
    // Yemekler: Doğu Anadolu'nun yemekleri ilk kademenin çarpanını alır
    expect(yemekCarpani('dogu_anadolu')).toBe(1);
    expect(yemekCarpani('marmara')).toBe(2.2);
    const tunceliBali = Object.keys(yemekler).find((a) => yemekler[a].il === 62);
    rotaAyarla(null);
    const klasikGuc = yemekGucu(tunceliBali);
    rotaAyarla(DOGU_ROTASI);
    expect(yemekGucu(tunceliBali)).toBeLessThan(klasikGuc);
  });
});

describe('rotalı oyun', () => {
  const durum = () => yeniOyunDurumu({ ad: 'Alp', sinif: 'alperen', rota: DOGU_ROTASI });

  it('başlangıç ilinde, yalnızca ilk bölge açık başlar; heybede başlangıç ilinin yemeği var', () => {
    const d = durum();
    expect(d.konum).toBe(62);
    expect(d.acikBolgeler).toEqual(['dogu_anadolu']);
    expect(d.heybe[0]).toEqual({ anahtar: ilHaritasi.get(62).yemek, adet: 3 });
    expect(d.heybe).toHaveLength(2);
    expect(yemekler[d.heybe[1].anahtar].tur).not.toBe(yemekler[d.heybe[0].anahtar].tur);
    expect(ilHaritasi.get(yemekler[d.heybe[1].anahtar].il).bolge).toBe('dogu_anadolu');
    expect(d.toplananYemekler).toEqual(d.heybe.map((y) => y.anahtar));
    expect(seyahatKontrol({ ...d, konum: 24 }, 58)).toEqual({ olur: false, neden: 'kilitli_bolge' });
  });

  it('boss yenilince rotadaki sıradaki bölge açılır; Zülmet\'in kalesi son bölgenin bossunu bekler', () => {
    const d = durum();
    expect(bossKosullari(d, 'dogu_anadolu').gerekenSeviye).toBe(9);
    const r = bossYenildi(d, 'dogu_anadolu');
    expect(r.acilanBolge).toBe('karadeniz');
    expect(r.durum.acikBolgeler).toEqual(['dogu_anadolu', 'karadeniz']);
    expect(bossYenildi({ ...d, acikBolgeler: DOGU_ROTASI.bolgeler }, 'guneydogu').acilanBolge).toBeNull();
    const seviyeli = { ...d, oyuncu: { ...d.oyuncu, seviye: 50 } };
    expect(finalKosullari({ ...seviyeli, yenilenBosslar: ['dogu_anadolu'] }).olur).toBe(false);
    expect(finalKosullari({ ...seviyeli, yenilenBosslar: ['guneydogu'] }).olur).toBe(true);
  });
});

describe('kayıt', () => {
  it('sürüm 6 kayıtları klasik rotayla açılır; rotası bozuk kayıt reddedilir', () => {
    const { rota, ...eski } = yeniOyunDurumu({ ad: 'Alp', sinif: 'akinci' });
    const v = goc({ surum: 6, durum: eski });
    expect(v.durum.rota).toEqual({ bolgeler: [...KLASIK_ROTA.bolgeler], baslangic: 34 });
    expect(durumGecerliMi(v.durum)).toBe(true);
    expect(durumGecerliMi({ ...v.durum, rota: { bolgeler: ['ege'], baslangic: 64 } })).toBe(false);
    const depo = sahteDepo();
    const d = yeniOyunDurumu({ ad: 'Alp', sinif: 'akinci', rota: DOGU_ROTASI });
    kaydet(d, depo);
    expect(yukle(depo).rota).toEqual(DOGU_ROTASI);
  });

  it('başlangıç geçmişi saklanır; bozuk geçmiş boş sayılır', () => {
    const depo = sahteDepo();
    expect(baslangicGecmisi(depo)).toEqual([]);
    baslangicGecmisiniYaz(['ege', 'karadeniz'], depo);
    expect(baslangicGecmisi(depo)).toEqual(['ege', 'karadeniz']);
    depo.setItem('seksen-bir-diyar/baslangic-gecmisi', '{bozuk');
    expect(baslangicGecmisi(depo)).toEqual([]);
    expect(baslangicGecmisi(null)).toEqual([]);
  });
});

describe('veri', () => {
  it('her bölgenin bossu ve mini bossu kademe eşlemesi için bulunur', () => {
    for (const b of bolgeler) {
      expect(dusmanlar[b.boss].sinif).toBe('bolge_bossu');
      expect(dusmanlar[b.miniBoss].sinif).toBe('mini_boss');
      expect(bolgeHaritasi.get(b.anahtar)).toBe(b);
    }
  });
});
