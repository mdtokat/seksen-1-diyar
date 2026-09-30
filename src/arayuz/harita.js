// Türkiye haritası: iller düğüm, kara komşulukları çizgi olarak çizilir.
// Kaydırma (tek parmak / fare), yakınlaştırma (iki parmak / tekerlek / butonlar),
// il bilgi kartı ve komşu illere seyahat.
import { iller } from '../veri/iller.js';
import { bolgeler } from '../veri/bolgeler.js';
import { yemekler } from '../veri/yemekler.js';
import { ilSinirlari, IL_SINIRLARI_KAYNAK } from '../veri/ilSinirlari.js';
import { metinler } from '../veri/metinler.js';
import {
  seyahatKontrol,
  seyahatEt,
  ilDurumu,
  arinmaYuzdesi,
} from '../oyun/ilerleme.js';
import { bossDurumu, bossKosullari } from '../oyun/ilerleme.js';
import { dusmanlar } from '../veri/dusmanlar.js';
import { GOREV_VERENLER } from '../veri/gorevler.js';
import { verenGorevleri, gorevDurumu } from '../oyun/gorevler.js';
import { sablon, kacis, ilerlemeCubugu, bildirimGoster } from './bilesenler.js';
import { karakterDugmesiniCiz } from './karakterDugmesi.js';
import { cografyaSatirlari, ozellikRozetleri } from './cografyaBilgisi.js';

const M = metinler.harita;
const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const bolgeHaritasi = new Map(bolgeler.map((b) => [b.anahtar, b]));

// ── İzdüşüm ve görünüm matematiği (saf fonksiyonlar) ─────

export const OLCEK = 100; // k: bir enlem derecesinin SVG birimi
const KOS39 = Math.cos((39 * Math.PI) / 180);

// plan.md Bölüm 4: x = (lon − 25.5) × k × cos(39°), y = (42.2 − lat) × k
export function izdusum(lat, lon) {
  return { x: (lon - 25.5) * OLCEK * KOS39, y: (42.2 - lat) * OLCEK };
}

// Noktaları kapsayan kutu, kenar boşluğuyla.
export function kapsayanKutu(noktalar, bosluk = 0) {
  const xs = noktalar.map((n) => n.x);
  const ys = noktalar.map((n) => n.y);
  return {
    minX: Math.min(...xs) - bosluk,
    minY: Math.min(...ys) - bosluk,
    maxX: Math.max(...xs) + bosluk,
    maxY: Math.max(...ys) + bosluk,
  };
}

// Görünüm: { x, y, s } — ekranın sol üst köşesindeki dünya koordinatı ve
// ölçek (bir SVG biriminin kaç piksel olduğu).

// Kutuyu ekrana sığdıran görünüm.
export function sigdir(kutu, genislik, yukseklik) {
  const s = Math.min(genislik / (kutu.maxX - kutu.minX), yukseklik / (kutu.maxY - kutu.minY));
  const ortaX = (kutu.minX + kutu.maxX) / 2;
  const ortaY = (kutu.minY + kutu.maxY) / 2;
  return { x: ortaX - genislik / (2 * s), y: ortaY - yukseklik / (2 * s), s };
}

// Ekrandaki (px, py) noktası sabit kalacak şekilde ölçeği `carpan` kadar değiştirir.
export function yakinlastir(g, px, py, carpan) {
  const s = g.s * carpan;
  const dunyaX = g.x + px / g.s;
  const dunyaY = g.y + py / g.s;
  return { x: dunyaX - px / s, y: dunyaY - py / s, s };
}

// Ekran pikseli cinsinden kaydırma.
export function kaydir(g, dx, dy) {
  return { x: g.x - dx / g.s, y: g.y - dy / g.s, s: g.s };
}

// Ölçeği sınırlar içinde tutar, ekranın ortasını harita kutusunun dışına çıkarmaz.
export function sinirla(g, genislik, yukseklik, kutu, enAzS, enCokS) {
  let sonuc = g;
  if (g.s < enAzS || g.s > enCokS) {
    const hedefS = Math.min(enCokS, Math.max(enAzS, g.s));
    sonuc = yakinlastir(g, genislik / 2, yukseklik / 2, hedefS / g.s);
  }
  const yariG = genislik / (2 * sonuc.s);
  const yariY = yukseklik / (2 * sonuc.s);
  const ortaX = Math.min(kutu.maxX, Math.max(kutu.minX, sonuc.x + yariG));
  const ortaY = Math.min(kutu.maxY, Math.max(kutu.minY, sonuc.y + yariY));
  return { x: ortaX - yariG, y: ortaY - yariY, s: sonuc.s };
}

