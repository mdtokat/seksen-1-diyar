// Arayüz metinleri tek yerde. Yalnızca veri — mantık kodu yok.
// {ad} biçimindeki yer tutucular arayüzde doldurulur (bilesenler.js → sablon).

export const metinler = {
  oyunAdi: 'Seksen Bir Diyar',
  altBaslik: 'Zülmet\'in sihrine karşı yiğitçe bir yolculuk',
  giris:
    'Zalim sihirbaz Zülmet, yasak sihirle cinleri ve ifritleri Anadolu\'ya saldı. ' +
    'Yollar kesildi, kervanlar yağmalandı. Mazlumu korumak için bir yiğit yola çıkıyor.',
  yolaCik: 'Yola Çık',

  harita: {
    baslikEkrani: 'Başlık ekranına dön',
    konum: 'Bulunduğun il',
    yakinlastir: 'Yakınlaştır',
    uzaklastir: 'Uzaklaştır',
    ortala: 'Bulunduğun ile odaklan',
    tumu: 'Tüm haritayı göster',
    bolge: 'Bölge',
    seviye: 'Düşman seviyesi',
    seviyeDegeri: 'Sv {en_az}–{en_cok}',
    yemek: 'Meşhur yemeği',
    arinma: 'Arınma',
    buradasin: 'Buradasın.',
    git: 'Buraya git',
    kapat: 'Kapat',
    varis: 'Yeni konum: {il}',
    ipucu: 'Bir ile dokunarak bilgilerini gör. Parmağınla kaydır, iki parmakla yakınlaştır.',
    lejant: {
      kilitli: 'Kilitli',
      acik: 'Açık',
      bulunulan: 'Bulunduğun il',
      arinmis: 'Arınmış',
    },
    denizler: {
      karadeniz: 'Karadeniz',
      akdeniz: 'Akdeniz',
      ege: 'Ege Denizi',
      marmara: 'Marmara',
    },
  },

  seyahatEngeli: {
    ayni_il: 'Zaten buradasın.',
    kilitli_bolge: '{bolge} bölgesi henüz kilitli. Yollar Zülmet\'in sihriyle kapalı.',
    komsu_degil: '{hedef}, bulunduğun il {konum} ile komşu değil. Yalnızca komşu illere gidebilirsin.',
  },
};
