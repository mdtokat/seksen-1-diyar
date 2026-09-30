// Başarımlar ve yemek defteri (plan.md Faz 10). Saf oyun mantığı — DOM'a dokunmaz.
//
// Oyun durumu her değiştiğinde `oyunDurumunuIsle(yeni, onceki)` çağrılır (durum
// deposunun dönüştürücüsü): heybeye giren yemekler deftere yazılır, koşulu
// sağlanan başarımlar kazanılır. Kazanılan başarım bir daha kaybedilmez.
import { basarimlar } from '../veri/basarimlar.js';
import { iller } from '../veri/iller.js';
import { bolgeler } from '../veri/bolgeler.js';
import { yemekler } from '../veri/yemekler.js';
import { esyalar } from '../veri/esyalar.js';
import { gorevler } from '../veri/gorevler.js';
import { itibarKademeleri } from '../veri/itibar.js';
import { arinmaYuzdesi } from './ilerleme.js';
import { hayirPuani } from './itibar.js';

const TUM_YEMEKLER = Object.keys(yemekler);
const HALKIN_YIGIDI = itibarKademeleri.find((k) => k.ad === 'Halkın Yiğidi').esik;
const arinmisMi = (durum, plaka) => arinmaYuzdesi(durum, plaka) >= 100;

// Yeni yenilen bölge bossları (önceki durumda yenilmemiş olanlar).
function yeniYenilenBosslar(yeni, onceki) {
  const once = new Set(onceki?.yenilenBosslar ?? []);
  return (yeni.yenilenBosslar ?? []).filter((b) => !once.has(b));
}

// Her başarımın koşulu: (yeni durum, önceki durum) → true ise kazanılır.
export const KOSULLAR = {
  ilk_zafer: (d) => (d.istatistik?.zafer ?? 0) > 0,
  ilk_il: (d) => iller.some((il) => arinmisMi(d, il.plaka)),
  bir_bolge: (d) => bolgeler.some((b) => iller.filter((il) => il.bolge === b.anahtar).every((il) => arinmisMi(d, il.plaka))),
  // Bayılma bölge bölge sayılır; boss yenildiği anda o bölgede hiç bayılınmamış olmalı
  yigit: (d, o) => yeniYenilenBosslar(d, o).some((b) => !(d.istatistik?.bolgeBayilma?.[b] > 0)),
  efsane: (d) => (d.esyalar ?? []).some((a) => esyalar[a]?.nadirlik === 'efsanevi'),
  halkin_yigidi: (d) => hayirPuani(d) >= HALKIN_YIGIDI,
  gorev_ehli: (d) => Object.keys(gorevler).every((a) => d.gorevler?.[a]?.durum === 'tamam'),
  sofra_ustasi: (d) => TUM_YEMEKLER.every((y) => (d.toplananYemekler ?? []).includes(y)),
  zulmete_son: (d) => Boolean(d.zulmetYenildi),
  seksen_bir_diyar: (d) => iller.every((il) => arinmisMi(d, il.plaka)),
};

// Heybedeki yemekleri yemek defterine yazar (en az bir kez sahip olunan yemekler).
export function yemekDefteriniGuncelle(durum) {
  const defter = durum.toplananYemekler ?? [];
  const yeniler = [...new Set((durum.heybe ?? []).map((y) => y.anahtar))].filter((a) => !defter.includes(a));
  return yeniler.length ? { ...durum, toplananYemekler: [...defter, ...yeniler] } : durum;
}

// Koşulu yeni sağlanan başarımları ekler. Değişiklik yoksa aynı durumu döndürür.
export function basarimlariDenetle(durum, onceki = null) {
  const kazanilan = durum.basarimlar ?? [];
  const yeniler = Object.keys(basarimlar).filter((a) => !kazanilan.includes(a) && KOSULLAR[a](durum, onceki));
  return yeniler.length ? { ...durum, basarimlar: [...kazanilan, ...yeniler] } : durum;
}

// Durum deposunun dönüştürücüsü: her yeni duruma uygulanır.
export function oyunDurumunuIsle(yeni, onceki = null) {
  return basarimlariDenetle(yemekDefteriniGuncelle(yeni), onceki);
}

// Önceki durumda olmayıp yeni durumda kazanılan başarımlar (bildirim için).
export function yeniBasarimlar(onceki, yeni) {
  const once = new Set(onceki?.basarimlar ?? []);
  return (yeni.basarimlar ?? []).filter((a) => !once.has(a));
}
