// Bölge ilerlemesi. Saf oyun mantığı — DOM'a dokunmaz.

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
