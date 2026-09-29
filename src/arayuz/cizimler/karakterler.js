// Oyuncu sınıflarının çizimleri: stilize, edepli, sağa (düşmana) dönük figürler.
// Yüzler sade tutulur; figürler çini paletinin renkleriyle giydirilir.
import { svgSar, golge } from './ortak.js';

const TEN = '#e9b98f';

// Ortak gövde: kaftan, kuşak, çizme, baş. Renkleri sınıfa göre değişir.
function govde({ kaftan, kaftanKoyu, kusak, cizme = '#5b3a24' }) {
  return `
    <path d="M44 100 L48 80 L56 80 L55 102 Z" fill="${cizme}"/>
    <path d="M64 102 L64 80 L72 80 L76 100 Z" fill="${cizme}"/>
    <path d="M40 56 Q42 46 60 44 Q78 46 80 56 L84 88 Q60 94 36 88 Z" fill="${kaftan}"/>
    <path d="M60 46 L60 90" stroke="${kaftanKoyu}"/>
    <path d="M52 46 L60 60 L68 46" fill="${kaftanKoyu}"/>
    <path d="M40 66 L80 66 L80 72 L40 72 Z" fill="${kusak}"/>
    <circle cx="60" cy="34" r="12" fill="${TEN}"/>
    <circle cx="64" cy="33" r="1.4" fill="#2b2620" stroke="none"/>
    <circle cx="70" cy="33" r="1.4" fill="#2b2620" stroke="none"/>`;
}

// Akıncı: sivri miğfer, yuvarlak kalkan, kılıç. Mercan kaftan.
function akinci() {
  return `${golge()}
    <path d="M28 64 Q24 60 30 56" fill="none"/>
    ${govde({ kaftan: '#d9483b', kaftanKoyu: '#9e2f26', kusak: '#d4a537' })}
    <path d="M58 40 Q66 43 74 39" fill="none" stroke="#5b3a24" stroke-width="2.4"/>
    <path d="M47 30 Q48 18 60 10 Q72 18 73 30 Z" fill="#b8c2cc"/>
    <path d="M60 10 L60 4" stroke-width="2.6"/>
    <path d="M46 30 L74 30 L74 33 L46 33 Z" fill="#d4a537"/>
    <path d="M47 33 Q46 44 50 48 L52 36 Z" fill="#8f99a3"/>
    <circle cx="36" cy="68" r="15" fill="#1b2a5c"/>
    <circle cx="36" cy="68" r="11" fill="#2aa7a7"/>
    <circle cx="36" cy="68" r="4" fill="#d4a537"/>
    <path d="M78 58 Q86 56 88 50" fill="none" stroke="${TEN}" stroke-width="6"/>
    <path d="M86 52 Q100 36 102 18 Q94 34 82 48 Z" fill="#dfe6ea"/>
    <path d="M80 50 L92 58" stroke-width="3" stroke="#d4a537"/>`;
}

// Kemankeş: uzun keçe börk, Türk yayı, sadak. Turkuaz kaftan.
function kemankes() {
  return `${golge()}
    <path d="M36 44 L30 78 L40 78 L44 46 Z" fill="#7b5236"/>
    <path d="M33 44 L31 36 M37 45 L36 36 M41 46 L41 37" stroke="#d9483b" stroke-width="2.4"/>
    ${govde({ kaftan: '#2aa7a7', kaftanKoyu: '#1d7d7d', kusak: '#d9483b' })}
    <path d="M48 28 Q48 8 62 4 Q70 10 72 28 Z" fill="#f7efdc"/>
    <path d="M47 26 L73 26 L73 31 L47 31 Z" fill="#d4a537"/>
    <path d="M78 58 L90 60" stroke="${TEN}" stroke-width="6"/>
    <path d="M92 24 Q84 30 90 44 Q96 60 90 76 Q84 90 92 96" fill="none" stroke="#7b5236" stroke-width="4"/>
    <path d="M92 24 Q86 26 88 20 M92 96 Q86 94 88 100" fill="none" stroke="#7b5236" stroke-width="3"/>
    <path d="M90 22 L90 98" stroke="#f7efdc" stroke-width="1"/>
    <path d="M70 60 L108 60" stroke="#5b3a24" stroke-width="2"/>
    <path d="M108 60 L102 56 L102 64 Z" fill="#b8c2cc"/>
    <path d="M70 60 L66 56 M70 60 L66 64" stroke="#d9483b"/>`;
}

// Alperen: derviş külahı, hırka, meşe asa. Yeşil-kahve tonlar.
function alperen() {
  return `${golge()}
    ${govde({ kaftan: '#5f8a4a', kaftanKoyu: '#3f6232', kusak: '#d4a537', cizme: '#7b5236' })}
    <path d="M38 54 Q36 76 40 92 L46 92 L44 56 Z M82 54 Q84 76 80 92 L74 92 L76 56 Z" fill="#7b5236"/>
    <path d="M52 44 Q60 56 68 44 Q64 50 60 50 Q56 50 52 44 Z" fill="#6e5b45"/>
    <path d="M50 26 Q50 2 60 0 Q70 2 70 26 Z" fill="#d8c29a"/>
    <path d="M49 24 L71 24 L71 28 L49 28 Z" fill="#b39a6e"/>
    <path d="M60 4 L60 22" stroke="#b39a6e" stroke-width="1.4"/>
    <path d="M78 58 L90 58" stroke="${TEN}" stroke-width="6"/>
    <path d="M92 104 L92 22" stroke="#5b3a24" stroke-width="5"/>
    <circle cx="92" cy="20" r="6" fill="#7b5236"/>
    <path d="M86 32 Q92 38 98 32" fill="none" stroke="#d4a537" stroke-width="2"/>`;
}

const cizimler = { akinci, kemankes, alperen };

export const SINIF_CIZIMLERI = Object.keys(cizimler);

// Sınıfın SVG çizimi (HTML metni).
export function sinifCizimi(sinif, secenekler = {}) {
  return svgSar(cizimler[sinif](), { sinif: 'cizim cizim-oyuncu', ...secenekler });
}
