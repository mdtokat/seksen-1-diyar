// Giriş noktası ve ekran yönetimi.
import './stil/ana.css';
import { metinler } from './veri/metinler.js';
import { yeniOyunDurumu, durumDeposu } from './oyun/durum.js';
import { rastgeleUreteci, yeniTohum } from './oyun/rastgele.js';
import { kesifSonucunuUygula } from './oyun/kesif.js';
import { ilHaritasiUret, girisNoktasi, dusmanlariYerlestir, ozelDusmanlar, halkiYerlestir } from './oyun/gezinti.js';
import { arinmaYuzdesi, seyahatEt, yeniAcilanBosslar, finalDurumu } from './oyun/ilerleme.js';
import { oyunDurumunuIsle, yeniBasarimlar } from './oyun/basarimlar.js';
import { basarimlar } from './veri/basarimlar.js';
import { bitisEkrani } from './arayuz/bitisEkrani.js';
import { sesCal } from './arayuz/ses.js';
import { bolgeler } from './veri/bolgeler.js';
import { dusmanlar } from './veri/dusmanlar.js';
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
import { arastaEkrani } from './arayuz/arastaEkrani.js';
import { ahiEkrani } from './arayuz/ahiEkrani.js';
import { kervansarayEkrani } from './arayuz/kervansarayEkrani.js';
import { hizliYolculuk } from './oyun/kervansaray.js';
import { gorevEkrani } from './arayuz/gorevEkrani.js';
import { gunlukEkrani } from './arayuz/gunlukEkrani.js';
import { kademeSirasi, hayirPuani } from './oyun/itibar.js';
import { itibarKademeleri } from './veri/itibar.js';

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
// Açık ekranın adı; klavye kısayolları buna göre çalışır.
let aktifEkran = null;

function ekranGoster(kur, ad = null) {
  aktifEkran = ad;
  klavyePenceresiniKapat();
  temizle?.();
  temizle = kur(uygulama) ?? null;
  // Ekranlar arası yumuşak geçiş (hareket azaltılmışsa CSS kapatır)
  uygulama.firstElementChild?.classList.add('ekran-gir');
  window.scrollTo(0, 0);
}

// Durum her değiştiğinde (savaş sonu, seyahat, seviye atlama, yemek, stat
// puanı) otomatik kayıt yapılır. Kayıt yapılamazsa oyuncu bir kez uyarılır.
function oyunuBaslat(durum) {
  // Her yeni durum başarımlar ve yemek defteri için denetlenir
  depo = durumDeposu(durum, { donustur: oyunDurumunuIsle });
  durum = depo.al();
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

  // Bir bossun mührü çözülünce ya da oyuncunun unvanı yükselince haber verilir.
  let onceki = durum;
  depo.abone((d) => {
    const kademe = kademeSirasi(hayirPuani(d));
    if (kademe > kademeSirasi(hayirPuani(onceki))) {
      sesCal('basarim');
      bildirimGoster(document.body, sablon(metinler.gorev.unvanAtladin, { unvan: itibarKademeleri[kademe].ad }), { tur: 'kutlama', sure: 5000 });
    }
    for (const a of yeniBasarimlar(onceki, d)) {
      sesCal('basarim');
      bildirimGoster(document.body, sablon(metinler.basarim.kazanildi, { basarim: `${basarimlar[a].ikon} ${basarimlar[a].ad}` }), { tur: 'kutlama', sure: 5000 });
    }
    if (finalDurumu(d) === 'acik' && finalDurumu(onceki) !== 'acik') {
      bildirimGoster(document.body, metinler.final.acildi, { tur: 'kutlama', sure: 6000 });
    }
    for (const anahtar of yeniAcilanBosslar(onceki, d)) {
      const b = bolgeler.find((x) => x.anahtar === anahtar);
      bildirimGoster(document.body, sablon(metinler.boss.acildi, {
        boss: dusmanlar[b.boss].ad,
        il: iller.find((il) => il.plaka === b.bossIli).ad,
      }), { tur: 'kutlama', sure: 6000 });
    }
    onceki = d;
  });
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
  if (gezinti?.plaka === durum.konum) {
    // İnde bekleyen boss ya da mini boss güncel duruma göre yenilenir
    // (mini boss belirmiş, boss yenilmiş olabilir).
    gezinti.dusmanlar = [...gezinti.dusmanlar.filter((d) => !d.sabit), ...ozelDusmanlar(gezinti.harita, durum)];
    return gezinti;
  }
  const harita = ilHaritasiUret(durum.konum);
  const oyuncu = gezinti ? girisNoktasi(harita, gezinti.plaka) : { ...harita.dogus };
  const inDekiler = ozelDusmanlar(harita, durum);
  gezinti = {
    plaka: durum.konum,
    harita,
    oyuncu,
    yon: 1,
    dusmanlar: [
      ...dusmanlariYerlestir(harita, arinmaYuzdesi(durum, durum.konum), rng, { oyuncu, bosslar: true, dolu: inDekiler }),
      ...inDekiler,
    ],
    sonrakiId: 100,
    halk: halkiYerlestir(harita, rng),
    dogusSayaclari: [],
    dokunulmaz: 0,
    surprizAdimi: 0, // son sürpriz baskından bu yana atılan adım
  };
  return gezinti;
}

