import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration to handle JSX properly
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',  // Telling esbuild to treat .js and .jsx files as JSX
  },
});
