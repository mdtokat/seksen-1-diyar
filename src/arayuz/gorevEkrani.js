// Görev veren ekranı (plan.md Faz 9): meydandaki muhtar ya da Ahi Baba ile konuşma.
// Görev alınır ve teslim edilir; muhtar, ulaştırılan yemekleri teslim alır ve itibarı
// yüksek yiğide köylüler adına hediye verir.
import { iller } from '../veri/iller.js';
import { yemekler } from '../veri/yemekler.js';
import { gorevler } from '../veri/gorevler.js';
import { metinler } from '../veri/metinler.js';
import {
  gorevDurumu,
  gorevAl,
  gorevAlKontrol,
  gorevTamamla,
  gorevTamamlaKontrol,
  verenGorevleri,
  teslimEdilecekler,
} from '../oyun/gorevler.js';
import { kademeSirasi, hayirPuani, itibarKademesi, hediyeKontrol, hediyeAl } from '../oyun/itibar.js';
import { kacis, sablon, bildirimGoster, parilti } from './bilesenler.js';
import { sesCal } from './ses.js';
import { gorevKarti } from './gorevKarti.js';

const M = metinler.gorev;
const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));

function hediyeBolumu(durum) {
  const k = hediyeKontrol(durum);
  const yemek = yemekler[ilHaritasi.get(durum.konum).yemek];
  if (k.olur) {
    return `
      <section class="kart hediye-karti">
        <h3>🎁 ${M.hediye.baslik}</h3>
        <p>${kacis(sablon(M.hediye.metin, { adet: k.adet, yemek: yemek.ad }))} <span aria-hidden="true">${yemek.ikon}</span></p>
        <button class="buton buton-ana buton-genis" data-eylem="hediye">${M.hediye.al}</button>
      </section>`;
  }
  if (k.neden === 'heybe_dolu') return `<section class="kart"><p class="kart-not engel">${M.hediye.heybeDolu}</p></section>`;
  return '';
}

function teslimDugmesi(durum, anahtar) {
  const k = gorevTamamlaKontrol(durum, anahtar);
  return k.olur ? `<button class="buton buton-kucuk buton-ana" data-teslim="${anahtar}">${M.teslimEt}</button>` : '';
}

function gorevDugmesi(durum, anahtar) {
  const d = gorevDurumu(durum, anahtar);
  if (d === 'alinabilir') {
    const k = gorevAlKontrol(durum, anahtar);
    return `<button class="buton buton-kucuk" data-al="${anahtar}" ${k.olur ? '' : 'disabled'}
      title="${kacis(k.olur ? '' : M.neden[k.neden] ?? '')}">${M.kabulEt}</button>`;
  }
  return teslimDugmesi(durum, anahtar);
}

function icerik(durum, veren, tesekkur) {
  const plaka = durum.konum;
  const selam = M.selamlar[veren][kademeSirasi(hayirPuani(durum))];
  const teslimler = veren === 'muhtar' ? teslimEdilecekler(durum, plaka) : [];
  const kendi = verenGorevleri(plaka, veren).filter((a) => gorevDurumu(durum, a) !== 'kilitli');
  const hediye = veren === 'muhtar' ? hediyeBolumu(durum) : '';
  const bos = !hediye && !teslimler.length && !kendi.some((a) => gorevDurumu(durum, a) !== 'tamam');

  const gorevListesi = kendi.map((a) => {
    const d = gorevDurumu(durum, a);
    const k = gorevAlKontrol(durum, a);
    const not = d === 'alinabilir' && !k.olur ? M.neden[k.neden] ?? null : null;
    return gorevKarti(durum, a, { sag: gorevDugmesi(durum, a), anlatim: d !== 'tamam', not });
  }).join('');

  return `
    ${tesekkur ?? ''}
    <section class="kart">
      <p class="dukkan-selami"><strong>${M.verenler[veren]}:</strong> “${kacis(bos ? `${selam} ${M.bosSoz[veren]}` : selam)}”</p>
      <p class="kese">🌟 ${kacis(itibarKademesi(durum).ad)} · ${metinler.itibar.hayir}: ${hayirPuani(durum)}</p>
    </section>
    ${hediye}
    ${teslimler.length ? `
      <section class="kart">
        <h3>🧺 ${M.teslimler}</h3>
        <ul class="esya-listesi">${teslimler.map((a) => gorevKarti(durum, a, { sag: teslimDugmesi(durum, a) })).join('')}</ul>
      </section>` : ''}
    ${kendi.length ? `
      <section class="kart">
        <h3>📜 ${M.gorevler}</h3>
        <ul class="esya-listesi">${gorevListesi}</ul>
      </section>` : ''}`;
}

