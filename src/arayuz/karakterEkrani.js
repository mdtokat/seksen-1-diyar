// Karakter ekranı: seviye, XP çubuğu, statlar, stat puanı dağıtma ve yetenekler.
import { siniflar, STAT_PUANI_DEGERI } from '../veri/siniflar.js';
import { metinler } from '../veri/metinler.js';
import { statlar, gerekenXp, statPuaniDagit, STATLAR } from '../oyun/karakter.js';
import { kacis, sablon, degerCubugu } from './bilesenler.js';
import { sinifCizimi } from './cizimler/karakterler.js';
import { esyalar, YUVALAR } from '../veri/esyalar.js';
import { kusan, kusanKontrol, cikar, kusaniliMi } from '../oyun/ekipman.js';
import { esyaKarti } from './esyaKarti.js';
import { hayirPuani, itibarKademesi } from '../oyun/itibar.js';
import { kisayolAta, bosKisayollar } from '../oyun/kisayollar.js';
import { yuvaDugmeleri, secimListesi, koddanIcerik } from './kisayolYuvalari.js';

// Savaş kısayol yuvaları: bir yuvaya dokununca altında seçim listesi açılır.
function kisayolBolumu(durum, secilenYuva) {
  const K = metinler.kisayol;
  const yuvalar = durum.kisayollar ?? bosKisayollar();
  return `
    <section class="kart kisayol-karti">
      <h3>⌨️ ${K.baslik}</h3>
      <p class="kart-not bilgi-not">${K.aciklama}</p>
      <div class="kisayol-yuvalari">${yuvaDugmeleri(yuvalar, { sinif: durum.oyuncu.sinif, heybe: durum.heybe, secili: secilenYuva })}</div>
      ${secilenYuva === null ? '' : secimListesi(durum.oyuncu, durum.heybe, yuvalar, secilenYuva)}
    </section>`;
}

const E = metinler.ekipman;

// Ekipman bölümü: üç yuva ve çantadaki eşyalar.
function ekipmanBolumu(durum) {
  const o = durum.oyuncu;
  const yuvalar = YUVALAR.map((yuva) => {
    const a = o.kusanilan?.[yuva];
    if (!a) return `<li class="bos-yuva"><span>${metinler.yuvaAdlari[yuva]}</span><em>${E.bos}</em></li>`;
    return esyaKarti(a, { sag: `<button class="buton buton-kucuk" data-cikar="${yuva}">${E.cikar}</button>` });
  }).join('');
  const canta = (durum.esyalar ?? []).filter((a) => !kusaniliMi(durum, a));
  const cantaListesi = canta.length
    ? `<ul class="esya-listesi">${canta.map((a) => {
        const k = kusanKontrol(durum, a);
        const not = k.olur ? '' : sablon(E.neden[k.neden] ?? '', { seviye: esyalar[a].seviye });
        return esyaKarti(a, {
          sag: `<button class="buton buton-kucuk" data-kusan="${a}" ${k.olur ? '' : 'disabled'}>${E.kusan}</button>`,
          not,
          soluk: !k.olur,
        });
      }).join('')}</ul>`
    : `<p class="bos-not">${E.cantaBos}</p>`;
  return `
    <section class="kart">
      <h3>⚔️ ${E.baslik}</h3>
      <ul class="esya-listesi ekipman-yuvalari">${yuvalar}</ul>
      <h3 class="alt-baslik-kucuk">🎒 ${E.canta}</h3>
      ${cantaListesi}
    </section>`;
}

const M = metinler.karakter;

