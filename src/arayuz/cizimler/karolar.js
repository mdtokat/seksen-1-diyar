// İl haritasının karo çizimi (kuşbakışı). Her karo 16×16 birimdir; harita bir kez
// SVG metnine çevrilir, sonra yalnızca kamera kayar. Renk ve biçimler bölgeye göre
// değişir (plan.md Faz 6). Kırmızı çizgiler: ibadethane çizilmez.
//
// Büyük illerde (Konya 69×69 karo) bile hafif kalsın diye zemin, yol, su ve meydan
// karoları desen dolgulu tek birer yola birleştirilir; kıyı köpüğü ve yol kenarları
// da tek yoldur. Ağaç, ev ve kaya gibi yapılar sol üstten ışık alır, gölgeleri sağ
// alta düşer; ağaçlar konumlarına göre boy ve ton bakımından hafifçe değişir.
//
// Gerçekçilik için: dış çizgiler parçanın kendi renginin koyusudur (konturla); çimen
// büyük, yumuşak renk lekeleriyle (kuru ot, nemli toprak) ve ikinci bir seyrek desenle
// bezenir ki tekrar göze batmasın; su ve yolların kenarı karo karo değil, köşeleri
// yuvarlatılmış tek bir çizgiyle (bolgeKonturu) çizilir; gölgeler zeminin tonunu
// koyulaştırır ve uzun yapılarda sağ alta doğru uzar.
import { KARO } from '../../oyun/gezinti.js';
import { bolgeler, final } from '../../veri/bolgeler.js';
import { boyalariCoz, konturla, hacim, kure, metal, isilti, acik, koyu, karistir } from './ortak.js';

export const KARO_BOYU = 16;
const T = KARO_BOYU;

// agac: 'yuvarlak' | 'zeytin' | 'cam' | 'koknar' | 'karli' | 'cali'
// kaya: 'kaya' | 'peri'; ev: 'ev' | 'ahsap' | 'kumbet'; cicek: zemindeki çiçek renkleri
const PALET = {
  marmara: { zemin: '#a9c98f', benek: '#98ba7d', yol: '#e6d6ab', yabani: '#5f8a4a', agac: 'yuvarlak', agacRenk: '#3f7a4a', kaya: 'kaya', kayaRenk: '#9a958a', su: '#3b8fb0', ev: 'ev', duvar: '#f7efdc', cati: '#c9483b', cicek: ['#d9483b', '#f2c94c', '#ffffff'], panjur: '#3f7a4a' },
  ege: { zemin: '#c3cc8a', benek: '#b3bd79', yol: '#eadcb3', yabani: '#7b8a45', agac: 'zeytin', agacRenk: '#8a9a5b', kaya: 'kaya', kayaRenk: '#b0a896', su: '#3b7dc4', ev: 'ev', duvar: '#ffffff', cati: '#c9772f', cicek: ['#d9483b', '#ffffff', '#b36ae0'], panjur: '#2f6fb0' },
  akdeniz: { zemin: '#d4c386', benek: '#c6b476', yol: '#efdfb4', yabani: '#8a8a3f', agac: 'cam', agacRenk: '#3f6232', kaya: 'kaya', kayaRenk: '#b08a6a', su: '#2a8fb8', ev: 'ev', duvar: '#fbf1d8', cati: '#d9483b', cicek: ['#e07ab0', '#f08a2a', '#ffffff'], panjur: '#2a8fb8' },
  ic_anadolu: { zemin: '#dcc896', benek: '#cfb986', yol: '#ecdcb6', yabani: '#b09456', agac: 'cali', agacRenk: '#7a8a4a', kaya: 'peri', kayaRenk: '#e3c9a1', su: '#3b8fb0', ev: 'ev', duvar: '#efe0c0', cati: '#8a6a4a', cicek: ['#b36ae0', '#f2c94c', '#d9483b'], panjur: '#8a5a3a' },
  karadeniz: { zemin: '#7fae6a', benek: '#72a05e', yol: '#d9c9a0', yabani: '#3f6a3a', agac: 'koknar', agacRenk: '#2f5a3a', kaya: 'kaya', kayaRenk: '#8f958a', su: '#3b8fb0', ev: 'ahsap', duvar: '#9e6b3a', cati: '#5b3a24', cicek: ['#e07ab0', '#ffffff', '#f2c94c'], panjur: '#5b3a24' },
  guneydogu: { zemin: '#e3c58f', benek: '#d8b87e', yol: '#f0dfb8', yabani: '#a88a4a', agac: 'cali', agacRenk: '#8a8a3f', kaya: 'kaya', kayaRenk: '#b8a07a', su: '#3b8fb0', ev: 'kumbet', duvar: '#e3c9a1', cati: '#b08a5a', cicek: ['#d9483b', '#f2c94c', '#ffffff'], panjur: '#7b5236' },
  dogu_anadolu: { zemin: '#e8eef2', benek: '#d8e0e6', yol: '#d6cfc0', yabani: '#8fa39a', agac: 'karli', agacRenk: '#2f5a3a', kaya: 'kaya', kayaRenk: '#8f9fb6', su: '#3b6fa8', ev: 'ahsap', duvar: '#b08a6a', cati: '#6a4c93', cicek: ['#3b7dc4', '#ffffff', '#b36ae0'], panjur: '#5b3a24' },
};

const LACI = '#1b2a5c';
// Dış çizgi rengi dolgudan türetilir (konturla, `@k` yer tutucusu).
const CIZGI = 'stroke="@k" stroke-width="0.7" stroke-linejoin="round"';
const INCE = 'stroke="@k" stroke-width="0.5" stroke-linejoin="round"';
const GOLGE = '#231c2a';
const ALTIN_KAPI = '#d4a537';

// Konuma bağlı, her açılışta aynı kalan sözde rastgele sayı (0 ≤ n < 1).
const karma = (x, y, tohum = 0) => {
  let h = (x * 374761393 + y * 668265263 + tohum * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const s1 = (n) => +n.toFixed(1);

// Küçük bir dairenin tek yol içindeki karşılığı (birçok noktayı tek yolda toplamak için).
const daire = (cx, cy, r) => `M${s1(cx - r)} ${s1(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

// ── Desenler ────────────────────────────────────────────

function desenler(p) {
  const tutam = (x, y, renk) => `<path d="M${x} ${y} l-1.4 -3.2 M${x} ${y} l.2 -3.8 M${x} ${y} l1.6 -3" stroke="${renk}" stroke-width=".8" stroke-linecap="round" fill="none"/>`;
  const cim = [[6, 9], [22, 4], [37, 13], [13, 27], [30, 30], [44, 38], [5, 42], [24, 44]]
    .map(([x, y], i) => tutam(x, y, i % 2 ? p.benek : koyu(p.zemin, 0.12))).join('');
  const nokta = [[16, 15, 1.4], [40, 24, 1.2], [9, 34, 1.1], [33, 6, 1], [28, 19, 2.6]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${r > 2 ? acik(p.zemin, 0.12) : p.benek}"/>`).join('');
  const cakil = [[5, 6, 1.4], [20, 12, 1], [27, 25, 1.6], [10, 22, 1.1], [16, 4, .8], [3, 28, 1], [24, 2, 1.2]]
    .map(([x, y, r], i) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.75}" fill="${i % 2 ? acik(p.yol, 0.35) : koyu(p.yol, 0.18)}"/>`).join('');
  // İkinci, seyrek desen (48'in katı değil): birincinin tekrarını bozar.
  const seyrek = [[11, 7, 0], [52, 15, 1], [30, 40, 0], [64, 52, 1], [8, 61, 1], [45, 66, 0]]
    .map(([x, y, i]) => tutam(x, y, i ? koyu(p.zemin, 0.2) : acik(p.zemin, 0.2))).join('')
    + [[22, 24, 1.3], [58, 33, 0.9], [37, 58, 1.1], [70, 8, 0.8]]
      .map(([x, y, r], i) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}" fill="${i % 2 ? koyu(p.zemin, 0.22) : karistir(p.zemin, p.yol, 0.6)}"/>`).join('');
  const meydan = '#ddd3bf';
  return `
    <pattern id="@cim" width="48" height="48" patternUnits="userSpaceOnUse">
      <rect width="48" height="48" fill="${p.zemin}"/>${nokta}${cim}
    </pattern>
    <pattern id="@cim2" width="72" height="72" patternUnits="userSpaceOnUse">${seyrek}</pattern>
    <pattern id="@yol" width="32" height="32" patternUnits="userSpaceOnUse">
      <rect width="32" height="32" fill="${p.yol}"/>
      <path d="M0 9 q8 -2 16 0 t16 0 M0 25 q8 2 16 0 t16 0" fill="none" stroke="${koyu(p.yol, 0.08)}" stroke-width="2.4" opacity=".6"/>
      ${cakil}
    </pattern>
    <pattern id="@su" width="56" height="56" patternUnits="userSpaceOnUse">
      <rect width="56" height="56" fill="${koyu(p.su, 0.14)}"/>
      <path d="M14 27 q2.5 1.4 5 0 M40 14 q2.5 1.4 5 0 M48 46 q2 1.2 4 0 M2 50 q2 1.2 4 0" fill="none" stroke="${koyu(p.su, 0.3)}" stroke-width=".7" stroke-linecap="round" opacity=".5"/>
      <circle cx="38" cy="8" r=".7" fill="#fff" opacity=".75"/><circle cx="16" cy="40" r=".55" fill="#fff" opacity=".6"/><circle cx="50" cy="24" r=".5" fill="#fff" opacity=".6"/>
    </pattern>
    <pattern id="@dalga" width="56" height="56" patternUnits="userSpaceOnUse">
      <path d="M4 9 q3 -1.6 6 0 q3 1.6 6 0 M31 5 q2.5 -1.4 5 0 M22 21 q3 -1.6 6 0 q3 1.6 6 0 M44 30 q2.5 -1.4 5 0 q2.5 1.4 5 0 M7 37 q3 -1.6 6 0 M27 47 q3 -1.6 6 0 q3 1.6 6 0" fill="none" stroke="${acik(p.su, 0.4)}" stroke-width=".7" stroke-linecap="round" opacity=".7"/>
      <circle cx="20" cy="30" r=".5" fill="#fff" opacity=".7"/><circle cx="46" cy="40" r=".5" fill="#fff" opacity=".6"/>
    </pattern>
    <pattern id="@meydan" width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="${meydan}"/>
      <rect x=".5" y=".5" width="7" height="7" rx="1" fill="${acik(meydan, 0.25)}"/>
      <rect x="8.5" y="8.5" width="7" height="7" rx="1" fill="${acik(meydan, 0.25)}"/>
      <rect x="8.5" y=".5" width="7" height="7" rx="1" fill="${koyu(meydan, 0.04)}"/>
      <rect x=".5" y="8.5" width="7" height="7" rx="1" fill="${koyu(meydan, 0.04)}"/>
      <path d="M0 8 h16 M8 0 v16" stroke="#c4b89e" stroke-width=".6"/>
    </pattern>`;
}

