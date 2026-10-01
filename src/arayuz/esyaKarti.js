// Eşya kartı: simge, ad, nadirlik rozeti, statlar, seviye şartı ve açıklama.
// Ahi dükkânı ve karakter ekranındaki ekipman bölümü kullanır.
import { esyaBilgisi } from '../oyun/rota.js';
import { siniflar } from '../veri/siniflar.js';
import { metinler } from '../veri/metinler.js';
import { kacis, sablon } from './bilesenler.js';

export function esyaStatMetni(anahtar) {
  return Object.entries(esyaBilgisi(anahtar).statlar)
    .map(([stat, deger]) => `+${deger} ${metinler.statAdlari[stat]}`)
    .join(' · ');
}

// `sag`: kartın sağındaki düğme ya da fiyat (HTML). `not`: açıklamanın yerine yazılacak uyarı.
export function esyaKarti(anahtar, { sag = '', not = '', soluk = false } = {}) {
  const e = esyaBilgisi(anahtar);
  const tur = e.sinif ? siniflar[e.sinif].ad : metinler.yuvaAdlari[e.yuva];
  return `
    <li class="esya-karti nadirlik-${e.nadirlik}${soluk ? ' soluk' : ''}">
      <span class="esya-ikon" aria-hidden="true">${e.ikon}</span>
      <div class="esya-bilgi">
        <strong>${kacis(e.ad)}</strong>
        <span class="esya-ust">
          <span class="nadirlik-rozeti">${metinler.nadirlik[e.nadirlik]}</span>
          ${kacis(metinler.yuvaAdlari[e.yuva])}${e.sinif ? ` · ${kacis(tur)}` : ''} · ${sablon(metinler.ekipman.seviye, { seviye: e.seviye })}
        </span>
        <span class="esya-stat">${esyaStatMetni(anahtar)}</span>
        <small>${kacis(not || e.aciklama)}</small>
      </div>
      ${sag ? `<div class="esya-sag">${sag}</div>` : ''}
    </li>`;
}
