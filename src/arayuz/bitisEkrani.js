// Bitiş sahnesi (plan.md Faz 10): Zülmet yenilince hikâyeyi kapatan metin, yolculuğun
// özeti ve 81 ilin arınma durumu. Oyuncu ardından yolculuğa devam edebilir.
import { iller } from '../veri/iller.js';
import { bolgeler } from '../veri/bolgeler.js';
import { gorevler } from '../veri/gorevler.js';
import { yemekler } from '../veri/yemekler.js';
import { basarimlar } from '../veri/basarimlar.js';
import { metinler } from '../veri/metinler.js';
import { arinmaYuzdesi } from '../oyun/ilerleme.js';
import { hayirPuani, itibarKademesi } from '../oyun/itibar.js';
import { kacis, sablon } from './bilesenler.js';
import { sinifCizimi } from './cizimler/karakterler.js';

const M = metinler.bitis;

function ozetKutusu(durum) {
  const o = durum.oyuncu;
  const arinan = iller.filter((il) => arinmaYuzdesi(durum, il.plaka) >= 100).length;
  const tamam = Object.keys(gorevler).filter((a) => durum.gorevler?.[a]?.durum === 'tamam').length;
  const kutular = [
    [M.seviye, o.seviye],
    [M.zafer, durum.istatistik?.zafer ?? 0],
    [M.bayilma, durum.istatistik?.bayilma ?? 0],
    [M.arinan, `${arinan}/${iller.length}`],
    [M.gorev, `${tamam}/${Object.keys(gorevler).length}`],
    [M.yemek, `${(durum.toplananYemekler ?? []).length}/${Object.keys(yemekler).length}`],
    [M.basarim, `${(durum.basarimlar ?? []).length}/${Object.keys(basarimlar).length}`],
    [M.hayir, `${hayirPuani(durum)} · ${itibarKademesi(durum).ad}`],
  ];
  return `<dl class="ozet-izgarasi">${kutular.map(([ad, deger]) =>
    `<div><dt>${ad}</dt><dd>${kacis(deger)}</dd></div>`).join('')}</dl>`;
}

// Bölge bölge 81 il: arınmış iller ✓ ile, diğerleri yüzdeleriyle.
function ilOzeti(durum) {
  return bolgeler.map((b) => {
    const bIller = iller.filter((il) => il.bolge === b.anahtar).sort((x, y) => x.ad.localeCompare(y.ad, 'tr'));
    return `
      <section class="bitis-bolge" style="--bolge-rengi:${b.renk}">
        <h3><span class="bolge-noktasi" style="background:${b.renk}"></span>${kacis(b.ad)}</h3>
        <ul class="il-ozeti">${bIller.map((il) => {
          const y = arinmaYuzdesi(durum, il.plaka);
          return `<li class="${y >= 100 ? 'arinmis' : ''}" title="${kacis(sablon(M.ilSatiri, { il: il.ad, yuzde: y }))}">
            <span>${kacis(il.ad)}</span><small>${y >= 100 ? '✓' : `%${y}`}</small></li>`;
        }).join('')}</ul>
      </section>`;
  }).join('');
}

// Ekranı `kap` içine kurar. secenekler: { devam }
export function bitisEkrani(kap, depo, { devam } = {}) {
  const durum = depo.al();
  const o = durum.oyuncu;
  kap.innerHTML = `
    <div class="sayfa-ekrani bitis-ekrani">
      <main class="sayfa-icerik">
        <section class="kart bitis-karti">
          <span class="bitis-ikon">${sinifCizimi(o.sinif)}</span>
          <h1>${M.baslik}</h1>
          ${M.hikaye.map((p) => `<p>${kacis(sablon(p, { ad: o.ad }))}</p>`).join('')}
        </section>
        <section class="kart">
          <h2>${M.ozet}</h2>
          ${ozetKutusu(durum)}
        </section>
        <section class="kart">
          <h2>${M.iller}</h2>
          ${ilOzeti(durum)}
        </section>
        <section class="kart">
          <p>${M.devamNotu}</p>
          <button class="buton buton-ana buton-genis" data-eylem="devam">${M.devam}</button>
        </section>
      </main>
    </div>`;
  kap.querySelector('[data-eylem="devam"]').addEventListener('click', () => devam?.());
  kap.querySelector('h1').setAttribute('tabindex', '-1');
  kap.querySelector('h1').focus();
}
