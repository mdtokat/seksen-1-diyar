// Karakter ekranı: seviye, XP çubuğu, statlar, stat puanı dağıtma ve yetenekler.
import { siniflar, STAT_PUANI_DEGERI, DAL_SEVIYESI, YOLDAS_SEVIYESI } from '../veri/siniflar.js';
import { metinler } from '../veri/metinler.js';
import { statlar, gerekenXp, statPuaniDagit, STATLAR, dalSec, dalSecebilirMi, dalBilgisi } from '../oyun/karakter.js';
import { kacis, sablon, degerCubugu } from './bilesenler.js';
import { oyuncuCizimi } from './cizimler/karakterler.js';
import { yoldasCizimi } from './cizimler/yoldaslar.js';
import { TIK_MS } from '../oyun/catisma.js';
import { esyaBilgisi } from '../oyun/rota.js';
import { YUVALAR } from '../veri/esyalar.js';
import { kusan, kusanKontrol, cikar, kusaniliMi } from '../oyun/ekipman.js';
import { esyaKarti } from './esyaKarti.js';
import { kritikSansi, kritikCarpani, kacinmaSansi, canEsigiEtkinMi, pasifOzellik, KRITIK_TAVAN_CEVIKLIGI, KRITIK_CARPANI, KRITIK_EK_HASAR } from '../oyun/savas.js';
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
        const not = k.olur ? '' : sablon(E.neden[k.neden] ?? '', { seviye: esyaBilgisi(a).seviye });
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

// Yeteneğin savaştaki özellikleri (alan, sersemletme…) küçük etiketler olarak.
function yetenekEtiketleri(y, menzilMetni, sinifMenzili) {
  const E = M.etiketler;
  const etiketler = [];
  if (y.etki === 'hasar' && y.menzil && y.menzil !== sinifMenzili) etiketler.push(`🎯 ${menzilMetni(y.menzil)}`);
  if (y.vurus > 1) etiketler.push(sablon(E.vurus, { vurus: y.vurus }));
  if (y.alan) etiketler.push(y.alanMerkezi === 'oyuncu' ? E.alanOyuncu : sablon(E.alanHedef, { alan: y.alan }));
  if (y.sersemAlan) etiketler.push(sablon(E.sersemAlan, { alan: y.sersemAlan }));
  else if (y.sersem) etiketler.push(E.sersem);
  if (y.arindirir) etiketler.push(E.arindirir);
  if (y.zirhDelme) etiketler.push(E.zirhDelme);
  if (y.ekSifa) etiketler.push(sablon(E.ekSifa, { oran: Math.round(y.ekSifa * 100) }));
  if (y.etki === 'cosku') etiketler.push(E.cosku);
  return etiketler.map((e) => `<small class="yetenek-menzili">${e}</small>`).join(' ');
}

const yuzde = (oran) => Math.round(oran * 100);

// Pasifin dalın değiştirdiği değeri (türüne göre).
const PASIF_DEGERI = { can_esigi: 'guc', uzak_nisan: 'hasar', zafer_nefesi: 'nefes', yemek_bereketi: 'yemek' };

// Uzmanlık dalının getirdikleri, okunur satırlar olarak (veriden üretilir).
function dalEtkileri(sinifAnahtari, dalAnahtari) {
  const D = M.dal.etkiler;
  const dal = siniflar[sinifAnahtari].dallar[dalAnahtari];
  const satirlar = Object.entries(dal.statlar ?? {})
    .map(([stat, oran]) => sablon(D.stat, { stat: metinler.statAdlari[stat], oran: yuzde(oran) }));
  if (dal.kritikSansi) satirlar.push(sablon(D.kritikSansi, { oran: yuzde(dal.kritikSansi) }));
  if (dal.kritikHasari) satirlar.push(sablon(D.kritikHasari, { deger: String(dal.kritikHasari).replace('.', ',') }));
  if (dal.pasif) {
    const eski = pasifOzellik(sinifAnahtari);
    const alan = PASIF_DEGERI[eski.tur];
    satirlar.push(sablon(D.pasif, { pasif: eski.ad, eski: yuzde(eski[alan]), yeni: yuzde(pasifOzellik(sinifAnahtari, dalAnahtari)[alan]) }));
  }
  if (dal.korunma) satirlar.push(sablon(D.korunma, { oran: yuzde(dal.korunma) }));
  if (dal.sifaCarpani) satirlar.push(sablon(D.sifaCarpani, { oran: yuzde(dal.sifaCarpani) }));
  if (dal.alanCarpani) satirlar.push(sablon(D.alanCarpani, { oran: yuzde(dal.alanCarpani) }));
  if (dal.ekHasar) {
    const turler = dal.ekHasar.turler.map((t) => M.dal.turler[t]).join(' ve ');
    satirlar.push(sablon(D.ekHasar, { turler: turler[0].toLocaleUpperCase('tr') + turler.slice(1), oran: yuzde(dal.ekHasar.carpan - 1) }));
  }
  return satirlar;
}

