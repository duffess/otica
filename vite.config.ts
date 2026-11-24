import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5190, host: true },
  // three + fiber + drei ficam num pedaço separado, carregado depois da tela de abertura.
  build: { chunkSizeWarningLimit: 1600 },
});
