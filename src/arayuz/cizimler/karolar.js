// İl haritasının karo çizimi (kuşbakışı). Her karo 16×16 birimdir; harita bir kez
// SVG metnine çevrilir, sonra yalnızca kamera kayar. Renk ve biçimler bölgeye göre
// değişir (plan.md Faz 6). Kırmızı çizgiler: ibadethane çizilmez.
import { GENISLIK, YUKSEKLIK, KARO } from '../../oyun/gezinti.js';
import { bolgeler, final } from '../../veri/bolgeler.js';

export const KARO_BOYU = 16;
const T = KARO_BOYU;

// agac: 'yuvarlak' | 'zeytin' | 'cam' | 'koknar' | 'karli' | 'calı'
// kaya: 'kaya' | 'peri'; ev: 'ev' | 'ahsap' | 'kumbet'
const PALET = {
  marmara: { zemin: '#a9c98f', benek: '#98ba7d', yol: '#e6d6ab', yabani: '#5f8a4a', agac: 'yuvarlak', agacRenk: '#3f7a4a', kaya: 'kaya', kayaRenk: '#9a958a', su: '#3b8fb0', ev: 'ev', duvar: '#f7efdc', cati: '#c9483b' },
  ege: { zemin: '#c3cc8a', benek: '#b3bd79', yol: '#eadcb3', yabani: '#7b8a45', agac: 'zeytin', agacRenk: '#8a9a5b', kaya: 'kaya', kayaRenk: '#b0a896', su: '#3b7dc4', ev: 'ev', duvar: '#ffffff', cati: '#c9772f' },
  akdeniz: { zemin: '#d4c386', benek: '#c6b476', yol: '#efdfb4', yabani: '#8a8a3f', agac: 'cam', agacRenk: '#3f6232', kaya: 'kaya', kayaRenk: '#b08a6a', su: '#2a8fb8', ev: 'ev', duvar: '#fbf1d8', cati: '#d9483b' },
  ic_anadolu: { zemin: '#dcc896', benek: '#cfb986', yol: '#ecdcb6', yabani: '#b09456', agac: 'cali', agacRenk: '#7a8a4a', kaya: 'peri', kayaRenk: '#e3c9a1', su: '#3b8fb0', ev: 'ev', duvar: '#efe0c0', cati: '#8a6a4a' },
  karadeniz: { zemin: '#7fae6a', benek: '#72a05e', yol: '#d9c9a0', yabani: '#3f6a3a', agac: 'koknar', agacRenk: '#2f5a3a', kaya: 'kaya', kayaRenk: '#8f958a', su: '#3b8fb0', ev: 'ahsap', duvar: '#9e6b3a', cati: '#5b3a24' },
  guneydogu: { zemin: '#e3c58f', benek: '#d8b87e', yol: '#f0dfb8', yabani: '#a88a4a', agac: 'cali', agacRenk: '#8a8a3f', kaya: 'kaya', kayaRenk: '#b8a07a', su: '#3b8fb0', ev: 'kumbet', duvar: '#e3c9a1', cati: '#b08a5a' },
  dogu_anadolu: { zemin: '#e8eef2', benek: '#d8e0e6', yol: '#d6cfc0', yabani: '#8fa39a', agac: 'karli', agacRenk: '#2f5a3a', kaya: 'kaya', kayaRenk: '#8f9fb6', su: '#3b6fa8', ev: 'ahsap', duvar: '#b08a6a', cati: '#6a4c93' },
};

const CIZGI = 'stroke="#1b2a5c" stroke-width="0.8" stroke-linejoin="round"';

