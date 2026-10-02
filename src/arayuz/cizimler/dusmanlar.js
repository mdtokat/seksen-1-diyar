// Düşman çizimleri. Her düşman bir "beden" iskeletinden türetilir; renkler ve
// ayrıntılar düşmana göre değişir. Figürler sola (oyuncuya) dönüktür.
// Kırmızı çizgiler (plan.md Bölüm 2): kan, vahşet ve müstehcenlik yoktur;
// mahlûklar ürkütücü değil, masalsı görünür.
import { svgSar, kontur, golge, hale, hacim, kure, metal, isilti, acik, koyu, parlak, leke, parlakGoz } from './ortak.js';
import { yankesiciBedeni } from './karakterler.js';

const LACI = '#1b2a5c';
const ALTIN = '#d4a537';
const KREM = '#f7efdc';

// Kalın, dış çizgili bir kıvrım (boyun, kuyruk, yılan gövdesi). Dış çizgi kendi renginin koyusudur.
const kivrim = (d, renk, kalinlik) => `
  <path d="${d}" fill="none" stroke="${kontur(renk)}" stroke-width="${kalinlik + 3.4}"/>
  <path d="${d}" fill="none" stroke="${renk}" stroke-width="${kalinlik}"/>`;

// Çizgisiz, saydam süs (doku, tüy, duman).
const doku = (d, renk, kalinlik = 1.2, opaklik = 0.55) =>
  `<path d="${d}" fill="none" stroke="${renk}" stroke-width="${kalinlik}" opacity="${opaklik}"/>`;

// Havada süzülen kıvılcım / sihir zerreleri.
const zerreler = (noktalar, renk) => noktalar
  .map(([x, y, r = 1.6]) => `<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="${isilti(renk)}" stroke="none"/>
    <circle cx="${x}" cy="${y}" r="${r * 0.7}" fill="#fff" stroke="none" opacity=".85"/>`).join('');

// Kızgın kaşlı, parlayan bir çift göz (önden bakan varlıklar için).
const gozCifti = (x1, x2, y, renk, r = 2.6) => `
  <path d="M${x1 - 5} ${y - 5} L${x1 + 4} ${y - 2} M${x2 + 5} ${y - 5} L${x2 - 4} ${y - 2}" stroke-width="2.4"/>
  ${parlakGoz(x1, y, renk, r)}${parlakGoz(x2, y, renk, r)}`;

// ── Hayvanlar (yandan, sola dönük) ──────────────────────

function kurt(r, { buyukKulak = false } = {}) {
  const kulak = buyukKulak ? 'M40 41 L33 14 L50 34 Z' : 'M40 41 L36 21 L49 36 Z';
  const kulakIc = buyukKulak ? 'M40 37 L36 21 L46 33 Z' : 'M40 37 L38 26 L45 34 Z';
  return `${golge(38)}
    <path d="M96 60 Q110 52 114 34 Q119 46 113 56 Q120 58 114 66 Q106 73 97 70 Z" fill="${hacim(r.koyu)}"/>
    <path d="M113 40 Q116 46 112 52" fill="none" stroke="${r.acik}" stroke-width="1.4" opacity=".7"/>
    <path d="M43 72 Q40 86 41 100 h7.5 Q48 88 51 75 Z" fill="${hacim(koyu(r.ana, 0.25))}"/>
    <path d="M84 68 Q93 76 89 86 L87 100 h7.5 l3 -15 Q99 74 93 66 Z" fill="${hacim(koyu(r.ana, 0.25))}"/>
    <path d="M38 60 Q46 47 66 49 Q86 45 99 53 Q107 62 101 74 Q92 80 78 78 Q62 82 50 78 Q40 72 38 60 Z" fill="${hacim(r.ana)}"/>
    ${leke('M48 76 Q64 81 82 76 Q72 71 54 72 Z', r.acik, 0.7)}
    ${doku('M58 51 l3 -3 l1 3.5 l3.5 -4 l1 4 l3.5 -3.5 l1 3.5 l3.5 -3', koyu(r.ana, 0.3), 1.4, 0.7)}
    ${doku('M70 60 q4 3 8 2 M84 58 q3 3 7 2 M62 66 q4 3 8 2', koyu(r.ana, 0.35), 1.2, 0.5)}
    <path d="M47 72 Q45 86 47.5 100 h9 Q55 88 58.5 74 Z" fill="${hacim(r.ana)}"/>
    <path d="M87 63 Q103 64 101 82 L98 100 h-8.5 l2 -14 Q84 79 87 63 Z" fill="${hacim(r.ana)}"/>
    <path d="M47 100 h10 M88.5 100 h10" stroke-width="3.4"/>
    <path d="M55 50 Q45 41 36 45 L29 56 Q33 70 50 73 L48 68 L52 66 Z" fill="${hacim(r.ana)}"/>
    <path d="M29 56 L33 62 L35 58 L39 66 L41 60 L45 68 L47 62" fill="${hacim(r.ana)}" stroke-width="1.6"/>
    <path d="${kulak}" fill="${hacim(koyu(r.ana, 0.2))}"/>
    ${leke(kulakIc, r.acik, 0.6)}
    <path d="M45 41 Q36 34 28 38 L14 45.5 Q7.5 48 7.5 52 Q8.5 56 14 56.5 L26 58.5 Q38 60 46 54 Z" fill="${hacim(r.ana)}"/>
    ${leke('M9.5 52.5 Q18 57 29 55.5 Q22 51.5 14 50.5 Z', r.acik, 0.75)}
    <path d="M12 56 Q20 60 30 58" fill="none" stroke-width="1.6"/>
    <path d="M15.5 56.5 l1.6 3 l1.6 -3 z" fill="#fff" stroke-width=".8"/>
    <ellipse cx="8.6" cy="51" rx="2.6" ry="2.2" fill="${kure(LACI)}" stroke="none"/>
    <path d="M21 43.5 l8 -1.5" stroke-width="1.8"/>
    ${parlakGoz(25.5, 46.5, r.goz, 2)}
`;
}

function cakal(r) {
  return `<g transform="translate(28 -8) scale(.76)" opacity=".8">${kurt({ ...r, ana: r.koyu }, { buyukKulak: true })}</g>
    ${kurt(r, { buyukKulak: true })}`;
}

