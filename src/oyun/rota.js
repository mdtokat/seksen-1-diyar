// Yolculuğun rotası: bölgelerin açılma sırası ve başlangıç ili. Saf oyun mantığı —
// DOM'a dokunmaz.
//
// Her yeni oyun başka bir bölgeden başlar: Marmara'dan hiç başlanmaz, kalan altı bölgenin
// hepsinden birer kez başlanmadan da hiçbiri tekrarlanmaz (başlangıç geçmişi). Başlangıç
// ili, o bölgenin nüfusça en küçük illerinden biridir. Kalan bölgeler komşuluk zinciriyle sıralanır: her yeni bölge, bir
// önceki bölgeye (yoksa açılmış herhangi bir bölgeye) kara sınırıyla bağlıdır.
//
// Güç bölgeye değil, rotadaki sıraya bağlıdır: rotanın k. bölgesi, veri dosyalarındaki
// "klasik" sıranın (Marmara → … → Doğu Anadolu) k. bölgesinin kademesini alır:
//   · düşman seviye aralığı ve il seviyeleri (giriş ilinden uzaklaştıkça artar),
//   · yöresel yemeklerin gücü ve fiyatı (yemekCarpani),
//   · eşyaların statları, fiyatı ve kuşanma seviyesi,
//   · yaratıkların stat çarpanları (bosslar kademenin bossunun, sıradan yaratıklar kendi
//     karakterlerini koruyarak kademenin ortalamasının gücünü alır).
// Klasik rotada (Marmara'dan başlayan) her şey veri dosyalarındaki değerlerle aynıdır;
// eski kayıtlar bu rotayla açılır.
//
// Rotaya bağlı değerler iki yoldan okunur: oyun durumu alan fonksiyonlar `durum.rota`yı,
// durum almayanlar (düşman üretimi, yemek ve eşya değerleri…) etkin rotayı kullanır.
// Etkin rota, bir oyun başlatılırken ya da yüklenirken `rotaAyarla` ile seçilir.
import { bolgeler } from '../veri/bolgeler.js';
import { iller } from '../veri/iller.js';
import { dusmanlar } from '../veri/dusmanlar.js';
import { esyalar } from '../veri/esyalar.js';
import { sec } from './rastgele.js';

export const BASLANGIC = {
  haricBolgeler: ['marmara'], // bu bölgelerden hiç başlanmaz
  adayIlSayisi: 3, // başlangıç ili, bölgenin nüfusça en küçük bu kadar ilinden biri
};

const KLASIK_SIRA = [...bolgeler].sort((a, b) => a.sira - b.sira);
// Rotadaki k. bölgenin kademesi: seviye aralığı ve yemek çarpanı.
export const KADEMELER = KLASIK_SIRA.map((b) => ({ seviye: [...b.seviye], yemekCarpani: b.yemekCarpani }));
export const KLASIK_ROTA = Object.freeze({
  bolgeler: Object.freeze(KLASIK_SIRA.map((b) => b.anahtar)),
  baslangic: KLASIK_SIRA[0].giris,
});

const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const bolgeHaritasi = new Map(bolgeler.map((b) => [b.anahtar, b]));
const bolgeIlleri = (anahtar) => iller.filter((il) => il.bolge === anahtar);

// İki bölge kara sınırıyla komşu mu?
const BOLGE_KOMSULARI = new Map(bolgeler.map((b) => [b.anahtar, new Set()]));
for (const il of iller) {
  for (const k of il.komsular) {
    const kb = ilHaritasi.get(k).bolge;
    if (kb !== il.bolge) BOLGE_KOMSULARI.get(il.bolge).add(kb);
  }
}
export const bolgelerKomsuMu = (a, b) => BOLGE_KOMSULARI.get(a).has(b);

// ── Rota üretimi ─────────────────────────────────────────

// Bölgenin başlangıç olabilecek illeri: bossun ili dışındaki, nüfusça en küçük iller.
export function baslangicAdaylari(bolgeAnahtari) {
  const bolge = bolgeHaritasi.get(bolgeAnahtari);
  return bolgeIlleri(bolgeAnahtari)
    .filter((il) => il.plaka !== bolge.bossIli)
    .sort((a, b) => a.nufus - b.nufus)
    .slice(0, BASLANGIC.adayIlSayisi)
    .map((il) => il.plaka);
}

// Başlangıç olabilecek bölgeler.
export const baslangicBolgeleri = () => bolgeler.map((b) => b.anahtar).filter((a) => !BASLANGIC.haricBolgeler.includes(a));

