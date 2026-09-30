// Kervansaray: dinlenme (can ve nefes dolar, bayılınca buraya dönülür) ve
// arınmış illerdeki kervansaraylar arasında hızlı yolculuk.
import { iller } from '../veri/iller.js';
import { bolgeler } from '../veri/bolgeler.js';
import { metinler } from '../veri/metinler.js';
import { dinlen, yolculukListesi } from '../oyun/kervansaray.js';
import { arinmaYuzdesi } from '../oyun/ilerleme.js';
import { statlar } from '../oyun/karakter.js';
import { kacis, sablon, degerCubugu, bildirimGoster } from './bilesenler.js';

const M = metinler.kervansaray;
const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const bolgeHaritasi = new Map(bolgeler.map((b) => [b.anahtar, b]));

function icerik(durum) {
  const o = durum.oyuncu;
  const s = statlar(o);
  const son = durum.sonKervansaray
    ? sablon(M.sonKervansaray, { il: kacis(ilHaritasi.get(durum.sonKervansaray).ad) })
    : M.sonKervansarayYok;
  // Bu il arınmadıysa buradan hiçbir yere kervan kalkmaz; bir kez söylenir.
  const baslangicEngeli = arinmaYuzdesi(durum, durum.konum) < 100;
  // Açılmamış bölgelerin kervansarayları listelenmez; bölge açıldıkça eklenir.
  const liste = yolculukListesi(durum)
    .filter((y) => y.neden !== 'kilitli_bolge')
    .sort((a, b) => Number(!a.olur) - Number(!b.olur) || a.ucret - b.ucret)
    .map((y) => {
      const il = ilHaritasi.get(y.plaka);
      const bolge = bolgeHaritasi.get(il.bolge);
      // Başlangıç ili arınmamışsa bu zaten yukarıda söylendi; satırda hedefin durumu yazılır
      const neden = y.neden === 'arinmamis_baslangic' ? (arinmaYuzdesi(durum, y.plaka) < 100 ? 'arinmamis_hedef' : null) : y.neden;
      const not = y.olur || !neden ? '' : M.neden[neden] ?? '';
      return `
        <li class="yolculuk-satiri${y.olur ? '' : ' soluk'}">
          <span class="bolge-noktasi" style="background:${bolge.renk}"></span>
          <div class="yolculuk-bilgi"><strong>${kacis(il.ad)}</strong><small>${kacis(bolge.ad)}${not ? ` · ${kacis(not)}` : ''}</small></div>
          <span class="esya-fiyat">${sablon(M.ucret, { ucret: y.ucret })}</span>
          <button class="buton buton-kucuk" data-git="${y.plaka}" ${y.olur ? '' : 'disabled'}>${M.git}</button>
        </li>`;
    }).join('');
  return `
    <section class="kart">
      <p class="dukkan-selami">${M.selam}</p>
      <div class="cubuk-grubu">
        ${degerCubugu(o.can, s.can, { etiket: metinler.statAdlari.can, renk: 'var(--mercan)' })}
        ${degerCubugu(o.nefes, s.nefes, { etiket: metinler.statAdlari.nefes, renk: 'var(--turkuaz)' })}
      </div>
      <button class="buton buton-ana buton-genis" data-eylem="dinlen">🛏️ ${M.dinlen}</button>
      <p class="kart-not bilgi-not">${son}</p>
    </section>
    <section class="kart">
      <h3>🐫 ${M.yolculuk}</h3>
      <p class="kese">${M.yolculukAciklama} 🪙 ${durum.akce}</p>
      ${baslangicEngeli ? `<p class="kart-not engel">${M.neden.arinmamis_baslangic}</p>` : ''}
      <ul class="yolculuk-listesi">${liste}</ul>
    </section>`;
}

// Ekranı `kap` içine kurar. Temizlik fonksiyonu döndürür.
// secenekler: { geri, yolculukYap(hedef) }
export function kervansarayEkrani(kap, depo, { geri, yolculukYap } = {}) {
  const il = ilHaritasi.get(depo.al().konum);
  kap.innerHTML = `
    <div class="sayfa-ekrani kervansaray-ekrani">
      <header class="ust-cubuk">
        <button class="simge-buton" data-eylem="geri" aria-label="${M.geri}" title="${M.geri}">←</button>
        <h1 class="ust-baslik">🏨 ${M.baslik} <span class="ust-alt">${kacis(il.ad)}</span></h1>
      </header>
      <main class="sayfa-icerik" aria-live="polite"></main>
    </div>`;
  const ekran = kap.querySelector('.kervansaray-ekrani');
  const alan = ekran.querySelector('.sayfa-icerik');
  const ciz = (durum) => {
    alan.innerHTML = icerik(durum);
  };
  ekran.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.eylem === 'geri') return geri?.();
    if (b.dataset.eylem === 'dinlen') {
      depo.ayarla(dinlen(depo.al()));
      return bildirimGoster(ekran, M.dinlendin, { tur: 'kutlama' });
    }
    if (b.dataset.git) return yolculukYap?.(Number(b.dataset.git));
  });
  const cik = depo.abone(ciz);
  ciz(depo.al());
  return cik;
}
