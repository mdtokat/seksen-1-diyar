// Savaş ekranı: can ve nefes çubukları, eylem butonları ve savaş günlüğü.
import { iller } from '../veri/iller.js';
import { yemekler } from '../veri/yemekler.js';
import { dusmanlar as dusmanVerisi } from '../veri/dusmanlar.js';
import { esyalar as esyaVerisi } from '../veri/esyalar.js';
import { gorevler as gorevVerisi } from '../veri/gorevler.js';
import { metinler } from '../veri/metinler.js';
import {
  savasBaslat,
  oyuncuEylemi,
  hedefSec,
  canlilar,
  kalabalikMi,
  eylemKontrol,
  yetenekBul,
  kacilabilirMi,
  savasSonucunuUygula,
} from '../oyun/savas.js';
import { gerekenXp } from '../oyun/karakter.js';
import { sofraGucCarpani, SOFRA } from '../oyun/ilerleme.js';
import { bolgeler } from '../veri/bolgeler.js';
import { yemekAdedi, yemekGucu } from '../oyun/envanter.js';
import { kisayolAta, kisayolEylemi, bosKisayollar } from '../oyun/kisayollar.js';
import { yuvaDugmeleri, secimListesi, koddanIcerik } from './kisayolYuvalari.js';
import { kacis, sablon, degerCubugu, bildirimGoster, parilti } from './bilesenler.js';
import { sesCal } from './ses.js';
import { sinifCizimi } from './cizimler/karakterler.js';
import { dusmanCizimi } from './cizimler/dusmanlar.js';
import { bolgeArkaPlani } from './cizimler/arkaplanlar.js';

const M = metinler.savas;
const G = M.gunluk;
const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const dusmanAdi = (anahtar) => dusmanVerisi[anahtar].ad;

// Kalabalık savaşta aynı türden yaratıklar numaralanır ("Aç kurt 2"); diğer durumlarda ad olduğu gibi.
export function yaratikAdi(d, savas) {
  const ayni = (savas.grup ?? []).filter((g) => g.anahtar === d.anahtar).length > 1;
  return ayni && d.no ? `${d.ad} ${d.no}` : d.ad;
}

// Savaş günlüğündeki bir olayı Türkçe cümleye çevirir.
// Sonuç: { metin, sinif } — sinif: 'oyuncu' | 'dusman' | 'bilgi' | 'zafer' | 'yenilgi'.
export function olayMetni(olay, savas) {
  // Kalabalık savaşta olay hangi yaratığa aitse o; yoksa hedef
  const y = olay.no ? (savas.grup ?? []).find((g) => g.no === olay.no) ?? savas.dusman : savas.dusman;
  const d = { ...y, ad: yaratikAdi(y, savas) };
  const ek = (...parcalar) => parcalar.filter(Boolean).join(' ');
  switch (olay.tip) {
    case 'baslangic':
      if (kalabalikMi(savas)) {
        const adlar = savas.grup.map((g) => kacis(yaratikAdi(g, savas)));
        const liste = adlar.length > 2 ? `${adlar.slice(0, -1).join(', ')}${M.ve}${adlar.at(-1)}` : adlar.join(M.ve);
        return { sinif: 'bilgi', metin: sablon(G.baslangicGrup, { dusmanlar: liste }) };
      }
      return { sinif: 'bilgi', metin: sablon(G.baslangic, { dusman: d.ad, seviye: d.seviye }) };
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
        metin: olay.basarili ? G.kacisBasarili
          : kalabalikMi(savas) ? G.kacisBasarisizGrup : sablon(G.kacisBasarisiz, { dusman: d.ad }),
      };
    case 'dusman_dustu':
      return { sinif: 'zafer', metin: sablon(M.dagilma[d.tur], { dusman: d.ad }) };
    case 'zafer':
      if (kalabalikMi(savas)) return { sinif: 'zafer', metin: G.grupZafer };
      return { sinif: 'zafer', metin: sablon(M.dagilma[d.tur], { dusman: d.ad }) };
    case 'evre':
      return { sinif: 'dusman', metin: sablon(olay.no ? metinler.final.evreler[olay.no] : G.evre, { dusman: d.ad }) };
    case 'yenilgi':
      return { sinif: 'yenilgi', metin: G.yenilgi };
    case 'gezgin':
      return { sinif: 'dusman', metin: sablon(G.gezgin[olay.tehlike], { dusman: d.ad }) };
    default:
      return { sinif: 'bilgi', metin: '' };
  }
}