// Yoldaş bölümü: çizimi, adı, ne yaptığı ve ne sıklıkla yardım ettiği; katılmadıysa kilitli.
function yoldasBolumu(o) {
  const Y = M.yoldas;
  const y = siniflar[o.sinif].yoldas;
  const katildi = o.seviye >= YOLDAS_SEVIYESI;
  const yuzde = (oran) => Math.round(oran * 100);
  const eylem = sablon(Y.eylemler[y.eylem], { menzil: y.menzil, oran: yuzde(y.carpan ?? 0), can: yuzde(y.can ?? 0), nefes: yuzde(y.nefes ?? 0) });
  const saniye = ((y.bekleme * TIK_MS) / 1000).toFixed(1).replace('.', ',');
  return `
    <section class="kart yoldas-karti${katildi ? '' : ' kilitli'}">
      <h3>🤝 ${Y.baslik}</h3>
      <div class="yoldas-ozet">
        <span class="yoldas-ikon">${yoldasCizimi(y.anahtar)}</span>
        <div>
          <strong>${kacis(y.ad)}</strong> <span class="yetenek-bedel">${kacis(y.tur)}</span>
          <p>${kacis(y.tarif)}</p>
        </div>
      </div>
      <ul class="dal-etkileri"><li>${kacis(eylem)}</li><li>${kacis(sablon(Y.aralik, { saniye }))}</li></ul>
      ${katildi ? '' : `<p class="kart-not">🔒 ${sablon(Y.kilitli, { seviye: YOLDAS_SEVIYESI })}</p>`}
    </section>`;
}

// Uzmanlık bölümü: seviyesi yetmeyene iki yol önizlenir; yetene seçim (onaylı) sunulur;
// seçmiş olana yalnızca seçtiği yol gösterilir. `onayDal`: onay bekleyen dal.
function dalBolumu(o, onayDal) {
  const D = M.dal;
  const dallar = siniflar[o.sinif].dallar;
  const secebilir = dalSecebilirMi(o);
  const gosterilen = o.dal ? [o.dal] : Object.keys(dallar);
  let not;
  if (o.dal) not = D.secildi;
  else if (secebilir) not = D.sec;
  else not = sablon(D.ileride, { seviye: DAL_SEVIYESI });
  const secenekler = gosterilen.map((a) => {
    const dal = dallar[a];
    let dugmeler = '';
    if (secebilir && onayDal === a) {
      dugmeler = `<p class="dal-onay">${kacis(sablon(D.onaySorusu, { dal: dal.ad }))}</p>
        <div class="dal-dugmeleri">
          <button class="buton buton-kucuk buton-ana" data-dal-onayla="${a}">${D.onayla}</button>
          <button class="buton buton-kucuk" data-dal-vazgec>${D.vazgec}</button>
        </div>`;
    } else if (secebilir) {
      dugmeler = `<div class="dal-dugmeleri"><button class="buton buton-kucuk" data-dal-sec="${a}">${D.secButonu}</button></div>`;
    }
    return `
      <li class="dal-secenegi${o.dal === a ? ' secili' : ''}${!o.dal && !secebilir ? ' kilitli' : ''}">
        <strong>${dal.ikon} ${kacis(dal.ad)}</strong>
        <p>${kacis(dal.tarif)}</p>
        <ul class="dal-etkileri">${dalEtkileri(o.sinif, a).map((e) => `<li>${kacis(e)}</li>`).join('')}</ul>
        ${dugmeler}
      </li>`;
  }).join('');
  return `
    <section class="kart dal-karti${secebilir ? ' secim-bekliyor' : ''}">
      <h3>🧭 ${D.baslik}</h3>
      <p class="kart-not${secebilir ? ' bilgi-not' : ''}">${not}</p>
      <ul class="dal-listesi">${secenekler}</ul>
    </section>`;
}
const ondalik = (sayi) => sayi.toFixed(2).replace(/0$/, '').replace('.', ',');

