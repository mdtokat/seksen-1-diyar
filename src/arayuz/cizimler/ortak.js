// Çizimlerin ortak parçaları. Tüm çizimler 120×120'lik bir tuvale göre yapılır;
// zemin çizgisi y ≈ 108'dedir. Işık sol üstten gelir: hacimler üstte açık, altta
// koyudur; gölgeler sağ alta düşer.
//
// Dış çizgiler tek bir lacivert değil, her parçanın kendi renginin koyusudur
// (konturla): yeşil yaprak koyu yeşil, kırmızı kaftan koyu kızıl çizgiyle çevrilir.
// Böylece figürler çizgi film gibi değil, daha dolgun ve doğal görünür. Kendi
// dolgusu olmayan ince çizgiler (kaş, ağız, kıvrım) bu koyu nötr renkle çizilir.

export const CIZGI = '#2b2433';

// ── Renk yardımcıları ───────────────────────────────────

const uzat = (r) => (r.length === 4 ? `#${r[1]}${r[1]}${r[2]}${r[2]}${r[3]}${r[3]}` : r).toLowerCase();
const rgb = (r) => {
  const h = uzat(r);
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const hex = (d) => `#${d.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;

// İki rengi karıştırır: oran 0 → `renk`, 1 → `hedef`.
export function karistir(renk, hedef, oran) {
  const a = rgb(renk);
  const b = rgb(hedef);
  return hex(a.map((v, i) => v + (b[i] - v) * oran));
}

// İki renk arasındaki uzaklık (RGB uzayında; 0 aynı renk, ~441 siyah–beyaz).
export function renkFarki(a, b) {
  const x = rgb(a);
  const y = rgb(b);
  return Math.hypot(...x.map((v, i) => v - y[i]));
}

// Bir rengin dış çizgisi: aynı tonun belirgin biçimde koyusu.
export const kontur = (renk) => karistir(renk, '#1c1622', 0.6);

// Açık ton beyaza, koyu ton laciverte doğru gider (gölgeler soğuk ve çini paletinde kalır).
export const acik = (renk, oran = 0.3) => karistir(renk, '#fffaf0', oran);
export const koyu = (renk, oran = 0.3) => karistir(renk, '#10183a', oran);

// ── Boyalar ─────────────────────────────────────────────
// Çizimler gradyanlara `url(#@<tür><renk>)` biçiminde başvurur; svgSar() kullanılan
// gradyanları bulup tanımlar ve kimliklere her SVG'ye özgü bir ön ek verir (çizimin
// kendi tanımladığı `id="@…"` kimlikleri de aynı ön eki alır). Böylece
// sayfadaki onlarca çizimin kimlikleri çakışmaz, gizli bir SVG'nin tanımı da
// başkasını bozmaz.
//   h: hacim (sol üstten aydınlanan yüzey)   k: küre (yuvarlak, parlak nokta)
//   m: metal (parlak bantlı)                  p: ışıltı (merkezden saydamlaşan)
const boya = (tur) => (renk) => `url(#@${tur}${uzat(renk).slice(1)})`;
export const hacim = boya('h');
export const kure = boya('k');
export const metal = boya('m');
export const isilti = boya('p');

const durak = (o, renk, saydam = 1) =>
  `<stop offset="${o}" stop-color="${renk}"${saydam < 1 ? ` stop-opacity="${saydam}"` : ''}/>`;

const TANIMLAR = {
  h: (id, r) => `<linearGradient id="${id}" x1="0" y1="0" x2=".55" y2="1">${
    durak(0, acik(r, 0.32))}${durak(0.45, r)}${durak(1, koyu(r, 0.32))}</linearGradient>`,
  k: (id, r) => `<radialGradient id="${id}" cx=".38" cy=".32" r=".75">${
    durak(0, acik(r, 0.45))}${durak(0.45, r)}${durak(1, koyu(r, 0.38))}</radialGradient>`,
  m: (id, r) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${
    durak(0, acik(r, 0.75))}${durak(0.3, r)}${durak(0.48, acik(r, 0.55))}${durak(0.62, koyu(r, 0.2))}${durak(1, koyu(r, 0.45))}</linearGradient>`,
  p: (id, r) => `<radialGradient id="${id}">${
    durak(0, r, 0.95)}${durak(0.35, r, 0.55)}${durak(1, r, 0)}</radialGradient>`,
};

let sayac = 0;

// `@` ile başlayan boya başvurularını tanımlar ve kimlikleri tekilleştirir.
// Dönen değer: { tanimlar, icerik }.
export function boyalariCoz(icerik, onEk = `c${(++sayac).toString(36)}-`) {
  const kullanilan = new Set(icerik.match(/#@[hkmp][0-9a-f]{6}/g));
  const tanimlar = [...kullanilan]
    .map((b) => TANIMLAR[b[2]](`${onEk}${b.slice(2)}`, `#${b.slice(3)}`))
    .join('');
  return { tanimlar, icerik: icerik.replaceAll('#@', `#${onEk}`).replaceAll('id="@', `id="${onEk}`) };
}

// Dış çizgileri parçanın kendi dolgusuna göre renklendirir. `stroke="@k"` yer tutucusu
// dolgunun koyusuna çevrilir; `otomatik` ise kendi çizgisi olmayan dolgulu parçalara da
// çizgi eklenir (svgSar'daki figürler). Dolgusu bir renk ya da boya (`url(#@h…)`) değilse
// yer tutucu ortak çizgi rengini alır, otomatik çizgi eklenmez.
const SEKIL = /<(path|rect|circle|ellipse|polygon)\b([^>]*?)(\/?)>/g;
const dolguRengi = (oz) => {
  const m = oz.match(/\sfill="(?:#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})|url\(#@[hkm]([0-9a-f]{6})\))"/);
  return m ? `#${m[1] ?? m[2]}` : null;
};
export function konturla(icerik, { otomatik = false } = {}) {
  return icerik.replace(SEKIL, (butun, ad, oz, kapanis) => {
    if (oz.includes('stroke="@k"')) {
      const renk = dolguRengi(oz);
      return `<${ad}${oz.replace('stroke="@k"', `stroke="${renk ? kontur(renk) : CIZGI}"`)}${kapanis}>`;
    }
    if (!otomatik || /\sstroke="/.test(oz)) return butun;
    const renk = dolguRengi(oz);
    return renk ? `<${ad}${oz} stroke="${kontur(renk)}"${kapanis}>` : butun;
  });
}

// Tek bir şeklin `opacity`si, dolgu ve çizgi saydamlığına (fill-opacity, stroke-opacity)
// çevrilir. Görünüş neredeyse aynıdır (yalnız aynı şeklin dolgusuyla çizgisinin
// kesiştiği ince şerit biraz koyulaşır); ama tarayıcı her `opacity` için ayrı bir efekt
// katmanı ve boyama parçası açar. Haritada binlerce gölge ve leke olduğundan bu fark
// her yeniden boyamada katlanır. Gruplara (<g>) dokunulmaz.
const SAYDAM = /<(path|rect|circle|ellipse|polygon)\b([^>]*?)\sopacity="([\d.]+)"([^>]*?)(\/?)>/g;
export function saydamligiYay(icerik) {
  return icerik.replace(SAYDAM, (butun, ad, once, deger, sonra, kapanis) => {
    const oz = once + sonra;
    if (/\s(fill|stroke)-opacity="/.test(oz)) return butun;
    const dolgu = !/\sfill="none"/.test(oz);
    const cizgi = /\sstroke="(?!none)/.test(oz);
    return `<${ad}${oz}${dolgu ? ` fill-opacity="${deger}"` : ''}${cizgi ? ` stroke-opacity="${deger}"` : ''}${kapanis}>`;
  });
}

// Çizimi SVG kabına sarar. `sinif` CSS sınıfı, `etiket` ekran okuyucu metni.
export function svgSar(icerik, { sinif = 'cizim', etiket = '' } = {}) {
  const erisim = etiket ? `role="img" aria-label="${etiket}"` : 'aria-hidden="true"';
  const c = boyalariCoz(saydamligiYay(konturla(icerik, { otomatik: true })));
  return `<svg class="${sinif}" viewBox="0 0 120 120" ${erisim}>${c.tanimlar ? `<defs>${c.tanimlar}</defs>` : ''}
    <g stroke="${CIZGI}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">${c.icerik}</g>
  </svg>`;
}

// ── Ortak parçalar ──────────────────────────────────────

// Figürün altındaki yumuşak gölge (ışık sol üstten: biraz sağa kayar).
export const golge = (rx = 32) =>
  `<ellipse cx="62" cy="108" rx="${rx}" ry="6" fill="${isilti('#10183a')}" opacity=".5" stroke="none"/>`;

// Yüzeye düşen parlaklık ve gölge şeritleri (dış çizgisiz).
export const parlak = (d, opaklik = 0.35) =>
  `<path d="${d}" fill="none" stroke="#fff" stroke-width="2" opacity="${opaklik}"/>`;
export const leke = (d, renk, opaklik = 0.3) =>
  `<path d="${d}" fill="${renk}" stroke="none" opacity="${opaklik}"/>`;

// Parlayan bir göz: ışıltı halesi + çekirdek.
export const parlakGoz = (x, y, renk, r = 2.6) => `
  <circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="${isilti(renk)}" stroke="none" opacity=".75"/>
  <circle cx="${x}" cy="${y}" r="${r}" fill="${renk}" stroke-width="1"/>
  <circle cx="${x - r * 0.3}" cy="${y - r * 0.35}" r="${r * 0.35}" fill="#fff" stroke="none"/>`;

// Bossların arkasındaki sihir halesi: ışıltı, dönen kesik halka ve rün işaretleri.
export const hale = (renk) => {
  const runler = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = (60 + Math.cos(a) * 48).toFixed(1);
    const y = (58 + Math.sin(a) * 48).toFixed(1);
    return `<path d="M${x} ${(y - 3).toFixed(1)} l2.6 3 l-2.6 3 l-2.6 -3 z" fill="${renk}" stroke="none" opacity=".8"/>`;
  }).join('');
  return `
  <circle cx="60" cy="58" r="56" fill="${isilti(renk)}" stroke="none" opacity=".55"/>
  <g class="hale-halka">
    <circle cx="60" cy="58" r="44" fill="none" stroke="${renk}" stroke-width="1.5" stroke-dasharray="3 6" opacity=".75"/>
    <circle cx="60" cy="58" r="48" fill="none" stroke="${renk}" stroke-width=".8" opacity=".35"/>
    ${runler}
  </g>`;
};

// Yatay aynalama: sağa bakan bir çizimi sola çevirir.
export const aynala = (icerik) => `<g transform="translate(120 0) scale(-1 1)">${icerik}</g>`;