// ── Sahne efektleri ──────────────────────────────────────

const VURUS = `<svg viewBox="-20 -20 40 40" aria-hidden="true"><polygon points="0,-18 4,-6 17,-8 7,1 13,14 0,6 -13,14 -7,1 -17,-8 -4,-6" /></svg>`;

const hareketAzMi = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const bekle = (ms) => new Promise((coz) => setTimeout(coz, ms));

// Bir öğeye kısa süreli animasyon sınıfı ekler.
function titret(oge, sinif, sure = 450) {
  oge.classList.remove(sinif);
  void oge.getBoundingClientRect(); // animasyon baştan başlasın
  oge.classList.add(sinif);
  setTimeout(() => oge.classList.remove(sinif), sure);
}

// Figürün üzerinde yükselip kaybolan sayı ya da kısa yazı.
function yaziUcur(figur, metin, tur) {
  const y = document.createElement('span');
  y.className = `ucan-yazi ucan-${tur}`;
  y.textContent = metin;
  y.setAttribute('aria-hidden', 'true');
  figur.appendChild(y);
  setTimeout(() => y.remove(), 1100);
}

function vurusGoster(figur) {
  const v = document.createElement('span');
  v.className = 'vurus';
  v.innerHTML = VURUS;
  figur.appendChild(v);
  setTimeout(() => v.remove(), 450);
}

