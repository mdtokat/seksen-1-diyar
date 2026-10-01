// Bölgelere özgü, katmanlı manzara arka planları (zafer kartında): gökyüzü ve güneş ışıltısı, bulutlar,
// sisle soluklaşan uzak dağlar, bölgenin simge manzarası, ayrıntılı ön zemin ve kenar
// gölgesi. Tuval 400×240; zemin çizgisi y ≈ 190. Ekran dar olunca yanlar kırpılır,
// bu yüzden simge yapılar ortaya (x ≈ 90…310) yerleştirilir.
// Kırmızı çizgiler (plan.md Bölüm 2): ibadethaneler savaş alanı olarak çizilmez;
// tanrı heykeli ya da putlar yoktur.
import { boyalariCoz, isilti, kure, acik, koyu } from './ortak.js';

const LACI = '#1b2a5c';

// Dikey gradyan tanımı: renkler eşit aralıklı durak olur.
const dikey = (id, ...renkler) => `<linearGradient id="@${id}" x1="0" y1="0" x2="0" y2="1">${
  renkler.map((r, i) => `<stop offset="${(i / (renkler.length - 1)).toFixed(2)}" stop-color="${r}"/>`).join('')}</linearGradient>`;

// Gökyüzü (üç tonlu) ve kenar gölgesi tanımları.
const gok = (ust, orta, alt) => `
  <defs>${dikey('gok', ust, orta, alt)}
    <radialGradient id="@vinyet" cx=".5" cy=".42" r=".78">
      <stop offset=".6" stop-color="${LACI}" stop-opacity="0"/><stop offset="1" stop-color="${LACI}" stop-opacity=".38"/>
    </radialGradient></defs>
  <rect width="400" height="240" fill="url(#@gok)"/>`;

const vinyet = '<rect width="400" height="240" fill="url(#@vinyet)"/>';

// Güneş: geniş ışıltı, ışık huzmeleri ve parlak disk.
const gunes = (x, y, r, renk, huzme = true) => `
  <circle cx="${x}" cy="${y}" r="${r * 4}" fill="${isilti(renk)}" opacity=".55"/>
  ${huzme ? Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const u = (k, d) => `${(x + Math.cos(a + d) * k).toFixed(1)} ${(y + Math.sin(a + d) * k).toFixed(1)}`;
    return `<path d="M${u(r * 1.2, -0.06)} L${u(r * 3.6, -0.12)} L${u(r * 3.6, 0.12)} L${u(r * 1.2, 0.06)} Z" fill="#fff" opacity=".1"/>`;
  }).join('') : ''}
  <circle cx="${x}" cy="${y}" r="${r}" fill="${kure(renk)}"/>`;

// Yumuşak bulut kümesi.
const bulut = (x, y, s = 1, opaklik = 0.9) => `
  <g transform="translate(${x} ${y}) scale(${s})" opacity="${opaklik}">
    <ellipse cx="0" cy="6" rx="34" ry="8" fill="#fff"/>
    <circle cx="-14" cy="0" r="11" fill="#fff"/><circle cx="4" cy="-5" r="15" fill="#fff"/><circle cx="20" cy="2" r="9" fill="#fff"/>
    <ellipse cx="0" cy="11" rx="30" ry="3.5" fill="#c9d6e3" opacity=".6"/>
  </g>`;

const marti = (x, y, s = 1) =>
  `<path d="M${x} ${y} q${5 * s} ${-5 * s} ${10 * s} 0 q${5 * s} ${-5 * s} ${10 * s} 0" fill="none" stroke="${LACI}" stroke-width="1.5" opacity=".55"/>`;

// Su yüzeyindeki parıltılar.
const parilti = (noktalar, renk = '#fff') => noktalar
  .map(([x, y, g = 16]) => `<path d="M${x} ${y} h${g}" stroke="${renk}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`).join('');

