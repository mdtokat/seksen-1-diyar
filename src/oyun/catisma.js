// Haritada gerçek zamanlı çatışma: kim, ne zaman, kime vurur. Saf oyun mantığı — DOM'a dokunmaz.
//
// Savaş ayrı bir ekranda değil, il haritasında geçer. Gezinti tık tık ilerler (oyuncu her
// tıkta bir karo yürür, düşmanlar da her tıkta hızları kadar):
//  - Oyuncu durduğu tıkta, vuruş beklemesi dolmuşsa hedefine vurur. Hedef, seçtiği (dokunduğu)
//    düşmandır; seçili hedef menzilinde değilse ona saldıran en yakın düşman. Menzil sınıfa ve
//    yeteneğe göredir (siniflar.js): Akıncı yakından (bitişik karo), Alperen iki karo öteden,
//    Kemankeş beş karo öteden vurur. Arada ağaç, kaya ya da ev varsa görüş kapanır
//    (gezinti.js → menzildeMi). Yürüyen oyuncu vuramaz; düşmandan uzaklaşmak kaçmaktır.
//  - Oyuncuya saldıran düşmanlar (peşindekiler, kızdırılanlar ve ininde bekleyen bosslar)
//    oyuncu kendi menzillerine girince beklemeleri doldukça vurur; menzile yeni giren düşman
//    önce kısa bir an hazırlanır. Meydanda ve dokunulmazken kimse vurmaz.
//  - Savaştan uzaklaşan düşmanlar toparlanır.
// Gezinti kaydındaki düşmanların çatışma alanları: bekleme (vuruşa kalan tık), kizgin
// (oyuncu ona vurdu), vurdu (oyuncuya en az bir kez isabet ettirdi).
import { dusmanMenzili, oyuncuHamlesi, dusmanHamlesi, dusmanToparlan, TOPLU_HASAR_CARPANI, EN_COK_SALDIRGAN } from './savas.js';
import { menzildeMi, meydandaMi, mesafe, yolBul } from './gezinti.js';

// Tık cinsinden: iki vuruş arası (oyuncu ve düşman) ve menzile yeni giren düşmanın hazırlığı.
export const BEKLEME = { oyuncu: 5, dusman: 6, hazirlik: 2 };
// Peşinde olmadığı oyuncudan bu kadar karo uzaktaki yaralı düşman toparlanır.
export const TOPARLANMA_UZAKLIGI = 9;

// Oyuncuya saldıran düşman mı?
export const saldirganMi = (d) => Boolean(d.sabit || d.kovaliyor || d.kizgin);

// Düşman şu an oyuncuya vurabilir mi (saldırgan, oyuncu menzilinde ve görüşünde)?
export function vurabilirMi(harita, d, oyuncu) {
  return saldirganMi(d) && menzildeMi(harita, d, oyuncu, dusmanMenzili(d.dusman));
}

// Oyuncunun `menzil` erimiyle vurabileceği düşman kaydı: seçili hedef (hedefId) menzilde ve
// görüşteyse o; değilse oyuncuya saldıran, menzildeki en yakın düşman. Meydandan vurulmaz.
// `vurulamaz(d)`: hedef alınamayacak düşmanlar (ör. mühürlü boss). Bulunamazsa null.
export function hedefBul(harita, oyuncu, dusmanlar, { menzil, hedefId = null, vurulamaz = () => false }) {
  if (menzil == null || meydandaMi(harita, oyuncu)) return null;
  const uygun = (d) => !vurulamaz(d) && menzildeMi(harita, oyuncu, d, menzil);
  const secili = dusmanlar.find((d) => d.id === hedefId);
  if (secili && uygun(secili)) return secili;
  return dusmanlar
    .filter((d) => saldirganMi(d) && uygun(d))
    .sort((a, b) => mesafe(a, oyuncu) - mesafe(b, oyuncu))[0] ?? null;
}

