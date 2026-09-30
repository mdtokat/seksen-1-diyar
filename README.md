# Seksen Bir Diyar

Türkiye'nin 81 ilinde geçen, tarayıcıda oynanan, sıra tabanlı bir RPG. Oyuncu, genç yiğit **Alp** olarak illeri gezer, zalim sihirbaz **Zülmet**'in saldığı cinleri ve ifritleri yener, seviye atlar ve yurdu kötülükten arındırır. Her ilin yöresel yemeği, can ve nefes yenileyen birer azıktır.

Oyuncu karakterini kuşbakışı il haritalarında yürütür (dokunarak, ekran yön tuşlarıyla ya da ok tuşları/WASD ile), haritada dolaşan düşmanlarla karşılaşınca sıra tabanlı savaşa girer ve il sınırlarındaki yollardan komşu illere geçer.

Geliştirme planı, kurallar ve faz takibi için: [plan.md](plan.md)

## Gereksinimler

- Node.js 20.19+ veya 22.12+
- npm

## Kurulum ve çalıştırma

```bash
npm install      # bağımlılıkları kur
npm run dev      # geliştirme sunucusunu başlat (http://localhost:5173)
npm run test     # testleri çalıştır
npm run build    # yayın paketini dist/ klasörüne derle
npm run preview  # derlenmiş paketi yerelde önizle
```

## Yayın

`main` dalına yapılan her push, GitHub Actions ile test edilip derlenir ve GitHub Pages'e yayınlanır (`.github/workflows/deploy.yml`). Depo ayarlarında **Settings → Pages → Source** değeri **GitHub Actions** olmalıdır.

## Teknoloji

Vite, vanilla JavaScript (ES modülleri), Vitest, SVG ve localStorage.

## Harita verisi ve atıf

İl sınırları © [OpenStreetMap](https://www.openstreetmap.org/copyright) katkıcıları (ODbL) verisinden, [geoBoundaries](https://www.geoboundaries.org) (gbOpen TUR ADM1) aracılığıyla alınmış ve sadeleştirilmiştir (`src/veri/ilSinirlari.js`). Atıf, oyunun haritasında da gösterilir.
