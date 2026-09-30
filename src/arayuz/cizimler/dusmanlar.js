// Düşman çizimleri. Her düşman bir "beden" iskeletinden türetilir; renkler ve
// ayrıntılar düşmana göre değişir. Figürler sola (oyuncuya) dönüktür.
// Kırmızı çizgiler (plan.md Bölüm 2): kan, vahşet ve müstehcenlik yoktur;
// mahlûklar ürkütücü değil, masalsı görünür.
import { svgSar, golge, hale } from './ortak.js';

const LACI = '#1b2a5c';

// Kalın, dış çizgili bir kıvrım (boyun, kuyruk, yılan gövdesi).
const kivrim = (d, renk, kalinlik) => `
  <path d="${d}" fill="none" stroke="${LACI}" stroke-width="${kalinlik + 4}"/>
  <path d="${d}" fill="none" stroke="${renk}" stroke-width="${kalinlik}"/>`;

// ── Hayvanlar (yandan, sola dönük) ──────────────────────

function kurt(r, { buyukKulak = false } = {}) {
  const kulak = buyukKulak ? 'M42 44 L38 18 L54 38 Z' : 'M42 44 L40 26 L52 40 Z';
  return `${golge(36)}
    <path d="M90 60 Q108 56 114 38 Q116 60 96 72 Z" fill="${r.koyu}"/>
    <rect x="46" y="68" width="8" height="32" rx="3" fill="${r.koyu}"/>
    <rect x="84" y="68" width="8" height="32" rx="3" fill="${r.koyu}"/>
    <ellipse cx="70" cy="64" rx="28" ry="15" fill="${r.ana}"/>
    <rect x="54" y="70" width="8" height="32" rx="3" fill="${r.ana}"/>
    <rect x="92" y="68" width="8" height="32" rx="3" fill="${r.ana}"/>
    <path d="M56 52 L48 40 L36 42 L22 48 L10 56 L14 62 L30 66 L50 68 Z" fill="${r.ana}"/>
    <path d="${kulak}" fill="${r.koyu}"/>
    <circle cx="11" cy="57" r="2.5" fill="${LACI}"/>
    <path d="M28 50 l7 -1 l-2 4 z" fill="${r.goz}"/>`;
}

function cakal(r) {
  return `<g transform="translate(26 -6) scale(.78)" opacity=".75">${kurt({ ...r, ana: r.koyu }, { buyukKulak: true })}</g>
    ${kurt(r, { buyukKulak: true })}`;
}

function domuz(r) {
  return `${golge(36)}
    <rect x="46" y="72" width="9" height="28" rx="3" fill="${r.koyu}"/>
    <rect x="84" y="72" width="9" height="28" rx="3" fill="${r.koyu}"/>
    <path d="M30 60 Q34 38 64 38 Q98 38 102 64 Q102 82 80 84 L44 84 Q28 80 30 60 Z" fill="${r.ana}"/>
    <path d="M46 40 L52 30 L58 40 L64 30 L70 40 L76 31 L80 42" fill="${r.koyu}"/>
    <rect x="54" y="76" width="9" height="26" rx="3" fill="${r.ana}"/>
    <rect x="92" y="74" width="9" height="26" rx="3" fill="${r.ana}"/>
    <path d="M36 52 L14 58 L12 72 L34 76 Z" fill="${r.ana}"/>
    <ellipse cx="12" cy="65" rx="4" ry="7" fill="${r.acik}"/>
    <path d="M20 70 Q16 60 24 56" fill="none" stroke="#f7efdc" stroke-width="3"/>
    <path d="M36 50 L32 38 L44 46 Z" fill="${r.koyu}"/>
    <circle cx="28" cy="58" r="2.4" fill="${r.goz}"/>
    <path d="M102 60 q8 -2 6 8" fill="none"/>`;
}