// Oyuncunun haritadaki hamlesi (savas.js → oyuncuHamlesi). Vurulan düşman kızar ve peşe düşer;
// düşen düşman haritadan kalkar. Yapılamayan hamlede olay listesi boştur.
// Sonuç: { durum, dusmanlar, etkiler, olaylar, dusen (yenilen düşmanın kaydı ya da null) }.
export function oyuncuVurur(durum, dusmanlar, eylem, rng, { hedef = null, etkiler = [] } = {}) {
  const r = oyuncuHamlesi(durum, eylem, rng, { hedef: hedef?.dusman ?? null, etkiler });
  const sonuc = { durum: r.durum, dusmanlar, etkiler: r.etkiler, olaylar: r.olaylar, dusen: null };
  // Iskalasa da (düşman sıyrılsa da) vurulmaya kalkılan düşman kızar
  if (!hedef || !r.olaylar.some((o) => o.hasar !== undefined)) return sonuc;
  const guncel = { ...hedef, dusman: r.hedef, kizgin: true, kovaliyor: !hedef.sabit };
  if (r.hedef.can <= 0) return { ...sonuc, dusmanlar: dusmanlar.filter((d) => d.id !== hedef.id), dusen: guncel };
  return { ...sonuc, dusmanlar: dusmanlar.map((d) => (d.id === hedef.id ? guncel : d)) };
}

// Düşmanların vuruşları (her tıkta bir kez): beklemesi dolan ve oyuncuyu menzilinde gören
// her saldırgan düşman vurur. Kalabalıkta herkes tam vuramaz: vuruş gücü, o tıkta oyuncuya
// vurabilen düşman sayısına göre azalır (TOPLU_HASAR_CARPANI). Oyuncu bayılınca kalanlar vurmaz.
// `guvende`: oyuncu meydanda ya da dokunulmaz; `vurmaz(d)`: vuramayan düşmanlar (mühürlü boss).
// Sonuç: { durum, dusmanlar, etkiler, olaylar ([{ id, olay }]), bayildi }.
export function dusmanlarVurur(harita, durum, dusmanlar, oyuncu, rng, { etkiler = [], guvende = false, vurmaz = () => false } = {}) {
  const sonuc = dusmanlar.map((d) => ({ ...d }));
  const vurabilenler = new Set(guvende ? [] : sonuc.filter((d) => !vurmaz(d) && vurabilirMi(harita, d, oyuncu)));
  const hasarCarpani = TOPLU_HASAR_CARPANI[Math.min(vurabilenler.size, EN_COK_SALDIRGAN)] ?? 1;
  let yeniDurum = durum;
  let yeniEtkiler = etkiler;
  const olaylar = [];
  for (const d of sonuc) {
    if (!vurabilenler.has(d)) {
      d.bekleme = Math.max((d.bekleme ?? 0) - 1, BEKLEME.hazirlik);
      continue;
    }
    d.bekleme = (d.bekleme ?? BEKLEME.hazirlik) - 1;
    if (d.bekleme > 0 || yeniDurum.oyuncu.can <= 0) continue;
    d.bekleme = BEKLEME.dusman;
    const r = dusmanHamlesi(yeniDurum, d.dusman, rng, { etkiler: yeniEtkiler, hasarCarpani });
    yeniDurum = r.durum;
    yeniEtkiler = r.etkiler;
    if (r.olay.hasar > 0) d.vurdu = true;
    olaylar.push({ id: d.id, olay: r.olay });
  }
  return { durum: yeniDurum, dusmanlar: sonuc, etkiler: yeniEtkiler, olaylar, bayildi: olaylar.length > 0 && yeniDurum.oyuncu.can <= 0 };
}

// Savaştan uzak düşmanlar toparlanır: oyuncunun peşinde olmayan ve ondan TOPARLANMA_UZAKLIGI'ndan
// uzaktaki yaralı düşmanın (ininde bekleyen boss dahil) canı dolar, evre güçlenmesi söner.
export function dusmanlariToparla(dusmanlar, oyuncu) {
  let degisti = false;
  const sonuc = dusmanlar.map((d) => {
    if (d.kovaliyor || mesafe(d, oyuncu) <= TOPARLANMA_UZAKLIGI) return d;
    const t = dusmanToparlan(d.dusman);
    if (t === d.dusman) return d;
    degisti = true;
    return { ...d, dusman: t, kizgin: false, vurdu: false };
  });
  return degisti ? sonuc : dusmanlar;
}

// Atılma (Akın Hamlesi): yiğidin hedefin yanına atılacağı karo. Hedefe en kısa yolun son
// karosu, en çok `menzil` adım ötede; `engeller` (diğer düşmanlar, tüccar) geçilmez. Yoksa null.
export function atilmaYeri(harita, oyuncu, hedef, menzil, engeller = []) {
  const yol = yolBul(harita, oyuncu, hedef, { engeller: [hedef, ...engeller] });
  if (!yol || yol.length === 0 || yol.length > menzil) return null;
  return yol.at(-1);
}
