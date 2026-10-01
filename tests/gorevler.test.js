import { describe, it, expect } from 'vitest';
import { gorevler, GOREV_TURLERI, GOREV_VERENLER } from '../src/veri/gorevler.js';
import { HAYIR, itibarKademeleri } from '../src/veri/itibar.js';
import { bolgeler } from '../src/veri/bolgeler.js';
import { iller } from '../src/veri/iller.js';
import { yemekler } from '../src/veri/yemekler.js';
import { dusmanlar } from '../src/veri/dusmanlar.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import {
  gorevDurumu,
  gorevIlerlemesi,
  gorevAl,
  gorevAlKontrol,
  gorevTamamla,
  gorevTamamlaKontrol,
  gorevOdulu,
  zaferIlerlemesi,
  hazirGorevler,
  teslimYeri,
  verenGorevleri,
  teslimEdilecekler,
  verenIsareti,
  GOREV_ODUL_CARPANI,
} from '../src/oyun/gorevler.js';
import {
  hayirPuani,
  hayirEkle,
  kademeSirasi,
  itibarKademesi,
  sonrakiKademe,
  arastaIndirimi,
  indirimliFiyat,
  hediyeKontrol,
  hediyeAl,
} from '../src/oyun/itibar.js';
import { arastaFiyati, yemekAl, yemekAlKontrol } from '../src/oyun/ticaret.js';
import { yemekAdedi, yemekFiyati, yemekCikar, HEYBE_YUVA } from '../src/oyun/envanter.js';
import { dusmanOlustur } from '../src/oyun/savas.js';
import { zaferUygula, yenilgiUygula } from '../src/oyun/kesif.js';
import { gerekenXp } from '../src/oyun/karakter.js';
import { goc, yukle, kaydet, durumGecerliMi, KAYIT_ANAHTARI, KAYIT_SURUMU } from '../src/oyun/kayit.js';
import { ilHaritasiUret, etkilesimTuru, ulasilabilir, yurunurMu } from '../src/oyun/gezinti.js';

const sabit = (x) => () => x;
const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const bolgeHaritasi = new Map(bolgeler.map((b) => [b.anahtar, b]));
const ISTANBUL = 34;
const KOCAELI = 41;
const SAKARYA = 54;
const TEKIRDAG = 59;
const BURSA = 16;

function durumYap(ek = {}) {
  return { ...yeniOyunDurumu({ ad: 'Alp', sinif: 'akinci' }), ...ek };
}

// Haritada yenilen düşman.
const yenilen = (anahtar, seviye = 1) => dusmanOlustur(anahtar, seviye);

function depo() {
  const veri = new Map();
  return { getItem: (k) => veri.get(k) ?? null, setItem: (k, v) => veri.set(k, String(v)), removeItem: (k) => veri.delete(k) };
}