function agac(p, x, y) {
  const cx = x + T / 2;
  const alt = y + T - 2;
  const golge = `<ellipse cx="${cx}" cy="${alt}" rx="6" ry="2" fill="#000" opacity=".18"/>`;
  switch (p.agac) {
    case 'cam':
      return `${golge}<rect x="${cx - 1}" y="${alt - 5}" width="2" height="5" fill="#6e5b45"/>
        <path d="M${cx} ${y - 5} L${cx + 7} ${alt - 4} L${cx - 7} ${alt - 4} Z" fill="${p.agacRenk}" ${CIZGI}/>`;
    case 'koknar':
    case 'karli': {
      const kar = p.agac === 'karli'
        ? `<path d="M${cx} ${y - 6} L${cx + 3} ${y - 1} L${cx - 3} ${y - 1} Z" fill="#fff"/>`
        : '';
      return `${golge}<rect x="${cx - 1}" y="${alt - 4}" width="2" height="4" fill="#5b3a24"/>
        <path d="M${cx} ${y - 6} L${cx + 5} ${y + 3} L${cx + 3} ${y + 3} L${cx + 7} ${alt - 3} L${cx - 7} ${alt - 3} L${cx - 3} ${y + 3} L${cx - 5} ${y + 3} Z" fill="${p.agacRenk}" ${CIZGI}/>${kar}`;
    }
    case 'cali':
      return `${golge}<circle cx="${cx - 3}" cy="${alt - 5}" r="4" fill="${p.agacRenk}" ${CIZGI}/>
        <circle cx="${cx + 3}" cy="${alt - 4}" r="4" fill="${p.agacRenk}" ${CIZGI}/>`;
    case 'zeytin':
      return `${golge}<path d="M${cx - 1} ${alt} L${cx - 1} ${alt - 6} L${cx + 1} ${alt - 6} L${cx + 1} ${alt} Z" fill="#6e5b45"/>
        <ellipse cx="${cx}" cy="${y + 4}" rx="8" ry="6" fill="${p.agacRenk}" ${CIZGI}/>
        <circle cx="${cx - 3}" cy="${y + 3}" r="1" fill="#3f4a2a"/><circle cx="${cx + 3}" cy="${y + 5}" r="1" fill="#3f4a2a"/>`;
    default:
      return `${golge}<rect x="${cx - 1}" y="${alt - 6}" width="2" height="6" fill="#6e5b45"/>
        <circle cx="${cx}" cy="${y + 4}" r="7.5" fill="${p.agacRenk}" ${CIZGI}/>
        <circle cx="${cx - 2}" cy="${y + 2}" r="2.5" fill="#fff" opacity=".15"/>`;
  }
}

function kaya(p, x, y) {
  const cx = x + T / 2;
  if (p.kaya === 'peri') {
    return `<ellipse cx="${cx}" cy="${y + T - 1}" rx="6" ry="2" fill="#000" opacity=".15"/>
      <path d="M${cx - 5} ${y + T - 1} Q${cx - 4} ${y + 4} ${cx - 2} ${y - 2} L${cx + 2} ${y - 2} Q${cx + 4} ${y + 4} ${cx + 5} ${y + T - 1} Z" fill="${p.kayaRenk}" ${CIZGI}/>
      <path d="M${cx - 3.5} ${y - 2} Q${cx} ${y - 7} ${cx + 3.5} ${y - 2} Z" fill="#8a6a4a" ${CIZGI}/>`;
  }
  return `<path d="M${x + 2} ${y + T - 2} L${x + 3} ${y + 6} L${x + 8} ${y + 3} L${x + 13} ${y + 6} L${x + 14} ${y + T - 2} Z" fill="${p.kayaRenk}" ${CIZGI}/>
    <path d="M${x + 8} ${y + 3} L${x + 7} ${y + 9}" stroke="#1b2a5c" stroke-width=".5" opacity=".5"/>`;
}

function ev(p, x, y) {
  if (p.ev === 'kumbet') {
    return `<path d="M${x + 2} ${y + T - 1} L${x + 2} ${y + 8} Q${x + 2} ${y - 2} ${x + 8} ${y - 4} Q${x + 14} ${y - 2} ${x + 14} ${y + 8} L${x + 14} ${y + T - 1} Z" fill="${p.duvar}" ${CIZGI}/>
      <path d="M${x + 6} ${y + T - 1} L${x + 6} ${y + 10} Q${x + 8} ${y + 8} ${x + 10} ${y + 10} L${x + 10} ${y + T - 1} Z" fill="#6e4a34"/>`;
  }
  return `<rect x="${x + 2}" y="${y + 5}" width="12" height="${T - 6}" fill="${p.duvar}" ${CIZGI}/>
    <path d="M${x} ${y + 6} L${x + 8} ${y - 2} L${x + 16} ${y + 6} Z" fill="${p.cati}" ${CIZGI}/>
    <rect x="${x + 7}" y="${y + 10}" width="3" height="5" fill="#5b3a24"/>
    <rect x="${x + 3.5}" y="${y + 8}" width="2.5" height="2.5" fill="#9fd9f4" ${CIZGI}/>`;
}

