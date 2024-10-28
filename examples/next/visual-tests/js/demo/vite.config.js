import { defineConfig } from 'vite';
import copy from 'rollup-plugin-copy';

export default defineConfig({
  base: './', // Ensure the base path is set correctly
  build: {
    outDir: 'dist',
    assetsDir: 'assets', // Ensure assets are placed in the assets directory
    rollupOptions: {
      plugins: [
        copy({
          targets: [
            { src: 'src/styles/*.css', dest: 'dist/assets' }
          ],
          hook: 'writeBundle' // Ensure the copy happens after the bundle is written
        })
      ]
    }
  }
});