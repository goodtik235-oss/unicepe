
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This allows process.env.API_KEY to be used in the browser code.
    // Netlify will inject the API_KEY into the build environment.
    'process.env': {
      ...process.env,
      API_KEY: process.env.API_KEY
    }
  }
});