function domuz(r) {
  return `${golge(38)}
    <path d="M44 78 L42 101 h8 l3 -21 Z M86 78 L86 101 h8 l1 -22 Z" fill="${hacim(koyu(r.ana, 0.3))}"/>
    <path d="M104 58 q9 -5 8 5 q-1 5 4 5" fill="none" stroke-width="2.4"/>
    <path d="M28 62 Q30 40 60 38 Q94 36 104 58 Q108 80 88 84 L46 86 Q28 82 28 62 Z" fill="${hacim(r.ana)}"/>
    ${leke('M44 82 Q64 88 90 82 Q80 76 52 77 Z', r.acik, 0.45)}
    <path d="M38 46 L42 31 L49 42 L54 27 L60 40 L66 28 L71 41 L77 31 L82 44 Q60 36 38 46 Z" fill="${hacim(r.koyu)}"/>
    ${doku('M60 54 l4 4 M72 52 l4 4 M84 56 l4 4 M66 66 l4 4 M80 68 l4 4 M92 64 l3 4', koyu(r.ana, 0.4), 1.4, 0.6)}
    <path d="M52 80 L50 101 h9.5 l2 -21 Z M94 77 L96 101 h9.5 l-1.5 -25 Z" fill="${hacim(r.ana)}"/>
    <path d="M50 99 h9.5 M96 99 h9.5" stroke-width="4"/>
    <path d="M40 49 Q26 49 16 55 L10 60 Q7 68 12 75 L22 77 Q35 79 43 70 Z" fill="${hacim(r.ana)}"/>
    <ellipse cx="9.5" cy="67" rx="4.6" ry="7.6" fill="${kure(r.acik)}"/>
    <ellipse cx="8.4" cy="64.5" rx="1.1" ry="1.7" fill="${LACI}" stroke="none"/><ellipse cx="8.4" cy="70" rx="1.1" ry="1.7" fill="${LACI}" stroke="none"/>
    <path d="M17 73 Q11 69 13 59 Q16 66 21.5 69.5 Z" fill="${kure(KREM)}" stroke-width="1.4"/>
    <path d="M38 50 L35 37 L46 46 Z" fill="${hacim(r.koyu)}"/>
    <path d="M23 54 l9 -2.5" stroke-width="2"/>
    ${parlakGoz(28, 58, r.goz, 2.1)}
`;
}

function pars(r) {
  const benek = [[56, 58], [68, 54], [80, 55], [92, 60], [62, 67], [76, 66], [88, 69], [50, 66]]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="none" stroke="${r.koyu}" stroke-width="1.5"/>
      <circle cx="${x}" cy="${y}" r="1.1" fill="${r.koyu}" stroke="none"/>`).join('');
  return `${golge(40)}
    ${kivrim('M98 64 Q115 64 115 82 Q115 95 105 92', r.ana, 6)}
    <path d="M108 70 l5 -2 M114 78 h-5 M113 87 l-5 -2" stroke="${r.koyu}" stroke-width="2.4"/>
    <path d="M46 70 L44 101 h8 l2 -29 Z M86 70 Q94 80 90 88 L88 101 h8 l3 -15 Q100 76 94 68 Z" fill="${hacim(koyu(r.ana, 0.25))}"/>
    <path d="M40 64 Q44 48 70 50 Q96 48 101 63 Q98 79 70 79 Q44 80 40 64 Z" fill="${hacim(r.ana)}"/>
    ${leke('M48 76 Q70 82 92 75 Q80 72 56 72 Z', r.acik, 0.7)}
    ${benek}
    <path d="M52 72 L52 101 h9 l1 -28 Z M90 64 Q104 66 101 84 L98 101 h-9 l2 -15 Q86 78 90 64 Z" fill="${hacim(r.ana)}"/>
    <path d="M51 100 h11 M88 100 h11" stroke-width="3.6"/>
    <path d="M27 42 L29 31 L37 39 Z M41 40 L45 31 L47 42 Z" fill="${hacim(r.ana)}"/>
    ${leke('M29.5 39 L30 34 L34 38 Z M43 39 L45 34 L45.5 40 Z', r.koyu, 0.8)}
    <path d="M20 46 Q24 37 36 38 Q49 40 50 53 Q50 66 37 68 Q26 68 19 61 Q15 54 20 46 Z" fill="${hacim(r.ana)}"/>
    <ellipse cx="23" cy="59" rx="8" ry="5.6" fill="${kure(r.acik)}"/>
    <path d="M15.5 55.5 l4 0 l-2 2.6 z" fill="${LACI}" stroke-width="1"/>
    <path d="M17.5 58 v3 M14 62 q3.5 2 7 0" fill="none" stroke-width="1.2"/>
    ${doku('M22 60 l-10 -2 M22 62 l-10 2 M24 63 l-8 5', LACI, 0.8, 0.7)}
    <circle cx="38" cy="48" r="1.2" fill="${r.koyu}" stroke="none"/><circle cx="42" cy="54" r="1.2" fill="${r.koyu}" stroke="none"/><circle cx="34" cy="44" r="1" fill="${r.koyu}" stroke="none"/>
    <path d="M22 47.5 l7 -1.5" stroke-width="1.6"/>
    ${parlakGoz(26, 50.5, r.goz, 2)}
`;
}

function ayi(r) {
  const pence = (x, y, yon) => [0, 1, 2]
    .map((i) => `<path d="M${x + (i - 1) * 3.5} ${y} q${yon} 3.5 ${yon * 0.4} 6" fill="none" stroke="${KREM}" stroke-width="1.6"/>`).join('');
  return `${golge(38)}
    <ellipse cx="44" cy="101" rx="10" ry="5.5" fill="${hacim(r.koyu)}"/><ellipse cx="78" cy="101" rx="10" ry="5.5" fill="${hacim(r.koyu)}"/>
    <path d="M30 60 Q32 42 60 42 Q88 42 90 60 L94 96 Q60 106 26 96 Z" fill="${hacim(r.ana)}"/>
    <path d="M44 64 Q60 56 76 64 L78 94 Q60 100 42 94 Z" fill="${hacim(r.acik)}"/>
    ${doku('M48 70 q3 2 6 0 M60 74 q3 2 6 0 M52 82 q3 2 6 0 M64 86 q3 2 6 0', koyu(r.acik, 0.3), 1.2)}
    ${doku('M34 62 l-3 4 l4 1 l-3 4 M86 62 l3 4 l-4 1 l3 4', koyu(r.ana, 0.35), 1.4)}
    <path d="M31 57 Q14 63 16 84 Q20 91 28 87 L37 70 Z" fill="${hacim(r.ana)}"/>
    <path d="M89 57 Q106 63 104 84 Q100 91 92 87 L83 70 Z" fill="${hacim(r.ana)}"/>
    ${pence(21, 86, -1.5)}${pence(99, 86, 1.5)}
    <circle cx="43" cy="22" r="8" fill="${kure(r.ana)}"/><circle cx="77" cy="22" r="8" fill="${kure(r.ana)}"/>
    <circle cx="43" cy="22" r="4" fill="${r.koyu}" stroke="none"/><circle cx="77" cy="22" r="4" fill="${r.koyu}" stroke="none"/>
    <circle cx="60" cy="36" r="18.5" fill="${kure(r.ana)}"/>
    <ellipse cx="60" cy="44.5" rx="10.5" ry="8" fill="${kure(r.acik)}"/>
    <ellipse cx="60" cy="40" rx="4.6" ry="3.2" fill="${kure(LACI)}" stroke="none"/>
    <path d="M60 43 v3 M55.5 47 Q60 50.5 64.5 47" fill="none" stroke-width="1.5"/>
    ${gozCifti(51, 69, 32, r.goz, 2.1)}
    ${parlak('M45 26 Q50 20 57 19', 0.35)}`;
}

function akrep(r) {
  const bacak = [0, 1, 2, 3].map((i) => {
    const x = 44 + i * 9;
    return `<path d="M${x} 80 L${x - 8} 90 L${x - 13} 101" fill="none" stroke-width="4.6"/>
            <path d="M${x} 80 L${x - 8} 90 L${x - 13} 101" fill="none" stroke="${r.koyu}" stroke-width="2.2"/>
            <path d="M${x + 4} 80 L${x + 12} 90 L${x + 16} 101" fill="none" stroke-width="4.6"/>
            <path d="M${x + 4} 80 L${x + 12} 90 L${x + 16} 101" fill="none" stroke="${r.koyu}" stroke-width="2.2"/>`;
  }).join('');
  // Kuyruk boğumları: bir eğri boyunca küçülen boncuklar.
  const egri = (t) => {
    const [x0, y0, x1, y1, x2, y2, x3, y3] = [82, 76, 104, 70, 104, 26, 82, 24];
    const u = 1 - t;
    return [u ** 3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3,
      u ** 3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3];
  };
  const bogumlar = Array.from({ length: 7 }, (_, i) => {
    const [x, y] = egri(i / 6.6);
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(7.6 - i * 0.55).toFixed(1)}" ry="${(6.6 - i * 0.5).toFixed(1)}" fill="${kure(r.ana)}"/>`;
  }).join('');
  const kiskac = (y, a) => `
    <path d="M40 ${y} Q30 ${y - 4 * a} 24 ${y - 2 * a}" fill="none" stroke-width="7"/>
    <path d="M40 ${y} Q30 ${y - 4 * a} 24 ${y - 2 * a}" fill="none" stroke="${r.ana}" stroke-width="4"/>
    <path d="M26 ${y - 2 * a} Q14 ${y - 9 * a} 7 ${y - 3 * a} Q14 ${y - 3 * a} 16 ${y} Q10 ${y + 3 * a} 11 ${y + 6 * a} Q22 ${y + 6 * a} 28 ${y} Z" fill="${hacim(r.ana)}"/>`;
  return `${golge(42)}
    ${bacak}
    ${kiskac(70, 1)}${kiskac(86, -1)}
    <ellipse cx="58" cy="79" rx="24" ry="11" fill="${hacim(r.ana)}"/>
    <path d="M46 70 Q46 80 46 89 M58 68 Q58 80 58 90 M70 69 Q70 80 70 89" fill="none" stroke="${koyu(r.ana, 0.3)}" stroke-width="1.4"/>
    ${bogumlar}
    <path d="M80 22 Q72 18 68 24 Q66 32 74 34 Q80 32 82 26 Z" fill="${kure(r.ana)}"/>
    <path d="M70 31 Q62 34 60 42 Q66 38 72 35 Z" fill="${hacim(r.koyu)}"/>
    <circle cx="61" cy="41" r="5" fill="${isilti(r.goz)}" stroke="none"/>
    ${parlak('M42 74 Q52 69 64 70', 0.4)}
    ${parlakGoz(39, 76, r.goz, 1.7)}${parlakGoz(39, 82, r.goz, 1.7)}`;
}

