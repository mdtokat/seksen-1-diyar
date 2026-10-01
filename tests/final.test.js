import { describe, it, expect } from 'vitest';
import { final, bolgeler } from '../src/veri/bolgeler.js';
import { iller } from '../src/veri/iller.js';
import { yemekler } from '../src/veri/yemekler.js';
import { gorevler } from '../src/veri/gorevler.js';
import { basarimlar } from '../src/veri/basarimlar.js';
import { dusmanlar } from '../src/veri/dusmanlar.js';
import { HAYIR } from '../src/veri/itibar.js';
import { yeniOyunDurumu, durumDeposu } from '../src/oyun/durum.js';
import { yeniKarakter, xpEkle, gerekenXp, statPuaniDagit, statlar } from '../src/oyun/karakter.js';
import { finalKosullari, finalDurumu, seyahatKontrol } from '../src/oyun/ilerleme.js';
import { dusmanOlustur, oyuncuHamlesi, dusmanHamlesi, eylemKontrol, ozelHamleler, savasci } from '../src/oyun/savas.js';
import { zaferUygula, istatistikYaz, karsilasmaUret } from '../src/oyun/kesif.js';
import { ilHaritasiUret, ozelDusmanlar } from '../src/oyun/gezinti.js';
import { KOSULLAR, oyunDurumunuIsle, yeniBasarimlar, yemekDefteriniGuncelle, basarimlariDenetle } from '../src/oyun/basarimlar.js';
import { goc, yukle, kaydet, durumGecerliMi, KAYIT_ANAHTARI, KAYIT_SURUMU } from '../src/oyun/kayit.js';
import { yemekEkle } from '../src/oyun/envanter.js';
import { rastgeleUreteci } from '../src/oyun/rastgele.js';
import { sesCal, SES_ADLARI } from '../src/arayuz/ses.js';

const sabit = (x) => () => x;
const AGRI = final.il;
const DOGU = iller.filter((il) => il.bolge === 'dogu_anadolu').map((il) => il.plaka);
const TUM_BOLGELER = bolgeler.map((b) => b.anahtar);

function seviyeli(sinif, seviye) {
  let o = yeniKarakter('A', sinif);
  while (o.seviye < seviye) o = xpEkle(o, gerekenXp(o.seviye)).oyuncu;
  return o;
}

function sonDurum({ seviye = 48, vanYenildi = true, ...ek } = {}) {
  return {
    ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }),
    konum: AGRI,
    acikBolgeler: TUM_BOLGELER,
    yenilenBosslar: vanYenildi ? TUM_BOLGELER : TUM_BOLGELER.filter((b) => b !== 'dogu_anadolu'),
    oyuncu: seviyeli('akinci', seviye),
    ...ek,
  };
}

function depo() {
  const veri = new Map();
  return { getItem: (k) => veri.get(k) ?? null, setItem: (k, v) => veri.set(k, String(v)), removeItem: (k) => veri.delete(k) };
}

describe('Ağrı Dağı\'ndaki kale', () => {
  it('Van Gölü Canavarı yenilip seviye 48 olunca açılır', () => {
    expect(finalDurumu(yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }))).toBe('kilitli_bolge');
    expect(finalDurumu(sonDurum({ vanYenildi: false }))).toBe('muhurlu');
    expect(finalDurumu(sonDurum({ seviye: 47 }))).toBe('muhurlu');
    expect(finalDurumu(sonDurum())).toBe('acik');
    expect(finalDurumu(sonDurum({ zulmetYenildi: true }))).toBe('yenildi');
    expect(finalKosullari(sonDurum({ seviye: 47, vanYenildi: false }))).toEqual({
      onkosulBossu: false, seviye: 47, gerekenSeviye: 48, olur: false,
    });
  });

  it('Zülmet Ağrı haritasında kalede bekler; yenilince kalkar', () => {
    const h = ilHaritasiUret(AGRI);
    const [z] = ozelDusmanlar(h, sonDurum({ seviye: 40 }));
    expect(z).toMatchObject({ id: 'final', tur: 'final', sabit: true, x: h.in.x, y: h.in.y });
    expect(z.dusman.anahtar).toBe('zulmet');
    expect(z.dusman.seviye).toBe(final.dusmanSeviyesi);
    expect(ozelDusmanlar(h, sonDurum())).toHaveLength(1);
    expect(ozelDusmanlar(h, sonDurum({ zulmetYenildi: true }))).toEqual([]);
    // Başka illerde Zülmet yoktur
    expect(ozelDusmanlar(ilHaritasiUret(36), sonDurum()).some((d) => d.tur === 'final')).toBe(false);
  });
});

