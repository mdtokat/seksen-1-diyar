// Haritanın kıpırtısı: yakındaki ağaçlar rüzgârda salınır, bacalardan duman tüter, yerde
// bulut gölgeleri kayar, arada bir kuş sürüsü geçer, çimenlikte kelebekler uçar; yürürken
// ayak altında toz kalkar, karda, kumda ve toprak yolda ayak izi kalır.
//
// Telefonda da akıcı kalsın diye yalnız yiğidin yakınındakiler canlandırılır; çoğu
// hareket CSS dönüşümüdür (ekran kartında oynar). `prefers-reduced-motion` açıkken
// hiçbiri çalışmaz.
import { KARO } from '../oyun/gezinti.js';

const SALINIM_X = 7; // yiğitten bu kadar karo yakındaki ağaçlar salınır
const SALINIM_Y = 9;
const DUMAN_X = 9; // bu kadar yakındaki bacalar tüter
const DUMAN_Y = 11;
const EN_COK_IZ = 16;
const EN_COK_BULUT = 2;
const EN_COK_KELEBEK = 2;
const KELEBEK_RENKLERI = ['#f2c94c', '#ffffff', '#e07ab0', '#b36ae0', '#f08a2a'];
const IZ_BOLGELERI = new Set(['dogu_anadolu', 'guneydogu']); // kar ve kum: her yerde iz kalır
const TOZ_BOLGELERI = new Set(['guneydogu', 'ic_anadolu', 'akdeniz']);
const KUS = '<svg viewBox="0 0 14 8" aria-hidden="true"><path d="M0 5 Q3.5 0 7 5 Q10.5 0 14 5" fill="none" stroke="#2b2433" stroke-width="1.4" stroke-linecap="round"/></svg>';