describe('görev verisi', () => {
  const anahtarlar = Object.keys(gorevler);

  it('her bölgede en az 3 görev ve her türden en az biri var', () => {
    for (const b of bolgeler) {
      const bolgeninki = Object.values(gorevler).filter((g) => g.bolge === b.anahtar);
      expect(bolgeninki.length, b.ad).toBeGreaterThanOrEqual(3);
      for (const tur of GOREV_TURLERI) expect(bolgeninki.some((g) => g.tur === tur), `${b.ad} ${tur}`).toBe(true);
    }
  });

  it('alanlar geçerli: il bölgede, Ahi Babalar Ahi illerinde, hedefler tutarlı', () => {
    for (const a of anahtarlar) {
      const g = gorevler[a];
      const il = ilHaritasi.get(g.il);
      expect(il?.bolge, a).toBe(g.bolge);
      expect(GOREV_TURLERI, a).toContain(g.tur);
      expect(GOREV_VERENLER, a).toContain(g.veren);
      if (g.veren === 'ahi_baba') expect(bolgeHaritasi.get(g.bolge).ahiIlleri, a).toContain(g.il);
      for (const alan of ['ad', 'anlatim', 'tesekkur']) expect(g[alan]?.length, `${a}.${alan}`).toBeGreaterThan(10 * (alan !== 'ad'));
      if (g.tur === 'yen') {
        const d = dusmanlar[g.dusman];
        expect(d?.sinif, a).toBe('siradan');
        expect(d.bolge, a).toBe(g.bolge);
        expect(il.dusmanlar, `${a}: düşman veren ilde bulunmalı`).toContain(g.dusman);
        expect(g.sayi, a).toBeGreaterThanOrEqual(2);
      } else if (g.tur === 'arindir') {
        expect(ilHaritasi.get(g.hedefIl)?.bolge, a).toBe(g.bolge);
        expect(g.yuzde, a).toBeGreaterThan(0);
        expect(g.yuzde, a).toBeLessThanOrEqual(100);
      } else {
        expect(yemekler[g.yemek], a).toBeTruthy();
        expect(ilHaritasi.get(g.hedefIl)?.bolge, a).toBe(g.bolge);
        expect(g.hedefIl, a).not.toBe(g.il);
      }
    }
  });

  it('görev adları tekrarsız; bir görev vereni aynı ilde yalnızca bir kez görev verir', () => {
    const adlar = Object.values(gorevler).map((g) => g.ad);
    expect(new Set(adlar).size).toBe(adlar.length);
    const yerler = Object.values(gorevler).map((g) => `${g.il}/${g.veren}`);
    expect(new Set(yerler).size).toBe(yerler.length);
  });

  it('itibar kademeleri artan eşikli; indirim ve hediye azalmıyor', () => {
    expect(itibarKademeleri[0].esik).toBe(0);
    for (let i = 1; i < itibarKademeleri.length; i++) {
      const [o, k] = [itibarKademeleri[i - 1], itibarKademeleri[i]];
      expect(k.esik).toBeGreaterThan(o.esik);
      expect(k.indirim).toBeGreaterThanOrEqual(o.indirim);
      expect(k.hediye).toBeGreaterThanOrEqual(o.hediye);
    }
    expect(itibarKademeleri.some((k) => k.indirim > 0)).toBe(true);
    expect(itibarKademeleri.some((k) => k.hediye > 0)).toBe(true);
  });
});

describe('görev verenler il haritasında', () => {
  it('her ilde muhtar, Ahi esnafı olan illerde Ahi Baba var ve yürünerek ulaşılabilir', () => {
    for (const il of iller) {
      const h = ilHaritasiUret(il.plaka);
      const ulasilan = ulasilabilir(h, h.dogus);
      const yanindanUlasilir = (p) => [[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx, dy]) =>
        yurunurMu(h, p.x + dx, p.y + dy) && ulasilan.has((p.y + dy) * h.genislik + p.x + dx));
      expect(etkilesimTuru(h, h.muhtar.x, h.muhtar.y), il.ad).toBe('muhtar');
      expect(yanindanUlasilir(h.muhtar), il.ad).toBe(true);
      const ahi = bolgeHaritasi.get(il.bolge).ahiIlleri.includes(il.plaka);
      expect(Boolean(h.ahiBaba), il.ad).toBe(ahi);
      if (ahi) {
        expect(etkilesimTuru(h, h.ahiBaba.x, h.ahiBaba.y), il.ad).toBe('ahi_baba');
        expect(yanindanUlasilir(h.ahiBaba), il.ad).toBe(true);
      }
      // Bütün çıkışlar hâlâ meydandan ulaşılabilir
      for (const k of h.kapilar) expect(ulasilan.has(k.y * h.genislik + k.x), `${il.ad} → ${k.plaka}`).toBe(true);
    }
  });
});

