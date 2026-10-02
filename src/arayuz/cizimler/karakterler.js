// Oyuncu sınıflarının çizimleri: stilize, edepli, sağa (düşmana) dönük figürler.
// Yüzler sade tutulur; figürler çini paletinin renkleriyle giydirilir. Kumaşlar
// hacim gradyanıyla, metal ve yüzler parlaklıkla gölgelenir.
// Kuşanılan eşyalar figürde görünür (ekipmanGorunumu): silah nadirliğine göre süslenir,
// zırh kaftanın üstüne yelek olarak giyilir, kuşak bölgesinin rengini alır; efsanevi
// eşyalar parlar.
import { svgSar, golge, hacim, kure, metal, isilti, acik, koyu, karistir, renkFarki, parlak, leke } from './ortak.js';
import { esyaBilgisi } from '../../oyun/rota.js';
import { bolgeler } from '../../veri/bolgeler.js';

const TEN = '#e9b98f';
const CIZGI_KOYU = '#1b2a5c';
const ALTIN = '#d4a537';
const EFSANE_ISIGI = '#f7d774';

// ── Ekipmanın görünüşü ──────────────────────────────────

// Kuşanılan eşyaların çizimdeki karşılığı: her yuva için { nadirlik, renk } ya da null.
// `renk`, eşyanın geldiği bölgenin rengidir. Bilinmeyen eşyalar yok sayılır.
export function ekipmanGorunumu(kusanilan = {}) {
  const sonuc = { silah: null, zirh: null, aksesuar: null };
  for (const yuva of Object.keys(sonuc)) {
    const esya = kusanilan?.[yuva] && esyaBilgisi(kusanilan[yuva]);
    if (!esya) continue;
    const renk = bolgeler.find((b) => b.anahtar === esya.bolge)?.renk ?? ALTIN;
    sonuc[yuva] = { nadirlik: esya.nadirlik, renk };
  }
  return sonuc;
}

// Eşya rengi kaftana çok yakınsa koyulaşır ki iki kumaş birbirine karışmasın.
const ayrisan = (renk, zemin) => (renkFarki(renk, zemin) < 90 ? koyu(renk, 0.5) : renk);

// Dört köşeli küçük bir parıltı (efsanevi eşyalarda).
const pirilti = (x, y, r = 3) => `
  <circle cx="${x}" cy="${y}" r="${r * 2.2}" fill="${isilti(EFSANE_ISIGI)}" stroke="none"/>
  <path d="M${x} ${y - r * 1.6} L${x + r * 0.4} ${y - r * 0.4} L${x + r * 1.6} ${y} L${x + r * 0.4} ${y + r * 0.4} L${x} ${y + r * 1.6} L${x - r * 0.4} ${y + r * 0.4} L${x - r * 1.6} ${y} L${x - r * 0.4} ${y - r * 0.4} Z" fill="#fffaf0" stroke="none"/>`;

// Efsanevi eşya kuşanan yiğidin ardındaki ılık hale.
const efsaneHalesi = (ekipman) => (Object.values(ekipman).some((e) => e?.nadirlik === 'efsanevi')
  ? `<ellipse cx="60" cy="58" rx="46" ry="54" fill="${isilti(EFSANE_ISIGI)}" stroke="none" opacity=".4"/>`
  : '');