// ilGirisi: başka bir ilden yeni gelindiyse il adı afişi gösterilir.
function gezintiGoster({ ilGirisi = false } = {}) {
  const g = gezintiHazirla();
  const ipucuGoster = !ipucuGosterildi;
  ipucuGosterildi = true;
  ekranGoster((kap) =>
    gezintiEkrani(kap, depo, {
      g,
      rng,
      ipucuGoster,
      ilGirisi,
      savasBaslat: savasGoster,
      kisayollariGoster: klavyePenceresiniAc,
      ileGec: (plaka) => {
        depo.ayarla(seyahatEt(depo.al(), plaka));
        gezintiGoster({ ilGirisi: true });
        bildirimGoster(uygulama.querySelector('.gezinti-ekrani'), sablon(metinler.harita.varis, {
          il: iller.find((il) => il.plaka === plaka).ad,
        }));
      },
      ilBilgisi: ilGoster,
      haritaGoster,
      heybeGoster: () => heybeGoster(gezintiGoster),
      karakterGoster: () => karakterGoster(gezintiGoster),
      baslikaDon: baslikGoster,
      arastaGoster: () => ekranGoster((kap) => arastaEkrani(kap, depo, { geri: gezintiGoster }), 'arasta'),
      ahiGoster: () => ekranGoster((kap) => ahiEkrani(kap, depo, { geri: gezintiGoster }), 'ahi'),
      kervansarayGoster,
      gorevVerenGoster: (veren) => ekranGoster((kap) => gorevEkrani(kap, depo, { veren, geri: gezintiGoster }), 'gorev'),
      gunlukGoster,
    }),
    'gezinti',
  );
}

function kervansarayGoster() {
  ekranGoster((kap) =>
    kervansarayEkrani(kap, depo, {
      geri: gezintiGoster,
      yolculukYap: (hedef) => {
        const once = depo.al();
        const sonra = hizliYolculuk(once, hedef);
        if (sonra === once) return;
        depo.ayarla(sonra);
        gezinti = null; // yeni ilde meydandan, kervansarayın yanından başlanır
        gezintiGoster({ ilGirisi: true });
        bildirimGoster(uygulama.querySelector('.gezinti-ekrani'), sablon(metinler.kervansaray.vardin, {
          il: iller.find((il) => il.plaka === hedef).ad,
        }));
      },
    }),
    'kervansaray',
  );
}

function gunlukGoster() {
  ekranGoster((kap) => gunlukEkrani(kap, depo, { geri: () => gezintiGoster(), bitisGoster: () => bitisGoster(gunlukGoster) }), 'gunluk');
}

// Zülmet yenilince bitiş sahnesi; ardından yolculuğa devam edilir.
function bitisGoster(devam = () => gezintiGoster()) {
  ekranGoster((kap) => bitisEkrani(kap, depo, { devam }));
}

function ilGoster() {
  ekranGoster((kap) =>
    ilEkrani(kap, depo, {
      gezintiyeDon: gezintiGoster,
      heybeGoster: () => heybeGoster(ilGoster),
      karakterGoster: () => karakterGoster(ilGoster),
      haritaGoster,
    }),
    'il',
  );
}

function haritaGoster() {
  ekranGoster((kap) =>
    haritaEkrani(kap, depo, {
      baslikaDon: baslikGoster,
      karakterGoster: () => karakterGoster(haritaGoster),
      ilGoster: gezintiGoster,
    }),
    'harita',
  );
}

function karakterGoster(geri) {
  ekranGoster((kap) => karakterEkrani(kap, depo, { geri }), 'karakter');
}

function heybeGoster(geri) {
  ekranGoster((kap) => envanterEkrani(kap, depo, { geri }), 'heybe');
}

