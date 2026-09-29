// Savaş ekranı: can ve nefes çubukları, eylem butonları ve savaş günlüğü.
import { iller } from '../veri/iller.js';
import { siniflar } from '../veri/siniflar.js';
import { yemekler } from '../veri/yemekler.js';
import { metinler } from '../veri/metinler.js';
import {
  savasBaslat,
  oyuncuEylemi,
  eylemKontrol,
  yetenekBul,
  kacilabilirMi,
  savasSonucunuUygula,
} from '../oyun/savas.js';
import { gerekenXp } from '../oyun/karakter.js';
import { yemekAdedi, yemekGucu } from '../oyun/envanter.js';
import { kacis, sablon, degerCubugu, bildirimGoster } from './bilesenler.js';

const M = metinler.savas;
const G = M.gunluk;
const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));

// Savaş günlüğündeki bir olayı Türkçe cümleye çevirir.
// Sonuç: { metin, sinif } — sinif: 'oyuncu' | 'dusman' | 'bilgi' | 'zafer' | 'yenilgi'.
export function olayMetni(olay, savas) {
  const d = savas.dusman;
  const ek = (...parcalar) => parcalar.filter(Boolean).join(' ');
  switch (olay.tip) {
    case 'baslangic':
      return { sinif: 'bilgi', metin: sablon(G.baslangic, { ikon: d.ikon, dusman: d.ad, seviye: d.seviye }) };
    case 'saldiri':
      if (olay.kim === 'oyuncu') {
        return {
          sinif: 'oyuncu',
          metin: olay.kacindi
            ? sablon(G.dusmanKacindi, { dusman: d.ad })
            : ek(sablon(G.saldiri, { hasar: olay.hasar }), olay.kritik && G.kritik),
        };
      }
      return {
        sinif: 'dusman',
        metin: olay.kacindi
          ? sablon(G.oyuncuKacindi, { dusman: d.ad })
          : ek(sablon(G.dusmanSaldiri, { dusman: d.ad, hasar: olay.hasar }), olay.kritik && G.kritik, olay.korundu && G.korundu),
      };
    case 'yetenek': {
      const y = yetenekBul(savas.oyuncu.sinif, olay.yetenek);
      const degerler = { yetenek: y.ad, sure: olay.sure, miktar: olay.miktar, hasar: olay.hasar };
      if (olay.etki === 'sifa') return { sinif: 'oyuncu', metin: sablon(G.yetenekSifa, degerler) };
      if (olay.etki === 'savunma') return { sinif: 'oyuncu', metin: sablon(G.yetenekSavunma, degerler) };
      if (olay.etki === 'guclenme') return { sinif: 'oyuncu', metin: sablon(G.yetenekGuclenme, degerler) };
      if (olay.etki === 'kritik') return { sinif: 'oyuncu', metin: sablon(G.yetenekKritik, degerler) };
      return {
        sinif: 'oyuncu',
        metin: olay.kacindi
          ? `${y.ad}: ${sablon(G.dusmanKacindi, { dusman: d.ad })}`
          : ek(sablon(G.yetenekHasar, degerler), olay.kritik && G.kritik, olay.ekHasar && G.ekHasar),
      };
    }
    case 'yemek':
      return {
        sinif: 'oyuncu',
        metin: sablon(G.yemek, {
          yemek: yemekler[olay.yemek].ad,
          miktar: olay.miktar,
          tur: metinler.statAdlari[olay.yenilenen].toLocaleLowerCase('tr'),
        }),
      };
    case 'ozel_hamle': {
      const degerler = { dusman: d.ad, hamle: olay.hamle, hasar: olay.hasar, sure: olay.sure };
      if (olay.etki === 'zayiflatma') return { sinif: 'dusman', metin: sablon(G.zayiflatma, degerler) };
      return {
        sinif: 'dusman',
        metin: olay.kacindi
          ? sablon(G.ozelKacindi, degerler)
          : ek(sablon(G.ozelHamle, degerler), olay.kritik && G.kritik, olay.korundu && G.korundu),
      };
    }
    case 'kacis':
      return {
        sinif: 'bilgi',
        metin: olay.basarili ? G.kacisBasarili : sablon(G.kacisBasarisiz, { dusman: d.ad }),
      };
    case 'zafer':
      return { sinif: 'zafer', metin: sablon(M.dagilma[d.tur], { dusman: d.ad }) };
    case 'yenilgi':
      return { sinif: 'yenilgi', metin: G.yenilgi };
    default:
      return { sinif: 'bilgi', metin: '' };
  }
}