// ── Doğa ────────────────────────────────────────────────

// Gölge: yapının dibinde koyu bir temas gölgesi. `boy` verilirse (yapının yüksekliği)
// ışığın tersine, sağ alta doğru uzanan yumuşak kenarlı bir düşen gölge de eklenir.
const golge = (cx, cy, rx, ry = rx * 0.38, boy = 0) => {
  const temas = `<ellipse cx="${s1(cx)}" cy="${s1(cy)}" rx="${s1(rx)}" ry="${s1(ry)}" fill="${GOLGE}" opacity=".24"/>`;
  if (!boy) return temas;
  const gx = s1(cx + boy * 0.42);
  const gy = s1(cy + boy * 0.08);
  return `<ellipse cx="${gx}" cy="${gy}" rx="${s1(rx * 0.7 + boy * 0.42)}" ry="${s1(ry * 1.15)}" transform="rotate(22 ${gx} ${gy})" fill="${isilti(GOLGE)}" opacity=".36"/>${temas}`;
};

function agac(p, x, y) {
  const cx = x + T / 2;
  const alt = y + T - 2;
  const o = 1.12 + karma(x, y, 1) * 0.3; // boy farkı (ağaçlar yiğitten uzundur)
  const renk = karma(x, y, 2) < 0.5 ? p.agacRenk : karistirAgac(p.agacRenk, karma(x, y, 3));
  const sar = (ic) => `<g transform="translate(${cx} ${alt}) scale(${s1(o * 100) / 100})">${ic}</g>`;
  const govde = (h = 6, r = '#6e5b45') => `<path d="M-1.2 0 L-1 ${-h} L1 ${-h} L1.2 0 Z" fill="${r}" ${INCE}/>`;
  switch (p.agac) {
    case 'cam':
      return golge(cx + 1, alt, 5, 2, 21 * o) + sar(`${govde(6)}
        <path d="M0 -21 L7 -9 L4.5 -9 L8.5 -3 L-8.5 -3 L-4.5 -9 L-7 -9 Z" fill="${hacim(renk)}" ${CIZGI}/>
        <path d="M0 -21 L7 -9 L4.5 -9 L8.5 -3 L0 -3 Z" fill="${koyu(renk, 0.25)}" opacity=".6"/>
        <path d="M-2 -15 L0 -19" stroke="#fff" stroke-width=".8" opacity=".35"/>`);
    case 'koknar':
    case 'karli': {
      const kar = p.agac === 'karli'
        ? `<path d="M0 -23 L3.2 -17.5 L-3.2 -17.5 Z M-4 -13 L4 -13 L6 -10 L-6 -10 Z M-5.5 -7 L5.5 -7 L7.5 -4.5 L-7.5 -4.5 Z" fill="#fff"/>`
        : '';
      return golge(cx + 1, alt, 5, 2, 23 * o) + sar(`${govde(4, '#5b3a24')}
        <path d="M0 -23 L5 -14 L3 -14 L6.5 -8 L4.5 -8 L8 -2.5 L-8 -2.5 L-4.5 -8 L-6.5 -8 L-3 -14 L-5 -14 Z" fill="${hacim(renk)}" ${CIZGI}/>
        <path d="M0 -23 L5 -14 L3 -14 L6.5 -8 L4.5 -8 L8 -2.5 L0 -2.5 Z" fill="${koyu(renk, 0.3)}" opacity=".55"/>${kar}`);
    }
    case 'cali':
      return golge(cx + 1, alt, 6, 2.2, 10 * o) + sar(`
        <circle cx="-3.2" cy="-5" r="4.4" fill="${hacim(renk)}" ${CIZGI}/>
        <circle cx="3.4" cy="-4.2" r="4.2" fill="${hacim(koyu(renk, 0.1))}" ${CIZGI}/>
        <circle cx="0" cy="-8" r="4" fill="${hacim(renk)}" ${CIZGI}/>
        <circle cx="-1.5" cy="-9.4" r="1.4" fill="#fff" opacity=".22"/>
        ${karma(x, y, 4) < 0.4 ? `<circle cx="-4" cy="-4" r=".9" fill="#d9483b"/><circle cx="3" cy="-6" r=".9" fill="#d9483b"/>` : ''}`);
    case 'zeytin':
      return golge(cx + 1, alt, 5, 2, 18 * o) + sar(`
        <path d="M-1.5 0 Q-2 -4 -0.5 -7 Q-2.5 -9 -3 -10 L-1 -10 Q0 -8.5 1 -9.5 L2 -9.5 Q1 -7 1.5 0 Z" fill="#6e5b45" ${INCE}/>
        <ellipse cx="0" cy="-13" rx="8.6" ry="6.2" fill="${hacim(renk)}" ${CIZGI}/>
        <ellipse cx="-3.5" cy="-15" rx="3.6" ry="2.4" fill="${acik(renk, 0.3)}" opacity=".7"/>
        <circle cx="-3.5" cy="-11.5" r="1" fill="#3f4a2a"/><circle cx="3" cy="-12.5" r="1" fill="#3f4a2a"/><circle cx="0" cy="-9.8" r=".9" fill="#3f4a2a"/>`);
    default:
      return golge(cx + 1, alt, 5, 2, 20 * o) + sar(`${govde(7)}
        <circle cx="-3.4" cy="-10" r="5" fill="${hacim(koyu(renk, 0.08))}" ${CIZGI}/>
        <circle cx="3.6" cy="-10.5" r="5" fill="${hacim(koyu(renk, 0.12))}" ${CIZGI}/>
        <circle cx="0" cy="-14.5" r="6" fill="${hacim(renk)}" ${CIZGI}/>
        <circle cx="-2" cy="-16.5" r="2.4" fill="#fff" opacity=".2"/>
        ${karma(x, y, 5) < 0.12 ? '<circle cx="2.5" cy="-12" r="1" fill="#d9483b"/><circle cx="-3" cy="-9.5" r="1" fill="#d9483b"/>' : ''}`);
  }
}

// Ağaç rengine hafif ton farkı: kimi daha sarımsı, kimi daha koyu.
function karistirAgac(renk, n) {
  return n < 0.5 ? koyu(renk, 0.12) : acik(renk, 0.1);
}

