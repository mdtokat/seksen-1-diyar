import { describe, it, expect } from 'vitest';
import {
  KARO,
  haritaBoyutu,
  halkSayisi,
  halkiYerlestir,
  halkiYurut,
  yeniKovalayanlar,
  DAVRANIS,
  ilHaritasiUret,
  ulasilabilir,
  yurunurMu,
  dusmanYurunurMu,
  yolBul,
  girisNoktasi,
  kapiBul,
  meydandaMi,
  etkilesimTuru,
  karo,
  mesafe,
  dusmanSayisi,
  dusmanlariYerlestir,
  dusmanDogur,
  dusmanlariYurut,
} from '../src/oyun/gezinti.js';
import { vurabilirMi } from '../src/oyun/catisma.js';
import { dusmanOlustur } from '../src/oyun/savas.js';
import { iller } from '../src/veri/iller.js';
import { rastgeleUreteci } from '../src/oyun/rastgele.js';

const ISTANBUL = 34;
const KOCAELI = 41;
const TEKIRDAG = 59;
const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));

describe('il haritası üretimi', () => {
  it('aynı il her seferinde aynı haritayı üretir, farklı iller farklıdır', () => {
    expect(ilHaritasiUret(ISTANBUL)).toEqual(ilHaritasiUret(ISTANBUL));
    expect(ilHaritasiUret(ISTANBUL).karolar).not.toEqual(ilHaritasiUret(KOCAELI).karolar);
  });

  it('81 ilin tamamında: her komşuya bir çıkış, kenarda, tekrarsız ve meydandan erişilebilir', () => {
    for (const il of iller) {
      const h = ilHaritasiUret(il.plaka);
      expect(h.karolar, il.ad).toHaveLength(h.genislik * h.yukseklik);
      expect(h.kapilar.map((k) => k.plaka).sort(), il.ad).toEqual([...il.komsular].sort());
      expect(new Set(h.kapilar.map((k) => `${k.x},${k.y}`)).size, il.ad).toBe(h.kapilar.length);
      const ulasilan = ulasilabilir(h, h.dogus);
      for (const k of h.kapilar) {
        const kenarda = k.x === 0 || k.y === 0 || k.x === h.genislik - 1 || k.y === h.yukseklik - 1;
        expect(kenarda, `${il.ad} → ${k.plaka}`).toBe(true);
        expect(karo(h, k.x, k.y)).toBe(KARO.KAPI);
        expect(ulasilan.has(k.y * h.genislik + k.x), `${il.ad} → ${k.plaka}`).toBe(true);
      }
    }
  });

  it('meydanda çeşme, tezgâh ve tabela var; doğuş noktası meydanda ve yürünür', () => {
    for (const il of iller) {
      const h = ilHaritasiUret(il.plaka);
      expect(etkilesimTuru(h, h.cesme.x, h.cesme.y), il.ad).toBe('cesme');
      expect(etkilesimTuru(h, h.tezgah.x, h.tezgah.y), il.ad).toBe('tezgah');
      expect(etkilesimTuru(h, h.tabela.x, h.tabela.y), il.ad).toBe('tabela');
      expect(meydandaMi(h, h.dogus), il.ad).toBe(true);
      expect(yurunurMu(h, h.dogus.x, h.dogus.y), il.ad).toBe(true);
    }
  });

  it('yürünebilen her karo meydandan erişilebilir (kapalı cep yok)', () => {
    for (const plaka of [ISTANBUL, 6, 61, 65, 63]) {
      const h = ilHaritasiUret(plaka);
      const ulasilan = ulasilabilir(h, h.dogus);
      for (let y = 0; y < h.yukseklik; y++) {
        for (let x = 0; x < h.genislik; x++) {
          if (yurunurMu(h, x, y)) expect(ulasilan.has(y * h.genislik + x), `${plaka} ${x},${y}`).toBe(true);
        }
      }
    }
  });

  it('çıkışlar komşunun gerçek yönündedir: İstanbul\'da Kocaeli doğuda, Tekirdağ batıda', () => {
    const h = ilHaritasiUret(ISTANBUL);
    const kocaeli = h.kapilar.find((k) => k.plaka === KOCAELI);
    const tekirdag = h.kapilar.find((k) => k.plaka === TEKIRDAG);
    expect(kocaeli.x).toBe(h.genislik - 1);
    expect(tekirdag.x).toBe(0);
  });

  it('kıyıdan kıyıya çıkış yönleri genel olarak tutarlıdır', () => {
    // Her komşu için: komşu doğudaysa çıkış haritanın doğu yarısında olmalı (belirgin farklarda)
    for (const il of iller) {
      const h = ilHaritasiUret(il.plaka);
      for (const k of h.kapilar) {
        const komsu = ilHaritasi.get(k.plaka);
        const dogu = (komsu.lon - il.lon) * Math.cos((39 * Math.PI) / 180);
        const guney = il.lat - komsu.lat;
        if (Math.abs(dogu) > 2 * Math.abs(guney)) {
          expect(Math.sign(k.x - (h.genislik - 1) / 2), `${il.ad} → ${komsu.ad}`).toBe(Math.sign(dogu));
        }
      }
    }
  });
});