// Başlangıç bölgeleri torbadan çekilir: her turda altı bölgeden birer kez başlanır.
// `gecmis`: bu turda başlanan bölgeler (sonuncusu en yenisi). Tur bittiyse yeni turda
// en son başlanan dışındaki bütün bölgeler adaydır (arka arkaya aynı bölge olmaz).
export function baslangicBolgesiAdaylari(gecmis = []) {
  const hepsi = baslangicBolgeleri();
  const kalan = hepsi.filter((a) => !gecmis.includes(a));
  return kalan.length ? kalan : hepsi.filter((a) => a !== gecmis[gecmis.length - 1]);
}

// Yeni oyun `bolge`den başlayınca geçmiş: biten turun ardından yeni tur başlar.
export function baslangicGecmisiniGuncelle(gecmis, bolge) {
  const hepsi = baslangicBolgeleri();
  const gecerli = gecmis.filter((a) => hepsi.includes(a));
  if (hepsi.every((a) => gecerli.includes(a))) return [bolge];
  return [...gecerli.filter((a) => a !== bolge), bolge];
}

// Yeni bir rota üretir. `gecmis`: bu turda başlanmış bölgeler (bunlardan başlanmaz).
// Sonuç: { bolgeler: [anahtar…], baslangic: plaka }.
export function rotaOlustur(rng, { gecmis = [] } = {}) {
  const ilk = sec(rng, baslangicBolgesiAdaylari(gecmis));
  const sira = [ilk];
  while (sira.length < bolgeler.length) {
    const kalan = bolgeler.map((b) => b.anahtar).filter((a) => !sira.includes(a));
    const sonun = kalan.filter((a) => bolgelerKomsuMu(a, sira[sira.length - 1]));
    const herhangi = kalan.filter((a) => sira.some((s) => bolgelerKomsuMu(a, s)));
    sira.push(sec(rng, sonun.length ? sonun : herhangi.length ? herhangi : kalan));
  }
  return { bolgeler: sira, baslangic: sec(rng, baslangicAdaylari(ilk)) };
}

// Rota geçerli mi? (kayıt denetimi için)
export function rotaGecerliMi(rota) {
  if (!rota || typeof rota !== 'object' || !Array.isArray(rota.bolgeler)) return false;
  const anahtarlar = bolgeler.map((b) => b.anahtar);
  if (rota.bolgeler.length !== anahtarlar.length || new Set(rota.bolgeler).size !== anahtarlar.length) return false;
  if (!rota.bolgeler.every((a) => anahtarlar.includes(a))) return false;
  return ilHaritasi.get(rota.baslangic)?.bolge === rota.bolgeler[0];
}

// ── Bölge içi seviyeler ──────────────────────────────────

// Bölge içinde, giriş ilinden başlayarak yalnızca aynı bölgedeki komşular üzerinden
// BFS ile her ilin mesafesini hesaplar. Sonuç: { plaka: mesafe }.
export function bolgeIciMesafeler(illerListesi, bolge) {
  const ilMap = new Map(illerListesi.filter((il) => il.bolge === bolge.anahtar).map((il) => [il.plaka, il]));
  const mesafe = { [bolge.giris]: 0 };
  const kuyruk = [bolge.giris];
  while (kuyruk.length > 0) {
    const plaka = kuyruk.shift();
    for (const komsu of ilMap.get(plaka).komsular) {
      if (ilMap.has(komsu) && !(komsu in mesafe)) {
        mesafe[komsu] = mesafe[plaka] + 1;
        kuyruk.push(komsu);
      }
    }
  }
  return mesafe;
}

// Her ilin düşman seviye aralığını hesaplar (plan.md Bölüm 4).
// Giriş iline yakın iller düşük, uzak iller yüksek seviyeli olur; mesafe
// kademeleri bölgenin seviye aralığını eşit parçalara bölerek kaplar. Çok illi bir
// bölge dar bir aralığa düşse de her ilin aralığı en az iki seviyedir.
// `bolgeListesi` öğeleri { anahtar, giris, seviye } taşır. Sonuç: { plaka: [enAz, enCok] }.
export function ilSeviyeleriniHesapla(illerListesi, bolgeListesi) {
  const sonuc = {};
  for (const bolge of bolgeListesi) {
    const mesafeler = bolgeIciMesafeler(illerListesi, bolge);
    const enUzak = Math.max(...Object.values(mesafeler));
    const [altSinir, ustSinir] = bolge.seviye;
    const kademe = (ustSinir - altSinir) / (enUzak + 1);
    for (const [plaka, d] of Object.entries(mesafeler)) {
      const enAz = Math.min(altSinir + Math.round(d * kademe), ustSinir - 1);
      sonuc[plaka] = [enAz, Math.max(enAz + 1, altSinir + Math.round((d + 1) * kademe))];
    }
  }
  return sonuc;
}