function kaya(p, x, y) {
  const cx = x + T / 2;
  if (p.kaya === 'peri') {
    return `${golge(cx + 1.5, y + T - 1, 5.5, 2, 18)}
      <path d="M${cx - 5} ${y + T - 1} Q${cx - 4} ${y + 4} ${cx - 2} ${y - 2} L${cx + 2} ${y - 2} Q${cx + 4} ${y + 4} ${cx + 5} ${y + T - 1} Z" fill="${hacim(p.kayaRenk)}" ${CIZGI}/>
      <path d="M${cx + 1} ${y - 2} Q${cx + 3.5} ${y + 5} ${cx + 5} ${y + T - 1} L${cx + 2} ${y + T - 1} Z" fill="${koyu(p.kayaRenk, 0.2)}" opacity=".6"/>
      <path d="M${cx - 1.4} ${y + 9} v-2.4 q1.4 -2 2.8 0 v2.4 z" fill="#6e4a34"/>
      <path d="M${cx - 3.8} ${y - 2} Q${cx} ${y - 7.5} ${cx + 3.8} ${y - 2} Z" fill="${hacim('#8a6a4a')}" ${CIZGI}/>`;
  }
  const k = karma(x, y, 6) < 0.5;
  const d = k
    ? `M${x + 2} ${y + T - 2} L${x + 2.5} ${y + 7} L${x + 7} ${y + 3} L${x + 12} ${y + 5} L${x + 14.5} ${y + T - 2} Z`
    : `M${x + 1.5} ${y + T - 2} L${x + 3} ${y + 8} L${x + 6} ${y + 5} L${x + 10} ${y + 4} L${x + 13.5} ${y + 8} L${x + 14.5} ${y + T - 2} Z`;
  const ust = k
    ? `M${x + 2.5} ${y + 7} L${x + 7} ${y + 3} L${x + 12} ${y + 5} L${x + 8} ${y + 8} Z`
    : `M${x + 3} ${y + 8} L${x + 6} ${y + 5} L${x + 10} ${y + 4} L${x + 13.5} ${y + 8} L${x + 8} ${y + 9.5} Z`;
  return `${golge(x + 9, y + T - 1.5, 7, 2.4, 8)}
    <path d="${d}" fill="${hacim(p.kayaRenk)}" ${CIZGI}/>
    <path d="${ust}" fill="${acik(p.kayaRenk, 0.35)}"/>
    <path d="M${x + 8} ${y + 9} L${x + 14.5} ${y + T - 2} L${x + 9} ${y + T - 2} Z" fill="${koyu(p.kayaRenk, 0.25)}" opacity=".55"/>
    <path d="M${x + 7} ${y + 9} l-1 3 l1.5 2" fill="none" stroke="${LACI}" stroke-width=".5" opacity=".5"/>`;
}