describe('yürüme ve yol bulma', () => {
  const h = ilHaritasiUret(ISTANBUL);

  it('meydandan her çıkışa bitişik adımlarla yürünebilir bir yol var', () => {
    for (const k of h.kapilar) {
      const yol = yolBul(h, h.dogus, k);
      expect(yol, String(k.plaka)).not.toBeNull();
      let onceki = h.dogus;
      for (const p of yol) {
        expect(mesafe(onceki, p)).toBe(1);
        expect(yurunurMu(h, p.x, p.y)).toBe(true);
        onceki = p;
      }
      expect(yol.at(-1)).toEqual({ x: k.x, y: k.y });
      expect(kapiBul(h, yol.at(-1)).plaka).toBe(k.plaka);
    }
  });

  it('yürünemeyen hedefe (çeşme) gidilmek istenince yanına kadar yürünür', () => {
    const yol = yolBul(h, { x: 1, y: 15 }, h.cesme);
    expect(yol).not.toBeNull();
    expect(mesafe(yol.at(-1), h.cesme)).toBe(1);
  });

  it('zaten hedefteyken yol boştur, engellerden geçilmez', () => {
    expect(yolBul(h, h.dogus, h.dogus)).toEqual([]);
    const yol = yolBul(h, h.dogus, { x: h.dogus.x, y: h.dogus.y + 2 }, { engeller: [{ x: h.dogus.x, y: h.dogus.y + 1 }] });
    expect(yol.some((p) => p.x === h.dogus.x && p.y === h.dogus.y + 1)).toBe(false);
  });

  it('komşu ilden gelen, o ile giden çıkışın ağzından girer', () => {
    const kocaeli = ilHaritasiUret(KOCAELI);
    const giris = girisNoktasi(kocaeli, ISTANBUL);
    const kapi = kocaeli.kapilar.find((k) => k.plaka === ISTANBUL);
    expect(giris).toEqual({ x: kapi.ix, y: kapi.iy });
    expect(yurunurMu(kocaeli, giris.x, giris.y)).toBe(true);
    expect(girisNoktasi(kocaeli, 6)).toEqual(kocaeli.dogus);
  });
});

