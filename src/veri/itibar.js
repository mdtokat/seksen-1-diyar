// İtibar (Hayır puanı). Yalnızca veri — mantık kodu yok.
// Görevler ve mazluma yardım (bir ili Zülmet'in sihrinden tamamen arındırmak,
// halkı mini bosstan ya da bölge bossundan kurtarmak) Hayır puanı kazandırır
// (plan.md Faz 9). Puan arttıkça oyuncunun unvanı yükselir.

// Kazanılan Hayır puanları.
export const HAYIR = {
  gorev: { yen: 10, arindir: 15, ulastir: 10 },
  ilArindi: 5,
  miniBoss: 5,
  bolgeBossu: 10,
};

// Unvan kademeleri, eşiğe göre artan sırada.
// indirim: arastadaki yemeklere uygulanan indirim oranı.
// hediye: muhtarın köylüler adına her ilde bir kez verdiği yöresel yemek adedi.
export const itibarKademeleri = [
  { esik: 0, ad: 'Yolcu', indirim: 0, hediye: 0 },
  { esik: 25, ad: 'Tanınan Yiğit', indirim: 0.05, hediye: 0 },
  { esik: 75, ad: 'Sevilen Yiğit', indirim: 0.1, hediye: 1 },
  { esik: 175, ad: 'Halkın Yiğidi', indirim: 0.15, hediye: 2 },
  { esik: 350, ad: 'Diyarın Kahramanı', indirim: 0.2, hediye: 3 },
];