// Tamamlanan görevin teşekkür kartı: teslim alanın sözleri ve kazanılanlar.
function tesekkurKarti(anahtar, odul) {
  return `
    <section class="kart tesekkur-karti" tabindex="-1">
      <h3>✓ ${kacis(gorevler[anahtar].ad)}</h3>
      <q class="gorev-anlatim">${kacis(gorevler[anahtar].tesekkur)}</q>
      <p class="kese">${sablon(metinler.gorev.odul, odul)}</p>
    </section>`;
}

// Ekranı `kap` içine kurar. Temizlik fonksiyonu döndürür.
// secenekler: { veren: 'muhtar' | 'ahi_baba', geri }
export function gorevEkrani(kap, depo, { veren, geri } = {}) {
  const il = ilHaritasi.get(depo.al().konum);
  let tesekkur = null;
  kap.innerHTML = `
    <div class="sayfa-ekrani gorev-ekrani">
      <header class="ust-cubuk">
        <button class="simge-buton" data-eylem="geri" aria-label="${M.geri}" title="${M.geri}">←</button>
        <h1 class="ust-baslik">${veren === 'muhtar' ? '📜' : '⚒️'} ${M.verenler[veren]} <span class="ust-alt">${kacis(il.ad)}</span></h1>
      </header>
      <main class="sayfa-icerik" aria-live="polite"></main>
    </div>`;
  const ekran = kap.querySelector('.gorev-ekrani');
  const alan = ekran.querySelector('.sayfa-icerik');
  const ciz = (durum) => {
    alan.innerHTML = icerik(durum, veren, tesekkur);
  };

  ekran.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.eylem === 'geri') return geri?.();
    const once = depo.al();
    if (b.dataset.al) {
      const sonra = gorevAl(once, b.dataset.al);
      if (sonra === once) return;
      depo.ayarla(sonra);
      const g = gorevler[b.dataset.al];
      bildirimGoster(ekran, sablon(M.kabulEdildi, { gorev: g.ad }));
      if (g.tur === 'ulastir') bildirimGoster(ekran, sablon(M.yemekVerildi, { yemek: yemekler[g.yemek].ad }));
    } else if (b.dataset.teslim) {
      const r = gorevTamamla(once, b.dataset.teslim);
      if (!r.odul) return;
      tesekkur = tesekkurKarti(b.dataset.teslim, r.odul);
      depo.ayarla(r.durum);
      alan.querySelector('.tesekkur-karti')?.focus();
      bildirimGoster(ekran, sablon(M.tamamlandi, { gorev: gorevler[b.dataset.teslim].ad, ...r.odul }), { tur: 'kutlama', sure: 4000 });
      sesCal(r.seviyeler.length ? 'seviye' : 'zafer');
      if (r.seviyeler.length) {
        parilti(ekran);
        bildirimGoster(ekran, sablon(metinler.savas.sonuc.seviyeAtladin, { seviye: r.seviyeler.at(-1) }), { tur: 'kutlama', sure: 3500 });
      }
      for (const y of r.yeniYetenekler) {
        bildirimGoster(ekran, sablon(metinler.savas.sonuc.yeniYetenek, { yetenek: y.ad }), { tur: 'kutlama', sure: 3500 });
      }
    } else if (b.dataset.eylem === 'hediye') {
      const r = hediyeAl(once);
      if (!r.adet) return;
      depo.ayarla(r.durum);
      sesCal('yemek');
      bildirimGoster(ekran, sablon(M.hediye.aldin, { adet: r.adet, yemek: yemekler[r.yemek].ad }), { tur: 'kutlama' });
    }
  });

  const cik = depo.abone(ciz);
  ciz(depo.al());
  return cik;
}
