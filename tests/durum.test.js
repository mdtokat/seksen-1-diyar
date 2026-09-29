import { describe, it, expect, vi } from 'vitest';
import { durumDeposu, yeniOyunDurumu } from '../src/oyun/durum.js';

describe('durum deposu', () => {
  it('durumu tutar ve değişince aboneleri çağırır', () => {
    const depo = durumDeposu(yeniOyunDurumu());
    const abone = vi.fn();
    depo.abone(abone);
    const yeni = { ...depo.al(), konum: 41 };
    depo.ayarla(yeni);
    expect(depo.al()).toBe(yeni);
    expect(abone).toHaveBeenCalledWith(yeni);
  });

  it('aynı durum verilince aboneleri çağırmaz', () => {
    const depo = durumDeposu(yeniOyunDurumu());
    const abone = vi.fn();
    depo.abone(abone);
    depo.ayarla(depo.al());
    expect(abone).not.toHaveBeenCalled();
  });

  it('abonelikten çıkılabilir', () => {
    const depo = durumDeposu(yeniOyunDurumu());
    const abone = vi.fn();
    const cik = depo.abone(abone);
    cik();
    depo.ayarla({ ...depo.al(), konum: 41 });
    expect(abone).not.toHaveBeenCalled();
  });
});