function pars(r) {
  const benek = [[58, 58], [72, 54], [86, 60], [66, 68], [80, 70], [94, 66]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${r.koyu}" stroke="none"/>`).join('');
  return `${golge(38)}
    <path d="M96 62 Q116 64 114 90 Q112 96 108 92 Q110 72 94 70 Z" fill="${r.ana}"/>
    <rect x="46" y="70" width="8" height="30" rx="3" fill="${r.koyu}"/>
    <rect x="86" y="70" width="8" height="30" rx="3" fill="${r.koyu}"/>
    <path d="M40 64 Q44 48 70 50 Q96 50 100 64 Q98 78 70 78 Q44 78 40 64 Z" fill="${r.ana}"/>
    ${benek}
    <rect x="54" y="72" width="8" height="30" rx="3" fill="${r.ana}"/>
    <rect x="94" y="70" width="8" height="30" rx="3" fill="${r.ana}"/>
    <circle cx="34" cy="54" r="15" fill="${r.ana}"/>
    <path d="M28 40 L30 32 L38 40 Z M40 40 L44 32 L46 42 Z" fill="${r.koyu}"/>
    <ellipse cx="24" cy="60" rx="7" ry="5" fill="${r.acik}"/>
    <circle cx="20" cy="58" r="2" fill="${LACI}"/>
    <path d="M26 50 l6 -1 l-2 4 z M36 50 l5 -1 l-1 4 z" fill="${r.goz}"/>`;
}

function ayi(r) {
  return `${golge(38)}
    <path d="M34 50 Q30 22 60 20 Q90 22 86 50 L90 96 Q60 104 30 96 Z" fill="${r.ana}"/>
    <circle cx="38" cy="24" r="8" fill="${r.ana}"/><circle cx="82" cy="24" r="8" fill="${r.ana}"/>
    <circle cx="38" cy="24" r="4" fill="${r.koyu}" stroke="none"/><circle cx="82" cy="24" r="4" fill="${r.koyu}" stroke="none"/>
    <path d="M44 58 Q60 50 76 58 L78 92 Q60 98 42 92 Z" fill="${r.acik}"/>
    <ellipse cx="60" cy="44" rx="10" ry="8" fill="${r.acik}"/>
    <ellipse cx="60" cy="40" rx="4" ry="3" fill="${LACI}"/>
    <path d="M47 32 l6 1 l-5 3 z M73 32 l-6 1 l5 3 z" fill="${r.goz}"/>
    <path d="M30 60 Q18 70 22 86 L34 84 Z M90 60 Q102 70 98 86 L86 84 Z" fill="${r.koyu}"/>
    <path d="M22 86 l-2 4 M26 87 l-1 4 M98 86 l2 4 M94 87 l1 4" />`;
}

function akrep(r) {
  const bacak = [0, 1, 2, 3].map((i) => {
    const x = 46 + i * 9;
    return `<path d="M${x} 78 L${x - 8} 92 L${x - 12} 100" fill="none" stroke-width="2.4"/>
            <path d="M${x + 4} 78 L${x + 12} 92 L${x + 16} 100" fill="none" stroke-width="2.4"/>`;
  }).join('');
  return `${golge(40)}
    ${bacak}
    <ellipse cx="60" cy="78" rx="22" ry="10" fill="${r.ana}"/>
    ${kivrim('M80 76 Q98 72 100 52 Q102 30 84 24 Q72 22 72 34', r.ana, 8)}
    <path d="M80 76 Q98 72 100 52 Q102 30 84 24 Q72 22 72 34" fill="none" stroke="${r.koyu}" stroke-width="2" stroke-dasharray="4 5"/>
    <path d="M72 34 L64 40 L74 42 Z" fill="${r.goz}"/>
    <path d="M40 74 Q26 66 22 72 M40 80 Q26 88 22 84" fill="none" stroke="${r.ana}" stroke-width="5"/>
    <path d="M22 72 L12 64 L16 76 L12 80 L22 84" fill="${r.koyu}"/>
    <circle cx="46" cy="74" r="2" fill="${r.goz}"/><circle cx="46" cy="80" r="2" fill="${r.goz}"/>`;
}

function yilan(r, { tac = false } = {}) {
  const tacCiz = tac
    ? `<path d="M38 22 L40 10 L46 18 L50 8 L54 18 L60 10 L62 22 Z" fill="#d4a537"/>
       <circle cx="50" cy="16" r="2" fill="#d9483b" stroke="none"/>`
    : '';
  return `${golge(38)}
    <path d="M24 100 Q20 84 44 84 Q82 84 94 94 Q100 104 80 104 L30 104 Q24 104 24 100 Z" fill="${r.koyu}"/>
    <path d="M36 92 Q30 76 56 74 Q86 74 90 88 Q72 80 56 84 Q40 86 36 92 Z" fill="${r.ana}"/>
    ${kivrim('M56 76 Q70 60 60 46 Q52 36 50 28', r.ana, 13)}
    <path d="M56 76 Q70 60 60 46 Q52 36 50 28" fill="none" stroke="${r.acik}" stroke-width="4" stroke-dasharray="3 5"/>
    <path d="M36 26 Q40 16 52 18 Q64 20 62 30 Q58 38 46 36 Q34 34 36 26 Z" fill="${r.ana}"/>
    ${tacCiz}
    <path d="M42 26 l6 -1 l-2 4 z" fill="${r.goz}"/>
    <path d="M36 30 L28 32 M28 32 l-4 -3 M28 32 l-4 3" fill="none" stroke="#d9483b" stroke-width="1.6"/>`;
}

// ── Sihirle azmış varlıklar (önden) ─────────────────────

function cin(r) {
  return `${golge(26)}
    <path d="M60 16 Q86 16 86 44 Q88 64 78 78 Q70 90 80 104 Q66 98 60 106 Q54 98 40 104 Q50 90 42 78 Q32 64 34 44 Q34 16 60 16 Z" fill="${r.ana}"/>
    <path d="M42 30 L34 12 L52 24 Z M78 30 L86 12 L68 24 Z" fill="${r.koyu}"/>
    <path d="M36 54 Q18 60 14 78 Q26 70 40 68 Z M84 54 Q102 60 106 78 Q94 70 80 68 Z" fill="${r.koyu}"/>
    <path d="M44 40 l12 4 l-11 3 z M76 40 l-12 4 l11 3 z" fill="${r.goz}"/>
    <path d="M50 60 Q60 66 70 60" fill="none" stroke="${r.goz}" stroke-width="1.6"/>
    <path d="M46 80 q-6 10 2 18 M74 80 q6 10 -2 18" fill="none" stroke="${r.acik}" stroke-width="1.6" opacity=".8"/>`;
}

function hortlak(r) {
  return `${golge(28)}
    <path d="M60 14 Q90 14 90 48 L92 96 Q85 90 78 98 Q72 90 66 98 Q60 90 54 98 Q48 90 42 98 Q35 90 28 96 L30 48 Q30 14 60 14 Z" fill="${r.ana}"/>
    <path d="M30 56 Q14 58 10 46 Q20 52 30 48 Z M90 56 Q106 58 110 46 Q100 52 90 48 Z" fill="${r.ana}"/>
    <ellipse cx="49" cy="44" rx="6" ry="8" fill="${r.koyu}"/>
    <ellipse cx="71" cy="44" rx="6" ry="8" fill="${r.koyu}"/>
    <circle cx="49" cy="46" r="2" fill="${r.goz}" stroke="none"/><circle cx="71" cy="46" r="2" fill="${r.goz}" stroke="none"/>
    <ellipse cx="60" cy="64" rx="5" ry="7" fill="${r.koyu}"/>
    <path d="M36 30 Q44 22 50 26 M84 30 Q76 22 70 26" fill="none" stroke="${r.acik}" stroke-width="1.6"/>`;
}

function gulyabani(r) {
  return `${golge(30)}
    <path d="M60 8 Q80 10 84 32 L90 70 L86 102 L76 96 L68 104 L60 96 L52 104 L44 96 L34 102 L30 70 L36 32 Q40 10 60 8 Z" fill="${r.ana}"/>
    <path d="M36 40 Q20 56 18 90 L26 92 Q28 64 40 52 Z M84 40 Q100 56 102 90 L94 92 Q92 64 80 52 Z" fill="${r.koyu}"/>
    <path d="M18 90 l-3 6 M22 91 l0 7 M26 92 l3 6 M102 90 l3 6 M98 91 l0 7 M94 92 l-3 6" />
    <path d="M44 22 Q60 30 76 22 L76 40 Q60 46 44 40 Z" fill="${r.koyu}"/>
    <path d="M49 32 l8 2 l-7 3 z M71 32 l-8 2 l7 3 z" fill="${r.goz}"/>
    <path d="M42 54 l4 14 M52 56 l2 18 M62 56 l0 20 M72 56 l-2 18 M80 54 l-4 14" fill="none" stroke="${r.acik}" stroke-width="1.4"/>`;
}

function ifrit(r) {
  return `${golge(26)}
    <path d="M60 4 Q66 18 76 12 Q74 26 86 30 Q80 40 90 50 Q84 60 88 74 Q76 72 76 88 Q68 82 60 98 Q52 82 44 88 Q44 72 32 74 Q36 60 30 50 Q40 40 34 30 Q46 26 44 12 Q54 18 60 4 Z" fill="${r.ana}"/>
    <path d="M60 24 Q68 34 74 40 Q72 54 76 64 Q66 64 60 80 Q54 64 44 64 Q48 54 46 40 Q52 34 60 24 Z" fill="${r.acik}" stroke="none"/>
    <path d="M47 44 l9 3 l-8 3 z M73 44 l-9 3 l8 3 z" fill="${r.goz}"/>
    <path d="M52 58 Q60 54 68 58" fill="none"/>
    <path d="M30 50 Q14 46 10 34 Q22 40 32 42 Z M90 50 Q106 46 110 34 Q98 40 88 42 Z" fill="${r.koyu}"/>
    <path d="M44 100 Q60 90 76 100" fill="none" stroke="${r.koyu}" stroke-width="3"/>`;
}

function kukuletali(r) {
  return `${golge(30)}
    <path d="M60 12 Q82 14 84 44 L92 102 L28 102 L36 44 Q38 14 60 12 Z" fill="${r.ana}"/>
    <path d="M60 22 Q74 24 74 44 Q72 56 60 58 Q48 56 46 44 Q46 24 60 22 Z" fill="${r.koyu}"/>
    <path d="M52 40 l6 2 l-6 2 z M68 40 l-6 2 l6 2 z" fill="${r.goz}"/>
    <path d="M30 104 L22 30" stroke="#7b5236" stroke-width="3"/>
    <path d="M22 30 L12 14 M22 30 L18 12 M22 30 L26 12 M22 30 L32 16" stroke="#b39a6e" stroke-width="2"/>
    <path d="M36 60 Q26 62 24 54 L30 50 Z" fill="${r.ana}"/>
    <path d="M44 70 L76 70 M42 84 L78 84" stroke="${r.acik}" stroke-width="1.6"/>`;
}

function albasti(r) {
  return `${golge(30)}
    <path d="M60 10 Q82 12 84 38 Q86 60 96 80 Q84 78 86 98 Q72 90 70 104 Q62 94 60 104 Q56 94 50 104 Q48 90 34 98 Q36 78 24 80 Q34 60 36 38 Q38 12 60 10 Z" fill="${r.ana}"/>
    <path d="M60 22 Q72 24 72 38 Q72 52 60 54 Q48 52 48 38 Q48 24 60 22 Z" fill="${r.koyu}"/>
    <path d="M50 36 Q54 32 57 37 Q54 40 50 36 Z M70 36 Q66 32 63 37 Q66 40 70 36 Z" fill="${r.goz}"/>
    <path d="M36 40 Q30 60 36 78 M84 40 Q90 60 84 78 M44 56 Q42 76 46 92 M76 56 Q78 76 74 92" fill="none" stroke="${r.acik}" stroke-width="1.6"/>
    <path d="M52 4 Q60 12 68 4 Q66 14 60 14 Q54 14 52 4 Z" fill="${r.goz}"/>`;
}

function dev(r, { tekGoz = false, zirh = false, basSayisi = 1 } = {}) {
  const bas = (x, y, s = 1) => `
    <g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-14 0 Q-14 -18 0 -18 Q14 -18 14 0 Q14 12 0 14 Q-14 12 -14 0 Z" fill="${r.acik}"/>
      ${tekGoz
        ? `<circle cx="0" cy="-4" r="7" fill="#f7efdc"/><circle cx="0" cy="-4" r="3.4" fill="${r.goz}"/>`
        : `<path d="M-9 -5 l6 1 l-5 3 z M9 -5 l-6 1 l5 3 z" fill="${r.goz}"/>`}
      <path d="M-6 6 Q0 3 6 6" fill="none"/>
      ${tekGoz ? '<path d="M-10 -16 L-6 -24 L-2 -18 M10 -16 L6 -24 L2 -18" fill="none"/>' : ''}
    </g>`;
  const baslar = basSayisi === 3
    ? bas(38, 30, 0.8) + bas(82, 30, 0.8) + bas(60, 24)
    : bas(60, 26);
  const zirhCiz = zirh
    ? `<path d="M40 44 L80 44 L82 76 L38 76 Z" fill="#8f99a3"/>
       <path d="M40 54 L82 54 M40 64 L82 64" stroke="${LACI}" stroke-width="1.4"/>
       <path d="M44 14 Q60 0 76 14 L76 20 L44 20 Z" fill="#8f99a3"/>`
    : '';
  return `${golge(38)}
    <path d="M46 84 L42 104 L56 104 L58 84 Z M62 84 L64 104 L78 104 L74 84 Z" fill="${r.koyu}"/>
    <path d="M34 48 Q34 38 60 36 Q86 38 86 48 L90 86 L30 86 Z" fill="${r.ana}"/>
    <path d="M34 50 Q16 60 16 84 L28 86 Q28 68 38 62 Z M86 50 Q104 60 104 84 L92 86 Q92 68 82 62 Z" fill="${r.ana}"/>
    <circle cx="22" cy="88" r="8" fill="${r.acik}"/><circle cx="98" cy="88" r="8" fill="${r.acik}"/>
    <path d="M30 76 L90 76 L90 82 L30 82 Z" fill="${r.koyu}"/>
    ${zirhCiz}
    ${baslar}`;
}

function karakoncolos(r) {
  const tuy = Array.from({ length: 9 }, (_, i) => {
    const x = 30 + i * 7.5;
    return `<path d="M${x} 96 l3 8 l3 -8" fill="${r.ana}"/>`;
  }).join('');
  return `${golge(32)}
    ${tuy}
    <path d="M60 10 Q90 12 90 50 L92 98 L28 98 L30 50 Q30 12 60 10 Z" fill="${r.ana}"/>
    <path d="M30 50 Q14 58 14 82 L26 84 Q26 66 36 60 Z M90 50 Q106 58 106 82 L94 84 Q94 66 84 60 Z" fill="${r.koyu}"/>
    <path d="M14 82 l-2 6 M18 84 l0 6 M22 84 l2 6 M106 82 l2 6 M102 84 l0 6 M98 84 l-2 6"/>
    <path d="M44 30 Q60 22 76 30 Q78 44 60 48 Q42 44 44 30 Z" fill="${r.acik}"/>
    <circle cx="52" cy="36" r="3.5" fill="${r.goz}"/><circle cx="68" cy="36" r="3.5" fill="${r.goz}"/>
    <path d="M40 12 L34 2 L48 10 Z M80 12 L86 2 L72 10 Z" fill="${r.koyu}"/>
    <circle cx="20" cy="20" r="2" fill="#fff" stroke="none"/><circle cx="100" cy="30" r="2" fill="#fff" stroke="none"/>
    <circle cx="96" cy="12" r="1.6" fill="#fff" stroke="none"/><circle cx="14" cy="44" r="1.6" fill="#fff" stroke="none"/>`;
}

function ejder(r) {
  return `${golge(40)}
    <path d="M58 60 L78 16 L84 34 L98 24 L94 46 L108 44 L84 70 Z" fill="${r.acik}"/>
    <path d="M78 16 L70 56 M98 24 L78 62" fill="none" stroke-width="1.4"/>
    <path d="M36 100 Q20 96 24 84 Q30 70 56 72 Q88 74 96 90 Q100 104 80 104 Z" fill="${r.ana}"/>
    <path d="M96 94 Q112 96 110 80 Q106 90 98 88 Z" fill="${r.ana}"/>
    ${kivrim('M52 76 Q62 58 54 40 Q48 30 40 28', r.ana, 15)}
    <path d="M58 70 Q64 56 58 42" fill="none" stroke="${r.acik}" stroke-width="5" stroke-dasharray="4 3"/>
    <path d="M44 36 Q34 34 22 38 L10 36 L14 44 L26 48 Q40 48 48 42 Z" fill="${r.ana}"/>
    <path d="M40 24 L46 10 L48 26 Z M34 26 L34 12 L40 26 Z" fill="${r.koyu}"/>
    <path d="M30 34 l7 -1 l-2 4 z" fill="${r.goz}"/>
    <path d="M10 36 Q4 30 6 24 M12 44 Q6 48 8 54" fill="none" stroke="${r.koyu}" stroke-width="1.6"/>
    <path d="M62 80 l4 -6 l4 6 M74 82 l4 -6 l4 6" fill="${r.koyu}"/>`;
}

function canavar(r) {
  return `
    <path d="M0 96 Q15 90 30 96 Q45 102 60 96 Q75 90 90 96 Q105 102 120 96 L120 120 L0 120 Z" fill="#3b7dc4" opacity=".55"/>
    <path d="M68 96 Q72 72 84 72 Q96 72 98 96 Z" fill="${r.ana}"/>
    <path d="M88 96 Q92 82 100 82 Q108 82 110 96 Z" fill="${r.koyu}"/>
    <path d="M20 96 Q20 50 40 36 Q52 28 56 42 Q58 62 52 96 Z" fill="${r.ana}"/>
    <path d="M30 94 Q30 60 42 46" fill="none" stroke="${r.acik}" stroke-width="4" stroke-dasharray="4 4"/>
    <path d="M40 36 Q30 26 16 30 Q8 34 12 42 Q24 44 40 44 Z" fill="${r.ana}"/>
    <path d="M42 34 L50 22 L50 36 Z M36 32 L38 18 L44 32 Z" fill="${r.koyu}"/>
    <path d="M22 34 l7 0 l-3 4 z" fill="${r.goz}"/>
    <path d="M0 104 Q15 98 30 104 Q45 110 60 104 Q75 98 90 104 Q105 110 120 104" fill="none" stroke="#f7efdc" stroke-width="2"/>`;
}

function zulmet(r) {
  return `${golge(32)}
    <path d="M60 10 Q82 12 84 40 L96 104 L24 104 L36 40 Q38 12 60 10 Z" fill="${r.ana}"/>
    <path d="M60 8 L68 0 L66 12 Z" fill="${r.ana}"/>
    <path d="M60 22 Q74 24 74 42 Q72 56 60 58 Q48 56 46 42 Q46 24 60 22 Z" fill="${r.koyu}"/>
    <path d="M50 40 l7 2 l-6 2 z M70 40 l-7 2 l6 2 z" fill="${r.goz}"/>
    <path d="M40 64 L80 64 L82 72 L38 72 Z" fill="#d4a537"/>
    <path d="M36 52 Q24 60 22 72 L32 72 Z" fill="${r.ana}"/>
    <path d="M22 106 L18 26" stroke="#2b2620" stroke-width="4"/>
    <circle cx="18" cy="22" r="8" fill="${r.goz}"/>
    <circle cx="18" cy="22" r="13" fill="none" stroke="${r.goz}" stroke-width="1.4" stroke-dasharray="2 4"/>
    <path d="M48 80 L60 92 L72 80" fill="none" stroke="${r.acik}" stroke-width="1.6"/>`;
}

// ── Düşman → çizim eşlemesi ──────────────────────────────
// r: { ana, koyu, acik, goz } renkleri.

const R = (ana, koyu, acik, goz) => ({ ana, koyu, acik, goz });

export const DUSMAN_CIZIMLERI = {
  // Marmara
  ac_kurt: [kurt, R('#8d8f94', '#5d6068', '#d9d6cf', '#d4a537')],
  cakal_surusu: [cakal, R('#c49a5c', '#8a6636', '#ecd8b0', '#d4a537')],
  yol_kesen_cin: [cin, R('#4b3f7a', '#2e2552', '#8f84c4', '#f2c94c')],
  gulyabani: [gulyabani, R('#6b7a52', '#4a5638', '#a8b88a', '#f2c94c')],
  bogaz_ejderi: [ejder, R('#2aa7a7', '#1d7d7d', '#9fd9d4', '#d9483b'), true],
  // Ege
  yaban_domuzu: [domuz, R('#7b5236', '#4f341f', '#c9a27e', '#d9483b')],
  zeytinlik_hortlagi: [hortlak, R('#c9cfa5', '#5a6230', '#eef0d8', '#8aa13a')],
  kara_cin: [cin, R('#2f2b3a', '#17151f', '#6a6480', '#e05a4e')],
  carsamba_karisi: [kukuletali, R('#5b4a6e', '#2e2540', '#9c8bb3', '#f2c94c')],
  yelbegen: [(r) => dev(r, { basSayisi: 3 }), R('#8a6a8f', '#5b4460', '#c7a9cc', '#d9483b'), true],
  // Akdeniz
  akrep_surusu: [akrep, R('#b5533c', '#7a3325', '#e0a08c', '#f2c94c')],
  anadolu_parsi: [pars, R('#d9b36c', '#7b5236', '#f3e3bd', '#2e9e4f')],
  magara_ifriti: [ifrit, R('#d9683b', '#9e3f22', '#f2c94c', '#1b2a5c')],
  yilan_beyi: [yilan, R('#4f8a3a', '#2f5a22', '#b8d98f', '#f2c94c')],
  sahmeran: [(r) => yilan(r, { tac: true }), R('#c9a43a', '#7a6420', '#f3e3a1', '#2aa7a7'), true],
  // İç Anadolu
  bozkir_kurdu: [kurt, R('#b08a5a', '#7a5a34', '#e6d2b0', '#d9483b')],
  peri_bacasi_cini: [cin, R('#b0756a', '#6e4038', '#e3bdb3', '#f2c94c')],
  toz_ifriti: [ifrit, R('#b99a6a', '#7a6240', '#e8d8b0', '#d9483b')],
  golge_albasti: [albasti, R('#4a4458', '#26222f', '#8a8298', '#d9483b')],
  albasti: [albasti, R('#6b2f3a', '#3a161d', '#b36a78', '#f2c94c'), true],
  // Karadeniz
  boz_ayi: [ayi, R('#7b5236', '#4f341f', '#b88c68', '#d4a537')],
  sis_cini: [cin, R('#aab8c2', '#6e7f8c', '#e3ebf0', '#2aa7a7')],
  orman_hortlagi: [hortlak, R('#8fae84', '#3e5a36', '#d3e3c9', '#f2c94c')],
  yayla_devi: [dev, R('#6f8a58', '#475a36', '#c9b28a', '#d9483b')],
  karakoncolos: [karakoncolos, R('#3a3f55', '#20233a', '#8a90a8', '#9fd9f4'), true],
  // Güneydoğu
  col_akrebi: [akrep, R('#d6b16e', '#8a6a34', '#f0dcae', '#d9483b')],
  kum_ifriti: [ifrit, R('#d9b36c', '#9e7a3a', '#f7e7bd', '#1b2a5c')],
  tas_dev: [dev, R('#9a958a', '#66625a', '#c9c4b8', '#d4a537')],
  tepegozun_muhafizi: [(r) => dev(r, { zirh: true }), R('#8a6a4a', '#5b4430', '#d6b894', '#d9483b')],
  tepegoz: [(r) => dev(r, { tekGoz: true }), R('#a3785a', '#6e4a34', '#dcb898', '#2e9e4f'), true],
  // Doğu Anadolu
  karli_dag_kurdu: [kurt, R('#e3e7ea', '#9aa4ad', '#ffffff', '#3b7dc4')],
  buz_cini: [cin, R('#8fc8e0', '#4a8aa8', '#e3f4fa', '#1b2a5c')],
  zulmetin_muhafizi: [(r) => dev(r, { zirh: true }), R('#4b3f7a', '#2e2552', '#8f84c4', '#d9483b')],
  tipi_ifriti: [ifrit, R('#c9e3ee', '#7aa8bd', '#ffffff', '#1b2a5c')],
  van_golu_canavari: [canavar, R('#2f6a7a', '#1d4450', '#8fc8d4', '#f2c94c'), true],
  // Final
  zulmet: [zulmet, R('#3a2a55', '#1b1330', '#8a6ab3', '#b36ae0'), true],
};

// Düşmanın SVG çizimi (HTML metni). Bosslar sihir halesiyle çizilir.
export function dusmanCizimi(anahtar, secenekler = {}) {
  const [beden, renk, bossMu] = DUSMAN_CIZIMLERI[anahtar];
  const icerik = (bossMu ? hale(renk.goz) : '') + beden(renk);
  return svgSar(icerik, { sinif: 'cizim cizim-dusman', ...secenekler });
}