function yilan(r, { tac = false } = {}) {
  const tacCiz = tac
    ? `<path d="M36 22 L37 6 L43 15 L48 3 L53 15 L59 6 L60 22 Q48 18 36 22 Z" fill="${metal(ALTIN)}"/>
       <circle cx="48" cy="14" r="2.6" fill="${kure('#d9483b')}" stroke-width="1"/>
       <circle cx="40" cy="17" r="1.6" fill="${kure('#2aa7a7')}" stroke-width=".8"/><circle cx="56" cy="17" r="1.6" fill="${kure('#2aa7a7')}" stroke-width=".8"/>
       <circle cx="37" cy="6" r="1.4" fill="${KREM}" stroke-width=".8"/><circle cx="48" cy="3" r="1.4" fill="${KREM}" stroke-width=".8"/><circle cx="59" cy="6" r="1.4" fill="${KREM}" stroke-width=".8"/>`
    : '';
  const govdeYolu = 'M80 92 Q88 74 72 63 Q54 52 58 38 Q60 30 52 25';
  return `${golge(40)}
    <ellipse cx="62" cy="96" rx="30" ry="8.5" fill="none" stroke="${kontur(r.ana)}" stroke-width="16.4"/>
    <ellipse cx="62" cy="96" rx="30" ry="8.5" fill="none" stroke="${koyu(r.ana, 0.25)}" stroke-width="13"/>
    <path d="M32 96 Q33 106 62 106 Q91 106 92 96" fill="none" stroke="${kontur(r.ana)}" stroke-width="16.4"/>
    <path d="M32 96 Q33 106 62 106 Q91 106 92 96" fill="none" stroke="${r.ana}" stroke-width="13"/>
    <path d="M36 100 Q46 104.5 62 104.5" fill="none" stroke="${r.acik}" stroke-width="3" opacity=".7"/>
    <path d="M32 96 Q33 106 62 106 Q91 106 92 96" fill="none" stroke="${r.koyu}" stroke-width="9" stroke-dasharray="2.5 7" opacity=".7"/>
    ${kivrim(govdeYolu, r.ana, 13)}
    <path d="${govdeYolu}" fill="none" stroke="${r.koyu}" stroke-width="9" stroke-dasharray="2.5 7" opacity=".7"/>
    <path d="M77 90 Q83 75 69 65 Q53 55 55 40" fill="none" stroke="${r.acik}" stroke-width="3.4" stroke-dasharray="4 2.5"/>
    <path d="M33 21 Q40 13 52 16 Q63 20 61 28 Q57 35 46 35 Q35 35 31 30 Q29 25 33 21 Z" fill="${hacim(r.ana)}"/>
    ${leke('M33 30 Q42 34 54 32 Q46 30 36 28 Z', r.acik, 0.7)}
    <path d="M45 19 l3 3 l-3 3 l-3 -3 z M53 21 l2.4 2.4 l-2.4 2.4 l-2.4 -2.4 z" fill="${r.koyu}" stroke="none"/>
    ${tacCiz}
    ${parlakGoz(41, 24.5, r.goz, 2.3)}
    <path d="M41 23 v3" stroke="${LACI}" stroke-width="1.2"/>
    <path d="M31 29 L23 31 M23 31 l-4 -3 M23 31 l-4 3" fill="none" stroke="#d9483b" stroke-width="1.6"/>
    ${parlak('M38 19 Q44 16 50 17', 0.45)}`;
}

