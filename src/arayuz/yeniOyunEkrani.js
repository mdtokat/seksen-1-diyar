// Yeni oyun ekranı: oyuncu adını girer ve üç sınıftan birini seçer.
import { siniflar } from '../veri/siniflar.js';
import { metinler } from '../veri/metinler.js';
import { AD_EN_FAZLA, VARSAYILAN_AD, STATLAR, varsayilanAd } from '../oyun/karakter.js';
import { kacis, sablon } from './bilesenler.js';
import { sinifCizimi } from './cizimler/karakterler.js';

const M = metinler.yeniOyun;

function sinifKarti(anahtar, sinif) {
  const statSatirlari = STATLAR.map(
    (s) => `<div><dt>${metinler.statAdlari[s]}</dt><dd>${sinif.baslangic[s]}</dd></div>`,
  ).join('');
  return `
    <button type="button" class="sinif-karti" data-sinif="${anahtar}" aria-pressed="false"
            aria-label="${kacis(sablon(M.sinifSec, { sinif: sinif.ad }))}">
      <span class="sinif-ikon">${sinifCizimi(anahtar)}</span>
      <span class="sinif-ad">${kacis(sinif.ad)}</span>
      <span class="sinif-tarif">${kacis(sinif.tarif)}</span>
      <span class="sinif-pasif">✦ ${kacis(sablon(M.pasif, { ad: sinif.pasif.ad }))}
        <span class="sinif-pasif-aciklama">${kacis(sinif.pasif.aciklama)}</span></span>
      <dl class="stat-tablosu">${statSatirlari}</dl>
    </button>`;
}

// Ekranı `kap` içine kurar. olustur({ ad, sinif }) karakter oluşturulunca çağrılır.
export function yeniOyunEkrani(kap, { olustur, geri } = {}) {
  kap.innerHTML = `
    <div class="sayfa-ekrani yeni-oyun-ekrani">
      <header class="ust-cubuk">
        <button class="simge-buton" data-eylem="geri" aria-label="${M.geri}" title="${M.geri}">←</button>
        <h1 class="ust-baslik">${M.baslik}</h1>
      </header>
      <main class="sayfa-icerik">
        <form class="yeni-oyun-formu" novalidate>
          <label class="alan">
            <span class="alan-etiket">${M.adEtiketi}</span>
            <input class="metin-kutusu" name="ad" type="text" maxlength="${AD_EN_FAZLA}"
                   placeholder="${VARSAYILAN_AD}" autocomplete="off" spellcheck="false" />
            <small class="alan-ipucu">${sablon(M.adIpucu, { ad: VARSAYILAN_AD })}</small>
          </label>
          <fieldset class="sinif-secimi">
            <legend class="alan-etiket">${M.sinifBasligi}</legend>
            <div class="sinif-listesi">
              ${Object.entries(siniflar).map(([a, s]) => sinifKarti(a, s)).join('')}
            </div>
          </fieldset>
          <p class="secim-uyarisi" aria-live="polite">${M.secimYok}</p>
          <button class="buton buton-ana" type="submit" disabled>${M.baslat}</button>
        </form>
      </main>
    </div>`;

  const form = kap.querySelector('.yeni-oyun-formu');
  const baslat = form.querySelector('[type="submit"]');
  const uyari = form.querySelector('.secim-uyarisi');
  let secilen = null;

  form.addEventListener('click', (e) => {
    const kart = e.target.closest('.sinif-karti');
    if (!kart) return;
    secilen = kart.dataset.sinif;
    for (const k of form.querySelectorAll('.sinif-karti')) {
      k.setAttribute('aria-pressed', String(k === kart));
    }
    baslat.disabled = false;
    uyari.hidden = true;
    // Boş ad yerine geçecek ad, seçilen sınıfa göre (ör. Bacı'da Fatma)
    const ad = varsayilanAd(secilen);
    form.elements.ad.placeholder = ad;
    form.querySelector('.alan-ipucu').textContent = sablon(M.adIpucu, { ad });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!secilen) return;
    olustur?.({ ad: form.elements.ad.value, sinif: secilen });
  });

  kap.querySelector('[data-eylem="geri"]').addEventListener('click', () => geri?.());
}
