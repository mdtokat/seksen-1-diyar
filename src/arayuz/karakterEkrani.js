// Karakter ekranı: seviye, XP çubuğu, statlar, stat puanı dağıtma ve yetenekler.
import { siniflar, STAT_PUANI_DEGERI } from '../veri/siniflar.js';
import { metinler } from '../veri/metinler.js';
import { statlar, gerekenXp, statPuaniDagit, STATLAR } from '../oyun/karakter.js';
import { kacis, sablon, degerCubugu } from './bilesenler.js';
import { sinifCizimi } from './cizimler/karakterler.js';

const M = metinler.karakter;

function icerik(durum) {
  const o = durum.oyuncu;
  const sinif = siniflar[o.sinif];
  const s = statlar(o);
  const gereken = gerekenXp(o.seviye);
  const puanVar = o.statPuani > 0;

  const statSatirlari = STATLAR.map((stat) => {
    const ad = metinler.statAdlari[stat];
    const artis = STAT_PUANI_DEGERI[stat];
    const buton = puanVar
      ? `<button class="simge-buton puan-ver" data-stat="${stat}"
           aria-label="${kacis(sablon(M.puanVer, { stat: ad, artis }))}"
           title="${kacis(sablon(M.puanVer, { stat: ad, artis }))}">+</button>`
      : '';
    return `
      <li class="stat-satiri">
        <span class="stat-ad">${ad}</span>
        <span class="stat-deger">${s[stat]}</span>
        ${buton}
      </li>`;
  }).join('');

  const yetenekler = sinif.yetenekler.map((y) => {
    const acik = y.seviye <= o.seviye;
    return `
      <li class="yetenek-satiri${acik ? '' : ' kilitli'}">
        <div class="yetenek-ust">
          <strong>${acik ? '' : '🔒 '}${kacis(y.ad)}</strong>
          <span class="yetenek-bedel">${acik ? sablon(M.yetenekNefes, { nefes: y.nefes }) : sablon(M.yetenekKilitli, { seviye: y.seviye })}</span>
        </div>
        <p>${kacis(y.aciklama)}</p>
      </li>`;
  }).join('');

  return `
    <section class="kart karakter-ozet">
      <span class="karakter-ikon">${sinifCizimi(o.sinif)}</span>
      <div>
        <h2>${kacis(o.ad)}</h2>
        <p class="karakter-alt">${kacis(sinif.ad)} · <strong>${sablon(M.seviye, { seviye: o.seviye })}</strong> · ${M.akce}: ${durum.akce ?? 0}</p>
      </div>
    </section>
    <section class="kart">
      <h3>${M.xp}</h3>
      ${durum.sofra?.kalan > 0 ? `<p class="kart-not arinmis-not">🍽️ ${sablon(metinler.boss.sofraDurumu, { kalan: durum.sofra.kalan })}</p>` : ''}
      ${degerCubugu(o.xp, gereken, { etiket: 'XP', renk: 'var(--altin)' })}
      <div class="cubuk-grubu">
        ${degerCubugu(o.can, s.can, { etiket: metinler.statAdlari.can, renk: 'var(--mercan)' })}
        ${degerCubugu(o.nefes, s.nefes, { etiket: metinler.statAdlari.nefes, renk: 'var(--turkuaz)' })}
      </div>
    </section>
    <section class="kart">
      <h3>${M.statlar}</h3>
      <p class="stat-puani${puanVar ? ' var' : ''}">
        ${puanVar ? sablon(M.statPuani, { puan: o.statPuani }) : M.statPuaniYok}
      </p>
      <ul class="stat-listesi">${statSatirlari}</ul>
    </section>
    <section class="kart">
      <h3>${M.yetenekler}</h3>
      <ul class="yetenek-listesi">${yetenekler}</ul>
    </section>`;
}

// Ekranı `kap` içine kurar. Temizlik fonksiyonu döndürür.
export function karakterEkrani(kap, depo, { geri } = {}) {
  kap.innerHTML = `
    <div class="sayfa-ekrani karakter-ekrani">
      <header class="ust-cubuk">
        <button class="simge-buton" data-eylem="geri" aria-label="${M.geri}" title="${M.geri}">←</button>
        <h1 class="ust-baslik">${M.baslik}</h1>
      </header>
      <main class="sayfa-icerik" aria-live="polite"></main>
    </div>`;

  const alan = kap.querySelector('.sayfa-icerik');
  const ciz = (durum) => {
    alan.innerHTML = icerik(durum);
  };

  kap.querySelector('.karakter-ekrani').addEventListener('click', (e) => {
    const buton = e.target.closest('button');
    if (!buton) return;
    if (buton.dataset.eylem === 'geri') {
      geri?.();
    } else if (buton.dataset.stat) {
      const durum = depo.al();
      depo.ayarla({ ...durum, oyuncu: statPuaniDagit(durum.oyuncu, buton.dataset.stat) });
      alan.querySelector(`[data-stat="${buton.dataset.stat}"]`)?.focus();
    }
  });

  const aboneliktenCik = depo.abone(ciz);
  ciz(depo.al());
  return aboneliktenCik;
}
