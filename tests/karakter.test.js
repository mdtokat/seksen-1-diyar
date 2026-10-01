import { describe, it, expect } from 'vitest';
import {
  gerekenXp,
  yeniKarakter,
  statlar,
  xpEkle,
  acikYetenekler,
  acilanYetenekler,
  statPuaniDagit,
  adTemizle,
  tamIyilestir,
  dalSec,
  dalSecebilirMi,
  dalBilgisi,
} from '../src/oyun/karakter.js';
import { DAL_SEVIYESI } from '../src/veri/siniflar.js';
import { yeniOyunDurumu } from '../src/oyun/durum.js';
import { siniflar } from '../src/veri/siniflar.js';

describe('XP eğrisi', () => {
  it('round(30 × sv^1.35) formülünü uygular (Faz 10 dengelemesi)', () => {
    expect(gerekenXp(1)).toBe(30);
    expect(gerekenXp(2)).toBe(76);
    expect(gerekenXp(5)).toBe(263);
    expect(gerekenXp(10)).toBe(672);
    for (let sv = 1; sv < 60; sv++) expect(gerekenXp(sv + 1)).toBeGreaterThan(gerekenXp(sv));
  });
});

describe('yeni karakter', () => {
  it('üç sınıf da başlangıç statlarıyla oluşturulur', () => {
    for (const [anahtar, sinif] of Object.entries(siniflar)) {
      const o = yeniKarakter('Deniz', anahtar);
      expect(o).toMatchObject({ ad: 'Deniz', sinif: anahtar, seviye: 1, xp: 0, statPuani: 0 });
      expect(statlar(o)).toEqual(sinif.baslangic);
      expect(o.can).toBe(sinif.baslangic.can);
      expect(o.nefes).toBe(sinif.baslangic.nefes);
    }
  });

  it('bilinmeyen sınıf hata verir', () => {
    expect(() => yeniKarakter('Deniz', 'buyucu')).toThrow();
  });

  it('ad temizlenir, boşsa Alp olur, Türkçe karakterler korunur', () => {
    expect(adTemizle('  Gülşah   Işık ')).toBe('Gülşah Işık');
    expect(adTemizle('')).toBe('Alp');
    expect(adTemizle('   ')).toBe('Alp');
    expect(adTemizle(undefined)).toBe('Alp');
    expect(adTemizle('Ç'.repeat(40))).toHaveLength(20);
  });

  it('yeni oyun durumu karakteri ve akçeyi içerir', () => {
    const d = yeniOyunDurumu({ ad: 'Ömer', sinif: 'kemankes' });
    expect(d.oyuncu.ad).toBe('Ömer');
    expect(d.oyuncu.sinif).toBe('kemankes');
    expect(d.akce).toBe(0);
    expect(yeniOyunDurumu().oyuncu).toBeNull();
  });
});

describe('seviye atlama', () => {
  it('yeterli XP ile seviye atlanır, fazlası aktarılır', () => {
    const o = yeniKarakter('A', 'akinci');
    const r = xpEkle(o, 40);
    expect(r.oyuncu.seviye).toBe(2);
    expect(r.oyuncu.xp).toBe(10);
    expect(r.seviyeler).toEqual([2]);
    expect(o.seviye).toBe(1); // eski nesne değişmez
  });

  it('yetersiz XP ile seviye atlanmaz', () => {
    const r = xpEkle(yeniKarakter('A', 'akinci'), 29);
    expect(r.oyuncu.seviye).toBe(1);
    expect(r.oyuncu.xp).toBe(29);
    expect(r.seviyeler).toEqual([]);
  });

  it('büyük XP ile art arda birden çok seviye atlanır', () => {
    const r = xpEkle(yeniKarakter('A', 'akinci'), gerekenXp(1) + gerekenXp(2) + gerekenXp(3));
    expect(r.oyuncu.seviye).toBe(4);
    expect(r.oyuncu.xp).toBe(0);
    expect(r.seviyeler).toEqual([2, 3, 4]);
    expect(r.oyuncu.statPuani).toBe(9);
  });

  it('otomatik stat artışı gelir, can ve nefes dolar', () => {
    const o = { ...yeniKarakter('A', 'kemankes'), can: 10, nefes: 0 };
    const r = xpEkle(o, gerekenXp(1));
    const artis = siniflar.kemankes.seviyeArtisi;
    const bas = siniflar.kemankes.baslangic;
    const s = statlar(r.oyuncu);
    for (const stat of Object.keys(bas)) expect(s[stat]).toBe(bas[stat] + artis[stat]);
    expect(r.oyuncu.can).toBe(s.can);
    expect(r.oyuncu.nefes).toBe(s.nefes);
    expect(r.oyuncu.statPuani).toBe(3);
  });
});

