
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables from the current directory.
  // The third argument '' tells Vite to load all env vars, not just those starting with VITE_
  // This allows us to pick up 'API_KEY' set in the Netlify UI.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // We manually define process.env.API_KEY to ensure it is embedded
      // into the code during the 'npm run build' process on Netlify.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
    }
  };
});
