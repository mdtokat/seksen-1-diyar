// İllerin gerçek büyüklüğü ve kalabalığı üzerine bilgiler: yüzölçümü ve nüfus
// sıralamaları, nüfus yoğunluğu ve öne çıkan özellikler. Saf oyun mantığı.
import { iller } from '../veri/iller.js';

const siraHaritasi = (deger, azalan = true) => {
  const sirali = [...iller].sort((a, b) => (azalan ? deger(b) - deger(a) : deger(a) - deger(b)));
  return new Map(sirali.map((il, i) => [il.plaka, i + 1]));
};

const yogunlukHesapla = (il) => il.nufus / il.yuzolcumu;
const ALAN_SIRASI = siraHaritasi((il) => il.yuzolcumu);
const NUFUS_SIRASI = siraHaritasi((il) => il.nufus);
const YOGUNLUK_SIRASI = siraHaritasi(yogunlukHesapla);
const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const SON = iller.length;

// { yuzolcumu, nufus, yogunluk (kişi/km²), alanSirasi, nufusSirasi, yogunlukSirasi } — sıra 1 en büyüğüdür.
export function ilCografyasi(plaka) {
  const il = ilHaritasi.get(plaka);
  return {
    yuzolcumu: il.yuzolcumu,
    nufus: il.nufus,
    yogunluk: Math.round(yogunlukHesapla(il)),
    alanSirasi: ALAN_SIRASI.get(plaka),
    nufusSirasi: NUFUS_SIRASI.get(plaka),
    yogunlukSirasi: YOGUNLUK_SIRASI.get(plaka),
  };
}

// İlin Türkiye genelinde öne çıkan özellikleri (metinler.cografya.ozellikler anahtarları):
// en_genis, en_kucuk, en_kalabalik, en_az_nufus, en_yogun, en_seyrek, ilk_bes_genis, ilk_bes_kalabalik.
export function ilOzellikleri(plaka) {
  const c = ilCografyasi(plaka);
  const o = [];
  if (c.alanSirasi === 1) o.push('en_genis');
  else if (c.alanSirasi <= 5) o.push('ilk_bes_genis');
  if (c.alanSirasi === SON) o.push('en_kucuk');
  if (c.nufusSirasi === 1) o.push('en_kalabalik');
  else if (c.nufusSirasi <= 5) o.push('ilk_bes_kalabalik');
  if (c.nufusSirasi === SON) o.push('en_az_nufus');
  if (c.yogunlukSirasi === 1) o.push('en_yogun');
  if (c.yogunlukSirasi === SON) o.push('en_seyrek');
  return o;
}