// ── Sihirle azmış varlıklar (önden) ─────────────────────

function cin(r) {
  const el = (x, s) => `
    <path d="M${x} 66 l${-4 * s} 6 M${x + 3 * s} 67 l${-2 * s} 7 M${x + 6 * s} 67 l0 7" fill="none" stroke-width="2.2"/>`;
  return `${golge(24)}
    <circle cx="60" cy="58" r="40" fill="${isilti(r.acik)}" stroke="none" opacity=".35"/>
    <path d="M43 64 Q37 84 53 93 Q63 99 55 107 Q74 102 71 89 Q67 78 78 64 Z" fill="${hacim(r.ana)}"/>
    <path d="M58 76 Q50 86 60 94" fill="none" stroke="${r.acik}" stroke-width="1.6" opacity=".7"/>
    <circle cx="47" cy="99" r="4" fill="${r.acik}" stroke="none" opacity=".4"/><circle cx="72" cy="104" r="3" fill="${r.acik}" stroke="none" opacity=".35"/>
    <path d="M36 48 Q22 52 15 65 Q16 72 23 70 Q28 60 40 59 Z" fill="${hacim(r.ana)}"/>
    <path d="M84 48 Q98 52 105 65 Q104 72 97 70 Q92 60 80 59 Z" fill="${hacim(r.ana)}"/>
    <path d="M21 62 l5 3 l-1 4 l-5 -3 z M99 62 l-5 3 l1 4 l5 -3 z" fill="${metal(ALTIN)}" stroke-width="1"/>
    ${el(16, 1)}${el(104, -1)}
    <path d="M34 48 Q38 35 60 33 Q82 35 86 48 Q86 62 77 70 Q60 77 43 70 Q34 62 34 48 Z" fill="${hacim(r.ana)}"/>
    ${leke('M44 46 Q60 40 76 46 Q72 60 60 64 Q48 60 44 46 Z', r.acik, 0.35)}
    <path d="M52 54 Q60 60 68 54 Q64 64 60 66 Q56 64 52 54 Z" fill="${r.goz}" stroke="none" opacity=".55"/>
    <path d="M48 20 Q38 14 36 1 Q44 9 53 13 Z M72 20 Q82 14 84 1 Q76 9 67 13 Z" fill="${hacim(r.koyu)}"/>
    <path d="M47 28 L38 22 L46 35 Z M73 28 L82 22 L74 35 Z" fill="${hacim(r.ana)}"/>
    <path d="M46 29 Q46 13 60 13 Q74 13 74 29 Q74 42 60 44 Q46 42 46 29 Z" fill="${kure(r.ana)}"/>
    ${gozCifti(53, 67, 28, r.goz, 2.4)}
    <path d="M53 37 Q60 41.5 67 37" fill="none" stroke-width="1.6"/>
    <path d="M55 38.2 l1.2 2.4 l1.2 -2 Z M65 38.2 l-1.2 2.4 l-1.2 -2 Z" fill="#fff" stroke-width=".7"/>
    <circle cx="42" cy="33" r="1.6" fill="${kure(ALTIN)}" stroke-width=".8"/>
    ${zerreler([[22, 40], [100, 44, 1.3], [30, 90, 1.2], [94, 84]], r.goz)}
    ${parlak('M40 46 Q44 38 54 36', 0.3)}`;
}

function hortlak(r) {
  return `${golge(28)}
    <circle cx="60" cy="54" r="46" fill="${isilti(r.acik)}" stroke="none" opacity=".5"/>
    <g opacity=".93">
      <path d="M60 13 Q91 13 91 48 L93 96 Q86 89 79 98 Q72 89 66 99 Q60 90 54 99 Q48 89 41 98 Q34 89 27 96 L29 48 Q29 13 60 13 Z" fill="${hacim(r.ana)}"/>
      <path d="M30 54 Q13 58 8 45 Q19 51 30 47 Z M90 54 Q107 58 112 45 Q101 51 90 47 Z" fill="${hacim(r.ana)}"/>
      ${doku('M40 60 Q38 76 41 94 M60 66 Q58 80 60 96 M80 60 Q82 76 79 94', koyu(r.ana, 0.25), 1.4, 0.5)}
      ${parlak('M36 46 Q37 26 52 19', 0.5)}
    </g>
    <ellipse cx="48.5" cy="44" rx="6.5" ry="8.5" fill="${hacim(r.koyu)}"/>
    <ellipse cx="71.5" cy="44" rx="6.5" ry="8.5" fill="${hacim(r.koyu)}"/>
    ${parlakGoz(48.5, 46, r.goz, 2)}${parlakGoz(71.5, 46, r.goz, 2)}
    <ellipse cx="60" cy="64" rx="5" ry="7" fill="${hacim(r.koyu)}"/>
    <path d="M36 30 Q44 22 50 26 M84 30 Q76 22 70 26" fill="none" stroke="${koyu(r.ana, 0.3)}" stroke-width="1.8"/>
    ${zerreler([[18, 30, 1.2], [104, 34, 1.2], [14, 70, 1], [108, 72, 1]], r.acik)}`;
}

