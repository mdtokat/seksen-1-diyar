// Giriş noktası ve ekran yönetimi.
import './stil/ana.css';
import { metinler } from './veri/metinler.js';
import { yeniOyunDurumu, durumDeposu } from './oyun/durum.js';
import { haritaEkrani } from './arayuz/harita.js';

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
        <button class="buton buton-ana" data-eylem="yola-cik">${metinler.yolaCik}</button>
      </div>
    </main>`;
}

// ── Ekran yönetimi ──
const uygulama = document.querySelector('#uygulama');
let temizle = null;
let depo = null;

function ekranGoster(kur) {
  temizle?.();
  temizle = kur(uygulama) ?? null;
}

function baslikGoster() {
  ekranGoster((kap) => {
    kap.innerHTML = baslikEkrani();
    kap.querySelector('[data-eylem="yola-cik"]').addEventListener('click', haritaGoster);
  });
}

function haritaGoster() {
  depo ??= durumDeposu(yeniOyunDurumu());
  ekranGoster((kap) => haritaEkrani(kap, depo, { baslikaDon: baslikGoster }));
}

baslikGoster();
