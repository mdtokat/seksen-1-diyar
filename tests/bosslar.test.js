import { describe, it, expect } from 'vitest';
import {
  bolgeArinmaOrtalamasi,
  bossKosullari,
  bossDurumu,
  acikBosslar,
  yeniAcilanBosslar,
  bossYenildi,
  sofraGucCarpani,
  sofraTuket,
  miniBossVarMi,
  seyahatKontrol,
  SOFRA,
} from '../src/oyun/ilerleme.js';
import { dusmanOlustur, oyuncuHamlesi, dusmanHamlesi, ozelHamleler, savasci } from '../src/oyun/savas.js';
import { zaferUygula } from '../src/oyun/kesif.js';
import { dusmanlarVurur } from '../src/oyun/catisma.js';
import { ilHaritasiUret, ozelDusmanlar, ozelDusmanlariGuncelle, dusmanlariYurut, dogusNoktalari, mesafe, meydandaMi } from '../src/oyun/gezinti.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import { yeniKarakter, xpEkle, gerekenXp, statlar } from '../src/oyun/karakter.js';
import { goc, yukle, KAYIT_ANAHTARI, KAYIT_SURUMU } from '../src/oyun/kayit.js';
import { rastgeleUreteci } from '../src/oyun/rastgele.js';
import { iller } from '../src/veri/iller.js';
import { bolgeler } from '../src/veri/bolgeler.js';
import { dusmanlar } from '../src/veri/dusmanlar.js';

const sabit = (x) => () => x;
const MARMARA = iller.filter((il) => il.bolge === 'marmara').map((il) => il.plaka);

function seviyeli(sinif, seviye) {
  let o = yeniKarakter('A', sinif);
  while (o.seviye < seviye) o = xpEkle(o, gerekenXp(o.seviye)).oyuncu;
  return o;
}

function durumYap({ arinma = 0, seviye = 1, ...ek } = {}) {
  const d = yeniOyunDurumu({ ad: 'A', sinif: 'akinci' });
  return {
    ...d,
    arinma: Object.fromEntries(MARMARA.map((p) => [p, arinma])),
    oyuncu: seviyeli('akinci', seviye),
    ...ek,
  };
}

describe('boss açılma koşulu', () => {
  it('bölgenin ortalama arınması hesaplanır', () => {
    expect(bolgeArinmaOrtalamasi(durumYap({ arinma: 60 }), 'marmara')).toBe(60);
    const d = { ...yeniOyunDurumu(), arinma: { 34: 100, 41: 100 } };
    expect(bolgeArinmaOrtalamasi(d, 'marmara')).toBeCloseTo(200 / 11);
  });

  it('eşik yuvarlanmaz: %59,5 ortalama yetmez', () => {
    const d = durumYap({ arinma: 60, seviye: 9 });
    const eksik = { ...d, arinma: { ...d.arinma, 34: 54.5 } }; // (10 × 60 + 54,5) / 11 = 59,5
    expect(bossKosullari(eksik, 'marmara')).toMatchObject({ arinma: 59, olur: false });
  });

  it('ortalama arınma en az %60 VE seviye en az (üst seviye − 1) olunca boss açılır', () => {
    expect(bossDurumu(durumYap({ arinma: 60, seviye: 9 }), 'marmara')).toBe('acik');
    expect(bossDurumu(durumYap({ arinma: 59, seviye: 9 }), 'marmara')).toBe('muhurlu');
    expect(bossDurumu(durumYap({ arinma: 100, seviye: 8 }), 'marmara')).toBe('muhurlu');
    expect(bossKosullari(durumYap({ arinma: 30, seviye: 5 }), 'marmara')).toEqual({
      arinma: 30, gerekenArinma: 60, seviye: 5, gerekenSeviye: 9, olur: false,
    });
  });

  it('kilitli bölgenin bossu açılmaz; yenilen boss yenilmiş sayılır', () => {
    expect(bossDurumu(durumYap({ arinma: 100, seviye: 30 }), 'ege')).toBe('kilitli_bolge');
    expect(bossDurumu(durumYap({ arinma: 100, seviye: 30, yenilenBosslar: ['marmara'] }), 'marmara')).toBe('yenildi');
  });

  it('yeni açılan bosslar bildirim için ayırt edilir', () => {
    const once = durumYap({ arinma: 55, seviye: 9 });
    const sonra = durumYap({ arinma: 60, seviye: 9 });
    expect(acikBosslar(once)).toEqual([]);
    expect(yeniAcilanBosslar(once, sonra)).toEqual(['marmara']);
    expect(yeniAcilanBosslar(sonra, sonra)).toEqual([]);
  });
});

