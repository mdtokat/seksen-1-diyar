// Gökyüzünün haritaya düşen hâli: günün ışığı (şafak, akşam kızıllığı, gece) ve hava
// (kar, yağmur, sis, sıcak hava titreşimi). İki tuval kullanır:
//   .hava-tuvali: kar taneleri, yağmur çizgileri, sis bulutları (tam çözünürlük)
//   .isik-tuvali: gecenin karanlığı ve onu delen ışıklar — yiğidin feneri, pencereler,
//                 meşaleler, demirci ocağı, cinlerin ve ifritlerin ışıltısı (yarım
//                 çözünürlükte çizilip büyütülür; ışık yumuşak olduğundan fark edilmez)
// Vakit ve hava src/oyun/gokyuzu.js'den gelir. Hareket azaltılmışsa yağan bir şey
// çizilmez, yalnız hava puslanır; ışıklar titremez.
import { gunVakti, havaDurumu } from '../oyun/gokyuzu.js';

const ISIK_OLCEGI = 0.5;
const KARE_MS = 33; // en çok ~30 kare/sn
const GECE = [12, 18, 46];
const PARILTI = { cin: [179, 106, 224], ifrit: [240, 138, 36], boss: [179, 106, 224] };
const ISIK = {
  pencere: { r: 0.85, renk: [255, 196, 110], guc: 0.8, sicak: 0.4 },
  mesale: { r: 1.7, renk: [255, 165, 70], guc: 1, sicak: 0.5, titrer: true },
  ocak: { r: 1.25, renk: [255, 140, 60], guc: 0.9, sicak: 0.45, titrer: true },
};