describe('yetenek açılışı', () => {
  it('1. seviyede yalnızca ilk yetenek açık', () => {
    expect(acikYetenekler(yeniKarakter('A', 'akinci')).map((y) => y.anahtar)).toEqual(['kilic_darbesi']);
  });

  it('5. seviyeye ulaşınca ikinci yetenek açılır ve bildirilir', () => {
    let o = yeniKarakter('A', 'akinci');
    let r;
    for (let sv = 1; sv < 4; sv++) o = xpEkle(o, gerekenXp(sv)).oyuncu;
    expect(o.seviye).toBe(4);
    r = xpEkle(o, gerekenXp(4));
    expect(r.oyuncu.seviye).toBe(5);
    expect(r.yeniYetenekler.map((y) => y.anahtar)).toEqual(['kalkan_durusu']);
    expect(acikYetenekler(r.oyuncu).map((y) => y.anahtar)).toEqual(['kilic_darbesi', 'kalkan_durusu']);
  });

  it('aralıkta açılan yetenekler doğru hesaplanır', () => {
    expect(acilanYetenekler('alperen', 1, 20).map((y) => y.ad)).toEqual([
      'Şifa Nefesi',
      'Hikmet Kalkanı',
      'Arınma Işığı',
    ]);
    expect(acilanYetenekler('kemankes', 5, 11)).toEqual([]);
  });
});

describe('stat puanı dağıtma', () => {
  const puanli = () => xpEkle(yeniKarakter('A', 'akinci'), 40).oyuncu;

  it('puan harcanır ve stat artar', () => {
    const o = puanli();
    const g = statPuaniDagit(o, 'guc');
    expect(g.statPuani).toBe(2);
    expect(statlar(g).guc).toBe(statlar(o).guc + 1);
  });

  it('can ve nefese verilen puan güncel değeri de artırır', () => {
    const o = puanli();
    const c = statPuaniDagit(o, 'can');
    expect(statlar(c).can).toBe(statlar(o).can + 5);
    expect(c.can).toBe(o.can + 5);
    const n = statPuaniDagit(o, 'nefes');
    expect(n.nefes).toBe(o.nefes + 3);
  });

  it('puan yoksa ya da stat geçersizse değişiklik olmaz', () => {
    const o = yeniKarakter('A', 'akinci');
    expect(statPuaniDagit(o, 'guc')).toBe(o);
    const p = puanli();
    expect(statPuaniDagit(p, 'sihir')).toBe(p);
  });

  it('tam iyileştirme can ve nefesi doldurur', () => {
    const o = { ...yeniKarakter('A', 'alperen'), can: 1, nefes: 2 };
    expect(tamIyilestir(o)).toMatchObject({ can: 85, nefes: 70 });
  });
});

describe('uzmanlık dalı', () => {
  const seviyeli = (sinif, seviye) => {
    let o = yeniKarakter('A', sinif);
    while (o.seviye < seviye) o = xpEkle(o, gerekenXp(o.seviye)).oyuncu;
    return o;
  };

  it('her sınıfın iki dalı var; yeni karakter dalsız başlar', () => {
    for (const s of Object.values(siniflar)) expect(Object.keys(s.dallar)).toHaveLength(2);
    expect(yeniKarakter('A', 'akinci').dal).toBeNull();
    expect(dalBilgisi(yeniKarakter('A', 'akinci'))).toBeNull();
  });

  it(`dal ${DAL_SEVIYESI}. seviyede bir kez seçilir; başka sınıfın dalı seçilemez`, () => {
    const genc = seviyeli('akinci', DAL_SEVIYESI - 1);
    expect(dalSecebilirMi(genc)).toBe(false);
    expect(dalSec(genc, 'sipahi')).toBe(genc);
    const o = seviyeli('akinci', DAL_SEVIYESI);
    expect(dalSecebilirMi(o)).toBe(true);
    expect(dalSec(o, 'nisanci')).toBe(o);
    const sipahi = dalSec(o, 'sipahi');
    expect(sipahi.dal).toBe('sipahi');
    expect(dalBilgisi(sipahi).ad).toBe('Sipahi');
    expect(dalSecebilirMi(sipahi)).toBe(false);
    expect(dalSec(sipahi, 'serdengecti')).toBe(sipahi);
  });

  it('dal statları oranla artırır; can ve nefes en yüksek değeri aşmaz', () => {
    const o = seviyeli('akinci', DAL_SEVIYESI);
    const once = statlar(o);
    const sipahi = dalSec(o, 'sipahi');
    const sonra = statlar(sipahi);
    expect(sonra.savunma).toBe(Math.round(once.savunma * 1.2));
    expect(sonra.can).toBe(Math.round(once.can * 1.1));
    expect(sonra.guc).toBe(once.guc);
    expect(sipahi.can).toBe(o.can);
    const dervis = dalSec(seviyeli('alperen', DAL_SEVIYESI), 'dervis');
    expect(statlar(dervis).nefes).toBe(Math.round(statlar(seviyeli('alperen', DAL_SEVIYESI)).nefes * 1.2));
  });
});
