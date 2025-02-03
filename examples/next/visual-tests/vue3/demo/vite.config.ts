import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        { src: '../node_modules/handsontable/dist/*.css', dest: 'assets/handsontable/dist' },
        { src: '../node_modules/handsontable/styles/*.css', dest: 'assets/handsontable/styles' },
      ]
    }),
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