// Ön zemin: iki tonlu toprak, yumuşak sırt ışığı ve ot tutamları.
function zemin(renk, koyuRenk, ot) {
  const tutam = (x, y, s = 1) => `<path d="M${x} ${y} q${-3 * s} ${-7 * s} ${-6 * s} ${-9 * s} M${x} ${y} q0 ${-8 * s} ${1 * s} ${-12 * s} M${x} ${y} q${3 * s} ${-6 * s} ${7 * s} ${-8 * s}" fill="none" stroke="${ot}" stroke-width="1.6" stroke-linecap="round"/>`;
  const tutamlar = [[18, 214, 1.2], [70, 198], [118, 230, 1.3], [178, 204, 0.9], [236, 226, 1.2], [288, 200], [342, 222, 1.3], [386, 206]]
    .map(([x, y, s]) => tutam(x, y, s)).join('');
  return `
  <defs>${dikey('zemin', acik(renk, 0.12), renk, koyuRenk)}</defs>
  <path d="M0 186 Q100 177 200 186 T400 183 L400 240 L0 240 Z" fill="url(#@zemin)"/>
  <path d="M0 186 Q100 177 200 186 T400 183" fill="none" stroke="${acik(renk, 0.4)}" stroke-width="2" opacity=".7"/>
  <path d="M0 210 Q120 200 240 212 T400 206 L400 240 L0 240 Z" fill="${koyu(koyuRenk, 0.15)}" opacity=".35"/>
  <ellipse cx="96" cy="222" rx="7" ry="3" fill="${koyu(renk, 0.3)}" opacity=".5"/><ellipse cx="300" cy="214" rx="5" ry="2.4" fill="${koyu(renk, 0.3)}" opacity=".5"/>
  ${tutamlar}`;
}

// Düşmanın bastığı sağdaki kıyı tümseği: suyun önüne uzanır ki yaratıklar suyun
// üstünde durmasın. Ön zeminden önce çizilir.
function sahne(renk, ot) {
  const tutam = (x, y) => `<path d="M${x} ${y} q-2 -4 -4 -6 M${x} ${y} q0 -5 1 -8 M${x} ${y} q2 -4 5 -5" fill="none" stroke="${ot}" stroke-width="1.4" stroke-linecap="round"/>`;
  return `
  <defs>${dikey('sahne', acik(renk, 0.18), renk)}</defs>
  <path d="M160 196 Q200 162 262 152 Q330 142 400 147 L400 200 Z" fill="url(#@sahne)"/>
  <path d="M160 196 Q200 162 262 152 Q330 142 400 147" fill="none" stroke="${acik(renk, 0.45)}" stroke-width="2"/>
  <path d="M168 192 Q206 164 262 155" fill="none" stroke="${koyu(renk, 0.2)}" stroke-width="3" opacity=".35"/>
  <ellipse cx="236" cy="170" rx="6" ry="2.6" fill="${koyu(renk, 0.25)}" opacity=".5"/><ellipse cx="368" cy="160" rx="4" ry="2" fill="${koyu(renk, 0.25)}" opacity=".5"/>
  ${tutam(214, 172)}${tutam(300, 156)}${tutam(352, 154)}`;
}

// Sisle soluklaşan dağ katmanı: tepede renk, eteğe doğru ufuk rengi.
const daglar = (id, d, renk, ufuk) => `<defs>${dikey(id, renk, ufuk)}</defs><path d="${d}" fill="url(#@${id})"/>`;

