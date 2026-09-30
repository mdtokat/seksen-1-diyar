// Üst çubuktaki karakter düğmesi: sınıf çizimi, seviye, can ve nefes çubukları ve
// dağıtılmamış stat puanı işareti. Harita ve gezinti ekranları kullanır.
import { metinler } from '../veri/metinler.js';
import { statlar } from '../oyun/karakter.js';
import { sablon } from './bilesenler.js';
import { sinifCizimi } from './cizimler/karakterler.js';

export function karakterDugmesiniCiz(dugme, oyuncu) {
  dugme.hidden = !oyuncu;
  if (!oyuncu) return;
  const K = metinler.karakter;
  const s = statlar(oyuncu);
  const canYuzde = Math.round((oyuncu.can / s.can) * 100);
  const nefesYuzde = Math.round((oyuncu.nefes / s.nefes) * 100);
  const etiket = sablon(K.ustCubukDugmesi, { ad: oyuncu.ad, seviye: oyuncu.seviye });
  dugme.setAttribute('aria-label', etiket);
  dugme.title = etiket;
  dugme.innerHTML = `
    <span class="karakter-dugmesi-ikon">${sinifCizimi(oyuncu.sinif)}</span>
    <span class="karakter-dugmesi-bilgi">
      <strong>${sablon(K.seviye, { seviye: oyuncu.seviye })}</strong>
      <span class="mini-cubuk" aria-hidden="true"><span style="width:${canYuzde}%"></span></span>
      <span class="mini-cubuk mini-nefes" aria-hidden="true"><span style="width:${nefesYuzde}%"></span></span>
    </span>
    ${oyuncu.statPuani > 0 ? '<span class="puan-isareti" aria-hidden="true"></span>' : ''}`;
}