describe('görev alma ve durumu', () => {
  it('bölgesi kapalı görev kilitli, açık bölgedeki alınabilir', () => {
    const d = durumYap();
    expect(gorevDurumu(d, 'bostanlarin_bekcisi')).toBe('alinabilir');
    expect(gorevDurumu(d, 'mesir_macunu')).toBe('kilitli');
    expect(gorevAlKontrol({ ...d, konum: 45 }, 'mesir_macunu')).toEqual({ olur: false, neden: 'kilitli_bolge' });
  });

  it('görev yalnızca verenin ilinde ve bir kez alınır', () => {
    const d = durumYap({ konum: KOCAELI });
    expect(gorevAlKontrol(d, 'bostanlarin_bekcisi')).toEqual({ olur: false, neden: 'yanlis_il' });
    expect(gorevAl(d, 'bostanlarin_bekcisi')).toBe(d);
    const d2 = gorevAl({ ...d, konum: ISTANBUL }, 'bostanlarin_bekcisi');
    expect(d2.gorevler.bostanlarin_bekcisi).toEqual({ durum: 'aktif', sayac: 0 });
    expect(gorevDurumu(d2, 'bostanlarin_bekcisi')).toBe('aktif');
    expect(gorevAlKontrol(d2, 'bostanlarin_bekcisi')).toEqual({ olur: false, neden: 'alindi' });
  });

  it('verenGorevleri ve teslim yeri', () => {
    expect(verenGorevleri(ISTANBUL, 'muhtar')).toEqual(['bostanlarin_bekcisi']);
    expect(verenGorevleri(BURSA, 'ahi_baba')).toEqual(['ipek_kervani']);
    expect(verenGorevleri(BURSA, 'muhtar')).toEqual([]);
    expect(teslimYeri('ipek_kervani')).toEqual({ il: BURSA, veren: 'ahi_baba' });
    expect(teslimYeri('komsuya_pismaniye')).toEqual({ il: SAKARYA, veren: 'muhtar' });
  });
});

describe('düşman yenme görevi', () => {
  it('yalnızca alındıktan sonra, doğru düşmana karşı zaferler sayılır; hedefte durur', () => {
    let d = durumYap();
    expect(zaferIlerlemesi(d, 'ac_kurt').ilerleyenler).toEqual([]); // alınmadan sayılmaz
    d = gorevAl(d, 'bostanlarin_bekcisi');
    expect(zaferIlerlemesi(d, 'yol_kesen_cin').ilerleyenler).toEqual([]);
    for (let i = 1; i <= 3; i++) {
      const z = zaferIlerlemesi(d, 'ac_kurt');
      expect(z.ilerleyenler).toEqual(['bostanlarin_bekcisi']);
      d = z.durum;
      expect(gorevIlerlemesi(d, 'bostanlarin_bekcisi')).toEqual({ mevcut: i, hedef: 3 });
    }
    expect(gorevDurumu(d, 'bostanlarin_bekcisi')).toBe('hazir');
    expect(hazirGorevler(d)).toEqual(['bostanlarin_bekcisi']);
    expect(zaferIlerlemesi(d, 'ac_kurt').ilerleyenler).toEqual([]);
  });

  it('haritadaki zafer görevi ilerletir ve hazır olunca bildirir', () => {
    let d = gorevAl(durumYap(), 'bostanlarin_bekcisi');
    d = { ...d, gorevler: { bostanlarin_bekcisi: { durum: 'aktif', sayac: 1 } } };
    const r1 = zaferUygula(d, yenilen('ac_kurt'), ISTANBUL, sabit(0.5));
    expect(r1.ozet.gorevIlerlemesi).toEqual([{ anahtar: 'bostanlarin_bekcisi', mevcut: 2, hedef: 3 }]);
    expect(r1.ozet.hazirOlanGorevler).toEqual([]);
    const r2 = zaferUygula(r1.durum, yenilen('ac_kurt'), ISTANBUL, sabit(0.5));
    expect(r2.ozet.hazirOlanGorevler).toEqual(['bostanlarin_bekcisi']);
    // Bayılınca görev ilerlemez
    expect(yenilgiUygula(d, ISTANBUL).durum.gorevler).toEqual(d.gorevler);
  });

  it('tamamlanınca ödül verilir, görev bir daha alınamaz; başka ilde teslim edilemez', () => {
    let d = gorevAl(durumYap(), 'bostanlarin_bekcisi');
    expect(gorevTamamlaKontrol(d, 'bostanlarin_bekcisi')).toEqual({ olur: false, neden: 'hazir_degil' });
    for (let i = 0; i < 3; i++) d = zaferIlerlemesi(d, 'ac_kurt').durum;
    expect(gorevTamamlaKontrol({ ...d, konum: KOCAELI }, 'bostanlarin_bekcisi')).toEqual({ olur: false, neden: 'yanlis_il' });
    const odul = gorevOdulu('bostanlarin_bekcisi');
    const r = gorevTamamla(d, 'bostanlarin_bekcisi');
    expect(r.odul).toEqual(odul);
    expect(r.durum.akce).toBe(d.akce + odul.akce);
    expect(hayirPuani(r.durum)).toBe(HAYIR.gorev.yen);
    expect(r.durum.oyuncu.seviye).toBeGreaterThan(1); // Sv 1'den ödül XP'siyle seviye atlanır
    expect(r.seviyeler.length).toBeGreaterThan(0);
    expect(gorevDurumu(r.durum, 'bostanlarin_bekcisi')).toBe('tamam');
    expect(gorevAlKontrol(r.durum, 'bostanlarin_bekcisi').neden).toBe('alindi');
    expect(gorevTamamla(r.durum, 'bostanlarin_bekcisi').odul).toBeNull();
  });
});

