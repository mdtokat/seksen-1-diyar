// Bölge ilerlemesi. Saf oyun mantığı — DOM'a dokunmaz.
import { iller as ilVerisi } from '../veri/iller.js';

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