// Haritada temas edilen düşmanla savaş. Sonuca göre gezinti durumu güncellenir:
// zaferde düşman haritadan kalkar (bir süre sonra yenisi gelir), kaçışta oyuncu kısa
// süre dokunulmaz olur, bayılınca il meydanında kendine gelir.
function savasGoster(kayit) {
  const plaka = depo.al().konum;
  let sonuc = null;
  let finalBitti = false;
  let islendi = false;
  const sonrasi = () => {
    if (islendi || !sonuc) return;
    islendi = true;
    const g = gezinti;
    if (sonuc === 'zafer') {
      g.dusmanlar = g.dusmanlar.filter((d) => d.id !== kayit.id);
      if (!kayit.sabit) g.dogusSayaclari.push(YENIDEN_DOGUS_ADIMI);
      g.dokunulmaz = 2;
    } else if (sonuc === 'kacis') {
      // Kısa bir soluklanma: takipçiler az sonra yeniden peşine düşebilir
      g.dokunulmaz = 4;
      g.dusmanlar = g.dusmanlar.map((d) => (d.id === kayit.id ? { ...d, kovaliyor: false, birikim: 0 } : d));
    } else if (depo.al().konum !== g.plaka) {
      // Başka ildeki son kervansarayda kendine geldi: o ilin meydanından başlanır
      gezinti = null;
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
        finalBitti = r.ozet.zulmetYenildi;
        return r;
      },
      bitince: () => {
        sonrasi();
        if (finalBitti) return bitisGoster();
        gezintiGoster();
      },
      karakterGoster: () => {
        sonrasi();
        karakterGoster(gezintiGoster);
      },
    }),
  );
}

// ── Klavye kısayolları ──
// Gezintide ve ondan açılan ekranlarda: M harita, B heybe, K karakter, G günlük,
// L il bilgisi. Açık ekranın tuşuna yeniden basınca gezintiye dönülür; Esc geri
// götürür; ? kısayol penceresini açar. Savaşın kendi tuşları (1–4) savasEkrani.js'tedir.
const EKRAN_KISAYOLLARI = {
  m: { ekran: 'harita', dugme: 'harita', ac: () => haritaGoster() },
  b: { ekran: 'heybe', dugme: 'heybe', ac: () => heybeGoster(gezintiGoster) },
  k: { ekran: 'karakter', dugme: 'karakter', ac: () => karakterGoster(gezintiGoster) },
  g: { ekran: 'gunluk', dugme: 'gunluk', ac: () => gunlukGoster() },
  l: { ekran: 'il', dugme: 'bilgi', ac: () => ilGoster() },
};
const GEZINTI_EKRANLARI = new Set(['gezinti', 'harita', 'heybe', 'karakter', 'gunluk', 'il', 'arasta', 'ahi', 'kervansaray', 'gorev']);
let klavyePenceresi = null;

function klavyePenceresiniKapat() {
  klavyePenceresi?.remove();
  klavyePenceresi = null;
}

function klavyePenceresiniAc() {
  if (klavyePenceresi) return klavyePenceresiniKapat();
  const K = metinler.klavye;
  klavyePenceresi = document.createElement('div');
  klavyePenceresi.className = 'klavye-penceresi';
  klavyePenceresi.setAttribute('role', 'dialog');
  klavyePenceresi.setAttribute('aria-modal', 'true');
  klavyePenceresi.setAttribute('aria-label', K.baslik);
  klavyePenceresi.innerHTML = `
    <div class="klavye-kutusu">
      <h2>${K.baslik}</h2>
      ${K.gruplar.map((grup) => `
        <h3>${grup.baslik}</h3>
        <dl>${grup.satirlar.map(([tus, is]) => `<div><dt><kbd>${tus}</kbd></dt><dd>${is}</dd></div>`).join('')}</dl>`).join('')}
      <button class="buton buton-ana" data-eylem="kapat">${K.kapat}</button>
    </div>`;
  klavyePenceresi.addEventListener('click', (e) => {
    if (e.target === klavyePenceresi || e.target.closest('[data-eylem="kapat"]')) klavyePenceresiniKapat();
  });
  document.body.appendChild(klavyePenceresi);
  klavyePenceresi.querySelector('button').focus();
}

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  if (e.target.closest?.('input, textarea, select')) return;
  if (klavyePenceresi) {
    if (e.key === 'Escape' || e.key === '?') {
      e.preventDefault();
      klavyePenceresiniKapat();
    }
    return;
  }
  if (!depo || !GEZINTI_EKRANLARI.has(aktifEkran)) return;
  if (e.key === '?') {
    e.preventDefault();
    return klavyePenceresiniAc();
  }
  if (e.key === 'Escape') {
    if (aktifEkran === 'gezinti') return;
    // Haritada açık il kartını haritanın kendisi kapatır
    if (aktifEkran === 'harita' && uygulama.querySelector('.il-karti:not([hidden])')) return;
    e.preventDefault();
    const geri = uygulama.querySelector('.ust-cubuk [data-eylem="geri"], .ust-cubuk [data-eylem="gez"]');
    return geri ? geri.click() : gezintiGoster();
  }
  const k = EKRAN_KISAYOLLARI[e.key.toLowerCase()];
  if (!k) return;
  e.preventDefault();
  if (aktifEkran === k.ekran) return gezintiGoster();
  // Gezintideyken düğmeye basılmış gibi davranılır (savaşa girilirken ya da il
  // değişirken girdiyi yok sayan kontroller korunur)
  if (aktifEkran === 'gezinti') return uygulama.querySelector(`.gezinti-ekrani [data-eylem="${k.dugme}"]`)?.click();
  k.ac();
});

baslikGoster();
