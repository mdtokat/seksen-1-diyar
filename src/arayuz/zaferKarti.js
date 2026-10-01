// Zafer kartı: haritada önemli bir düşman yenilince (boss, mini boss, gezgin boss, Zülmet)
// ya da büyük bir kazanç olunca (il arındı, eşya düştü, mini boss belirdi) gezintinin
// üstünde açılan kart. Kart açıkken oyun durur; "Devam et" ile kapanır.
// Sıradan zaferler kart açmaz, haritada uçan yazı ve bildirimle gösterilir.
import { iller } from '../veri/iller.js';
import { yemekler } from '../veri/yemekler.js';
import { dusmanlar as dusmanVerisi } from '../veri/dusmanlar.js';
import { esyalar as esyaVerisi } from '../veri/esyalar.js';
import { gorevler as gorevVerisi } from '../veri/gorevler.js';
import { bolgeler } from '../veri/bolgeler.js';
import { metinler } from '../veri/metinler.js';
import { gerekenXp } from '../oyun/karakter.js';
import { SOFRA } from '../oyun/ilerleme.js';
import { bolgeGirisi } from '../oyun/rota.js';
import { kacis, sablon, degerCubugu } from './bilesenler.js';
import { bolgeArkaPlani } from './cizimler/arkaplanlar.js';
import { dusmanCizimi } from './cizimler/dusmanlar.js';

const S = metinler.savas.sonuc;
const B = metinler.boss;
const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));

// Bu zafer kart açmayı hak ediyor mu?
export function kartliZaferMi(ozet) {
  return Boolean(ozet.bossYenildi || ozet.miniBossYenildi || ozet.zulmetYenildi || ozet.gezginBoss
    || ozet.esya || ozet.arindi || ozet.miniBossBelirdi);
}

// Zaferin satırları (HTML). `dusman`: yenilen düşman, `plaka`: savaşılan il.
export function zaferSatirlari(ozet, dusman, plaka) {
  const il = ilHaritasi.get(plaka);
  const satirlar = [sablon(S.xp, { xp: ozet.xp })];
  if (ozet.seviyeler.length) satirlar.push(`<strong class="kutlama">${sablon(S.seviyeAtladin, { seviye: ozet.seviyeler.at(-1) })}</strong>`);
  for (const y of ozet.yeniYetenekler) satirlar.push(`<strong>${sablon(S.yeniYetenek, { yetenek: kacis(y.ad) })}</strong>`);
  if (ozet.akce) satirlar.push(sablon(S.akce, { akce: ozet.akce }));
  if (ozet.yemek) {
    const y = yemekler[ozet.yemek];
    satirlar.push(sablon(ozet.yemekSigmadi ? S.yemekSigmadi : S.yemek, { ikon: y.ikon, yemek: kacis(y.ad) }));
  }
  if (ozet.arinmaArtisi) satirlar.push(sablon(S.arinma, { artis: ozet.arinmaArtisi, yuzde: ozet.arinma }));
  if (ozet.arindi) satirlar.push(`<strong class="kutlama">${sablon(S.arindi, { il: kacis(il.ad) })}</strong>`);
  if (ozet.esya) {
    const e = esyaVerisi[ozet.esya];
    satirlar.push(`<strong class="kutlama">${sablon(S.esya, { ikon: e.ikon, esya: kacis(e.ad), nadirlik: metinler.nadirlik[e.nadirlik] })}</strong>`);
  }
  if (ozet.zulmetYenildi) satirlar.push(`<strong class="kutlama">🏰 ${metinler.final.yenildi}</strong>`);
  if (ozet.miniBossYenildi) satirlar.push(`<strong>${sablon(B.miniYenildi, { boss: kacis(dusman.ad) })}</strong>`);
  if (ozet.gezginBoss) satirlar.push(`<strong class="kutlama">${sablon(metinler.gezginBoss.yenildi, { dusman: kacis(dusman.ad) })}</strong>`);
  if (ozet.hayir) satirlar.push(sablon(S.hayir, { hayir: ozet.hayir }));
  for (const g of ozet.gorevIlerlemesi) {
    if (!ozet.hazirOlanGorevler.includes(g.anahtar)) {
      satirlar.push(sablon(S.gorevIlerlemesi, { gorev: kacis(gorevVerisi[g.anahtar].ad), mevcut: g.mevcut, hedef: g.hedef }));
    }
  }
  for (const a of ozet.hazirOlanGorevler) {
    satirlar.push(`<strong class="kutlama">${sablon(S.gorevHazir, { gorev: kacis(gorevVerisi[a].ad) })}</strong>`);
  }
  if (ozet.miniBossBelirdi) {
    satirlar.push(`<strong class="kutlama">${sablon(B.miniBelirdi, { boss: kacis(dusmanVerisi[ozet.miniBossBelirdi].ad) })}</strong>`);
  }
  if (ozet.bossYenildi) {
    const bolge = bolgeler.find((b) => b.anahtar === ozet.bossYenildi);
    const sofraYemekleri = Object.values(yemekler)
      .filter((y) => ilHaritasi.get(y.il).bolge === bolge.anahtar)
      .map((y) => `${y.ikon} ${y.ad}`);
    const devami = ozet.acilanBolge ? metinler.hikayeSonraki[ozet.acilanBolge] : metinler.hikayeSon;
    satirlar.push(`<em class="hikaye">${metinler.hikaye[bolge.anahtar]} ${devami}</em>`);
    satirlar.push(sablon(B.sofra, { yemekler: kacis(sofraYemekleri.join(', ')), zafer: SOFRA.zafer }));
    if (ozet.acilanBolge) {
      const yeni = bolgeler.find((b) => b.anahtar === ozet.acilanBolge);
      satirlar.push(`<strong class="kutlama">🗺️ ${sablon(B.yeniBolge, { bolge: yeni.ad, il: kacis(ilHaritasi.get(bolgeGirisi(yeni.anahtar)).ad) })}</strong>`);
    }
  }
  return satirlar;
}

// Kartın HTML'i. `oyuncu`: zaferden sonraki oyuncu (XP çubuğu ve stat puanı için).
export function zaferKartiHtml(ozet, dusman, plaka, oyuncu) {
  const bolge = ilHaritasi.get(plaka).bolge;
  const karakterButonu = oyuncu.statPuani > 0
    ? `<button class="buton" data-eylem="karakter">${S.karakteriAc}</button>`
    : '';
  return `
    <section class="zafer-karti" role="dialog" aria-modal="true" aria-labelledby="zafer-basligi">
      <div class="zafer-sahnesi" aria-hidden="true">
        ${bolgeArkaPlani(bolge)}
        <div class="zafer-dusmani">${dusmanCizimi(dusman.anahtar)}</div>
      </div>
      <div class="zafer-icerik">
        <h2 id="zafer-basligi">${S.zafer}</h2>
        <p class="zafer-dagilma">${kacis(sablon(metinler.savas.dagilma[dusman.tur], { dusman: dusman.ad }))}</p>
        ${zaferSatirlari(ozet, dusman, plaka).map((s) => `<p>${s}</p>`).join('')}
        ${degerCubugu(oyuncu.xp, gerekenXp(oyuncu.seviye), { etiket: 'XP', renk: 'var(--altin)' })}
        ${oyuncu.statPuani > 0 ? `<p>${sablon(S.statPuaniKazandin, { puan: oyuncu.statPuani })}</p>` : ''}
        <div class="sonuc-butonlari">
          <button class="buton buton-ana" data-eylem="devam">${S.devam}</button>
          ${karakterButonu}
        </div>
      </div>
    </section>`;
}