describe('üç evreli final savaşı', () => {
  const zulmet = () => dusmanOlustur('zulmet', final.dusmanSeviyesi);
  const yigit = () => ({ ...yeniOyunDurumu({ ad: 'A', sinif: 'akinci' }), oyuncu: seviyeli('akinci', 48) });
  const vur = (hedef, rng = sabit(0.99)) => oyuncuHamlesi(yigit(), { tur: 'saldir' }, rng, { hedef });

  it('Zülmet\'in iki evre geçişi var; evreler güçlenerek ilerler', () => {
    const ev = dusmanlar.zulmet.evreler;
    expect(ev).toHaveLength(2);
    expect(ev[0].can).toBeGreaterThan(ev[1].can);
    for (const e of ev) {
      expect(e.guc).toBeGreaterThan(1);
      expect(e.ozelHamleler.length).toBeGreaterThan(0);
    }
  });

  it('canı eşiklerin altına düştükçe 2. ve 3. evreye geçer, gücü artar', () => {
    const z = zulmet();
    const s1 = vur({ ...z, can: Math.floor(z.canEnCok * 0.6) });
    expect(s1.hedef.evreNo).toBe(2);
    expect(s1.olaylar).toContainEqual({ tip: 'evre', kim: 'dusman', no: 2 });
    expect(s1.hedef.guc).toBe(Math.round(z.guc * dusmanlar.zulmet.evreler[0].guc));
    const s2 = vur({ ...s1.hedef, can: Math.floor(z.canEnCok * 0.3) });
    expect(s2.hedef.evreNo).toBe(3);
    expect(s2.olaylar).toContainEqual({ tip: 'evre', kim: 'dusman', no: 3 });
    // Aynı evreye bir daha geçilmez
    const s3 = vur(s2.hedef);
    expect(s3.olaylar.some((o) => o.tip === 'evre')).toBe(false);
    expect(s3.hedef.evreNo).toBe(3);
  });

  it('tek vuruşta iki eşik birden geçilirse doğrudan 3. evreye geçilir', () => {
    const s = vur({ ...zulmet(), can: Math.floor(zulmet().canEnCok * 0.2) });
    expect(s.hedef.evreNo).toBe(3);
    const ev = dusmanlar.zulmet.evreler;
    expect(s.hedef.guc).toBe(Math.round(Math.round(zulmet().guc * ev[0].guc) * ev[1].guc));
  });

  it('her evrede kendi özel hamlelerini kullanır', () => {
    expect(ozelHamleler(zulmet(), 1)).toEqual(dusmanlar.zulmet.ozelHamleler);
    expect(ozelHamleler(zulmet(), 3)).toEqual(dusmanlar.zulmet.evreler[1].ozelHamleler);
    expect(ozelHamleler({ ...zulmet(), evreNo: 3 })).toEqual(dusmanlar.zulmet.evreler[1].ozelHamleler);
    const r = dusmanHamlesi(yigit(), { ...zulmet(), evreNo: 3, evre: true }, sabit(0.01));
    expect(dusmanlar.zulmet.evreler[1].ozelHamleler.map((h) => h.ad)).toContain(r.olay.hamle);
  });

  // Yiğit ve Zülmet sırayla hamle eder (yiğidin her hamlesine Zülmet'in bir hamlesi).
  it('dengeleme: Sv 48, Doğu Anadolu nadir ekipmanıyla Zülmet\'i çoğunlukla 8–25 hamlede yenilir', () => {
    const EKIP = {
      akinci: ['erzurum_celigi_kilic', 'erzurum_deri_zirh', 'van_kilimi_kusak'],
      kemankes: ['kars_boynuz_yayi', 'erzurum_deri_zirh', 'van_kilimi_kusak'],
      alperen: ['oltu_tasi_basli_asa', 'erzurum_deri_zirh', 'van_kilimi_kusak'],
      baci: ['kars_kecesi_sapan', 'erzurum_deri_zirh', 'van_kilimi_kusak'],
    };
    const AI = { akinci: ['yigit_narasi', 'guclenme', 'tufan_kilici'], kemankes: ['kartal_gozu', 'kritik', 'menzil_atisi'], alperen: ['hikmet_kalkani', 'savunma', 'arinma_isigi'], baci: ['bacilarin_sancagi', 'guclenme', 'kement'] };
    for (const sinif of Object.keys(EKIP)) {
      let zafer = 0;
      let tur = 0;
      const N = 150;
      for (let n = 0; n < N; n++) {
        const rng = rastgeleUreteci(500 + n);
        let o = seviyeli(sinif, 48);
        for (let i = 0; o.statPuani > 0; i++) o = statPuaniDagit(o, ['can', 'guc', 'savunma'][i % 3]);
        const [silah, zirh, aksesuar] = EKIP[sinif];
        o = { ...o, kusanilan: { silah, zirh, aksesuar } };
        o = { ...o, can: statlar(o).can, nefes: statlar(o).nefes };
        let heybe = yemekEkle([], 'otlu_peynir', 10).heybe;
        heybe = yemekEkle(heybe, 'bingol_bali', 5).heybe;
        let d = { ...yeniOyunDurumu({ ad: 'A', sinif }), oyuncu: o, heybe };
        let hedef = zulmet();
        let etkiler = [];
        let hamle = 0;
        const [destek, etki, vurus] = AI[sinif];
        while (hedef.can > 0 && d.oyuncu.can > 0 && hamle < 200) {
          const p = savasci(d);
          const olur = (eylem) => eylemKontrol(d, eylem).olur;
          const yetenek = (a) => ({ tur: 'yetenek', anahtar: a });
          let eylem = { tur: 'saldir' };
          if (sinif === 'alperen' && p.can < p.canEnCok * 0.5 && olur(yetenek('gonul_dirligi'))) eylem = yetenek('gonul_dirligi');
          else if (p.can < p.canEnCok * 0.4 && olur({ tur: 'yemek', anahtar: 'otlu_peynir' })) eylem = { tur: 'yemek', anahtar: 'otlu_peynir' };
          else if (!etkiler.some((e) => e.etki === etki) && olur(yetenek(destek))) eylem = yetenek(destek);
          else if (olur(yetenek(vurus)) && (sinif !== 'alperen' || p.nefes > 60)) eylem = yetenek(vurus);
          else if (p.nefes < 25 && olur({ tur: 'yemek', anahtar: 'bingol_bali' })) eylem = { tur: 'yemek', anahtar: 'bingol_bali' };
          const r = oyuncuHamlesi(d, eylem, rng, { hedef, etkiler });
          ({ durum: d, hedef, etkiler } = r);
          hamle++;
          if (hedef.can > 0) ({ durum: d, etkiler } = dusmanHamlesi(d, hedef, rng, { etkiler }));
        }
        if (hedef.can <= 0) {
          zafer++;
          tur += hamle;
        }
      }
      expect(zafer / N, `${sinif} zafer oranı`).toBeGreaterThanOrEqual(0.6);
      expect(tur / zafer, `${sinif} tur`).toBeGreaterThanOrEqual(8);
      expect(tur / zafer, `${sinif} tur`).toBeLessThanOrEqual(25);
    }
  });
});

