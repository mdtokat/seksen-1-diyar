// İl içi gezinti ekranı: kuşbakışı harita, yürüyen oyuncu, dolaşan düşmanlar.
// Karo katmanı bir kez çizilir; kamera, harita kabını GPU ile kaydırarak oyuncuyu izler.
// Oyuncu ve düşmanlar karo katmanının üstünde ayrı figürlerdir.
//
// Gezinti durumu (g) ekranlar arasında korunur (savaşa girip çıkınca kaldığı yerden
// sürer) ve bu ekran tarafından güncellenir:
//   { plaka, harita, oyuncu: {x, y}, yon, dusmanlar, sonrakiId, dogusSayaclari, dokunulmaz }
import { iller } from '../veri/iller.js';
import { bolgeler } from '../veri/bolgeler.js';
import { metinler } from '../veri/metinler.js';
import { arinmaYuzdesi, seyahatKontrol, bolgeAcikMi, bossDurumu, bossKosullari } from '../oyun/ilerleme.js';
import {
  GENISLIK,
  YUKSEKLIK,
  yurunurMu,
  yolBul,
  kapiBul,
  etkilesimTuru,
  dusmanlariYurut,
  temasEdenDusman,
  dusmanDogur,
  dusmanSayisi,
  siradanDusmanSayisi,
} from '../oyun/gezinti.js';
import { sablon, kacis, bildirimGoster } from './bilesenler.js';
import { karakterDugmesiniCiz } from './karakterDugmesi.js';
import { haritaKatmani, kapiKatmani, KARO_BOYU } from './cizimler/karolar.js';
import { sinifCizimi } from './cizimler/karakterler.js';
import { dusmanCizimi } from './cizimler/dusmanlar.js';

const M = metinler.gezinti;
const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const bolgeHaritasi = new Map(bolgeler.map((b) => [b.anahtar, b]));
const IL_ADLARI = Object.fromEntries(iller.map((il) => [il.plaka, kacis(il.ad)]));

const ADIM_MS = 170; // oyuncunun bir karo yürüme süresi
const DUSMAN_MS = 650; // düşmanların hamle aralığı
export const YENIDEN_DOGUS_ADIMI = 25; // yenilen düşmanın yerine yenisi kaç adım sonra gelir
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

