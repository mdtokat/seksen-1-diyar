// Giriş noktası ve ekran yönetimi.
import './stil/ana.css';
import { metinler } from './veri/metinler.js';
import { yeniOyunDurumu, durumDeposu } from './oyun/durum.js';
import { rastgeleUreteci, yeniTohum } from './oyun/rastgele.js';
import { kesifSonucunuUygula } from './oyun/kesif.js';
import { ilHaritasiUret, girisNoktasi, dusmanlariYerlestir } from './oyun/gezinti.js';
import { arinmaYuzdesi, seyahatEt } from './oyun/ilerleme.js';
import { kaydet, yukle } from './oyun/kayit.js';
import { iller } from './veri/iller.js';
import { siniflar } from './veri/siniflar.js';
import { haritaEkrani } from './arayuz/harita.js';
import { ilEkrani } from './arayuz/ilEkrani.js';
import { envanterEkrani } from './arayuz/envanterEkrani.js';
import { kacis, sablon, bildirimGoster } from './arayuz/bilesenler.js';
import { yeniOyunEkrani } from './arayuz/yeniOyunEkrani.js';
import { karakterEkrani } from './arayuz/karakterEkrani.js';
import { savasEkrani } from './arayuz/savasEkrani.js';
import { gezintiEkrani, YENIDEN_DOGUS_ADIMI } from './arayuz/gezintiEkrani.js';

// Sekiz köşeli Selçuklu yıldızı: biri 45° döndürülmüş iki karenin birleşimi.
const yildiz = (sinif) => `
  <svg class="${sinif}" viewBox="-20 -20 40 40" aria-hidden="true">
    <polygon points="0,-16.97 4.97,-12 12,-12 12,-4.97 16.97,0 12,4.97 12,12 4.97,12 0,16.97 -4.97,12 -12,12 -12,4.97 -16.97,0 -12,-4.97 -12,-12 -4.97,-12" />
    <circle r="4" />
  </svg>`;

function baslikEkrani(kayit) {
  const B = metinler.baslik;
  const butonlar = kayit
    ? `
        <p class="kayit-ozeti">${kacis(sablon(B.kayitOzeti, {
          ad: kayit.oyuncu.ad,
          sinif: siniflar[kayit.oyuncu.sinif].ad,
          seviye: kayit.oyuncu.seviye,
          il: iller.find((il) => il.plaka === kayit.konum).ad,
        }))}</p>
        <div class="baslik-butonlari">
          <button class="buton buton-ana" data-eylem="devam">${B.devamEt}</button>
          <button class="buton" data-eylem="yeni">${B.yeniOyun}</button>
        </div>
        <div class="yeni-oyun-onayi" hidden>
          <p class="kart-not engel">${B.yeniOyunUyarisi}</p>
          <div class="baslik-butonlari">
            <button class="buton buton-ana" data-eylem="yeni-onay">${B.evet}</button>
            <button class="buton" data-eylem="vazgec">${B.vazgec}</button>
          </div>
        </div>`
    : `<button class="buton buton-ana" data-eylem="yeni-onay">${B.yeniOyun}</button>`;
  return `
    <main class="ekran baslik-ekrani">
      <div class="cerceve">
        ${yildiz('yildiz yildiz-buyuk')}
        <h1>${metinler.oyunAdi}</h1>
        <p class="alt-baslik">${metinler.altBaslik}</p>
        <div class="ayrac" aria-hidden="true">${yildiz('yildiz')}</div>
        <p class="giris-metni">${metinler.giris}</p>
        ${butonlar}
      </div>
    </main>`;
}

// ── Ekran yönetimi ──
const uygulama = document.querySelector('#uygulama');
const rng = rastgeleUreteci(yeniTohum());
let temizle = null;
let depo = null;
// İl içi gezinti durumu; savaşa, heybeye ya da karaktere girip çıkınca korunur.
let gezinti = null;
let ipucuGosterildi = false;

function ekranGoster(kur) {
  temizle?.();
  temizle = kur(uygulama) ?? null;
  window.scrollTo(0, 0);
}

// Durum her değiştiğinde (savaş sonu, seyahat, seviye atlama, yemek, stat
// puanı) otomatik kayıt yapılır. Kayıt yapılamazsa oyuncu bir kez uyarılır.
function oyunuBaslat(durum) {
  depo = durumDeposu(durum);
  gezinti = null;
  let uyarildi = false;
  const kaydetVeUyar = (d) => {
    if (!kaydet(d) && !uyarildi) {
      uyarildi = true;
      bildirimGoster(document.body, metinler.baslik.kayitYapilamiyor, { tur: 'uyari', sure: 5000 });
    }
  };
  depo.abone(kaydetVeUyar);
  kaydetVeUyar(durum);
}

