// İlin gerçek yüzölçümü, nüfusu ve öne çıkan özellikleri (il bilgisi, harita kartı
// ve ile giriş afişi kullanır).
import { metinler } from '../veri/metinler.js';
import { ilCografyasi, ilOzellikleri } from '../oyun/cografya.js';
import { sablon } from './bilesenler.js';

const C = metinler.cografya;
const sayi = (n) => n.toLocaleString('tr-TR');

// <dl class="kart-bilgi"> içine konacak satırlar.
export function cografyaSatirlari(plaka) {
  const c = ilCografyasi(plaka);
  return `
    <div><dt>${C.yuzolcumu}</dt><dd>${sablon(C.alanDegeri, { deger: sayi(c.yuzolcumu), sira: c.alanSirasi })}</dd></div>
    <div><dt>${C.nufus}</dt><dd>${sablon(C.nufusDegeri, { deger: sayi(c.nufus), sira: c.nufusSirasi })}
      <small>${C.yogunluk}: ${sablon(C.yogunlukDegeri, { deger: sayi(c.yogunluk) })}</small></dd></div>`;
}

// Öne çıkan özelliklerin rozetleri (yoksa boş metin).
export function ozellikRozetleri(plaka, sinif = 'cografya-rozetleri') {
  const o = ilOzellikleri(plaka);
  return o.length ? `<ul class="${sinif}">${o.map((a) => `<li>${C.ozellikler[a]}</li>`).join('')}</ul>` : '';
}

// İle girişte afişin altında gösterilen tek satır (en belirgin özellik).
export function afisOzelligi(plaka) {
  const [ilk] = ilOzellikleri(plaka).filter((a) => !a.startsWith('ilk_bes'));
  return ilk ? C.ozellikler[ilk] : '';
}