// Yuvarlak tepeli ağaç (zeytin, fıstık, portakal…).
const yuvarlakAgac = (x, y, s, renk, { meyve = null, govde = '#6e5b45' } = {}) => {
  const meyveler = meyve
    ? [[-9, -24], [6, -30], [12, -20], [-3, -34], [-14, -30]].map(([mx, my]) => `<circle cx="${mx}" cy="${my}" r="2.4" fill="${meyve}"/>`).join('')
    : '';
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="4" cy="1" rx="18" ry="3.5" fill="${LACI}" opacity=".18"/>
    <path d="M-2.5 0 Q-4 -12 -1 -20 L1 -20 Q4 -12 2.5 0 Z" fill="${govde}"/>
    <ellipse cx="0" cy="-28" rx="19" ry="12" fill="${renk}"/>
    <ellipse cx="-9" cy="-22" rx="10" ry="7" fill="${koyu(renk, 0.15)}"/><ellipse cx="11" cy="-23" rx="10" ry="7" fill="${koyu(renk, 0.15)}"/>
    <ellipse cx="-5" cy="-33" rx="9" ry="5" fill="${acik(renk, 0.25)}"/>
    ${meyveler}
  </g>`;
};

// Sivri ağaç (çam, köknar); `kar` varsa dalların üstü karlıdır.
const sivriAgac = (x, y, s, renk, kar = false) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="4" cy="1" rx="16" ry="3" fill="${LACI}" opacity=".18"/>
    <rect x="-2" y="-14" width="4" height="14" fill="#5b3a24"/>
    <path d="M0 -72 L12 -48 L6 -48 L17 -30 L9 -30 L21 -12 L-21 -12 L-9 -30 L-17 -30 L-6 -48 L-12 -48 Z" fill="${renk}"/>
    <path d="M0 -72 L12 -48 L6 -48 L17 -30 L9 -30 L21 -12 L0 -12 Z" fill="${koyu(renk, 0.25)}"/>
    ${kar ? '<path d="M0 -72 L7 -58 L-7 -58 Z M-6 -48 L6 -48 L10 -42 L-10 -42 Z M-9 -30 L9 -30 L13 -24 L-13 -24 Z" fill="#fff" opacity=".9"/>' : ''}
  </g>`;

// Lale (ön zeminde süs).
const lale = (x, y, renk) => `
  <path d="M${x} ${y} q-1 -9 0 -14" fill="none" stroke="#3f6232" stroke-width="1.6"/>
  <path d="M${x} ${y - 4} q-6 -3 -7 -9 q5 2 7 7" fill="#4f7a4a"/>
  <path d="M${x - 4} ${y - 20} q0 7 4 7 q4 0 4 -7 l-2 3 l-2 -4 l-2 4 Z" fill="${renk}"/>`;

const cicek = (x, y, renk) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${renk}"/><circle cx="${x}" cy="${y}" r="1" fill="#f2c94c"/>`;

// ── Bölgeler ─────────────────────────────────────────────

// Marmara: Boğaz, karşı kıyıda evler ve uzak köprü, Kız Kulesi, kayık, martılar, laleler.
function marmara() {
  const evler = Array.from({ length: 16 }, (_, i) => {
    const x = 18 + i * 23 + (i % 3) * 4;
    const y = 118 - Math.sin(i * 0.9) * 6 - (i % 2) * 4;
    return `<rect x="${x}" y="${y}" width="10" height="8" fill="${i % 3 ? '#f7efdc' : '#efd9b0'}"/><path d="M${x - 1} ${y} L${x + 5} ${y - 5} L${x + 11} ${y} Z" fill="${i % 2 ? '#c9483b' : '#b8573a'}"/>`;
  }).join('');
  return `${gok('#7fc4d8', '#bfe3e6', '#fbefd6')}
    ${gunes(322, 48, 20, '#f6d76b')}
    ${bulut(90, 46, 1)}${bulut(230, 30, 0.7, 0.8)}${bulut(380, 78, 0.6, 0.7)}
    ${daglar('karsi', 'M0 128 Q50 104 110 116 Q170 126 220 108 Q290 92 400 112 L400 140 L0 140 Z', '#6f9f9a', '#a9cfc8')}
    <g opacity=".75">
      <path d="M48 122 L52 86 L56 122 M150 120 L154 84 L158 120" stroke="#8aa9b8" stroke-width="3" fill="none"/>
      <path d="M20 112 Q52 88 54 86 Q104 112 154 85 Q170 98 200 106" stroke="#8aa9b8" stroke-width="1.4" fill="none"/>
      <path d="M10 112 L210 108" stroke="#8aa9b8" stroke-width="3"/>
    </g>
    ${evler}
    <defs>${dikey('deniz', '#3f97b8', '#2b7aa3', '#1f5f88')}</defs>
    <rect y="132" width="400" height="44" fill="url(#@deniz)"/>
    ${parilti([[20, 144, 40], [120, 150, 26], [250, 140, 30], [300, 156, 50], [70, 164, 30], [200, 168, 40], [340, 170, 24]], '#bfe9f0')}
    <path d="M186 148 Q200 138 214 148 Z" fill="#7b6a52"/>
    <path d="M190 148 L190 121 L210 121 L210 148 Z" fill="#f7efdc" stroke="${LACI}" stroke-width="1.2"/>
    <path d="M203 121 L203 148 L210 148 L210 121 Z" fill="#d8c9a8"/>
    <path d="M194 102 L194 121 L206 121 L206 102 Z" fill="#f7efdc" stroke="${LACI}" stroke-width="1.2"/>
    <path d="M192 103 L200 88 L208 103 Z" fill="#7d93a8" stroke="${LACI}" stroke-width="1.2"/>
    <path d="M200 88 L200 82" stroke="${LACI}" stroke-width="1.2"/><path d="M200 82 l6 2 l-6 2" fill="#d9483b"/>
    <path d="M197 110 h2 v5 h-2 z M197 128 h2 v6 h-2 z M193 132 h2 v5 h-2 z" fill="${LACI}"/>
    <path d="M186 148 Q200 152 214 148" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/>
    <g transform="translate(110 158)">
      <path d="M-14 0 h28 l-5 6 h-18 Z" fill="#7b5236" stroke="${LACI}" stroke-width="1"/>
      <path d="M0 0 L0 -24 L13 -2 Z" fill="#f7efdc" stroke="${LACI}" stroke-width="1"/><path d="M-1 -2 L-1 -20 L-11 -2 Z" fill="#e8d3a8" stroke="${LACI}" stroke-width="1"/>
    </g>
    ${marti(130, 64)}${marti(156, 50, 0.8)}${marti(250, 72, 0.9)}${marti(60, 80, 0.7)}
    ${sahne('#a9c98f', '#5f8a4a')}
    ${zemin('#a9c98f', '#6f8a58', '#5f8a4a')}
    ${lale(24, 232, '#d9483b')}${lale(36, 236, '#f2c94c')}${lale(370, 230, '#d9483b')}${lale(384, 236, '#b36ae0')}
    ${vinyet}`;
}

// Ege: tepede yel değirmenleri ve beyaz badanalı evler, zeytinlik, uzakta deniz,
// ön zeminde gelincikler.
function ege() {
  const degirmen = (x, y, s, aci) => `
    <g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-9 0 L-7 -34 L7 -34 L9 0 Z" fill="#fbf7ec" stroke="${LACI}" stroke-width="1.2"/>
      <path d="M3 -34 L7 -34 L9 0 L4 0 Z" fill="#e3dccb"/>
      <path d="M-9 -34 Q0 -46 9 -34 Z" fill="#c9772f" stroke="${LACI}" stroke-width="1.2"/>
      <path d="M-2 -8 h4 v8 h-4 z" fill="#3b7dc4"/>
      <g transform="translate(0 -36) rotate(${aci})">
        ${[0, 90, 180, 270].map((a) => `<g transform="rotate(${a})"><path d="M0 0 L0 -24" stroke="#5b3a24" stroke-width="1.2"/><path d="M0 -6 L6 -8 L6 -24 L0 -24 Z" fill="#fbf7ec" stroke="${LACI}" stroke-width=".8"/></g>`).join('')}
        <circle r="2" fill="#5b3a24"/>
      </g>
    </g>`;
  const ev = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-10" y="-14" width="20" height="14" fill="#fff" stroke="${LACI}" stroke-width=".8"/>
    <rect x="2" y="-14" width="8" height="14" fill="#e8e4da"/>
    <path d="M-3 0 v-7 h5 v7 z" fill="#3b7dc4"/><rect x="-8" y="-11" width="3.5" height="3.5" fill="#3b7dc4"/>
  </g>`;
  return `${gok('#8fcfe8', '#c9e8ef', '#fdf1d6')}
    ${gunes(70, 44, 22, '#f6d76b')}
    ${bulut(200, 34, 0.9)}${bulut(340, 56, 0.7, 0.8)}
    <defs>${dikey('deniz', '#4d9bd6', '#3b7dc4')}</defs>
    <rect y="112" width="400" height="22" fill="url(#@deniz)"/>
    ${parilti([[30, 118, 30], [160, 124, 20], [290, 120, 36]], '#cfe9f8')}
    ${daglar('ada', 'M240 116 Q270 98 300 110 Q320 104 340 116 Z', '#8aa6b8', '#a9c3d0')}
    ${daglar('tepe', 'M0 134 Q80 102 170 120 Q240 132 300 112 Q350 100 400 118 L400 172 L0 172 Z', '#b7c77e', '#a3b46c')}
    ${degirmen(150, 118, 1, 12)}${degirmen(184, 122, 0.85, 40)}${degirmen(212, 118, 0.95, 70)}
    ${ev(118, 132)}${ev(244, 128, 0.9)}${ev(266, 130, 0.8)}${ev(96, 136, 0.8)}
    <path d="M0 160 Q140 134 260 152 Q330 162 400 148 L400 192 L0 192 Z" fill="#9fb56a"/>
    ${[[40, 168, 0.8], [76, 172, 0.6], [300, 160, 0.8], [340, 166, 0.65], [370, 172, 0.55]].map(([x, y, s]) => yuvarlakAgac(x, y, s, '#8a9a5b', { meyve: '#3f4a2a' })).join('')}
    ${zemin('#cbb98a', '#9e8a5a', '#8a7a4a')}
    ${yuvarlakAgac(16, 222, 1.1, '#7f9150', { meyve: '#3f4a2a' })}${yuvarlakAgac(392, 226, 1.2, '#7f9150', { meyve: '#3f4a2a' })}
    ${cicek(60, 226, '#d9483b')}${cicek(70, 232, '#d9483b')}${cicek(330, 230, '#d9483b')}${cicek(352, 224, '#d9483b')}${cicek(214, 234, '#d9483b')}
    ${vinyet}`;
}

// Akdeniz: karlı Toros dorukları, kayalık burunda kale surları, parıltılı deniz,
// çam ve portakal ağaçları.
function akdeniz() {
  return `${gok('#f3a86a', '#f8cf94', '#fdf0d4')}
    ${gunes(300, 60, 26, '#fbe6a0')}
    ${bulut(120, 40, 0.8, 0.75)}${bulut(370, 30, 0.6, 0.6)}
    ${daglar('uzak', 'M0 120 L40 86 L80 104 L130 62 L180 100 L230 70 L280 104 L330 74 L400 100 L400 140 L0 140 Z', '#c09a82', '#e8c9a8')}
    <path d="M130 62 L118 76 L126 74 L132 80 L140 72 Z M230 70 L220 82 L228 80 L236 84 L242 80 Z M330 74 L322 84 L330 82 L338 86 Z" fill="#fff" opacity=".9"/>
    ${daglar('yakin', 'M0 140 L50 112 L90 128 L140 104 L190 132 L400 132 L400 150 L0 150 Z', '#9c7a5c', '#c8a684')}
    <defs>${dikey('deniz', '#3aa3c4', '#227fa8', '#1a6290')}</defs>
    <rect y="146" width="400" height="26" fill="url(#@deniz)"/>
    ${parilti([[200, 152, 40], [250, 158, 30], [300, 150, 60], [330, 162, 26], [30, 160, 24]], '#fff4cc')}
    <path d="M86 150 L96 112 L120 104 L150 108 L166 126 L170 150 Z" fill="#a8825e" stroke="${LACI}" stroke-width="1"/>
    <path d="M100 112 L100 96 L150 96 L150 110" fill="#d8c29a" stroke="${LACI}" stroke-width="1.2"/>
    <path d="M100 96 v-4 h5 v4 h5 v-4 h5 v4 h5 v-4 h5 v4 h5 v-4 h5 v4 h5 v-4 h5 v4 h5 v-4 h0" fill="none" stroke="${LACI}" stroke-width="1.2"/>
    <path d="M118 84 h16 v26 h-16 z" fill="#d8c29a" stroke="${LACI}" stroke-width="1.2"/>
    <path d="M118 84 v-4 h4 v4 h4 v-4 h4 v4 h4 v-4" fill="none" stroke="${LACI}" stroke-width="1.2"/>
    <path d="M124 110 v-8 q2 -3 4 0 v8 z M106 102 h3 v4 h-3 z M140 102 h3 v4 h-3 z" fill="${LACI}"/>
    <path d="M126 80 V68" stroke="${LACI}" stroke-width="1.2"/><path d="M126 68 l8 3 l-8 3" fill="#d9483b"/>
    ${sivriAgac(30, 186, 1, '#3f6232')}${sivriAgac(64, 184, 0.75, '#4a6e3a')}${sivriAgac(352, 186, 0.9, '#3f6232')}
    ${sahne('#dcb46e', '#8a6a34')}
    ${zemin('#dcb46e', '#b08a4a', '#8a6a34')}
    ${yuvarlakAgac(16, 230, 1.15, '#3f7a3a', { meyve: '#f08a2a' })}${yuvarlakAgac(390, 226, 1.1, '#3f7a3a', { meyve: '#f08a2a' })}
    ${vinyet}`;
}

// İç Anadolu: Kapadokya'nın peri bacaları (kaya evleriyle), gökte sıcak hava
// balonları, bozkır ve başaklar.
function icAnadolu() {
  const baca = (x, y, g, h, renk = '#e8cfa6') => `
    <path d="M${x - g} ${y} Q${x - g * 0.6} ${y - h * 0.6} ${x - g * 0.3} ${y - h} L${x + g * 0.3} ${y - h} Q${x + g * 0.6} ${y - h * 0.6} ${x + g} ${y} Z" fill="${renk}" stroke="#a8825e" stroke-width="1.2"/>
    <path d="M${x + g * 0.1} ${y - h} Q${x + g * 0.5} ${y - h * 0.5} ${x + g} ${y} L${x + g * 0.3} ${y} Z" fill="${koyu(renk, 0.12)}"/>
    <path d="M${x - g * 0.55} ${y - h} Q${x} ${y - h - g * 0.95} ${x + g * 0.55} ${y - h} Z" fill="#8a6a4a" stroke="#6e4a34" stroke-width="1.2"/>
    <path d="M${x - g * 0.2} ${y - h * 0.45} v-4 q${g * 0.15} -3 ${g * 0.3} 0 v4 z" fill="#6e4a34"/>`;
  const balon = (x, y, s, r1, r2) => `
    <g transform="translate(${x} ${y}) scale(${s})">
      <path d="M0 -26 Q20 -26 20 -6 Q20 8 6 18 L-6 18 Q-20 8 -20 -6 Q-20 -26 0 -26 Z" fill="${r1}" stroke="${LACI}" stroke-width="1.2"/>
      <path d="M0 -26 Q8 -18 6 18 L-6 18 Q-8 -18 0 -26 Z" fill="${r2}"/>
      <path d="M-14 -16 Q-17 -4 -9 10" fill="none" stroke="#fff" stroke-width="2" opacity=".4"/>
      <path d="M-5 18 L-4 26 M5 18 L4 26" stroke="${LACI}" stroke-width=".8"/>
      <rect x="-5" y="26" width="10" height="7" rx="1" fill="#9e6b3a" stroke="${LACI}" stroke-width="1"/>
    </g>`;
  const basak = [24, 34, 360, 372, 384].map((x, i) => `
    <path d="M${x} 238 Q${x + 2} 222 ${x + 4} 210" fill="none" stroke="#c9a24e" stroke-width="1.4"/>
    <path d="M${x + 4} 210 l-3 4 l3 2 l-3 4 l3 2 M${x + 4} 210 l3 4 l-3 2 l3 4 l-3 2" fill="none" stroke="#d8b25a" stroke-width="${1.6 + (i % 2) * 0.4}"/>`).join('');
  return `${gok('#9ecbe0', '#f3d8c4', '#fbefd6')}
    ${gunes(70, 56, 18, '#f6d76b')}
    ${bulut(320, 48, 0.6, 0.7)}
    ${balon(160, 54, 0.9, '#d9483b', '#f2c94c')}${balon(236, 36, 0.6, '#2aa7a7', '#f7efdc')}${balon(300, 76, 0.5, '#6a4c93', '#f2c94c')}${balon(110, 30, 0.42, '#f08a2a', '#d9483b')}
    ${daglar('uzak', 'M0 140 Q60 118 120 132 Q200 120 280 128 Q340 116 400 128 L400 168 L0 168 Z', '#c9b08a', '#e3d2b2')}
    ${baca(230, 168, 15, 62)}${baca(262, 170, 12, 46, '#efd8b4')}${baca(298, 168, 19, 76)}${baca(140, 170, 11, 38, '#efd8b4')}${baca(116, 170, 8, 26)}
    ${zemin('#d8c08a', '#a8905a', '#9e8a5a')}
    ${basak}
    ${vinyet}`;
}

// Karadeniz: sis katmanlı yeşil dağlar, yamaçta çay bahçesi, taş temelli ahşap yayla
// evi, köknarlar ve orman gülleri.
function karadeniz() {
  const cay = Array.from({ length: 6 }, (_, i) =>
    `<path d="M${200 + i * 4} ${134 + i * 8} Q${270} ${126 + i * 8} ${340 - i * 2} ${134 + i * 8}" fill="none" stroke="#4f8a4a" stroke-width="5" stroke-linecap="round" stroke-dasharray="7 2"/>`).join('');
  return `${gok('#a9bec6', '#d2dfdc', '#eef2ea')}
    ${bulut(80, 40, 0.9, 0.8)}${bulut(300, 28, 1.1, 0.7)}
    ${daglar('uzak', 'M0 110 L60 56 L110 94 L170 36 L240 98 L300 52 L400 104 L400 150 L0 150 Z', '#5d8a64', '#b5cbbf')}
    <path d="M0 100 Q100 84 200 104 T400 96 L400 120 Q300 110 200 122 T0 120 Z" fill="#fff" opacity=".7"/>
    ${daglar('orta', 'M0 150 Q80 118 170 134 Q260 112 400 130 L400 186 L0 186 Z', '#5f9a52', '#7fae6a')}
    ${cay}
    <g transform="translate(150 166)">
      <path d="M-24 0 h48 v-8 h-48 z" fill="#9a958a" stroke="${LACI}" stroke-width="1"/>
      <path d="M-22 -8 h44 v-20 h-44 z" fill="#9e6b3a" stroke="${LACI}" stroke-width="1.2"/>
      <path d="M-22 -14 h44 M-22 -20 h44" stroke="#6e4a2a" stroke-width=".8"/>
      <path d="M-28 -27 L0 -44 L28 -27" fill="#5b3a24" stroke="${LACI}" stroke-width="1.2"/>
      <path d="M-4 -8 v-11 h8 v11 z" fill="#4a2e1c"/>
      <rect x="-17" y="-24" width="7" height="6" fill="#f2d98a" stroke="${LACI}" stroke-width=".8"/><rect x="10" y="-24" width="7" height="6" fill="#f2d98a" stroke="${LACI}" stroke-width=".8"/>
      <path d="M14 -36 v-8 h5 v5" fill="#7a6a5a" stroke="${LACI}" stroke-width="1"/>
      <path d="M17 -46 q-4 -6 2 -10 q6 -4 2 -10" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>
    </g>
    ${sivriAgac(40, 188, 1.05, '#2f5a3a')}${sivriAgac(76, 184, 0.75, '#3a6a44')}${sivriAgac(330, 186, 0.95, '#2f5a3a')}${sivriAgac(368, 188, 0.8, '#3a6a44')}
    <path d="M0 176 Q120 162 240 178 T400 170 L400 192 Q300 184 200 192 T0 194 Z" fill="#fff" opacity=".45"/>
    ${zemin('#86ad6a', '#4f7a4a', '#3f6a3a')}
    ${cicek(30, 228, '#e07ab0')}${cicek(42, 222, '#e07ab0')}${cicek(52, 232, '#d9483b')}${cicek(356, 226, '#e07ab0')}${cicek(372, 232, '#e07ab0')}${cicek(232, 236, '#f7efdc')}
    ${vinyet}`;
}

// Güneydoğu: yamaca basamak basamak dizilmiş taş evler (kemerli pencereler), Harran'ın
// kümbet evleri, uzakta Fırat ve fıstık ağaçları.
function guneydogu() {
  const tasEv = (x, y, g, h) => `
    <rect x="${x}" y="${y - h}" width="${g}" height="${h}" fill="#e3c08a" stroke="#9e7a3a" stroke-width="1"/>
    <rect x="${x + g * 0.6}" y="${y - h}" width="${g * 0.4}" height="${h}" fill="#cfa96e"/>
    <path d="M${x + g * 0.2} ${y - h * 0.25} v${-h * 0.35} q${g * 0.1} ${-h * 0.18} ${g * 0.2} 0 v${h * 0.35} z" fill="#6e4a34"/>
    <path d="M${x} ${y - h} h${g}" stroke="#9e7a3a" stroke-width="2"/>`;
  const kumbet = (x, s = 1) => `
    <g transform="translate(${x} 178) scale(${s})">
      <path d="M-14 0 L-14 -14 Q-14 -40 0 -46 Q14 -40 14 -14 L14 0 Z" fill="#e8cc9c" stroke="#9e7a3a" stroke-width="1.4"/>
      <path d="M2 -45 Q14 -40 14 -14 L14 0 L6 0 Q10 -30 2 -45 Z" fill="#cfae7a"/>
      <path d="M-12 -18 Q0 -22 12 -18 M-11 -28 Q0 -32 11 -28 M-8 -37 Q0 -40 8 -37" fill="none" stroke="#b08a5a" stroke-width="1.2"/>
      <path d="M-4 0 L-4 -9 Q0 -13 4 -9 L4 0 Z" fill="#6e4a34"/>
    </g>`;
  return `${gok('#eea25e', '#f6c98a', '#fce6bd')}
    ${gunes(310, 52, 26, '#fff1c4')}
    ${daglar('uzak', 'M0 132 Q80 118 160 128 T320 122 T400 128 L400 150 L0 150 Z', '#c99a6a', '#e6c496')}
    <path d="M0 152 Q100 148 200 154 T400 150 L400 192 L0 192 Z" fill="#dcb67c"/>
    <path d="M0 148 Q100 142 200 150 T400 146 L400 156 Q300 152 200 158 T0 156 Z" fill="#4a9ab8" opacity=".85"/>
    <path d="M40 98 L170 98 L210 160 L0 160 L0 120 Z" fill="#c9a06a"/>
    ${tasEv(28, 120, 22, 18)}${tasEv(52, 116, 26, 22)}${tasEv(80, 120, 20, 16)}${tasEv(102, 112, 24, 22)}${tasEv(128, 118, 22, 16)}
    ${tasEv(14, 140, 24, 18)}${tasEv(40, 138, 22, 18)}${tasEv(64, 140, 28, 20)}${tasEv(94, 138, 22, 16)}${tasEv(118, 140, 26, 20)}${tasEv(146, 140, 22, 16)}
    ${tasEv(20, 160, 26, 18)}${tasEv(48, 160, 22, 16)}${tasEv(72, 160, 26, 18)}${tasEv(100, 160, 22, 16)}${tasEv(124, 160, 26, 18)}${tasEv(152, 160, 22, 14)}
    ${kumbet(236, 0.85)}${kumbet(262, 1)}${kumbet(290, 0.8)}${kumbet(314, 0.95)}${kumbet(352, 0.75)}
    ${yuvarlakAgac(200, 182, 0.7, '#8a9a4a', { meyve: '#d9683b' })}${yuvarlakAgac(384, 184, 0.75, '#8a9a4a', { meyve: '#d9683b' })}
    ${zemin('#e2bd80', '#b58a4a', '#9e7a3a')}
    <path d="M140 220 l10 4 l6 -3 M262 210 l8 5 l8 -2 M40 230 l9 -2 l5 4" fill="none" stroke="#9e7a3a" stroke-width="1.2" opacity=".7"/>
    ${vinyet}`;
}

// Doğu Anadolu: iki dorukla Ağrı Dağı (buzullu), Van Gölü, karlı çamlar ve yağan kar.
function doguAnadolu() {
  const kar = [[40, 40], [100, 70], [180, 30], [260, 60], [350, 36], [300, 100], [60, 110], [140, 120], [220, 90], [380, 120], [20, 160], [330, 150], [120, 160]]
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${1.6 + (i % 3) * 0.6}" fill="#fff" opacity=".9"/>`).join('');
  return `${gok('#88a8cc', '#c3d3e4', '#eef2f6')}
    ${gunes(330, 44, 14, '#fdf6dc', false)}
    ${bulut(60, 50, 0.8, 0.7)}
    ${daglar('agri', 'M20 150 L160 44 L200 74 L232 60 L340 150 Z', '#6f80a0', '#aab8cc')}
    <path d="M128 68 L160 44 L192 68 L180 64 L170 76 L160 66 L150 78 L140 66 Z" fill="#fff"/>
    <path d="M160 44 L200 74 L192 68 L182 64 Z" fill="#dfe8f2"/>
    <path d="M216 72 L232 60 L248 74 L240 76 L232 70 L224 78 Z" fill="#fff"/>
    ${bulut(196, 96, 0.9, 0.75)}
    ${daglar('yan', 'M0 150 L50 108 L90 140 L120 124 L140 150 Z M290 150 L350 98 L400 134 L400 150 Z', '#8394b0', '#b8c4d4')}
    <path d="M38 118 L50 108 L62 120 Z M338 108 L350 98 L362 110 Z" fill="#fff"/>
    <defs>${dikey('gol', '#3f74b0', '#2c5a94')}</defs>
    <rect y="148" width="400" height="22" fill="url(#@gol)"/>
    ${parilti([[20, 156, 60], [160, 160, 70], [290, 154, 50]], '#cfe3f4')}
    ${sivriAgac(30, 186, 1, '#2f5a3a', true)}${sivriAgac(62, 184, 0.7, '#3a6a44', true)}${sivriAgac(340, 188, 0.9, '#2f5a3a', true)}${sivriAgac(376, 186, 0.75, '#3a6a44', true)}
    ${sahne('#e4eaf0', '#9aaabd')}
    ${zemin('#eef2f6', '#b8c4d0', '#9aaabd')}
    ${kar}
    ${vinyet}`;
}

const arkaplanlar = {
  marmara,
  ege,
  akdeniz,
  ic_anadolu: icAnadolu,
  karadeniz,
  guneydogu,
  dogu_anadolu: doguAnadolu,
};

export const ARKA_PLAN_BOLGELERI = Object.keys(arkaplanlar);

// Bölgenin manzara arka planı (tuvali kaplayacak şekilde kırpılır).
export function bolgeArkaPlani(bolge) {
  // Gradyan kimlikleri bölgeye özgü olsun ki sayfadaki başka SVG'lerle çakışmasın.
  const c = boyalariCoz(arkaplanlar[bolge](), `ap-${bolge}-`);
  return `<svg class="arka-plan" viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs>${c.tanimlar}</defs>${c.icerik}</svg>`;
}