describe('bölge kilidi açılışı', () => {
  it('boss yenilince sıradaki bölge açılır ve oraya gidilebilir hâle gelir', () => {
    const d = { ...durumYap({ arinma: 60, seviye: 9 }), konum: 11 }; // Bilecik → Eskişehir sınırı
    expect(seyahatKontrol(d, 43).olur).toBe(false); // Kütahya (Ege) kilitli
    const { durum, acilanBolge } = bossYenildi(d, 'marmara');
    expect(acilanBolge).toBe('ege');
    expect(durum.acikBolgeler).toEqual(['marmara', 'ege']);
    expect(durum.yenilenBosslar).toEqual(['marmara']);
    expect(seyahatKontrol(durum, 43).olur).toBe(true);
    expect(seyahatKontrol(durum, 26).olur).toBe(false); // Eskişehir (İç Anadolu) hâlâ kilitli
  });

  it('bölgeler sırayla açılır; son bölgeden sonra yeni bölge yoktur', () => {
    let d = durumYap();
    for (const b of [...bolgeler].sort((a, c) => a.sira - c.sira)) {
      expect(d.acikBolgeler.at(-1)).toBe(b.anahtar);
      const r = bossYenildi(d, b.anahtar);
      d = r.durum;
      if (b.sira === 7) expect(r.acilanBolge).toBeNull();
    }
    expect(d.acikBolgeler).toHaveLength(7);
  });
});

describe('zafer sofrası', () => {
  it('boss yenilince can ve nefes dolar, 10 zafer boyunca %10 güç bonusu başlar', () => {
    const d = durumYap({ arinma: 60, seviye: 9 });
    const yarali = { ...d, oyuncu: { ...d.oyuncu, can: 5, nefes: 0 } };
    const { durum } = bossYenildi(yarali, 'marmara');
    const s = statlar(durum.oyuncu);
    expect(durum.oyuncu.can).toBe(s.can);
    expect(durum.oyuncu.nefes).toBe(s.nefes);
    expect(durum.sofra).toEqual({ bolge: 'marmara', kalan: SOFRA.zafer });
    expect(sofraGucCarpani(durum)).toBeCloseTo(1.1);
    expect(sofraGucCarpani(d)).toBe(1);
  });

  it('sofra savaşta gücü %10 artırır', () => {
    const d = durumYap({ arinma: 60, seviye: 9 });
    const sofrali = { ...d, sofra: { bolge: 'marmara', kalan: 3 } };
    expect(savasci(sofrali).guc).toBe(Math.round(savasci(d).guc * 1.1));
  });

  it('yenilen her düşman sofradan bir zafer düşürür, 10 zafer sonra biter', () => {
    let d = bossYenildi(durumYap({ arinma: 60, seviye: 9 }), 'marmara').durum;
    for (let i = 0; i < SOFRA.zafer; i++) {
      expect(d.sofra).not.toBeNull();
      d = zaferUygula(d, dusmanOlustur('ac_kurt', 1), 41, sabit(0.99)).durum;
    }
    expect(d.sofra).toBeNull();
    expect(sofraTuket({ sofra: null })).toEqual({ sofra: null });
  });
});