// Ev: 2×2 karo kaplar, (x, y) sol üst karonun köşesidir. Kuşbakışına yakın 3/4
// görünüş: önde güneye bakan cephe, üstte çatının dört yüzü (kuzey yüzü ve batı
// kırması ışık alır, doğu kırması gölgededir). Bacanın ağzı `baca` olarak döner ki
// dumanı orada tütsün. Döner: { cizim, baca } (baca yoksa null).
function ev(p, x, y) {
  const E = 2 * T; // evin eni ve derinliği
  const yer = y + E - 1; // ön cephenin zemine değdiği çizgi
  const pencere = (wx, wy, w = 4.2, h = 5.2) => `
    <rect x="${wx - 1.4}" y="${wy}" width="1.4" height="${h}" fill="${hacim(p.panjur)}" ${INCE}/>
    <rect x="${wx + w}" y="${wy}" width="1.4" height="${h}" fill="${hacim(p.panjur)}" ${INCE}/>
    <rect x="${wx}" y="${wy}" width="${w}" height="${h}" fill="${hacim('#2f3d4f')}" ${INCE}/>
    <path d="M${wx + w / 2} ${wy} v${h} M${wx} ${wy + h / 2} h${w}" stroke="${acik(p.duvar, 0.2)}" stroke-width=".5"/>
    <path d="M${wx + 0.6} ${wy + 0.8} l1.4 1.6" stroke="#fff" stroke-width=".5" opacity=".6"/>
    <rect x="${wx - 0.6}" y="${wy + h}" width="${w + 1.2}" height="1" fill="${acik(p.duvar, 0.3)}" ${INCE}/>`;
  if (p.ev === 'kumbet') {
    // Harran'ın kerpiç kümbet evleri: yan yana iki külah kubbe, aralarında alçak bir duvar.
    const kubbe = (cx, ust, kapi) => `
      <path d="M${cx - 7} ${yer} L${cx - 7} ${ust + 15} Q${cx - 7} ${ust + 3} ${cx} ${ust} Q${cx + 7} ${ust + 3} ${cx + 7} ${ust + 15} L${cx + 7} ${yer} Z" fill="${hacim(p.duvar)}" ${CIZGI}/>
      <path d="M${cx + 1} ${ust + 0.4} Q${cx + 7} ${ust + 3} ${cx + 7} ${ust + 15} L${cx + 7} ${yer} L${cx + 3.5} ${yer} Q${cx + 5} ${ust + 10} ${cx + 1} ${ust + 0.4} Z" fill="${koyu(p.duvar, 0.18)}" opacity=".6"/>
      <path d="M${cx - 6.6} ${ust + 16} Q${cx} ${ust + 14.4} ${cx + 6.6} ${ust + 16} M${cx - 5.6} ${ust + 10} Q${cx} ${ust + 8.6} ${cx + 5.6} ${ust + 10} M${cx - 3.6} ${ust + 5} Q${cx} ${ust + 4} ${cx + 3.6} ${ust + 5}" fill="none" stroke="${koyu(p.duvar, 0.22)}" stroke-width=".6"/>
      <circle cx="${cx}" cy="${ust + 0.6}" r="1.3" fill="${hacim(koyu(p.duvar, 0.1))}" ${INCE}/>
      ${kapi ? `<path d="M${cx - 2.4} ${yer} L${cx - 2.4} ${yer - 7} Q${cx} ${yer - 9.6} ${cx + 2.4} ${yer - 7} L${cx + 2.4} ${yer} Z" fill="${hacim('#5b3a24')}" ${INCE}/>`
    : `<rect x="${cx - 1.2}" y="${yer - 12}" width="2.4" height="2.8" rx="1" fill="#3a2516"/>`}`;
    return {
      cizim: `${golge(x + 17, yer, 15, 3, 24)}
        <rect x="${x + 8}" y="${yer - 6}" width="16" height="6" fill="${hacim(koyu(p.duvar, 0.05))}" ${CIZGI}/>
        ${kubbe(x + 9, y + 3, true)}${kubbe(x + 23, y + 6, false)}`,
      baca: null,
    };
  }
  if (p.ev === 'ahsap') {
    // Karadeniz ve Doğu Anadolu: taş temel üstünde ahşap ev, sırtı cepheye koşut beşik çatı.
    const karli = p.agac === 'karli';
    const tahta = [16, 18.5, 21].map((dy) => `M${x + 3} ${y + dy}h26`).join('');
    const kar = karli
      ? `<path d="M${x - 0.5} ${y - 5} h33 v8 h-33 Z" fill="${hacim('#f4f8fb')}"/>
         <path d="M${x - 0.5} ${y + 3} h33 v2.6 q-3 2 -6 .4 q-4 2.2 -8 .2 q-4 2 -8 0 q-3 1.8 -6 .2 q-3 1.6 -5 0 Z" fill="#f4f8fb"/>
         <path d="M${x - 0.5} ${y + 14} h33 v1.6 h-33 Z" fill="#f4f8fb"/>`
      : '';
    return {
      cizim: `${golge(x + 17, yer, 16, 3, 24)}
        <rect x="${x + 2.5}" y="${y + 24}" width="27" height="7" fill="${hacim('#9a958a')}" ${CIZGI}/>
        <path d="M${x + 2.5} ${y + 27.5} h27 M${x + 9} ${y + 24} v3.5 M${x + 17} ${y + 24} v3.5 M${x + 25} ${y + 24} v3.5 M${x + 6} ${y + 27.5} v3.5 M${x + 13} ${y + 27.5} v3.5 M${x + 21} ${y + 27.5} v3.5" stroke="${koyu('#9a958a', 0.3)}" stroke-width=".5"/>
        <rect x="${x + 3}" y="${y + 13.5}" width="26" height="10.5" fill="${hacim(p.duvar)}" ${CIZGI}/>
        <path d="${tahta}" stroke="${koyu(p.duvar, 0.3)}" stroke-width=".5"/>
        <rect x="${x + 3}" y="${y + 13.5}" width="26" height="2.4" fill="${GOLGE}" opacity=".25"/>
        ${pencere(x + 6.5, y + 16.4, 4, 4.6)}${pencere(x + 21.5, y + 16.4, 4, 4.6)}
        <rect x="${x + 14}" y="${y + 18}" width="4.6" height="${yer - y - 18}" fill="${hacim('#4a2e1c')}" ${INCE}/>
        <circle cx="${x + 17.6}" cy="${y + 25}" r=".5" fill="${ALTIN_KAPI}"/>
        <rect x="${x + 6.5}" y="${y - 9}" width="4" height="9" fill="${hacim('#8f8a80')}" ${CIZGI}/>
        <rect x="${x + 6}" y="${y - 10}" width="5" height="1.6" fill="${hacim('#6e6a62')}" ${INCE}/>
        <path d="M${x - 0.5} ${y - 5} L${x + 32.5} ${y - 5} L${x + 32.5} ${y + 3} L${x - 0.5} ${y + 3} Z" fill="${hacim(acik(p.cati, 0.12))}" ${CIZGI}/>
        <path d="M${x - 0.5} ${y + 3} L${x + 32.5} ${y + 3} L${x + 32.5} ${y + 14.5} L${x - 0.5} ${y + 14.5} Z" fill="${hacim(p.cati)}" ${CIZGI}/>
        <path d="M${x - 0.5} ${y - 1} h33 M${x - 0.5} ${y + 7} h33 M${x - 0.5} ${y + 11} h33" stroke="${koyu(p.cati, 0.3)}" stroke-width=".5"/>
        <path d="M${x - 0.5} ${y + 3} h33" stroke="${koyu(p.cati, 0.45)}" stroke-width="1"/>
        <rect x="${x + 26}" y="${y + 3}" width="6.5" height="11.5" fill="${koyu(p.cati, 0.3)}" opacity=".35"/>
        ${kar}`,
      baca: [x + 8.5, y - 10],
    };
  }
  // Marmara, Ege, Akdeniz, İç Anadolu: sıvalı ya da badanalı ev, kiremit kırma çatı.
  const sira = (yy, sol, sag) => `M${s1(sol)} ${yy} L${s1(sag)} ${yy}`;
  // Ön yüzün sol/sağ kenarı (sırt 4 → saçak 16.5 arasında)
  const onSol = (yy) => x + 11 - (10.5 * (yy - (y + 4))) / 12.5;
  const onSag = (yy) => x + 21 + (10.5 * (yy - (y + 4))) / 12.5;
  return {
    cizim: `${golge(x + 17, yer, 16, 3, 26)}
      <rect x="${x + 3}" y="${y + 14}" width="26" height="${yer - y - 14}" fill="${hacim(p.duvar)}" ${CIZGI}/>
      <rect x="${x + 3}" y="${yer - 2.6}" width="26" height="2.6" fill="${hacim('#a8a296')}" ${INCE}/>
      <rect x="${x + 3}" y="${y + 14}" width="26" height="3" fill="${GOLGE}" opacity=".22"/>
      ${pencere(x + 6.4, y + 19)}${pencere(x + 21.4, y + 19)}
      <path d="M${x + 13.5} ${yer} L${x + 13.5} ${y + 22.5} Q${x + 16} ${y + 19.5} ${x + 18.5} ${y + 22.5} L${x + 18.5} ${yer} Z" fill="${hacim('#6e4a2a')}" ${INCE}/>
      <path d="M${x + 16} ${y + 21} v${yer - y - 21}" stroke="${koyu('#6e4a2a', 0.35)}" stroke-width=".5"/>
      <rect x="${x + 12.5}" y="${yer - 0.8}" width="7" height="1.6" fill="${hacim('#a8a296')}" ${INCE}/>
      <rect x="${x + 22.5}" y="${y - 7}" width="3.6" height="8" fill="${hacim(koyu(p.duvar, 0.06))}" ${CIZGI}/>
      <rect x="${x + 22}" y="${y - 8}" width="4.6" height="1.6" fill="${hacim(p.cati)}" ${INCE}/>
      <path d="M${x + 0.5} ${y - 5} L${x + 31.5} ${y - 5} L${x + 21} ${y + 4} L${x + 11} ${y + 4} Z" fill="${hacim(acik(p.cati, 0.16))}" ${CIZGI}/>
      <path d="M${x + 11} ${y + 4} L${x + 21} ${y + 4} L${x + 31.5} ${y + 16.5} L${x + 0.5} ${y + 16.5} Z" fill="${hacim(p.cati)}" ${CIZGI}/>
      <path d="M${x + 0.5} ${y - 5} L${x + 11} ${y + 4} L${x + 0.5} ${y + 16.5} Z" fill="${hacim(acik(p.cati, 0.28))}" ${CIZGI}/>
      <path d="M${x + 31.5} ${y - 5} L${x + 21} ${y + 4} L${x + 31.5} ${y + 16.5} Z" fill="${hacim(koyu(p.cati, 0.28))}" ${CIZGI}/>
      <path d="${sira(y + 8, onSol(y + 8), onSag(y + 8))}${sira(y + 12, onSol(y + 12), onSag(y + 12))}${sira(y - 1, x + 5.2, x + 26.8)}" stroke="${koyu(p.cati, 0.3)}" stroke-width=".6"/>
      <path d="M${x + 11} ${y + 4} h10" stroke="${koyu(p.cati, 0.4)}" stroke-width="1.1"/>
      <path d="M${x + 2.5} ${y + 15.5} h27" stroke="${acik(p.cati, 0.35)}" stroke-width=".6" opacity=".7"/>`,
    baca: [x + 24.3, y - 8],
  };
}

// Uzun otlar: iki tonlu tutamlar, arada bir çiçek.
function yabani(p, x, y) {
  const tutam = (tx, ty, renk) => `<path d="M${tx} ${ty} q-1 -2 -2.4 -4.4 M${tx} ${ty} q.2 -3 0 -5.6 M${tx} ${ty} q1 -2 2.6 -4.2" stroke="${renk}" stroke-width="1.2" stroke-linecap="round" fill="none"/>`;
  const cicek = karma(x, y, 7) < 0.3 ? `<circle cx="${x + 11.5}" cy="${y + 4.5}" r="1.2" fill="${p.cicek[0]}"/>` : '';
  const k = (t) => s1(karma(x, y, t) * 3 - 1.5);
  return tutam(x + 4 + k(13), y + 7, p.yabani) + tutam(x + 11 + k(14), y + 10 + k(15), koyu(p.yabani, 0.2))
    + tutam(x + 6 + k(16), y + 14.5, p.yabani) + cicek;
}

// ── Meydan yapıları ─────────────────────────────────────

// Çeşme: mermer cephe, kemerli niş, lüleden akan su ve turkuaz yalak.
function cesme(x, y) {
  return `${golge(x + 10, y + 15.5, 8, 2)}
    <rect x="${x + 1}" y="${y + 1}" width="14" height="14" rx="1" fill="${hacim('#efe8da')}" ${CIZGI}/>
    <path d="M${x + 0.5} ${y + 1} h15 v1.6 h-15 z" fill="${metal('#d8cdb6')}" ${INCE}/>
    <path d="M${x + 4} ${y + 12} L${x + 4} ${y + 6.5} Q${x + 8} ${y + 1.5} ${x + 12} ${y + 6.5} L${x + 12} ${y + 12} Z" fill="${hacim('#2aa7a7')}" ${CIZGI}/>
    <path d="M${x + 5.5} ${y + 7} Q${x + 8} ${y + 4} ${x + 10.5} ${y + 7}" fill="none" stroke="#f7efdc" stroke-width=".6"/>
    <circle cx="${x + 8}" cy="${y + 8}" r=".9" fill="${metal('#d4a537')}"/>
    <path d="M${x + 8} ${y + 8.6} L${x + 8} ${y + 12}" stroke="#cfeef6" stroke-width="1"/>
    <path class="akan-su" d="M${x + 8} ${y + 8.6} L${x + 8} ${y + 12}" stroke="#fff" stroke-width=".7" stroke-dasharray=".8 1.2" opacity=".9"/>
    <ellipse class="su-halkasi" cx="${x + 8}" cy="${y + 12.6}" rx="1.6" ry=".6" fill="none" stroke="#fff" stroke-width=".4"/>
    <rect x="${x + 2.5}" y="${y + 11.5}" width="11" height="3.2" rx=".8" fill="${hacim('#3b8fb0')}" ${CIZGI}/>
    <path d="M${x + 4} ${y + 12.6} h8" stroke="#cfeef6" stroke-width=".6"/>`;
}

