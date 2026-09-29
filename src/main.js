// Giriş noktası ve ekran yönetimi.
import './stil/ana.css';
import { metinler } from './veri/metinler.js';

// Sekiz köşeli Selçuklu yıldızı: biri 45° döndürülmüş iki karenin birleşimi.
const yildiz = (sinif) => `
  <svg class="${sinif}" viewBox="-20 -20 40 40" aria-hidden="true">
    <polygon points="0,-16.97 4.97,-12 12,-12 12,-4.97 16.97,0 12,4.97 12,12 4.97,12 0,16.97 -4.97,12 -12,12 -12,4.97 -16.97,0 -12,-4.97 -12,-12 -4.97,-12" />
    <circle r="4" />
  </svg>`;

function baslikEkrani() {
  return `
    <main class="ekran baslik-ekrani">
      <div class="cerceve">
        ${yildiz('yildiz yildiz-buyuk')}
        <h1>${metinler.oyunAdi}</h1>
        <p class="alt-baslik">${metinler.altBaslik}</p>
        <div class="ayrac" aria-hidden="true">${yildiz('yildiz')}</div>
        <p class="giris-metni">${metinler.giris}</p>
        <p class="yakinda">${metinler.yakinda}</p>
      </div>
    </main>`;
}

document.querySelector('#uygulama').innerHTML = baslikEkrani();