// Zırh: kaftanın üstüne giyilen yelek. Sıradan keçe, nadir bölge renginde sırma işlemeli,
// efsanevi pul pul zırh. Kuşağın altında kalır.
const YELEK_SOL = 'M44 53.5 Q46.5 47 52.5 46 L58.2 61 L57.8 67 L41.6 67 Z';
const YELEK_SAG = 'M76 53.5 Q73.5 47 67.5 46 L61.8 61 L62.2 67 L78.4 67 Z';
function yelek(zirh, kaftan) {
  if (!zirh) return '';
  const kenar = 'M52.5 46 L58.2 61 L57.8 67 M67.5 46 L61.8 61 L62.2 67';
  if (zirh.nadirlik === 'siradan') {
    const renk = ayrisan(karistir('#8a6a4a', zirh.renk, 0.3), kaftan);
    return `<path d="${YELEK_SOL}" fill="${hacim(renk)}"/><path d="${YELEK_SAG}" fill="${hacim(renk)}"/>
      <path d="M43 60 h14 M63 60 h14" stroke="${koyu(renk, 0.3)}" stroke-width="1" stroke-dasharray="1.6 1.8" opacity=".7"/>`;
  }
  if (zirh.nadirlik === 'nadir') {
    const renk = ayrisan(zirh.renk, kaftan);
    const cintemani = (x, y) => [[x, y], [x + 2.4, y], [x + 1.2, y - 2]]
      .map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="1" fill="${ALTIN}" stroke="none"/>`).join('');
    return `<path d="${YELEK_SOL}" fill="${hacim(renk)}"/><path d="${YELEK_SAG}" fill="${hacim(renk)}"/>
      <path d="${kenar}" fill="none" stroke="${ALTIN}" stroke-width="1.5"/>
      ${cintemani(47, 59)}${cintemani(70.6, 59)}
      ${parlak('M46 55 Q48 50 52 48', 0.4)}`;
  }
  // Efsanevi: altın ve bölge renginden pullar, kenarda sırma, göğüste bir taş
  const renk = karistir(ALTIN, zirh.renk, 0.25);
  const pullar = [];
  for (let sira = 0; sira < 6; sira++) {
    const y = (49 + sira * 3.4).toFixed(1);
    for (let x = 39 + (sira % 2) * 2; x <= 80; x += 4) pullar.push(`M${x} ${y} q2 2.6 4 0`);
  }
  return `<clipPath id="@yelek"><path d="${YELEK_SOL} ${YELEK_SAG}"/></clipPath>
    <path d="${YELEK_SOL}" fill="${metal(renk)}"/><path d="${YELEK_SAG}" fill="${metal(renk)}"/>
    <path d="${pullar.join(' ')}" fill="none" stroke="${koyu(renk, 0.45)}" stroke-width=".9" clip-path="url(#@yelek)"/>
    <path d="${kenar}" fill="none" stroke="${acik(ALTIN, 0.3)}" stroke-width="1.6"/>
    <circle cx="49" cy="56" r="2" fill="${kure(zirh.renk)}" stroke-width="1"/><circle cx="71" cy="56" r="2" fill="${kure(zirh.renk)}" stroke-width="1"/>
    ${parlak('M46 55 Q48 50 52 48', 0.55)}`;
}

// Kuşak süsü: nadirde iki ince çizgi, efsanevide taşlı toka ve püsküller.
function kusakSusu(kusak) {
  if (!kusak || kusak.nadirlik === 'siradan') return '';
  const cizgiler = `<path d="M40.6 68.2 Q60 73.2 79.4 68.2 M40.9 70.6 Q60 75.6 79.1 70.6" fill="none" stroke="#f7efdc" stroke-width=".8" opacity=".85"/>`;
  if (kusak.nadirlik === 'nadir') return cizgiler;
  return `${cizgiler}
    <path d="M44.5 81 l-1 4 M46.5 80.5 l0 4" stroke="${ALTIN}" stroke-width="1.2"/>
    <rect x="55.5" y="67.5" width="9" height="7.5" rx="1.6" fill="${metal(ALTIN)}" stroke-width="1.2"/>
    <circle cx="60" cy="71.2" r="2.1" fill="${kure(kusak.renk)}" stroke-width=".9"/>
    ${pirilti(64, 68, 1.6)}`;
}

// Çizme: burnu sağa bakar.
const cizme = (x, renk) => `
  <path d="M${x} 92 h9.5 v9 q6.5 .5 7.5 4.5 v1.5 h-17 z" fill="${hacim(renk)}"/>
  <path d="M${x + 1.5} 95 h6" stroke="${acik(renk, 0.4)}" stroke-width="1.4" opacity=".7"/>`;

// Baş: yüz, kulak, kaş, göz, burun ve yanak. `sac` ensedeki saç rengi;
// `biyik`, `sakal` isteğe bağlıdır. Ense (saçlı başın arkası) gizlidir; yiğit kuzeye
// yürürken (arkası dönükken) görünür ve yüzü örter (ana.css → .kuzey .ense).
function bas({ sac = '#3a2a1e', biyik = false, sakal = false, kas = '#3a2a1e' } = {}) {
  const sakalCiz = sakal
    ? `<path d="M52 37 Q53 48 62 49 Q71 48 72 39 Q66 44 60 42 Q55 41 52 37 Z" fill="${hacim(sac)}"/>`
    : '';
  const biyikCiz = biyik
    ? `<path d="M63 40.5 Q67 38 70.5 40 Q74 38.5 76 41 Q73 41 70.5 42 Q67 42.5 63 40.5 Z" fill="${sac}" stroke-width="1.2"/>`
    : '';
  return `
    <path d="M56 42 h8 v6 h-8 z" fill="${koyu(TEN, 0.18)}"/>
    <path d="M49 30 Q47 40 52 46 L56 44 L55 30 Z" fill="${hacim(sac)}"/>
    <circle cx="61" cy="33" r="12.5" fill="${kure(TEN)}"/>
    <path d="M55.5 31 q-3.2 -.6 -3.2 3 q0 3.4 3.2 3" fill="${koyu(TEN, 0.08)}" stroke-width="1.2"/>
    <path d="M62.5 28.5 q2.5 -1.4 5 -.2 M69 28.3 q2 -.9 4 .4" fill="none" stroke="${kas}" stroke-width="1.5"/>
    <ellipse cx="65" cy="32.6" rx="1.5" ry="1.9" fill="#2b2620" stroke="none"/>
    <ellipse cx="71" cy="32.6" rx="1.4" ry="1.8" fill="#2b2620" stroke="none"/>
    <circle cx="65.5" cy="32" r=".55" fill="#fff" stroke="none"/><circle cx="71.4" cy="32" r=".5" fill="#fff" stroke="none"/>
    <path d="M73 34 q1.8 2.4 -.3 3.4" fill="none" stroke="${koyu(TEN, 0.35)}" stroke-width="1.2"/>
    <ellipse cx="67" cy="37.5" rx="2.6" ry="1.4" fill="#e0786a" stroke="none" opacity=".35"/>
    <path d="M66 41 q2.4 1.1 4.4 -.3" fill="none" stroke="${koyu(TEN, 0.45)}" stroke-width="1.1"/>
    ${sakalCiz}${biyikCiz}
    <g class="ense" visibility="hidden"><circle cx="61" cy="33" r="12.8" fill="${kure(sac)}"/>
      <path d="M52 40 Q61 46 70 40" fill="none" stroke="${koyu(sac, 0.35)}" stroke-width="1.2"/></g>`;
}

// Ortak gövde: şalvar, çizme, kaftan (kenar şeritli), kaytan düğmeler ve kuşak.
// Kollar ve baş sınıfa göre ayrıca çizilir. Renkleri sınıfa göre değişir.
// `ekipman`: ekipmanGorunumu(); zırh yelek olarak giyilir, kuşak bölgesinin rengini alır.
function govde({ kaftan, kaftanKoyu, kusak: sinifKusagi, cizme: cizmeRenk = '#5b3a24', ic = '#f7efdc', serit = ALTIN, salvar, ekipman = {} }) {
  const s = salvar ?? kaftanKoyu;
  const kusak = ekipman.aksesuar ? ayrisan(ekipman.aksesuar.renk, kaftan) : sinifKusagi;
  // Bacaklar ayrı gruplardır: yürürken kalçadan salınırlar (ana.css → .bacak).
  return `
    <g class="bacak bacak-arka"><path d="M46 82 Q43 90 47 95 L57 95 Q59 88 58 82 Z" fill="${hacim(s)}"/>${cizme(46, cizmeRenk)}</g>
    <g class="bacak bacak-on"><path d="M63 82 Q62 88 63.5 95 L73.5 95 Q77 90 74 82 Z" fill="${hacim(s)}"/>${cizme(63, cizmeRenk)}</g>
    <path d="M43 53 Q46 45 60 44 Q74 45 77 53 L83 89 Q72 94 60 94 Q48 94 37 89 Z" fill="${hacim(kaftan)}"/>
    <path d="M57.5 73 L54 93.5 Q60 95 66 93.5 L62.5 73 Z" fill="${hacim(ic)}"/>
    <path d="M57.5 73 L54 93.5 M62.5 73 L66 93.5" fill="none" stroke="${serit}" stroke-width="1.6"/>
    ${leke('M70 50 Q76 52 78 60 L82 88 Q76 91 70 92 Q74 72 70 50 Z', kaftanKoyu, 0.45)}
    <path d="M38.5 87.5 Q49 92.5 60 92.5 Q71 92.5 81.5 87.5" fill="none" stroke="${serit}" stroke-width="1.8"/>
    <path d="M52 45.5 L60 59 L68 45.5 Q64 47.5 60 47.5 Q56 47.5 52 45.5 Z" fill="${hacim(ic)}"/>
    <path d="M51.5 46 L60 60 L68.5 46" fill="none" stroke="${serit}" stroke-width="1.6"/>
    <path d="M55.5 52 h-4 M56.5 56 h-4 M64.5 52 h4 M63.5 56 h4" stroke="${serit}" stroke-width="1.4"/>
    <circle cx="58" cy="52" r="1" fill="${serit}" stroke="none"/><circle cx="62" cy="52" r="1" fill="${serit}" stroke="none"/>
    ${yelek(ekipman.zirh, kaftan)}
    <path d="M40 65 Q60 70 80 65 L80.8 72.5 Q60 77.5 39.2 72.5 Z" fill="${hacim(kusak)}"/>
    <path d="M42 68.5 Q60 73 78 68.5" fill="none" stroke="${acik(kusak, 0.45)}" stroke-width="1" opacity=".8"/>
    <path d="M44 73 L42 82 L46 81 L47 74" fill="${hacim(kusak)}" stroke-width="1.4"/>
    ${kusakSusu(ekipman.aksesuar)}
    ${parlak('M46 52 Q44 66 41 84', 0.25)}`;
}

// Kol: omuzdan ele bir yen; el dirsekten sonra çizilir.
const kol = (d, renk, el) => `<path d="${d}" fill="${hacim(renk)}"/>${
  el ? `<circle cx="${el[0]}" cy="${el[1]}" r="4.6" fill="${kure(TEN)}"/>` : ''}`;

// Akıncı: sivri miğfer ve tuğ, zincir ense örgüsü, çini desenli kalkan, pala ve pelerin.
// Mercan kaftan. Kılıç: nadirde oluklu ve kabzası taşlı, efsanevide sırtı altın, ışıl ışıl.
function akinci(ekipman) {
  const silah = ekipman.silah?.nadirlik;
  const kilicYolu = 'M85.5 50 Q98 40 104 14 Q107 30 101 41 Q95 51 89 56 Z';
  const kabzaTasi = silah === 'nadir' || silah === 'efsanevi' ? ekipman.silah.renk : ALTIN;
  const kilicIsigi = silah === 'efsanevi'
    ? `<path d="${kilicYolu}" fill="none" stroke="${EFSANE_ISIGI}" stroke-width="7" opacity=".45"/>` : '';
  const kilicSusu = silah === 'nadir' || silah === 'efsanevi'
    ? `<path d="M89.5 49 Q97 41.5 102.2 24" fill="none" stroke="${koyu('#dfe6ea', 0.35)}" stroke-width="1"/>` : '';
  const kilicSirti = silah === 'efsanevi'
    ? `<path d="M85.5 50 Q98 40 104 14" fill="none" stroke="${ALTIN}" stroke-width="1.5"/>${pirilti(103, 19, 2.4)}` : '';
  const kaftan = '#d9483b';
  const kalkanYapraklari = Array.from({ length: 6 }, (_, i) =>
    `<ellipse cx="36" cy="61.5" rx="2.4" ry="5" fill="${i % 2 ? '#f7efdc' : '#d9483b'}" stroke-width="1" transform="rotate(${i * 60} 36 68)"/>`).join('');
  const civiler = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return `<circle cx="${(36 + Math.cos(a) * 13).toFixed(1)}" cy="${(68 + Math.sin(a) * 13).toFixed(1)}" r="1.2" fill="${ALTIN}" stroke="none"/>`;
  }).join('');
  return `${golge()}${efsaneHalesi(ekipman)}
    <path d="M45 50 Q30 64 26 100 Q34 97 38 101 Q41 98 46 100 L48 58 Z" fill="${hacim('#9e2f26')}"/>
    <path d="M32 74 Q30 86 29 97" fill="none" stroke="${acik('#9e2f26', 0.3)}" stroke-width="1.4" opacity=".7"/>
    ${govde({ kaftan, kaftanKoyu: '#9e2f26', kusak: ALTIN, salvar: '#1b2a5c', ekipman })}
    ${kol('M70 49 Q81 45 87 50 L84.5 58.5 Q78 55 72 60 Z', kaftan, [87, 55])}
    ${kilicIsigi}
    <path d="${kilicYolu}" fill="${metal(silah === 'efsanevi' ? '#eef3f6' : '#dfe6ea')}"/>
    ${kilicSusu}
    ${parlak('M91 48 Q99 38 102.5 22', 0.6)}
    ${kilicSirti}
    <rect x="80" y="51" width="15" height="4" rx="2" fill="${metal(ALTIN)}" transform="rotate(36 87.5 53)"/>
    <path d="M85 58.5 L81 63.5" stroke-width="3.6"/><path d="M85 58.5 L81 63.5" stroke="#5b3a24" stroke-width="1.8"/>
    <circle cx="80.5" cy="64" r="2" fill="${kure(kabzaTasi)}" stroke-width="1.2"/>
    ${bas({ biyik: true })}
    <path d="M47.5 31 Q46 44 51.5 49 L57.5 46 L55.5 31 Z" fill="${metal('#9aa4ae')}"/>
    <path d="M49 35 h6 M49.3 39 h6.6 M50.5 43 h6" stroke="#1b2a5c" stroke-width="1" stroke-dasharray="1.2 1.6" opacity=".7"/>
    <path d="M47 30.5 Q46.5 18 60 8.5 Q73.5 18 74 30.5 Z" fill="${metal('#b8c2cc')}"/>
    <path d="M60 9 Q58 20 59 30" fill="none" stroke="${koyu('#b8c2cc', 0.3)}" stroke-width="1.2"/>
    ${parlak('M52 26 Q53 17 59 12', 0.7)}
    <path d="M45.5 29 L75 29 L75 33.5 L45.5 33.5 Z" fill="${metal(ALTIN)}"/>
    <path d="M70 33 L70 40.5" stroke-width="3.4"/><path d="M70 33 L70 40.5" stroke="#b8c2cc" stroke-width="1.6"/>
    <path d="M60 9 L60 3.5" stroke-width="2.6"/>
    <path d="M60 4 Q48 -1 41 9 Q46 6 51 7 Q46 9 44 14 Q52 7 59 7 Z" fill="${hacim('#d9483b')}" stroke-width="1.4"/>
    <circle cx="60" cy="3.5" r="2" fill="${kure(ALTIN)}" stroke-width="1.2"/>
    <circle cx="36" cy="68" r="16" fill="${kure('#1b2a5c')}"/>
    <circle cx="36" cy="68" r="11.5" fill="${kure('#2aa7a7')}" stroke-width="1.4"/>
    ${kalkanYapraklari}
    <circle cx="36" cy="68" r="4.2" fill="${kure(ALTIN)}" stroke-width="1.4"/>
    ${civiler}
    <path d="M26 60 Q30 54 37 53" fill="none" stroke="#fff" stroke-width="2" opacity=".35"/>`;
}

// Kemankeş: tüylü sorguçlu keçe börk, sadak, kolçak ve gerilmiş Türk yayı.
// Turkuaz kaftan. Yay: nadirde laklı ve altın işlemeli, efsanevide koyu lak, altın
// kakmalı ve ışıl ışıl; okun tüyleri yayın geldiği bölgenin rengini alır.
function kemankes(ekipman) {
  const kaftan = '#2aa7a7';
  const silah = ekipman.silah?.nadirlik;
  const yay = { nadir: '#8e2a22', efsanevi: '#5a1f2e' }[silah] ?? '#7b5236';
  const tuy = silah === 'nadir' || silah === 'efsanevi' ? ekipman.silah.renk : '#d9483b';
  const yayYolu = 'M89 22 Q93 25 91 30 Q82 44 86 60 Q82 76 91 90 Q93 95 89 98';
  return `${golge()}${efsaneHalesi(ekipman)}
    <path d="M34 42 L27 78 Q31 81 37.5 80 L44 45 Z" fill="${hacim('#7b5236')}"/>
    <path d="M31.5 52 L42 54 M29.5 64 L40 66" stroke="${ALTIN}" stroke-width="1.8"/>
    <path d="M30 71 l3 8 M36 72 l-1 8" stroke="#d9483b" stroke-width="1.6"/>
    <path d="M33 43 L30 34 L35 37 Z M37.5 44 L36.5 34 L40 38 Z M42 45 L42.5 35.5 L45 40 Z" fill="#d9483b" stroke-width="1.2"/>
    <path d="M33 43 L35 37 M37.5 44 L38 37 M42 45 L43 39" stroke="#f7efdc" stroke-width=".8"/>
    ${govde({ kaftan, kaftanKoyu: '#1d7d7d', kusak: '#d9483b', salvar: '#5b3a24', ekipman })}
    ${kol('M43 52 Q38 56 46 60 L66 57 Q70 55 68 51 L50 50 Z', kaftan, [70, 54])}
    ${silah === 'efsanevi' ? `<path d="${yayYolu}" fill="none" stroke="${EFSANE_ISIGI}" stroke-width="11" opacity=".4"/>` : ''}
    <path d="${yayYolu}" fill="none" stroke="#1b2a5c" stroke-width="6.2"/>
    <path d="${yayYolu}" fill="none" stroke="${yay}" stroke-width="3.6"/>
    ${silah === 'nadir' || silah === 'efsanevi'
    ? `<path d="${yayYolu}" fill="none" stroke="${ALTIN}" stroke-width="1"${silah === 'nadir' ? ' stroke-dasharray="1.6 4"' : ''}/>` : ''}
    <path d="M90 25 Q93 27 91 30 M90 95 Q93 93 91 90" fill="none" stroke="#2b2620" stroke-width="3.6"/>
    <path d="M85 32 Q83 40 84 48" fill="none" stroke="${acik(yay, 0.45)}" stroke-width="1.2"/>
    <path d="M89.5 24 L71 54 L89.5 96" fill="none" stroke="#f7efdc" stroke-width="1"/>
    <path d="M71 54 L109 54" stroke="#1b2a5c" stroke-width="3.6"/><path d="M71 54 L109 54" stroke="#9e6b3a" stroke-width="1.8"/>
    <path d="M110 54 L103.5 50.5 L104.5 54 L103.5 57.5 Z" fill="${metal(silah === 'efsanevi' ? ALTIN : '#b8c2cc')}" stroke-width="1.2"/>
    ${silah === 'efsanevi' ? pirilti(110, 54, 2.2) : ''}
    <path d="M74 54 L70 50 L66 50.5 L70 54 Z M74 54 L70 58 L66 57.5 L70 54 Z" fill="${tuy}" stroke-width="1"/>
    ${kol('M73 50 Q80 49 86 55 L84 62 Q79 58 74 60 Z', kaftan)}
    <path d="M78 51.5 L84 56 L82 61.5 L76 58.5 Z" fill="${hacim('#5b3a24')}" stroke-width="1.4"/>
    <circle cx="87" cy="59" r="4.6" fill="${kure(TEN)}"/>
    ${bas({ sac: '#2b2018' })}
    <path d="M47.5 28 Q46 11 58 4.5 Q67 2 71 9 Q73 17 72.5 28 Z" fill="${hacim('#f7efdc')}"/>
    <path d="M58 5 Q62 14 61 27" fill="none" stroke="${koyu('#f7efdc', 0.2)}" stroke-width="1.2"/>
    ${parlak('M51 24 Q51 14 57 8', 0.6)}
    <path d="M46.5 25 L73.5 25 L73.5 30.5 L46.5 30.5 Z" fill="${metal(ALTIN)}"/>
    <path d="M50 27.7 h20" stroke="#d9483b" stroke-width="1" stroke-dasharray="2 2"/>
    <path d="M70 26 Q78 12 76 2 Q73 12 67 21 Z" fill="${hacim('#2aa7a7')}" stroke-width="1.4"/>
    <path d="M70 25 Q74 14 75.5 5" fill="none" stroke="#f7efdc" stroke-width=".8"/>
    <circle cx="69.5" cy="27.7" r="2.4" fill="${kure('#d9483b')}" stroke-width="1.2"/>`;
}

// Alperen: derviş külahı, sakal, uzun hırka, meşe asa (pirinç başlıklı, püsküllü).
// Yeşil-kahve tonlar.
// Asa: nadirde koyu ceviz, pirinç halkalı ve başında bölge renginde taş; efsanevide
// taş ışıl ışıl parlar, sapı altın halkalarla sarılır.
function alperen(ekipman) {
  const kaftan = '#5f8a4a';
  const hirka = '#7b5236';
  const silah = ekipman.silah?.nadirlik;
  const sap = silah === 'nadir' || silah === 'efsanevi' ? '#5b3a24' : hirka;
  const tas = silah === 'nadir' || silah === 'efsanevi' ? ekipman.silah.renk : '#c98f3a';
  const halkalar = { nadir: [40, 72], efsanevi: [34, 46, 72, 86] }[silah] ?? [];
  return `${golge()}${efsaneHalesi(ekipman)}
    <path d="M90 105 L93 21" stroke-width="7"/>
    <path d="M90 105 L93 21" stroke="${sap}" stroke-width="4.2"/>
    <path d="M91.6 40 l2 .4 M90.8 72 l2 .3" stroke="#3f2a1a" stroke-width="1.6"/>
    ${halkalar.map((y) => {
    const x = (90 + (3 * (105 - y)) / 84).toFixed(1);
    return `<rect x="${(x - 3).toFixed(1)}" y="${y - 1.4}" width="6" height="2.8" rx="1" fill="${metal(ALTIN)}" stroke-width="1"/>`;
  }).join('')}
    ${govde({ kaftan, kaftanKoyu: '#3f6232', kusak: ALTIN, cizme: '#7b5236', salvar: '#6e5b45', ekipman })}
    <path d="M42 50 Q34 74 39 96 Q44 97 48 95 L50 56 Q47 50 42 50 Z" fill="${hacim(hirka)}"/>
    <path d="M78 50 Q86 74 81 96 Q76 97 72 95 L70 56 Q73 50 78 50 Z" fill="${hacim(hirka)}"/>
    <path d="M40.5 92 Q44 95 48 93.5 M79.5 92 Q76 95 72 93.5" fill="none" stroke="${ALTIN}" stroke-width="1.4"/>
    ${kol('M73 50 Q84 48 90 54 L88 63 Q80 59 74 62 Z', hirka, [91, 58])}
    <path d="M86.5 55.5 L96 57 M86 60.5 L95.5 62" stroke-width="1.2" opacity=".6"/>
    ${silah === 'efsanevi' ? `<circle cx="93" cy="19" r="15" fill="${isilti(acik(tas, 0.35))}" stroke="none" opacity=".9"/>` : ''}
    <circle cx="93" cy="19" r="5.6" fill="${kure(silah === 'efsanevi' ? acik(tas, 0.25) : tas)}"/>
    ${silah === 'efsanevi' ? pirilti(96, 15.5, 2) : ''}
    <path d="M89 23 Q93 26 97 23" fill="none" stroke="${ALTIN}" stroke-width="2"/>
    <path d="M96 25 Q100 33 98 40 M98 25 Q103 31 101.5 37" fill="none" stroke="#d9483b" stroke-width="1.6"/>
    ${bas({ sac: '#5b3a24', sakal: true, biyik: true, kas: '#5b3a24' })}
    <path d="M50 27 Q49 3 60 0 Q71 3 70 27 Z" fill="${hacim('#d8c29a')}"/>
    <path d="M55 26 Q54 8 60 2 M65 26 Q66 8 60 2" fill="none" stroke="${koyu('#d8c29a', 0.2)}" stroke-width="1"/>
    ${parlak('M53 23 Q52 10 57 4', 0.5)}
    <path d="M48.5 23.5 Q60 21 71.5 23.5 L71.5 28.5 Q60 26 48.5 28.5 Z" fill="${hacim('#3f6232')}"/>
    <path d="M50 26 Q60 23.5 70 26" fill="none" stroke="${ALTIN}" stroke-width="1"/>`;
}

// Bacı: Bacıyân-ı Rûm'dan bir yiğit kadın. Oyalı yazma, erik rengi entari, şalvar ve
// kuşakta taş kesesi; kaldırdığı elinde döndürdüğü sapan. Sapan ipi nadirde bölge
// renginde, efsanevide altın; taşı efsanevide ışıl ışıl.
function baci(ekipman) {
  const kaftan = '#7e4a8a';
  const yazma = '#d9483b';
  const silah = ekipman.silah?.nadirlik;
  const ip = { nadir: ekipman.silah?.renk, efsanevi: ALTIN }[silah] ?? '#9e7b54';
  const tas = silah === 'efsanevi' ? acik(ekipman.silah.renk, 0.3) : '#8a8f96';
  return `${golge()}${efsaneHalesi(ekipman)}
    <path d="M47 34 Q38 50 41 66 Q45 64 48 66 L52 44 Z" fill="${hacim(yazma)}"/>
    ${govde({ kaftan, kaftanKoyu: '#57305f', kusak: '#e08a3a', salvar: '#3b2f5c', cizme: '#7b5236', ekipman })}
    <ellipse cx="44.5" cy="79" rx="4.2" ry="5" fill="${hacim('#9e6b3a')}"/>
    <path d="M42 75 Q44.5 73 47 75" fill="none" stroke="${ALTIN}" stroke-width="1.2"/>
    ${kol('M44 52 Q38 60 40 70 L46 70.5 Q46 62 50 56 Z', kaftan, [43, 71])}
    ${kol('M71 49 Q80 44 86 38 L90.5 43 Q83 50 75 57 Z', kaftan, [89, 39])}
    <path d="M84 15 A 17 17 0 0 1 113 29" fill="none" stroke="#fffaf0" stroke-width="1.4" stroke-dasharray="2 3" opacity=".7"/>
    ${silah === 'efsanevi' ? `<path d="M89 37 Q97 30 100 17 M90 38 Q100 31 102 18" fill="none" stroke="${EFSANE_ISIGI}" stroke-width="5" opacity=".45"/>` : ''}
    <path d="M89 37 Q97 30 100 17 M90 38 Q100 31 102 18" fill="none" stroke="${CIZGI_KOYU}" stroke-width="2.6"/>
    <path d="M89 37 Q97 30 100 17 M90 38 Q100 31 102 18" fill="none" stroke="${ip}" stroke-width="1.3"/>
    <ellipse cx="101" cy="16.5" rx="4.2" ry="3" fill="${hacim(koyu(ip, 0.15))}" transform="rotate(-20 101 16.5)" stroke-width="1.2"/>
    ${silah === 'efsanevi' ? `<circle cx="101" cy="14.6" r="6" fill="${isilti(tas)}" stroke="none"/>` : ''}
    <circle cx="101" cy="14.8" r="2.3" fill="${kure(tas)}" stroke-width="1"/>
    ${silah === 'efsanevi' ? pirilti(105, 11, 1.8) : ''}
    ${bas({ sac: '#3a2418', kas: '#3a2418' })}
    <path d="M46 37 Q43 17 61 17.5 Q77 18 75 36 Q71 25.5 61 24.5 Q51 25 46 37 Z" fill="${hacim(yazma)}"/>
    <path d="M46 36 Q42 47 49 53 L54 44 L52 36 Z" fill="${hacim(yazma)}"/>
    <path d="M47.5 34 Q50 26 61 25 Q71 25.5 74 33" fill="none" stroke="${ALTIN}" stroke-width="1.4" stroke-dasharray="1.6 1.6"/>
    <path d="M51 21.5 l1.6 1.6 M57 19.5 l1.6 1.6 M64 19.5 l1.6 1.6 M70 21.5 l1.6 1.6" stroke="#f7efdc" stroke-width="1.3"/>
    ${parlak('M50 29 Q51 22 57 19.5', 0.4)}`;
}

const cizimler = { akinci, kemankes, alperen, baci };

export const SINIF_CIZIMLERI = Object.keys(cizimler);

// Sınıfın SVG çizimi (HTML metni). `ekipman`: ekipmanGorunumu(); verilmezse yalın figür.
export function sinifCizimi(sinif, { ekipman = {}, ...secenekler } = {}) {
  return svgSar(cizimler[sinif](ekipman), { sinif: 'cizim cizim-oyuncu', ...secenekler });
}

// Oyuncunun kuşandıklarıyla birlikte çizimi.
export function oyuncuCizimi(oyuncu, secenekler = {}) {
  return sinifCizimi(oyuncu.sinif, { ...secenekler, ekipman: ekipmanGorunumu(oyuncu.kusanilan) });
}

// Meydanda dolaşan halk (köylüler): sade kıyafetler, başlarında kasket, yazma ya da
// keçe börk; kimi bıyıklı, kimi sakallı, kiminin elinde sepet ya da testi.
// `tur`: 0 … 5 (gezinti.js → HALK_TURLERI).
const HALK = [
  { kaftan: '#6b7f99', kaftanKoyu: '#4a5a70', kusak: '#d4a537', bas: 'kasket', basRenk: '#5b4a3a', biyik: true, tasir: 'sepet' },
  { kaftan: '#b0564a', kaftanKoyu: '#7e3a31', kusak: '#f7efdc', bas: 'yazma', basRenk: '#f0c75e', tasir: 'testi' },
  { kaftan: '#5f8a4a', kaftanKoyu: '#43663a', kusak: '#9e6b3a', bas: 'bork', basRenk: '#9a7b5a', sakal: true },
  { kaftan: '#8a6a9e', kaftanKoyu: '#5e4870', kusak: '#e8e1d2', bas: 'yazma', basRenk: '#ffffff', tasir: 'sepet' },
  { kaftan: '#c98f3a', kaftanKoyu: '#94662a', kusak: '#1b2a5c', bas: 'kasket', basRenk: '#3a3a44', biyik: true },
  { kaftan: '#3f8f8f', kaftanKoyu: '#2a6a6a', kusak: '#d9483b', bas: 'bork', basRenk: '#6e5b45', tasir: 'testi' },
];

const TASINAN = {
  sepet: `<path d="M82 62 Q82 52 90 52 Q98 52 98 62" fill="none" stroke="#7b5236" stroke-width="2.4"/>
    <path d="M80 62 h20 l-3 11 h-14 z" fill="${hacim('#c98f3a')}"/>
    <path d="M81.5 66 h17 M82.5 69.5 h15" stroke="#7b5236" stroke-width="1"/>
    <circle cx="86" cy="60.5" r="3" fill="${kure('#d9483b')}" stroke-width="1.2"/><circle cx="92" cy="60" r="3" fill="${kure('#e08a3a')}" stroke-width="1.2"/>`,
  testi: `<path d="M88 56 Q83 60 84 68 Q85 74 91 74 Q97 74 98 68 Q99 60 94 56 L94 52 L88 52 Z" fill="${kure('#c9683b')}"/>
    <path d="M87 51 h8" stroke-width="2.6"/><path d="M85 64 Q91 66 97 64" fill="none" stroke="#f7efdc" stroke-width="1.2"/>`,
};

export function halkCizimi(tur) {
  const h = HALK[tur % HALK.length];
  const kadin = h.bas === 'yazma';
  const basOrtusu = {
    kasket: `<path d="M47 30 Q49 17.5 61 18.5 Q73 19.5 73.5 30 Z" fill="${hacim(h.basRenk)}"/>
      <path d="M68 28.5 L81 29.5 Q78 32.5 72 32 Z" fill="${hacim(h.basRenk)}"/>
      ${parlak('M51 26 Q53 21 59 20.5', 0.35)}`,
    yazma: `<path d="M46 37 Q43 17 61 17.5 Q77 18 75 36 Q71 25.5 61 24.5 Q51 25 46 37 Z" fill="${hacim(h.basRenk)}"/>
      <path d="M46 36 Q42 47 49 53 L54 44 L52 36 Z" fill="${hacim(h.basRenk)}"/>
      <path d="M50 22 l2 2 M56 19.5 l2 2 M63 19.5 l2 2 M70 22 l2 2" stroke="#d9483b" stroke-width="1.4"/>
      <path d="M48 33 Q50 27 55 24.5" fill="none" stroke="#d9483b" stroke-width="1" stroke-dasharray="1 2"/>`,
    bork: `<path d="M49 27 L50.5 12 Q60 8.5 69.5 12 L71 27 Z" fill="${hacim(h.basRenk)}"/>
      <path d="M48.5 24 Q60 21.5 71.5 24 L71.5 28 Q60 25.5 48.5 28 Z" fill="${hacim(koyu(h.basRenk, 0.25))}"/>`,
  }[h.bas];
  const tasinan = h.tasir ? TASINAN[h.tasir] : '';
  const elKolu = h.tasir
    ? `${kol('M72 50 Q82 50 86 58 L82 64 Q78 58 73 60 Z', h.kaftan, [84, 60])}`
    : `${kol('M72 50 Q80 54 80 66 L74 68 Q73 60 71 57 Z', h.kaftan, [77, 69])}`;
  return svgSar(`${golge(24)}${govde({ ...h, salvar: kadin ? h.kaftanKoyu : '#5b4a3a' })}${elKolu}${tasinan}
    ${bas({ sac: kadin ? '#5b3a24' : '#3a2a1e', biyik: h.biyik, sakal: h.sakal })}${basOrtusu}`, { sinif: 'cizim cizim-halk' });
}

// Seyyar tüccar: sırtında kilim desenli büyük bir yük ve asılı bakır kaplar, elinde
// fenerli asa; başında geniş sarık.
export function tuccarCizimi() {
  return svgSar(`${golge(30)}
    <path d="M21 42 Q12 56 16 86 Q32 94 45 86 L47 50 Z" fill="${hacim('#b0564a')}"/>
    <path d="M18 56 L45 62 L45 72 L17 66 Z" fill="${hacim('#1b2a5c')}" stroke-width="1.4"/>
    <path d="M21 61 l3 -3 l3 3 l-3 3 z M29 63 l3 -3 l3 3 l-3 3 z M37 64.5 l3 -3 l3 3 l-3 3 z" fill="${ALTIN}" stroke="none"/>
    <path d="M17 74 L45 79 M18 80 L45 84" stroke="#7e3a31" stroke-width="2" fill="none"/>
    <path d="M21 42 Q28 37 45 45 L47 51 L19 56 Z" fill="${hacim('#d9483b')}"/>
    <path d="M24 44 Q34 41 44 47" fill="none" stroke="${ALTIN}" stroke-width="1.4" stroke-dasharray="2 2"/>
    <circle cx="27" cy="44" r="4" fill="${kure(ALTIN)}"/>
    <path d="M14 82 Q10 86 12 92 Q16 96 21 92 Q22 86 18 82 Z" fill="${kure('#c9683b')}" stroke-width="1.6"/>
    <path d="M14 82 h5" stroke-width="2.2"/>
    ${govde({ kaftan: '#c98f3a', kaftanKoyu: '#94662a', kusak: '#1b2a5c', cizme: '#5b3a24', salvar: '#5b3a24' })}
    <path d="M44 48 L50 60 M45 54 L48 64" stroke="#5b3a24" stroke-width="2.4"/>
    ${kol('M72 50 Q82 50 88 56 L86 63 Q79 59 73 61 Z', '#c98f3a', [91, 59])}
    <path d="M93 105 L95 26" stroke-width="6.4"/><path d="M93 105 L95 26" stroke="#5b3a24" stroke-width="3.8"/>
    <path d="M95 27 Q104 26 104 34" fill="none" stroke="#2b2620" stroke-width="1.6"/>
    <path d="M100 34 h8 l-1 3 h-6 z" fill="${metal('#9e6b3a')}" stroke-width="1.2"/>
    <rect x="100.5" y="37" width="7" height="9" rx="1.5" fill="${isilti('#f2c94c')}" stroke-width="1.4"/>
    <circle cx="104" cy="41.5" r="9" fill="${isilti('#f2c94c')}" stroke="none" opacity=".6"/>
    <path d="M100 46 h8 l-1 2.5 h-6 z" fill="${metal('#9e6b3a')}" stroke-width="1.2"/>
    ${bas({ biyik: true })}
    <path d="M45.5 31 Q45 13.5 60.5 11.5 Q75.5 13.5 75 31 Q60 23 45.5 31 Z" fill="${hacim('#f7efdc')}"/>
    <path d="M49 20 Q60 16 72 21 M47 26 Q60 20 74 26" fill="none" stroke="${koyu('#f7efdc', 0.2)}" stroke-width="1.2"/>
    <path d="M45 30.5 Q60 23.5 75.5 30.5 L75.5 35 Q60 28.5 45 35 Z" fill="${hacim('#2aa7a7')}"/>
    <circle cx="65" cy="16" r="2.2" fill="${kure('#d9483b')}" stroke-width="1.2"/>`, { sinif: 'cizim cizim-halk cizim-tuccar' });
}

// Yankesici: koyu, yamalı bir kaftan, yüzünün altını örten peçe, başında atkı; bir
// elinde kısa bir sopa, kuşağında aşırdığı kese. Düşman olduğu için sola (oyuncuya)
// dönük çizilir: `renk` { ana, koyu, acik, goz } — dusmanlar.js çizim eşlemesinden gelir.
export function yankesiciBedeni(renk) {
  const kaftan = renk.ana;
  return `${golge(26)}<g transform="translate(120 0) scale(-1 1)">
    ${govde({ kaftan, kaftanKoyu: renk.koyu, kusak: '#7b5236', cizme: '#3a2a1e', ic: renk.acik, serit: '#9e6b3a', salvar: '#3a3a44' })}
    <path d="M47 77 l4 -2 l1 5 l-4 1 z M71 60 l5 -1 l0.5 4.5 l-5 .5 z" fill="${hacim(koyu(kaftan, 0.25))}" stroke-width="1"/>
    <path d="M41 74 Q36 80 39 86 Q44 90 48 85 Q50 79 45 74 Z" fill="${kure('#c9a24a')}" stroke-width="1.6"/>
    <path d="M40.5 75 h6" stroke="#7b5236" stroke-width="2"/>
    <circle cx="43.5" cy="81" r="1.2" fill="#fff" stroke="none" opacity=".7"/>
    ${kol('M72 50 Q82 50 87 57 L83 63 Q78 58 73 60 Z', kaftan, [85, 60])}
    <path d="M84 63 L95 40" stroke-width="7"/><path d="M84 63 L95 40" stroke="#6e4a2e" stroke-width="4.6"/>
    <path d="M93 44 L97 36" stroke="#5b3a24" stroke-width="5.6"/>
    ${parlak('M87 57 L94 42', 0.3)}
    ${bas({ sac: '#2b2620', kas: '#2b2620' })}
    <path d="M58.5 35.5 Q61 44 70 45 Q76 43 77 36 Q70 38 64 37 Z" fill="${hacim(renk.koyu)}" stroke-width="1.6"/>
    <path d="M62 39 Q68 41.5 75 39" fill="none" stroke="${acik(renk.koyu, 0.35)}" stroke-width="1" opacity=".8"/>
    <path d="M46 34 Q43 17 61 16.5 Q77 17 75.5 30 Q69 23.5 60 24 Q50 25.5 46 34 Z" fill="${hacim(renk.koyu)}"/>
    <path d="M47 33 Q41 40 43 50 L49 47 L50 36 Z" fill="${hacim(renk.koyu)}"/>
    <path d="M51 21 Q60 18 70 21" fill="none" stroke="${acik(renk.koyu, 0.3)}" stroke-width="1.2" opacity=".7"/>
    <path d="M62.5 28.5 l5 1.4 M69 29.8 l4 -1.2" stroke="#2b2620" stroke-width="1.8"/>
  </g>`;
}

// Alperen'in yoldaşı mürit: sakalsız genç bir derviş; kısa külah, kahve hırka, elinde
// su testisi. Yoldaş çizimi olarak küçük gösterilir (yoldaslar.js).
export function muritIcerigi() {
  return `${golge(24)}
    ${govde({ kaftan: '#8a6a4a', kaftanKoyu: '#5e4632', kusak: '#5f8a4a', salvar: '#6e5b45', cizme: '#7b5236' })}
    ${kol('M72 50 Q82 50 86 58 L82 64 Q78 58 73 60 Z', '#8a6a4a', [84, 60])}${TASINAN.testi}
    ${bas({ sac: '#5b3a24', kas: '#5b3a24' })}
    <path d="M50 27 Q50 9 60 6 Q70 9 70 27 Z" fill="${hacim('#e8dcc0')}"/>
    <path d="M48.5 23.5 Q60 21 71.5 23.5 L71.5 28.5 Q60 26 48.5 28.5 Z" fill="${hacim('#5f8a4a')}"/>`;
}