describe('boss savaşları', () => {
  it('her boss ve mini bossun en az bir özel hamlesi var', () => {
    for (const b of bolgeler) {
      expect(dusmanlar[b.boss].ozelHamleler.length, b.boss).toBeGreaterThan(0);
      expect(dusmanlar[b.miniBoss].ozelHamleler.length, b.miniBoss).toBeGreaterThan(0);
      expect(ozelHamleler(dusmanOlustur(b.boss, 10))).toBe(dusmanlar[b.boss].ozelHamleler);
    }
    expect(ozelHamleler(dusmanOlustur('ac_kurt', 1))[0].ad).toBe('Azgın Saldırı');
  });

  it('boss kendi özel hamlesini kullanır', () => {
    // 0.1: özel hamle şansı tutar.
    const r = dusmanHamlesi(durumYap({ arinma: 0, seviye: 9 }), dusmanOlustur('bogaz_ejderi', 10), sabit(0.1));
    expect(r.olay.tip).toBe('ozel_hamle');
    expect(dusmanlar.bogaz_ejderi.ozelHamleler.map((h) => h.ad)).toContain(r.olay.hamle);
  });

  it('bölge bossu canı yarının altına düşünce bir kez güçlenir; toparlanınca güçlenmesi söner', () => {
    const d = durumYap({ arinma: 0, seviye: 9 });
    const boss = dusmanOlustur('bogaz_ejderi', 10);
    const yarim = { ...boss, can: Math.floor(boss.canEnCok / 2) + 5 };
    const r = oyuncuHamlesi(d, { tur: 'saldir' }, sabit(0.99), { hedef: yarim });
    expect(r.hedef.evre).toBe(true);
    expect(r.olaylar).toContainEqual({ tip: 'evre', kim: 'dusman' });
    expect(r.hedef.guc).toBe(Math.round(boss.guc * 1.3));
    const r2 = oyuncuHamlesi(d, { tur: 'saldir' }, sabit(0.99), { hedef: r.hedef });
    expect(r2.olaylar.filter((o) => o.tip === 'evre')).toHaveLength(0);
    expect(r2.hedef.guc).toBe(r.hedef.guc);
    // Güçlenen boss daha sert vurur
    expect(dusmanHamlesi(d, r.hedef, sabit(0.99)).olay.hasar).toBeGreaterThan(dusmanHamlesi(d, boss, sabit(0.99)).olay.hasar);
  });

  it('mini bosslar güçlenme evresine girmez', () => {
    const mini = { ...dusmanOlustur('gulyabani', 9), can: 20 };
    const r = oyuncuHamlesi(durumYap({ arinma: 0, seviye: 9 }), { tur: 'saldir' }, sabit(0.99), { hedef: mini });
    expect(r.hedef.evre).toBeFalsy();
  });

  it('boss zaferi bölgeyi açar ve sofrayı kurar', () => {
    const d = { ...durumYap({ arinma: 60, seviye: 9 }), konum: 34 };
    const { durum, ozet } = zaferUygula(d, dusmanOlustur('bogaz_ejderi', 10), 34, sabit(0.5));
    expect(ozet).toMatchObject({ bossYenildi: 'marmara', acilanBolge: 'ege' });
    expect(durum.acikBolgeler).toContain('ege');
    expect(durum.sofra.kalan).toBe(SOFRA.zafer);
  });
});

describe('mini bosslar', () => {
  it('her bölgede 1–2 mini boss ili var, bölgenin kendi illeri ve boss ili değil', () => {
    for (const b of bolgeler) {
      expect(b.miniBossIlleri.length).toBeGreaterThanOrEqual(1);
      expect(b.miniBossIlleri.length).toBeLessThanOrEqual(2);
      expect(dusmanlar[b.miniBoss].sinif).toBe('mini_boss');
      expect(dusmanlar[b.miniBoss].bolge).toBe(b.anahtar);
      for (const p of b.miniBossIlleri) {
        expect(iller.find((il) => il.plaka === p).bolge).toBe(b.anahtar);
        expect(p).not.toBe(b.bossIli);
      }
    }
  });

  it('ilin arınması %50\'yi geçince çıkar, yenilince bir daha çıkmaz', () => {
    const d = yeniOyunDurumu({ ad: 'A', sinif: 'akinci' });
    expect(miniBossVarMi({ ...d, arinma: { 16: 50 } }, 16)).toBe(false);
    expect(miniBossVarMi({ ...d, arinma: { 16: 51 } }, 16)).toBe(true);
    expect(miniBossVarMi({ ...d, arinma: { 41: 90 } }, 41)).toBe(false); // mini boss ili değil
    expect(miniBossVarMi({ ...d, arinma: { 16: 90 }, yenilenMiniBosslar: [16] }, 16)).toBe(false);
  });

  it('eşik geçilince zafer mini bossun belirdiğini bildirir; mini boss zaferi kaydedilir', () => {
    const d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), konum: 16, arinma: { 16: 45 } };
    const r = zaferUygula(d, dusmanOlustur('cakal_surusu', 6), 16, sabit(0.5));
    expect(r.ozet.miniBossBelirdi).toBe('gulyabani');
    const r2 = zaferUygula(r.durum, dusmanOlustur('gulyabani', 9), 16, sabit(0.5));
    expect(r2.ozet.miniBossYenildi).toBe(true);
    expect(r2.durum.yenilenMiniBosslar).toEqual([16]);
  });
});