function yabani(p, x, y) {
  const tutam = (tx, ty) => `<path d="M${tx} ${ty} l-2 -4 M${tx} ${ty} l0 -5 M${tx} ${ty} l2 -4" stroke="${p.yabani}" stroke-width="1.2" stroke-linecap="round"/>`;
  return tutam(x + 4, y + 7) + tutam(x + 11, y + 10) + tutam(x + 6, y + 14);
}

function cesme(x, y) {
  return `<rect x="${x + 1}" y="${y + 1}" width="14" height="14" rx="1" fill="#e8e1d2" ${CIZGI}/>
    <path d="M${x + 4} ${y + 13} L${x + 4} ${y + 6} Q${x + 8} ${y + 1} ${x + 12} ${y + 6} L${x + 12} ${y + 13} Z" fill="#b8c2cc" ${CIZGI}/>
    <rect x="${x + 3}" y="${y + 12}" width="10" height="3" fill="#3b8fb0" ${CIZGI}/>
    <path d="M${x + 8} ${y + 8} L${x + 8} ${y + 12}" stroke="#9fd9f4" stroke-width="1.2"/>`;
}

function tezgah(x, y) {
  const serit = [0, 1, 2, 3].map((i) =>
    `<rect x="${x + 1 + i * 3.5}" y="${y}" width="3.5" height="5" fill="${i % 2 ? '#f7efdc' : '#d9483b'}"/>`).join('');
  return `<rect x="${x + 2}" y="${y + 5}" width="12" height="10" fill="#9e6b3a" ${CIZGI}/>
    ${serit}<rect x="${x + 1}" y="${y}" width="14" height="5" fill="none" ${CIZGI}/>
    <circle cx="${x + 6}" cy="${y + 9}" r="2" fill="#d4a537"/><circle cx="${x + 10}" cy="${y + 9}" r="2" fill="#e08a3a"/>`;
}

function tabela(x, y) {
  return `<rect x="${x + 7}" y="${y + 6}" width="2" height="10" fill="#5b3a24"/>
    <rect x="${x + 1}" y="${y + 1}" width="14" height="8" rx="1.5" fill="#d4a537" ${CIZGI}/>
    <path d="M${x + 4} ${y + 4} h8 M${x + 4} ${y + 6.5} h6" stroke="#1b2a5c" stroke-width=".8"/>`;
}

// Ahi dükkânı: tabelalı, önünde örs olan küçük bir dükkân.
function dukkan(x, y) {
  return `<rect x="${x + 1}" y="${y + 3}" width="14" height="12" fill="#b08a6a" ${CIZGI}/>
    <path d="M${x - 1} ${y + 4} L${x + 8} ${y - 3} L${x + 17} ${y + 4} Z" fill="#7b5236" ${CIZGI}/>
    <rect x="${x + 3}" y="${y + 1}" width="10" height="4" rx="1" fill="#d4a537" ${CIZGI}/>
    <path d="M${x + 5.5} ${y + 3} l2 -1 l2 1 l2 -1" fill="none" stroke="#1b2a5c" stroke-width=".6"/>
    <rect x="${x + 6}" y="${y + 9}" width="4" height="6" fill="#5b3a24"/>
    <path d="M${x + 11} ${y + 12} h4 l-1 2 h-2 Z" fill="#6b7280" ${CIZGI}/>`;
}

// Kervansaray: taş duvarlı, kemerli kapılı han.
function kervansaray(x, y) {
  return `<rect x="${x - 2}" y="${y + 1}" width="20" height="14" fill="#d8c29a" ${CIZGI}/>
    <path d="M${x - 2} ${y + 1} h20" stroke="#b39a6e" stroke-width="2"/>
    <path d="M${x - 2} ${y - 1} h3 v2 h2 v-2 h3 v2 h2 v-2 h3 v2 h2 v-2 h3 v2" fill="none" stroke="#1b2a5c" stroke-width=".8"/>
    <path d="M${x + 4} ${y + 15} L${x + 4} ${y + 9} Q${x + 8} ${y + 4} ${x + 12} ${y + 9} L${x + 12} ${y + 15} Z" fill="#5b3a24" ${CIZGI}/>
    <path d="M${x + 4.5} ${y + 9} Q${x + 8} ${y + 5} ${x + 11.5} ${y + 9}" fill="none" stroke="#2aa7a7" stroke-width="1.2"/>
    <rect x="${x}" y="${y + 5}" width="2.5" height="3" fill="#2b2620"/><rect x="${x + 13.5}" y="${y + 5}" width="2.5" height="3" fill="#2b2620"/>`;
}