describe('final zaferi ve oyun sonrası', () => {
  const zulmetiYen = (d) => zaferUygula(d, dusmanOlustur('zulmet', final.dusmanSeviyesi), AGRI, sabit(0.5));

  it('Zülmet yenilince oyun bitmiş sayılır, Hayır kazanılır, can ve nefes dolar', () => {
    const d = sonDurum();
    const r = zulmetiYen({ ...d, oyuncu: { ...d.oyuncu, can: 10 } });
    expect(r.ozet.zulmetYenildi).toBe(true);
    expect(r.durum.zulmetYenildi).toBe(true);
    expect(r.ozet.hayir).toBeGreaterThanOrEqual(HAYIR.final);
    expect(r.durum.oyuncu.can).toBe(statlar(r.durum.oyuncu).can);
    expect(finalDurumu(r.durum)).toBe('yenildi');
  });

  it('oyun sonrası yolculuk ve arındırma sürer', () => {
    const r = zulmetiYen(sonDurum());
    const d = { ...r.durum, konum: 36, arinma: { 36: 40 } };
    expect(seyahatKontrol(r.durum, 36).olur).toBe(true);
    const r2 = zaferUygula(d, karsilasmaUret(36, rastgeleUreteci(3)), 36, sabit(0.5));
    expect(r2.durum.arinma[36]).toBeGreaterThan(40);
    expect(r2.durum.zulmetYenildi).toBe(true);
  });
});

