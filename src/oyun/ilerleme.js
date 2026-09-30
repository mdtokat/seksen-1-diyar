// Bölge ilerlemesi. Saf oyun mantığı — DOM'a dokunmaz.
import { iller as ilVerisi } from '../veri/iller.js';
import { bolgeler as bolgeVerisi, final } from '../veri/bolgeler.js';
import { tamIyilestir } from './karakter.js';

// Bölge içinde, giriş ilinden başlayarak yalnızca aynı bölgedeki komşular
// üzerinden BFS ile her ilin mesafesini hesaplar. Sonuç: { plaka: mesafe }.
export function bolgeIciMesafeler(iller, bolge) {
  const bolgeIlleri = new Map(
    iller.filter((il) => il.bolge === bolge.anahtar).map((il) => [il.plaka, il]),
  );
  const mesafe = { [bolge.giris]: 0 };
  const kuyruk = [bolge.giris];
  while (kuyruk.length > 0) {
    const plaka = kuyruk.shift();
    for (const komsu of bolgeIlleri.get(plaka).komsular) {
      if (bolgeIlleri.has(komsu) && !(komsu in mesafe)) {
        mesafe[komsu] = mesafe[plaka] + 1;
        kuyruk.push(komsu);
      }
    }
  }
  return mesafe;
}

// Her ilin düşman seviye aralığını hesaplar (plan.md Bölüm 4).
// Giriş iline yakın iller düşük, uzak iller yüksek seviyeli olur; mesafe
// kademeleri bölgenin seviye aralığını eşit parçalara bölerek kaplar.
// Sonuç: { plaka: [enAz, enCok] }.
export function ilSeviyeleriniHesapla(iller, bolgeler) {
  const sonuc = {};
  for (const bolge of bolgeler) {
    const mesafeler = bolgeIciMesafeler(iller, bolge);
    const enUzak = Math.max(...Object.values(mesafeler));
    const [altSinir, ustSinir] = bolge.seviye;
    const kademe = (ustSinir - altSinir) / (enUzak + 1);
    for (const [plaka, d] of Object.entries(mesafeler)) {
      sonuc[plaka] = [
        altSinir + Math.round(d * kademe),
        altSinir + Math.round((d + 1) * kademe),
      ];
    }
  }
  return sonuc;
}

// ── Bölge kilitleri ve seyahat ───────────────────────────

const ilHaritasi = new Map(ilVerisi.map((il) => [il.plaka, il]));

export function bolgeAcikMi(durum, bolgeAnahtari) {
  return durum.acikBolgeler.includes(bolgeAnahtari);
}

export function arinmaYuzdesi(durum, plaka) {
  return durum.arinma[plaka] ?? 0;
}

// Haritadaki görünüm durumu: 'kilitli' | 'acik' | 'arinmis'.
export function ilDurumu(durum, plaka) {
  if (!bolgeAcikMi(durum, ilHaritasi.get(plaka).bolge)) return 'kilitli';
  if (arinmaYuzdesi(durum, plaka) >= 100) return 'arinmis';
  return 'acik';
}

// Bulunulan ilden hedef ile gidilebilir mi? Yalnızca açık bölgelerdeki
// komşu illere gidilebilir. Sonuç: { olur: true } ya da { olur: false, neden }.
// neden: 'ayni_il' | 'kilitli_bolge' | 'komsu_degil'
export function seyahatKontrol(durum, hedef) {
  if (hedef === durum.konum) return { olur: false, neden: 'ayni_il' };
  if (!bolgeAcikMi(durum, ilHaritasi.get(hedef).bolge)) return { olur: false, neden: 'kilitli_bolge' };
  if (!ilHaritasi.get(durum.konum).komsular.includes(hedef)) return { olur: false, neden: 'komsu_degil' };
  return { olur: true };
}

// Seyahat edilebiliyorsa yeni durumu, edilemiyorsa aynı durumu döndürür.
export function seyahatEt(durum, hedef) {
  if (!seyahatKontrol(durum, hedef).olur) return durum;
  return { ...durum, konum: hedef };
}

// ── Bosslar ve bölge ilerlemesi (plan.md Faz 7) ─────────

export const BOSS_ARINMA_ESIGI = 60; // bölge illerinin ortalama arınması (%)
export const MINI_BOSS_ARINMA_ESIGI = 50; // mini boss, il arınması bunu geçince çıkar
export const SOFRA = { savas: 10, gucBonusu: 0.1 };

const bolgeHaritasi = new Map(bolgeVerisi.map((b) => [b.anahtar, b]));

// Bölge illerinin ortalama arınması (yuvarlanmamış).
export function bolgeArinmaOrtalamasi(durum, bolgeAnahtari) {
  const bolgeIlleri = ilVerisi.filter((il) => il.bolge === bolgeAnahtari);
  const toplam = bolgeIlleri.reduce((t, il) => t + arinmaYuzdesi(durum, il.plaka), 0);
  return toplam / bolgeIlleri.length;
}