// Rotadaki bölgelerin giriş illeri. İlk bölgenin girişi başlangıç ilidir. Sonrakiler,
// bir önceki bölgeye (yoksa rotada daha önce açılan bir bölgeye) sınırı olan illerdir:
// verideki giriş ili uygunsa o, değilse bossun ili dışındaki en az nüfuslu aday.
function girisleriBul(rota) {
  const girisler = { [rota.bolgeler[0]]: rota.baslangic };
  rota.bolgeler.forEach((anahtar, k) => {
    if (k === 0) return;
    const bolge = bolgeHaritasi.get(anahtar);
    const sinirda = (onceki) => bolgeIlleri(anahtar).filter((il) => il.komsular.some((p) => onceki.includes(ilHaritasi.get(p).bolge)));
    let adaylar = sinirda([rota.bolgeler[k - 1]]);
    if (!adaylar.length) adaylar = sinirda(rota.bolgeler.slice(0, k));
    if (!adaylar.length) adaylar = bolgeIlleri(anahtar);
    if (adaylar.some((il) => il.plaka === bolge.giris)) {
      girisler[anahtar] = bolge.giris;
      return;
    }
    const bosssuz = adaylar.filter((il) => il.plaka !== bolge.bossIli);
    girisler[anahtar] = [...(bosssuz.length ? bosssuz : adaylar)].sort((a, b) => a.nufus - b.nufus)[0].plaka;
  });
  return girisler;
}

// ── Kademeye göre ölçekleme ──────────────────────────────

const STAT_ANAHTARLARI = ['can', 'guc', 'savunma', 'ceviklik'];

// Bölgenin sıradan yaratıklarının ortalama stat çarpanları.
const SIRADAN_ORTALAMA = new Map(bolgeler.map((b) => {
  const liste = Object.values(dusmanlar).filter((d) => d.bolge === b.anahtar && d.sinif === 'siradan');
  return [b.anahtar, Object.fromEntries(STAT_ANAHTARLARI.map((s) => [s, liste.reduce((t, d) => t + d.carpan[s], 0) / liste.length]))];
}));

// Yaratığın, rotadaki kademesine göre stat çarpanları. Bosslar ve mini bosslar
// kademenin (klasik sıradaki aynı yerin) bossunun çarpanlarını alır; sıradan yaratıklar
// kendi güçlü ve zayıf yanlarını korur, ortalamaları kademenin ortalamasına çekilir.
function dusmanCarpani(anahtar, kademeBolgesi) {
  const d = dusmanlar[anahtar];
  if (!d.bolge || !bolgeHaritasi.has(d.bolge) || d.bolge === kademeBolgesi || d.sinif === 'final') return d.carpan;
  const k = bolgeHaritasi.get(kademeBolgesi);
  if (d.sinif === 'bolge_bossu') return dusmanlar[k.boss].carpan;
  if (d.sinif === 'mini_boss') return dusmanlar[k.miniBoss].carpan;
  const kendi = SIRADAN_ORTALAMA.get(d.bolge);
  const hedef = SIRADAN_ORTALAMA.get(kademeBolgesi);
  return Object.fromEntries(STAT_ANAHTARLARI.map((s) => [s, Math.round(d.carpan[s] * (hedef[s] / kendi[s]) * 1000) / 1000]));
}

// Eşyaların değerleri, oyuncunun bölgenin orta seviyesindeki (L) statlarına oranlıdır
// (esyalar.js). Kademe değişince her stat bu formüllerin oranıyla, fiyat da akçe
// kazancıyla orantılı (3 + 2L) ölçeklenir; kuşanma seviyesi kademenin alt seviyesidir.
const STAT_FORMULU = {
  guc: (L) => 12 + 3 * L,
  savunma: (L) => 10 + 2.5 * L,
  can: (L) => 110 + 15 * L,
  nefes: (L) => 40 + 5 * L,
  ceviklik: (L) => 8 + 1.5 * L,
};
const ortaSeviye = (b) => (b.seviye[0] + b.seviye[1]) / 2;

function esyaOlcekle(esya, kademeBolgesi) {
  const kendi = bolgeHaritasi.get(esya.bolge);
  const hedef = bolgeHaritasi.get(kademeBolgesi);
  if (!kendi || kendi === hedef) return esya;
  const Lk = ortaSeviye(kendi);
  const Lh = ortaSeviye(hedef);
  const statlar = Object.fromEntries(Object.entries(esya.statlar).map(([s, v]) => {
    const f = STAT_FORMULU[s];
    return [s, f ? Math.max(1, Math.round((v * f(Lh)) / f(Lk))) : v];
  }));
  const fiyat = Math.max(5, Math.round(((esya.fiyat * (3 + 2 * Lh)) / (3 + 2 * Lk)) / 5) * 5);
  return { ...esya, statlar, fiyat, seviye: hedef.seviye[0] };
}