describe('boss inleri (gezinti)', () => {
  it('her ilin ini açık bir karoda, meydandan ve çıkışlardan uzakta', () => {
    for (const il of iller) {
      const h = ilHaritasiUret(il.plaka);
      expect(meydandaMi(h, h.in), il.ad).toBe(false);
      expect(mesafe(h.in, h.dogus), il.ad).toBeGreaterThanOrEqual(6);
      for (const k of h.kapilar) expect(mesafe(h.in, k), il.ad).toBeGreaterThanOrEqual(4);
      for (const n of dogusNoktalari(h)) expect(mesafe(n, h.in)).toBeGreaterThanOrEqual(4);
    }
  });

  it('boss, yenilene dek kendi ilinin ininde bekler; mini boss eşik geçilince belirir', () => {
    const istanbul = ilHaritasiUret(34);
    const d = yeniOyunDurumu({ ad: 'A', sinif: 'akinci' });
    const [boss] = ozelDusmanlar(istanbul, d);
    expect(boss).toMatchObject({ id: 'boss', sabit: true, tur: 'boss', x: istanbul.in.x, y: istanbul.in.y });
    expect(boss.dusman).toMatchObject({ anahtar: 'bogaz_ejderi', seviye: 10 });
    expect(ozelDusmanlar(istanbul, { ...d, yenilenBosslar: ['marmara'] })).toEqual([]);
    const bursa = ilHaritasiUret(16);
    expect(ozelDusmanlar(bursa, d)).toEqual([]);
    const [mini] = ozelDusmanlar(bursa, { ...d, arinma: { 16: 60 } });
    expect(mini).toMatchObject({ id: 'mini', tur: 'mini' });
    expect(mini.dusman.anahtar).toBe('gulyabani');
    expect(ozelDusmanlar(ilHaritasiUret(41), { ...d, arinma: { 41: 100 } })).toEqual([]);
  });

  it('bosslar ininden ayrılmaz ama menziline gireni vurur', () => {
    const h = ilHaritasiUret(34);
    const d = yeniOyunDurumu({ ad: 'A', sinif: 'akinci' });
    const [boss] = ozelDusmanlar(h, d);
    const oyuncu = { x: boss.x, y: boss.y + 2 };
    const [sonra] = dusmanlariYurut(h, [boss], oyuncu, rastgeleUreteci(1));
    expect(sonra).toMatchObject({ x: boss.x, y: boss.y });
    const vur = (o) => {
      let ds = [{ ...boss, bekleme: 1 }];
      let n = 0;
      for (let i = 0; i < 8; i++) {
        const r = dusmanlarVurur(h, d, ds, o, sabit(0.99));
        ds = r.dusmanlar;
        n += r.olaylar.length;
      }
      return n;
    };
    // Boss yanındaki karolara erişir (bölge bossunun menzili 2), uzaktakine erişmez
    const yan = [[0, 1], [1, 0], [0, -1], [-1, 0]].map(([dx, dy]) => ({ x: boss.x + dx, y: boss.y + dy }));
    expect(vur(yan.find((p) => h.karolar[p.y * h.genislik + p.x] !== 3) ?? yan[0])).toBeGreaterThan(0);
    expect(vur({ x: boss.x, y: boss.y + 9 })).toBe(0);
  });

  it('inlerdeki bosslar güncellenirken hâlâ inde bekleyenin canı korunur', () => {
    const h = ilHaritasiUret(16);
    const d = { ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), arinma: { 16: 60 } };
    const [mini] = ozelDusmanlar(h, d);
    const yarali = { ...mini, dusman: { ...mini.dusman, can: 5 } };
    const kurt = { id: 1, x: 3, y: 3, dusman: dusmanOlustur('ac_kurt', 3) };
    expect(ozelDusmanlariGuncelle(h, [kurt, yarali], d)).toEqual([kurt, yarali]);
    // Mini boss yenilince inden kalkar; sıradan düşmanlar yerinde kalır
    expect(ozelDusmanlariGuncelle(h, [kurt, yarali], { ...d, yenilenMiniBosslar: [16] })).toEqual([kurt]);
    // Eşik yeni geçildiyse mini boss inine gelir
    expect(ozelDusmanlariGuncelle(h, [kurt], d).map((x) => x.id)).toEqual([1, 'mini']);
  });
});

describe('kayıt göçü (sürüm 1 → güncel)', () => {
  it('eski kayıt yeni alanlarla yüklenir', () => {
    const d = yeniOyunDurumu({ ad: 'Eski', sinif: 'alperen' });
    // Sürüm 1 kaydında Faz 7 ve Faz 8 alanları yoktu
    const { yenilenBosslar, yenilenMiniBosslar, sofra, esyalar, sonKervansaray, ...eski } = d;
    const { kusanilan, ...eskiOyuncu } = d.oyuncu;
    eski.oyuncu = eskiOyuncu;
    const v = goc({ surum: 1, durum: eski });
    expect(v.surum).toBe(KAYIT_SURUMU);
    expect(v.durum).toMatchObject({ yenilenBosslar: [], yenilenMiniBosslar: [], sofra: null, esyalar: [], sonKervansaray: null });
    expect(v.durum.oyuncu.kusanilan).toEqual({ silah: null, zirh: null, aksesuar: null });
    const depo = new Map([[KAYIT_ANAHTARI, JSON.stringify({ surum: 1, durum: eski })]]);
    const yuklenen = yukle({ getItem: (k) => depo.get(k) ?? null });
    expect(yuklenen.oyuncu.ad).toBe('Eski');
    expect(yuklenen.yenilenBosslar).toEqual([]);
  });
});