// Arasta tezgâhı: çizgili tente, ahşap tezgâh, meyve sepetleri.
function tezgah(x, y) {
  const serit = [0, 1, 2, 3].map((i) =>
    `<path d="M${x + 1 + i * 3.5} ${y} h3.5 v4 q-1.75 1.6 -3.5 0 z" fill="${i % 2 ? '#f7efdc' : '#d9483b'}"/>`).join('');
  return `${golge(x + 10, y + 15.5, 8, 2)}
    <path d="M${x + 2.5} ${y + 4} v11 M${x + 13.5} ${y + 4} v11" stroke="#5b3a24" stroke-width="1"/>
    <rect x="${x + 1.5}" y="${y + 9}" width="13" height="6" fill="${hacim('#9e6b3a')}" ${CIZGI}/>
    <path d="M${x + 1.5} ${y + 11.5} h13" stroke="#6e4a2a" stroke-width=".5"/>
    <ellipse cx="${x + 5.5}" cy="${y + 9}" rx="3" ry="1.4" fill="#c98f3a" ${INCE}/><ellipse cx="${x + 10.5}" cy="${y + 9}" rx="3" ry="1.4" fill="#c98f3a" ${INCE}/>
    <circle cx="${x + 4.6}" cy="${y + 7.8}" r="1.3" fill="${kure('#d4a537')}"/><circle cx="${x + 6.4}" cy="${y + 7.6}" r="1.3" fill="${kure('#e08a3a')}"/>
    <circle cx="${x + 9.6}" cy="${y + 7.8}" r="1.3" fill="${kure('#d9483b')}"/><circle cx="${x + 11.4}" cy="${y + 7.6}" r="1.3" fill="${kure('#7aa83a')}"/>
    ${serit}<path d="M${x + 1} ${y} h14 v4" fill="none" ${CIZGI}/>
    <path d="M${x + 0.5} ${y - 0.5} h15" stroke="#5b3a24" stroke-width="1.2"/>`;
}

function tabela(x, y) {
  return `${golge(x + 9.5, y + 15.5, 5, 1.6)}
    <rect x="${x + 7}" y="${y + 6}" width="2" height="10" fill="${hacim('#5b3a24')}" ${INCE}/>
    <rect x="${x + 1}" y="${y + 1}" width="14" height="8" rx="1.5" fill="${hacim('#d4a537')}" ${CIZGI}/>
    <rect x="${x + 2.2}" y="${y + 2.2}" width="11.6" height="5.6" rx="1" fill="none" stroke="#9e7a2a" stroke-width=".5"/>
    <path d="M${x + 4} ${y + 4} h8 M${x + 4} ${y + 6} h6" stroke="${LACI}" stroke-width=".8"/>`;
}

// Ahi dükkânı: tabelalı, tenteli, önünde örs olan küçük bir dükkân.
function dukkan(x, y) {
  return `${golge(x + 10, y + 15.5, 9, 2.4)}
    <rect x="${x + 1}" y="${y + 3}" width="14" height="12" fill="${hacim('#b08a6a')}" ${CIZGI}/>
    <path d="M${x + 1} ${y + 6.5} h14 M${x + 1} ${y + 10} h14" stroke="${koyu('#b08a6a', 0.25)}" stroke-width=".4"/>
    <path d="M${x - 1} ${y + 4} L${x + 8} ${y - 3} L${x + 17} ${y + 4} Z" fill="${hacim('#7b5236')}" ${CIZGI}/>
    <rect x="${x + 3}" y="${y + 1}" width="10" height="4" rx="1" fill="${hacim('#d4a537')}" ${CIZGI}/>
    <path d="M${x + 5.5} ${y + 3} l2 -1 l2 1 l2 -1" fill="none" stroke="${LACI}" stroke-width=".6"/>
    <rect x="${x + 5.5}" y="${y + 8.5}" width="4.5" height="6.5" fill="#3a2516" ${INCE}/>
    <circle class="ocak" cx="${x + 7.75}" cy="${y + 11}" r="2.4" fill="${isilti('#f08a2a')}"/>
    <path d="M${x + 10.5} ${y + 12} h4.5 l-1 1.6 h-.8 v1.4 h-1 v-1.4 h-.8 Z" fill="${metal('#6b7280')}" ${INCE}/>`;
}

// Kervansaray: taş duvarlı, mazgallı, turkuaz kemerli taçkapılı han.
function kervansaray(x, y) {
  return `${golge(x + 10, y + 16, 12, 2.6)}
    <rect x="${x - 2}" y="${y + 1}" width="20" height="14" fill="${hacim('#d8c29a')}" ${CIZGI}/>
    <path d="M${x - 2} ${y + 5.5} h20 M${x - 2} ${y + 10} h20" stroke="#b39a6e" stroke-width=".4"/>
    <path d="M${x - 2} ${y + 1} h20" stroke="#b39a6e" stroke-width="2"/>
    <path d="M${x - 2} ${y - 1} h3 v2 h2 v-2 h3 v2 h2 v-2 h3 v2 h2 v-2 h3 v2" fill="none" stroke="${LACI}" stroke-width=".8"/>
    <rect x="${x + 2.5}" y="${y - 1}" width="11" height="16" fill="${hacim('#e3d0a8')}" ${CIZGI}/>
    <path d="M${x + 4} ${y + 15} L${x + 4} ${y + 8.5} Q${x + 8} ${y + 3.5} ${x + 12} ${y + 8.5} L${x + 12} ${y + 15} Z" fill="#3a2516" ${CIZGI}/>
    <path d="M${x + 4.5} ${y + 8.5} Q${x + 8} ${y + 4.5} ${x + 11.5} ${y + 8.5}" fill="none" stroke="#2aa7a7" stroke-width="1.3"/>
    <path d="M${x + 4} ${y + 2} h8" stroke="#2aa7a7" stroke-width="1" stroke-dasharray="1 1"/>
    <rect x="${x - 0.5}" y="${y + 5}" width="2" height="3" rx="1" fill="#2b2620"/><rect x="${x + 14.5}" y="${y + 5}" width="2" height="3" rx="1" fill="#2b2620"/>
    ${[x + 2.6, x + 13.4].map((mx) => `<path d="M${mx} ${y + 13} v-3.4" stroke="#5b3a24" stroke-width=".8"/>
      <circle class="mesale" cx="${mx}" cy="${y + 8.6}" r="3.4" fill="${isilti('#f5a623')}"/>
      <path class="alev" d="M${mx - 0.8} ${y + 9.8} q-.2 -1.6 .8 -2.8 q1 1.2 .8 2.8 z" fill="#ffd36b"/>`).join('')}`;
}

// Görev verenler (Faz 9): stilize, edepli, sade figürler.
// Muhtar: lacivert ceket, kasket, ak bıyık ve baston.
function muhtarCizimi(x, y) {
  const cx = x + T / 2;
  return `${golge(cx + 1.5, y + T - 1, 5.5, 1.8)}
    <path d="M${cx + 6} ${y + T - 1} L${cx + 6} ${y + 6}" stroke="#5b3a24" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M${cx - 5} ${y + T - 1} L${cx - 4} ${y + 5} Q${cx} ${y + 3} ${cx + 4} ${y + 5} L${cx + 5} ${y + T - 1} Z" fill="${hacim('#2a3d7a')}" ${CIZGI}/>
    <path d="M${cx - 1.6} ${y + 4.4} L${cx} ${y + 9} L${cx + 1.6} ${y + 4.4} Z" fill="#f7efdc"/>
    <path d="M${cx - 2.5} ${y + 10} h1.2 M${cx + 1.3} ${y + 10} h1.2" stroke="#d4a537" stroke-width=".8"/>
    <path d="M${cx + 4} ${y + 8} L${cx + 6} ${y + 7}" stroke="#e9b98f" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${y + 1.5}" r="3.2" fill="${kure('#e9b98f')}" ${CIZGI}/>
    <path d="M${cx - 3.6} ${y + 0.8} Q${cx - 0.5} ${y - 3.8} ${cx + 3.4} ${y + 0.4} L${cx + 5} ${y + 0.9} Z" fill="${hacim('#6e5b45')}" ${CIZGI}/>
    <path d="M${cx - 1.8} ${y + 2.9} q1.8 1 3.6 0" stroke="#f7efdc" stroke-width="1.1" fill="none"/>`;
}