function gulyabani(r) {
  const saclar = Array.from({ length: 11 }, (_, i) => {
    const x = 36 + i * 4.8;
    return `M${x} ${44 + (i % 3) * 3} q${i % 2 ? 2 : -2} 22 ${i % 2 ? -1 : 1} 44`;
  }).join(' ');
  return `${golge(32)}
    <path d="M60 7 Q81 9 85 32 L91 70 L87 103 L77 96 L69 105 L60 97 L51 105 L43 96 L33 103 L29 70 L35 32 Q39 9 60 7 Z" fill="${hacim(r.ana)}"/>
    ${doku(saclar, koyu(r.ana, 0.35), 1.4, 0.6)}
    <path d="M36 40 Q19 56 16 90 L25 93 Q27 64 40 52 Z M84 40 Q101 56 104 90 L95 93 Q93 64 80 52 Z" fill="${hacim(r.koyu)}"/>
    <path d="M16 90 l-3 7 M20 91 l-1 8 M24.5 92 l2 7 M104 90 l3 7 M100 91 l1 8 M95.5 92 l-2 7" stroke-width="2.4"/>
    <path d="M16 90 l-3 7 M20 91 l-1 8 M24.5 92 l2 7 M104 90 l3 7 M100 91 l1 8 M95.5 92 l-2 7" stroke="${KREM}" stroke-width="1"/>
    <path d="M43 21 Q60 30 77 21 L77 40 Q60 47 43 40 Z" fill="${hacim(r.koyu)}"/>
    <path d="M42 14 Q60 26 78 14" fill="none" stroke="${koyu(r.ana, 0.3)}" stroke-width="1.6"/>
    ${gozCifti(51, 69, 32.5, r.goz, 2.4)}
    <path d="M54 40 l2 3 l2 -2.6 l2 2.6 l2 -2.6 l2 2.6 l2 -3" fill="none" stroke="${KREM}" stroke-width="1.2"/>
    ${parlak('M40 28 Q44 16 54 12', 0.3)}`;
}

function ifrit(r) {
  const alev = 'M60 3 Q66 17 76 11 Q74 25 87 29 Q80 40 91 50 Q84 60 89 74 Q77 72 77 88 Q68 82 60 99 Q52 82 43 88 Q43 72 31 74 Q36 60 29 50 Q40 40 33 29 Q46 25 44 11 Q54 17 60 3 Z';
  return `${golge(26)}
    <circle cx="60" cy="52" r="50" fill="${isilti(r.ana)}" stroke="none" opacity=".55"/>
    <path d="M30 50 Q13 46 8 32 Q21 39 31 41 Z M90 50 Q107 46 112 32 Q99 39 89 41 Z" fill="${hacim(r.koyu)}"/>
    <path d="${alev}" fill="${hacim(r.ana)}"/>
    <path d="M60 15 Q65 25 72 23 Q71 33 80 37 Q74 45 81 54 Q73 58 74 70 Q66 66 60 84 Q54 66 46 70 Q47 58 39 54 Q46 45 40 37 Q49 33 48 23 Q55 25 60 15 Z" fill="${r.acik}" stroke="none" opacity=".9"/>
    <ellipse cx="60" cy="56" rx="13" ry="17" fill="${isilti('#fffaf0')}" stroke="none"/>
    <path d="M45 40 L57 45 L48 49 Z M75 40 L63 45 L72 49 Z" fill="${r.goz}" stroke-width="1.4"/>
    <circle cx="51" cy="45" r="1.2" fill="#fff" stroke="none"/><circle cx="69" cy="45" r="1.2" fill="#fff" stroke="none"/>
    <path d="M51 58 L55 55 L58 59 L62 55 L65 59 L69 56" fill="none" stroke="${r.goz}" stroke-width="2"/>
    <path d="M44 100 Q60 90 76 100" fill="none" stroke="${r.koyu}" stroke-width="3"/>
    ${zerreler([[22, 22, 1.4], [98, 18, 1.2], [16, 64, 1], [104, 66, 1.3], [92, 96, 1]], r.acik)}`;
}

function kukuletali(r) {
  return `${golge(32)}
    <path d="M27 104 L19 30" stroke-width="5.4"/>
    <path d="M27 104 L19 30" stroke="#7b5236" stroke-width="3"/>
    <path d="M19 33 Q10 22 9 10 L13 18 L14 8 L17 17 L19 6 L21 17 L24 8 L24 19 L28 11 Q27 23 21 33 Z" fill="${hacim('#b39a6e')}" stroke-width="1.4"/>
    <path d="M16 27 Q20 30 24 27" fill="none" stroke="#d9483b" stroke-width="2"/>
    <path d="M60 11 Q83 13 86 43 L94 103 Q60 108 26 103 L35 43 Q37 13 60 11 Z" fill="${hacim(r.ana)}"/>
    ${doku('M44 52 Q40 76 38 100 M76 52 Q80 76 82 100', koyu(r.ana, 0.35), 1.6, 0.6)}
    <path d="M70 76 h10 v9 h-10 z" fill="${hacim(acik(r.ana, 0.25))}" stroke-width="1.4"/>
    <path d="M71 78 l8 0 M71 81 l8 0" stroke="${r.koyu}" stroke-width=".8" stroke-dasharray="1.4 1.4"/>
    <path d="M46 70 Q50 82 46 88 Q40 88 40 82 Q40 74 46 70 Z" fill="${hacim('#9e6b3a')}" stroke-width="1.4"/>
    <path d="M60 21 Q75 23 75 43 Q73 56 60 58 Q47 56 45 43 Q45 23 60 21 Z" fill="${hacim(koyu(r.koyu, 0.3))}"/>
    ${parlakGoz(53.5, 41, r.goz, 2)}${parlakGoz(66.5, 41, r.goz, 2)}
    <path d="M60 44 q-3 5 -1 8" fill="none" stroke="${acik(r.koyu, 0.25)}" stroke-width="1.4"/>
    <path d="M36 58 Q24 62 22 54 L28 48 Z" fill="${hacim(r.ana)}"/>
    <circle cx="25" cy="55" r="3.4" fill="${kure('#c9b09a')}" stroke-width="1.4"/>
    ${parlak('M42 40 Q44 22 56 16', 0.35)}
    ${zerreler([[96, 30, 1.2], [88, 16, 1], [102, 52, 1]], r.goz)}`;
}