function icerik(durum, secilenYuva = null) {
  const o = durum.oyuncu;
  const sinif = siniflar[o.sinif];
  const s = statlar(o);
  const gereken = gerekenXp(o.seviye);
  const puanVar = o.statPuani > 0;

  const statSatirlari = STATLAR.map((stat) => {
    const ad = metinler.statAdlari[stat];
    const artis = STAT_PUANI_DEGERI[stat];
    const buton = puanVar
      ? `<button class="simge-buton puan-ver" data-stat="${stat}"
           aria-label="${kacis(sablon(M.puanVer, { stat: ad, artis }))}"
           title="${kacis(sablon(M.puanVer, { stat: ad, artis }))}">+</button>`
      : '';
    return `
      <li class="stat-satiri">
        <span class="stat-ad">${ad}</span>
        <span class="stat-deger">${s[stat]}</span>
        ${buton}
      </li>`;
  }).join('');

  const yetenekler = sinif.yetenekler.map((y) => {
    const acik = y.seviye <= o.seviye;
    return `
      <li class="yetenek-satiri${acik ? '' : ' kilitli'}">
        <div class="yetenek-ust">
          <strong>${acik ? '' : '🔒 '}${kacis(y.ad)}</strong>
          <span class="yetenek-bedel">${acik ? sablon(M.yetenekNefes, { nefes: y.nefes }) : sablon(M.yetenekKilitli, { seviye: y.seviye })}</span>
        </div>
        <p>${kacis(y.aciklama)}</p>
      </li>`;
  }).join('');

  return `
    <section class="kart karakter-ozet">
      <span class="karakter-ikon">${sinifCizimi(o.sinif)}</span>
      <div>
        <h2>${kacis(o.ad)}</h2>
        <p class="karakter-alt">${kacis(sinif.ad)} · <strong>${sablon(M.seviye, { seviye: o.seviye })}</strong> · ${M.akce}: ${durum.akce ?? 0}</p>
        <p class="karakter-alt">🌟 ${kacis(itibarKademesi(durum).ad)} · ${M.hayir}: ${hayirPuani(durum)}</p>
      </div>
    </section>
    <section class="kart">
      <h3>${M.xp}</h3>
      ${durum.sofra?.kalan > 0 ? `<p class="kart-not arinmis-not">🍽️ ${sablon(metinler.boss.sofraDurumu, { kalan: durum.sofra.kalan })}</p>` : ''}
      ${degerCubugu(o.xp, gereken, { etiket: 'XP', renk: 'var(--altin)' })}
      <div class="cubuk-grubu">
        ${degerCubugu(o.can, s.can, { etiket: metinler.statAdlari.can, renk: 'var(--mercan)' })}
        ${degerCubugu(o.nefes, s.nefes, { etiket: metinler.statAdlari.nefes, renk: 'var(--turkuaz)' })}
      </div>
    </section>
    <section class="kart">
      <h3>${M.statlar}</h3>
      <p class="stat-puani${puanVar ? ' var' : ''}">
        ${puanVar ? sablon(M.statPuani, { puan: o.statPuani }) : M.statPuaniYok}
      </p>
      <ul class="stat-listesi">${statSatirlari}</ul>
    </section>
    ${ekipmanBolumu(durum)}
    <section class="kart">
      <h3>${M.yetenekler}</h3>
      <ul class="yetenek-listesi">${yetenekler}</ul>
    </section>
    ${kisayolBolumu(durum, secilenYuva)}`;
}

// Ekranı `kap` içine kurar. Temizlik fonksiyonu döndürür.
export function karakterEkrani(kap, depo, { geri } = {}) {
  kap.innerHTML = `
    <div class="sayfa-ekrani karakter-ekrani">
      <header class="ust-cubuk">
        <button class="simge-buton" data-eylem="geri" aria-label="${M.geri}" title="${M.geri}">←</button>
        <h1 class="ust-baslik">${M.baslik}</h1>
      </header>
      <main class="sayfa-icerik" aria-live="polite"></main>
    </div>`;

  const alan = kap.querySelector('.sayfa-icerik');
  let secilenYuva = null;
  const ciz = (durum) => {
    alan.innerHTML = icerik(durum, secilenYuva);
  };

  kap.querySelector('.karakter-ekrani').addEventListener('click', (e) => {
    const buton = e.target.closest('button');
    if (!buton) return;
    if (buton.dataset.eylem === 'geri') {
      geri?.();
    } else if (buton.dataset.kisayol !== undefined) {
      const sira = Number(buton.dataset.kisayol);
      secilenYuva = secilenYuva === sira ? null : sira;
      ciz(depo.al());
      alan.querySelector(secilenYuva === null ? `[data-kisayol="${sira}"]` : '[data-kisayol-icerik]')?.focus();
    } else if (buton.dataset.kisayolIcerik !== undefined) {
      const sira = secilenYuva;
      secilenYuva = null;
      const once = depo.al();
      const sonra = kisayolAta(once, sira, koddanIcerik(buton.dataset.kisayolIcerik));
      if (sonra === once) ciz(once);
      else depo.ayarla(sonra);
      alan.querySelector(`[data-kisayol="${sira}"]`)?.focus();
    } else if (buton.dataset.kusan) {
      depo.ayarla(kusan(depo.al(), buton.dataset.kusan));
    } else if (buton.dataset.cikar) {
      depo.ayarla(cikar(depo.al(), buton.dataset.cikar));
    } else if (buton.dataset.stat) {
      const durum = depo.al();
      depo.ayarla({ ...durum, oyuncu: statPuaniDagit(durum.oyuncu, buton.dataset.stat) });
      alan.querySelector(`[data-stat="${buton.dataset.stat}"]`)?.focus();
    }
  });

  const aboneliktenCik = depo.abone(ciz);
  ciz(depo.al());
  return aboneliktenCik;
}