describe('haritadaki düşmanlar', () => {
  const h = ilHaritasiUret(ISTANBUL);
  const il = ilHaritasi.get(ISTANBUL);

  it('arınmamış ilde en az 4, arınmış ilde en az 2 düşman olur; büyük illerde daha çok', () => {
    expect(dusmanSayisi(0)).toBe(4);
    expect(dusmanSayisi(99)).toBe(4);
    expect(dusmanSayisi(100)).toBe(2);
    const yalova = ilHaritasiUret(77);
    const konya = ilHaritasiUret(42);
    expect(dusmanSayisi(0, yalova)).toBe(4);
    expect(dusmanSayisi(100, yalova)).toBe(2);
    expect(dusmanSayisi(0, konya)).toBeGreaterThan(dusmanSayisi(0, h));
    expect(dusmanSayisi(0, h)).toBeGreaterThanOrEqual(4);
    expect(dusmanlariYerlestir(h, 0, rastgeleUreteci(3))).toHaveLength(dusmanSayisi(0, h));
    expect(dusmanlariYerlestir(h, 100, rastgeleUreteci(3))).toHaveLength(dusmanSayisi(100, h));
  });

  it('düşmanlar ilin havuzundan, meydandan ve çıkışlardan uzakta, açık alanda belirir', () => {
    for (let t = 1; t <= 30; t++) {
      const ds = dusmanlariYerlestir(h, 0, rastgeleUreteci(t));
      expect(new Set(ds.map((d) => d.id)).size).toBe(ds.length);
      for (const d of ds) {
        expect(il.dusmanlar).toContain(d.dusman.anahtar);
        expect(d.dusman.seviye).toBeGreaterThanOrEqual(il.seviye[0]);
        expect(d.dusman.seviye).toBeLessThanOrEqual(il.seviye[1]);
        expect(dusmanYurunurMu(h, d.x, d.y)).toBe(true);
        expect(meydandaMi(h, d)).toBe(false);
        expect(mesafe(d, h.dogus)).toBeGreaterThanOrEqual(4);
        for (const k of h.kapilar) expect(mesafe(d, k)).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('yeni düşman oyuncudan uzakta belirir', () => {
    const oyuncu = { x: 3, y: 5 };
    for (let t = 1; t <= 20; t++) {
      const d = dusmanDogur(h, ISTANBUL, rastgeleUreteci(t), { oyuncu, enAzUzaklik: 7 });
      expect(mesafe(d, oyuncu)).toBeGreaterThanOrEqual(7);
    }
  });

  it('düşmanlar yürürken meydana ve çıkışlara girmez, üst üste binmez', () => {
    const rng = rastgeleUreteci(9);
    let ds = dusmanlariYerlestir(h, 0, rng);
    let oyuncu = { ...h.dogus };
    for (let adim = 0; adim < 300; adim++) {
      // Oyuncu da rastgele gezinsin
      // (oyunda olduğu gibi düşmanların içinden geçmez)
      const yol = yolBul(h, oyuncu, { x: 1 + (adim * 7) % 22, y: 1 + (adim * 11) % 28 }, { engeller: ds });
      if (yol && yol.length) oyuncu = yol[0];
      ds = dusmanlariYurut(h, ds, oyuncu, rng);
      const yerler = new Set();
      for (const d of ds) {
        expect(dusmanYurunurMu(h, d.x, d.y)).toBe(true);
        expect(meydandaMi(h, d)).toBe(false);
        expect(kapiBul(h, d)).toBeUndefined();
        expect(d.x === oyuncu.x && d.y === oyuncu.y).toBe(false);
        yerler.add(`${d.x},${d.y}`);
      }
      expect(yerler.size).toBe(ds.length);
    }
  });

  it('yakındaki oyuncunun peşine düşer (fark edince hemen atılır); dokunulmaz oyuncunun peşine düşmez', () => {
    const [d] = dusmanlariYerlestir(h, 0, rastgeleUreteci(2));
    const yol = yolBul(h, d, h.dogus);
    const oyuncu = yol[3]; // düşmana 4 adım uzakta, açık alanda
    expect(meydandaMi(h, oyuncu)).toBe(false);
    const once = mesafe(d, oyuncu);
    const [kovalayan] = dusmanlariYurut(h, [d], oyuncu, rastgeleUreteci(1));
    expect(kovalayan.kovaliyor).toBe(true);
    expect(mesafe(kovalayan, oyuncu)).toBe(once - 1);
    expect(yeniKovalayanlar([d], [kovalayan])).toEqual([kovalayan]);
    expect(yeniKovalayanlar([kovalayan], [kovalayan])).toEqual([]);
    const [sakin] = dusmanlariYurut(h, [d], oyuncu, () => 0.99, { dokunulmaz: true });
    expect(sakin).toMatchObject({ x: d.x, y: d.y, kovaliyor: false });
  });

  // Oyuncu düşmandan kaçmaya çalışır: her tıkta ondan uzaklaşan en iyi adımı atar.
  function kacisDenemesi(takipci, tik = 60) {
    const [d0] = dusmanlariYerlestir(h, 0, rastgeleUreteci(5));
    let d = { ...d0, dusman: { ...d0.dusman, takipci, takip: takipci ? 'takipci' : 'bekci' } };
    const yol = yolBul(h, d, h.dogus);
    let oyuncu = yol[2];
    let ds = [d];
    let yakalandi = false;
    for (let i = 0; i < tik; i++) {
      const adaylar = [[0, 1], [1, 0], [0, -1], [-1, 0]]
        .map(([dx, dy]) => ({ x: oyuncu.x + dx, y: oyuncu.y + dy }))
        .filter((p) => dusmanYurunurMu(h, p.x, p.y) && !(p.x === ds[0].x && p.y === ds[0].y));
      if (adaylar.length) oyuncu = adaylar.sort((a, b) => mesafe(b, ds[0]) - mesafe(a, ds[0]))[0];
      ds = dusmanlariYurut(h, ds, oyuncu, rastgeleUreteci(i + 1));
      if (mesafe(ds[0], oyuncu) <= 1) { yakalandi = true; break; }
    }
    return { yakalandi, kovaliyor: ds[0].kovaliyor, uzaklik: mesafe(ds[0], oyuncu) };
  }

  it('takipçi düşman bekçiden uzaktan fark eder, daha hızlı koşar ve peşini geç bırakır', () => {
    expect(DAVRANIS.takipci.gorus).toBeGreaterThan(DAVRANIS.bekci.gorus);
    expect(DAVRANIS.takipci.birakma).toBeGreaterThan(DAVRANIS.bekci.birakma);
    expect(DAVRANIS.takipci.hiz).toBeGreaterThan(DAVRANIS.bekci.hiz);
    expect(DAVRANIS.takipci.hiz).toBeLessThan(1); // oyuncu yine de bir tık hızlıdır
    // 12 tık kaçan oyuncu: bekçi çoktan geride kalır, takipçi hâlâ peşindedir
    const bekci = kacisDenemesi(false, 12);
    const takipci = kacisDenemesi(true, 12);
    expect(takipci.yakalandi || takipci.kovaliyor).toBe(true);
    if (!takipci.yakalandi && !bekci.yakalandi) expect(takipci.uzaklik).toBeLessThan(bekci.uzaklik);
  });

  it('peşini bırakan düşman yuvasına döner', () => {
    const [d] = dusmanlariYerlestir(h, 0, rastgeleUreteci(4));
    // Yuvasından uzağa (düşmanın yürüyerek ulaşabildiği bir yere) taşınmış; oyuncu meydanda
    const ulasilan = ulasilabilir(h, d, dusmanYurunurMu);
    let uzak = null;
    for (const s of ulasilan) {
      const p = { x: s % h.genislik, y: Math.floor(s / h.genislik) };
      if (mesafe(p, d) >= 8 && mesafe(p, d) <= 12) { uzak = p; break; }
    }
    expect(uzak).not.toBeNull();
    let ds = [{ ...d, x: uzak.x, y: uzak.y, kovaliyor: false }];
    const once = mesafe(ds[0], { x: d.evX, y: d.evY });
    for (let i = 0; i < 40; i++) ds = dusmanlariYurut(h, ds, h.dogus, rastgeleUreteci(i));
    expect(mesafe(ds[0], { x: d.evX, y: d.evY })).toBeLessThanOrEqual(Math.min(once, 3));
  });

  it('meydan güvenlidir: meydana sığınan oyuncunun peşi bırakılır, ona vurulamaz', () => {
    const kenar = { x: h.meydan.x1, y: h.meydan.y1 };
    const d = { id: 2, x: kenar.x - 1, y: kenar.y, evX: kenar.x - 1, evY: kenar.y, dusman: dusmanOlustur('ac_kurt', 3), kovaliyor: true };
    expect(vurabilirMi(h, d, kenar)).toBe(true);
    const [sonra] = dusmanlariYurut(h, [d], kenar, rastgeleUreteci(1));
    expect(sonra.kovaliyor).toBe(false);
    expect(vurabilirMi(h, sonra, kenar)).toBe(false);
  });
});

describe('illerin gerçek boyutu ve nüfusu', () => {
  const alan = (il) => { const b = haritaBoyutu(il.plaka); return b.genislik * b.yukseklik; };

  it('harita alanı yüzölçümüyle birlikte büyür: Konya en büyük, Yalova en küçük harita', () => {
    const sirali = [...iller].sort((a, b) => a.yuzolcumu - b.yuzolcumu);
    for (let i = 1; i < sirali.length; i++) {
      expect(alan(sirali[i]), `${sirali[i - 1].ad} < ${sirali[i].ad}`).toBeGreaterThanOrEqual(alan(sirali[i - 1]));
    }
    const konya = ilHaritasi.get(42);
    const yalova = ilHaritasi.get(77);
    for (const il of iller) {
      if (il !== konya) expect(alan(konya)).toBeGreaterThan(alan(il));
      if (il !== yalova) expect(alan(yalova)).toBeLessThan(alan(il));
    }
    expect(alan(konya) / alan(yalova)).toBeGreaterThan(8);
  });

  it('harita kenarları tek sayıdır, ilin şekline göre yatık ya da dik olur', () => {
    for (const il of iller) {
      const b = haritaBoyutu(il.plaka);
      expect(b.genislik % 2, il.ad).toBe(1);
      expect(b.yukseklik % 2, il.ad).toBe(1);
      expect(b.genislik / b.yukseklik).toBeGreaterThan(0.5);
      expect(b.genislik / b.yukseklik).toBeLessThan(2);
    }
    const ilk = ilHaritasiUret(42);
    expect(ilk.genislik).toBe(haritaBoyutu(42).genislik);
    // Ordu kıyı boyunca doğu-batı uzanır, Hatay kuzey-güney
    const ordu = haritaBoyutu(52);
    const hatay = haritaBoyutu(31);
    expect(ordu.genislik).toBeGreaterThan(ordu.yukseklik);
    expect(hatay.yukseklik).toBeGreaterThan(hatay.genislik);
  });

  it('İstanbul en kalabalık il: en çok ev ve en çok halk orada', () => {
    const evler = (plaka) => ilHaritasiUret(plaka).karolar.filter((t) => t === KARO.EV).length;
    const istanbulEv = evler(ISTANBUL);
    for (const plaka of [6, 35, 16, 42, 69, 62, 75]) expect(istanbulEv, String(plaka)).toBeGreaterThan(evler(plaka));
    for (const il of iller) {
      if (il.plaka !== ISTANBUL) expect(halkSayisi(ISTANBUL)).toBeGreaterThanOrEqual(halkSayisi(il.plaka));
      expect(halkSayisi(il.plaka)).toBeGreaterThanOrEqual(1);
    }
    expect(halkSayisi(ISTANBUL)).toBeGreaterThan(halkSayisi(69));
  });

  it('halk meydanın çevresinde dolaşır; oyuncunun ve düşmanların üstüne basmaz', () => {
    const h = ilHaritasiUret(ISTANBUL);
    const rng = rastgeleUreteci(7);
    let halk = halkiYerlestir(h, rng);
    expect(halk).toHaveLength(halkSayisi(ISTANBUL));
    const oyuncu = { ...h.dogus };
    const dusmanlar = dusmanlariYerlestir(h, 0, rng);
    for (let i = 0; i < 200; i++) {
      halk = halkiYurut(h, halk, oyuncu, dusmanlar, rng);
      const yerler = new Set(halk.map((k) => `${k.x},${k.y}`));
      expect(yerler.size).toBe(halk.length);
      for (const k of halk) {
        expect(k.x === oyuncu.x && k.y === oyuncu.y).toBe(false);
        const m = h.meydan;
        expect(Math.max(m.x1 - k.x, k.x - m.x2, 0) + Math.max(m.y1 - k.y, k.y - m.y2, 0)).toBeLessThanOrEqual(3);
      }
    }
  });
});

describe('il coğrafyası', async () => {
  const { ilCografyasi, ilOzellikleri } = await import('../src/oyun/cografya.js');

  it('her ilin yüzölçümü ve nüfusu var; sıralar 1–81 arasında', () => {
    for (const il of iller) {
      expect(il.yuzolcumu, il.ad).toBeGreaterThan(0);
      expect(il.nufus, il.ad).toBeGreaterThan(0);
      const c = ilCografyasi(il.plaka);
      for (const s of [c.alanSirasi, c.nufusSirasi, c.yogunlukSirasi]) {
        expect(s).toBeGreaterThanOrEqual(1);
        expect(s).toBeLessThanOrEqual(81);
      }
    }
  });

  it('Konya en geniş, Yalova en küçük, İstanbul en kalabalık, Bayburt en az nüfuslu il', () => {
    expect(ilOzellikleri(42)).toContain('en_genis');
    expect(ilOzellikleri(77)).toContain('en_kucuk');
    expect(ilOzellikleri(ISTANBUL)).toContain('en_kalabalik');
    expect(ilOzellikleri(69)).toContain('en_az_nufus');
    expect(ilCografyasi(42).alanSirasi).toBe(1);
    expect(ilCografyasi(ISTANBUL).nufusSirasi).toBe(1);
  });
});
