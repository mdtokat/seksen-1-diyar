// Görev günlüğü (plan.md Faz 9): itibar ve unvan, üstlenilen görevler, açık
// bölgelerde bekleyen görevler, bölge bölge tamamlananlar ve başarımlar (Faz 10).
import { iller } from '../veri/iller.js';
import { bolgeler } from '../veri/bolgeler.js';
import { gorevler } from '../veri/gorevler.js';
import { basarimlar } from '../veri/basarimlar.js';
import { metinler } from '../veri/metinler.js';
import { gorevDurumu } from '../oyun/gorevler.js';
import { hayirPuani, itibarKademesi, sonrakiKademe } from '../oyun/itibar.js';
import { kacis, sablon, degerCubugu } from './bilesenler.js';
import { gorevKarti } from './gorevKarti.js';

const M = metinler.gunluk;
const I = metinler.itibar;
const G = metinler.gorev;
const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const ANAHTARLAR = Object.keys(gorevler);

// Unvanın sağladığı ayrıcalıklar (HTML listesi).
function ayricaliklar(kademe) {
  const liste = [
    kademe.indirim > 0 && sablon(I.indirim, { oran: Math.round(kademe.indirim * 100) }),
    kademe.hediye > 0 && sablon(I.hediye, { adet: kademe.hediye }),
  ].filter(Boolean);
  return liste.length ? `<ul class="ayricalik-listesi">${liste.map((s) => `<li>${s}</li>`).join('')}</ul>` : `<p class="bos-not">${I.ayricalikYok}</p>`;
}

function itibarBolumu(durum) {
  const puan = hayirPuani(durum);
  const kademe = itibarKademesi(durum);
  const sonraki = sonrakiKademe(durum);
  const cubuk = sonraki
    ? degerCubugu(puan, sonraki.esik, { etiket: I.hayir, renk: 'var(--altin)' })
    : '';
  return `
    <section class="kart itibar-karti">
      <h3>🌟 ${I.baslik}</h3>
      <p class="itibar-unvan"><span>${I.unvan}</span> <strong>${kacis(kademe.ad)}</strong> <span class="rozet">${I.hayir}: ${puan}</span></p>
      ${cubuk}
      <p class="kart-not bilgi-not">${sonraki ? sablon(I.sonraki, { unvan: kacis(sonraki.ad), kalan: sonraki.esik - puan }) : I.enYuksek}</p>
      ${ayricaliklar(kademe)}
      <p class="kart-not">${I.kazanma}</p>
    </section>`;
}

function basarimBolumu(durum) {
  const B = metinler.basarim;
  const kazanilan = durum.basarimlar ?? [];
  const liste = Object.entries(basarimlar).map(([a, b]) => {
    const var_ = kazanilan.includes(a);
    return `
      <li class="basarim${var_ ? ' kazanildi' : ''}">
        <span class="basarim-ikon" aria-hidden="true">${var_ ? b.ikon : '🔒'}</span>
        <div><strong>${kacis(b.ad)}</strong>${var_ ? '' : ` <span class="gorev-rozeti">${B.kilitli}</span>`}<small>${kacis(b.aciklama)}</small></div>
      </li>`;
  }).join('');
  return `
    <section class="kart">
      <h3>🏅 ${B.baslik} <span class="rozet">${sablon(B.sayac, { kazanilan: kazanilan.length, toplam: Object.keys(basarimlar).length })}</span></h3>
      <ul class="basarim-listesi">${liste}</ul>
      ${durum.zulmetYenildi ? `<button class="buton buton-genis" data-eylem="bitis">🏰 ${metinler.bitis.yenidenIzle}</button>` : ''}
    </section>`;
}

function icerik(durum) {
  const durumlar = Object.fromEntries(ANAHTARLAR.map((a) => [a, gorevDurumu(durum, a)]));
  // Önce teslime hazır olanlar
  const aktif = ANAHTARLAR.filter((a) => durumlar[a] === 'hazir' || durumlar[a] === 'aktif')
    .sort((a, b) => Number(durumlar[b] === 'hazir') - Number(durumlar[a] === 'hazir'));
  const acik = ANAHTARLAR.filter((a) => durumlar[a] === 'alinabilir');
  // Bölgeler açıldıkları sırayla (yolculuğun rotası)
  const tamamSayilari = durum.acikBolgeler.map((a) => bolgeler.find((b) => b.anahtar === a)).map((b) => {
    const bolgeninki = ANAHTARLAR.filter((a) => gorevler[a].bolge === b.anahtar);
    const tamam = bolgeninki.filter((a) => durumlar[a] === 'tamam');
    return `
      <li class="bolge-sayaci">
        <span class="bolge-noktasi" style="background:${b.renk}"></span>
        <span>${kacis(b.ad)}</span>
        <strong>${sablon(M.bolgeSayaci, { tamam: tamam.length, toplam: bolgeninki.length })}</strong>
        ${tamam.length ? `<small>${tamam.map((a) => kacis(gorevler[a].ad)).join(' · ')}</small>` : ''}
      </li>`;
  }).join('');

  const acikListesi = acik.map((a) => {
    const g = gorevler[a];
    return `
      <li class="yolculuk-satiri">
        <span class="bolge-noktasi" style="background:${bolgeler.find((b) => b.anahtar === g.bolge).renk}"></span>
        <div class="yolculuk-bilgi"><strong>${kacis(g.ad)}</strong>
          <small>📍 ${kacis(sablon(M.acikSatir, { il: ilHaritasi.get(g.il).ad, veren: G.verenler[g.veren] }))}</small></div>
      </li>`;
  }).join('');

  return `
    ${itibarBolumu(durum)}
    <section class="kart">
      <h3>📜 ${M.aktif}</h3>
      ${aktif.length ? `<ul class="esya-listesi">${aktif.map((a) => gorevKarti(durum, a)).join('')}</ul>` : `<p class="bos-not">${M.aktifYok}</p>`}
    </section>
    <section class="kart">
      <h3>❗ ${M.acik}</h3>
      ${acik.length ? `<ul class="yolculuk-listesi">${acikListesi}</ul>` : `<p class="bos-not">${M.acikYok}</p>`}
    </section>
    <section class="kart">
      <h3>✓ ${M.tamam}</h3>
      <ul class="bolge-sayaclari">${tamamSayilari}</ul>
    </section>
    ${basarimBolumu(durum)}`;
}

// Ekranı `kap` içine kurar. Temizlik fonksiyonu döndürür.
// secenekler: { geri, bitisGoster }
export function gunlukEkrani(kap, depo, { geri, bitisGoster } = {}) {
  kap.innerHTML = `
    <div class="sayfa-ekrani gunluk-ekrani">
      <header class="ust-cubuk">
        <button class="simge-buton" data-eylem="geri" aria-label="${M.geri}" title="${M.geri}">←</button>
        <h1 class="ust-baslik">📜 ${M.baslik}</h1>
      </header>
      <main class="sayfa-icerik"></main>
    </div>`;
  const alan = kap.querySelector('.sayfa-icerik');
  const ciz = (durum) => {
    alan.innerHTML = icerik(durum);
  };
  kap.querySelector('.gunluk-ekrani').addEventListener('click', (e) => {
    if (e.target.closest('[data-eylem="geri"]')) geri?.();
    if (e.target.closest('[data-eylem="bitis"]')) bitisGoster?.();
  });
  const cik = depo.abone(ciz);
  ciz(depo.al());
  return cik;
}
