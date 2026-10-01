// Ahi esnafı: bölgenin silah, zırh ve kuşaklarını satan dükkân; eşyaları yarı
// fiyatına geri de alır.
import { iller } from '../veri/iller.js';
import { esyaBilgisi } from '../oyun/rota.js';
import { metinler } from '../veri/metinler.js';
import {
  ahiMallari, esyaAl, esyaAlKontrol, esyaSat, esyaSatKontrol, satisFiyati, pazarDonemi, pazarYenilenmesineKalan,
} from '../oyun/ticaret.js';
import { sinifaUygunMu } from '../oyun/ekipman.js';
import { kacis, sablon, bildirimGoster } from './bilesenler.js';
import { esyaKarti } from './esyaKarti.js';

const M = metinler.ahi;

function alSekmesi(durum) {
  const o = durum.oyuncu;
  const mallar = ahiMallari(durum.konum, pazarDonemi(durum))
    .sort((a, b) => Number(!sinifaUygunMu(a, o.sinif)) - Number(!sinifaUygunMu(b, o.sinif)) || esyaBilgisi(a).fiyat - esyaBilgisi(b).fiyat);
  return mallar.map((a) => {
    const k = esyaAlKontrol(durum, a);
    const uygun = sinifaUygunMu(a, o.sinif);
    const not = !uygun ? metinler.ekipman.neden.sinif
      : k.neden === 'zaten_var' ? M.senin
      : o.seviye < esyaBilgisi(a).seviye ? sablon(metinler.ekipman.neden.seviye, { seviye: esyaBilgisi(a).seviye })
      : '';
    const sag = `<span class="esya-fiyat">${sablon(M.fiyat, { fiyat: esyaBilgisi(a).fiyat })}</span>
      <button class="buton buton-kucuk" data-al="${a}" ${k.olur ? '' : 'disabled'}
        title="${kacis(k.olur ? '' : M.neden[k.neden] ?? '')}">${M.al}</button>`;
    return esyaKarti(a, { sag, not, soluk: !uygun });
  }).join('');
}

function satSekmesi(durum) {
  const esyaListesi = durum.esyalar ?? [];
  if (!esyaListesi.length) return `<p class="bos-not">${M.bos}</p>`;
  return `<ul class="esya-listesi">${esyaListesi.map((a) => {
    const k = esyaSatKontrol(durum, a);
    const sag = `<span class="esya-fiyat">${sablon(M.fiyat, { fiyat: satisFiyati(a) })}</span>
      <button class="buton buton-kucuk" data-sat="${a}" ${k.olur ? '' : 'disabled'}>${M.sat}</button>`;
    return esyaKarti(a, { sag, not: k.olur ? '' : M.neden[k.neden] });
  }).join('')}</ul>`;
}

// Ekranı `kap` içine kurar. Temizlik fonksiyonu döndürür.
export function ahiEkrani(kap, depo, { geri } = {}) {
  const plaka = depo.al().konum;
  const il = iller.find((i) => i.plaka === plaka);
  const selam = M.selamlar[plaka % M.selamlar.length];
  let sekme = 'al';
  kap.innerHTML = `
    <div class="sayfa-ekrani ahi-ekrani">
      <header class="ust-cubuk">
        <button class="simge-buton" data-eylem="geri" aria-label="${M.geri}" title="${M.geri}">←</button>
        <h1 class="ust-baslik">⚒️ ${M.baslik} <span class="ust-alt">${kacis(il.ad)}</span></h1>
      </header>
      <main class="sayfa-icerik">
        <section class="kart">
          <p class="dukkan-selami"><strong>${M.usta}:</strong> “${kacis(selam)}”</p>
          <p class="kese"></p>
          <p class="kart-not bilgi-not yenilenme"></p>
        </section>
        <div class="sekmeler" role="tablist">
          <button class="sekme" role="tab" data-sekme="al">${M.sekmeAl}</button>
          <button class="sekme" role="tab" data-sekme="sat">${M.sekmeSat}</button>
        </div>
        <section class="kart sekme-icerik" aria-live="polite"></section>
      </main>
    </div>`;
  const ekran = kap.querySelector('.ahi-ekrani');
  const kese = ekran.querySelector('.kese');
  const alan = ekran.querySelector('.sekme-icerik');
  const yenilenme = ekran.querySelector('.yenilenme');

  const ciz = (durum) => {
    kese.textContent = `🪙 ${sablon(M.akce, { akce: durum.akce })}`;
    yenilenme.textContent = sablon(M.yenilenme, { kalan: pazarYenilenmesineKalan(durum) });
    for (const b of ekran.querySelectorAll('.sekme')) b.setAttribute('aria-selected', String(b.dataset.sekme === sekme));
    alan.innerHTML = sekme === 'al' ? `<ul class="esya-listesi">${alSekmesi(durum)}</ul>` : satSekmesi(durum);
  };

  ekran.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.eylem === 'geri') return geri?.();
    if (b.dataset.sekme) {
      sekme = b.dataset.sekme;
      return ciz(depo.al());
    }
    const once = depo.al();
    if (b.dataset.al) {
      const sonra = esyaAl(once, b.dataset.al);
      if (sonra === once) return;
      depo.ayarla(sonra);
      bildirimGoster(ekran, sablon(M.aldin, { esya: esyaBilgisi(b.dataset.al).ad }), { tur: 'kutlama' });
    } else if (b.dataset.sat) {
      const sonra = esyaSat(once, b.dataset.sat);
      if (sonra === once) return;
      depo.ayarla(sonra);
      bildirimGoster(ekran, sablon(M.sattin, { esya: esyaBilgisi(b.dataset.sat).ad, akce: satisFiyati(b.dataset.sat) }));
    }
  });

  const cik = depo.abone(ciz);
  ciz(depo.al());
  return cik;
}
