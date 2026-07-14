import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Relative base so assets resolve no matter which sub-path (or letter case)
// the site is served from — GitHub Pages serves this repo under a mixed-case
// path. Works together with the app's HashRouter. Override with VITE_BASE if
// you deploy to a fixed root (e.g. a custom domain).
const base = process.env.VITE_BASE ?? './'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Tattoo Einverständnis',
        short_name: 'Consent',
        description:
          'EU-/DSGVO-konforme Einverständniserklärung für Tattoos – offline, lokal, mehrsprachig.',
        lang: 'de',
        theme_color: '#17141f',
        background_color: '#17141f',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