// Ahi Baba: kahve cübbe, krem peştamal, keçe külah ve ak sakal.
function ahiBabaCizimi(x, y) {
  const cx = x + T / 2;
  return `${golge(cx + 1.5, y + T - 1, 5.5, 1.8)}
    <path d="M${cx - 5.5} ${y + T - 1} L${cx - 4} ${y + 5} Q${cx} ${y + 3} ${cx + 4} ${y + 5} L${cx + 5.5} ${y + T - 1} Z" fill="${hacim('#7b5236')}" ${CIZGI}/>
    <path d="M${cx - 3.5} ${y + 8} L${cx + 3.5} ${y + 8} L${cx + 4} ${y + T - 2} L${cx - 4} ${y + T - 2} Z" fill="${hacim('#f7efdc')}" ${CIZGI}/>
    <path d="M${cx - 4} ${y + 8} L${cx + 4} ${y + 8}" stroke="#d4a537" stroke-width="1.4"/>
    <circle cx="${cx}" cy="${y + 1.5}" r="3.2" fill="${kure('#e9b98f')}" ${CIZGI}/>
    <path d="M${cx - 2.8} ${y + 2.4} Q${cx} ${y + 7.5} ${cx + 2.8} ${y + 2.4} Z" fill="#f7efdc" ${CIZGI}/>
    <path d="M${cx - 3} ${y} L${cx - 2} ${y - 5} Q${cx} ${y - 6} ${cx + 2} ${y - 5} L${cx + 3} ${y} Z" fill="${hacim('#b39a6e')}" ${CIZGI}/>`;
}

// Boss ya da mini bossun beklediği in: yerde parlayan bir sihir çemberi ve onu
// çevreleyen dikili taşlar.
function inCizimi(p, x, y) {
  const cx = x + T / 2;
  const cy = y + T / 2;
  const taslar = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    const tx = cx + Math.cos(a) * 20;
    const ty = cy + Math.sin(a) * 14;
    return `${golge(tx + 2, ty + 3, 3, 1.2)}<path d="M${s1(tx - 2)} ${s1(ty + 3)} L${s1(tx - 1.5)} ${s1(ty - 4)} L${s1(tx + 1.5)} ${s1(ty - 5)} L${s1(tx + 2)} ${s1(ty + 3)} Z" fill="${hacim(p.kayaRenk)}" ${CIZGI}/>
      <path d="M${s1(tx - 0.6)} ${s1(ty - 2)} l1 1 l-1 1" fill="none" stroke="#b36ae0" stroke-width=".7"/>`;
  }).join('');
  return `<ellipse cx="${cx}" cy="${cy + 2}" rx="22" ry="16" fill="${isilti('#6a4c93')}" opacity=".55"/>
    <ellipse cx="${cx}" cy="${cy + 2}" rx="17" ry="11" fill="none" stroke="#6a4c93" stroke-width="1" stroke-dasharray="3 3" opacity=".8"/>
    <ellipse cx="${cx}" cy="${cy + 2}" rx="12" ry="7.5" fill="none" stroke="#b36ae0" stroke-width=".6" opacity=".6"/>${taslar}`;
}

// Zülmet'in Ağrı Dağı'ndaki kalesi (Faz 10): karanlık taş surlar, iki kule, mor
// sancaklar, ışıklı mazgallar ve kemerli kapı. Zülmet kapının önünde bekler.
function kaleCizimi(x, y) {
  const cx = x + T / 2;
  const tas = '#5d5870';
  const koyuTas = '#3a3550';
  const burc = (bx) => `<rect x="${bx}" y="${y - 30}" width="12" height="40" fill="${hacim(tas)}" ${CIZGI}/>
    <rect x="${bx + 8}" y="${y - 30}" width="4" height="40" fill="${koyuTas}" opacity=".5"/>
    <path d="M${bx} ${y - 30} v-4 h3 v4 h3 v-4 h3 v4 h3 v-4" fill="none" stroke="${LACI}" stroke-width=".8"/>
    <rect x="${bx + 4}" y="${y - 20}" width="4" height="6" rx="2" fill="#f2c94c"/>
    <circle class="mesale" cx="${bx + 6}" cy="${y - 17}" r="5" fill="${isilti('#f2c94c')}"/>
    <path d="M${bx + 6} ${y - 34} v-12 l9 3 l-9 3" fill="#6a4c93" stroke="${LACI}" stroke-width=".6"/>`;
  return `<ellipse cx="${cx + 3}" cy="${y + T + 2}" rx="36" ry="7" fill="${LACI}" opacity=".22"/>
    <rect x="${cx - 26}" y="${y - 18}" width="52" height="30" fill="${hacim(tas)}" ${CIZGI}/>
    <path d="M${cx - 26} ${y - 18} v-4 h4 v4 h4 v-4 h4 v4 h4 v-4 h4 v4 h4 v-4 h4 v4 h4 v-4 h4 v4 h4 v-4 h4 v4 h4 v-4 h4 v4" fill="none" stroke="${LACI}" stroke-width=".8"/>
    <path d="M${cx - 26} ${y - 6} h52 M${cx - 26} ${y + 4} h52 M${cx - 16} ${y - 18} v12 M${cx + 6} ${y - 6} v10 M${cx - 4} ${y + 4} v8 M${cx + 16} ${y - 18} v12" stroke="${koyuTas}" stroke-width=".6" opacity=".7"/>
    ${burc(cx - 36)}${burc(cx + 24)}
    <circle cx="${cx}" cy="${y + 4}" r="14" fill="${isilti('#b36ae0')}"/>
    <path d="M${cx - 8} ${y + 12} v-12 q8 -10 16 0 v12 z" fill="#1b1330" ${CIZGI}/>
    <path d="M${cx - 6} ${y + 1} q6 -8 12 0" fill="none" stroke="#b36ae0" stroke-width="1" opacity=".8"/>`;
}

// ── Bölge konturu ───────────────────────────────────────

// `uye(x, y)` karolarının birleşiminin sınırını köşeleri yuvarlatılmış yollar olarak
// çizer (su birikintileri, yol ağı). Önce her üye karonun üye olmayan komşuya bakan
// kenarları saat yönünde toplanır, uç uca eklenip kapalı halkalara dönüştürülür; düz
// giden kenarlar tek bir kenara indirgenir ve her köşe en çok `R` birimlik bir eğriyle
// yuvarlatılır. Böylece çizgi karo karo basamaklı değil, doğal ve akışkan görünür.
// `pay` 1 ise haritanın bir karo dışı da taranır (kenara değen yollar dışarı taşar).
export function bolgeKonturu(uye, G, Y, { R = 6.5, pay = 0 } = {}) {
  const ici = (x, y) => x >= -pay && y >= -pay && x < G + pay && y < Y + pay && uye(x, y);
  const cikan = new Map(); // "x,y" köşesinden çıkan kenarlar
  const ekle = (ax, ay, bx, by) => {
    const a = `${ax},${ay}`;
    if (!cikan.has(a)) cikan.set(a, []);
    cikan.get(a).push({ ax, ay, bx, by, dx: bx - ax, dy: by - ay, kullanildi: false });
  };
  for (let y = -pay; y < Y + pay; y++) {
    for (let x = -pay; x < G + pay; x++) {
      if (!ici(x, y)) continue;
      if (!ici(x, y - 1)) ekle(x, y, x + 1, y);
      if (!ici(x + 1, y)) ekle(x + 1, y, x + 1, y + 1);
      if (!ici(x, y + 1)) ekle(x + 1, y + 1, x, y + 1);
      if (!ici(x - 1, y)) ekle(x, y + 1, x, y);
    }
  }
  const yollar = [];
  for (const liste of cikan.values()) {
    for (const ilk of liste) {
      if (ilk.kullanildi) continue;
      // Halkayı izle; çapraz değen karolarda sağa dönen kenar seçilir (karolar ayrı kalır).
      const koseler = [];
      let k = ilk;
      while (k && !k.kullanildi) {
        k.kullanildi = true;
        koseler.push([k.ax, k.ay, k.dx, k.dy]);
        const secenek = (cikan.get(`${k.bx},${k.by}`) ?? []).filter((e) => !e.kullanildi);
        k = secenek.find((e) => e.dx === -k.dy && e.dy === k.dx) ?? secenek[0];
      }
      // Yön değiştirmeyen köşeleri at: yalnız gerçek köşeler kalır.
      const n = koseler.length;
      const nokta = koseler
        .filter(([, , dx, dy], i) => { const o = koseler[(i - 1 + n) % n]; return o[2] !== dx || o[3] !== dy; })
        .map(([x, y]) => [x * T, y * T]);
      const m = nokta.length;
      if (m < 3) continue;
      const parca = nokta.map((c, i) => {
        const once = nokta[(i - 1 + m) % m];
        const sonra = nokta[(i + 1) % m];
        const lo = Math.hypot(once[0] - c[0], once[1] - c[1]);
        const ls = Math.hypot(sonra[0] - c[0], sonra[1] - c[1]);
        const r = Math.min(R, lo / 2, ls / 2);
        const a = [c[0] + ((once[0] - c[0]) / lo) * r, c[1] + ((once[1] - c[1]) / lo) * r];
        const b = [c[0] + ((sonra[0] - c[0]) / ls) * r, c[1] + ((sonra[1] - c[1]) / ls) * r];
        return { a, c, b };
      });
      const yaz = ([x, y]) => `${s1(x)} ${s1(y)}`;
      yollar.push(`M${yaz(parca[0].a)}${parca.map((q, i) => `${i ? `L${yaz(q.a)}` : ''}Q${yaz(q.c)} ${yaz(q.b)}`).join('')}Z`);
    }
  }
  return yollar.join('');
}

