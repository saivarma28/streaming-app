import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['images/favicon.svg', 'images/icons.svg', 'images/*'],
      manifest: {
        name: 'StreamApp',
        short_name: 'StreamApp',
        description: 'StreamApp - Movies and TV Shows',
        theme_color: '#0d0e12',
        background_color: '#0d0e12',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'images/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'images/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'images/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [
          /^\/api/,
          /identitytoolkit\.googleapis\.com/,
          /securetoken\.googleapis\.com/,
          /r2\.cloudflarestorage\.com/
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
      }
    })
  ],
})
