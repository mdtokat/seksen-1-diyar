// Arasta: ilin yöresel yemeği ve komşu illerin yemekleri akçe karşılığı satılır.
import { iller } from '../veri/iller.js';
import { yemekler } from '../veri/yemekler.js';
import { metinler } from '../veri/metinler.js';
import { arastaMallari, arastaFiyati, yemekAl, yemekAlKontrol } from '../oyun/ticaret.js';
import { arastaIndirimi } from '../oyun/itibar.js';
import { yemekFiyati, oyuncuYemekGucu, yemekAdedi, HEYBE_YUVA } from '../oyun/envanter.js';
import { kacis, sablon, bildirimGoster } from './bilesenler.js';

const M = metinler.arasta;

function icerik(durum) {
  const satirlar = arastaMallari(durum.konum).map((anahtar) => {
    const y = yemekler[anahtar];
    const kontrol = yemekAlKontrol(durum, anahtar);
    const il = iller.find((i) => i.plaka === y.il);
    const etki = sablon(metinler.envanter.etki, {
      miktar: oyuncuYemekGucu(anahtar, durum.oyuncu),
      tur: metinler.statAdlari[y.tur].toLocaleLowerCase('tr'),
    });
    const fiyat = arastaFiyati(durum, anahtar);
    const eskiFiyat = fiyat < yemekFiyati(anahtar) ? `<s>${yemekFiyati(anahtar)}</s> ` : '';
    return `
      <li class="heybe-yuvasi heybe-${y.tur}">
        <span class="heybe-ikon" aria-hidden="true">${y.ikon}<span class="heybe-adet">${yemekAdedi(durum.heybe, anahtar)}</span></span>
        <div class="heybe-bilgi">
          <strong>${kacis(y.ad)} <small>(${kacis(il.ad)})</small></strong>
          <span class="heybe-etki">${etki} · ${eskiFiyat}${sablon(M.fiyat, { fiyat })}</span>
          <small>${kacis(kontrol.olur ? y.aciklama : M.neden[kontrol.neden] ?? y.aciklama)}</small>
        </div>
        <button class="buton buton-kucuk" data-yemek="${anahtar}" ${kontrol.olur ? '' : 'disabled'}>${M.al}</button>
      </li>`;
  }).join('');
  const indirim = arastaIndirimi(durum);
  return `
    <section class="kart">
      <p class="dukkan-selami">${M.selam}</p>
      ${indirim > 0 ? `<p class="kart-not arinmis-not">🌟 ${sablon(M.indirim, { oran: Math.round(indirim * 100) })}</p>` : ''}
      <p class="kese">🪙 ${sablon(M.akce, { akce: durum.akce })} · ${sablon(M.heybe, { dolu: durum.heybe.length, toplam: HEYBE_YUVA })}</p>
    </section>
    <section class="kart">
      <ul class="heybe-listesi">${satirlar}</ul>
    </section>`;
}

// Ekranı `kap` içine kurar. Temizlik fonksiyonu döndürür.
export function arastaEkrani(kap, depo, { geri } = {}) {
  const il = iller.find((i) => i.plaka === depo.al().konum);
  kap.innerHTML = `
    <div class="sayfa-ekrani arasta-ekrani">
      <header class="ust-cubuk">
        <button class="simge-buton" data-eylem="geri" aria-label="${M.geri}" title="${M.geri}">←</button>
        <h1 class="ust-baslik">🧺 ${M.baslik} <span class="ust-alt">${kacis(il.ad)}</span></h1>
      </header>
      <main class="sayfa-icerik" aria-live="polite"></main>
    </div>`;
  const ekran = kap.querySelector('.arasta-ekrani');
  const alan = ekran.querySelector('.sayfa-icerik');
  const ciz = (durum) => {
    alan.innerHTML = icerik(durum);
  };
  ekran.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.eylem === 'geri') return geri?.();
    if (b.dataset.yemek) {
      const once = depo.al();
      const sonra = yemekAl(once, b.dataset.yemek);
      if (sonra === once) return;
      depo.ayarla(sonra);
      bildirimGoster(ekran, sablon(M.aldin, { yemek: yemekler[b.dataset.yemek].ad }));
    }
  });
  const cik = depo.abone(ciz);
  ciz(depo.al());
  return cik;
}
