// İl ekranı: bulunulan ilin adı, meşhur yemeği, arınma yüzdesi ve "Keşfe Çık".
import { iller } from '../veri/iller.js';
import { bolgeler } from '../veri/bolgeler.js';
import { yemekler } from '../veri/yemekler.js';
import { siniflar } from '../veri/siniflar.js';
import { metinler } from '../veri/metinler.js';
import { arinmaYuzdesi } from '../oyun/ilerleme.js';
import { statlar } from '../oyun/karakter.js';
import { yemekGucu, HEYBE_YUVA } from '../oyun/envanter.js';
import { kacis, sablon, ilerlemeCubugu, degerCubugu } from './bilesenler.js';

const M = metinler.ilEkrani;
const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const bolgeHaritasi = new Map(bolgeler.map((b) => [b.anahtar, b]));
const CAN_AZ_ORANI = 0.3;

function icerik(durum) {
  const il = ilHaritasi.get(durum.konum);
  const bolge = bolgeHaritasi.get(il.bolge);
  const yemek = yemekler[il.yemek];
  const yuzde = arinmaYuzdesi(durum, il.plaka);
  const o = durum.oyuncu;
  const s = statlar(o);
  const yemekEtkisi = sablon(metinler.envanter.etki, {
    miktar: yemekGucu(il.yemek),
    tur: metinler.statAdlari[yemek.tur].toLocaleLowerCase('tr'),
  });

  return `
    <section class="kart il-kimlik" style="--bolge-rengi:${bolge.renk}">
      <h2 class="il-ekrani-ad">${kacis(il.ad)} <span class="plaka">${String(il.plaka).padStart(2, '0')}</span></h2>
      <p class="kart-bolge"><span class="bolge-noktasi" style="background:${bolge.renk}"></span>${kacis(bolge.ad)}</p>
      <dl class="kart-bilgi">
        <div><dt>${M.seviye}</dt><dd>${sablon(metinler.harita.seviyeDegeri, { en_az: il.seviye[0], en_cok: il.seviye[1] })}</dd></div>
        <div><dt>${M.yemek}</dt><dd><span aria-hidden="true">${yemek.ikon}</span> ${kacis(yemek.ad)}
          <small>${kacis(yemek.aciklama)} (${yemekEtkisi})</small></dd></div>
        <div><dt>${M.arinma}</dt><dd>${ilerlemeCubugu(yuzde, { etiket: M.arinma, renk: 'var(--arinmis)' })}</dd></div>
      </dl>
      <p class="kart-not ${yuzde >= 100 ? 'arinmis-not' : 'bilgi-not'}">${yuzde >= 100 ? M.arinmis : M.arinmaIpucu}</p>
    </section>

    <section class="kart oyuncu-ozeti">
      <div class="oyuncu-ozeti-ust">
        <span aria-hidden="true">${siniflar[o.sinif].ikon}</span>
        <strong>${kacis(o.ad)}</strong>
        <span class="rozet">${sablon(metinler.karakter.seviye, { seviye: o.seviye })}</span>
        <span class="akce">🪙 ${sablon(M.akce, { akce: durum.akce })}</span>
      </div>
      <div class="cubuk-grubu">
        ${degerCubugu(o.can, s.can, { etiket: metinler.statAdlari.can, renk: 'var(--mercan)' })}
        ${degerCubugu(o.nefes, s.nefes, { etiket: metinler.statAdlari.nefes, renk: 'var(--turkuaz)' })}
      </div>
      ${o.can < s.can * CAN_AZ_ORANI ? `<p class="kart-not engel">${M.canAz}</p>` : ''}
    </section>

    <div class="il-eylemleri">
      <button class="buton buton-ana buton-buyuk" data-eylem="kesif">🔍 ${M.kesfeCik}</button>
      <div class="il-eylemleri-alt">
        <button class="buton" data-eylem="heybe">🎒 ${M.heybe} <small>${durum.heybe.length}/${HEYBE_YUVA}</small></button>
        <button class="buton" data-eylem="karakter">👤 ${M.karakter}${o.statPuani > 0 ? ' <span class="nokta-isaret" aria-hidden="true"></span>' : ''}</button>
      </div>
      <button class="buton" data-eylem="harita">🗺️ ${M.haritayaDon}</button>
    </div>`;
}

// Ekranı `kap` içine kurar. Temizlik fonksiyonu döndürür.
// secenekler: { kesfeCik, heybeGoster, karakterGoster, haritaGoster }
export function ilEkrani(kap, depo, { kesfeCik, heybeGoster, karakterGoster, haritaGoster } = {}) {
  const il = ilHaritasi.get(depo.al().konum);
  kap.innerHTML = `
    <div class="sayfa-ekrani il-ekrani">
      <header class="ust-cubuk">
        <button class="simge-buton" data-eylem="harita" aria-label="${M.haritayaDon}" title="${M.haritayaDon}">←</button>
        <h1 class="ust-baslik">📍 ${kacis(il.ad)}</h1>
      </header>
      <main class="sayfa-icerik"></main>
    </div>`;

  const alan = kap.querySelector('.sayfa-icerik');
  const ciz = (durum) => {
    alan.innerHTML = icerik(durum);
  };

  kap.querySelector('.il-ekrani').addEventListener('click', (e) => {
    const b = e.target.closest('[data-eylem]');
    if (!b) return;
    switch (b.dataset.eylem) {
      case 'kesif': return kesfeCik?.();
      case 'heybe': return heybeGoster?.();
      case 'karakter': return karakterGoster?.();
      case 'harita': return haritaGoster?.();
    }
  });

  const aboneliktenCik = depo.abone(ciz);
  ciz(depo.al());
  return aboneliktenCik;
}
