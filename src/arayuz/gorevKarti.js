// Görev kartı: tür simgesi, ad, durum rozeti, hedef ve ilerleme, ödül.
// Görev veren ekranı ve görev günlüğü kullanır.
import { gorevler } from '../veri/gorevler.js';
import { iller } from '../veri/iller.js';
import { yemekler } from '../veri/yemekler.js';
import { dusmanlar } from '../veri/dusmanlar.js';
import { metinler } from '../veri/metinler.js';
import { gorevDurumu, gorevIlerlemesi, gorevOdulu, teslimYeri } from '../oyun/gorevler.js';
import { kacis, sablon } from './bilesenler.js';

const M = metinler.gorev;
const ilAdi = (plaka) => iller.find((il) => il.plaka === plaka).ad;
const TUR_SIMGESI = { yen: '⚔️', arindir: '🌿', ulastir: '🧺' };

// Görevin hedefi ve ilerlemesi, tek satır.
export function gorevHedefMetni(durum, anahtar) {
  const g = gorevler[anahtar];
  const { mevcut, hedef } = gorevIlerlemesi(durum, anahtar);
  return sablon(M.hedef[g.tur], {
    dusman: g.dusman && dusmanlar[g.dusman].ad,
    il: g.hedefIl && ilAdi(g.hedefIl),
    yemek: g.yemek && yemekler[g.yemek].ad,
    mevcut,
    hedef,
  });
}

// Oyuncuya yol gösteren kısa not: nerede teslim edileceği, düşmanın nerede
// bulunduğu ya da götürülecek yemeğin nereden alınacağı.
export function gorevIpucu(durum, anahtar) {
  const g = gorevler[anahtar];
  const d = gorevDurumu(durum, anahtar);
  const t = teslimYeri(anahtar);
  const yer = { il: ilAdi(t.il), veren: M.verenler[t.veren] };
  if (d === 'hazir') return sablon(M.hazir, { ...yer, veren: M.verenlerCumlede[t.veren] });
  if (d === 'alinabilir' && g.tur === 'ulastir') return sablon(M.ulastirIpucu, { yemek: yemekler[g.yemek].ad });
  if (d === 'aktif' && g.tur === 'ulastir') {
    return sablon(M.yemekYok, { yemek: yemekler[g.yemek].ad, il: ilAdi(yemekler[g.yemek].il) });
  }
  if (g.tur === 'yen' && d !== 'tamam') {
    const bulunan = iller.filter((il) => il.dusmanlar.includes(g.dusman)).map((il) => il.ad);
    return sablon(M.yenIpucu, { iller: bulunan.join(', ') });
  }
  return d === 'tamam' ? '' : sablon(M.teslimYeri, yer);
}

// `sag`: kartın sağındaki düğme (HTML). `anlatim`: görevi verenin sözleri de yazılsın mı.
export function gorevKarti(durum, anahtar, { sag = '', anlatim = false, not = null } = {}) {
  const g = gorevler[anahtar];
  const d = gorevDurumu(durum, anahtar);
  const odul = gorevOdulu(anahtar);
  const ipucu = not ?? gorevIpucu(durum, anahtar);
  return `
    <li class="gorev-karti gorev-${d}">
      <span class="esya-ikon gorev-ikon" aria-hidden="true">${TUR_SIMGESI[g.tur]}</span>
      <div class="esya-bilgi">
        <strong>${kacis(g.ad)} <span class="gorev-rozeti">${M.durum[d] ?? ''}</span></strong>
        ${anlatim ? `<q class="gorev-anlatim">${kacis(g.anlatim)}</q>` : ''}
        ${d === 'tamam' ? '' : `<span class="gorev-hedef">${kacis(gorevHedefMetni(durum, anahtar))}</span>`}
        ${d === 'tamam' ? '' : `<span class="esya-ust">${sablon(M.odul, odul)}</span>`}
        ${ipucu ? `<small>${kacis(ipucu)}</small>` : ''}
      </div>
      ${sag ? `<div class="esya-sag">${sag}</div>` : ''}
    </li>`;
}
