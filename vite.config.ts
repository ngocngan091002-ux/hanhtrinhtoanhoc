import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://zljjgjtyzbucjjmcvxhf.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsampnanR5emJ1Y2pqbWN2eGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNTY4NjIsImV4cCI6MjEwMTgzMjg2Mn0.IJdIt9Hfsutz7x8OAEH96VUqUvgwv5z8nQRxj52Al2c'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
});
