// Seyyar tüccar: yollarda dolaşan, sınıfa uygun güçlü ekipman satan gezgin esnaf.
// Ahi dükkânından farklı olarak yalnızca alışveriş vardır (satın alma).
import { esyaBilgisi } from '../oyun/rota.js';
import { metinler } from '../veri/metinler.js';
import { tuccarMallari, tuccarFiyati, tuccarAl, tuccarAlKontrol } from '../oyun/tuccar.js';
import { kacis, sablon, bildirimGoster } from './bilesenler.js';
import { esyaKarti } from './esyaKarti.js';
import { tuccarCizimi } from './cizimler/karakterler.js';

const M = metinler.tuccar;

// secenekler: { tuccar (gezinti.js tüccar kaydı), geri }
export function tuccarEkrani(kap, depo, { tuccar, geri } = {}) {
  const konum = depo.al().konum;
  const sinif = depo.al().oyuncu.sinif;
  const mallar = tuccarMallari(konum, tuccar.tohum, sinif);
  const selam = M.selamlar[tuccar.tohum % M.selamlar.length];
  kap.innerHTML = `
    <div class="sayfa-ekrani tuccar-ekrani ahi-ekrani">
      <header class="ust-cubuk">
        <button class="simge-buton" data-eylem="geri" aria-label="${M.geri}" title="${M.geri}">←</button>
        <h1 class="ust-baslik">🛍️ ${M.baslik}</h1>
      </header>
      <main class="sayfa-icerik">
        <section class="kart tuccar-karti">
          <div class="tuccar-resmi">${tuccarCizimi()}</div>
          <div>
            <p class="dukkan-selami"><strong>${M.usta}:</strong> “${kacis(selam)}”</p>
            <p class="kart-not bilgi-not">${M.not}</p>
            <p class="kese"></p>
          </div>
        </section>
        <section class="kart sekme-icerik" aria-live="polite"></section>
      </main>
    </div>`;
  const ekran = kap.querySelector('.tuccar-ekrani');
  const kese = ekran.querySelector('.kese');
  const alan = ekran.querySelector('.sekme-icerik');

  const ciz = (durum) => {
    kese.textContent = `🪙 ${sablon(M.akce, { akce: durum.akce })}`;
    if (!mallar.length) {
      alan.innerHTML = `<p class="bos-not">${M.bos}</p>`;
      return;
    }
    alan.innerHTML = `<ul class="esya-listesi">${mallar.map((a) => {
      const k = tuccarAlKontrol(durum, a, mallar);
      const e = esyaBilgisi(a);
      const not = k.neden === 'zaten_var' ? M.senin
        : durum.oyuncu.seviye < e.seviye ? sablon(metinler.ekipman.neden.seviye, { seviye: e.seviye })
        : '';
      const sag = `<span class="esya-fiyat">${sablon(M.fiyat, { fiyat: tuccarFiyati(a) })}</span>
        <button class="buton buton-kucuk" data-al="${a}" ${k.olur ? '' : 'disabled'}
          title="${kacis(k.olur ? '' : M.neden[k.neden] ?? '')}">${M.al}</button>`;
      return esyaKarti(a, { sag, not });
    }).join('')}</ul>`;
  };

  ekran.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.eylem === 'geri') return geri?.();
    if (b.dataset.al) {
      const once = depo.al();
      const sonra = tuccarAl(once, b.dataset.al, mallar);
      if (sonra === once) return;
      depo.ayarla(sonra);
      bildirimGoster(ekran, sablon(M.aldin, { esya: esyaBilgisi(b.dataset.al).ad }), { tur: 'kutlama' });
    }
  });

  const cik = depo.abone(ciz);
  ciz(depo.al());
  return cik;
}