// ── Çizim ────────────────────────────────────────────────

const KONUM = new Map(iller.map((il) => [il.plaka, izdusum(il.lat, il.lon)]));
const HARITA_KUTUSU = kapsayanKutu([...KONUM.values()], 70);
const EN_COK_OLCEK = 4;
const ETIKET_ESIGI = 0.65; // bu ölçeğin altında il adları gizlenir

const DENIZLER = [
  { anahtar: 'karadeniz', lat: 42.55, lon: 34.2 },
  { anahtar: 'akdeniz', lat: 35.75, lon: 31.6 },
  { anahtar: 'ege', lat: 38.3, lon: 25.9, dikey: true },
  { anahtar: 'marmara', lat: 40.6, lon: 28.35, kucuk: true },
];

// İl adlarını çakışmayacak biçimde yerleştirir: her il için sırayla alt, üst,
// sağ ve sol konumları denenir; önceden yerleşmiş etiketlere ve düğümlere
// çarpmayan ilk konum seçilir. Sonuç: { plaka: { x, y, hiza } } (düğüme göre).
function etiketleriYerlestir() {
  const YAZI = 11;
  const genislik = (ad) => ad.length * YAZI * 0.6;
  const secenekler = [
    { x: 0, y: 23, hiza: 'middle' },
    { x: 0, y: -15, hiza: 'middle' },
    { x: 14, y: 4, hiza: 'start' },
    { x: -14, y: 4, hiza: 'end' },
  ];
  const kutuHesapla = (merkez, ad, s) => {
    const g = genislik(ad);
    const sol = s.hiza === 'middle' ? -g / 2 : s.hiza === 'start' ? 0 : -g;
    return { x1: merkez.x + s.x + sol, x2: merkez.x + s.x + sol + g, y1: merkez.y + s.y - YAZI, y2: merkez.y + s.y + 2 };
  };
  const cakisir = (a, b) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
  const dugumKutulari = [...KONUM.values()].map((p) => ({ x1: p.x - 9, x2: p.x + 9, y1: p.y - 9, y2: p.y + 9 }));
  const yerlesen = [];
  const sonuc = {};
  const sirali = [...iller].sort((a, b) => KONUM.get(a.plaka).y - KONUM.get(b.plaka).y);
  for (const il of sirali) {
    const merkez = KONUM.get(il.plaka);
    let secim = secenekler[0];
    for (const s of secenekler) {
      const kutu = kutuHesapla(merkez, il.ad, s);
      if (!yerlesen.some((k) => cakisir(k, kutu)) && !dugumKutulari.some((k) => cakisir(k, kutu))) {
        secim = s;
        break;
      }
    }
    yerlesen.push(kutuHesapla(merkez, il.ad, secim));
    sonuc[il.plaka] = secim;
  }
  return sonuc;
}
const ETIKETLER = etiketleriYerlestir();

const KOMSULUKLAR = iller.flatMap((il) =>
  il.komsular.filter((k) => k > il.plaka).map((k) => [il.plaka, k]),
);

function svgOlustur() {
  // İllerin gerçek sınırları (OpenStreetMap). Dokunulunca il seçilir.
  const sekiller = iller
    .map((il) => `<path class="il-sekil" data-plaka="${il.plaka}" d="${ilSinirlari[il.plaka]}" />`)
    .join('');

  const denizler = DENIZLER.map((d) => {
    const { x, y } = izdusum(d.lat, d.lon);
    const donus = d.dikey ? ` transform="rotate(-90 ${x.toFixed(1)} ${y.toFixed(1)})"` : '';
    return `<text class="deniz${d.kucuk ? ' deniz-kucuk' : ''}" x="${x.toFixed(1)}" y="${y.toFixed(1)}"${donus}>${M.denizler[d.anahtar]}</text>`;
  }).join('');

  const cizgiler = KOMSULUKLAR.map(([a, b]) => {
    const p = KONUM.get(a);
    const q = KONUM.get(b);
    return `<line class="yol" data-a="${a}" data-b="${b}" x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" />`;
  }).join('');

  const dugumler = iller
    .map((il) => {
      const { x, y } = KONUM.get(il.plaka);
      const etiket = ETIKETLER[il.plaka];
      return `
      <g class="il" data-plaka="${il.plaka}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"
         tabindex="0" role="button" aria-label="${kacis(il.ad)}">
        <circle class="il-dokunma" r="17" />
        <circle class="il-halka" r="13" />
        <circle class="il-nokta" r="8" />
        <text class="il-isaret" y="3.5">✓</text>
        <text class="il-ad" x="${etiket.x}" y="${etiket.y}" text-anchor="${etiket.hiza}">${kacis(il.ad)}</text>
      </g>`;
    })
    .join('');

  return `
    <svg class="harita-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Türkiye haritası">
      <defs>
        <pattern id="arinmis-desen" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="#cfe6c9" />
          <path d="M0 0 V8" stroke="#2e9e4f" stroke-width="2.5" opacity=".55" />
        </pattern>
      </defs>
      <g class="il-sekilleri">${sekiller}</g>
      <g class="denizler" aria-hidden="true">${denizler}</g>
      <g class="yollar" aria-hidden="true">${cizgiler}</g>
      <g class="iller">${dugumler}</g>
    </svg>`;
}

