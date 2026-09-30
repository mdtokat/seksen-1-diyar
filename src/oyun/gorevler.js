// Görevler (plan.md Faz 9): alma, ilerleme, tamamlama ve ödül.
// Saf oyun mantığı — DOM'a dokunmaz.
//
// Oyun durumunda `gorevler`: { anahtar: { durum: 'aktif', sayac } | { durum: 'tamam' } }.
// Alınmamış görevlerin kaydı yoktur. `sayac` yalnızca 'yen' görevlerinde anlamlıdır.
import { gorevler } from '../veri/gorevler.js';
import { iller } from '../veri/iller.js';
import { HAYIR } from '../veri/itibar.js';
import { bolgeAcikMi, arinmaYuzdesi } from './ilerleme.js';
import { yemekEkle, yemekAdedi, yemekCikar } from './envanter.js';
import { xpEkle } from './karakter.js';
import { hayirEkle, hediyeKontrol } from './itibar.js';

// Ödül: veren ilin üst seviyesindeki sıradan bir düşmanın XP'si ve akçesi, bu çarpanlarla.
export const GOREV_ODUL_CARPANI = { xp: 4, akce: 5 };

const ilHaritasi = new Map(iller.map((il) => [il.plaka, il]));
const ANAHTARLAR = Object.keys(gorevler);

function kayit(durum, anahtar) {
  return durum.gorevler?.[anahtar] ?? null;
}

function kayitYaz(durum, anahtar, deger) {
  return { ...durum, gorevler: { ...(durum.gorevler ?? {}), [anahtar]: deger } };
}

// Görev nerede tamamlanır: ulaştırma görevleri hedef ilin muhtarına,
// diğerleri görevi verene teslim edilir. Sonuç: { il, veren }.
export function teslimYeri(anahtar) {
  const g = gorevler[anahtar];
  return g.tur === 'ulastir' ? { il: g.hedefIl, veren: 'muhtar' } : { il: g.il, veren: g.veren };
}

// Görevin ilerlemesi: { mevcut, hedef }.
// yen: yenilen düşman sayısı · arindir: ilin arınması · ulastir: heybede yemek var mı (0/1).
export function gorevIlerlemesi(durum, anahtar) {
  const g = gorevler[anahtar];
  switch (g.tur) {
    case 'yen':
      return { mevcut: Math.min(g.sayi, kayit(durum, anahtar)?.sayac ?? 0), hedef: g.sayi };
    case 'arindir':
      return { mevcut: Math.min(g.yuzde, arinmaYuzdesi(durum, g.hedefIl)), hedef: g.yuzde };
    default:
      return { mevcut: Math.min(1, yemekAdedi(durum.heybe, g.yemek)), hedef: 1 };
  }
}

// 'kilitli' (bölgesi açılmadı) | 'alinabilir' | 'aktif' | 'hazir' (teslim edilebilir) | 'tamam'
export function gorevDurumu(durum, anahtar) {
  const k = kayit(durum, anahtar);
  if (k?.durum === 'tamam') return 'tamam';
  if (k?.durum === 'aktif') {
    const { mevcut, hedef } = gorevIlerlemesi(durum, anahtar);
    return mevcut >= hedef ? 'hazir' : 'aktif';
  }
  return bolgeAcikMi(durum, gorevler[anahtar].bolge) ? 'alinabilir' : 'kilitli';
}

// Görevi tamamlayınca kazanılanlar: { xp, akce, hayir }.
export function gorevOdulu(anahtar) {
  const g = gorevler[anahtar];
  const sv = ilHaritasi.get(g.il).seviye[1];
  return {
    xp: Math.round((5 + sv * 10) * GOREV_ODUL_CARPANI.xp),
    akce: Math.round((3 + sv * 2) * GOREV_ODUL_CARPANI.akce),
    hayir: HAYIR.gorev[g.tur],
  };
}

// ── Alma ─────────────────────────────────────────────────

// neden: 'alindi' | 'kilitli_bolge' | 'yanlis_il' | 'heybe_dolu'
export function gorevAlKontrol(durum, anahtar) {
  const g = gorevler[anahtar];
  if (kayit(durum, anahtar)) return { olur: false, neden: 'alindi' };
  if (!bolgeAcikMi(durum, g.bolge)) return { olur: false, neden: 'kilitli_bolge' };
  if (durum.konum !== g.il) return { olur: false, neden: 'yanlis_il' };
  if (g.tur === 'ulastir' && yemekEkle(durum.heybe, g.yemek).eklenen === 0) return { olur: false, neden: 'heybe_dolu' };
  return { olur: true };
}