// ── Katmanlar ───────────────────────────────────────────

// Ev karolarının sol üst köşeleri: harita üretimi 2×2 evleri `harita.evler` olarak verir;
// verilmemişse karolar satır satır taranır (ilk rastlanan ev karosu bir evin sol üstüdür).
export function evleriBul(harita) {
  if (harita.evler) return harita.evler;
  const { genislik: G, yukseklik: Y, karolar } = harita;
  const alinan = new Set();
  const evler = [];
  for (let y = 0; y < Y; y++) {
    for (let x = 0; x < G; x++) {
      if (karolar[y * G + x] !== KARO.EV || alinan.has(y * G + x)) continue;
      evler.push({ x, y });
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) alinan.add((y + dy) * G + x + dx);
    }
  }
  return evler;
}

// Haritanın sabit katmanı — yalnız SVG içeriği (geriye dönük; testler ve önizleme için).
export function haritaKatmani(harita) {
  return haritaKatmanlari(harita).alt;
}

// Haritanın iki katmanı:
//   alt: zemin, yol, su, meydan ve bütün yapılar (figürlerin altında).
//   ust: uzun yapıların (ağaç, ev, meydan binaları) kendi taban satırının üstünde kalan
//        kısmı; figürlerin üstüne çizilir. Böylece yiğit bir ağacın ya da evin arkasına
//        geçtiğinde onun ardında kalır. İki katman aynı çizimi `<use>` ile paylaşır.
//   nesneler: üst katmandaki yapıların kutuları (karo birimiyle) — kimin ardında
//        kalındığını bulmak ve yakındaki ağaçları rüzgârda sallamak için.
//   bacalar: dumanı tüten bacaların ağızları (karo birimiyle).
export function haritaKatmanlari(harita) {
  const p = PALET[harita.bolge];
  const { genislik: G, yukseklik: Y } = harita;
  const karo = (x, y) => (x < 0 || y < 0 || x >= G || y >= Y ? null : harita.karolar[y * G + x]);
  const YOLSU = new Set([KARO.YOL, KARO.KAPI]);
  const MEYDANLIK = new Set([KARO.MEYDAN, KARO.DUKKAN, KARO.KERVANSARAY, KARO.CESME, KARO.TEZGAH, KARO.TABELA, KARO.MUHTAR, KARO.AHI_BABA]);
  const meydanlar = [];
  const lekeler = new Map(); // renk → yumuşak leke daireleri
  const ciceklar = p.cicek.map(() => []);
  const parcalar = [];
  const ustler = []; // ağaç, kaya, ev gibi karonun üstüne taşan çizimler: { sira, cizim }
  const tanimlar = []; // üst katmanla paylaşılan uzun yapıların çizimleri
  const nesneler = [];
  const bacalar = [];
  // Yapıyı ekler. `taban`: yapının zemine değdiği satır (çizim sırası ona göre: arkadaki
  // önce). `uzun` verilirse yapı üst katmana da girer: { x0, x1, ust } birim cinsinden kutu.
  const yapiEkle = (cizim, x, taban, uzun = null) => {
    const sira = taban * G + x;
    if (!uzun) return ustler.push({ sira, cizim });
    const n = nesneler.length;
    tanimlar.push(`<g id="@n${n}">${cizim}</g>`);
    const gecikme = s1(-karma(x, taban, 30) * 4);
    ustler.push({ sira, cizim: `<use href="#@n${n}" data-n="${n}"${uzun.agac ? ` class="agac" style="animation-delay:${gecikme}s"` : ''}/>` });
    nesneler.push({ n, agac: Boolean(uzun.agac), x, y: taban, x0: uzun.x0 / T, x1: uzun.x1 / T, ust: uzun.ust / T, cizgi: taban });
  };
  const kare = (px, py) => `M${px} ${py}h${T}v${T}h${-T}z`;
  for (let y = 0; y < Y; y++) {
    for (let x = 0; x < G; x++) {
      const t = karo(x, y);
      const px = x * T;
      const py = y * T;
      if (MEYDANLIK.has(t)) {
        meydanlar.push(kare(px, py));
      } else if (t === KARO.CIM) {
        if (karma(x, y, 8) < 0.07) {
          const i = Math.floor(karma(x, y, 9) * ciceklar.length);
          const cx = px + 3 + karma(x, y, 10) * 10;
          const cy = py + 3 + karma(x, y, 11) * 10;
          ciceklar[i].push(daire(cx, cy, 1.1), daire(cx + 3, cy + 1.6, 0.9));
        }
      } else if (t === KARO.YABANI) {
        parcalar.push(yabani(p, px, py));
      }
      const meydanYapisi = { x0: px - 2, x1: px + T + 2, ust: py - 10 };
      if (t === KARO.AGAC) yapiEkle(agac(p, px, py), x, y, p.agac === 'cali' ? null : { x0: px - 5, x1: px + T + 5, ust: py - 18, agac: true });
      else if (t === KARO.KAYA) yapiEkle(kaya(p, px, py), x, y, p.kaya === 'peri' ? { x0: px, x1: px + T, ust: py - 8 } : null);
      else if (t === KARO.CESME) yapiEkle(cesme(px, py), x, y);
      else if (t === KARO.TEZGAH) yapiEkle(tezgah(px, py), x, y);
      else if (t === KARO.TABELA) yapiEkle(tabela(px, py), x, y);
      else if (t === KARO.DUKKAN) yapiEkle(dukkan(px, py), x, y, meydanYapisi);
      else if (t === KARO.KERVANSARAY) yapiEkle(kervansaray(px, py), x, y, meydanYapisi);
      else if (t === KARO.MUHTAR) yapiEkle(muhtarCizimi(px, py), x, y, meydanYapisi);
      else if (t === KARO.AHI_BABA) yapiEkle(ahiBabaCizimi(px, py), x, y, meydanYapisi);
    }
  }
  for (const e of evleriBul(harita)) {
    const px = e.x * T;
    const py = e.y * T;
    const { cizim, baca } = ev(p, px, py);
    yapiEkle(cizim, e.x, e.y + 1, { x0: px - 1, x1: px + 2 * T + 1, ust: py - 10 });
    if (baca) bacalar.push({ x: baca[0] / T, y: baca[1] / T });
  }
  ustler.sort((a, b) => a.sira - b.sira);
  // Zeminin büyük ölçekli renk değişimi: üç karoluk ızgarada yumuşak kenarlı lekeler
  // (açık ve koyu çimen, kuru ot, toprak). Tek desenin tekrarını gözden saklar.
  const lekeRenkleri = [acik(p.zemin, 0.2), koyu(p.zemin, 0.16), karistir(p.zemin, '#c9a65e', 0.45), karistir(p.zemin, p.yol, 0.65)];
  for (let gy = 0; gy < Y; gy += 3) {
    for (let gx = 0; gx < G; gx += 3) {
      if (karma(gx, gy, 20) < 0.35) continue;
      const n = karma(gx, gy, 21);
      const renk = lekeRenkleri[n < 0.38 ? 0 : n < 0.76 ? 1 : n < 0.92 ? 2 : 3];
      const r = 22 + karma(gx, gy, 22) * 30;
      const cx = (gx + karma(gx, gy, 23) * 3) * T;
      const cy = (gy + karma(gx, gy, 24) * 3) * T;
      if (!lekeler.has(renk)) lekeler.set(renk, []);
      lekeler.get(renk).push(`<ellipse cx="${s1(cx)}" cy="${s1(cy)}" rx="${s1(r)}" ry="${s1(r * (0.6 + karma(gx, gy, 25) * 0.4))}"/>`);
    }
  }
  // Su ve yol: köşeleri yuvarlatılmış kontur. Suyun kıyıya yakın yeri açık (sığ),
  // ortası koyudur (derin): kıyı çizgisinin suya düşen yarısı üst üste incelen
  // saydam şeritlerle boyanır. Yol ağı meydanla birleşik çizilir ki
  // yol meydana yumuşak bir ağızla açılsın; meydanın taşları üstüne döşenir.
  const su = bolgeKonturu((x, y) => karo(x, y) === KARO.SU, G, Y, { R: 7 });
  const yolUye = (x, y) => {
    const t = karo(Math.max(0, Math.min(G - 1, x)), Math.max(0, Math.min(Y - 1, y)));
    return YOLSU.has(t) || MEYDANLIK.has(t);
  };
  const yol = bolgeKonturu(yolUye, G, Y, { R: 6, pay: 1 });
  const kum = karistir(p.zemin, p.yol, 0.55);
  const zemin = [
    `<rect width="${G * T}" height="${Y * T}" fill="url(#@cim)"/>`,
    [...lekeler].map(([renk, l]) => `<g fill="${isilti(renk)}" opacity=".7">${l.join('')}</g>`).join(''),
    `<rect width="${G * T}" height="${Y * T}" fill="url(#@cim2)"/>`,
    ciceklar.map((d, i) => (d.length ? `<path d="${d.join('')}" fill="${p.cicek[i]}"/>` : '')).join(''),
    su ? `<clipPath id="@suKes"><path d="${su}"/></clipPath>
      <path d="${su}" fill="${kum}" stroke="${kum}" stroke-width="7" stroke-linejoin="round" opacity=".9"/>
      <path d="${su}" fill="none" stroke="${koyu(kum, 0.35)}" stroke-width="3.2" stroke-linejoin="round" opacity=".7"/>
      <path d="${su}" fill="url(#@su)"/>
      <g clip-path="url(#@suKes)"><path class="dalga" d="${su}" fill="url(#@dalga)" stroke="url(#@dalga)" stroke-width="12"/></g>
      <g clip-path="url(#@suKes)" fill="none" stroke-linejoin="round">
        ${[30, 25, 20, 16, 12, 9, 6, 3.5].map((g) => `<path d="${su}" stroke="${acik(p.su, 0.3)}" stroke-width="${g}" opacity=".16"/>`).join('')}
        <path d="${su}" stroke="#f4fbfd" stroke-width="1.6" opacity=".8"/>
      </g>` : '',
    yol ? `<path d="${yol}" fill="none" stroke="${koyu(p.zemin, 0.3)}" stroke-width="2.8" stroke-linejoin="round" opacity=".4"/>
      <path d="${yol}" fill="url(#@yol)"/>
      <path d="${yol}" fill="none" stroke="${koyu(p.yol, 0.12)}" stroke-width="1" stroke-linejoin="round" opacity=".5"/>` : '',
    meydanlar.length ? `<path d="${meydanlar.join('')}" fill="url(#@meydan)"/>` : '',
  ];
  // Meydanın çini kenarı: lacivert ve turkuaz çift şerit, köşelerde altın baklava.
  const m = harita.meydan;
  const mx = m.x1 * T;
  const my = m.y1 * T;
  const mg = (m.x2 - m.x1 + 1) * T;
  const myk = (m.y2 - m.y1 + 1) * T;
  const baklava = [[mx, my], [mx + mg, my], [mx, my + myk], [mx + mg, my + myk]]
    .map(([bx, by]) => `<path d="M${bx} ${by - 3.5} l3.5 3.5 l-3.5 3.5 l-3.5 -3.5 z" fill="${metal('#d4a537')}" ${INCE}/>`).join('');
  zemin.push(`<rect x="${mx}" y="${my}" width="${mg}" height="${myk}" fill="none" stroke="${LACI}" stroke-width="3" opacity=".55"/>
    <rect x="${mx}" y="${my}" width="${mg}" height="${myk}" fill="none" stroke="#2aa7a7" stroke-width="1.6"/>
    <rect x="${mx}" y="${my}" width="${mg}" height="${myk}" fill="none" stroke="#f7efdc" stroke-width=".6" stroke-dasharray="2 4"/>${baklava}`);
  const bolge = bolgeler.find((b) => b.anahtar === harita.bolge);
  if (harita.in && harita.plaka === final.il) {
    ustler.push({ sira: Infinity, cizim: kaleCizimi(harita.in.x * T, (harita.in.y - 1) * T) });
  } else if (harita.in && (bolge.bossIli === harita.plaka || bolge.miniBossIlleri.includes(harita.plaka))) {
    parcalar.push(inCizimi(p, harita.in.x * T, harita.in.y * T));
  }
  // Üst katman: her uzun yapı, taban satırının üst kenarından yukarısı kırpılarak bir daha
  // çizilir (aynı satırdakiler aynı kırpmayı paylaşır).
  const satirlar = [...new Set(nesneler.map((o) => o.cizgi))];
  const kirpmalar = satirlar.map((r) => `<clipPath id="@s${r}"><rect x="${-2 * T}" y="${-4 * T}" width="${(G + 4) * T}" height="${(r + 4) * T}"/></clipPath>`).join('');
  const ust = `<defs>${kirpmalar}</defs>${nesneler.map((o) => `<use href="#@n${o.n}" data-n="${o.n}" clip-path="url(#@s${o.cizgi})"${
    o.agac ? ` class="agac" style="animation-delay:${s1(-karma(o.x, o.y, 30) * 4)}s"` : ''}/>`).join('')}`;
  const onEk = `c${(++katmanSayaci).toString(36)}h-`;
  const c = boyalariCoz(konturla(`<defs>${tanimlar.join('')}</defs>${desenler(p)}${zemin.join('')}${parcalar.join('')}${ustler.map((u) => u.cizim).join('')}`), onEk);
  const u = boyalariCoz(ust, onEk);
  return { alt: `<defs>${c.tanimlar}</defs>${c.icerik}`, ust: u.icerik, nesneler, bacalar };
}