// `oyuncuEl`: yiğidin figürü (ışığı yürürken de onu izlesin diye ekrandaki yeri okunur).
// `dusmanlar()`: haritadaki düşmanlar. `T()`: karonun piksel boyu.
export function gokyuzuKur({ ekran, harita, katmanlar, T, oyuncuEl, dusmanlar, azHareket, saat = () => Date.now() }) {
  const alan = ekran.querySelector('.gezinti-alani');
  const dunya = ekran.querySelector('.dunya');
  const isikTuvali = ekran.querySelector('.isik-tuvali');
  const havaTuvali = ekran.querySelector('.hava-tuvali');
  const ic = isikTuvali.getContext('2d');
  const hc = havaTuvali.getContext('2d');
  let G = 0;
  let Y = 0;
  let dpr = 1;
  let istek = null;
  let son = 0;
  let sonKamera = null;
  let isikBos = false;
  let havaBos = false;
  let taneler = [];
  let sisler = [];
  let sicramalar = [];

  function boyut() {
    const r = alan.getBoundingClientRect();
    G = r.width;
    Y = r.height;
    dpr = Math.min(1.5, globalThis.devicePixelRatio || 1);
    isikTuvali.width = Math.max(1, Math.ceil(G * ISIK_OLCEGI));
    isikTuvali.height = Math.max(1, Math.ceil(Y * ISIK_OLCEGI));
    havaTuvali.width = Math.max(1, Math.ceil(G * dpr));
    havaTuvali.height = Math.max(1, Math.ceil(Y * dpr));
    taneler = [];
    sisler = [];
    isikBos = false;
    havaBos = false;
  }

  // Dünyanın o anki kaydırması (CSS geçişi sürerken de doğru olsun diye hesaplanmış stilden).
  function kamera() {
    const t = getComputedStyle(dunya).transform;
    if (!t || t === 'none') return { x: 0, y: 0 };
    const m = new DOMMatrixReadOnly(t);
    return { x: -m.m41, y: -m.m42 };
  }

  // ── Işık ──
  function isikCiz(vakit, k, zaman) {
    const karanlik = vakit.karanlik;
    const tonVar = vakit.ton[3] > 0.005;
    if (karanlik < 0.01 && !tonVar) {
      if (!isikBos) ic.clearRect(0, 0, isikTuvali.width, isikTuvali.height);
      isikBos = true;
      isikTuvali.hidden = true; // boş tuval ekranda birleştirilmesin
      return;
    }
    isikBos = false;
    isikTuvali.hidden = false;
    const s = ISIK_OLCEGI;
    const t = T();
    const w = isikTuvali.width;
    const h = isikTuvali.height;
    ic.globalCompositeOperation = 'source-over';
    ic.clearRect(0, 0, w, h);
    if (karanlik >= 0.01) {
      ic.fillStyle = `rgba(${GECE.join(',')},${karanlik})`;
      ic.fillRect(0, 0, w, h);
      const isiklar = [];
      // Yiğidin feneri: figürün ekrandaki yerinden
      const o = oyuncuEl.getBoundingClientRect();
      const a = alan.getBoundingClientRect();
      isiklar.push({ x: o.left - a.left + o.width / 2, y: o.top - a.top + o.height * 0.62, r: 3.2 * t, guc: 1 });
      // Yapıların ışıkları
      katmanlar.isiklar.forEach((l, i) => {
        const x = l.x * t - k.x;
        const y = l.y * t - k.y;
        if (x < -3 * t || y < -3 * t || x > G + 3 * t || y > Y + 3 * t) return;
        const tur = ISIK[l.tur] ?? ISIK.pencere;
        const titreme = tur.titrer && !azHareket ? 1 + Math.sin(zaman / 90 + i * 1.7) * 0.06 + Math.sin(zaman / 37 + i) * 0.04 : 1;
        isiklar.push({ x, y, r: tur.r * t * titreme, guc: tur.guc, renk: tur.renk, sicak: tur.sicak });
      });
      // Cinlerin, ifritlerin ve bossların ışıltısı
      for (const d of dusmanlar()) {
        const renk = PARILTI[d.dusman?.tur];
        if (!renk) continue;
        const x = (d.x + 0.5) * t - k.x;
        const y = (d.y + 0.2) * t - k.y;
        if (x < -2 * t || y < -2 * t || x > G + 2 * t || y > Y + 2 * t) continue;
        isiklar.push({ x, y, r: 1.3 * t, guc: 0.7, renk, sicak: 0.4 });
      }
      // Karanlığı ışıkların yerinde sil
      ic.globalCompositeOperation = 'destination-out';
      for (const l of isiklar) {
        const g = ic.createRadialGradient(l.x * s, l.y * s, 0, l.x * s, l.y * s, l.r * s);
        g.addColorStop(0, `rgba(0,0,0,${l.guc})`);
        g.addColorStop(0.55, `rgba(0,0,0,${l.guc * 0.6})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ic.fillStyle = g;
        ic.fillRect((l.x - l.r) * s, (l.y - l.r) * s, 2 * l.r * s, 2 * l.r * s);
      }
      // Sıcak ışık halesi
      ic.globalCompositeOperation = 'lighter';
      for (const l of isiklar) {
        if (!l.renk) continue;
        const g = ic.createRadialGradient(l.x * s, l.y * s, 0, l.x * s, l.y * s, l.r * s * 0.9);
        g.addColorStop(0, `rgba(${l.renk.join(',')},${l.sicak * karanlik * 1.6})`);
        g.addColorStop(1, `rgba(${l.renk.join(',')},0)`);
        ic.fillStyle = g;
        ic.fillRect((l.x - l.r) * s, (l.y - l.r) * s, 2 * l.r * s, 2 * l.r * s);
      }
      ic.globalCompositeOperation = 'source-over';
    }
    if (tonVar) {
      ic.fillStyle = `rgba(${vakit.ton.slice(0, 3).map(Math.round).join(',')},${vakit.ton[3]})`;
      ic.fillRect(0, 0, w, h);
    }
  }

  // ── Hava ──
  function taneHazirla(tur, siddet) {
    const sayi = Math.round((tur === 'kar' ? 140 : tur === 'yagmur' ? 170 : 0) * siddet);
    while (taneler.length < sayi) {
      taneler.push({
        x: Math.random() * G,
        y: Math.random() * Y,
        hiz: tur === 'kar' ? 18 + Math.random() * 26 : 520 + Math.random() * 220,
        r: tur === 'kar' ? 0.8 + Math.random() * 1.8 : 9 + Math.random() * 9,
        faz: Math.random() * Math.PI * 2,
      });
    }
    taneler.length = Math.min(taneler.length, sayi);
    if (tur === 'sis' && !sisler.length) {
      const t = T();
      sisler = Array.from({ length: 7 }, () => ({ x: Math.random() * (G + 8 * t) - 4 * t, y: Math.random() * (Y + 6 * t) - 3 * t, r: (3 + Math.random() * 4) * t }));
    }
  }

  function havaCiz(hava, k, dt, zaman) {
    if (hava.tur === 'acik' || hava.siddet < 0.01) {
      if (!havaBos) hc.clearRect(0, 0, havaTuvali.width, havaTuvali.height);
      havaBos = true;
      havaTuvali.hidden = true;
      taneler = [];
      sisler = [];
      return;
    }
    havaBos = false;
    havaTuvali.hidden = false;
    const { tur, siddet } = hava;
    hc.setTransform(dpr, 0, 0, dpr, 0, 0);
    hc.clearRect(0, 0, G, Y);
    // Kamera kayınca yağan şeyler dünyayla birlikte kayar
    const kx = sonKamera ? k.x - sonKamera.x : 0;
    const ky = sonKamera ? k.y - sonKamera.y : 0;
    // Genel pus
    const pus = { kar: [235, 240, 248, 0.1], yagmur: [70, 82, 100, 0.14], sis: [232, 236, 240, 0.2], sicak: [255, 205, 130, 0.07] }[tur];
    hc.fillStyle = `rgba(${pus.slice(0, 3).join(',')},${pus[3] * siddet})`;
    hc.fillRect(0, 0, G, Y);
    if (azHareket) return;
    taneHazirla(tur, siddet);
    const sar = (p) => {
      p.x = ((p.x % G) + G) % G;
      if (p.y > Y) { p.y -= Y + 20; p.x = Math.random() * G; }
      if (p.y < -20) p.y += Y + 20;
    };
    if (tur === 'kar') {
      hc.fillStyle = 'rgba(255,255,255,0.9)';
      hc.beginPath();
      for (const p of taneler) {
        p.y += p.hiz * dt - ky;
        p.x += Math.sin(zaman / 900 + p.faz) * 12 * dt - kx + 6 * dt;
        sar(p);
        hc.moveTo(p.x + p.r, p.y);
        hc.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      }
      hc.fill();
    } else if (tur === 'yagmur') {
      hc.strokeStyle = 'rgba(205,220,240,0.55)';
      hc.lineWidth = 1;
      hc.beginPath();
      for (const p of taneler) {
        p.y += p.hiz * dt - ky;
        p.x += p.hiz * 0.22 * dt - kx;
        sar(p);
        hc.moveTo(p.x, p.y);
        hc.lineTo(p.x - p.r * 0.22, p.y - p.r);
        if (Math.random() < 0.012) sicramalar.push({ x: p.x, y: p.y, yas: 0 });
      }
      hc.stroke();
      hc.strokeStyle = 'rgba(220,232,248,0.6)';
      sicramalar = sicramalar.filter((c) => (c.yas += dt) < 0.3);
      for (const c of sicramalar) {
        c.x -= kx;
        c.y -= ky;
        hc.beginPath();
        hc.ellipse(c.x, c.y, 2 + c.yas * 14, 1 + c.yas * 5, 0, 0, Math.PI * 2);
        hc.stroke();
      }
    } else if (tur === 'sis') {
      const t = T();
      for (const b of sisler) {
        b.x += 10 * dt - kx;
        b.y -= ky;
        if (b.x - b.r > G) b.x = -b.r;
        if (b.x + b.r < -2 * t) b.x = G + b.r;
        if (b.y - b.r > Y) b.y = -b.r;
        if (b.y + b.r < -2 * t) b.y = Y + b.r;
        const g = hc.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, `rgba(238,242,246,${0.42 * siddet})`);
        g.addColorStop(1, 'rgba(238,242,246,0)');
        hc.fillStyle = g;
        hc.fillRect(b.x - b.r, b.y - b.r, 2 * b.r, 2 * b.r);
      }
    } else if (tur === 'sicak') {
      // Yerden yükselen sıcağın titreşimi: kıvrılarak yükselen saydam şeritler
      hc.strokeStyle = `rgba(255,248,230,${0.2 * siddet})`;
      hc.lineWidth = 4;
      for (let i = 0; i < 7; i++) {
        const y0 = Y - ((zaman / 40 + i * (Y / 7)) % (Y + 40));
        hc.beginPath();
        for (let x = 0; x <= G; x += 12) {
          const y = y0 + Math.sin(x / 38 + zaman / 260 + i) * 4;
          if (x === 0) hc.moveTo(x, y);
          else hc.lineTo(x, y);
        }
        hc.stroke();
      }
    }
  }

  function kare(zaman) {
    istek = requestAnimationFrame(kare);
    if (zaman - son < (azHareket ? 250 : KARE_MS)) return;
    const dt = Math.min(0.1, (zaman - son) / 1000);
    son = zaman;
    if (!G) boyut();
    const k = kamera();
    const simdi = saat();
    havaCiz(havaDurumu(harita.plaka, harita.bolge, simdi), k, dt, zaman);
    isikCiz(gunVakti(simdi), k, zaman);
    sonKamera = k;
  }

  istek = requestAnimationFrame(kare);
  return {
    boyut,
    kapat() {
      cancelAnimationFrame(istek);
    },
  };
}