// Görevi alır. Ulaştırma görevinde götürülecek yemek heybeye konur.
export function gorevAl(durum, anahtar) {
  if (!gorevAlKontrol(durum, anahtar).olur) return durum;
  const g = gorevler[anahtar];
  const yeni = kayitYaz(durum, anahtar, { durum: 'aktif', sayac: 0 });
  return g.tur === 'ulastir' ? { ...yeni, heybe: yemekEkle(yeni.heybe, g.yemek).heybe } : yeni;
}

// ── İlerleme ─────────────────────────────────────────────

// Bir zaferden sonra, yenilen düşman türünü bekleyen aktif görevlerin sayacı artar.
// Sonuç: { durum, ilerleyenler: [anahtar] }.
export function zaferIlerlemesi(durum, dusmanAnahtari) {
  let yeni = durum;
  const ilerleyenler = [];
  for (const anahtar of ANAHTARLAR) {
    const g = gorevler[anahtar];
    const k = kayit(durum, anahtar);
    if (g.tur !== 'yen' || g.dusman !== dusmanAnahtari || k?.durum !== 'aktif' || k.sayac >= g.sayi) continue;
    yeni = kayitYaz(yeni, anahtar, { ...k, sayac: k.sayac + 1 });
    ilerleyenler.push(anahtar);
  }
  return { durum: yeni, ilerleyenler };
}

// Teslim edilebilir durumdaki görevler.
export function hazirGorevler(durum) {
  return ANAHTARLAR.filter((a) => gorevDurumu(durum, a) === 'hazir');
}

// ── Tamamlama ────────────────────────────────────────────

// neden: 'aktif_degil' | 'yanlis_il' | 'hazir_degil'
export function gorevTamamlaKontrol(durum, anahtar) {
  const d = gorevDurumu(durum, anahtar);
  if (d !== 'aktif' && d !== 'hazir') return { olur: false, neden: 'aktif_degil' };
  if (durum.konum !== teslimYeri(anahtar).il) return { olur: false, neden: 'yanlis_il' };
  if (d !== 'hazir') return { olur: false, neden: 'hazir_degil' };
  return { olur: true };
}

// Görevi teslim eder, ödülü verir (seviye atlama dahil). Ulaştırılan yemek heybeden çıkar.
// Sonuç: { durum, odul: { xp, akce, hayir } | null, seviyeler, yeniYetenekler }.
export function gorevTamamla(durum, anahtar) {
  if (!gorevTamamlaKontrol(durum, anahtar).olur) return { durum, odul: null, seviyeler: [], yeniYetenekler: [] };
  const g = gorevler[anahtar];
  const odul = gorevOdulu(anahtar);
  let yeni = kayitYaz(durum, anahtar, { durum: 'tamam' });
  if (g.tur === 'ulastir') yeni = { ...yeni, heybe: yemekCikar(yeni.heybe, g.yemek) };
  const x = xpEkle(yeni.oyuncu, odul.xp);
  yeni = hayirEkle({ ...yeni, akce: (yeni.akce ?? 0) + odul.akce, oyuncu: x.oyuncu }, odul.hayir);
  return { durum: yeni, odul, seviyeler: x.seviyeler, yeniYetenekler: x.yeniYetenekler };
}

// ── Görev verenler ───────────────────────────────────────

// Bir ildeki muhtarın ya da Ahi Babanın verdiği görevler.
export function verenGorevleri(plaka, veren) {
  return ANAHTARLAR.filter((a) => gorevler[a].il === plaka && gorevler[a].veren === veren);
}

// Bu ildeki muhtara teslim edilecek, alınmış ulaştırma görevleri.
export function teslimEdilecekler(durum, plaka) {
  return ANAHTARLAR.filter((a) => {
    const d = gorevDurumu(durum, a);
    return gorevler[a].tur === 'ulastir' && gorevler[a].hedefIl === plaka && (d === 'aktif' || d === 'hazir');
  });
}

// Görev verenin başındaki işaret: 'hazir' (teslim edilecek görev var) | 'yeni'
// (alınabilir görev var) | 'hediye' (muhtarın köylülerden hediyesi var) | null.
export function verenIsareti(durum, plaka, veren) {
  const teslim = ANAHTARLAR.filter((a) => {
    const t = teslimYeri(a);
    return t.il === plaka && t.veren === veren;
  });
  if (teslim.some((a) => gorevDurumu(durum, a) === 'hazir')) return 'hazir';
  if (verenGorevleri(plaka, veren).some((a) => gorevDurumu(durum, a) === 'alinabilir')) return 'yeni';
  if (veren === 'muhtar' && hediyeKontrol(durum, plaka).olur) return 'hediye';
  return null;
}