describe('istatistikler', () => {
  it('zafer ve bayılmalar sayılır; bayılmalar bölge bölge tutulur', () => {
    let d = yeniOyunDurumu({ ad: 'A', sinif: 'akinci' });
    d = istatistikYaz(d, 'zafer', 'marmara');
    d = istatistikYaz(d, 'yenilgi', 'marmara');
    d = istatistikYaz(d, 'yenilgi', 'ege');
    d = istatistikYaz(d, 'kacis', 'ege');
    expect(d.istatistik).toEqual({ zafer: 1, bayilma: 2, bolgeBayilma: { marmara: 1, ege: 1 } });
  });
});

describe('başarımlar', () => {
  const bos = () => yeniOyunDurumu({ ad: 'A', sinif: 'akinci' });

  it('her başarımın koşulu ve metni var', () => {
    expect(Object.keys(basarimlar).sort()).toEqual(Object.keys(KOSULLAR).sort());
    for (const b of Object.values(basarimlar)) {
      expect(b.ad.length).toBeGreaterThan(2);
      expect(b.aciklama.length).toBeGreaterThan(10);
      expect(b.ikon).toBeTruthy();
    }
    // Plan örnekleri
    const adlar = Object.values(basarimlar).map((b) => b.ad);
    for (const ad of ['İlk İl Arındı', 'Bir Bölge Tamam', '81 Diyar', 'Sofra Ustası', 'Yiğit']) expect(adlar).toContain(ad);
    // Yeni oyunda hiçbiri kazanılmış değil
    expect(oyunDurumunuIsle(bos()).basarimlar).toEqual([]);
  });

  it('il, bölge ve 81 il arındırma', () => {
    const tekIl = oyunDurumunuIsle({ ...bos(), arinma: { 34: 100 } });
    expect(tekIl.basarimlar).toEqual(['ilk_il']);
    const marmara = Object.fromEntries(iller.filter((il) => il.bolge === 'marmara').map((il) => [il.plaka, 100]));
    expect(oyunDurumunuIsle({ ...bos(), arinma: marmara }).basarimlar).toEqual(['ilk_il', 'bir_bolge']);
    const hepsi = Object.fromEntries(iller.map((il) => [il.plaka, 100]));
    expect(oyunDurumunuIsle({ ...bos(), arinma: hepsi }).basarimlar).toContain('seksen_bir_diyar');
  });

  it('Sofra Ustası: heybeye giren her yemek deftere yazılır, 81 yemek toplanınca kazanılır', () => {
    const d = yemekDefteriniGuncelle({ ...bos(), heybe: [{ anahtar: 'boyoz', adet: 1 }] });
    expect(d.toplananYemekler).toEqual(expect.arrayContaining(['balik_ekmek', 'hosmerim', 'boyoz']));
    // Yenip heybeden çıksa da defterde kalır
    expect(yemekDefteriniGuncelle({ ...d, heybe: [] }).toplananYemekler).toContain('boyoz');
    expect(oyunDurumunuIsle(d).basarimlar).not.toContain('sofra_ustasi');
    expect(oyunDurumunuIsle({ ...bos(), toplananYemekler: Object.keys(yemekler) }).basarimlar).toContain('sofra_ustasi');
  });

  it('Yiğit: bölge bossu, o bölgede hiç bayılmadan yenilince', () => {
    const once = { ...bos(), istatistik: { zafer: 5, bayilma: 1, bolgeBayilma: { ege: 1 } } };
    const marmaraYenildi = { ...once, yenilenBosslar: ['marmara'] };
    expect(oyunDurumunuIsle(marmaraYenildi, once).basarimlar).toContain('yigit');
    const egeOnce = { ...once, yenilenBosslar: ['marmara'] };
    expect(oyunDurumunuIsle({ ...egeOnce, yenilenBosslar: ['marmara', 'ege'] }, egeOnce).basarimlar).not.toContain('yigit');
    // Boss yenilmesi anına bakılır; eski yenilgiler sonradan başarım kazandırmaz
    expect(oyunDurumunuIsle(marmaraYenildi, marmaraYenildi).basarimlar).not.toContain('yigit');
  });

  it('diğer başarımlar: ilk zafer, efsanevi eşya, unvan, bütün görevler, Zülmet', () => {
    const d = {
      ...bos(),
      istatistik: { zafer: 1, bayilma: 0, bolgeBayilma: {} },
      esyalar: ['bogaz_kilici'],
      hayir: 175,
      gorevler: Object.fromEntries(Object.keys(gorevler).map((a) => [a, { durum: 'tamam' }])),
      zulmetYenildi: true,
    };
    expect(oyunDurumunuIsle(d).basarimlar).toEqual(expect.arrayContaining(['ilk_zafer', 'efsane', 'halkin_yigidi', 'gorev_ehli', 'zulmete_son']));
  });

  it('kazanılan başarım kaybedilmez; değişiklik yoksa aynı durum döner; yeniler ayırt edilir', () => {
    const d = oyunDurumunuIsle({ ...bos(), arinma: { 34: 100 } });
    expect(basarimlariDenetle(d)).toBe(d);
    const geri = oyunDurumunuIsle({ ...d, arinma: {} }, d);
    expect(geri.basarimlar).toEqual(['ilk_il']);
    expect(yeniBasarimlar(bos(), d)).toEqual(['ilk_il']);
    expect(yeniBasarimlar(d, d)).toEqual([]);
  });

  it('durum deposu her yeni durumu dönüştürücüden geçirir', () => {
    const depo = durumDeposu(bos(), { donustur: oyunDurumunuIsle });
    const gelen = [];
    depo.abone((d) => gelen.push(d));
    depo.ayarla({ ...depo.al(), arinma: { 34: 100 } });
    expect(depo.al().basarimlar).toEqual(['ilk_il']);
    expect(gelen[0].basarimlar).toEqual(['ilk_il']);
  });
});

