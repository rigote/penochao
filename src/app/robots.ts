import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/configuracoes/',
          '/perfil/',
          '/assinatura/',
          '/entradas/',
          '/despesas/',
          '/faturas/',
        ],
      },
    ],
    sitemap: 'https://penochao.app.br/sitemap.xml',
  }
}