let katmanSayaci = 0;

// Çıkış yolları: kapı taşları ve komşu ilin adı. Kilitli bölgeye giden yol sihirli bir
// engelle kapalı çizilir. `acikMi(plaka)` → yol açık mı.
export function kapiKatmani(harita, adlar, acikMi) {
  const { genislik: GENISLIK, yukseklik: YUKSEKLIK } = harita;
  const tasCiz = (x, y, g, h) => `<rect x="${x}" y="${y}" width="${g}" height="${h}" rx="1" fill="#a8a296" ${CIZGI}/>
    <rect x="${x}" y="${y}" width="${g}" height="${Math.min(g, h) * 0.4}" rx="1" fill="#cfc9bc"/>`;
  return harita.kapilar.map((k) => {
    const px = k.x * T;
    const py = k.y * T;
    const acik = acikMi(k.plaka);
    const yatay = k.y === 0 || k.y === YUKSEKLIK - 1;
    const tas = yatay
      ? tasCiz(px - 3, py + 2, 4, 12) + tasCiz(px + T - 1, py + 2, 4, 12)
      : tasCiz(px + 2, py - 3, 12, 4) + tasCiz(px + 2, py + T - 1, 12, 4);
    const engel = acik
      ? ''
      : `<rect x="${px + 1}" y="${py + 1}" width="${T - 2}" height="${T - 2}" rx="3" fill="#6a4c93" opacity=".75" class="sihirli-engel"/>
         <path d="M${px + 4} ${py + 4} l8 8 M${px + 12} ${py + 4} l-8 8" stroke="#e3d0ff" stroke-width="1.4"/>`;
    // Ad etiketi, çıkışın içeri doğru iki karo ötesinde
    const lx = k.x === 0 ? T + 2 : k.x === GENISLIK - 1 ? (GENISLIK - 1) * T - 2 : (k.ix + (k.ix - k.x)) * T + T / 2;
    const ly = (k.iy + (k.iy - k.y)) * T + T / 2 + 3;
    const hiza = k.x === 0 ? 'start' : k.x === GENISLIK - 1 ? 'end' : 'middle';
    return konturla(`<g class="kapi${acik ? '' : ' kilitli'}">${tas}${engel}
      <text x="${lx}" y="${ly}" class="kapi-adi" text-anchor="${hiza}">${adlar[k.plaka]}</text></g>`);
  }).join('');
}
