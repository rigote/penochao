import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Penochão - Controle Financeiro Inteligente',
    short_name: 'Penochão',
    description: 'Controle financeiro inteligente com IA. Leitura automática de faturas, categorização de despesas e dashboard completo.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#22c55e',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    categories: ['finance', 'productivity', 'utilities'],
    lang: 'pt-BR',
  }
}