function albasti(r) {
  const tutam = Array.from({ length: 7 }, (_, i) => {
    const x = 40 + i * 6.6;
    return `M${x} ${30 + Math.abs(3 - i) * 2} Q${x + (i % 2 ? 6 : -6)} 66 ${x + (i - 3) * 2} 100`;
  }).join(' ');
  return `${golge(30)}
    <circle cx="60" cy="54" r="46" fill="${isilti(r.acik)}" stroke="none" opacity=".35"/>
    <path d="M60 9 Q83 11 85 37 Q87 60 97 80 Q85 78 87 99 Q73 90 71 104 Q63 94 60 104 Q56 94 49 104 Q47 90 33 99 Q35 78 23 80 Q33 60 35 37 Q37 11 60 9 Z" fill="${hacim(r.ana)}"/>
    ${doku(tutam, acik(r.ana, 0.3), 1.6, 0.65)}
    <path d="M60 21 Q73 23 73 38 Q73 53 60 55 Q47 53 47 38 Q47 23 60 21 Z" fill="${hacim(koyu(r.koyu, 0.2))}"/>
    <path d="M49.5 36 Q54 31 58 37 Q54 41 49.5 36 Z M70.5 36 Q66 31 62 37 Q66 41 70.5 36 Z" fill="${r.goz}" stroke-width="1"/>
    <circle cx="54" cy="36" r="5" fill="${isilti(r.goz)}" stroke="none"/><circle cx="66" cy="36" r="5" fill="${isilti(r.goz)}" stroke="none"/>
    <path d="M55 46 Q60 48.5 65 46" fill="none" stroke="${acik(r.koyu, 0.3)}" stroke-width="1.4"/>
    <path d="M51 4 Q60 13 69 4 Q66 15 60 15 Q54 15 51 4 Z" fill="${hacim(r.goz)}"/>
    <path d="M30 70 Q18 72 14 64 M90 70 Q102 72 106 64" fill="none" stroke-width="5"/>
    <path d="M30 70 Q18 72 14 64 M90 70 Q102 72 106 64" fill="none" stroke="${r.ana}" stroke-width="2.6"/>
    ${parlak('M40 40 Q42 20 54 14', 0.3)}
    ${zerreler([[16, 50, 1.2], [104, 48, 1.2], [20, 92, 1], [100, 94, 1]], r.goz)}`;
}

function dev(r, { tekGoz = false, zirh = false, basSayisi = 1 } = {}) {
  const bas = (x, y, s = 1) => `
    <g transform="translate(${x} ${y}) scale(${s})">
      <path d="M-15 1 Q-15 -19 0 -19 Q15 -19 15 1 Q15 13 0 15 Q-15 13 -15 1 Z" fill="${kure(r.acik)}"/>
      <ellipse cx="-15" cy="0" rx="2.6" ry="4" fill="${r.acik}" stroke-width="1.4"/><ellipse cx="15" cy="0" rx="2.6" ry="4" fill="${r.acik}" stroke-width="1.4"/>
      ${tekGoz
    ? `<circle cx="0" cy="-5" r="7.6" fill="${kure('#fffaf0')}"/>${parlakGoz(0, -5, r.goz, 3.6)}
         <path d="M-9 -13 Q0 -16 9 -13" fill="none" stroke-width="2.6"/>`
    : `${gozCifti(-6, 6, -4, r.goz, 2)}`}
      <path d="M-3 3 Q0 6 3 3" fill="none" stroke-width="1.4"/>
      <path d="M-7 8 Q0 5 7 8" fill="none" stroke-width="1.6"/>
      <path d="M-6 8.4 l1.6 -3.4 l1.4 3 Z M6 8.4 l-1.6 -3.4 l-1.4 3 Z" fill="${KREM}" stroke-width=".8"/>
      ${tekGoz ? '<path d="M-10 -16 L-6 -25 L-2 -18 Z M10 -16 L6 -25 L2 -18 Z" fill="#7b5236" stroke-width="1.4"/>' : ''}
    </g>`;
  const baslar = basSayisi === 3
    ? bas(37, 30, 0.78) + bas(83, 30, 0.78) + bas(60, 24)
    : bas(60, 26);
  const zirhCiz = zirh
    ? `<path d="M39 43 L81 43 L83 76 Q60 81 37 76 Z" fill="${metal('#8f99a3')}"/>
       <path d="M39 54 Q60 58 82 54 M38 65 Q60 69 82.5 65" fill="none" stroke="${LACI}" stroke-width="1.4"/>
       <circle cx="60" cy="50" r="4" fill="${kure(r.goz)}" stroke-width="1.4"/>
       <path d="M28 46 Q34 38 44 42 L40 54 Q32 54 28 46 Z M92 46 Q86 38 76 42 L80 54 Q88 54 92 46 Z" fill="${metal('#8f99a3')}"/>
       <path d="M43 13 Q60 -1 77 13 L78 18 L42 18 Z" fill="${metal('#8f99a3')}"/>
       <path d="M60 3 L60 -4" stroke-width="3"/>`
    : `<path d="M40 50 Q50 46 58 52 M80 50 Q70 46 62 52 M50 60 Q60 64 70 60" fill="none" stroke="${koyu(r.ana, 0.3)}" stroke-width="1.6"/>`;
  return `${golge(40)}
    <path d="M14 62 L8 102" stroke-width="7"/><path d="M14 62 L8 102" stroke="#7b5236" stroke-width="4.4"/>
    <path d="M14 62 Q8 48 14 38 Q22 34 26 42 Q26 54 20 64 Z" fill="${hacim('#7b5236')}"/>
    <circle cx="16" cy="44" r="1.6" fill="${koyu('#7b5236', 0.4)}" stroke="none"/><circle cx="21" cy="52" r="1.6" fill="${koyu('#7b5236', 0.4)}" stroke="none"/>
    <path d="M45 84 L41 102 L57 102 L58 84 Z M62 84 L63 102 L79 102 L75 84 Z" fill="${hacim(r.koyu)}"/>
    <path d="M40 101 h18 M62 101 h18" stroke-width="4"/>
    <path d="M33 48 Q33 37 60 35 Q87 37 87 48 L91 86 L29 86 Z" fill="${hacim(r.ana)}"/>
    <path d="M33 50 Q15 60 15 84 L27 86 Q27 68 37 62 Z M87 50 Q105 60 105 84 L93 86 Q93 68 83 62 Z" fill="${hacim(r.ana)}"/>
    <circle cx="21" cy="87" r="8.5" fill="${kure(r.acik)}"/><circle cx="99" cy="87" r="8.5" fill="${kure(r.acik)}"/>
    <path d="M18 63 Q22 60 26 66" fill="none" stroke="${r.koyu}" stroke-width="3"/>
    <path d="M29 75 L91 75 L91 83 L29 83 Z" fill="${hacim('#7b5236')}"/>
    <rect x="55" y="74" width="10" height="10" rx="2" fill="${metal(ALTIN)}" stroke-width="1.4"/>
    <path d="M33 83 L36 92 L42 85 L48 93 L54 85 L60 93 L66 85 L72 93 L78 85 L84 92 L87 83 Z" fill="${hacim(koyu(r.koyu, 0.1))}" stroke-width="1.4"/>
    ${zirhCiz}
    ${parlak('M36 48 Q44 40 56 38', 0.3)}
    ${baslar}`;
}