// Görev verenler (Faz 9): stilize, edepli, sade figürler.
// Muhtar: lacivert ceket, kasket, ak bıyık ve baston.
function muhtarCizimi(x, y) {
  const cx = x + T / 2;
  return `<ellipse cx="${cx}" cy="${y + T - 1}" rx="5.5" ry="1.8" fill="#000" opacity=".18"/>
    <path d="M${cx + 6} ${y + T - 1} L${cx + 6} ${y + 6}" stroke="#5b3a24" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M${cx - 5} ${y + T - 1} L${cx - 4} ${y + 5} Q${cx} ${y + 3} ${cx + 4} ${y + 5} L${cx + 5} ${y + T - 1} Z" fill="#1b2a5c" ${CIZGI}/>
    <path d="M${cx - 1.6} ${y + 4.4} L${cx} ${y + 9} L${cx + 1.6} ${y + 4.4} Z" fill="#f7efdc"/>
    <path d="M${cx + 4} ${y + 8} L${cx + 6} ${y + 7}" stroke="#e9b98f" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${y + 1.5}" r="3.2" fill="#e9b98f" ${CIZGI}/>
    <path d="M${cx - 3.6} ${y + 0.8} Q${cx - 0.5} ${y - 3.8} ${cx + 3.4} ${y + 0.4} L${cx + 5} ${y + 0.9} Z" fill="#6e5b45" ${CIZGI}/>
    <path d="M${cx - 1.8} ${y + 2.9} q1.8 1 3.6 0" stroke="#f7efdc" stroke-width="1.1" fill="none"/>`;
}

// Ahi Baba: kahve cübbe, krem peştamal, keçe külah ve ak sakal.
function ahiBabaCizimi(x, y) {
  const cx = x + T / 2;
  return `<ellipse cx="${cx}" cy="${y + T - 1}" rx="5.5" ry="1.8" fill="#000" opacity=".18"/>
    <path d="M${cx - 5.5} ${y + T - 1} L${cx - 4} ${y + 5} Q${cx} ${y + 3} ${cx + 4} ${y + 5} L${cx + 5.5} ${y + T - 1} Z" fill="#7b5236" ${CIZGI}/>
    <path d="M${cx - 3.5} ${y + 8} L${cx + 3.5} ${y + 8} L${cx + 4} ${y + T - 2} L${cx - 4} ${y + T - 2} Z" fill="#f7efdc" ${CIZGI}/>
    <path d="M${cx - 4} ${y + 8} L${cx + 4} ${y + 8}" stroke="#d4a537" stroke-width="1.4"/>
    <circle cx="${cx}" cy="${y + 1.5}" r="3.2" fill="#e9b98f" ${CIZGI}/>
    <path d="M${cx - 2.8} ${y + 2.4} Q${cx} ${y + 7.5} ${cx + 2.8} ${y + 2.4} Z" fill="#f7efdc" ${CIZGI}/>
    <path d="M${cx - 3} ${y} L${cx - 2} ${y - 5} Q${cx} ${y - 6} ${cx + 2} ${y - 5} L${cx + 3} ${y} Z" fill="#b39a6e" ${CIZGI}/>`;
}

// Boss ya da mini bossun beklediği in: dikili taşlardan bir halka.
function inCizimi(p, x, y) {
  const cx = x + T / 2;
  const cy = y + T / 2;
  const taslar = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    const tx = cx + Math.cos(a) * 20;
    const ty = cy + Math.sin(a) * 14;
    return `<path d="M${(tx - 2).toFixed(1)} ${(ty + 3).toFixed(1)} L${(tx - 1.5).toFixed(1)} ${(ty - 4).toFixed(1)} L${(tx + 1.5).toFixed(1)} ${(ty - 5).toFixed(1)} L${(tx + 2).toFixed(1)} ${(ty + 3).toFixed(1)} Z" fill="${p.kayaRenk}" ${CIZGI}/>`;
  }).join('');
  return `<ellipse cx="${cx}" cy="${cy + 2}" rx="21" ry="15" fill="#1b2a5c" opacity=".12"/>
    <ellipse cx="${cx}" cy="${cy + 2}" rx="17" ry="11" fill="none" stroke="#6a4c93" stroke-width="1" stroke-dasharray="3 3" opacity=".7"/>${taslar}`;
}