function lejant() {
  const L = M.lejant;
  return `
    <ul class="lejant" aria-label="Harita açıklaması">
      <li><span class="lejant-nokta kilitli"></span>${L.kilitli}</li>
      <li><span class="lejant-nokta acik"></span>${L.acik}</li>
      <li><span class="lejant-nokta bulunulan"></span>${L.bulunulan}</li>
      <li><span class="lejant-nokta arinmis">✓</span>${L.arinmis}</li>
    </ul>`;
}

// ── Harita ekranı ────────────────────────────────────────

// Harita ekranını `kap` içine kurar. Temizlik fonksiyonu döndürür.
// secenekler: { baslikaDon, karakterGoster, ilGoster }
export function haritaEkrani(kap, depo, { baslikaDon, karakterGoster, ilGoster } = {}) {
  kap.innerHTML = `
    <div class="harita-ekrani">
      <header class="ust-cubuk">
        <button class="simge-buton" data-eylem="baslik" aria-label="${M.baslikEkrani}" title="${M.baslikEkrani}">←</button>
        <div class="konum-bilgisi" aria-live="polite"></div>
        <button class="karakter-dugmesi" data-eylem="karakter" hidden></button>
      </header>
      <div class="harita-kap">
        ${svgOlustur()}
        <div class="harita-kontrol">
          <button class="simge-buton" data-eylem="yakin" aria-label="${M.yakinlastir}" title="${M.yakinlastir}">+</button>
          <button class="simge-buton" data-eylem="uzak" aria-label="${M.uzaklastir}" title="${M.uzaklastir}">−</button>
          <button class="simge-buton" data-eylem="ortala" aria-label="${M.ortala}" title="${M.ortala}">◎</button>
          <button class="simge-buton" data-eylem="tumu" aria-label="${M.tumu}" title="${M.tumu}">⤢</button>
        </div>
        ${lejant()}
        <p class="harita-ipucu">${M.ipucu}</p>
        <p class="harita-atif">${IL_SINIRLARI_KAYNAK}</p>
      </div>
      <section class="il-karti" hidden aria-live="polite"></section>
    </div>`;

  const ekran = kap.querySelector('.harita-ekrani');
  const haritaKap = ekran.querySelector('.harita-kap');
  const svg = ekran.querySelector('.harita-svg');
  const kart = ekran.querySelector('.il-karti');
  const konumBilgisi = ekran.querySelector('.konum-bilgisi');
  const karakterDugmesi = ekran.querySelector('.karakter-dugmesi');
  const dugumler = new Map(
    [...svg.querySelectorAll('g.il')].map((g) => [Number(g.dataset.plaka), g]),
  );
  const sekiller = new Map(
    [...svg.querySelectorAll('.il-sekil')].map((p) => [Number(p.dataset.plaka), p]),
  );
  const yollar = [...svg.querySelectorAll('line.yol')];

  let secili = null;
  let gorunum = { x: 0, y: 0, s: 1 };
  let boyut = { g: 1, y: 1 };

  // ── Görünüm ──
  function enAzOlcek() {
    return 0.9 * sigdir(HARITA_KUTUSU, boyut.g, boyut.y).s;
  }

  function gorunumAyarla(yeni) {
    gorunum = sinirla(yeni, boyut.g, boyut.y, HARITA_KUTUSU, enAzOlcek(), EN_COK_OLCEK);
    const { x, y, s } = gorunum;
    svg.setAttribute('viewBox', `${x} ${y} ${boyut.g / s} ${boyut.y / s}`);
    svg.classList.toggle('etiketsiz', s < ETIKET_ESIGI);
  }

  function ileOdaklan(plaka) {
    const il = ilHaritasi.get(plaka);
    const bolgeIlleri = iller.filter((i) => i.bolge === il.bolge).map((i) => KONUM.get(i.plaka));
    const kutu = kapsayanKutu(bolgeIlleri, 40);
    const yeni = sigdir(kutu, boyut.g, boyut.y);
    if (yeni.s >= ETIKET_ESIGI) {
      gorunumAyarla(yeni);
    } else {
      // Bölge sığmıyorsa etiketler okunaklı kalsın diye ile ortalanarak yakınlaş
      const p = KONUM.get(plaka);
      const s = ETIKET_ESIGI;
      gorunumAyarla({ x: p.x - boyut.g / (2 * s), y: p.y - boyut.y / (2 * s), s });
    }
  }

  function ekranda(plaka, kenar = 40) {
    const p = KONUM.get(plaka);
    const px = (p.x - gorunum.x) * gorunum.s;
    const py = (p.y - gorunum.y) * gorunum.s;
    return px > kenar && py > kenar && px < boyut.g - kenar && py < boyut.y - kenar;
  }

  function boyutOlc() {
    const r = haritaKap.getBoundingClientRect();
    const eski = boyut;
    boyut = { g: Math.max(1, r.width), y: Math.max(1, r.height) };
    return eski;
  }

  // ── Boyama ──
  function boya(durum) {
    for (const [plaka, g] of dugumler) {
      const il = ilHaritasi.get(plaka);
      const hal = ilDurumu(durum, plaka);
      const renk = hal === 'kilitli' ? 'var(--kilitli)' : bolgeHaritasi.get(il.bolge).renk;
      g.classList.remove('kilitli', 'acik', 'arinmis');
      g.classList.add(hal);
      g.classList.toggle('bulunulan', plaka === durum.konum);
      g.classList.toggle('gidilebilir', seyahatKontrol(durum, plaka).olur);
      g.classList.toggle('secili', plaka === secili);
      g.style.setProperty('--bolge-rengi', renk);
      const sekil = sekiller.get(plaka);
      sekil.style.setProperty('--bolge-rengi', renk);
      sekil.classList.remove('kilitli', 'acik', 'arinmis');
      sekil.classList.add(hal);
      sekil.classList.toggle('bulunulan', plaka === durum.konum);
      sekil.classList.toggle('gidilebilir', seyahatKontrol(durum, plaka).olur);
      sekil.classList.toggle('secili', plaka === secili);
    }
    for (const cizgi of yollar) {
      const a = Number(cizgi.dataset.a);
      const b = Number(cizgi.dataset.b);
      const kilitli = ilDurumu(durum, a) === 'kilitli' || ilDurumu(durum, b) === 'kilitli';
      const acikYol =
        (a === durum.konum && seyahatKontrol(durum, b).olur) ||
        (b === durum.konum && seyahatKontrol(durum, a).olur);
      cizgi.classList.toggle('kilitli', kilitli);
      cizgi.classList.toggle('acik-yol', acikYol);
    }
    const il = ilHaritasi.get(durum.konum);
    konumBilgisi.innerHTML = `
      <span class="konum-etiket">${M.konum}</span>
      <strong>📍 ${kacis(il.ad)}</strong>
      <span class="konum-bolge">${kacis(bolgeHaritasi.get(il.bolge).ad)}</span>`;
    karakterDugmesiniCiz(karakterDugmesi, durum.oyuncu);
    if (secili !== null) kartiDoldur(durum, secili);
  }

  // ── İl kartı ──
  function kartiDoldur(durum, plaka) {
    const il = ilHaritasi.get(plaka);
    const bolge = bolgeHaritasi.get(il.bolge);
    const yemek = yemekler[il.yemek];
    const yuzde = arinmaYuzdesi(durum, plaka);
    const kontrol = seyahatKontrol(durum, plaka);

    let eylem;
    if (kontrol.olur) {
      eylem = `<button class="buton buton-ana" data-eylem="git">${M.git}</button>`;
    } else {
      const mesaj = sablon(metinler.seyahatEngeli[kontrol.neden], {
        hedef: il.ad,
        konum: ilHaritasi.get(durum.konum).ad,
        bolge: bolge.ad,
      });
      const sinif = kontrol.neden === 'ayni_il' ? 'kart-not buradasin' : 'kart-not engel';
      eylem = `<p class="${sinif}">${kacis(kontrol.neden === 'ayni_il' ? M.buradasin : mesaj)}</p>`;
      if (kontrol.neden === 'ayni_il' && durum.oyuncu && ilGoster) {
        eylem += `<button class="buton buton-ana" data-eylem="il">🚶 ${M.ileGir}</button>`;
      }
    }

    kart.innerHTML = `
      <button class="simge-buton kart-kapat" data-eylem="kapat" aria-label="${M.kapat}">✕</button>
      <h2 class="kart-baslik">${kacis(il.ad)} <span class="plaka">${String(il.plaka).padStart(2, '0')}</span></h2>
      <p class="kart-bolge"><span class="bolge-noktasi" style="background:${bolge.renk}"></span>${kacis(bolge.ad)}</p>
      ${ozellikRozetleri(plaka)}
      <dl class="kart-bilgi">
        <div><dt>${M.seviye}</dt><dd>${sablon(M.seviyeDegeri, { en_az: il.seviye[0], en_cok: il.seviye[1] })}</dd></div>
        <div><dt>${M.yemek}</dt><dd><span aria-hidden="true">${yemek.ikon}</span> ${kacis(yemek.ad)}<small>${kacis(yemek.aciklama)}</small></dd></div>
        <div><dt>${M.arinma}</dt><dd>${ilerlemeCubugu(yuzde, { etiket: M.arinma, renk: 'var(--arinmis)' })}</dd></div>
        ${bossSatiri(durum, il, bolge)}
        ${olanaklarSatiri(il, bolge)}
        ${cografyaSatirlari(plaka)}
      </dl>
      <div class="kart-eylem">${eylem}</div>`;
  }

  // İlde alınabilir görev veren muhtar ya da Ahi Baba.
  function gorevSatiri(il) {
    const durum = depo.al();
    const verenler = GOREV_VERENLER.filter((v) =>
      verenGorevleri(il.plaka, v).some((a) => gorevDurumu(durum, a) === 'alinabilir'));
    return verenler.length ? sablon(M.gorev, { verenler: verenler.map((v) => metinler.gorev.verenler[v]).join(', ') }) : null;
  }

  // İldeki kervansaray, Ahi esnafı ve görev verenler.
  function olanaklarSatiri(il, bolge) {
    const olanaklar = [
      bolge.kervansarayIlleri.includes(il.plaka) && M.kervansaray,
      bolge.ahiIlleri.includes(il.plaka) && M.ahi,
      gorevSatiri(il),
    ].filter(Boolean);
    return olanaklar.length ? `<div><dt>${M.olanaklar}</dt><dd>${olanaklar.join('<br>')}</dd></div>` : '';
  }

  // Bossun ilinde: bossun adı ve mühür durumu.
  function bossSatiri(durum, il, bolge) {
    if (bolge.bossIli !== il.plaka) return '';
    const B = metinler.boss;
    const hal = bossDurumu(durum, bolge.anahtar);
    const ek = hal === 'muhurlu' ? `<small>${sablon(B.kosul, bossKosullari(durum, bolge.anahtar))}</small>` : '';
    const etiket = B.durum[hal] ?? '';
    return `<div><dt>${B.kartBasligi}</dt><dd>${kacis(dusmanlar[bolge.boss].ad)}${etiket ? ` — ${etiket}` : ''}${ek}</dd></div>`;
  }

  function ilSec(plaka) {
    secili = plaka;
    kart.hidden = false;
    boya(depo.al());
  }

  function kartiKapat() {
    secili = null;
    kart.hidden = true;
    boya(depo.al());
  }

  function seyahatEtVeBildir(plaka) {
    const once = depo.al();
    const sonra = seyahatEt(once, plaka);
    if (sonra === once) return;
    depo.ayarla(sonra);
    bildirimGoster(ekran, sablon(M.varis, { il: ilHaritasi.get(plaka).ad }));
    if (!ekranda(plaka)) {
      const p = KONUM.get(plaka);
      gorunumAyarla({ x: p.x - boyut.g / (2 * gorunum.s), y: p.y - boyut.y / (2 * gorunum.s), s: gorunum.s });
    }
  }

  // ── Butonlar ──
  function tiklama(e) {
    const buton = e.target.closest('[data-eylem]');
    if (!buton) return;
    const merkezX = boyut.g / 2;
    const merkezY = boyut.y / 2;
    switch (buton.dataset.eylem) {
      case 'baslik': baslikaDon?.(); break;
      case 'yakin': gorunumAyarla(yakinlastir(gorunum, merkezX, merkezY, 1.5)); break;
      case 'uzak': gorunumAyarla(yakinlastir(gorunum, merkezX, merkezY, 1 / 1.5)); break;
      case 'ortala': ileOdaklan(depo.al().konum); break;
      case 'tumu': gorunumAyarla(sigdir(HARITA_KUTUSU, boyut.g, boyut.y)); break;
      case 'kapat': kartiKapat(); break;
      case 'git': seyahatEtVeBildir(secili); break;
      case 'karakter': karakterGoster?.(); break;
      case 'il': ilGoster?.(); break;
    }
  }
  ekran.addEventListener('click', tiklama);

  // ── Klavye ──
  svg.addEventListener('keydown', (e) => {
    const g = e.target.closest?.('g.il');
    if (g && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      ilSec(Number(g.dataset.plaka));
    }
  });
  ekran.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !kart.hidden) kartiKapat();
  });

  // ── Dokunma ve fare: kaydırma, iki parmakla yakınlaştırma, dokunarak seçme ──
  const isaretciler = new Map();
  let dokunus = null; // { x, y, plaka, hareket }

  function yerel(e) {
    const r = svg.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  const ipucu = ekran.querySelector('.harita-ipucu');
  svg.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    ipucu.hidden = true;
    svg.setPointerCapture(e.pointerId);
    isaretciler.set(e.pointerId, yerel(e));
    if (isaretciler.size === 1) {
      const g = e.target.closest?.('g.il, .il-sekil');
      dokunus = { ...yerel(e), plaka: g ? Number(g.dataset.plaka) : null, hareket: false };
    } else if (dokunus) {
      dokunus.hareket = true;
    }
  });

  svg.addEventListener('pointermove', (e) => {
    if (!isaretciler.has(e.pointerId)) return;
    const onceki = [...isaretciler.values()];
    isaretciler.set(e.pointerId, yerel(e));
    const simdiki = [...isaretciler.values()];

    if (simdiki.length === 1) {
      const eski = onceki[0];
      const yeni = simdiki[0];
      if (dokunus && Math.hypot(yeni.x - dokunus.x, yeni.y - dokunus.y) > 6) dokunus.hareket = true;
      if (!dokunus || dokunus.hareket) gorunumAyarla(kaydir(gorunum, yeni.x - eski.x, yeni.y - eski.y));
    } else if (simdiki.length === 2) {
      const [a0, b0] = onceki;
      const [a1, b1] = simdiki;
      const orta0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 };
      const orta1 = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 };
      const oran = Math.hypot(a1.x - b1.x, a1.y - b1.y) / Math.max(1, Math.hypot(a0.x - b0.x, a0.y - b0.y));
      let g = kaydir(gorunum, orta1.x - orta0.x, orta1.y - orta0.y);
      g = yakinlastir(g, orta1.x, orta1.y, oran);
      gorunumAyarla(g);
    }
  });

  function birak(e) {
    if (!isaretciler.has(e.pointerId)) return;
    isaretciler.delete(e.pointerId);
    if (isaretciler.size === 0) {
      if (e.type === 'pointerup' && dokunus && !dokunus.hareket && dokunus.plaka !== null) {
        ilSec(dokunus.plaka);
      }
      dokunus = null;
    }
  }
  svg.addEventListener('pointerup', birak);
  svg.addEventListener('pointercancel', birak);

  svg.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const p = yerel(e);
      gorunumAyarla(yakinlastir(gorunum, p.x, p.y, Math.exp(-e.deltaY * 0.0015)));
    },
    { passive: false },
  );

  // ── Boyut değişimi ──
  const gozlemci = new ResizeObserver(() => {
    const eski = boyutOlc();
    // Ekranın ortasındaki noktayı koru
    const ortaX = gorunum.x + eski.g / (2 * gorunum.s);
    const ortaY = gorunum.y + eski.y / (2 * gorunum.s);
    gorunumAyarla({ x: ortaX - boyut.g / (2 * gorunum.s), y: ortaY - boyut.y / (2 * gorunum.s), s: gorunum.s });
  });

  // ── Başlat ──
  boyutOlc();
  ileOdaklan(depo.al().konum);
  gozlemci.observe(haritaKap);
  const aboneliktenCik = depo.abone(boya);
  boya(depo.al());

  return () => {
    gozlemci.disconnect();
    aboneliktenCik();
  };
}