// Çevikliğin savaştaki karşılığı: kritik şansı, kritik hasarı ve sıyrılma. Kritik şansı
// tavana varınca fazla çevikliğin kritik hasarına gittiği belirtilir.
function kritikNotu(ceviklik) {
  const carpan = kritikCarpani(ceviklik);
  const satir = sablon(M.kritik, { sans: yuzde(kritikSansi(ceviklik)), carpan: ondalik(carpan), siyrilma: yuzde(kacinmaSansi(ceviklik)) });
  let ek = '';
  if (carpan >= KRITIK_CARPANI + KRITIK_EK_HASAR.enCok) ek = ` ${M.kritikTavan} ${M.kritikTavanSiniri}`;
  else if (ceviklik > KRITIK_TAVAN_CEVIKLIGI) ek = ` ${M.kritikTavan}`;
  return `<p class="kart-not">⚡ ${satir}.${ek}</p>`;
}

function icerik(durum, secilenYuva = null, onayDal = null) {
  const o = durum.oyuncu;
  const sinif = siniflar[o.sinif];
  const s = statlar(o);
  const gereken = gerekenXp(o.seviye);
  const puanVar = o.statPuani > 0;
  const menzilMetni = (menzil) => sablon(menzil === 1 ? metinler.savas.menzilDegeri[1] : metinler.savas.menzilDegeri.diger, { menzil });

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
        ${yetenekEtiketleri(y, menzilMetni, sinif.menzil)}
      </li>`;
  }).join('');

  return `
    <section class="kart karakter-ozet">
      <span class="karakter-ikon">${oyuncuCizimi(o)}</span>
      <div>
        <h2>${kacis(o.ad)}</h2>
        <p class="karakter-alt">${kacis(sinif.ad)}${dalBilgisi(o) ? ` · ${kacis(dalBilgisi(o).ad)}` : ''} · <strong>${sablon(M.seviye, { seviye: o.seviye })}</strong> · ${M.akce}: ${durum.akce ?? 0}</p>
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
      <p class="kart-not">🎯 ${metinler.savas.menzil}: ${menzilMetni(sinif.menzil)}</p>
      ${kritikNotu(s.ceviklik)}
    </section>
    ${ekipmanBolumu(durum)}
    <section class="kart pasif-karti">
      <h3>✦ ${M.pasif}</h3>
      <div class="yetenek-ust">
        <strong>${kacis(sinif.pasif.ad)}</strong>
        ${canEsigiEtkinMi({ sinif: o.sinif, dal: o.dal, can: o.can, canEnCok: s.can }) ? `<span class="yetenek-bedel pasif-etkin">${M.pasifEtkin}</span>` : ''}
      </div>
      <p>${kacis(sinif.pasif.aciklama)}</p>
    </section>
    ${yoldasBolumu(o)}
    ${dalBolumu(o, onayDal)}
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
  let onayDal = null;
  const ciz = (durum) => {
    alan.innerHTML = icerik(durum, secilenYuva, onayDal);
  };

  kap.querySelector('.karakter-ekrani').addEventListener('click', (e) => {
    const buton = e.target.closest('button');
    if (!buton) return;
    if (buton.dataset.eylem === 'geri') {
      geri?.();
    } else if (buton.dataset.dalSec) {
      onayDal = buton.dataset.dalSec;
      ciz(depo.al());
      alan.querySelector('[data-dal-onayla]')?.focus();
    } else if (buton.dataset.dalVazgec !== undefined) {
      const once = onayDal;
      onayDal = null;
      ciz(depo.al());
      alan.querySelector(`[data-dal-sec="${once}"]`)?.focus();
    } else if (buton.dataset.dalOnayla) {
      onayDal = null;
      const durum = depo.al();
      depo.ayarla({ ...durum, oyuncu: dalSec(durum.oyuncu, buton.dataset.dalOnayla) });
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