// Zülmet'in Ağrı Dağı'ndaki kalesi (Faz 10): karanlık taş surlar, iki kule, mor
// sancaklar ve kemerli kapı. Zülmet kapının önünde bekler.
function kaleCizimi(x, y) {
  const cx = x + T / 2;
  const tas = '#5d5870';
  const koyu = '#3a3550';
  const burc = (bx) => `<rect x="${bx}" y="${y - 30}" width="12" height="40" fill="${tas}" ${CIZGI}/>
    <path d="M${bx} ${y - 30} v-4 h3 v4 h3 v-4 h3 v4 h3 v-4" fill="none" stroke="#1b2a5c" stroke-width=".8"/>
    <rect x="${bx + 4}" y="${y - 20}" width="4" height="6" rx="2" fill="#1b1330"/>
    <path d="M${bx + 6} ${y - 34} v-12 l9 3 l-9 3" fill="#6a4c93" stroke="#1b2a5c" stroke-width=".6"/>`;
  return `<ellipse cx="${cx}" cy="${y + T + 2}" rx="34" ry="7" fill="#1b2a5c" opacity=".18"/>
    <rect x="${cx - 26}" y="${y - 18}" width="52" height="30" fill="${tas}" ${CIZGI}/>
    <path d="M${cx - 26} ${y - 18} v-4 h4 v4 h4 v-4 h4 v4 h4 v-4 h4 v4 h4 v-4 h4 v4 h4 v-4 h4 v4 h4 v-4 h4 v4 h4 v-4 h4 v4" fill="none" stroke="#1b2a5c" stroke-width=".8"/>
    <path d="M${cx - 26} ${y - 6} h52 M${cx - 26} ${y + 4} h52" stroke="${koyu}" stroke-width=".6" opacity=".7"/>
    ${burc(cx - 36)}${burc(cx + 24)}
    <path d="M${cx - 8} ${y + 12} v-12 q8 -10 16 0 v12 z" fill="#1b1330" ${CIZGI}/>
    <path d="M${cx - 6} ${y + 1} q6 -8 12 0" fill="none" stroke="#b36ae0" stroke-width="1" opacity=".8"/>`;
}

