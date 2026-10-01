// İl içi gezinti ekranı: kuşbakışı harita, yürüyen oyuncu, dolaşan düşmanlar ve savaş.
// Karo katmanı bir kez çizilir; kamera, harita kabını GPU ile kaydırarak oyuncuyu izler.
// Oyuncu ve düşmanlar karo katmanının üstünde ayrı figürlerdir.
//
// Savaş ayrı bir ekranda değil, burada gerçek zamanlı geçer (kurallar: catisma.js):
// düşmana dokunan oyuncu onu hedef alır, menziline yürür ve durduğunda vurur; düşmanlar da
// menzillerine giren oyuncuya vurur. Kısayol yuvaları (1–4) yetenek ve yemek içindir.
// Uzaklaşmak kaçmaktır. Önemli zaferler (boss, eşya, il arındı…) zafer kartıyla gösterilir.
//
// Gezinti durumu (g) ekranlar arasında korunur (heybeye ya da karaktere girip çıkınca
// kaldığı yerden sürer) ve bu ekran tarafından güncellenir:
//   { plaka, harita, oyuncu: {x, y}, yon, dusmanlar, halk, sonrakiId, dogusSayaclari, dokunulmaz,
//     surprizAdimi, tuccar (seyyar tüccar kaydı ya da null), tuccarAdimi, yankesiciAdimi,
//     etkiler (oyuncunun savaş etkileri), bekleme (vuruşa kalan tık), hedefId (hedef alınan
//     düşman), takip (hedefin menziline yürünüyor mu), siradakiEylem (beklemedeki kısayol) }
import { iller } from '../veri/iller.js';
import { bolgeler } from '../veri/bolgeler.js';
import { metinler } from '../veri/metinler.js';
import { arinmaYuzdesi, seyahatKontrol, bolgeAcikMi, bossDurumu, bossKosullari, finalDurumu, finalKosullari, finalOnkosulBolgesi } from '../oyun/ilerleme.js';
import { dusmanlar as dusmanVerisi } from '../veri/dusmanlar.js';
import { siniflar } from '../veri/siniflar.js';
import { yemekler } from '../veri/yemekler.js';
import { gorevler as gorevVerisi } from '../veri/gorevler.js';
import { sesAcikMi, sesAyarla, sesCal } from './ses.js';
import { statlar } from '../oyun/karakter.js';
import {
  yurunurMu,
  yolBul,
  kapiBul,
  etkilesimTuru,
  dusmanlariYurut,
  dusmanDogur,
  dusmanSayisi,
  siradanDusmanSayisi,
  yeniKovalayanlar,
  halkiYerlestir,
  halkiYurut,
  surprizBaskin,
  suruUyeleri,
  yankesiciMi,
  meydandaMi,
  menzildeMi,
  mesafe,
  ozelDusmanlariGuncelle,
} from '../oyun/gezinti.js';
import { eylemKontrol, eylemMenzili, yetenekBul, dusmanMenzili } from '../oyun/savas.js';
import { BEKLEME, hedefBul, oyuncuVurur, dusmanlarVurur, dusmanlariToparla, atilmaYeri, saldirganMi } from '../oyun/catisma.js';
import { zaferUygula, yenilgiUygula, yankesiciCalmasi } from '../oyun/kesif.js';
import { kisayolEylemi, bosKisayollar } from '../oyun/kisayollar.js';
import { yankesiciBelir, yankesicileriCek } from '../oyun/yankesici.js';
import { tuccarBelir, tuccarKonumdaMi } from '../oyun/tuccar.js';
import { sablon, kacis, bildirimGoster, degerCubugu, parilti } from './bilesenler.js';
import { yuvaDugmeleri } from './kisayolYuvalari.js';
import { kartliZaferMi, zaferKartiHtml } from './zaferKarti.js';
import { karakterDugmesiniCiz } from './karakterDugmesi.js';
import { haritaKatmani, kapiKatmani, KARO_BOYU } from './cizimler/karolar.js';
import { oyuncuCizimi, halkCizimi, tuccarCizimi } from './cizimler/karakterler.js';
import { dusmanCizimi } from './cizimler/dusmanlar.js';
import { verenIsareti } from '../oyun/gorevler.js';
import { afisOzelligi } from './cografyaBilgisi.js';

const M = metinler.gezinti;
const S = metinler.savas;
const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const bolgeHaritasi = new Map(bolgeler.map((b) => [b.anahtar, b]));
const IL_ADLARI = Object.fromEntries(iller.map((il) => [il.plaka, kacis(il.ad)]));

const ADIM_MS = 170; // oyuncunun bir karo yürüme süresi
const DUSMAN_MS = ADIM_MS; // düşman tıkı: hızları gezinti.js → DAVRANIS'ta tık başına verilir
const TAKIP_UYARI_ARALIGI = 4000; // "peşine takıldı" bildirimleri arasındaki en az süre (ms)
const MERMI_HIZI = 45; // uzaktan vuruşun bir karo yol alma süresi (ms)
const COK_VURUS_ARALIGI = 150; // çok vuruşlu yetenekte (Çifte Ok) art arda vuruşların arası (ms)
// Düşmanların uzaktan vuruşunun görünüşü, türlerine göre (yakından vuranlarda yok)
const DUSMAN_MERMISI = { cin: 'sihir', ifrit: 'alev', boss: 'sihir' };
const VURUS = `<svg viewBox="-20 -20 40 40" aria-hidden="true"><polygon points="0,-18 4,-6 17,-8 7,1 13,14 0,6 -13,14 -7,1 -17,-8 -4,-6" /></svg>`;
const YENIDEN_DOGUS_ADIMI = 25; // yenilen düşmanın yerine yenisi kaç adım sonra gelir
const YONLER = {
  yukari: { dx: 0, dy: -1 },
  asagi: { dx: 0, dy: 1 },
  sola: { dx: -1, dy: 0 },
  saga: { dx: 1, dy: 0 },
};
const TUSLAR = {
  ArrowUp: 'yukari', w: 'yukari', W: 'yukari',
  ArrowDown: 'asagi', s: 'asagi', S: 'asagi',
  ArrowLeft: 'sola', a: 'sola', A: 'sola',
  ArrowRight: 'saga', d: 'saga', D: 'saga',
};
const YON_TUSU_TERCIHI = 'seksen-bir-diyar/yon-tuslari';

function yonTuslariAcikMi() {
  try {
    const kayitli = localStorage.getItem(YON_TUSU_TERCIHI);
    if (kayitli !== null) return kayitli === '1';
  } catch {
    // tercih okunamazsa cihaza göre karar verilir
  }
  return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
}

function yonTuslariniKaydet(acik) {
  try {
    localStorage.setItem(YON_TUSU_TERCIHI, acik ? '1' : '0');
  } catch {
    // tercih kaydedilemese de oyun sürer
  }
}

// secenekler: { g, rng, ileGec(plaka), ilBilgisi, haritaGoster, heybeGoster, karakterGoster, baslikaDon,
//               ipucuGoster, arastaGoster, ahiGoster, tuccarGoster(tuccar), kervansarayGoster,
//               gorevVerenGoster(veren), gunlukGoster, kisayollariGoster,
//               bayildi(ozet) (oyuncu bayıldı; durum güncellendi), zulmetYenildi (bitiş sahnesine geç),
//               ilGirisi (başka ilden yeni gelindiyse true: il adı afişi gösterilir) }
// Araç düğmelerinin klavye kısayolları (main.js → EKRAN_KISAYOLLARI ile aynı).
const KISAYOL = { harita: 'M', heybe: 'B', gunluk: 'G', bilgi: 'L', karakter: 'K' };
const kisayolluEtiket = (metin, eylem) => `${metin} (${KISAYOL[eylem]})`;