// Ekranı `kap` içine kurar. Savaş bitince sonuç depoya yazılır. Temizlik fonksiyonu döndürür.
// secenekler: { dusman, yoldaslar (aynı anda saldıran diğer yaratıklar), rng, sonucuUygula, bitince, karakterGoster }
// sonucuUygula(durum, savas) → { durum, ozet }: varsayılanı savasSonucunuUygula;
// keşif savaşında arınma ve ganimeti de ekleyen sürüm verilir.
export function savasEkrani(kap, depo, { dusman, yoldaslar = [], rng, sonucuUygula = savasSonucunuUygula, bitince, karakterGoster } = {}) {
  const baslangic = depo.al();
  const il = ilHaritasi.get(baslangic.konum);
  let savas = savasBaslat(baslangic.oyuncu, dusman, baslangic.heybe ?? [], {
    gucCarpani: sofraGucCarpani(baslangic),
    yoldaslar,
  });
  const grup = savas.grup;
  const kalabalik = grup.length > 1;
  const sofraKalan = baslangic.sofra?.kalan ?? 0;
  let panel = 'ana'; // 'ana' | 'yetenek' | 'yemek' | 'kisayol' | 'son'
  let duzenle = false; // kısayol yuvaları düzenleniyor mu
  let secilenYuva = null; // 'kisayol' panelinde içeriği seçilen yuva
  let ozet = null;
  let sonDurum = null;
  let oynatiliyor = false;
  // Çubuklarda gösterilen değerler; olaylar oynatıldıkça adım adım güncellenir.
  // Kalabalıkta her yaratığın canı ayrı tutulur (anahtar: yaratığın numarası; tek yaratıkta 1).
  const dusmanCanlari = () => Object.fromEntries(grup.map((g) => [g.no ?? 1, canlilar(savas).find((c) => c.no === g.no)?.can ?? 0]));
  const gosterilen = { dusmanCan: dusmanCanlari(), oyuncuCan: savas.oyuncu.can, oyuncuNefes: savas.oyuncu.nefes };

  kap.innerHTML = `
    <div class="savas-ekrani">
      <header class="ust-cubuk">
        <h1 class="ust-baslik">⚔️ ${M.baslik} <span class="ust-alt">${kacis(il.ad)}</span></h1>
      </header>
      <section class="sahne" data-grup="${grup.length}">
        ${bolgeArkaPlani(il.bolge)}
        ${grup.map((g, i) => `<div class="figur figur-dusman${i === 0 ? ' giris' : ''}" data-no="${g.no ?? 1}" data-yuva="${i + 1}">${
          dusmanCizimi(g.anahtar, { etiket: kacis(yaratikAdi(g, savas)) })}</div>`).join('')}
        <div class="figur figur-oyuncu">${sinifCizimi(baslangic.oyuncu.sinif, { etiket: kacis(baslangic.oyuncu.ad) })}</div>
        ${kalabalik ? '' : `<div class="bilgi-plakasi bilgi-plakasi-dusman" aria-label="${kacis(dusman.ad)}"></div>`}
        <div class="bilgi-plakasi bilgi-plakasi-oyuncu" aria-label="${kacis(baslangic.oyuncu.ad)}"></div>
      </section>
      ${kalabalik ? `<div class="dusman-seridi" role="group" aria-label="${M.hedefSec}"></div>` : ''}
      <ol class="savas-gunlugu" aria-live="polite"></ol>
      <div class="kisayol-cubugu" role="toolbar" aria-label="${metinler.kisayol.baslik}"></div>
      <nav class="eylem-paneli"></nav>
    </div>`;

  const ekran = kap.querySelector('.savas-ekrani');
  const figurler = new Map([...ekran.querySelectorAll('.figur-dusman')].map((el) => [Number(el.dataset.no), el]));
  const figurDusman = figurler.get(1);
  // Giriş animasyonu bitince sınıf kaldırılır; yoksa sonraki animasyonları (sarsılma,
  // dağılma) ezer. Hareket azaltılmışsa animasyon hiç çalışmayabilir.
  const girisBitti = () => figurDusman.classList.remove('giris');
  figurDusman.addEventListener('animationend', girisBitti, { once: true });
  setTimeout(girisBitti, 600);
  const figurOyuncu = ekran.querySelector('.figur-oyuncu');
  const plakaDusman = ekran.querySelector('.bilgi-plakasi-dusman');
  const dusmanSeridi = ekran.querySelector('.dusman-seridi');
  const plakaOyuncu = ekran.querySelector('.bilgi-plakasi-oyuncu');
  const gunluk = ekran.querySelector('.savas-gunlugu');
  const eylemPaneli = ekran.querySelector('.eylem-paneli');
  const kisayolCubugu = ekran.querySelector('.kisayol-cubugu');
  const azHareket = hareketAzMi();

  // Kalabalıkta: yaratık kartları (dokununca hedef seçilir) ve sahnede hedef işareti.
  function dusmanSeridiniCiz() {
    const hedefNo = savas.dusman.no;
    dusmanSeridi.innerHTML = grup.map((g) => {
      const can = gosterilen.dusmanCan[g.no];
      const canli = can > 0;
      const hedef = g.no === hedefNo;
      return `<button class="dusman-karti${hedef ? ' hedef' : ''}${canli ? '' : ' dustu'}" data-hedef="${g.no}"
          aria-pressed="${hedef}" ${canli ? '' : 'disabled'}>
        <strong>${kacis(yaratikAdi(g, savas))}</strong>
        <small>${sablon(M.seviye, { seviye: g.seviye })}${hedef && canli ? ` · 🎯 ${M.hedef}` : ''}</small>
        ${degerCubugu(can, g.canEnCok, { etiket: metinler.statAdlari.can, renk: 'var(--mercan)' })}
      </button>`;
    }).join('');
    for (const [no, el] of figurler) el.classList.toggle('hedef', no === hedefNo);
  }

  function plakalariCiz() {
    const d = savas.dusman;
    const o = savas.oyuncu;
    if (kalabalik) dusmanSeridiniCiz();
    else {
      plakaDusman.innerHTML = `
      <h2>${kacis(d.ad)} <span class="rozet">${sablon(M.seviye, { seviye: d.seviye })}</span></h2>
      <p class="savasci-tur">${metinler.dusmanTurleri[d.tur]}${d.gezgin
        ? ` · <span class="tehlike-rozeti tehlike-${d.tehlike}">${metinler.gezginBoss.tehlike[d.tehlike]}</span>` : ''}</p>
      ${degerCubugu(gosterilen.dusmanCan[1], d.canEnCok, { etiket: metinler.statAdlari.can, renk: 'var(--mercan)' })}`;
    }
    const etkiler = savas.etkiler
      .filter((e) => e.hedef === 'oyuncu')
      .map((e) => `<li class="etki etki-${e.etki}">${sablon(M.etkiler[e.etki], { kalan: e.kalan })}</li>`)
      .join('') + (sofraKalan > 0 ? `<li class="etki etki-sofra">${sablon(M.etkiler.sofra, { kalan: sofraKalan })}</li>` : '');
    plakaOyuncu.innerHTML = `
      <h2>${kacis(o.ad)} <span class="rozet">${sablon(M.seviye, { seviye: o.seviye })}</span></h2>
      ${degerCubugu(gosterilen.oyuncuCan, o.canEnCok, { etiket: metinler.statAdlari.can, renk: 'var(--mercan)' })}
      ${degerCubugu(gosterilen.oyuncuNefes, o.nefesEnCok, { etiket: metinler.statAdlari.nefes, renk: 'var(--turkuaz)' })}
      ${etkiler ? `<ul class="etki-listesi">${etkiler}</ul>` : ''}`;
  }

  function gunlugeYaz(olay) {
    const { metin, sinif: tur } = olayMetni(olay, savas);
    if (!metin) return;
    const satir = document.createElement('li');
    satir.className = `gunluk-${tur}`;
    satir.textContent = metin;
    gunluk.appendChild(satir);
    gunluk.scrollTop = gunluk.scrollHeight;
  }

  // Bir olayı sahnede canlandırır ve gösterilen değerleri günceller.
  async function olayiOynat(olay) {
    const oyuncudan = olay.kim === 'oyuncu';
    const hasarli = (olay.tip === 'saldiri' || olay.tip === 'ozel_hamle' || (olay.tip === 'yetenek' && olay.hasar !== undefined));
    if (olay.tip === 'yetenek') gosterilen.oyuncuNefes -= yetenekBul(savas.oyuncu.sinif, olay.yetenek).nefes;

    const figurNo = olay.no ?? 1;
    const dusmanFigur = figurler.get(figurNo) ?? figurDusman;
    if (hasarli && olay.etki !== 'zayiflatma') {
      const saldiran = oyuncudan ? figurOyuncu : dusmanFigur;
      const hedef = oyuncudan ? dusmanFigur : figurOyuncu;
      if (olay.tip === 'ozel_hamle') yaziUcur(saldiran, olay.hamle, 'bilgi');
      titret(saldiran, oyuncudan ? 'hamle-sag' : 'hamle-sol', 400);
      if (!azHareket) await bekle(180);
      if (olay.kacindi) {
        sesCal('siyrilma');
        titret(hedef, 'siyril', 450);
        yaziUcur(hedef, M.sahne.siyrildi, 'bilgi');
      } else {
        sesCal(olay.kritik ? 'kritik' : oyuncudan ? 'vurus' : 'dusmanVurusu');
        vurusGoster(hedef);
        titret(hedef, 'sarsil', 420);
        yaziUcur(hedef, `-${olay.hasar}${olay.kritik ? '!' : ''}`, olay.kritik ? 'kritik' : 'hasar');
        if (oyuncudan) gosterilen.dusmanCan[figurNo] = Math.max(0, gosterilen.dusmanCan[figurNo] - olay.hasar);
        else gosterilen.oyuncuCan = Math.max(0, gosterilen.oyuncuCan - olay.hasar);
      }
    } else if (olay.tip === 'yetenek' || olay.tip === 'yemek') {
      sesCal(olay.tip === 'yemek' ? 'yemek' : 'yetenek');
      titret(figurOyuncu, 'parilti', 600);
      if (olay.etki === 'sifa' || olay.tip === 'yemek') {
        const nefes = olay.yenilenen === 'nefes';
        if (nefes) gosterilen.oyuncuNefes += olay.miktar;
        else gosterilen.oyuncuCan += olay.miktar;
        yaziUcur(figurOyuncu, `+${olay.miktar}`, nefes ? 'nefes' : 'sifa');
      } else {
        yaziUcur(figurOyuncu, yetenekBul(savas.oyuncu.sinif, olay.yetenek).ad, 'bilgi');
      }
    } else if (olay.tip === 'ozel_hamle') {
      yaziUcur(dusmanFigur, olay.hamle, 'bilgi');
      titret(figurOyuncu, 'urkme', 500);
    } else if (olay.tip === 'kacis') {
      if (olay.basarili) figurOyuncu.classList.add('geri-cekil');
      else titret(figurOyuncu, 'sarsil', 420);
    } else if (olay.tip === 'dusman_dustu') {
      yaziUcur(dusmanFigur, M.sahne.dustu, 'bilgi');
      dusmanFigur.classList.add('dagil');
      gosterilen.dusmanCan[figurNo] = 0;
    } else if (olay.tip === 'zafer') {
      sesCal('zafer');
      if (!kalabalik) figurDusman.classList.add('dagil');
    } else if (olay.tip === 'evre') {
      sesCal('evre');
      titret(figurDusman, 'sarsil', 420);
      titret(figurDusman, 'evre-parilti', 900);
      yaziUcur(figurDusman, olay.no ? metinler.final.evreSahne[olay.no] : M.sahne.guclendi, 'kritik');
      if (olay.no) ekran.querySelector('.sahne').dataset.evre = olay.no;
    } else if (olay.tip === 'yenilgi') {
      sesCal('yenilgi');
      figurOyuncu.classList.add('bayil');
    }
    gunlugeYaz(olay);
    plakalariCiz();
    await bekle(azHareket ? 120 : 520);
  }

  function anaPanel() {
    const kacmaYok = !canlilar(savas).every(kacilabilirMi);
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
      const B = metinler.boss;
      if (ozet.esya) {
        const e = esyaVerisi[ozet.esya];
        satirlar.push(`<strong class="kutlama">${sablon(S.esya, { ikon: e.ikon, esya: kacis(e.ad), nadirlik: metinler.nadirlik[e.nadirlik] })}</strong>`);
      }
      if (ozet.zulmetYenildi) satirlar.push(`<strong class="kutlama">🏰 ${metinler.final.yenildi}</strong>`);
      if (ozet.miniBossYenildi) satirlar.push(`<strong>${sablon(B.miniYenildi, { boss: kacis(savas.dusman.ad) })}</strong>`);
      if (ozet.gezginBoss) satirlar.push(`<strong class="kutlama">${sablon(metinler.gezginBoss.yenildi, { dusman: kacis(savas.dusman.ad) })}</strong>`);
      if (ozet.hayir) satirlar.push(sablon(S.hayir, { hayir: ozet.hayir }));
      for (const g of ozet.gorevIlerlemesi ?? []) {
        if (!(ozet.hazirOlanGorevler ?? []).includes(g.anahtar)) {
          satirlar.push(sablon(S.gorevIlerlemesi, { gorev: kacis(gorevVerisi[g.anahtar].ad), mevcut: g.mevcut, hedef: g.hedef }));
        }
      }
      for (const a of ozet.hazirOlanGorevler ?? []) {
        satirlar.push(`<strong class="kutlama">${sablon(S.gorevHazir, { gorev: kacis(gorevVerisi[a].ad) })}</strong>`);
      }
      if (ozet.miniBossBelirdi) {
        satirlar.push(`<strong class="kutlama">${sablon(B.miniBelirdi, { boss: kacis(dusmanAdi(ozet.miniBossBelirdi)) })}</strong>`);
      }
      if (ozet.bossYenildi) {
        const bolge = bolgeler.find((b) => b.anahtar === ozet.bossYenildi);
        const sofraYemekleri = Object.values(yemekler)
          .filter((y) => ilHaritasi.get(y.il).bolge === bolge.anahtar)
          .map((y) => `${y.ikon} ${y.ad}`);
        satirlar.push(`<em class="hikaye">${metinler.hikaye[bolge.anahtar]}</em>`);
        satirlar.push(sablon(B.sofra, { yemekler: kacis(sofraYemekleri.join(', ')), savas: SOFRA.savas }));
        if (ozet.acilanBolge) {
          const yeni = bolgeler.find((b) => b.anahtar === ozet.acilanBolge);
          satirlar.push(`<strong class="kutlama">🗺️ ${sablon(B.yeniBolge, { bolge: yeni.ad, il: kacis(ilHaritasi.get(yeni.giris).ad) })}</strong>`);
        }
      }
    } else if (ozet.sonuc === 'yenilgi') {
      const donulen = ilHaritasi.get(ozet.donulenIl ?? il.plaka);
      satirlar.push(sablon(ozet.kervansarayda ? S.bayilmaKervansaray : S.bayilma, { il: kacis(donulen.ad) }));
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

  // Kısayol yuvası şu an kullanılabilir mi? Yalnızca sıra oyuncudayken.
  const siraSende = () => !oynatiliyor && !savas.sonuc && panel !== 'son';
  const kisayollar = () => depo.al().kisayollar ?? bosKisayollar();
  function yuvaKullanilir(icerik) {
    if (!icerik || !siraSende()) return false;
    return eylemKontrol(savas, kisayolEylemi(icerik)).olur;
  }

  function kisayolCubugunuCiz() {
    const K = metinler.kisayol;
    kisayolCubugu.hidden = panel === 'son';
    kisayolCubugu.classList.toggle('sira-sende', siraSende());
    kisayolCubugu.classList.toggle('duzenleniyor', duzenle);
    kisayolCubugu.innerHTML = `
      <span class="kisayol-durum" aria-hidden="true">${siraSende() ? K.siraSende : K.bekle}</span>
      <div class="kisayol-yuvalari">
        ${yuvaDugmeleri(kisayollar(), {
          sinif: savas.oyuncu.sinif,
          heybe: savas.heybe,
          kullanilir: (icerik) => duzenle || !icerik || yuvaKullanilir(icerik),
          secili: panel === 'kisayol' ? secilenYuva : null,
        })}
      </div>
      <button class="simge-buton kisayol-duzenle" data-eylem="kisayol-duzenle" aria-pressed="${duzenle}"
              aria-label="${duzenle ? K.duzenleBitti : K.duzenle}" title="${duzenle ? K.duzenleBitti : K.duzenle}">✎</button>`;
  }

  function kisayolPaneli() {
    return `${secimListesi(savas.oyuncu, savas.heybe, kisayollar(), secilenYuva)}
      <button class="buton geri-buton" data-eylem="geri">← ${M.geri}</button>`;
  }

  function panelCiz() {
    eylemPaneli.innerHTML = { ana: anaPanel, yetenek: yetenekPaneli, yemek: yemekPaneli, kisayol: kisayolPaneli, son: sonucPaneli }[panel]();
    eylemPaneli.querySelector('button:not([disabled])')?.focus({ preventScroll: true });
    kisayolCubugunuCiz();
  }

  // Yuvaya dokunulunca ya da 1–4 tuşuna basılınca: düzenlemede ya da boş yuvada
  // içerik seçilir; dolu yuvanın eylemi sıra oyuncudaysa yapılır.
  function yuvaSec(sira) {
    if (oynatiliyor || panel === 'son') return;
    const icerik = kisayollar()[sira];
    if (duzenle || !icerik) {
      secilenYuva = sira;
      panel = 'kisayol';
      return panelCiz();
    }
    if (yuvaKullanilir(icerik)) return eylemYap(kisayolEylemi(icerik));
    titret(kisayolCubugu.querySelector(`[data-kisayol="${sira}"]`), 'sarsil', 420);
  }

  function savasBitti() {
    const r = sonucuUygula(depo.al(), savas);
    ozet = r.ozet;
    sonDurum = r.durum;
    depo.ayarla(r.durum);
    panel = 'son';
    if (ozet.bossYenildi) {
      bildirimGoster(ekran, sablon(M.dagilma.boss, { dusman: savas.dusman.ad }), { tur: 'kutlama', sure: 3500 });
    }
    if (ozet.arindi) {
      bildirimGoster(ekran, sablon(M.sonuc.arindi, { il: il.ad }), { tur: 'kutlama', sure: 3500 });
    }
    if (ozet.seviyeler.length) {
      sesCal('seviye');
      parilti(ekran);
      titret(figurOyuncu, 'seviye-parilti', 1200);
      bildirimGoster(ekran, sablon(M.sonuc.seviyeAtladin, { seviye: ozet.seviyeler.at(-1) }), { tur: 'kutlama', sure: 3500 });
      for (const y of ozet.yeniYetenekler) {
        bildirimGoster(ekran, sablon(M.sonuc.yeniYetenek, { yetenek: y.ad }), { tur: 'kutlama', sure: 3500 });
      }
    }
  }

  // Oyuncu eylemini uygular, ortaya çıkan olayları sırayla sahnede oynatır.
  async function eylemYap(eylem) {
    if (oynatiliyor) return;
    const yeni = oyuncuEylemi(savas, eylem, rng);
    if (yeni === savas) return;
    const olaylar = yeni.gunluk.slice(savas.gunluk.length);
    savas = yeni;
    oynatiliyor = true;
    eylemPaneli.classList.add('bekliyor');
    panel = 'ana';
    duzenle = false;
    panelCiz();
    for (const olay of olaylar) await olayiOynat(olay);
    Object.assign(gosterilen, { dusmanCan: dusmanCanlari(), oyuncuCan: savas.oyuncu.can, oyuncuNefes: savas.oyuncu.nefes });
    plakalariCiz();
    if (savas.sonuc) savasBitti();
    oynatiliyor = false;
    eylemPaneli.classList.remove('bekliyor');
    panelCiz();
  }

  ekran.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled || oynatiliyor) return;
    if (b.dataset.hedef !== undefined) {
      savas = hedefSec(savas, Number(b.dataset.hedef));
      return plakalariCiz();
    }
    if (b.dataset.kisayol !== undefined) return yuvaSec(Number(b.dataset.kisayol));
    if (b.dataset.kisayolIcerik !== undefined) {
      depo.ayarla(kisayolAta(depo.al(), secilenYuva, koddanIcerik(b.dataset.kisayolIcerik)));
      panel = 'ana';
      duzenle = false;
      secilenYuva = null;
      return panelCiz();
    }
    if (b.dataset.yetenek) return eylemYap({ tur: 'yetenek', anahtar: b.dataset.yetenek });
    if (b.dataset.yemek) return eylemYap({ tur: 'yemek', anahtar: b.dataset.yemek });
    switch (b.dataset.eylem) {
      case 'saldir': return eylemYap({ tur: 'saldir' });
      case 'kac': return eylemYap({ tur: 'kac' });
      case 'yetenek-ac': panel = 'yetenek'; return panelCiz();
      case 'yemek-ac': panel = 'yemek'; return panelCiz();
      case 'geri': panel = 'ana'; secilenYuva = null; return panelCiz();
      case 'kisayol-duzenle':
        duzenle = !duzenle;
        if (!duzenle && panel === 'kisayol') panel = 'ana';
        return panelCiz();
      case 'devam': return bitince?.();
      case 'karakter': return karakterGoster?.();
    }
  });

  // Klavye: 1–4 kısayol yuvaları, Esc alt menüden çıkar.
  function tusBasildi(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.('input, textarea')) return;
    const sira = ['1', '2', '3', '4'].indexOf(e.key);
    if (sira >= 0) {
      e.preventDefault();
      if (!e.repeat) yuvaSec(sira);
    } else if (e.key === 'Escape' && !oynatiliyor && ['yetenek', 'yemek', 'kisayol'].includes(panel)) {
      e.preventDefault();
      panel = 'ana';
      duzenle = false;
      secilenYuva = null;
      panelCiz();
    }
  }
  window.addEventListener('keydown', tusBasildi);

  plakalariCiz();
  savas.gunluk.forEach(gunlugeYaz);
  panelCiz();
  return () => window.removeEventListener('keydown', tusBasildi);
}
