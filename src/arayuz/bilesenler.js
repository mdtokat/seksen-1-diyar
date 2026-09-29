// Ortak arayüz bileşenleri: şablon metin, ilerleme çubuğu, bildirim.

// '{ad}' yer tutucularını verilen değerlerle doldurur.
export function sablon(metin, degerler = {}) {
  return metin.replace(/\{(\w+)\}/g, (tamami, anahtar) =>
    anahtar in degerler ? String(degerler[anahtar]) : tamami,
  );
}

// HTML içine güvenle yazılacak metin.
export function kacis(metin) {
  return String(metin)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Yüzde gösteren yatay çubuk (HTML metni döndürür).
export function ilerlemeCubugu(yuzde, { etiket = '', renk = 'var(--turkuaz)' } = {}) {
  const deger = Math.max(0, Math.min(100, Math.round(yuzde)));
  return `
    <div class="cubuk" role="progressbar" aria-valuemin="0" aria-valuemax="100"
         aria-valuenow="${deger}" aria-label="${kacis(etiket)}">
      <div class="cubuk-dolgu" style="width:${deger}%;background:${renk}"></div>
      <span class="cubuk-metin">%${deger}</span>
    </div>`;
}

// Ekranın altında kısa süre görünen bildirim.
export function bildirimGoster(kap, metin, { tur = 'bilgi', sure = 2800 } = {}) {
  let alan = kap.querySelector('.bildirim-alani');
  if (!alan) {
    alan = document.createElement('div');
    alan.className = 'bildirim-alani';
    alan.setAttribute('role', 'status');
    alan.setAttribute('aria-live', 'polite');
    kap.appendChild(alan);
  }
  const bildirim = document.createElement('div');
  bildirim.className = `bildirim bildirim-${tur}`;
  bildirim.textContent = metin;
  alan.appendChild(bildirim);
  setTimeout(() => bildirim.classList.add('kayboluyor'), sure);
  setTimeout(() => bildirim.remove(), sure + 400);
}