function karakoncolos(r) {
  const tuy = Array.from({ length: 10 }, (_, i) => {
    const x = 28 + i * 7;
    return `<path d="M${x} 95 l3 9 l4 -9" fill="${hacim(r.ana)}" stroke-width="1.6"/>`;
  }).join('');
  const kar = [[16, 18, 3], [102, 28, 2.4], [96, 10, 2], [10, 44, 2], [106, 60, 2.2], [14, 74, 1.8]]
    .map(([x, y, s]) => `<path d="M${x - s} ${y} h${2 * s} M${x} ${y - s} v${2 * s} M${x - s * 0.7} ${y - s * 0.7} l${s * 1.4} ${s * 1.4} M${x + s * 0.7} ${y - s * 0.7} l${-s * 1.4} ${s * 1.4}" stroke="#fff" stroke-width="1.2"/>`).join('');
  return `${golge(34)}
    <circle cx="60" cy="56" r="48" fill="${isilti(r.goz)}" stroke="none" opacity=".3"/>
    ${tuy}
    <path d="M60 9 Q91 11 91 50 L93 98 L27 98 L29 50 Q29 11 60 9 Z" fill="${hacim(r.ana)}"/>
    ${doku('M38 56 l3 6 M48 64 l3 6 M70 62 l3 6 M80 54 l3 6 M42 78 l3 6 M58 80 l3 6 M76 76 l3 6', acik(r.ana, 0.3), 1.4, 0.6)}
    <path d="M29 50 Q13 58 13 83 L25 85 Q25 66 35 60 Z M91 50 Q107 58 107 83 L95 85 Q95 66 85 60 Z" fill="${hacim(r.koyu)}"/>
    <path d="M13 83 l-3 7 M17.5 85 l-1 8 M22 85 l2 7 M107 83 l3 7 M102.5 85 l1 8 M98 85 l-2 7" stroke-width="2.6"/>
    <path d="M13 83 l-3 7 M17.5 85 l-1 8 M22 85 l2 7 M107 83 l3 7 M102.5 85 l1 8 M98 85 l-2 7" stroke="#e3f4fa" stroke-width="1.1"/>
    <path d="M43 29 Q60 20 77 29 Q79 44 60 49 Q41 44 43 29 Z" fill="${hacim(r.acik)}"/>
    ${parlakGoz(51.5, 35.5, r.goz, 3.2)}${parlakGoz(68.5, 35.5, r.goz, 3.2)}
    <path d="M54 43 Q60 46 66 43" fill="none" stroke-width="1.4"/>
    <path d="M40 12 L32 0 L49 9 Z M80 12 L88 0 L71 9 Z" fill="${hacim(r.koyu)}"/>
    <path d="M60 48 Q52 56 46 54 Q54 60 64 54" fill="none" stroke="#e3f4fa" stroke-width="1.6" opacity=".8"/>
    ${parlak('M38 36 Q40 20 52 14', 0.35)}
    ${kar}`;
}

function ejder(r) {
  const govdeYolu = 'M52 76 Q63 58 55 40 Q49 30 41 28';
  return `${golge(42)}
    <path d="M60 60 L79 14 L84 32 L99 22 L95 45 L110 42 L85 70 Z" fill="${hacim(r.acik)}"/>
    <path d="M79 14 L70 56 M99 22 L78 62 M110 42 L82 66" fill="none" stroke="${koyu(r.acik, 0.3)}" stroke-width="1.6"/>
    ${leke('M84 32 L72 58 L95 45 Z', koyu(r.acik, 0.2), 0.5)}
    <path d="M36 100 Q19 96 23 83 Q30 69 56 71 Q89 73 97 90 Q101 105 80 104 Z" fill="${hacim(r.ana)}"/>
    ${doku('M34 92 q4 -4 8 0 M46 90 q4 -4 8 0 M58 92 q4 -4 8 0 M70 94 q4 -4 8 0 M82 96 q4 -4 8 0', koyu(r.ana, 0.3), 1.4, 0.7)}
    <path d="M96 94 Q113 97 111 79 Q106 90 98 88 Z" fill="${hacim(r.ana)}"/>
    <path d="M111 79 l4 -6 l-1 8 Z" fill="${r.koyu}" stroke-width="1.2"/>
    ${kivrim(govdeYolu, r.ana, 16)}
    <path d="M58 70 Q65 56 58 42" fill="none" stroke="${r.acik}" stroke-width="6" stroke-dasharray="4 2.4"/>
    <path d="M47 50 l4 -6 l3 6 M44 60 l5 -5 l2 6" fill="${r.koyu}" stroke-width="1.2"/>
    <path d="M45 35 Q35 32 22 37 L9 35 L13 44 L26 48 Q40 48 48 42 Z" fill="${hacim(r.ana)}"/>
    ${leke('M12 41 L26 45 Q38 46 44 42 Q30 42 14 39 Z', r.acik, 0.65)}
    <path d="M14 44 l2 3 l2 -2.4 l2 2.6 l2 -2.4" fill="#fff" stroke-width=".8"/>
    <path d="M41 25 L48 8 L49 27 Z M35 27 L33 12 L41 27 Z" fill="${hacim(r.koyu)}"/>
    <path d="M44 38 Q52 34 56 40 Q52 42 48 44" fill="${hacim(r.koyu)}" stroke-width="1.4"/>
    <path d="M9 35 Q3 29 5 22 M12 44 Q5 48 7 55" fill="none" stroke="${r.koyu}" stroke-width="1.8"/>
    <path d="M24 34 l9 -2.4" stroke-width="2"/>
    ${parlakGoz(30, 36, r.goz, 2.2)}
    <path d="M62 80 l4 -7 l4 7 Z M74 82 l4 -7 l4 7 Z M86 86 l4 -6 l3 7 Z" fill="${hacim(r.koyu)}" stroke-width="1.4"/>
    ${parlak('M28 34 Q36 31 42 32', 0.45)}`;
}

