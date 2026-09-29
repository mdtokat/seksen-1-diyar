// Giriş noktası ve ekran yönetimi.
import './stil/ana.css';
import { metinler } from './veri/metinler.js';
import { yeniOyunDurumu, durumDeposu } from './oyun/durum.js';
import { rastgeleUreteci, yeniTohum } from './oyun/rastgele.js';
import { karsilasmaUret } from './oyun/kesif.js';
import { haritaEkrani } from './arayuz/harita.js';
import { yeniOyunEkrani } from './arayuz/yeniOyunEkrani.js';
import { karakterEkrani } from './arayuz/karakterEkrani.js';
import { savasEkrani } from './arayuz/savasEkrani.js';

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
const rng = rastgeleUreteci(yeniTohum());
let temizle = null;
let depo = null;

function ekranGoster(kur) {
  temizle?.();
  temizle = kur(uygulama) ?? null;
  window.scrollTo(0, 0);
}

function baslikGoster() {
  ekranGoster((kap) => {
    kap.innerHTML = baslikEkrani();
    kap.querySelector('[data-eylem="yola-cik"]').addEventListener('click', () => {
      if (depo?.al().oyuncu) haritaGoster();
      else yeniOyunGoster();
    });
  });
}

function yeniOyunGoster() {
  ekranGoster((kap) =>
    yeniOyunEkrani(kap, {
      geri: baslikGoster,
      olustur: ({ ad, sinif }) => {
        depo = durumDeposu(yeniOyunDurumu({ ad, sinif }));
        haritaGoster();
      },
    }),
  );
}

function haritaGoster() {
  ekranGoster((kap) =>
    haritaEkrani(kap, depo, {
      baslikaDon: baslikGoster,
      karakterGoster: () => karakterGoster(haritaGoster),
      savasBaslat: savasGoster,
    }),
  );
}

function karakterGoster(geri) {
  ekranGoster((kap) => karakterEkrani(kap, depo, { geri }));
}

function savasGoster(plaka) {
  const dusman = karsilasmaUret(plaka, rng);
  ekranGoster((kap) =>
    savasEkrani(kap, depo, {
      dusman,
      rng,
      bitince: haritaGoster,
      karakterGoster: () => karakterGoster(haritaGoster),
    }),
  );
}

baslikGoster();
