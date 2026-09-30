// Heybe ekranı: yemekler ikon, ad, açıklama ve etkiyle listelenir; savaş dışında yenebilir.
import { yemekler } from '../veri/yemekler.js';
import { metinler } from '../veri/metinler.js';
import { statlar } from '../oyun/karakter.js';
import { yemekGucu, yemekYe, yemekYeKontrol, HEYBE_YUVA } from '../oyun/envanter.js';
import { kacis, sablon, degerCubugu, bildirimGoster } from './bilesenler.js';

const M = metinler.envanter;
const turAdi = (tur) => metinler.statAdlari[tur].toLocaleLowerCase('tr');

function icerik(durum) {
  const o = durum.oyuncu;
  const s = statlar(o);
  const satirlar = durum.heybe.map((yuva, sira) => {
    const y = yemekler[yuva.anahtar];
    const kontrol = yemekYeKontrol(durum, yuva.anahtar);
    const not = kontrol.neden === 'dolu' ? (y.tur === 'can' ? M.doluCan : M.doluNefes) : '';
    return `
      <li class="heybe-yuvasi heybe-${y.tur}">
        <span class="heybe-ikon" aria-hidden="true">${y.ikon}<span class="heybe-adet">${yuva.adet}</span></span>
        <div class="heybe-bilgi">
          <strong>${kacis(y.ad)}</strong>
          <span class="heybe-etki">${sablon(M.etki, { miktar: yemekGucu(yuva.anahtar), tur: turAdi(y.tur) })}</span>
          <small>${kacis(not || y.aciklama)}</small>
        </div>
        <button class="buton buton-kucuk" data-sira="${sira}" ${kontrol.olur ? '' : 'disabled'}
                aria-label="${kacis(sablon(M.yeAciklama, { yemek: y.ad }))}">${M.ye}</button>
      </li>`;
  }).join('');

  return `
    <section class="kart">
      <div class="cubuk-grubu">
        ${degerCubugu(o.can, s.can, { etiket: metinler.statAdlari.can, renk: 'var(--mercan)' })}
        ${degerCubugu(o.nefes, s.nefes, { etiket: metinler.statAdlari.nefes, renk: 'var(--turkuaz)' })}
      </div>
    </section>
    <section class="kart">
      <h3>${M.baslik} <small class="yuva-sayaci">${sablon(M.yuva, { dolu: durum.heybe.length, toplam: HEYBE_YUVA })}</small></h3>
      ${durum.heybe.length ? `<ul class="heybe-listesi">${satirlar}</ul>` : `<p class="bos-not">${M.bos}</p>`}
    </section>`;
}

// Ekranı `kap` içine kurar. Temizlik fonksiyonu döndürür.
export function envanterEkrani(kap, depo, { geri } = {}) {
  kap.innerHTML = `
    <div class="sayfa-ekrani envanter-ekrani">
      <header class="ust-cubuk">
        <button class="simge-buton" data-eylem="geri" aria-label="${M.geri}" title="${M.geri}">←</button>
        <h1 class="ust-baslik">🎒 ${M.baslik}</h1>
      </header>
      <main class="sayfa-icerik" aria-live="polite"></main>
    </div>`;

  const ekran = kap.querySelector('.envanter-ekrani');
  const alan = ekran.querySelector('.sayfa-icerik');
  const ciz = (durum) => {
    alan.innerHTML = icerik(durum);
  };

  ekran.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.eylem === 'geri') return geri?.();
    if (b.dataset.sira === undefined) return;
    const durum = depo.al();
    const anahtar = durum.heybe[Number(b.dataset.sira)]?.anahtar;
    if (!anahtar) return;
    const r = yemekYe(durum, anahtar);
    if (r.durum === durum) return;
    depo.ayarla(r.durum);
    bildirimGoster(ekran, sablon(M.yedin, { yemek: yemekler[anahtar].ad, miktar: r.miktar, tur: turAdi(r.tur) }));
  });

  const aboneliktenCik = depo.abone(ciz);
  ciz(depo.al());
  return aboneliktenCik;
}