describe('arındırma görevi', () => {
  it('ilin arınması hedefe ulaşınca hazır olur', () => {
    let d = gorevAl(durumYap({ konum: TEKIRDAG, arinma: { [TEKIRDAG]: 40 } }), 'aycicegi_tarlalari');
    expect(gorevIlerlemesi(d, 'aycicegi_tarlalari')).toEqual({ mevcut: 40, hedef: 70 });
    expect(gorevDurumu(d, 'aycicegi_tarlalari')).toBe('aktif');
    d = { ...d, arinma: { [TEKIRDAG]: 100 } };
    expect(gorevIlerlemesi(d, 'aycicegi_tarlalari')).toEqual({ mevcut: 70, hedef: 70 });
    const r = gorevTamamla(d, 'aycicegi_tarlalari');
    expect(r.odul.hayir).toBe(HAYIR.gorev.arindir);
  });

  it('haritadaki zaferle eşik geçilince bildirilir', () => {
    const d = gorevAl(durumYap({ konum: TEKIRDAG, arinma: { [TEKIRDAG]: 65 } }), 'aycicegi_tarlalari');
    const r = zaferUygula(d, yenilen('ac_kurt'), TEKIRDAG, sabit(0.5));
    expect(r.durum.arinma[TEKIRDAG]).toBeGreaterThanOrEqual(70);
    expect(r.ozet.hazirOlanGorevler).toEqual(['aycicegi_tarlalari']);
  });
});

describe('ulaştırma görevi', () => {
  it('alınca yemek heybeye konur; heybe doluysa alınamaz', () => {
    const d = durumYap({ konum: KOCAELI });
    const d2 = gorevAl(d, 'komsuya_pismaniye');
    expect(yemekAdedi(d2.heybe, 'pismaniye')).toBe(1);
    expect(gorevDurumu(d2, 'komsuya_pismaniye')).toBe('hazir');
    const dolu = Array.from({ length: HEYBE_YUVA }, () => ({ anahtar: 'boyoz', adet: 10 }));
    expect(gorevAlKontrol({ ...d, heybe: dolu }, 'komsuya_pismaniye')).toEqual({ olur: false, neden: 'heybe_dolu' });
  });

  it('hedef ilin muhtarına teslim edilir, yemek heybeden çıkar', () => {
    const d = gorevAl(durumYap({ konum: KOCAELI }), 'komsuya_pismaniye');
    expect(gorevTamamlaKontrol(d, 'komsuya_pismaniye')).toEqual({ olur: false, neden: 'yanlis_il' });
    const orada = { ...d, konum: SAKARYA };
    expect(teslimEdilecekler(orada, SAKARYA)).toEqual(['komsuya_pismaniye']);
    expect(teslimEdilecekler(orada, KOCAELI)).toEqual([]);
    const r = gorevTamamla(orada, 'komsuya_pismaniye');
    expect(r.odul).toEqual(gorevOdulu('komsuya_pismaniye'));
    expect(yemekAdedi(r.durum.heybe, 'pismaniye')).toBe(0);
    expect(teslimEdilecekler(r.durum, SAKARYA)).toEqual([]);
  });

  it('yemek yenirse görev hazır sayılmaz; yenisi bulununca yeniden hazır olur', () => {
    const d = gorevAl(durumYap({ konum: KOCAELI }), 'komsuya_pismaniye');
    const yenmis = { ...d, heybe: yemekCikar(d.heybe, 'pismaniye'), konum: SAKARYA };
    expect(gorevDurumu(yenmis, 'komsuya_pismaniye')).toBe('aktif');
    expect(gorevTamamlaKontrol(yenmis, 'komsuya_pismaniye').neden).toBe('hazir_degil');
    expect(teslimEdilecekler(yenmis, SAKARYA)).toEqual(['komsuya_pismaniye']);
  });
});

