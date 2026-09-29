// Çizimlerin ortak parçaları. Tüm çizimler 120×120'lik bir tuvale göre yapılır;
// zemin çizgisi y ≈ 108'dedir. Dış çizgi rengi lacivert (çini paleti).

export const CIZGI = '#1b2a5c';

// Çizimi SVG kabına sarar. `sinif` CSS sınıfı, `etiket` ekran okuyucu metni.
export function svgSar(icerik, { sinif = 'cizim', etiket = '' } = {}) {
  const erisim = etiket ? `role="img" aria-label="${etiket}"` : 'aria-hidden="true"';
  return `<svg class="${sinif}" viewBox="0 0 120 120" ${erisim}>
    <g stroke="${CIZGI}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${icerik}</g>
  </svg>`;
}

// Figürün altındaki yumuşak gölge.
export const golge = (rx = 32) =>
  `<ellipse cx="60" cy="108" rx="${rx}" ry="5" fill="#000" opacity=".16" stroke="none"/>`;

// Bossların arkasındaki sihir halesi.
export const hale = (renk) => `
  <circle cx="60" cy="58" r="52" fill="${renk}" opacity=".18" stroke="none"/>
  <circle cx="60" cy="58" r="44" fill="none" stroke="${renk}" stroke-width="1.5" stroke-dasharray="3 6" opacity=".7"/>`;

// Yatay aynalama: sağa bakan bir çizimi sola çevirir.
export const aynala = (icerik) => `<g transform="translate(120 0) scale(-1 1)">${icerik}</g>`;
