import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/user-management-react/',
  resolve: {
    alias: {
      'users-data': fileURLToPath(new URL(
        mode === 'demo' ? './src/data/usersDemo.js' : './src/data/usersApi.js',
        import.meta.url
      ))
    }
  }
}))