// Boss mührünün çözülme koşulları ve güncel değerler.
export function bossKosullari(durum, bolgeAnahtari) {
  const bolge = bolgeHaritasi.get(bolgeAnahtari);
  const ortalama = bolgeArinmaOrtalamasi(durum, bolgeAnahtari);
  const seviye = durum.oyuncu?.seviye ?? 0;
  const gerekenSeviye = bolge.seviye[1] - 1;
  return {
    arinma: Math.floor(ortalama), // ekranda gösterilen değer
    gerekenArinma: BOSS_ARINMA_ESIGI,
    seviye,
    gerekenSeviye,
    olur: ortalama >= BOSS_ARINMA_ESIGI && seviye >= gerekenSeviye,
  };
}

// 'kilitli_bolge' | 'muhurlu' | 'acik' | 'yenildi'
export function bossDurumu(durum, bolgeAnahtari) {
  if ((durum.yenilenBosslar ?? []).includes(bolgeAnahtari)) return 'yenildi';
  if (!bolgeAcikMi(durum, bolgeAnahtari)) return 'kilitli_bolge';
  return bossKosullari(durum, bolgeAnahtari).olur ? 'acik' : 'muhurlu';
}

// Mührü çözülmüş, henüz yenilmemiş bossların bölgeleri.
export function acikBosslar(durum) {
  return bolgeVerisi.filter((b) => bossDurumu(durum, b.anahtar) === 'acik').map((b) => b.anahtar);
}

// Önceki durumda kapalı olup yeni durumda açılan bosslar (bildirim için).
export function yeniAcilanBosslar(onceki, sonraki) {
  const once = new Set(acikBosslar(onceki));
  return acikBosslar(sonraki).filter((b) => !once.has(b));
}

// Bölge bossu yenilince: boss yenilmiş sayılır, sıradaki bölge açılır ve zafer
// sofrası kurulur (can ve nefes dolar, SOFRA.savas savaş boyunca güç bonusu).
// Sonuç: { durum, acilanBolge } — acilanBolge son bölgede null'dır.
export function bossYenildi(durum, bolgeAnahtari) {
  const bolge = bolgeHaritasi.get(bolgeAnahtari);
  const sonraki = bolgeVerisi.find((b) => b.sira === bolge.sira + 1) ?? null;
  const acikBolgeler = sonraki && !durum.acikBolgeler.includes(sonraki.anahtar)
    ? [...durum.acikBolgeler, sonraki.anahtar]
    : durum.acikBolgeler;
  return {
    durum: {
      ...durum,
      acikBolgeler,
      yenilenBosslar: [...new Set([...(durum.yenilenBosslar ?? []), bolgeAnahtari])],
      sofra: { bolge: bolgeAnahtari, kalan: SOFRA.savas },
      oyuncu: tamIyilestir(durum.oyuncu),
    },
    acilanBolge: sonraki?.anahtar ?? null,
  };
}

// Zafer sofrasının savaştaki güç çarpanı.
export function sofraGucCarpani(durum) {
  return durum.sofra?.kalan > 0 ? 1 + SOFRA.gucBonusu : 1;
}

// Biten her savaş sofranın süresinden bir savaş düşer.
export function sofraTuket(durum) {
  if (!durum.sofra) return durum;
  const kalan = durum.sofra.kalan - 1;
  return { ...durum, sofra: kalan > 0 ? { ...durum.sofra, kalan } : null };
}

// Bu ilde mini boss beklenir mi? (ilin arınması eşiği geçmiş ve henüz yenilmemiş)
export function miniBossVarMi(durum, plaka) {
  const il = ilHaritasi.get(plaka);
  const bolge = bolgeHaritasi.get(il.bolge);
  return bolge.miniBossIlleri.includes(plaka)
    && arinmaYuzdesi(durum, plaka) > MINI_BOSS_ARINMA_ESIGI
    && !(durum.yenilenMiniBosslar ?? []).includes(plaka);
}

// ── Final: Ağrı Dağı'ndaki kale (plan.md Faz 10) ─────────

// Kalenin mührünün çözülme koşulları: önkoşul bölgenin (Doğu Anadolu) bossu
// yenilmiş ve oyuncu en az final seviyesinde olmalı.
export function finalKosullari(durum) {
  const onkosulBossu = (durum.yenilenBosslar ?? []).includes(final.onkosulBolge);
  const seviye = durum.oyuncu?.seviye ?? 0;
  return { onkosulBossu, seviye, gerekenSeviye: final.seviye, olur: onkosulBossu && seviye >= final.seviye };
}

// 'kilitli_bolge' | 'muhurlu' | 'acik' | 'yenildi'
export function finalDurumu(durum) {
  if (durum.zulmetYenildi) return 'yenildi';
  if (!bolgeAcikMi(durum, ilHaritasi.get(final.il).bolge)) return 'kilitli_bolge';
  return finalKosullari(durum).olur ? 'acik' : 'muhurlu';
}

// Zülmet yenilince: oyun bitmiş sayılır, can ve nefes dolar. Oyuncu kalan illeri
// arındırmaya devam edebilir.
export function zulmetYenildi(durum) {
  return { ...durum, zulmetYenildi: true, oyuncu: tamIyilestir(durum.oyuncu) };
}