// Haritanın sabit katmanı (zemin, yol, su, meydan, doğa, yapılar) — SVG içeriği.
export function haritaKatmani(harita) {
  const p = PALET[harita.bolge];
  const parcalar = [`<rect width="${GENISLIK * T}" height="${YUKSEKLIK * T}" fill="${p.zemin}"/>`];
  const ustler = []; // ağaç, kaya, ev gibi karonun üstüne taşan çizimler (y sırasıyla)
  for (let y = 0; y < YUKSEKLIK; y++) {
    for (let x = 0; x < GENISLIK; x++) {
      const t = harita.karolar[y * GENISLIK + x];
      const px = x * T;
      const py = y * T;
      if ((x * 7 + y * 13) % 5 === 0 && t === KARO.CIM) {
        parcalar.push(`<circle cx="${px + 5}" cy="${py + 9}" r="1.3" fill="${p.benek}"/>`);
      }
      switch (t) {
        case KARO.YOL:
        case KARO.KAPI:
          parcalar.push(`<rect x="${px}" y="${py}" width="${T}" height="${T}" fill="${p.yol}"/>`);
          break;
        case KARO.SU:
          parcalar.push(`<rect x="${px}" y="${py}" width="${T}" height="${T}" fill="${p.su}"/>
            <path d="M${px + 2} ${py + 6} q2 -2 4 0 q2 2 4 0 M${px + 5} ${py + 12} q2 -2 4 0" fill="none" stroke="#cfe9f4" stroke-width=".8" opacity=".8"/>`);
          break;
        case KARO.MEYDAN:
        case KARO.DUKKAN:
        case KARO.KERVANSARAY:
        case KARO.CESME:
        case KARO.TEZGAH:
        case KARO.TABELA:
        case KARO.MUHTAR:
        case KARO.AHI_BABA:
          parcalar.push(`<rect x="${px}" y="${py}" width="${T}" height="${T}" fill="#ddd3bf" stroke="#c4b89e" stroke-width=".6"/>`);
          break;
        case KARO.YABANI:
          parcalar.push(yabani(p, px, py));
          break;
      }
      if (t === KARO.AGAC) ustler.push(agac(p, px, py));
      else if (t === KARO.KAYA) ustler.push(kaya(p, px, py));
      else if (t === KARO.EV) ustler.push(ev(p, px, py));
      else if (t === KARO.CESME) ustler.push(cesme(px, py));
      else if (t === KARO.TEZGAH) ustler.push(tezgah(px, py));
      else if (t === KARO.TABELA) ustler.push(tabela(px, py));
      else if (t === KARO.DUKKAN) ustler.push(dukkan(px, py));
      else if (t === KARO.KERVANSARAY) ustler.push(kervansaray(px, py));
      else if (t === KARO.MUHTAR) ustler.push(muhtarCizimi(px, py));
      else if (t === KARO.AHI_BABA) ustler.push(ahiBabaCizimi(px, py));
    }
  }
  // Meydanın çini kenarı
  const m = harita.meydan;
  parcalar.push(`<rect x="${m.x1 * T}" y="${m.y1 * T}" width="${(m.x2 - m.x1 + 1) * T}" height="${(m.y2 - m.y1 + 1) * T}" fill="none" stroke="#2aa7a7" stroke-width="1.5" stroke-dasharray="4 2"/>`);
  const bolge = bolgeler.find((b) => b.anahtar === harita.bolge);
  if (harita.in && harita.plaka === final.il) {
    ustler.push(kaleCizimi(harita.in.x * T, (harita.in.y - 1) * T));
  } else if (harita.in && (bolge.bossIli === harita.plaka || bolge.miniBossIlleri.includes(harita.plaka))) {
    parcalar.push(inCizimi(p, harita.in.x * T, harita.in.y * T));
  }
  return parcalar.join('') + ustler.join('');
}

// Çıkış yolları: kapı taşları ve komşu ilin adı. Kilitli bölgeye giden yol sihirli bir
// engelle kapalı çizilir. `acikMi(plaka)` → yol açık mı.
export function kapiKatmani(harita, adlar, acikMi) {
  return harita.kapilar.map((k) => {
    const px = k.x * T;
    const py = k.y * T;
    const acik = acikMi(k.plaka);
    const yatay = k.y === 0 || k.y === YUKSEKLIK - 1;
    const tas = yatay
      ? `<rect x="${px - 3}" y="${py + 2}" width="4" height="12" fill="#9a958a" ${CIZGI}/><rect x="${px + T - 1}" y="${py + 2}" width="4" height="12" fill="#9a958a" ${CIZGI}/>`
      : `<rect x="${px + 2}" y="${py - 3}" width="12" height="4" fill="#9a958a" ${CIZGI}/><rect x="${px + 2}" y="${py + T - 1}" width="12" height="4" fill="#9a958a" ${CIZGI}/>`;
    const engel = acik
      ? ''
      : `<rect x="${px + 1}" y="${py + 1}" width="${T - 2}" height="${T - 2}" rx="3" fill="#6a4c93" opacity=".75" class="sihirli-engel"/>
         <path d="M${px + 4} ${py + 4} l8 8 M${px + 12} ${py + 4} l-8 8" stroke="#e3d0ff" stroke-width="1.4"/>`;
    // Ad etiketi, çıkışın içeri doğru iki karo ötesinde
    const lx = k.x === 0 ? T + 2 : k.x === GENISLIK - 1 ? (GENISLIK - 1) * T - 2 : (k.ix + (k.ix - k.x)) * T + T / 2;
    const ly = (k.iy + (k.iy - k.y)) * T + T / 2 + 3;
    const hiza = k.x === 0 ? 'start' : k.x === GENISLIK - 1 ? 'end' : 'middle';
    return `<g class="kapi${acik ? '' : ' kilitli'}">${tas}${engel}
      <text x="${lx}" y="${ly}" class="kapi-adi" text-anchor="${hiza}">${adlar[k.plaka]}</text></g>`;
  }).join('');
}
