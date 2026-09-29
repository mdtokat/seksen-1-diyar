import { defineConfig } from 'vite';

// GitHub Pages, projeyi https://<kullanici>.github.io/seksen-1-diyar/ altında yayınlar.
// Geliştirme sunucusunda kök dizin kullanılır.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/seksen-1-diyar/' : '/',
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
  },
}));
