// Bölgelere özgü, katmanlı savaş arka planları (gökyüzü, uzak katman, orta katman, zemin).
// Tuval 400×240; zemin çizgisi y ≈ 190. Kırmızı çizgiler (plan.md Bölüm 2):
// ibadethaneler savaş alanı olarak çizilmez; tanrı heykeli ya da putlar yoktur.

const gok = (ust, alt) => `
  <defs><linearGradient id="gok" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${ust}"/><stop offset="1" stop-color="${alt}"/>
  </linearGradient></defs>
  <rect width="400" height="240" fill="url(#gok)"/>`;

const gunes = (x, y, r, renk) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${renk}" opacity=".85"/>`;

const zemin = (renk, koyu) => `
  <path d="M0 186 Q100 178 200 186 T400 184 L400 240 L0 240 Z" fill="${renk}"/>
  <path d="M0 206 Q120 198 240 208 T400 204 L400 240 L0 240 Z" fill="${koyu}" opacity=".45"/>`;

const marti = (x, y) => `<path d="M${x} ${y} q5 -5 10 0 q5 -5 10 0" fill="none" stroke="#1b2a5c" stroke-width="1.6" opacity=".6"/>`;

// Marmara: Boğaz, tepeler, küçük adada kule, martılar.
function marmara() {
  return `${gok('#9fd9d4', '#f7efdc')}
    ${gunes(320, 50, 22, '#f2c94c')}
    <path d="M0 120 Q60 96 130 112 Q190 124 240 104 Q300 86 400 108 L400 150 L0 150 Z" fill="#6fa8a0"/>
    <rect y="136" width="400" height="36" fill="#3b8fb0"/>
    <path d="M0 146 h400 M20 158 h60 M180 154 h80 M300 162 h70" stroke="#9fd9d4" stroke-width="2" opacity=".7"/>
    <path d="M184 138 q14 -8 28 0 Z" fill="#8a7a5a"/>
    <path d="M192 138 L192 112 L196 104 L200 112 L200 138 Z" fill="#f7efdc" stroke="#1b2a5c" stroke-width="1.4"/>
    <path d="M60 150 l8 -14 l8 14 Z" fill="#f7efdc" stroke="#1b2a5c" stroke-width="1.2"/>
    <path d="M52 150 h32 l-4 4 h-24 Z" fill="#7b5236"/>
    ${marti(120, 60)}${marti(150, 44)}${marti(200, 70)}
    ${zemin('#a9c98f', '#6f8a58')}`;
}

// Ege: zeytinlikler, yumuşak tepeler, uzakta deniz.
function ege() {
  const zeytin = (x, s = 1) => `
    <g transform="translate(${x} 176) scale(${s})">
      <path d="M-2 0 Q-4 -14 0 -22 Q4 -14 2 0 Z" fill="#6e5b45"/>
      <ellipse cx="0" cy="-30" rx="20" ry="12" fill="#8a9a5b"/><ellipse cx="-10" cy="-24" rx="10" ry="7" fill="#76884a"/>
      <ellipse cx="12" cy="-25" rx="10" ry="7" fill="#76884a"/>
    </g>`;
  return `${gok('#bfe3ef', '#fbf1d8')}
    ${gunes(80, 46, 24, '#f2c94c')}
    <rect y="116" width="400" height="16" fill="#3b7dc4" opacity=".7"/>
    <path d="M0 132 Q80 106 170 124 Q260 142 400 118 L400 170 L0 170 Z" fill="#b7c77e"/>
    <path d="M0 160 Q140 136 260 154 Q330 164 400 150 L400 190 L0 190 Z" fill="#9fb56a"/>
    ${zeytin(40, 0.8)}${zeytin(120)}${zeytin(300, 0.9)}${zeytin(370, 0.7)}
    ${zemin('#c9b98a', '#9e8a5a')}`;
}

// Akdeniz: Toros dağları, çam ağaçları, sıcak güneş, deniz.
function akdeniz() {
  const cam = (x, s = 1) => `
    <g transform="translate(${x} 180) scale(${s})">
      <rect x="-2" y="-16" width="4" height="16" fill="#6e5b45"/>
      <path d="M0 -60 L16 -30 L8 -30 L20 -12 L-20 -12 L-8 -30 L-16 -30 Z" fill="#3f6232"/>
    </g>`;
  return `${gok('#f7c07a', '#fbf1d8')}
    ${gunes(300, 60, 28, '#f7e3a1')}
    <path d="M0 130 L50 80 L90 110 L140 60 L200 116 L250 70 L310 112 L360 76 L400 104 L400 150 L0 150 Z" fill="#b08a6a"/>
    <path d="M140 60 L128 72 L150 74 Z M250 70 L240 82 L262 82 Z" fill="#f7efdc"/>
    <rect y="146" width="400" height="22" fill="#2a8fb8"/>
    <path d="M0 154 h400" stroke="#9fd9f4" stroke-width="2" opacity=".7"/>
    ${cam(30)}${cam(80, 0.8)}${cam(350, 0.9)}
    ${zemin('#d9b36c', '#b08a4a')}`;
}

