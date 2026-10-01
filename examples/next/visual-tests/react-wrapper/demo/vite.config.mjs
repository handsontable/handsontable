import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  preview: {
    port: 8082,
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});