// Ekranı `kap` içine kurar. Savaş bitince sonuç depoya yazılır.
// secenekler: { dusman, rng, sonucuUygula, bitince, karakterGoster }
// sonucuUygula(durum, savas) → { durum, ozet }: varsayılanı savasSonucunuUygula;
// keşif savaşında arınma ve ganimeti de ekleyen sürüm verilir.
export function savasEkrani(kap, depo, { dusman, rng, sonucuUygula = savasSonucunuUygula, bitince, karakterGoster } = {}) {
  const baslangic = depo.al();
  const il = ilHaritasi.get(baslangic.konum);
  const sinif = siniflar[baslangic.oyuncu.sinif];
  let savas = savasBaslat(baslangic.oyuncu, dusman, baslangic.heybe ?? []);
  let panel = 'ana'; // 'ana' | 'yetenek' | 'yemek' | 'son'
  let ozet = null;
  let sonDurum = null;

  kap.innerHTML = `
    <div class="savas-ekrani">
      <header class="ust-cubuk">
        <h1 class="ust-baslik">⚔️ ${M.baslik} <span class="ust-alt">${kacis(il.ad)}</span></h1>
      </header>
      <main class="savas-alani">
        <section class="savasci savasci-dusman" aria-label="${kacis(dusman.ad)}"></section>
        <ol class="savas-gunlugu" aria-live="polite"></ol>
        <section class="savasci savasci-oyuncu" aria-label="${kacis(baslangic.oyuncu.ad)}"></section>
      </main>
      <nav class="eylem-paneli"></nav>
    </div>`;

  const ekran = kap.querySelector('.savas-ekrani');
  const dusmanAlani = ekran.querySelector('.savasci-dusman');
  const oyuncuAlani = ekran.querySelector('.savasci-oyuncu');
  const gunluk = ekran.querySelector('.savas-gunlugu');
  const eylemPaneli = ekran.querySelector('.eylem-paneli');
  let yazilanOlay = 0;

  function dusmanCiz() {
    const d = savas.dusman;
    dusmanAlani.innerHTML = `
      <span class="savasci-ikon" aria-hidden="true">${d.ikon}</span>
      <div class="savasci-bilgi">
        <h2>${kacis(d.ad)} <span class="rozet">${sablon(M.seviye, { seviye: d.seviye })}</span></h2>
        <p class="savasci-tur">${metinler.dusmanTurleri[d.tur]}</p>
        ${degerCubugu(d.can, d.canEnCok, { etiket: metinler.statAdlari.can, renk: 'var(--mercan)' })}
      </div>`;
  }

  function oyuncuCiz() {
    const o = savas.oyuncu;
    const etkiler = savas.etkiler
      .filter((e) => e.hedef === 'oyuncu')
      .map((e) => `<li class="etki etki-${e.etki}">${sablon(M.etkiler[e.etki], { kalan: e.kalan })}</li>`)
      .join('');
    oyuncuAlani.innerHTML = `
      <span class="savasci-ikon" aria-hidden="true">${sinif.ikon}</span>
      <div class="savasci-bilgi">
        <h2>${kacis(o.ad)} <span class="rozet">${sablon(M.seviye, { seviye: o.seviye })}</span></h2>
        ${degerCubugu(o.can, o.canEnCok, { etiket: metinler.statAdlari.can, renk: 'var(--mercan)' })}
        ${degerCubugu(o.nefes, o.nefesEnCok, { etiket: metinler.statAdlari.nefes, renk: 'var(--turkuaz)' })}
        ${etkiler ? `<ul class="etki-listesi">${etkiler}</ul>` : ''}
      </div>`;
  }

  function gunlukCiz() {
    for (; yazilanOlay < savas.gunluk.length; yazilanOlay++) {
      const { metin, sinif: tur } = olayMetni(savas.gunluk[yazilanOlay], savas);
      if (!metin) continue;
      const satir = document.createElement('li');
      satir.className = `gunluk-${tur}`;
      satir.textContent = metin;
      gunluk.appendChild(satir);
    }
    gunluk.scrollTop = gunluk.scrollHeight;
  }

  function anaPanel() {
    const kacmaYok = !kacilabilirMi(savas.dusman);
    return `
      <div class="eylem-izgarasi">
        <button class="buton buton-ana" data-eylem="saldir">⚔️ ${M.saldir}</button>
        <button class="buton" data-eylem="yetenek-ac">✨ ${M.yetenek}</button>
        <button class="buton" data-eylem="yemek-ac">🍲 ${M.yemek}</button>
        <button class="buton" data-eylem="kac" ${kacmaYok ? `disabled title="${M.kacilamaz}"` : ''}>🏃 ${M.kac}</button>
      </div>`;
  }

  function yetenekPaneli() {
    const liste = savas.oyuncu.yetenekler.map((anahtar) => {
      const y = yetenekBul(savas.oyuncu.sinif, anahtar);
      const kontrol = eylemKontrol(savas, { tur: 'yetenek', anahtar });
      return `
        <li>
          <button class="secenek" data-yetenek="${anahtar}" ${kontrol.olur ? '' : 'disabled'}>
            <span class="secenek-ust"><strong>${kacis(y.ad)}</strong>
              <span class="secenek-bedel">${sablon(metinler.karakter.yetenekNefes, { nefes: y.nefes })}</span></span>
            <small>${kacis(kontrol.neden === 'nefes_yetersiz' ? M.nefesYetersiz : y.aciklama)}</small>
          </button>
        </li>`;
    }).join('');
    return `
      <ul class="secenek-listesi">${liste}</ul>
      <button class="buton geri-buton" data-eylem="geri">← ${M.geri}</button>`;
  }

  function yemekPaneli() {
    const anahtarlar = [...new Set(savas.heybe.map((h) => h.anahtar))];
    const liste = anahtarlar.length
      ? `<ul class="secenek-listesi">${anahtarlar.map((anahtar) => {
          const y = yemekler[anahtar];
          const etki = sablon(metinler.envanter.etki, {
            miktar: yemekGucu(anahtar),
            tur: metinler.statAdlari[y.tur].toLocaleLowerCase('tr'),
          });
          return `
            <li><button class="secenek" data-yemek="${anahtar}">
              <span class="secenek-ust"><strong><span aria-hidden="true">${y.ikon}</span> ${kacis(y.ad)} ×${yemekAdedi(savas.heybe, anahtar)}</strong>
                <span class="secenek-bedel">${etki}</span></span>
              <small>${kacis(y.aciklama)}</small>
            </button></li>`;
        }).join('')}</ul>`
      : `<p class="bos-not">${M.heybeBos}</p>`;
    return `${liste}<button class="buton geri-buton" data-eylem="geri">← ${M.geri}</button>`;
  }

  function sonucPaneli() {
    const S = M.sonuc;
    const satirlar = [];
    if (ozet.sonuc === 'zafer') {
      satirlar.push(sablon(S.xp, { xp: ozet.xp }));
      if (ozet.seviyeler.length) {
        satirlar.push(`<strong class="kutlama">${sablon(S.seviyeAtladin, { seviye: ozet.seviyeler.at(-1) })}</strong>`);
        satirlar.push(sablon(S.statPuaniKazandin, { puan: sonDurum.oyuncu.statPuani }));
      }
      for (const y of ozet.yeniYetenekler) satirlar.push(`<strong>${sablon(S.yeniYetenek, { yetenek: kacis(y.ad) })}</strong>`);
      if (ozet.akce) satirlar.push(sablon(S.akce, { akce: ozet.akce }));
      if (ozet.yemek) {
        const y = yemekler[ozet.yemek];
        satirlar.push(sablon(ozet.yemekSigmadi ? S.yemekSigmadi : S.yemek, { ikon: y.ikon, yemek: kacis(y.ad) }));
      }
      if (ozet.arinmaArtisi) satirlar.push(sablon(S.arinma, { artis: ozet.arinmaArtisi, yuzde: ozet.arinma }));
      if (ozet.arindi) satirlar.push(`<strong class="kutlama">${sablon(S.arindi, { il: kacis(il.ad) })}</strong>`);
    } else if (ozet.sonuc === 'yenilgi') {
      satirlar.push(sablon(S.bayilma, { il: kacis(il.ad) }));
      if (ozet.akceKaybi > 0) satirlar.push(sablon(S.akceKaybi, { akce: ozet.akceKaybi }));
    } else {
      satirlar.push(S.kacis);
    }
    const o = sonDurum.oyuncu;
    const xpCubugu = ozet.sonuc === 'zafer'
      ? degerCubugu(o.xp, gerekenXp(o.seviye), { etiket: 'XP', renk: 'var(--altin)' })
      : '';
    const karakterButonu = o.statPuani > 0
      ? `<button class="buton" data-eylem="karakter">${S.karakteriAc}</button>`
      : '';
    return `
      <section class="savas-sonu savas-sonu-${ozet.sonuc}">
        <h2>${S[ozet.sonuc]}</h2>
        ${satirlar.map((s) => `<p>${s}</p>`).join('')}
        ${xpCubugu}
        <div class="sonuc-butonlari">
          <button class="buton buton-ana" data-eylem="devam">${S.devam}</button>
          ${karakterButonu}
        </div>
      </section>`;
  }

  function panelCiz() {
    eylemPaneli.innerHTML = { ana: anaPanel, yetenek: yetenekPaneli, yemek: yemekPaneli, son: sonucPaneli }[panel]();
    eylemPaneli.querySelector('button:not([disabled])')?.focus({ preventScroll: true });
  }

  function ciz() {
    dusmanCiz();
    oyuncuCiz();
    gunlukCiz();
    panelCiz();
  }

  function savasBitti() {
    const r = sonucuUygula(depo.al(), savas);
    ozet = r.ozet;
    sonDurum = r.durum;
    depo.ayarla(r.durum);
    panel = 'son';
    if (ozet.arindi) {
      bildirimGoster(ekran, sablon(M.sonuc.arindi, { il: il.ad }), { tur: 'kutlama', sure: 3500 });
    }
    if (ozet.seviyeler.length) {
      bildirimGoster(ekran, sablon(M.sonuc.seviyeAtladin, { seviye: ozet.seviyeler.at(-1) }), { tur: 'kutlama', sure: 3500 });
      for (const y of ozet.yeniYetenekler) {
        bildirimGoster(ekran, sablon(M.sonuc.yeniYetenek, { yetenek: y.ad }), { tur: 'kutlama', sure: 3500 });
      }
    }
  }

  function eylemYap(eylem) {
    const yeni = oyuncuEylemi(savas, eylem, rng);
    if (yeni === savas) return;
    savas = yeni;
    panel = 'ana';
    if (savas.sonuc) savasBitti();
    ciz();
  }

  ekran.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.yetenek) return eylemYap({ tur: 'yetenek', anahtar: b.dataset.yetenek });
    if (b.dataset.yemek) return eylemYap({ tur: 'yemek', anahtar: b.dataset.yemek });
    switch (b.dataset.eylem) {
      case 'saldir': return eylemYap({ tur: 'saldir' });
      case 'kac': return eylemYap({ tur: 'kac' });
      case 'yetenek-ac': panel = 'yetenek'; return panelCiz();
      case 'yemek-ac': panel = 'yemek'; return panelCiz();
      case 'geri': panel = 'ana'; return panelCiz();
      case 'devam': return bitince?.();
      case 'karakter': return karakterGoster?.();
    }
  });

  ciz();
}
