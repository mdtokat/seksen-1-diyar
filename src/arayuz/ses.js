// Ses efektleri (plan.md Faz 10): Web Audio API ile anında sentezlenir, dosya yoktur.
// Tınılar sade tutulur; ezgili olanlar Hicaz makamının ilk seslerinden (Re, Mi♭, Fa♯,
// Sol, La) kurulur ve mızrap vuruşunu andıran hızlı sönümlü tellerle çalınır.
// Ses açma/kapama tercihi cihazda saklanır. Tarayıcı sesi desteklemiyor ya da
// henüz izin vermiyorsa (kullanıcı etkileşimi yoksa) hiçbir şey çalmaz, oyun sürer.

const TERCIH = 'seksen-bir-diyar/ses';
const HICAZ = { re: 293.66, mib: 311.13, fad: 369.99, sol: 392.0, la: 440.0, re2: 587.33 };

let baglam = null;
let acik = null;

export function sesAcikMi() {
  if (acik === null) {
    try {
      acik = localStorage.getItem(TERCIH) !== '0';
    } catch {
      acik = true;
    }
  }
  return acik;
}

export function sesAyarla(deger) {
  acik = Boolean(deger);
  try {
    localStorage.setItem(TERCIH, acik ? '1' : '0');
  } catch {
    // tercih kaydedilemese de bu oturumda geçerli olur
  }
  if (acik) sesCal('tik');
}

function baglamAl() {
  if (baglam) return baglam;
  const Baglam = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!Baglam) return null;
  baglam = new Baglam();
  return baglam;
}

// Tek bir tel sesi: hızlı çıkış, üstel sönüm, hafif filtre.
function tel(c, frekans, bas, { sure = 0.35, guc = 0.18, dalga = 'triangle', filtre = 2400 } = {}) {
  const osc = c.createOscillator();
  const kazanc = c.createGain();
  const suzgec = c.createBiquadFilter();
  osc.type = dalga;
  osc.frequency.setValueAtTime(frekans, bas);
  suzgec.type = 'lowpass';
  suzgec.frequency.setValueAtTime(filtre, bas);
  kazanc.gain.setValueAtTime(0.0001, bas);
  kazanc.gain.exponentialRampToValueAtTime(guc, bas + 0.008);
  kazanc.gain.exponentialRampToValueAtTime(0.0001, bas + sure);
  osc.connect(suzgec).connect(kazanc).connect(c.destination);
  osc.start(bas);
  osc.stop(bas + sure + 0.02);
}

// Kısa gürültü patlaması (vuruş sesi).
function gurultu(c, bas, { sure = 0.12, guc = 0.25, frekans = 900 } = {}) {
  const uzunluk = Math.floor(c.sampleRate * sure);
  const tampon = c.createBuffer(1, uzunluk, c.sampleRate);
  const veri = tampon.getChannelData(0);
  for (let i = 0; i < uzunluk; i++) veri[i] = (Math.random() * 2 - 1) * (1 - i / uzunluk) ** 2;
  const kaynak = c.createBufferSource();
  const suzgec = c.createBiquadFilter();
  const kazanc = c.createGain();
  kaynak.buffer = tampon;
  suzgec.type = 'bandpass';
  suzgec.frequency.setValueAtTime(frekans, bas);
  kazanc.gain.setValueAtTime(guc, bas);
  kaynak.connect(suzgec).connect(kazanc).connect(c.destination);
  kaynak.start(bas);
}

// Kalın, kısa bir vuruş gümbürtüsü.
function gum(c, bas, { frekans = 120, sure = 0.18, guc = 0.35 } = {}) {
  const osc = c.createOscillator();
  const kazanc = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frekans, bas);
  osc.frequency.exponentialRampToValueAtTime(frekans * 0.45, bas + sure);
  kazanc.gain.setValueAtTime(guc, bas);
  kazanc.gain.exponentialRampToValueAtTime(0.0001, bas + sure);
  osc.connect(kazanc).connect(c.destination);
  osc.start(bas);
  osc.stop(bas + sure + 0.02);
}

// Notaları sırayla çalar: [frekans, başlangıç (sn)].
function ezgi(c, bas, notalar, secenek) {
  for (const [f, t] of notalar) tel(c, f, bas + t, secenek);
}

const SESLER = {
  tik: (c, t) => tel(c, HICAZ.la, t, { sure: 0.08, guc: 0.08 }),
  vurus: (c, t) => { gurultu(c, t); gum(c, t); },
  dusmanVurusu: (c, t) => { gurultu(c, t, { frekans: 500, guc: 0.2 }); gum(c, t, { frekans: 90 }); },
  kritik: (c, t) => { gurultu(c, t, { frekans: 1600, guc: 0.3 }); gum(c, t, { frekans: 160, guc: 0.4 }); tel(c, HICAZ.re2, t + 0.02, { sure: 0.25, guc: 0.1, dalga: 'square', filtre: 3000 }); },
  siyrilma: (c, t) => tel(c, 700, t, { sure: 0.12, guc: 0.06, dalga: 'sine' }),
  // Uzaktan vuruş: yay kirişinin ya da ışığın kısa sesi
  atis: (c, t) => { tel(c, HICAZ.re2, t, { sure: 0.08, guc: 0.07, dalga: 'triangle', filtre: 1800 }); tel(c, HICAZ.la, t + 0.03, { sure: 0.1, guc: 0.04, dalga: 'sine' }); },
  yemek: (c, t) => ezgi(c, t, [[HICAZ.sol, 0], [HICAZ.re2, 0.09]], { sure: 0.22, guc: 0.1, dalga: 'sine' }),
  yetenek: (c, t) => ezgi(c, t, [[HICAZ.fad, 0], [HICAZ.la, 0.06]], { sure: 0.25, guc: 0.1 }),
  seviye: (c, t) => ezgi(c, t, [[HICAZ.re, 0], [HICAZ.mib, 0.09], [HICAZ.fad, 0.18], [HICAZ.sol, 0.27], [HICAZ.la, 0.36], [HICAZ.re2, 0.5]], { sure: 0.5, guc: 0.14 }),
  zafer: (c, t) => ezgi(c, t, [[HICAZ.la, 0], [HICAZ.sol, 0.12], [HICAZ.fad, 0.24], [HICAZ.sol, 0.36], [HICAZ.la, 0.52]], { sure: 0.45, guc: 0.13 }),
  yenilgi: (c, t) => ezgi(c, t, [[HICAZ.fad, 0], [HICAZ.mib, 0.2], [HICAZ.re, 0.42]], { sure: 0.6, guc: 0.1, dalga: 'sine', filtre: 1200 }),
  basarim: (c, t) => ezgi(c, t, [[HICAZ.re2, 0], [HICAZ.la, 0.1], [HICAZ.re2, 0.2]], { sure: 0.4, guc: 0.1, dalga: 'sine' }),
  evre: (c, t) => { gum(c, t, { frekans: 70, sure: 0.5, guc: 0.4 }); tel(c, HICAZ.mib / 2, t, { sure: 0.7, guc: 0.12, dalga: 'sawtooth', filtre: 700 }); },
};

export const SES_ADLARI = Object.keys(SESLER);

// Adı verilen efekti çalar. Ses kapalıysa ya da desteklenmiyorsa sessizce geçer.
export function sesCal(ad) {
  if (!sesAcikMi() || !SESLER[ad]) return;
  try {
    const c = baglamAl();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    SESLER[ad](c, c.currentTime + 0.01);
  } catch {
    // ses çalınamazsa oyun etkilenmez
  }
}
