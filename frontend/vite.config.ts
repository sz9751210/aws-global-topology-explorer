import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: mode === 'development' ? 'http://localhost:8000' : 'http://backend:8000',
                changeOrigin: true,
            }
        }
    }
}))