// secenekler: { g, rng, savasBaslat(dusmanKaydi), ileGec(plaka), ilBilgisi, haritaGoster,
//               heybeGoster, karakterGoster, baslikaDon, ipucuGoster,
//               arastaGoster, ahiGoster, kervansarayGoster }
export function gezintiEkrani(kap, depo, secenekler) {
  const { g, rng } = secenekler;
  const harita = g.harita;
  const il = ilHaritasi.get(g.plaka);
  const bolge = bolgeHaritasi.get(il.bolge);

  kap.innerHTML = `
    <div class="gezinti-ekrani">
      <header class="ust-cubuk">
        <button class="simge-buton" data-eylem="baslik" aria-label="${M.baslikEkrani}" title="${M.baslikEkrani}">←</button>
        <button class="gezinti-il" data-eylem="bilgi" aria-label="${M.ilBilgisi}">
          <strong>📍 ${kacis(il.ad)}</strong>
          <span class="gezinti-il-alt">
            <span class="bolge-noktasi" style="background:${bolge.renk}"></span>
            <span class="gezinti-bolge">${kacis(bolge.ad)}</span>
            <span class="gezinti-arinma"></span>
          </span>
        </button>
        <button class="karakter-dugmesi" data-eylem="karakter" hidden></button>
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
        <div class="gezinti-araclari">
          <button class="simge-buton" data-eylem="harita" aria-label="${M.harita}" title="${M.harita}">🗺️</button>
          <button class="simge-buton" data-eylem="heybe" aria-label="${M.heybe}" title="${M.heybe}">🎒</button>
          <button class="simge-buton" data-eylem="bilgi" aria-label="${M.ilBilgisi}" title="${M.ilBilgisi}">ℹ️</button>
          <button class="simge-buton" data-eylem="yon-tuslari" aria-label="${M.yonTuslari}" title="${M.yonTuslari}" aria-pressed="false">🎮</button>
        </div>
        <div class="yon-tuslari" hidden>
          <button class="yon-tusu yon-yukari" data-yon="yukari" aria-label="${M.yukari}">▲</button>
          <button class="yon-tusu yon-sola" data-yon="sola" aria-label="${M.sola}">◀</button>
          <button class="yon-tusu yon-saga" data-yon="saga" aria-label="${M.saga}">▶</button>
          <button class="yon-tusu yon-asagi" data-yon="asagi" aria-label="${M.asagi}">▼</button>
        </div>
        <p class="gezinti-ipucu" hidden>${M.ipucu}</p>
      </div>
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
  const ipucu = ekran.querySelector('.gezinti-ipucu');

  let T = 36; // bir karonun piksel boyu (ekrana göre)
  let kuyruk = []; // dokun-yürü yolu
  let varista = null; // yolun sonunda etkileşilecek yapı { x, y }
  let tutulanYon = null; // basılı tutulan yön tuşu
  let mesgul = false; // savaşa ya da başka ile geçiş sırasında girdi alınmaz
  let yuruyorZaman = null;
  const zamanlayicilar = [];

  // ── Figürler ──
  const oyuncuFiguru = document.createElement('div');
  oyuncuFiguru.className = 'harita-figuru oyuncu-figuru';
  oyuncuFiguru.innerHTML = `<div class="figur-ic">${sinifCizimi(depo.al().oyuncu.sinif)}</div>`;
  figurKatmani.appendChild(oyuncuFiguru);
  const dusmanFigurleri = new Map();

  // Figür karosunun ortasına, ayakları karonun altına gelecek biçimde yerleşir.
  // Boss ve mini boss figürleri daha büyüktür.
  function figurKonumla(el, x, y) {
    const boy = el.classList.contains('ozel-figur') ? 2.2 : 1.6;
    el.style.transform = `translate3d(${(x + 0.5 - boy / 2) * T}px, ${(y + 0.85 - boy) * T}px, 0)`;
    el.style.zIndex = String(10 + y); // aşağıdaki figür öndekidir
  }

  function dusmanFiguruOlustur(d) {
    const el = document.createElement('div');
    el.className = `harita-figuru dusman-figuru${d.sabit ? ` ozel-figur ozel-${d.tur}` : ''}`;
    el.dataset.id = d.id;
    const B = metinler.boss;
    const rozet = d.sabit
      ? `${d.tur === 'boss' ? B.rozet : B.miniRozet} · ${sablon(metinler.savas.seviye, { seviye: d.dusman.seviye })}`
      : sablon(metinler.savas.seviye, { seviye: d.dusman.seviye });
    el.innerHTML = `<div class="figur-ic">${dusmanCizimi(d.dusman.anahtar)}</div>
      <span class="figur-rozeti">${rozet}</span>
      ${d.tur === 'boss' ? `<span class="muhur" aria-hidden="true"></span>` : ''}`;
    el.title = d.dusman.ad;
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
      if (d.tur === 'boss') el.classList.toggle('muhurlu', bossMuhurluMu());
      figurKonumla(el, d.x, d.y);
    }
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
    kamera();
    void dunya.getBoundingClientRect();
    dunya.classList.remove('anlik');
  }

  function kapilariCiz() {
    const durum = depo.al();
    kapiKatmaniG.innerHTML = kapiKatmani(harita, IL_ADLARI, (plaka) => bolgeAcikMi(durum, ilHaritasi.get(plaka).bolge));
  }

  function ustCubuguCiz(durum) {
    arinmaEtiketi.textContent = sablon(M.arinma, { yuzde: arinmaYuzdesi(durum, g.plaka) });
    karakterDugmesiniCiz(karakterDugmesi, durum.oyuncu);
  }

  // ── Etkileşimler ──
  function etkiles(tur) {
    kuyruk = [];
    varista = null;
    if (tur === 'tabela') return secenekler.ilBilgisi?.();
    if (tur === 'tezgah') return secenekler.arastaGoster?.();
    if (tur === 'dukkan') return secenekler.ahiGoster?.();
    if (tur === 'kervansaray') return secenekler.kervansarayGoster?.();
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

  function bossMuhurluMu() {
    return bossDurumu(depo.al(), il.bolge) === 'muhurlu';
  }

  // Mühürlü bossa yaklaşınca koşullar bir kez söylenir; uzaklaşınca yeniden söylenebilir.
  let muhurUyarildi = false;
  function muhurUyarisi(d) {
    if (muhurUyarildi) return;
    muhurUyarildi = true;
    kuyruk = [];
    const k = bossKosullari(depo.al(), il.bolge);
    bildirimGoster(ekran, sablon(metinler.boss.muhurlu, { boss: d.dusman.ad, bolge: bolge.ad, ...k }), { tur: 'uyari', sure: 5000 });
  }

  function temasKontrol() {
    if (mesgul || g.dokunulmaz > 0) return;
    const d = temasEdenDusman(harita, g.dusmanlar, g.oyuncu);
    if (!d || d.tur !== 'boss') muhurUyarildi = false;
    if (!d) return;
    if (d.tur === 'boss' && bossMuhurluMu()) return muhurUyarisi(d);
    mesgul = true;
    kuyruk = [];
    tutulanYon = null;
    const el = dusmanFigurleri.get(d.id);
    el?.classList.add('fark');
    bildirimGoster(ekran, sablon(M.fark, { dusman: d.dusman.ad }), { sure: 900 });
    setTimeout(() => secenekler.savasBaslat?.(d), 550);
  }

  // Yenilen düşmanların yerine, oyuncu yürüdükçe yenileri gelir.
  function yenidenDogur() {
    g.dogusSayaclari = g.dogusSayaclari.map((s) => s - 1);
    const hazir = g.dogusSayaclari.filter((s) => s <= 0).length;
    g.dogusSayaclari = g.dogusSayaclari.filter((s) => s > 0);
    const enCok = dusmanSayisi(arinmaYuzdesi(depo.al(), g.plaka));
    for (let i = 0; i < hazir && siradanDusmanSayisi(g.dusmanlar) < enCok; i++) {
      const d = dusmanDogur(harita, g.plaka, rng, { dolu: g.dusmanlar, oyuncu: g.oyuncu, enAzUzaklik: 7, id: g.sonrakiId++ });
      if (d) g.dusmanlar.push(d);
    }
  }

  // ── Yürüme ──
  function adim() {
    if (mesgul) return;
    let yon = null;
    if (tutulanYon) {
      yon = YONLER[tutulanYon];
    } else if (kuyruk.length) {
      const sonraki = kuyruk.shift();
      yon = { dx: sonraki.x - g.oyuncu.x, dy: sonraki.y - g.oyuncu.y };
    }
    if (!yon) {
      if (varista) {
        const tur = etkilesimTuru(harita, varista.x, varista.y);
        varista = null;
        if (tur) etkiles(tur);
      }
      oyuncuFiguru.classList.remove('yuruyor');
      return;
    }
    if (yon.dx) g.yon = yon.dx;
    const hedef = { x: g.oyuncu.x + yon.dx, y: g.oyuncu.y + yon.dy };
    if (g.dusmanlar.some((d) => d.x === hedef.x && d.y === hedef.y)) {
      // Düşmanın içinden geçilmez; değmek savaşı (ya da mühür uyarısını) başlatır
      kuyruk = [];
      oyuncuyuCiz();
      temasKontrol();
      return;
    }
    if (!yurunurMu(harita, hedef.x, hedef.y)) {
      kuyruk = [];
      oyuncuyuCiz();
      const tur = etkilesimTuru(harita, hedef.x, hedef.y);
      if (tur && tutulanYon) {
        tutulanYon = null;
        etkiles(tur);
      }
      return;
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
    if (kapi) return kapidanGec(kapi);
    temasKontrol();
  }

  function dusmanTuru() {
    if (mesgul) return;
    g.dusmanlar = dusmanlariYurut(harita, g.dusmanlar, g.oyuncu, rng, { dokunulmaz: g.dokunulmaz > 0 });
    dusmanlariCiz();
    temasKontrol();
  }

  // ── Girdiler ──
  function ekranNoktasiniKaroyaCevir(e) {
    const r = dunya.getBoundingClientRect();
    return { x: Math.floor((e.clientX - r.left) / T), y: Math.floor((e.clientY - r.top) / T) };
  }

  function dokunYuru(e) {
    if (mesgul || e.target.closest('button')) return;
    ipucu.hidden = true;
    const hedef = ekranNoktasiniKaroyaCevir(e);
    if (hedef.x < 0 || hedef.y < 0 || hedef.x >= GENISLIK || hedef.y >= YUKSEKLIK) return;
    const yol = yolBul(harita, g.oyuncu, hedef);
    if (!yol) return;
    tutulanYon = null;
    kuyruk = yol;
    varista = etkilesimTuru(harita, hedef.x, hedef.y) ? hedef : null;
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

  const basili = new Set();
  function tusBasildi(e) {
    const yon = TUSLAR[e.key];
    if (!yon || e.target.closest?.('input, textarea')) return;
    e.preventDefault();
    ipucu.hidden = true;
    if (!basili.has(e.key)) {
      basili.add(e.key);
      kuyruk = [];
      varista = null;
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

  function yonTuslariniAyarla(acik) {
    yonTuslari.hidden = !acik;
    yonDugmesi.setAttribute('aria-pressed', String(acik));
  }

  ekran.addEventListener('click', (e) => {
    const b = e.target.closest('[data-eylem]');
    if (!b || mesgul) return;
    switch (b.dataset.eylem) {
      case 'baslik': return secenekler.baslikaDon?.();
      case 'bilgi': return secenekler.ilBilgisi?.();
      case 'harita': return secenekler.haritaGoster?.();
      case 'heybe': return secenekler.heybeGoster?.();
      case 'karakter': return secenekler.karakterGoster?.();
      case 'yon-tuslari': {
        const acik = yonTuslari.hidden;
        yonTuslariniAyarla(acik);
        yonTuslariniKaydet(acik);
      }
    }
  });

  // ── Başlat ──
  yonTuslariniAyarla(yonTuslariAcikMi());
  if (secenekler.ipucuGoster) ipucu.hidden = false;
  kapilariCiz();
  const aboneliktenCik = depo.abone(ustCubuguCiz);
  ustCubuguCiz(depo.al());
  const gozlemci = new ResizeObserver(boyutla);
  gozlemci.observe(alan);
  boyutla();
  zamanlayicilar.push(setInterval(adim, ADIM_MS), setInterval(dusmanTuru, DUSMAN_MS));
  // Ekrana dönüldüğünde, oyuncu hâlâ bir düşmana değiyorsa hemen savaşa girmesin
  if (temasEdenDusman(harita, g.dusmanlar, g.oyuncu)) g.dokunulmaz = Math.max(g.dokunulmaz, 3);

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
