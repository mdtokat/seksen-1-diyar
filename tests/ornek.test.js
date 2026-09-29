import { describe, it, expect } from 'vitest';
import { metinler } from '../src/veri/metinler.js';

describe('kurulum', () => {
  it('oyun adı doğru tanımlı', () => {
    expect(metinler.oyunAdi).toBe('Seksen Bir Diyar');
  });

  it('Türkçe karakterler bozulmadan okunuyor', () => {
    expect(metinler.altBaslik).toContain('Zülmet');
    expect('çğıİöşü'.normalize('NFC')).toBe('çğıİöşü');
  });
});