describe('ödül', () => {
  it('veren ilin üst seviyesiyle ölçeklenir', () => {
    for (const a of Object.keys(gorevler)) {
      const sv = ilHaritasi.get(gorevler[a].il).seviye[1];
      expect(gorevOdulu(a)).toEqual({
        xp: Math.round((5 + sv * 10) * GOREV_ODUL_CARPANI.xp),
        akce: Math.round((3 + sv * 2) * GOREV_ODUL_CARPANI.akce),
        hayir: HAYIR.gorev[gorevler[a].tur],
      });
    }
    expect(gorevOdulu('mandira_yolu').xp).toBeGreaterThan(gorevOdulu('bostanlarin_bekcisi').xp);
  });

  it('bir görevin XP ödülü birkaç savaşa denk, bir seviyenin tamamını geçmez (Marmara sonrası)', () => {
    for (const a of Object.keys(gorevler)) {
      const sv = ilHaritasi.get(gorevler[a].il).seviye[1];
      if (sv < 10) continue;
      expect(gorevOdulu(a).xp, a).toBeLessThan(gerekenXp(sv));
    }
  });
});

describe('itibar (Hayır puanı)', () => {
  it('kademe ve sonraki kademe', () => {
    expect(kademeSirasi(0)).toBe(0);
    expect(kademeSirasi(24)).toBe(0);
    expect(kademeSirasi(25)).toBe(1);
    expect(kademeSirasi(10_000)).toBe(itibarKademeleri.length - 1);
    const d = hayirEkle(durumYap(), 80);
    expect(itibarKademesi(d).ad).toBe('Sevilen Yiğit');
    expect(sonrakiKademe(d).ad).toBe('Halkın Yiğidi');
    expect(sonrakiKademe(hayirEkle(durumYap(), 400))).toBeNull();
    expect(hayirPuani({})).toBe(0);
  });

  it('mazluma yardım: ili arındırmak ve mini bossu yenmek Hayır kazandırır', () => {
    const d = durumYap({ konum: KOCAELI, arinma: { [KOCAELI]: 95 } });
    const r = zaferUygula(d, yenilen('cakal_surusu'), KOCAELI, sabit(0.5));
    expect(r.ozet.arindi).toBe(true);
    expect(r.ozet.hayir).toBe(HAYIR.ilArindi);
    expect(hayirPuani(r.durum)).toBe(HAYIR.ilArindi);
    const r2 = zaferUygula(r.durum, yenilen('cakal_surusu'), KOCAELI, sabit(0.5));
    expect(r2.ozet.hayir).toBe(0); // zaten arınmış

    const m = durumYap({ konum: BURSA, arinma: { [BURSA]: 60 } });
    const rm = zaferUygula(m, yenilen('gulyabani', 9), BURSA, sabit(0.5));
    expect(rm.ozet.miniBossYenildi).toBe(true);
    expect(rm.ozet.hayir).toBe(HAYIR.miniBoss);
  });

  it('yüksek itibar arastada indirim sağlar; alışveriş indirimli fiyattan yapılır', () => {
    const d = durumYap({ akce: 100 });
    expect(arastaIndirimi(d)).toBe(0);
    expect(arastaFiyati(d, 'balik_ekmek')).toBe(yemekFiyati('balik_ekmek'));
    const itibarli = hayirEkle(d, 400);
    expect(arastaIndirimi(itibarli)).toBe(0.2);
    expect(arastaFiyati(itibarli, 'balik_ekmek')).toBe(Math.round(yemekFiyati('balik_ekmek') * 0.8));
    expect(indirimliFiyat(itibarli, 1)).toBe(1);
    const alinmis = yemekAl(itibarli, 'balik_ekmek');
    expect(alinmis.akce).toBe(100 - arastaFiyati(itibarli, 'balik_ekmek'));
    // İndirim akçesi yetmeyen oyuncunun alabilmesini sağlar
    const fakir = { ...itibarli, akce: arastaFiyati(itibarli, 'balik_ekmek') };
    expect(yemekAlKontrol(fakir, 'balik_ekmek').olur).toBe(true);
    expect(yemekAlKontrol({ ...d, akce: fakir.akce }, 'balik_ekmek').neden).toBe('akce_yetersiz');
  });

  it('köylülerin hediyesi: yeterli itibarla her ilde bir kez, adet unvanla artar', () => {
    const d = durumYap();
    expect(hediyeKontrol(d)).toEqual({ olur: false, neden: 'itibar_yetersiz' });
    const sevilen = hayirEkle(d, 75);
    expect(hediyeKontrol(sevilen)).toEqual({ olur: true, adet: 1 });
    const r = hediyeAl(sevilen);
    expect(r.adet).toBe(1);
    expect(r.yemek).toBe('balik_ekmek');
    expect(yemekAdedi(r.durum.heybe, 'balik_ekmek')).toBe(yemekAdedi(d.heybe, 'balik_ekmek') + 1);
    expect(hediyeKontrol(r.durum)).toEqual({ olur: false, neden: 'alindi' });
    expect(hediyeAl(r.durum).durum).toBe(r.durum);
    expect(hediyeKontrol({ ...r.durum, konum: KOCAELI }).olur).toBe(true); // başka il
    expect(hediyeAl(hayirEkle(d, 400)).adet).toBe(3);
    const dolu = Array.from({ length: HEYBE_YUVA }, () => ({ anahtar: 'boyoz', adet: 10 }));
    expect(hediyeKontrol({ ...sevilen, heybe: dolu })).toEqual({ olur: false, neden: 'heybe_dolu' });
  });

  it('görev verenin başındaki işaret', () => {
    const d = durumYap();
    expect(verenIsareti(d, ISTANBUL, 'muhtar')).toBe('yeni');
    expect(verenIsareti(d, ISTANBUL, 'ahi_baba')).toBeNull();
    let a = gorevAl(d, 'bostanlarin_bekcisi');
    expect(verenIsareti(a, ISTANBUL, 'muhtar')).toBeNull();
    for (let i = 0; i < 3; i++) a = zaferIlerlemesi(a, 'ac_kurt').durum;
    expect(verenIsareti(a, ISTANBUL, 'muhtar')).toBe('hazir');
    const u = gorevAl({ ...d, konum: KOCAELI }, 'komsuya_pismaniye');
    expect(verenIsareti(u, SAKARYA, 'muhtar')).toBe('hazir');
    expect(verenIsareti(hayirEkle(d, 75), SAKARYA, 'muhtar')).toBe('hediye');
    expect(verenIsareti(d, SAKARYA, 'muhtar')).toBeNull();
  });
});

