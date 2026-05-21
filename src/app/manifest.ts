import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Penochão - Controle Financeiro Inteligente',
    short_name: 'Penochão',
    description: 'Controle financeiro inteligente com IA. Leitura automática de faturas, categorização de despesas e dashboard completo.',
    start_url: '/dashboard',
    id: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    background_color: '#08130e',
    theme_color: '#0b1f16',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['finance', 'productivity', 'utilities'],
    lang: 'pt-BR',
  }
}