function baslikGoster() {
  const kayit = depo?.al() ?? yukle();
  ekranGoster((kap) => {
    kap.innerHTML = baslikEkrani(kayit);
    const onay = kap.querySelector('.yeni-oyun-onayi');
    kap.querySelector('.cerceve').addEventListener('click', (e) => {
      const b = e.target.closest('[data-eylem]');
      if (!b) return;
      switch (b.dataset.eylem) {
        case 'devam':
          if (!depo) oyunuBaslat(kayit);
          return gezintiGoster();
        case 'yeni':
          onay.hidden = false;
          return onay.querySelector('button').focus();
        case 'vazgec':
          onay.hidden = true;
          return;
        case 'yeni-onay':
          return yeniOyunGoster();
      }
    });
  });
}

function yeniOyunGoster() {
  ekranGoster((kap) =>
    yeniOyunEkrani(kap, {
      geri: baslikGoster,
      olustur: ({ ad, sinif }) => {
        oyunuBaslat(yeniOyunDurumu({ ad, sinif }));
        gezintiGoster();
      },
    }),
  );
}

// Oyuncunun bulunduğu ilin gezinti durumunu hazırlar. İl değiştiyse yeni il
// haritası üretilir; komşu ilden gelindiyse o ile giden yolun ağzından girilir.
function gezintiHazirla() {
  const durum = depo.al();
  if (gezinti?.plaka === durum.konum) return gezinti;
  const harita = ilHaritasiUret(durum.konum);
  const oyuncu = gezinti ? girisNoktasi(harita, gezinti.plaka) : { ...harita.dogus };
  gezinti = {
    plaka: durum.konum,
    harita,
    oyuncu,
    yon: 1,
    dusmanlar: dusmanlariYerlestir(harita, arinmaYuzdesi(durum, durum.konum), rng, { oyuncu }),
    sonrakiId: 100,
    dogusSayaclari: [],
    dokunulmaz: 0,
  };
  return gezinti;
}

function gezintiGoster() {
  const g = gezintiHazirla();
  const ipucuGoster = !ipucuGosterildi;
  ipucuGosterildi = true;
  ekranGoster((kap) =>
    gezintiEkrani(kap, depo, {
      g,
      rng,
      ipucuGoster,
      savasBaslat: savasGoster,
      ileGec: (plaka) => {
        depo.ayarla(seyahatEt(depo.al(), plaka));
        gezintiGoster();
        bildirimGoster(uygulama.querySelector('.gezinti-ekrani'), sablon(metinler.harita.varis, {
          il: iller.find((il) => il.plaka === plaka).ad,
        }));
      },
      ilBilgisi: ilGoster,
      haritaGoster,
      heybeGoster: () => heybeGoster(gezintiGoster),
      karakterGoster: () => karakterGoster(gezintiGoster),
      baslikaDon: baslikGoster,
    }),
  );
}

function ilGoster() {
  ekranGoster((kap) =>
    ilEkrani(kap, depo, {
      gezintiyeDon: gezintiGoster,
      heybeGoster: () => heybeGoster(ilGoster),
      karakterGoster: () => karakterGoster(ilGoster),
      haritaGoster,
    }),
  );
}

function haritaGoster() {
  ekranGoster((kap) =>
    haritaEkrani(kap, depo, {
      baslikaDon: baslikGoster,
      karakterGoster: () => karakterGoster(haritaGoster),
      ilGoster: gezintiGoster,
    }),
  );
}

function karakterGoster(geri) {
  ekranGoster((kap) => karakterEkrani(kap, depo, { geri }));
}

function heybeGoster(geri) {
  ekranGoster((kap) => envanterEkrani(kap, depo, { geri }));
}

// Haritada temas edilen düşmanla savaş. Sonuca göre gezinti durumu güncellenir:
// zaferde düşman haritadan kalkar (bir süre sonra yenisi gelir), kaçışta oyuncu kısa
// süre dokunulmaz olur, bayılınca il meydanında kendine gelir.
function savasGoster(kayit) {
  const plaka = depo.al().konum;
  let sonuc = null;
  let islendi = false;
  const sonrasi = () => {
    if (islendi || !sonuc) return;
    islendi = true;
    const g = gezinti;
    if (sonuc === 'zafer') {
      g.dusmanlar = g.dusmanlar.filter((d) => d.id !== kayit.id);
      g.dogusSayaclari.push(YENIDEN_DOGUS_ADIMI);
      g.dokunulmaz = 2;
    } else if (sonuc === 'kacis') {
      g.dokunulmaz = 8;
    } else {
      g.oyuncu = { ...g.harita.dogus };
      g.dokunulmaz = 8;
    }
  };
  ekranGoster((kap) =>
    savasEkrani(kap, depo, {
      dusman: kayit.dusman,
      rng,
      sonucuUygula: (durum, savas) => {
        const r = kesifSonucunuUygula(durum, savas, plaka, rng);
        sonuc = r.ozet.sonuc;
        return r;
      },
      bitince: () => {
        sonrasi();
        gezintiGoster();
      },
      karakterGoster: () => {
        sonrasi();
        karakterGoster(gezintiGoster);
      },
    }),
  );
}

baslikGoster();