describe('kayıt (şema sürüm 4)', () => {
  it('sürüm 3 kaydı görevler, Hayır ve hediyelerle taşınır', () => {
    const { gorevler: _g, hayir: _h, hediyeAlinan: _a, ...eski } = durumYap();
    const v = goc({ surum: 3, durum: eski });
    expect(v.surum).toBe(KAYIT_SURUMU);
    expect(v.durum).toMatchObject({ gorevler: {}, hayir: 0, hediyeAlinan: [] });
    expect(durumGecerliMi(v.durum)).toBe(true);
  });

  it('görevli durum kaydedilip aynen yüklenir; bozuk görev kaydı reddedilir', () => {
    const dp = depo();
    let d = gorevAl(durumYap(), 'bostanlarin_bekcisi');
    d = { ...zaferIlerlemesi(d, 'ac_kurt').durum, hayir: 30, hediyeAlinan: [34] };
    d = { ...d, gorevler: { ...d.gorevler, ipek_kervani: { durum: 'tamam' } } };
    expect(kaydet(d, dp)).toBe(true);
    expect(yukle(dp)).toEqual(d);
    const bozuklar = [
      { ...d, gorevler: { yok_boyle_gorev: { durum: 'aktif', sayac: 0 } } },
      { ...d, gorevler: { bostanlarin_bekcisi: { durum: 'aktif' } } },
      { ...d, gorevler: { bostanlarin_bekcisi: { durum: 'belki' } } },
      { ...d, hayir: -1 },
      { ...d, hediyeAlinan: [999] },
    ];
    for (const b of bozuklar) {
      dp.setItem(KAYIT_ANAHTARI, JSON.stringify({ surum: KAYIT_SURUMU, durum: b }));
      expect(yukle(dp)).toBeNull();
    }
  });
});
