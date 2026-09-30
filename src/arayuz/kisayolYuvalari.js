// Savaş kısayol yuvalarının ortak arayüz parçaları: dört yuva düğmesi ve bir yuvaya
// konacak şeyin seçildiği liste. Savaş ekranı ve karakter ekranı kullanır.
import { yemekler } from '../veri/yemekler.js';
import { metinler } from '../veri/metinler.js';
import { yetenekBul } from '../oyun/savas.js';
import { acikYetenekler } from '../oyun/karakter.js';
import { yemekAdedi } from '../oyun/envanter.js';
import { KISAYOL_YUVA, ayniKisayolMu } from '../oyun/kisayollar.js';
import { kacis, sablon } from './bilesenler.js';

const K = metinler.kisayol;

// Yuva içeriğinin görünüşü: { ikon, ad, alt }.
export function kisayolBilgisi(icerik, { sinif, heybe = [] }) {
  if (!icerik) return { ikon: '＋', ad: K.bos, alt: '' };
  switch (icerik.tur) {
    case 'saldir': return { ikon: '⚔️', ad: metinler.savas.saldir, alt: '' };
    case 'kac': return { ikon: '🏃', ad: metinler.savas.kac, alt: '' };
    case 'yetenek': {
      const y = yetenekBul(sinif, icerik.anahtar);
      return { ikon: '✨', ad: y?.ad ?? '?', alt: y ? sablon(metinler.karakter.yetenekNefes, { nefes: y.nefes }) : '' };
    }
    case 'yemek': {
      const y = yemekler[icerik.anahtar];
      return { ikon: y.ikon, ad: y.ad, alt: `×${yemekAdedi(heybe, icerik.anahtar)}` };
    }
    default: return { ikon: '?', ad: '?', alt: '' };
  }
}

// İçeriği data özniteliğine yazmak ve geri okumak için: 'saldir', 'yetenek:kilic_darbesi', 'bos'…
export const icerikKodu = (icerik) => (icerik ? [icerik.tur, icerik.anahtar].filter(Boolean).join(':') : 'bos');
export function koddanIcerik(kod) {
  if (!kod || kod === 'bos') return null;
  const [tur, anahtar] = kod.split(':');
  return anahtar ? { tur, anahtar } : { tur };
}

// Dört yuva düğmesi. `kullanilir(icerik, sira)` → yuva şu an kullanılabilir mi
// (verilmezse hepsi açık). `secili`: vurgulanan yuva.
export function yuvaDugmeleri(kisayollar, { sinif, heybe, kullanilir = () => true, secili = null }) {
  return kisayollar.map((icerik, i) => {
    const b = kisayolBilgisi(icerik, { sinif, heybe });
    const acik = kullanilir(icerik, i);
    const etiket = sablon(K.yuvaEtiketi, { tus: i + 1, ad: b.ad });
    return `
      <button class="kisayol-yuvasi${icerik ? '' : ' bos'}${secili === i ? ' secili' : ''}" data-kisayol="${i}"
              ${acik ? '' : 'aria-disabled="true"'} aria-label="${kacis(etiket)}" title="${kacis(etiket)}" aria-keyshortcuts="${i + 1}">
        <kbd class="kisayol-tusu">${i + 1}</kbd>
        <span class="kisayol-ikon" aria-hidden="true">${b.ikon}</span>
        <span class="kisayol-ad">${kacis(b.ad)}</span>
        ${b.alt ? `<small class="kisayol-alt">${kacis(b.alt)}</small>` : ''}
      </button>`;
  }).join('');
}

// Bir yuvaya konabilecekler: Saldır, Kaç, açık yetenekler ve heybedeki yemekler
// (yuvadaki yemek heybede kalmasa da listede durur).
export function secimListesi(oyuncu, heybe, kisayollar, sira) {
  const mevcut = kisayollar[sira];
  const secenekler = [{ tur: 'saldir' }, { tur: 'kac' }, ...acikYetenekler(oyuncu).map((y) => ({ tur: 'yetenek', anahtar: y.anahtar }))];
  const yemekAnahtarlari = [...new Set([...heybe.map((h) => h.anahtar), ...kisayollar.filter((k) => k?.tur === 'yemek').map((k) => k.anahtar)])];
  secenekler.push(...yemekAnahtarlari.map((anahtar) => ({ tur: 'yemek', anahtar })));
  const satirlar = secenekler.map((icerik) => {
    const b = kisayolBilgisi(icerik, { sinif: oyuncu.sinif, heybe });
    const baskaYuva = kisayollar.findIndex((k, i) => i !== sira && ayniKisayolMu(k, icerik));
    const not = baskaYuva >= 0 ? sablon(K.baskaYuvada, { tus: baskaYuva + 1 }) : b.alt;
    return `
      <li><button class="secenek${ayniKisayolMu(mevcut, icerik) ? ' secili' : ''}" data-kisayol-icerik="${icerikKodu(icerik)}">
        <span class="secenek-ust"><strong><span aria-hidden="true">${b.ikon}</span> ${kacis(b.ad)}</strong>
          <span class="secenek-bedel">${kacis(not)}</span></span>
      </button></li>`;
  }).join('');
  return `
    <p class="kisayol-soru">${sablon(K.sec, { tus: sira + 1 })}</p>
    <ul class="secenek-listesi kisayol-secenekleri">${satirlar}
      ${mevcut ? `<li><button class="secenek" data-kisayol-icerik="bos"><span class="secenek-ust"><strong>✕ ${K.bosalt}</strong></span></button></li>` : ''}
    </ul>`;
}

export { KISAYOL_YUVA };