describe('kayıt (şema sürüm 5)', () => {
  it('sürüm 4 kaydı taşınır; yemek defteri heybeden başlar', () => {
    const { zulmetYenildi: _z, basarimlar: _b, toplananYemekler: _t, istatistik: _i, ...eski } = yeniOyunDurumu({ ad: 'A', sinif: 'alperen' });
    const v = goc({ surum: 4, durum: { ...eski, heybe: [{ anahtar: 'boyoz', adet: 2 }] } });
    expect(v.surum).toBe(KAYIT_SURUMU);
    expect(v.durum).toMatchObject({ zulmetYenildi: false, basarimlar: [], toplananYemekler: ['boyoz'], istatistik: { zafer: 0, bayilma: 0, bolgeBayilma: {} } });
    expect(durumGecerliMi(v.durum)).toBe(true);
    // Zincirleme: sürüm 1 kaydı da güncel şemaya ulaşır
    const { yenilenBosslar: _y, yenilenMiniBosslar: _m, sofra: _s, esyalar: _e, sonKervansaray: _k, gorevler: _g, hayir: _h, hediyeAlinan: _a, ...bir } = eski;
    const { kusanilan: _ku, ...oyuncu } = bir.oyuncu;
    expect(goc({ surum: 1, durum: { ...bir, oyuncu } }).surum).toBe(KAYIT_SURUMU);
  });

  it('kaydet → yükle; bozuk alanlar reddedilir', () => {
    const dp = depo();
    const d = oyunDurumunuIsle({ ...sonDurum(), zulmetYenildi: true, istatistik: { zafer: 3, bayilma: 1, bolgeBayilma: { ege: 1 } } });
    expect(kaydet(d, dp)).toBe(true);
    expect(yukle(dp)).toEqual(d);
    for (const b of [
      { ...d, zulmetYenildi: 'evet' },
      { ...d, basarimlar: ['olmayan'] },
      { ...d, toplananYemekler: ['olmayan_yemek'] },
      { ...d, istatistik: { zafer: 1, bayilma: 0, bolgeBayilma: { mars: 1 } } },
      { ...d, istatistik: null },
    ]) {
      dp.setItem(KAYIT_ANAHTARI, JSON.stringify({ surum: KAYIT_SURUMU, durum: b }));
      expect(yukle(dp)).toBeNull();
    }
  });
});

describe('ses', () => {
  it('ses desteklenmeyen ortamda sessizce geçer', () => {
    expect(SES_ADLARI).toEqual(expect.arrayContaining(['vurus', 'kritik', 'seviye', 'yemek']));
    for (const ad of SES_ADLARI) expect(() => sesCal(ad)).not.toThrow();
    expect(() => sesCal('olmayan')).not.toThrow();
  });
});

describe('dengeleme (Faz 10)', () => {
  it('bir seviye, o seviyedeki sıradan düşmanlarla 12 savaştan az sürer', () => {
    for (let sv = 2; sv <= 50; sv++) {
      const savasXp = 5 + sv * 10;
      expect(gerekenXp(sv) / savasXp, `Sv ${sv}`).toBeLessThan(12);
    }
  });

  it('Doğu Anadolu illeri Zülmet\'ten önce açıktır', () => {
    expect(DOGU).toContain(AGRI);
  });
});
