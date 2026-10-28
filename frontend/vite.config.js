
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Conecta el frontend con el backend.
  server: {
    proxy: {
      '/guess': 'http://localhost:3000',
      '/reset': 'http://localhost:3000',
      '/api': 'http://localhost:3000'
    }
  }
});