function canavar(r) {
  return `
    <ellipse cx="62" cy="100" rx="60" ry="14" fill="${isilti('#2f6aa8')}" stroke="none"/>
    <ellipse cx="62" cy="100" rx="50" ry="9" fill="${hacim('#3b7dc4')}" opacity=".8" stroke="none"/>
    <path d="M68 96 Q72 70 84 70 Q97 70 99 96 Z" fill="${hacim(r.ana)}"/>
    <path d="M78 72 l3 -7 l4 6 M88 72 l4 -6 l2 7" fill="${r.koyu}" stroke-width="1.2"/>
    <path d="M88 96 Q92 80 101 80 Q109 80 111 96 Z" fill="${hacim(r.koyu)}"/>
    <path d="M19 96 Q19 50 40 35 Q53 27 57 42 Q59 62 53 96 Z" fill="${hacim(r.ana)}"/>
    <path d="M30 94 Q30 60 42 46" fill="none" stroke="${r.acik}" stroke-width="4.4" stroke-dasharray="4 3"/>
    <path d="M55 46 l7 -2 l-5 6 M57 58 l7 -1 l-6 6 M57 70 l6 0 l-6 6" fill="${r.koyu}" stroke-width="1.2"/>
    <path d="M41 35 Q31 25 16 29 Q7 33 11 42 Q24 45 41 44 Z" fill="${hacim(r.ana)}"/>
    ${leke('M12 40 Q24 43 38 42 Q28 38 16 37 Z', r.acik, 0.6)}
    <path d="M43 33 L51 20 L51 36 Z M36 31 L38 16 L45 31 Z" fill="${hacim(r.koyu)}"/>
    <path d="M44 38 Q56 36 60 46 Q52 44 46 46" fill="${hacim(r.koyu)}" stroke-width="1.4"/>
    <path d="M22 32 l8 -1" stroke-width="1.8"/>
    ${parlakGoz(26, 35, r.goz, 2.2)}
    <circle cx="13.5" cy="35" r="1" fill="${LACI}" stroke="none"/>
    ${parlak('M26 54 Q28 42 36 38', 0.4)}
    <path d="M14 96 Q16 88 22 92 M58 96 Q62 88 66 94 M64 96 Q66 90 70 94 M98 96 Q100 90 104 93" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/>
    <ellipse cx="62" cy="99" rx="46" ry="6" fill="none" stroke="${KREM}" stroke-width="1.8" stroke-dasharray="14 6"/>
    <ellipse cx="62" cy="101" rx="56" ry="9" fill="none" stroke="#cfe9f4" stroke-width="1.2" stroke-dasharray="8 10" opacity=".7"/>`;
}

function zulmet(r) {
  return `${golge(34)}
    <path d="M40 40 Q20 70 16 104 L46 104 Z M80 40 Q100 70 104 104 L74 104 Z" fill="${hacim(koyu(r.koyu, 0.1))}"/>
    <path d="M60 10 Q83 12 85 40 L97 104 L23 104 L35 40 Q37 12 60 10 Z" fill="${hacim(r.ana)}"/>
    <path d="M60 64 L52 104 L68 104 Z" fill="${hacim(r.koyu)}"/>
    <path d="M51 104 L59.5 64 L60.5 64 L69 104" fill="none" stroke="${ALTIN}" stroke-width="1.6"/>
    <path d="M28 100 Q60 108 92 100" fill="none" stroke="${ALTIN}" stroke-width="2"/>
    <path d="M32 94 l4 -4 l4 4 l-4 4 z M84 94 l4 -4 l4 4 l-4 4 z" fill="${r.goz}" stroke-width="1"/>
    <path d="M60 8 L69 -1 L66 12 Z" fill="${hacim(r.ana)}"/>
    <path d="M60 21 Q75 23 75 42 Q73 57 60 59 Q47 57 45 42 Q45 23 60 21 Z" fill="${hacim(koyu(r.koyu, 0.3))}"/>
    ${parlakGoz(53, 41, r.goz, 2.2)}${parlakGoz(67, 41, r.goz, 2.2)}
    <path d="M47 36 L56 39 M73 36 L64 39" stroke="${r.goz}" stroke-width="1.4" opacity=".8"/>
    <path d="M39 63 L81 63 L83 72 L37 72 Z" fill="${metal(ALTIN)}"/>
    <circle cx="60" cy="67.5" r="3.4" fill="${kure(r.goz)}" stroke-width="1.2"/>
    <path d="M36 51 Q24 59 22 71 L33 72 Z" fill="${hacim(r.ana)}"/>
    <path d="M84 51 Q96 57 98 66 L92 72 L86 60 Z" fill="${hacim(r.ana)}"/>
    <path d="M94 66 Q100 58 104 62" fill="none" stroke-width="1.6"/>
    <circle cx="99" cy="61" r="8" fill="${isilti(r.goz)}" stroke="none"/>
    <path d="M99 56 Q103 60 99 66 Q95 60 99 56 Z" fill="${acik(r.goz, 0.5)}" stroke="none"/>
    <path d="M22 106 L18 26" stroke-width="5"/><path d="M22 106 L18 26" stroke="#2b2620" stroke-width="2.6"/>
    <path d="M13 30 Q10 20 18 14 Q26 20 23 30" fill="none" stroke="#2b2620" stroke-width="2.4"/>
    <circle cx="18" cy="22" r="16" fill="${isilti(r.goz)}" stroke="none"/>
    <circle cx="18" cy="22" r="7.4" fill="${kure(r.goz)}"/>
    <circle cx="18" cy="22" r="13" fill="none" stroke="${r.goz}" stroke-width="1.4" stroke-dasharray="2 4"/>
    <circle cx="27" cy="69" r="3.4" fill="${kure('#b8a7c9')}" stroke-width="1.2"/>
    ${parlak('M42 44 Q44 22 56 16', 0.3)}
    ${zerreler([[34, 12, 1.2], [96, 30, 1.4], [108, 84, 1], [10, 70, 1.2], [88, 8, 1]], r.goz)}`;
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
  // Her bölgede yolda çıkabilen insan düşman
  yankesici: [yankesiciBedeni, R('#5a4a3e', '#2e2a33', '#c9b8a0', '#d4a537')],
};

// Havada süzülen varlıklar (CSS ile hafifçe inip kalkar).
const SUZULENLER = new Set([cin, hortlak, ifrit, albasti]);

// Düşmanın SVG çizimi (HTML metni). Bosslar sihir halesiyle çizilir.
export function dusmanCizimi(anahtar, secenekler = {}) {
  const [beden, renk, bossMu] = DUSMAN_CIZIMLERI[anahtar];
  const icerik = (bossMu ? hale(renk.goz) : '') + beden(renk);
  const suzulen = SUZULENLER.has(beden) ? ' cizim-suzulen' : '';
  return svgSar(icerik, { sinif: `cizim cizim-dusman${suzulen}`, ...secenekler });
}