// ── Rota bilgisi ─────────────────────────────────────────

const bilgiOnbellegi = new Map();
const rotaAnahtari = (rota) => `${rota.bolgeler.join(',')}@${rota.baslangic}`;
let son = { rota: null, bilgi: null }; // en son sorulan rota (sık çağrılar için)

// Rotadan türetilen bütün değerler (önbelleğe alınır).
export function rotaBilgisi(rota = aktif) {
  if (rota === son.rota) return son.bilgi;
  const bilgi = rotaBilgisiHesapla(rota);
  son = { rota, bilgi };
  return bilgi;
}

function rotaBilgisiHesapla(rota) {
  const anahtar = rotaAnahtari(rota);
  const onbellek = bilgiOnbellegi.get(anahtar);
  if (onbellek) return onbellek;
  const sira = Object.fromEntries(rota.bolgeler.map((a, k) => [a, k]));
  const kademeBolgesi = Object.fromEntries(rota.bolgeler.map((a, k) => [a, KLASIK_SIRA[k].anahtar]));
  const girisler = girisleriBul(rota);
  const seviyeler = Object.fromEntries(rota.bolgeler.map((a, k) => [a, KADEMELER[k].seviye]));
  const ilSeviyeleri = ilSeviyeleriniHesapla(iller, rota.bolgeler.map((a) => ({ anahtar: a, giris: girisler[a], seviye: seviyeler[a] })));
  const bilgi = {
    rota,
    sira,
    girisler,
    seviyeler,
    ilSeviyeleri,
    yemekCarpanlari: Object.fromEntries(rota.bolgeler.map((a, k) => [a, KADEMELER[k].yemekCarpani])),
    dusmanCarpanlari: Object.fromEntries(Object.keys(dusmanlar).map((d) => {
      const b = dusmanlar[d].bolge;
      return [d, kademeBolgesi[b] ? dusmanCarpani(d, kademeBolgesi[b]) : dusmanlar[d].carpan];
    })),
    esyalar: Object.fromEntries(Object.entries(esyalar).map(([a, e]) => [a, esyaOlcekle(e, kademeBolgesi[e.bolge] ?? e.bolge)])),
  };
  bilgiOnbellegi.set(anahtar, bilgi);
  return bilgi;
}

// ── Etkin rota ───────────────────────────────────────────

let aktif = KLASIK_ROTA;

// Oyun başlatılırken ya da yüklenirken çağrılır. Rotasız (eski) durumlar klasik rotayı kullanır.
export function rotaAyarla(rota) {
  aktif = rota && rotaGecerliMi(rota) ? rota : KLASIK_ROTA;
}
export const aktifRota = () => aktif;

// Durumun rotası (yoksa etkin rota).
export const durumRotasi = (durum) => durum?.rota ?? aktif;

export const klasikMi = (rota = aktif) => rotaAnahtari(rota) === rotaAnahtari(KLASIK_ROTA);

// Bölgenin rotadaki sırası (0'dan başlar).
export const bolgeSirasi = (anahtar, rota = aktif) => rotaBilgisi(rota).sira[anahtar];
// Rotada bu bölgeden sonra açılan bölge (son bölgede null).
export const sonrakiBolge = (anahtar, rota = aktif) => rota.bolgeler[bolgeSirasi(anahtar, rota) + 1] ?? null;
export const ilkBolge = (rota = aktif) => rota.bolgeler[0];
export const sonBolge = (rota = aktif) => rota.bolgeler[rota.bolgeler.length - 1];
export const bolgeGirisi = (anahtar, rota = aktif) => rotaBilgisi(rota).girisler[anahtar];
export const bolgeSeviyesi = (anahtar, rota = aktif) => rotaBilgisi(rota).seviyeler[anahtar];
export const ilSeviyesi = (plaka, rota = aktif) => rotaBilgisi(rota).ilSeviyeleri[plaka];
export const yemekCarpani = (bolgeAnahtari, rota = aktif) => rotaBilgisi(rota).yemekCarpanlari[bolgeAnahtari];
export const dusmanCarpanlari = (anahtar, rota = aktif) => rotaBilgisi(rota).dusmanCarpanlari[anahtar] ?? dusmanlar[anahtar].carpan;
// Eşyanın rotaya göre değerleri (statlar, fiyat, seviye); diğer alanlar veridekiyle aynıdır.
export const esyaBilgisi = (anahtar, rota = aktif) => rotaBilgisi(rota).esyalar[anahtar] ?? esyalar[anahtar];