// `harita`: il haritası; `katmanlar`: haritaKatmanlari() sonucu; `T()`: karonun piksel boyu;
// `kamera()`: görünen alanın dünya pikseli cinsinden kutusu { x, y, w, h }.
export function ortamKur({ ekran, harita, katmanlar, T, kamera, azHareket }) {
  const bos = { konum() {}, adim() {}, yenile() {}, kapat() {} };
  if (azHareket) return bos;
  const yer = ekran.querySelector('.yer-katmani');
  const hava = ekran.querySelector('.hava-katmani');
  const atmosfer = ekran.querySelector('.atmosfer');
  const G = harita.genislik;
  const karo = (x, y) => harita.karolar[y * G + x];
  const kar = harita.bolge === 'dogu_anadolu';
  const zamanlayicilar = new Set();
  const sonra = (ms, is) => {
    const z = setTimeout(() => { zamanlayicilar.delete(z); is(); }, ms);
    zamanlayicilar.add(z);
  };
  const ekle = (kap, sinif, x, y) => {
    const el = document.createElement('div');
    el.className = sinif;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    kap.appendChild(el);
    return el;
  };
  let oyuncu = harita.dogus;

  // ── Ağaçlar ──
  const agacUse = new Map();
  for (const u of ekran.querySelectorAll('use.agac[data-n]')) {
    const n = Number(u.dataset.n);
    if (!agacUse.has(n)) agacUse.set(n, []);
    agacUse.get(n).push(u);
  }
  const agaclar = katmanlar.nesneler.filter((o) => o.agac);
  let sallanan = new Set();
  function agaclariSalla() {
    const yeni = new Set(agaclar
      .filter((o) => Math.abs(o.x - oyuncu.x) <= SALINIM_X && Math.abs(o.y - oyuncu.y) <= SALINIM_Y)
      .map((o) => o.n));
    for (const n of sallanan) if (!yeni.has(n)) agacUse.get(n)?.forEach((u) => u.classList.remove('sallan'));
    for (const n of yeni) if (!sallanan.has(n)) agacUse.get(n)?.forEach((u) => u.classList.add('sallan'));
    sallanan = yeni;
  }

  // ── Baca dumanı ──
  const tutenler = new Map(); // baca sırası → öğe
  function dumanlariTuttur() {
    katmanlar.bacalar.forEach((b, i) => {
      const yakin = Math.abs(b.x - oyuncu.x) <= DUMAN_X && Math.abs(b.y - oyuncu.y) <= DUMAN_Y;
      const el = tutenler.get(i);
      if (yakin && !el) {
        const d = ekle(hava, 'duman-kaynagi', b.x * T(), b.y * T());
        d.innerHTML = '<i></i><i></i><i></i>';
        d.style.setProperty('--d', `${-(i % 5) * 0.7}s`);
        tutenler.set(i, d);
      } else if (!yakin && el) {
        el.remove();
        tutenler.delete(i);
      }
    });
  }

  // ── Bulut gölgeleri: görünen alanın solundan girip sağından çıkar ──
  function bulutGonder() {
    if (hava.querySelectorAll('.bulut-golgesi').length < EN_COK_BULUT) {
      const k = kamera();
      const en = (5 + Math.random() * 5) * T();
      const b = ekle(hava, 'bulut-golgesi', k.x - en, k.y + Math.random() * k.h - en * 0.3);
      b.style.width = `${en}px`;
      b.style.height = `${en * 0.6}px`;
      const yol = k.w + 2 * en;
      b.style.setProperty('--yol', `${yol}px`);
      b.style.animationDuration = `${yol / (T() * 0.5)}s`;
      b.addEventListener('animationend', () => b.remove());
    }
    sonra(16000 + Math.random() * 14000, bulutGonder);
  }

  // ── Kuş sürüsü: göğün yüksek bir yerinden ekranı boydan boya geçer ──
  function kusGonder() {
    const s = document.createElement('div');
    const soldan = Math.random() < 0.5;
    s.className = `kus-surusu${soldan ? '' : ' sagdan'}`;
    s.style.top = `${8 + Math.random() * 40}%`;
    s.style.setProperty('--yol', `${atmosfer.clientWidth + 120}px`);
    s.style.setProperty('--sapma', `${(Math.random() - 0.5) * 80}px`);
    s.style.animationDuration = `${9 + Math.random() * 5}s`;
    const sayi = 3 + Math.floor(Math.random() * 3);
    s.innerHTML = Array.from({ length: sayi }, (_, i) =>
      `<span class="kus" style="left:${i * 14 + Math.random() * 8}px;top:${Math.abs(i - (sayi - 1) / 2) * 9}px;animation-delay:${-Math.random()}s">${KUS}</span>`).join('');
    s.addEventListener('animationend', () => s.remove());
    atmosfer.appendChild(s);
    sonra(25000 + Math.random() * 30000, kusGonder);
  }

  // ── Kelebekler: yiğidin yakınındaki çimenlikte bir süre uçar ──
  function kelebekGonder() {
    if (!kar && hava.querySelectorAll('.kelebek').length < EN_COK_KELEBEK) {
      for (let deneme = 0; deneme < 8; deneme++) {
        const x = oyuncu.x + Math.round((Math.random() - 0.5) * 6);
        const y = oyuncu.y + Math.round((Math.random() - 0.5) * 6);
        if (x < 1 || y < 1 || x >= G - 1 || y >= harita.yukseklik - 1) continue;
        if (![KARO.CIM, KARO.YABANI].includes(karo(x, y))) continue;
        const k = ekle(hava, 'kelebek', (x + 0.5) * T(), (y + 0.3) * T());
        k.style.setProperty('--renk', KELEBEK_RENKLERI[Math.floor(Math.random() * KELEBEK_RENKLERI.length)]);
        if (Math.random() < 0.5) k.classList.add('ters');
        k.innerHTML = '<i></i><i></i>';
        k.addEventListener('animationend', (e) => { if (e.target === k) k.remove(); });
        break;
      }
    }
    sonra(7000 + Math.random() * 6000, kelebekGonder);
  }

  // ── Adım: toz ve ayak izi ──
  function adim(bas, son) {
    const t = karo(bas.x, bas.y);
    const yolda = t === KARO.YOL || t === KARO.KAPI;
    if (t === KARO.MEYDAN) return;
    const px = (bas.x + 0.5) * T();
    const py = (bas.y + 0.82) * T();
    if (yolda || IZ_BOLGELERI.has(harita.bolge)) {
      const iz = ekle(yer, `ayak-izi${kar && !yolda ? ' karda' : ''}`, px, py);
      iz.style.setProperty('--aci', `${Math.atan2(son.y - bas.y, son.x - bas.x) + Math.PI / 2}rad`);
      iz.addEventListener('animationend', () => iz.remove());
      const izler = yer.querySelectorAll('.ayak-izi');
      if (izler.length > EN_COK_IZ) izler[0].remove();
    }
    if (yolda || kar || TOZ_BOLGELERI.has(harita.bolge)) {
      const toz = ekle(yer, `toz${kar && !yolda ? ' karda' : ''}`, px, py);
      toz.innerHTML = '<i></i><i></i><i></i>';
      toz.style.setProperty('--yon', String(Math.sign(son.x - bas.x) || 0));
      sonra(700, () => toz.remove());
    }
  }

  function konum(o) {
    oyuncu = o;
    agaclariSalla();
    dumanlariTuttur();
  }

  // Ekran boyu (karo boyu) değişince dünyaya bağlı öğeler yeniden yerleşir.
  function yenile() {
    for (const el of tutenler.values()) el.remove();
    tutenler.clear();
    for (const el of hava.querySelectorAll('.bulut-golgesi, .kelebek')) el.remove();
    yer.replaceChildren();
    dumanlariTuttur();
  }

  function kapat() {
    for (const z of zamanlayicilar) clearTimeout(z);
    zamanlayicilar.clear();
  }

  sonra(2500, bulutGonder);
  sonra(6000 + Math.random() * 10000, kusGonder);
  sonra(4000, kelebekGonder);
  return { konum, adim, yenile, kapat };
}