export function gezintiEkrani(kap, depo, secenekler) {
  const { g, rng } = secenekler;
  const harita = g.harita;
  const { genislik: GENISLIK, yukseklik: YUKSEKLIK } = harita;
  g.halk ??= halkiYerlestir(harita, rng);
  g.etkiler ??= [];
  g.bekleme ??= 0;
  g.hedefId ??= null;
  g.takip ??= false;
  g.siradakiEylem ??= null;
  const il = ilHaritasi.get(g.plaka);
  const bolge = bolgeHaritasi.get(il.bolge);
  const sinif = depo.al().oyuncu.sinif;
  const SINIF = siniflar[sinif];

  kap.innerHTML = `
    <div class="gezinti-ekrani">
      <header class="ust-cubuk">
        <button class="simge-buton" data-eylem="baslik" aria-label="${M.baslikEkrani}" title="${M.baslikEkrani}">←</button>
        <button class="gezinti-il" data-eylem="bilgi" aria-label="${M.ilBilgisi}" aria-keyshortcuts="L">
          <strong>📍 ${kacis(il.ad)}</strong>
          <span class="gezinti-il-alt">
            <span class="bolge-noktasi" style="background:${bolge.renk}"></span>
            <span class="gezinti-bolge">${kacis(bolge.ad)}</span>
            <span class="gezinti-arinma"></span>
          </span>
        </button>
        <button class="karakter-dugmesi" data-eylem="karakter" aria-keyshortcuts="K" hidden></button>
      </header>
      <div class="gezinti-alani" role="application" aria-label="${kacis(sablon(M.alanEtiketi, { il: il.ad }))}">
        <div class="dunya">
          <svg class="karo-katmani" viewBox="0 0 ${GENISLIK * KARO_BOYU} ${YUKSEKLIK * KARO_BOYU}" aria-hidden="true">
            ${haritaKatmani(harita)}
            <g class="kapilar"></g>
          </svg>
          <div class="hedef-isareti" hidden></div>
          <div class="figur-katmani"></div>
        </div>
        <div class="durum-gostergesi" aria-live="off"><div class="gosterge-cubuklari"></div><ul class="etki-listesi"></ul></div>
        <div class="gezinti-araclari">
          ${[['harita', '🗺️', M.harita], ['heybe', '🎒', M.heybe], ['gunluk', '📜', M.gunluk], ['bilgi', 'ℹ️', M.ilBilgisi]]
            .map(([eylem, ikon, ad]) => `<button class="simge-buton" data-eylem="${eylem}" aria-label="${ad}"
              title="${kisayolluEtiket(ad, eylem)}" aria-keyshortcuts="${KISAYOL[eylem]}">${ikon}<kbd class="tus-ipucu" aria-hidden="true">${KISAYOL[eylem]}</kbd></button>`).join('')}
          <button class="simge-buton klavye-dugmesi" data-eylem="kisayollar" aria-label="${M.kisayollar}" title="${M.kisayollar} (?)" aria-keyshortcuts="?">⌨️</button>
          <button class="simge-buton" data-eylem="yon-tuslari" aria-label="${M.yonTuslari}" title="${M.yonTuslari}" aria-pressed="false">🎮</button>
          <button class="simge-buton" data-eylem="ses"></button>
        </div>
        <div class="yon-tuslari" hidden>
          <button class="yon-tusu yon-yukari" data-yon="yukari" aria-label="${M.yukari}">▲</button>
          <button class="yon-tusu yon-sola" data-yon="sola" aria-label="${M.sola}">◀</button>
          <button class="yon-tusu yon-saga" data-yon="saga" aria-label="${M.saga}">▶</button>
          <button class="yon-tusu yon-asagi" data-yon="asagi" aria-label="${M.asagi}">▼</button>
        </div>
        <p class="gezinti-ipucu" hidden>${M.ipucu}</p>
        ${secenekler.ilGirisi ? `<p class="il-afisi" aria-hidden="true"><span>${kacis(bolge.ad)}</span><strong>${kacis(il.ad)}</strong>${afisOzelligi(il.plaka) ? `<em>${afisOzelligi(il.plaka)}</em>` : ''}</p>` : ''}
      </div>
      <div class="kisayol-cubugu gezinti-kisayollari" role="toolbar" aria-label="${metinler.kisayol.baslik}"></div>
    </div>`;

  const ekran = kap.querySelector('.gezinti-ekrani');
  const alan = ekran.querySelector('.gezinti-alani');
  const dunya = ekran.querySelector('.dunya');
  const svg = ekran.querySelector('.karo-katmani');
  const kapiKatmaniG = svg.querySelector('.kapilar');
  const figurKatmani = ekran.querySelector('.figur-katmani');
  const hedefIsareti = ekran.querySelector('.hedef-isareti');
  const yonTuslari = ekran.querySelector('.yon-tuslari');
  const yonDugmesi = ekran.querySelector('[data-eylem="yon-tuslari"]');
  const karakterDugmesi = ekran.querySelector('.karakter-dugmesi');
  const arinmaEtiketi = ekran.querySelector('.gezinti-arinma');
  const durumGostergesi = ekran.querySelector('.durum-gostergesi');
  const gostergeCubuklari = durumGostergesi.querySelector('.gosterge-cubuklari');
  const etkiListesi = durumGostergesi.querySelector('.etki-listesi');
  const kisayolCubugu = ekran.querySelector('.kisayol-cubugu');
  const ipucu = ekran.querySelector('.gezinti-ipucu');
  const azHareket = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  let T = 36; // bir karonun piksel boyu (ekrana göre)
  let kuyruk = []; // dokun-yürü yolu
  let varista = null; // yolun sonunda etkileşilecek yapı { x, y }
  let tutulanYon = null; // basılı tutulan yön tuşu
  let mesgul = false; // başka ile geçerken, bayılınca ya da zafer kartı açıkken oyun durur
  let yuruyorZaman = null;
  const zamanlayicilar = [];

  // ── Figürler ──
  const oyuncuFiguru = document.createElement('div');
  oyuncuFiguru.className = 'harita-figuru oyuncu-figuru';
  oyuncuFiguru.innerHTML = `<div class="figur-ic">${oyuncuCizimi(depo.al().oyuncu)}</div>`;
  figurKatmani.appendChild(oyuncuFiguru);
  const dusmanFigurleri = new Map();
  const halkFigurleri = new Map();
  let sonTakipUyarisi = -Infinity;

  // Görev verenlerin başındaki işaretler (Faz 9): ! yeni görev, ? teslim, 🎁 hediye
  const ISARET_SIMGESI = { yeni: '!', hazir: '?', hediye: '🎁' };
  const gorevVerenler = [
    { veren: 'muhtar', yer: harita.muhtar },
    { veren: 'ahi_baba', yer: harita.ahiBaba },
  ].filter((v) => v.yer).map((v) => {
    const el = document.createElement('span');
    el.className = 'gorev-isareti';
    el.setAttribute('aria-hidden', 'true');
    figurKatmani.appendChild(el);
    return { ...v, el };
  });

  function isaretleriCiz(durum) {
    for (const v of gorevVerenler) {
      const isaret = verenIsareti(durum, g.plaka, v.veren);
      v.el.hidden = !isaret;
      v.el.textContent = isaret ? ISARET_SIMGESI[isaret] : '';
      v.el.className = `gorev-isareti${isaret ? ` isaret-${isaret}` : ''}`;
      v.el.title = isaret ? metinler.gorev.isaretler[isaret] : '';
    }
  }

  function isaretleriKonumla() {
    for (const v of gorevVerenler) {
      v.el.style.transform = `translate3d(${(v.yer.x + 0.5) * T}px, ${(v.yer.y - 0.55) * T}px, 0) translateX(-50%)`;
    }
  }

  // Figür karosunun ortasına, ayakları karonun altına gelecek biçimde yerleşir.
  // Boss ve mini boss figürleri daha büyüktür.
  function figurKonumla(el, x, y) {
    const boy = el.classList.contains('ozel-figur') ? 2.2 : 1.6;
    el.style.transform = `translate3d(${(x + 0.5 - boy / 2) * T}px, ${(y + 0.85 - boy) * T}px, 0)`;
    el.style.zIndex = String(10 + y); // aşağıdaki figür öndekidir
  }

  function dusmanFiguruOlustur(d) {
    const el = document.createElement('div');
    const gezgin = d.dusman.gezgin;
    el.className = `harita-figuru dusman-figuru${d.sabit ? ` ozel-figur ozel-${d.tur}` : ''}${
      gezgin ? ` ozel-figur ozel-gezgin tehlike-${d.dusman.tehlike}` : ''}`;
    el.dataset.id = d.id;
    const B = metinler.boss;
    const GB = metinler.gezginBoss;
    const seviye = sablon(metinler.savas.seviye, { seviye: d.dusman.seviye });
    let rozet;
    if (d.sabit) rozet = `${{ boss: B.rozet, mini: B.miniRozet, final: metinler.final.rozet }[d.tur]} · ${seviye}`;
    else if (gezgin) rozet = `${GB.tehlike[d.dusman.tehlike]} · ${seviye}`;
    else if (yankesiciMi(d)) rozet = `${seviye} <span title="${M.yankesiciRozeti}">🗡️</span>`;
    else if (d.dusman.takip === 'takipci') rozet = `${seviye} <span title="${M.takipciRozeti}">👣</span>`;
    else if (d.dusman.takip === 'kayitsiz') rozet = `${seviye} <span title="${M.kayitsizRozeti}">💤</span>`;
    else rozet = seviye;
    el.innerHTML = `<div class="figur-ic">${dusmanCizimi(d.dusman.anahtar)}</div>
      <span class="figur-rozeti">${rozet}</span>
      <span class="figur-can" hidden><span class="figur-can-dolu"></span></span>
      ${d.tur === 'boss' || d.tur === 'final' ? `<span class="muhur" aria-hidden="true"></span>` : ''}
      ${gezgin ? `<span class="gezgin-aura" aria-hidden="true"></span>` : ''}`;
    if (gezgin) el.title = `${d.dusman.ad} · ${d.surpriz ? GB.surprizRozet : GB.rozet} · ${GB.tehlikeAciklama[d.dusman.tehlike]}`;
    else {
      const tavir = yankesiciMi(d) ? M.yankesiciRozeti : M[`${d.dusman.takip}Rozeti`];
      el.title = tavir ? `${d.dusman.ad} · ${tavir}` : d.dusman.ad;
    }
    if (yankesiciMi(d)) el.classList.add('yankesici-figuru');
    figurKatmani.appendChild(el);
    dusmanFigurleri.set(d.id, el);
    return el;
  }

  function dusmanlariCiz() {
    const kalan = new Set(g.dusmanlar.map((d) => d.id));
    for (const [id, el] of dusmanFigurleri) {
      if (!kalan.has(id)) {
        el.remove();
        dusmanFigurleri.delete(id);
      }
    }
    for (const d of g.dusmanlar) {
      const el = dusmanFigurleri.get(d.id) ?? dusmanFiguruOlustur(d);
      el.classList.toggle('saga', d.yon === 1);
      el.classList.toggle('kovaliyor', Boolean(d.kovaliyor));
      el.classList.toggle('hedefte', d.id === g.hedefId);
      el.classList.toggle('sersem', d.sersem > 0);
      if (d.tur === 'boss' || d.tur === 'final') el.classList.toggle('muhurlu', muhurluMu(d));
      // Can çubuğu: yaralı ya da hedefteki düşmanda görünür
      const can = el.querySelector('.figur-can');
      can.hidden = d.dusman.can >= d.dusman.canEnCok && d.id !== g.hedefId;
      can.firstElementChild.style.width = `${Math.round((100 * d.dusman.can) / d.dusman.canEnCok)}%`;
      figurKonumla(el, d.x, d.y);
    }
  }

  function halkiCiz() {
    for (const h of g.halk) {
      let el = halkFigurleri.get(h.id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'harita-figuru halk-figuru';
        el.innerHTML = `<div class="figur-ic">${halkCizimi(h.tur)}</div>`;
        figurKatmani.appendChild(el);
        halkFigurleri.set(h.id, el);
      }
      el.classList.toggle('sola', h.yon === -1);
      figurKonumla(el, h.x, h.y);
    }
  }

  // Seyyar tüccar: zararsız bir figür; değince alışveriş ekranı açılır.
  let tuccarFiguru = null;
  function tuccarCiz() {
    if (!g.tuccar) {
      tuccarFiguru?.remove();
      tuccarFiguru = null;
      return;
    }
    if (!tuccarFiguru) {
      tuccarFiguru = document.createElement('div');
      tuccarFiguru.className = 'harita-figuru tuccar-figuru';
      tuccarFiguru.title = metinler.tuccar.etiket;
      tuccarFiguru.innerHTML = `<div class="figur-ic">${tuccarCizimi()}</div>
        <span class="tuccar-rozeti" aria-hidden="true">🛍️</span>`;
      figurKatmani.appendChild(tuccarFiguru);
    }
    tuccarFiguru.classList.toggle('sola', g.tuccar.yon === -1);
    figurKonumla(tuccarFiguru, g.tuccar.x, g.tuccar.y);
  }

  function tuccarDuyur() {
    if (!g.tuccar || g.tuccar.duyuruldu) return;
    g.tuccar.duyuruldu = true;
    bildirimGoster(ekran, metinler.tuccar.gorundu, { tur: 'kutlama', sure: 3200 });
  }

  // Tüccar bir süre bekler ve yoluna devam eder; yürürken de yenisiyle karşılaşılabilir.
  function tuccarTuru() {
    g.tuccarAdimi = (g.tuccarAdimi ?? 0) + 1;
    if (g.tuccar) {
      if (--g.tuccar.omur > 0) return;
      g.tuccar = null;
      g.tuccarAdimi = 0;
      tuccarCiz();
      bildirimGoster(ekran, metinler.tuccar.gitti, { sure: 2200 });
      return;
    }
    const t = tuccarBelir(harita, { tuccar: g.tuccar, oyuncu: g.oyuncu, dolu: g.dusmanlar, adim: g.tuccarAdimi }, rng);
    if (!t) return;
    g.tuccar = t;
    g.tuccarAdimi = 0;
    tuccarCiz();
    tuccarDuyur();
  }

  function oyuncuyuCiz() {
    oyuncuFiguru.classList.toggle('sola', g.yon === -1);
    oyuncuFiguru.classList.toggle('dokunulmaz', g.dokunulmaz > 0);
    figurKonumla(oyuncuFiguru, g.oyuncu.x, g.oyuncu.y);
  }

  // ── Kamera ──
  function kamera() {
    const r = alan.getBoundingClientRect();
    const dunyaG = GENISLIK * T;
    const dunyaY = YUKSEKLIK * T;
    const sinirla = (deger, boy, ekranBoyu) =>
      boy <= ekranBoyu ? (boy - ekranBoyu) / 2 : Math.min(boy - ekranBoyu, Math.max(0, deger));
    const x = sinirla((g.oyuncu.x + 0.5) * T - r.width / 2, dunyaG, r.width);
    const y = sinirla((g.oyuncu.y + 0.5) * T - r.height / 2, dunyaY, r.height);
    dunya.style.transform = `translate3d(${-x}px, ${-y}px, 0)`;
  }

  function boyutla() {
    const r = alan.getBoundingClientRect();
    T = Math.max(30, Math.min(48, Math.floor(r.width / 10)));
    dunya.style.width = `${GENISLIK * T}px`;
    dunya.style.height = `${YUKSEKLIK * T}px`;
    ekran.style.setProperty('--karo', `${T}px`);
    dunya.classList.add('anlik');
    oyuncuyuCiz();
    dusmanlariCiz();
    halkiCiz();
    tuccarCiz();
    isaretleriKonumla();
    kamera();
    void dunya.getBoundingClientRect();
    dunya.classList.remove('anlik');
  }

  function kapilariCiz() {
    const durum = depo.al();
    kapiKatmaniG.innerHTML = kapiKatmani(harita, IL_ADLARI, (plaka) => bolgeAcikMi(durum, ilHaritasi.get(plaka).bolge));
  }

  // Can ve nefes göstergesi; altında yiğidin savaş etkileri (Korunma, Güç, zafer sofrası…)
  function durumGostergesiniCiz(durum) {
    const o = durum.oyuncu;
    const s = statlar(o);
    gostergeCubuklari.innerHTML = `
      ${degerCubugu(o.can, s.can, { etiket: metinler.statAdlari.can, renk: 'var(--mercan)', sinif: 'gosterge-cubugu' })}
      ${degerCubugu(o.nefes, s.nefes, { etiket: metinler.statAdlari.nefes, renk: 'var(--turkuaz)', sinif: 'gosterge-cubugu' })}`;
    durumGostergesi.classList.toggle('can-az', o.can < s.can * 0.3);
    etkileriCiz(durum);
  }

  function etkileriCiz(durum = depo.al()) {
    const sofra = durum.sofra?.kalan > 0 ? [{ etki: 'sofra', kalan: durum.sofra.kalan }] : [];
    etkiListesi.innerHTML = [...g.etkiler, ...sofra]
      .map((e) => `<li class="etki etki-${e.etki}">${sablon(S.etkiler[e.etki], { kalan: e.kalan })}</li>`).join('');
    etkiListesi.hidden = !etkiListesi.childElementCount;
  }

  function ustCubuguCiz(durum) {
    arinmaEtiketi.textContent = sablon(M.arinma, { yuzde: arinmaYuzdesi(durum, g.plaka) });
    durumGostergesiniCiz(durum);
    karakterDugmesiniCiz(karakterDugmesi, durum.oyuncu);
    isaretleriCiz(durum);
    kisayolCubugunuCiz(durum);
  }

  // ── Etkileşimler ──
  function etkiles(tur) {
    kuyruk = [];
    varista = null;
    if (tur === 'tabela') return secenekler.ilBilgisi?.();
    if (tur === 'tezgah') return secenekler.arastaGoster?.();
    if (tur === 'dukkan') return secenekler.ahiGoster?.();
    if (tur === 'kervansaray') return secenekler.kervansarayGoster?.();
    if (tur === 'tuccar') return secenekler.tuccarGoster?.(g.tuccar);
    if (tur === 'muhtar' || tur === 'ahi_baba') return secenekler.gorevVerenGoster?.(tur);
    if (tur === 'cesme') return bildirimGoster(ekran, M.cesme);
  }

  function kapidanGec(kapi) {
    const kontrol = seyahatKontrol(depo.al(), kapi.plaka);
    if (!kontrol.olur) {
      bildirimGoster(ekran, sablon(metinler.seyahatEngeli[kontrol.neden], {
        hedef: ilHaritasi.get(kapi.plaka).ad,
        konum: il.ad,
        bolge: bolgeHaritasi.get(ilHaritasi.get(kapi.plaka).bolge).ad,
      }), { tur: 'uyari' });
      kuyruk = [];
      g.oyuncu = { x: kapi.ix, y: kapi.iy };
      oyuncuyuCiz();
      kamera();
      return;
    }
    mesgul = true;
    kuyruk = [];
    tutulanYon = null;
    alan.classList.add('gecis');
    setTimeout(() => secenekler.ileGec?.(kapi.plaka), 260);
  }

  // Bölge bossu ya da Zülmet'in kalesi mühürlü mü?
  function muhurluMu(d) {
    if (d.tur === 'final') return finalDurumu(depo.al()) === 'muhurlu';
    return d.tur === 'boss' && bossDurumu(depo.al(), il.bolge) === 'muhurlu';
  }

  // Mühürlü bossa yaklaşınca koşullar bir kez söylenir; uzaklaşınca yeniden söylenebilir.
  let muhurUyarildi = false;
  function muhurUyarisi(d) {
    if (muhurUyarildi) return;
    muhurUyarildi = true;
    kuyruk = [];
    let metin;
    if (d.tur === 'final') {
      const k = finalKosullari(depo.al());
      const sonBoss = dusmanVerisi[bolgeHaritasi.get(finalOnkosulBolgesi(depo.al())).boss].ad;
      metin = sablon(metinler.final.muhurlu, { ...k, sonBoss, boss: metinler.final.bossDurumu[k.onkosulBossu ? 'evet' : 'hayir'] });
    } else {
      metin = sablon(metinler.boss.muhurlu, { boss: d.dusman.ad, bolge: bolge.ad, ...bossKosullari(depo.al(), il.bolge) });
    }
    bildirimGoster(ekran, metin, { tur: 'uyari', sure: 5000 });
  }

  function muhurKontrol() {
    const d = g.dusmanlar.find((x) => muhurluMu(x) && mesafe(x, g.oyuncu) <= 1);
    if (d) muhurUyarisi(d);
    else muhurUyarildi = false;
  }

  // ── Savaş görselleri ──
  const titret = (el, sinif, sure = 450) => {
    el.classList.remove(sinif);
    void el.getBoundingClientRect(); // animasyon baştan başlasın
    el.classList.add(sinif);
    setTimeout(() => el.classList.remove(sinif), sure);
  };

  // Figürün üzerinde yükselip kaybolan sayı ya da kısa yazı.
  function yaziUcur(el, metin, tur) {
    const y = document.createElement('span');
    y.className = `ucan-yazi ucan-${tur}`;
    y.textContent = metin;
    y.setAttribute('aria-hidden', 'true');
    el.appendChild(y);
    setTimeout(() => y.remove(), 1100);
  }

  function vurusGoster(el) {
    const v = document.createElement('span');
    v.className = 'vurus';
    v.innerHTML = VURUS;
    el.appendChild(v);
    setTimeout(() => v.remove(), 450);
  }

  // Uzaktan vuruş: ok, ışık, sihir ya da alev, vuranın karosundan vurulanınkine uçar.
  function mermiAt(bas, son, tur) {
    if (azHareket) return;
    const merkez = (p) => ({ x: (p.x + 0.5) * T, y: (p.y + 0.1) * T });
    const a = merkez(bas);
    const b = merkez(son);
    const aci = Math.atan2(b.y - a.y, b.x - a.x);
    const el = document.createElement('div');
    el.className = `mermi mermi-${tur}`;
    el.setAttribute('aria-hidden', 'true');
    const sure = Math.max(90, mesafe(bas, son) * MERMI_HIZI);
    el.style.transitionDuration = `${sure}ms`;
    el.style.transform = `translate3d(${a.x}px, ${a.y}px, 0) rotate(${aci}rad)`;
    figurKatmani.appendChild(el);
    void el.getBoundingClientRect();
    el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) rotate(${aci}rad)`;
    setTimeout(() => el.remove(), sure + 40);
  }

  // Yakın dövüşte vuran, vurduğuna doğru hamle eder.
  function hamleEt(el, bas, son) {
    el.style.setProperty('--hamle-x', `${Math.sign(son.x - bas.x) * 0.3 * T}px`);
    el.style.setProperty('--hamle-y', `${Math.sign(son.y - bas.y) * 0.3 * T}px`);
    titret(el, 'hamle', 260);
  }

  // Vuruşun görüntüsü: uzaktan mermi, yakından hamle; vurulanda yıldız, sarsılma ve hasar sayısı.
  function vurusuGoster({ vuranEl, vurulanEl, bas, son, mermi, olay, oyuncudan }) {
    if (mermi && mesafe(bas, son) > 1) {
      mermiAt(bas, son, mermi);
      sesCal('atis');
    } else {
      hamleEt(vuranEl, bas, son);
    }
    const goster = () => {
      if (!vurulanEl.isConnected) return;
      if (olay.kacindi) {
        sesCal('siyrilma');
        yaziUcur(vurulanEl, S.sahne.siyrildi, 'bilgi');
        return;
      }
      sesCal(olay.kritik ? 'kritik' : oyuncudan ? 'vurus' : 'dusmanVurusu');
      vurusGoster(vurulanEl);
      titret(vurulanEl, 'vuruldu', 420);
      yaziUcur(vurulanEl, `-${olay.hasar}${olay.kritik ? '!' : ''}`, olay.kritik ? 'kritik' : 'hasar');
      if (olay.ekHasar) yaziUcur(vurulanEl, S.sahne.ekHasar, 'bilgi');
    };
    if (mermi && mesafe(bas, son) > 1 && !azHareket) setTimeout(goster, Math.max(90, mesafe(bas, son) * MERMI_HIZI));
    else goster();
  }

  // Yiğidin hamlesinden doğan bir olay. `hedef`: olayın düşman kaydı (varsa); `sira`: aynı
  // düşmana inen kaçıncı vuruş (çok vuruşlu yetenekte oklar art arda uçar).
  function oyuncuOlayiniGoster(olay, hedef, { sira = 0, adGoster = true } = {}) {
    if (olay.tip === 'sersem' && hedef) {
      const el = dusmanFigurleri.get(hedef.id);
      if (el) yaziUcur(el, S.sahne.sersem, 'bilgi');
    } else if (olay.hasar !== undefined && hedef) {
      const yetenek = olay.yetenek && yetenekBul(sinif, olay.yetenek);
      if (yetenek && adGoster) yaziUcur(oyuncuFiguru, yetenek.ad, 'bilgi');
      const vurulanEl = dusmanFigurleri.get(hedef.id);
      const goster = () => {
        if (!vurulanEl?.isConnected) return;
        vurusuGoster({
          vuranEl: oyuncuFiguru,
          vurulanEl,
          bas: g.oyuncu,
          son: hedef,
          mermi: SINIF.mermi,
          olay,
          oyuncudan: true,
        });
        if (olay.sersem) yaziUcur(vurulanEl, S.sahne.sersem, 'bilgi');
      };
      if (sira > 0 && !azHareket) setTimeout(goster, sira * COK_VURUS_ARALIGI);
      else goster();
    } else if (olay.tip === 'yemek' || olay.etki === 'sifa') {
      sesCal(olay.tip === 'yemek' ? 'yemek' : 'yetenek');
      titret(oyuncuFiguru, 'parilti', 600);
      yaziUcur(oyuncuFiguru, `+${olay.miktar}`, olay.yenilenen === 'nefes' ? 'nefes' : 'sifa');
      if (olay.arindi) yaziUcur(oyuncuFiguru, S.sahne.arindi, 'bilgi');
    } else if (olay.tip === 'yetenek') {
      sesCal('yetenek');
      titret(oyuncuFiguru, 'parilti', 600);
      yaziUcur(oyuncuFiguru, yetenekBul(sinif, olay.yetenek).ad, 'bilgi');
    } else if (olay.tip === 'evre' && hedef) {
      const el = dusmanFigurleri.get(hedef.id);
      sesCal('evre');
      if (el) {
        titret(el, 'evre-parilti', 900);
        yaziUcur(el, olay.no ? metinler.final.evreSahne[olay.no] : S.sahne.guclendi, 'kritik');
      }
      bildirimGoster(ekran, sablon(olay.no ? metinler.final.evreler[olay.no] : S.evre, { dusman: hedef.dusman.ad }), { tur: 'uyari', sure: 3000 });
    }
  }

  function dusmanOlayiniGoster(d, olay) {
    const el = dusmanFigurleri.get(d.id);
    if (!el) return;
    if (olay.tip === 'ozel_hamle') yaziUcur(el, olay.hamle, 'bilgi');
    if (olay.etki === 'zayiflatma') {
      titret(oyuncuFiguru, 'urkme', 500);
      yaziUcur(oyuncuFiguru, sablon(S.etkiler.zayiflatma, { kalan: olay.sure }), 'bilgi');
      return;
    }
    vurusuGoster({
      vuranEl: el,
      vurulanEl: oyuncuFiguru,
      bas: d,
      son: g.oyuncu,
      mermi: dusmanMenzili(d.dusman) > 1 ? DUSMAN_MERMISI[d.dusman.tur] ?? 'sihir' : null,
      olay,
      oyuncudan: false,
    });
  }

  // ── Savaş ──
  const hedefKaydi = () => g.dusmanlar.find((d) => d.id === g.hedefId) ?? null;
  const engeller = () => [...g.dusmanlar, ...(g.tuccar ? [g.tuccar] : [])];
  // Yürürken izlenen menzil: beklemedeki kısayolun ya da sınıfın vuruş menzili
  const aktifMenzil = () => (g.siradakiEylem && eylemMenzili(sinif, g.siradakiEylem)) ?? SINIF.menzil;

  // Düşmanı hedef al: menziline yürünür ve durunca vurulur.
  function hedefAl(d, { yuru = true } = {}) {
    if (muhurluMu(d)) return muhurUyarisi(d);
    g.hedefId = d.id;
    g.takip = yuru;
    kuyruk = [];
    varista = null;
    hedefIsareti.hidden = true;
    dusmanlariCiz();
  }

  // Boşluk tuşu: saldıran en yakın düşmanı (yoksa en yakın düşmanı) hedef al.
  function enYakiniHedefAl() {
    const adaylar = g.dusmanlar
      .filter((d) => !muhurluMu(d) && mesafe(d, g.oyuncu) <= 10)
      .sort((a, b) => (saldirganMi(b) - saldirganMi(a)) || (mesafe(a, g.oyuncu) - mesafe(b, g.oyuncu)));
    if (adaylar.length) hedefAl(adaylar[0]);
    else bildirimGoster(ekran, S.menzilYok, { sure: 1600 });
  }

  // Oyuncunun bir hamlesi: kısayoldan ya da kendiliğinden saldırı. Sonuç: yapıldıysa true.
  function hamleYap(eylem, hedef) {
    const yetenek = eylem.tur === 'yetenek' ? yetenekBul(sinif, eylem.anahtar) : null;
    const r = oyuncuVurur(depo.al(), g.dusmanlar, eylem, rng, { hedef, etkiler: g.etkiler, oyuncu: g.oyuncu, vurulamaz: muhurluMu });
    if (!r.olaylar.length) {
      if (eylem === g.siradakiEylem) g.siradakiEylem = null;
      return false;
    }
    g.etkiler = r.etkiler;
    g.siradakiEylem = null;
    if (eylem.tur !== 'yemek') g.bekleme = BEKLEME.oyuncu;
    if (hedef) {
      g.dokunulmaz = 0; // saldıran yiğidin soluklanması biter
      g.hedefId = hedef.id;
      // Akın Hamlesi: yiğit hedefin yanına atılır
      const yer = yetenek?.atilma ? atilmaYeri(harita, g.oyuncu, hedef, yetenek.menzil, engeller()) : null;
      if (yer) {
        if (yer.x !== g.oyuncu.x) g.yon = Math.sign(yer.x - g.oyuncu.x);
        g.oyuncu = { x: yer.x, y: yer.y };
        oyuncuyuCiz();
        kamera();
      } else if (hedef.x !== g.oyuncu.x) {
        g.yon = Math.sign(hedef.x - g.oyuncu.x);
        oyuncuyuCiz();
      }
    }
    // Olayların düşman kayıtları: haritada kalanlar, düşenler ya da (hedefsiz olayda) hiçbiri
    const onceki = g.dusmanlar;
    const kayitBul = (id) => r.dusmanlar.find((d) => d.id === id) ?? r.dusenler.find((d) => d.id === id)
      ?? onceki.find((d) => d.id === id) ?? null;
    g.dusmanlar = r.dusmanlar;
    depo.ayarla(r.durum);
    const vurusSayisi = new Map();
    let adGosterildi = false;
    for (const olay of r.olaylar) {
      const kayit = olay.id === undefined ? null : kayitBul(olay.id);
      let sira = 0;
      if (olay.hasar !== undefined) {
        sira = vurusSayisi.get(olay.id) ?? 0;
        vurusSayisi.set(olay.id, sira + 1);
      }
      oyuncuOlayiniGoster(olay, kayit, { sira, adGoster: !adGosterildi });
      if (olay.hasar !== undefined) adGosterildi = true;
    }
    for (const dusen of r.dusenler) dusmanYenildi(dusen);
    dusmanlariCiz();
    etkileriCiz();
    return true;
  }

  // Durulan tıkta: bekleme dolduysa beklemedeki kısayol ya da saldırı, menzildeki hedefe yapılır.
  function vurusDene() {
    if (g.bekleme > 0) return;
    const eylem = g.siradakiEylem ?? { tur: 'saldir' };
    const menzil = eylemMenzili(sinif, eylem);
    if (menzil === null) {
      hamleYap(eylem, null);
      return;
    }
    const hedef = hedefBul(harita, g.oyuncu, g.dusmanlar, { menzil, hedefId: g.hedefId, vurulamaz: muhurluMu });
    if (hedef) hamleYap(eylem, hedef);
    else if (!g.takip) g.siradakiEylem = null;
  }

  // Kısayol yuvası (1–4 ya da dokunma). Yemek hemen yenir; yetenek ve saldırı, vuruş beklemesi
  // dolunca menzildeki hedefe yapılır (hedef uzaktaysa ona yürünür).
  function kisayolKullan(sira) {
    if (mesgul) return;
    const icerik = (depo.al().kisayollar ?? bosKisayollar())[sira];
    if (!icerik) return secenekler.karakterGoster?.();
    const eylem = kisayolEylemi(icerik);
    const kontrol = eylemKontrol(depo.al(), eylem);
    const yuva = kisayolCubugu.querySelector(`[data-kisayol="${sira}"]`);
    if (!kontrol.olur) {
      if (yuva) titret(yuva, 'sarsil', 420);
      const neden = { nefes_yetersiz: S.nefesYetersiz, yemek_yok: S.yemekYok, dolu: S.yemekDolu }[kontrol.neden];
      if (neden) bildirimGoster(ekran, neden, { sure: 1600 });
      return;
    }
    if (eylem.tur === 'yemek') return hamleYap(eylem, null);
    const menzil = eylemMenzili(sinif, eylem);
    g.siradakiEylem = eylem;
    if (menzil === null) {
      // Hedef gerektirmeyen yetenek (şifa, korunma…) yürürken de yapılır
      if (g.bekleme <= 0) hamleYap(eylem, null);
      return kisayolCubugunuCiz();
    }
    if (meydandaMi(harita, g.oyuncu)) {
      g.siradakiEylem = null;
      return bildirimGoster(ekran, S.meydanGuvenli, { sure: 1800 });
    }
    const hedef = hedefBul(harita, g.oyuncu, g.dusmanlar, { menzil, hedefId: g.hedefId, vurulamaz: muhurluMu });
    if (!hedef && !(g.takip && hedefKaydi())) {
      g.siradakiEylem = null;
      if (yuva) titret(yuva, 'sarsil', 420);
      return bildirimGoster(ekran, S.menzilYok, { sure: 1600 });
    }
    // Yürüyorsa durur ki vurabilsin; hedefi izliyorsa izlemeyi sürdürür
    kuyruk = [];
    tutulanYon = null;
    if (g.bekleme <= 0) vurusDene();
    kisayolCubugunuCiz();
  }

  function kisayolCubugunuCiz(durum = depo.al()) {
    const hazir = g.bekleme <= 0 && !mesgul;
    kisayolCubugu.classList.toggle('sira-sende', hazir);
    kisayolCubugu.innerHTML = `
      <span class="kisayol-durum" aria-hidden="true">${hazir ? metinler.kisayol.hazir : metinler.kisayol.bekle}</span>
      <div class="kisayol-yuvalari">
        ${yuvaDugmeleri(durum.kisayollar ?? bosKisayollar(), {
          sinif,
          heybe: durum.heybe,
          kullanilir: (icerik) => !icerik || eylemKontrol(durum, kisayolEylemi(icerik)).olur,
          secili: g.siradakiEylem ? (durum.kisayollar ?? []).findIndex((k) => k && kisayolEylemi(k).tur === g.siradakiEylem.tur
            && (k.anahtar ?? null) === (g.siradakiEylem.anahtar ?? null)) : null,
        })}
      </div>
      <button class="simge-buton kisayol-duzenle" data-eylem="karakter" aria-label="${metinler.kisayol.duzenle}"
              title="${metinler.kisayol.duzenle}">✎</button>`;
  }

  // Bekleme göstergesi her tıkta yenilenir (yuvaları baştan çizmeden)
  function beklemeyiCiz() {
    const hazir = g.bekleme <= 0 && !mesgul;
    if (kisayolCubugu.classList.contains('sira-sende') === hazir) return;
    kisayolCubugu.classList.toggle('sira-sende', hazir);
    kisayolCubugu.querySelector('.kisayol-durum').textContent = hazir ? metinler.kisayol.hazir : metinler.kisayol.bekle;
  }

  // Düşman düştü: figürü dağılır, ödüller işlenir, önemli zaferde zafer kartı açılır.
  function dusmanYenildi(kayit) {
    const el = dusmanFigurleri.get(kayit.id);
    if (el) {
      dusmanFigurleri.delete(kayit.id);
      el.classList.add('dagiliyor');
      setTimeout(() => el.remove(), 900);
    }
    if (g.hedefId === kayit.id) {
      g.hedefId = null;
      g.takip = false;
    }
    const r = zaferUygula(depo.al(), kayit.dusman, g.plaka, rng);
    depo.ayarla(r.durum);
    const o = r.ozet;
    if (!kayit.sabit && !yankesiciMi(kayit)) g.dogusSayaclari.push(YENIDEN_DOGUS_ADIMI);
    // Belirmiş mini boss inine gelir, yenilen boss inden kalkar
    g.dusmanlar = ozelDusmanlariGuncelle(harita, g.dusmanlar, depo.al());
    dusmanlariCiz();
    sesCal('zafer');
    yaziUcur(oyuncuFiguru, `+${o.xp} XP`, 'xp');
    if (o.seviyeler.length) {
      sesCal('seviye');
      parilti(ekran);
      titret(oyuncuFiguru, 'parilti', 1200);
      bildirimGoster(ekran, sablon(S.sonuc.seviyeAtladin, { seviye: o.seviyeler.at(-1) }), { tur: 'kutlama', sure: 3500 });
      for (const y of o.yeniYetenekler) bildirimGoster(ekran, sablon(S.sonuc.yeniYetenek, { yetenek: y.ad }), { tur: 'kutlama', sure: 3500 });
    }
    if (kartliZaferMi(o)) return zaferKartiAc(o, kayit.dusman);
    // Tek bildirim: dağılma, XP, akçe, bulunan yemek ve görev ilerlemesi
    const y = o.yemek && yemekler[o.yemek];
    bildirimGoster(ekran, [
      sablon(S.zafer, { dagilma: sablon(S.dagilma[kayit.dusman.tur], { dusman: kayit.dusman.ad }), xp: o.xp, akce: o.akce }),
      y ? sablon(o.yemekSigmadi ? S.sonuc.yemekSigmadi : S.sonuc.yemek, { ikon: y.ikon, yemek: y.ad }) : '',
      ...o.gorevIlerlemesi.filter((gi) => !o.hazirOlanGorevler.includes(gi.anahtar))
        .map((gi) => sablon(S.sonuc.gorevIlerlemesi, { gorev: gorevVerisi[gi.anahtar].ad, mevcut: gi.mevcut, hedef: gi.hedef })),
    ].filter(Boolean).join(' '), { sure: 2600 });
    for (const a of o.hazirOlanGorevler) {
      bildirimGoster(ekran, sablon(S.sonuc.gorevHazir, { gorev: gorevVerisi[a].ad }), { tur: 'kutlama', sure: 3500 });
    }
  }

  // Zafer kartı: oyun durur, "Devam et" ile sürer (Zülmet yenildiyse bitiş sahnesine geçilir).
  // Bir alan vuruşu birden çok kartlı zafer getirirse kartlar sırayla açılır.
  const kartKuyrugu = [];
  let kartAcik = false;
  function zaferKartiAc(ozet, dusman) {
    if (kartAcik) {
      kartKuyrugu.push([ozet, dusman]);
      return;
    }
    kartAcik = true;
    mesgul = true;
    kuyruk = [];
    tutulanYon = null;
    const katman = document.createElement('div');
    katman.className = 'zafer-katmani';
    katman.innerHTML = zaferKartiHtml(ozet, dusman, g.plaka, depo.al().oyuncu);
    ekran.appendChild(katman);
    katman.querySelector('[data-eylem="devam"]').focus({ preventScroll: true });
    if (ozet.bossYenildi || ozet.zulmetYenildi) parilti(katman);
    const kapat = () => {
      katman.remove();
      kartAcik = false;
      mesgul = false;
      g.dokunulmaz = Math.max(g.dokunulmaz, 2);
    };
    katman.addEventListener('click', (e) => {
      const b = e.target.closest('[data-eylem]');
      if (!b) return;
      e.stopPropagation();
      kapat();
      if (ozet.zulmetYenildi) return secenekler.zulmetYenildi?.();
      if (b.dataset.eylem === 'karakter') return secenekler.karakterGoster?.();
      if (kartKuyrugu.length) zaferKartiAc(...kartKuyrugu.shift());
    });
  }

  // Oyuncu bayıldı: kısa bir bayılma görüntüsünden sonra kervansarayda ya da meydanda kendine gelir.
  function bayil(yankesiciler) {
    mesgul = true;
    kuyruk = [];
    tutulanYon = null;
    sesCal('yenilgi');
    oyuncuFiguru.classList.add('bayiliyor');
    bildirimGoster(ekran, S.bayildin, { tur: 'uyari', sure: 1500 });
    setTimeout(() => {
      const r = yenilgiUygula(depo.al(), g.plaka, { yankesiciler });
      depo.ayarla(r.durum);
      // Peşindekiler dağılır; aynı ilde kalındıysa meydanda kendine gelir
      g.dusmanlar = g.dusmanlar
        .filter((d) => !yankesiciMi(d))
        .map((d) => ({ ...d, kovaliyor: false, kizgin: false, bekleme: 0, sersem: 0 }));
      Object.assign(g, { hedefId: null, takip: false, siradakiEylem: null, etkiler: [], bekleme: 0, oyuncu: { ...harita.dogus }, dokunulmaz: 8 });
      secenekler.bayildi?.(r.ozet);
    }, azHareket ? 300 : 1300);
  }

  // Yürürken bazen bölgenin boss yaratıklarından biri bir anda oyuncunun önüne çıkar.
  function surprizDene() {
    g.surprizAdimi = (g.surprizAdimi ?? 0) + 1;
    if (g.dokunulmaz > 0) return false;
    const d = surprizBaskin(harita, {
      dusmanlar: g.dusmanlar, oyuncu: g.oyuncu, adim: g.surprizAdimi, id: g.sonrakiId,
    }, rng);
    if (!d) return false;
    g.sonrakiId++;
    g.surprizAdimi = 0;
    g.dusmanlar.push({ ...d, bekleme: BEKLEME.hazirlik + 2 });
    kuyruk = [];
    varista = null;
    tutulanYon = null;
    dusmanlariCiz();
    const el = dusmanFigurleri.get(d.id);
    el?.classList.add('beliriyor', 'fark');
    setTimeout(() => el?.classList.remove('fark'), 1500);
    alan.classList.add('sarsinti');
    setTimeout(() => alan.classList.remove('sarsinti'), 500);
    sesCal('evre');
    bildirimGoster(ekran, sablon(metinler.gezginBoss.surpriz, { dusman: d.dusman.ad }), { tur: 'uyari', sure: 1600 });
    bildirimGoster(ekran, sablon(metinler.gezginBoss.uyari[d.dusman.tehlike], { dusman: d.dusman.ad }), { tur: 'uyari', sure: 3600 });
    return true;
  }

  // Yenilen düşmanların yerine, oyuncu yürüdükçe yenileri gelir.
  function yenidenDogur() {
    g.dogusSayaclari = g.dogusSayaclari.map((s) => s - 1);
    const hazir = g.dogusSayaclari.filter((s) => s <= 0).length;
    g.dogusSayaclari = g.dogusSayaclari.filter((s) => s > 0);
    const enCok = dusmanSayisi(arinmaYuzdesi(depo.al(), g.plaka), harita);
    for (let i = 0; i < hazir && siradanDusmanSayisi(g.dusmanlar) < enCok; i++) {
      const dolu = [...g.dusmanlar, ...(g.tuccar ? [g.tuccar] : [])];
      const d = dusmanDogur(harita, g.plaka, rng, {
        dolu, oyuncu: g.oyuncu, enAzUzaklik: 7, id: g.sonrakiId++, bosslar: true,
      });
      if (!d) continue;
      g.dusmanlar.push(d);
      // Takipçiler sürü hâlinde de gelebilir; sürü üyeleri de toplam sayıdan sayılır
      const kalan = enCok - siradanDusmanSayisi(g.dusmanlar);
      if (kalan > 0) {
        const suru = suruUyeleri(harita, d, rng, { dolu: [...dolu, d], ilkId: g.sonrakiId }).slice(0, kalan);
        g.sonrakiId += suru.length;
        g.dusmanlar.push(...suru);
      }
    }
  }

  // ── Yürüme ──
  // Her tık: oyuncu bir karo yürür; yürümediği tıkta (durunca) vuruşu dener.
  function adim() {
    if (mesgul) return;
    if (g.bekleme > 0) g.bekleme--;
    // Beklemedeki hedefsiz yetenek (şifa, korunma…) yürürken de yapılır
    if (g.siradakiEylem && g.bekleme <= 0 && eylemMenzili(sinif, g.siradakiEylem) === null) hamleYap(g.siradakiEylem, null);
    if (!yuru() && !mesgul) vurusDene();
    beklemeyiCiz();
  }

  // Oyuncunun bu tıktaki yürüyüşü. Yürüdüyse true.
  function yuru() {
    let yon = null;
    if (tutulanYon) {
      yon = YONLER[tutulanYon];
    } else if (kuyruk.length) {
      const sonraki = kuyruk.shift();
      yon = { dx: sonraki.x - g.oyuncu.x, dy: sonraki.y - g.oyuncu.y };
    } else if (g.takip) {
      // Hedefin menziline yürünür (hedef de yer değiştirdiği için yol her tıkta yeniden bulunur)
      const h = hedefKaydi();
      if (!h) g.takip = false;
      else if (meydandaMi(harita, g.oyuncu) || !menzildeMi(harita, g.oyuncu, h, aktifMenzil())) {
        const yol = yolBul(harita, g.oyuncu, h, { engeller: engeller() });
        if (yol?.length) yon = { dx: yol[0].x - g.oyuncu.x, dy: yol[0].y - g.oyuncu.y };
        else g.takip = false;
      }
    }
    if (!yon) {
      if (varista) {
        const tur = tuccarKonumdaMi(g.tuccar, varista) ? 'tuccar' : etkilesimTuru(harita, varista.x, varista.y);
        varista = null;
        if (tur) etkiles(tur);
      }
      oyuncuFiguru.classList.remove('yuruyor');
      return false;
    }
    if (yon.dx) g.yon = yon.dx;
    const hedef = { x: g.oyuncu.x + yon.dx, y: g.oyuncu.y + yon.dy };
    if (tuccarKonumdaMi(g.tuccar, hedef)) {
      // Tüccarın üstünden geçilmez; değmek alışveriş ekranını açar
      kuyruk = [];
      tutulanYon = null;
      oyuncuyuCiz();
      etkiles('tuccar');
      return false;
    }
    const onundeki = g.dusmanlar.find((d) => d.x === hedef.x && d.y === hedef.y);
    if (onundeki) {
      // Düşmanın içinden geçilmez; ona yürümek onu hedef almaktır (mühürlü bossta uyarı)
      kuyruk = [];
      oyuncuyuCiz();
      hedefAl(onundeki, { yuru: false });
      return false;
    }
    if (!yurunurMu(harita, hedef.x, hedef.y)) {
      kuyruk = [];
      oyuncuyuCiz();
      const tur = etkilesimTuru(harita, hedef.x, hedef.y);
      if (tur && tutulanYon) {
        tutulanYon = null;
        etkiles(tur);
      }
      return false;
    }
    g.oyuncu = hedef;
    if (g.dokunulmaz > 0) g.dokunulmaz--;
    oyuncuFiguru.classList.add('yuruyor');
    clearTimeout(yuruyorZaman);
    yuruyorZaman = setTimeout(() => oyuncuFiguru.classList.remove('yuruyor'), ADIM_MS * 2);
    oyuncuyuCiz();
    kamera();
    yenidenDogur();
    dusmanlariCiz();
    const kapi = kapiBul(harita, g.oyuncu);
    if (kapi) {
      kapidanGec(kapi);
      return true;
    }
    tuccarTuru();
    if (!surprizDene()) yankesiciDene();
    muhurKontrol();
    return true;
  }

  // Yürürken bazen bir yankesici (ya da iki) yakınlarda çıkıp peşine düşer.
  function yankesiciDene() {
    g.yankesiciAdimi = (g.yankesiciAdimi ?? 0) + 1;
    if (g.dokunulmaz > 0) return;
    const cikanlar = yankesiciBelir(harita, {
      dusmanlar: g.dusmanlar, oyuncu: g.oyuncu, adim: g.yankesiciAdimi, ilkId: g.sonrakiId,
      engeller: g.tuccar ? [g.tuccar] : [],
    }, rng);
    if (!cikanlar.length) return;
    g.sonrakiId += cikanlar.length;
    g.yankesiciAdimi = 0;
    g.dusmanlar.push(...cikanlar);
    dusmanlariCiz();
    for (const d of cikanlar) dusmanFigurleri.get(d.id)?.classList.add('beliriyor');
    sesCal('evre');
    bildirimGoster(ekran, cikanlar.length > 1 ? M.yankesiciIkili : M.yankesici, { tur: 'uyari', sure: 2600 });
  }

  // Düşmanların tıkı: yürür, menzilindeki oyuncuya vurur, uzaklaşınca toparlanır.
  function dusmanTuru() {
    if (mesgul) return;
    const onceki = g.dusmanlar;
    g.dusmanlar = dusmanlariYurut(harita, g.dusmanlar, g.oyuncu, rng, {
      dokunulmaz: g.dokunulmaz > 0, engeller: g.tuccar ? [g.tuccar] : [],
    });
    // İzini kaybettiren oyuncunun peşini bırakan yankesiciler çekip gider; ona vurmuş
    // olanlar kesesinden akçe aşırır
    const cekilen = yankesicileriCek(g.dusmanlar);
    if (cekilen.gidenler.length) {
      g.dusmanlar = cekilen.dusmanlar;
      const c = yankesiciCalmasi(depo.al(), cekilen.gidenler.filter((d) => d.vurdu).length);
      if (c.calinan) {
        depo.ayarla(c.durum);
        bildirimGoster(ekran, sablon(S.sonuc.calinanAkce, { akce: c.calinan }), { tur: 'uyari', sure: 3200 });
      } else {
        bildirimGoster(ekran, M.yankesiciGitti, { sure: 2400 });
      }
    }
    // Takipçi bir düşman ya da gezgin boss peşine takılınca oyuncu uyarılır
    const yeniler = yeniKovalayanlar(onceki, g.dusmanlar);
    const gezgin = yeniler.find((d) => d.dusman.gezgin && !d.surpriz);
    if (gezgin) {
      bildirimGoster(ekran, sablon(metinler.gezginBoss.uyari[gezgin.dusman.tehlike], { dusman: gezgin.dusman.ad }), { tur: 'uyari', sure: 3600 });
    }
    const takipci = yeniler.find((d) => d.dusman.takipci && !d.kizgin);
    if (takipci && performance.now() - sonTakipUyarisi > TAKIP_UYARI_ARALIGI) {
      sonTakipUyarisi = performance.now();
      bildirimGoster(ekran, sablon(M.takip, { dusman: takipci.dusman.ad }), { tur: 'uyari', sure: 2200 });
    }
    // Menzilindeki oyuncuya vuranlar
    const guvende = g.dokunulmaz > 0 || meydandaMi(harita, g.oyuncu);
    const r = dusmanlarVurur(harita, depo.al(), g.dusmanlar, g.oyuncu, rng, { etkiler: g.etkiler, guvende, vurmaz: muhurluMu });
    g.dusmanlar = dusmanlariToparla(r.dusmanlar, g.oyuncu);
    if (r.olaylar.length) {
      g.etkiler = r.etkiler;
      depo.ayarla(r.durum);
      for (const { id, olay } of r.olaylar) dusmanOlayiniGoster(g.dusmanlar.find((d) => d.id === id), olay);
      karsiKoy(r.olaylar.map(({ id }) => g.dusmanlar.find((d) => d.id === id)));
    }
    g.halk = halkiYurut(harita, g.halk, g.oyuncu, g.dusmanlar, rng);
    dusmanlariCiz();
    halkiCiz();
    if (r.bayildi) bayil(g.dusmanlar.filter((d) => yankesiciMi(d) && d.vurdu).length);
  }

  // Vurulan yiğit karşılık verir: hedefi yoksa kendisine vuranların en yakınını hedef alır;
  // duruyorsa ve hedefi menzilinde değilse (ör. uzaktan vuran cine karşı Akıncı) ona yürür.
  // Yürüyen (kaçan) yiğidin yolu kesilmez.
  function karsiKoy(vuranlar) {
    if (!hedefKaydi()) g.hedefId = [...vuranlar].sort((a, b) => mesafe(a, g.oyuncu) - mesafe(b, g.oyuncu))[0].id;
    const hedef = hedefKaydi();
    const bosta = !tutulanYon && !kuyruk.length && !g.takip;
    if (bosta && !menzildeMi(harita, g.oyuncu, hedef, aktifMenzil())) hedefAl(hedef);
  }

  // ── Girdiler ──
  function ekranNoktasiniKaroyaCevir(e) {
    const r = dunya.getBoundingClientRect();
    return { x: Math.floor((e.clientX - r.left) / T), y: Math.floor((e.clientY - r.top) / T) };
  }

  function dokunYuru(e) {
    if (mesgul || e.target.closest('button')) return;
    ipucu.hidden = true;
    let hedef = ekranNoktasiniKaroyaCevir(e);
    if (hedef.x < 0 || hedef.y < 0 || hedef.x >= GENISLIK || hedef.y >= YUKSEKLIK) return;
    // Düşmanın kendisine ya da başının üstüne dokunmak onu hedef almaktır
    const dusman = g.dusmanlar.find((d) => d.x === hedef.x && d.y === hedef.y)
      ?? g.dusmanlar.find((d) => d.x === hedef.x && d.y === hedef.y + 1);
    if (dusman) {
      tutulanYon = null;
      return hedefAl(dusman);
    }
    g.takip = false;
    // Tüccarın kendisine ya da başının üstüne dokunmak ona gitmektir
    const t = g.tuccar;
    if (t && hedef.x === t.x && (hedef.y === t.y || hedef.y === t.y - 1)) hedef = { x: t.x, y: t.y };
    const yol = yolBul(harita, g.oyuncu, hedef, { engeller: t ? [t] : [] });
    if (!yol) return;
    tutulanYon = null;
    kuyruk = yol;
    varista = etkilesimTuru(harita, hedef.x, hedef.y) || tuccarKonumdaMi(t, hedef) ? hedef : null;
    hedefIsareti.hidden = false;
    hedefIsareti.style.transform = `translate3d(${hedef.x * T}px, ${hedef.y * T}px, 0)`;
    hedefIsareti.classList.remove('beliriyor');
    void hedefIsareti.getBoundingClientRect();
    hedefIsareti.classList.add('beliriyor');
  }
  alan.addEventListener('pointerdown', dokunYuru);

  // Ekrandaki yön tuşları: basılı tutuldukça yürür
  yonTuslari.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-yon]');
    if (!b || mesgul) return;
    e.preventDefault();
    ipucu.hidden = true;
    b.setPointerCapture?.(e.pointerId);
    kuyruk = [];
    varista = null;
    g.takip = false;
    tutulanYon = b.dataset.yon;
    adim();
  });
  const yonuBirak = () => {
    tutulanYon = null;
  };
  yonTuslari.addEventListener('pointerup', yonuBirak);
  yonTuslari.addEventListener('pointercancel', yonuBirak);
  yonTuslari.addEventListener('lostpointercapture', yonuBirak);
  yonTuslari.addEventListener('contextmenu', (e) => e.preventDefault());

  // Klavye: oklar ve WASD yürür, 1–4 kısayol yuvaları, Boşluk en yakın düşmanı hedef alır.
  const basili = new Set();
  function tusBasildi(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.('input, textarea')) return;
    const sira = ['1', '2', '3', '4'].indexOf(e.key);
    if (sira >= 0 || e.key === ' ') {
      // Açık bir pencere (zafer kartı, klavye penceresi) varsa tuşlar onundur
      if (mesgul || document.querySelector('[aria-modal="true"]')) return;
      e.preventDefault();
      if (e.repeat) return;
      ipucu.hidden = true;
      return sira >= 0 ? kisayolKullan(sira) : enYakiniHedefAl();
    }
    const yon = TUSLAR[e.key];
    if (!yon) return;
    e.preventDefault();
    ipucu.hidden = true;
    if (!basili.has(e.key)) {
      basili.add(e.key);
      kuyruk = [];
      varista = null;
      g.takip = false;
      tutulanYon = yon;
      adim();
    }
  }
  function tusBirakildi(e) {
    basili.delete(e.key);
    if (TUSLAR[e.key] === tutulanYon) {
      const diger = [...basili].map((k) => TUSLAR[k]).find(Boolean);
      tutulanYon = diger ?? null;
    }
  }
  window.addEventListener('keydown', tusBasildi);
  window.addEventListener('keyup', tusBirakildi);
  const odakKaybi = () => {
    basili.clear();
    tutulanYon = null;
  };
  window.addEventListener('blur', odakKaybi);

  function sesDugmesiniCiz() {
    const b = ekran.querySelector('[data-eylem="ses"]');
    const acik = sesAcikMi();
    b.textContent = acik ? '🔊' : '🔇';
    b.setAttribute('aria-label', acik ? metinler.ses.kapat : metinler.ses.ac);
    b.title = b.getAttribute('aria-label');
  }

  function yonTuslariniAyarla(acik) {
    yonTuslari.hidden = !acik;
    yonDugmesi.setAttribute('aria-pressed', String(acik));
  }

  ekran.addEventListener('click', (e) => {
    const yuva = e.target.closest('[data-kisayol]');
    if (yuva) return kisayolKullan(Number(yuva.dataset.kisayol));
    const b = e.target.closest('[data-eylem]');
    if (!b || mesgul) return;
    switch (b.dataset.eylem) {
      case 'baslik': return secenekler.baslikaDon?.();
      case 'bilgi': return secenekler.ilBilgisi?.();
      case 'harita': return secenekler.haritaGoster?.();
      case 'heybe': return secenekler.heybeGoster?.();
      case 'gunluk': return secenekler.gunlukGoster?.();
      case 'karakter': return secenekler.karakterGoster?.();
      case 'kisayollar': return secenekler.kisayollariGoster?.();
      case 'ses':
        sesAyarla(!sesAcikMi());
        return sesDugmesiniCiz();
      case 'yon-tuslari': {
        const acik = yonTuslari.hidden;
        yonTuslariniAyarla(acik);
        yonTuslariniKaydet(acik);
      }
    }
  });

  // ── Başlat ──
  yonTuslariniAyarla(yonTuslariAcikMi());
  sesDugmesiniCiz();
  if (secenekler.ipucuGoster) ipucu.hidden = false;
  kapilariCiz();
  // İle girişte tüccar haritada bekliyorsa, il adı afişi kalkınca haber verilir
  if (g.tuccar && !g.tuccar.duyuruldu) {
    if (secenekler.ilGirisi) setTimeout(() => ekran.isConnected && tuccarDuyur(), 2400);
    else tuccarDuyur();
  }
  const aboneliktenCik = depo.abone(ustCubuguCiz);
  ustCubuguCiz(depo.al());
  const gozlemci = new ResizeObserver(boyutla);
  gozlemci.observe(alan);
  boyutla();
  zamanlayicilar.push(setInterval(adim, ADIM_MS), setInterval(dusmanTuru, DUSMAN_MS));

  return () => {
    zamanlayicilar.forEach(clearInterval);
    clearTimeout(yuruyorZaman);
    gozlemci.disconnect();
    aboneliktenCik();
    window.removeEventListener('keydown', tusBasildi);
    window.removeEventListener('keyup', tusBirakildi);
    window.removeEventListener('blur', odakKaybi);
  };
}
