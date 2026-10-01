// Yoldaşların çizimleri: Akıncı'nın atı, Kemankeş'in doğanı, Alperen'in müridi ve
// Bacı'nın kangalı. Sağa (düşmana) dönük, sınıf çizimleriyle aynı 120×120 tuvalde.
import { svgSar, golge, hacim, kure, metal, acik, koyu, parlak, leke } from './ortak.js';
import { muritIcerigi } from './karakterler.js';

const ALTIN = '#d4a537';
const goz = (x, y, r = 1.8) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2b2620" stroke="none"/>
  <circle cx="${x - r * 0.3}" cy="${y - r * 0.35}" r="${r * 0.35}" fill="#fff" stroke="none"/>`;

// Kırat: kır (beyaza çalan boz) at; kırmızı, altın kenarlı eyer örtüsü ve dizgin.
function at() {
  const kir = '#ddd8cc';
  const yele = '#6b6a70';
  const bacak = (x, egik = 0) => `<path d="M${x} 70 L${x + egik} 100 L${x + 7 + egik} 100 L${x + 7} 70 Z" fill="${hacim(kir)}"/>
    <path d="M${x - 0.5 + egik} 99 h8 v4.5 h-8 z" fill="${hacim('#3a3530')}"/>`;
  return `${golge(36)}
    <path d="M27 56 Q12 62 15 88 Q20 80 22 76 Q22 86 27 90 Q28 74 31 64 Z" fill="${hacim(yele)}"/>
    ${bacak(32, -2)}${bacak(76, 2)}
    <ellipse cx="56" cy="62" rx="31" ry="15" fill="${hacim(kir)}"/>
    ${bacak(42, 1)}${bacak(84, -1)}
    <path d="M74 60 Q76 42 87 29 L98 34 Q91 47 90 66 Z" fill="${hacim(kir)}"/>
    <path d="M86 27 Q95 20 105 28 Q111 33 109 39 Q104 42 97 40 Q90 37 87 33 Z" fill="${hacim(kir)}"/>
    <path d="M89 25 L90 16 L95 23 Z" fill="${hacim(kir)}"/>
    <path d="M86 28 Q80 36 76 48 Q73 56 74 62 Q78 50 82 44 Q85 38 89 33" fill="${hacim(yele)}"/>
    ${goz(96, 29)}
    <ellipse cx="106.5" cy="36" rx="1.2" ry="1" fill="#2b2620" stroke="none"/>
    <path d="M92 26 L100 36 Q104 39 108 38 M93 31 Q96 38 99 40" fill="none" stroke="#d9483b" stroke-width="1.6"/>
    <path d="M42 47 Q57 43 71 47 L69 66 Q57 69 44 66 Z" fill="${hacim('#d9483b')}"/>
    <path d="M44 65 Q57 68 69 65" fill="none" stroke="${ALTIN}" stroke-width="1.8"/>
    <path d="M45 50 Q57 46 68 50" fill="none" stroke="${ALTIN}" stroke-width="1" stroke-dasharray="1.5 2"/>
    <path d="M48 46 Q57 41 66 46 L65 50 Q57 47 49 50 Z" fill="${hacim('#7b5236')}"/>
    <path d="M57 66 L57 78" stroke="#5b3a24" stroke-width="1.6"/><rect x="54.5" y="77" width="5" height="3.5" rx="1" fill="${metal(ALTIN)}" stroke-width="1"/>
    ${parlak('M32 54 Q45 48 60 48', 0.45)}`;
}

// Tuğrul: kanatlarını açmış, avına dalan bir doğan.
function dogan() {
  const kahve = '#8a5a2b';
  const tuyler = 'M24 30 L36 44 M18 38 L34 48 M20 48 L36 52';
  return `<ellipse cx="62" cy="106" rx="18" ry="4" fill="#10183a" stroke="none" opacity=".18"/>
    <path d="M60 54 Q46 30 28 18 Q34 30 30 34 Q20 30 12 34 Q24 40 24 44 Q14 46 10 54 Q30 56 54 62 Z" fill="${hacim(koyu(kahve, 0.15))}"/>
    <path d="M48 62 L26 74 L30 66 L22 66 L44 58 Z" fill="${hacim(kahve)}"/>
    <ellipse cx="62" cy="60" rx="16" ry="9" fill="${hacim(kahve)}"/>
    <path d="M52 63 Q62 70 74 63 Q66 66 52 63 Z" fill="${hacim('#f0e2c4')}"/>
    <path d="M58 64.5 l1 1 M63 65.5 l1 1 M68 64.5 l1 1" stroke="${kahve}" stroke-width="1.2"/>
    <path d="M64 56 Q56 28 66 10 Q70 26 82 30 Q72 34 76 44 Q70 46 70 56 Z" fill="${hacim(kahve)}"/>
    <path d="${tuyler}" fill="none" stroke="${acik(kahve, 0.35)}" stroke-width="1" transform="translate(44 -6)"/>
    <circle cx="80" cy="54" r="7.5" fill="${kure(kahve)}"/>
    <path d="M77 55 Q78 61 82 61" fill="none" stroke="#2b2620" stroke-width="1.6"/>
    <path d="M86 52 Q92 53 90 59 Q88 56 85 56 Z" fill="${hacim('#f0c75e')}" stroke-width="1.2"/>
    ${goz(82, 52, 1.7)}
    <path d="M60 68 L58 74 M66 68 L66 74" stroke="#f0c75e" stroke-width="2.2"/>
    ${parlak('M58 52 Q62 36 66 22', 0.35)}`;
}

// Karabaş: Sivas kangalı; açık kumral post, kara maske, kıvrık kuyruk, çivili tasma.
function kangal() {
  const post = '#d8b98a';
  const maske = '#2b2620';
  const bacak = (x) => `<path d="M${x} 74 L${x} 101 L${x + 7} 101 L${x + 7} 74 Z" fill="${hacim(post)}"/>
    <path d="M${x - 1} 99 h9 v4 h-9 z" fill="${hacim(koyu(post, 0.35))}"/>`;
  return `${golge(30)}
    <path d="M33 66 Q18 58 24 44 Q30 36 36 44 Q30 48 32 54 Q34 60 40 62 Z" fill="${hacim(post)}"/>
    ${bacak(36)}${bacak(70)}
    <ellipse cx="56" cy="70" rx="26" ry="12.5" fill="${hacim(post)}"/>
    ${bacak(44)}${bacak(78)}
    ${leke('M40 64 Q56 58 74 63 Q60 66 40 64 Z', '#fffaf0', 0.35)}
    <path d="M72 66 Q72 52 80 46 L90 50 Q86 60 84 70 Z" fill="${hacim(post)}"/>
    <path d="M76 46 Q77 36 87 35 Q95 36 97 43 L104 46 Q108 50 105.5 55 L97 57.5 Q90 60 82 57 Q76 53 76 46 Z" fill="${hacim(post)}"/>
    <path d="M96.5 44 L104 46 Q108 50 105.5 55 L97 57.5 Q94.5 51 96.5 44 Z" fill="${hacim(maske)}"/>
    <ellipse cx="105" cy="48.6" rx="1.6" ry="1.3" fill="#10183a" stroke="none"/>
    <path d="M98.5 55.3 Q101.5 56.4 104.5 55" fill="none" stroke="#f0e2c4" stroke-width=".8" opacity=".7"/>
    <path d="M80 39 Q73 43 75.5 54 Q80 53.5 83 45 Z" fill="${hacim(maske)}"/>
    ${goz(91, 43.5, 1.6)}
    <path d="M73 58 Q81 63 88 56 L89.5 60 Q81 67 72.5 62 Z" fill="${hacim('#7b2a22')}"/>
    <path d="M76 60.5 l-1.2 2.6 M80 62 l-.6 2.8 M84 61.3 l.2 2.8" stroke="${metal('#b8c2cc')}" stroke-width="1.6"/>
    ${parlak('M44 62 Q56 58 68 60', 0.4)}`;
}

const cizimler = { at, dogan, kangal, murit: muritIcerigi };

export const YOLDAS_CIZIMLERI = Object.keys(cizimler);

// Yoldaşın SVG çizimi (HTML metni). `anahtar`: siniflar.js → yoldas.anahtar.
export function yoldasCizimi(anahtar, secenekler = {}) {
  return svgSar(cizimler[anahtar](), { sinif: 'cizim cizim-yoldas', ...secenekler });
}