// İç Anadolu: bozkır, peri bacaları, kuru otlar.
function icAnadolu() {
  const baca = (x, y, g, h) => `
    <path d="M${x - g} ${y} Q${x - g * 0.6} ${y - h * 0.6} ${x - g * 0.3} ${y - h} L${x + g * 0.3} ${y - h} Q${x + g * 0.6} ${y - h * 0.6} ${x + g} ${y} Z" fill="#e3c9a1" stroke="#b08a6a" stroke-width="1.4"/>
    <path d="M${x - g * 0.5} ${y - h} Q${x} ${y - h - g * 0.9} ${x + g * 0.5} ${y - h} Z" fill="#8a6a4a"/>`;
  const ot = [30, 90, 150, 230, 290, 360]
    .map((x) => `<path d="M${x} 196 l-4 -10 M${x} 196 l0 -12 M${x} 196 l4 -10" stroke="#9e8a5a" stroke-width="1.6"/>`).join('');
  return `${gok('#cfe3ea', '#f7efdc')}
    ${gunes(70, 52, 20, '#f2c94c')}
    <path d="M0 140 Q100 126 200 136 T400 132 L400 170 L0 170 Z" fill="#d9c49a"/>
    ${baca(250, 164, 16, 60)}${baca(282, 166, 12, 44)}${baca(320, 164, 18, 72)}${baca(120, 166, 10, 36)}
    ${zemin('#d6c08a', '#a8905a')}
    ${ot}`;
}

// Karadeniz: sisli yeşil yaylalar, köknarlar, ahşap yayla evi.
function karadeniz() {
  const koknar = (x, s = 1) => `
    <g transform="translate(${x} 184) scale(${s})">
      <path d="M0 -70 L14 -40 L6 -40 L18 -18 L-18 -18 L-6 -40 L-14 -40 Z" fill="#2f5a3a"/>
      <rect x="-2" y="-18" width="4" height="18" fill="#5b3a24"/>
    </g>`;
  return `${gok('#b8c8cc', '#e8eee8')}
    <path d="M0 120 L60 60 L110 100 L170 40 L240 104 L300 56 L400 110 L400 160 L0 160 Z" fill="#4f7a4a"/>
    <path d="M0 110 Q100 96 200 112 T400 104 L400 124 Q300 116 200 126 T0 124 Z" fill="#fff" opacity=".6"/>
    <path d="M0 150 Q100 126 220 146 T400 138 L400 186 L0 186 Z" fill="#6f9a58"/>
    <path d="M150 164 L150 146 L170 134 L190 146 L190 164 Z" fill="#9e6b3a" stroke="#1b2a5c" stroke-width="1.4"/>
    <path d="M146 147 L170 130 L194 147" fill="none" stroke="#5b3a24" stroke-width="3"/>
    <rect x="165" y="150" width="9" height="14" fill="#5b3a24"/>
    ${koknar(40)}${koknar(80, 0.7)}${koknar(330, 0.9)}${koknar(370, 0.75)}
    <path d="M0 176 Q120 164 240 178 T400 170 L400 190 Q300 184 200 190 T0 192 Z" fill="#fff" opacity=".45"/>
    ${zemin('#86ad6a', '#4f7a4a')}`;
}

// Güneydoğu: kavruk ovalar, Harran'ın kümbet evleri, sıcak gökyüzü.
function guneydogu() {
  const kumbet = (x, s = 1) => `
    <g transform="translate(${x} 176) scale(${s})">
      <path d="M-14 0 L-14 -14 Q-14 -40 0 -46 Q14 -40 14 -14 L14 0 Z" fill="#e3c9a1" stroke="#9e7a3a" stroke-width="1.4"/>
      <path d="M-12 -18 Q0 -22 12 -18 M-12 -28 Q0 -32 12 -28" fill="none" stroke="#b08a5a" stroke-width="1.2"/>
      <path d="M-4 0 L-4 -9 Q0 -13 4 -9 L4 0 Z" fill="#6e4a34"/>
    </g>`;
  return `${gok('#f2b56c', '#fbe7bd')}
    ${gunes(310, 56, 26, '#fff1c4')}
    <path d="M0 140 Q80 124 160 138 T320 132 T400 136 L400 170 L0 170 Z" fill="#d6a86a"/>
    ${kumbet(90)}${kumbet(120, 0.8)}${kumbet(146, 1.05)}${kumbet(176, 0.85)}${kumbet(330, 0.9)}
    ${zemin('#e0bd80', '#b58a4a')}`;
}

// Doğu Anadolu: karlı zirveler (Ağrı Dağı), Van Gölü, soğuk gökyüzü.
function doguAnadolu() {
  const kar = [[40, 40], [100, 70], [180, 30], [260, 60], [350, 36], [300, 100], [60, 110]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#fff"/>`).join('');
  return `${gok('#9fb8d4', '#eef2f6')}
    <path d="M40 150 L160 50 L200 80 L230 66 L330 150 Z" fill="#7a8aa3"/>
    <path d="M134 72 L160 50 L186 72 L176 70 L166 78 L156 70 L146 78 Z" fill="#fff"/>
    <path d="M214 76 L230 66 L244 78 L236 80 L228 76 Z" fill="#fff"/>
    <path d="M0 150 L50 110 L90 140 L120 124 L140 150 Z M300 150 L350 100 L400 136 L400 150 Z" fill="#8f9fb6"/>
    <rect y="148" width="400" height="20" fill="#3b6fa8"/>
    <path d="M20 156 h80 M160 160 h90 M290 155 h70" stroke="#cfe3f4" stroke-width="2" opacity=".7"/>
    ${kar}
    ${zemin('#e8eef2', '#b8c4d0')}`;
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

// Bölgenin savaş arka planı (tuvali kaplayacak şekilde kırpılır).
export function bolgeArkaPlani(bolge) {
  // Gradyan kimliği bölgeye özgü olsun ki sayfadaki başka SVG'lerle çakışmasın.
  const icerik = arkaplanlar[bolge]().replaceAll('gok', `gok-${bolge}`);
  return `<svg class="arka-plan" viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${icerik}</svg>`;
}
