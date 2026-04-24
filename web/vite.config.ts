import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL ?? 'https://srv1023256.hstgr.cloud'

  return {
    plugins: [react()],
    define: {
      // Em dev: VITE_API_URL vazio → api.ts usa baseURL relativa → proxy do Vite intercepta
      // Em prod: usa a URL real do servidor
      'import.meta.env.VITE_API_URL': JSON.stringify(
        mode === 'development' ? '' : apiUrl
      ),
    },
    server: {
      proxy: {
        // Intercepta todas as chamadas /k1/api/* e encaminha ao servidor remoto (sem CORS)
        '/k1': {
          target: apiUrl,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
    },
  }
})
