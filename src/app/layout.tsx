import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { ThemeProvider } from '@/app/context/theme-provider'
import { SessionProvider } from '@/app/context/session-provider'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { OrganizationJsonLd, SoftwareApplicationJsonLd, WebsiteJsonLd } from '@/app/components/seo/json-ld'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://penochao.app.br'),
  title: {
    default: 'Penochão - Controle Financeiro Inteligente com IA',
    template: '%s | Penochão'
  },
  description: 'Organize suas finanças com IA. Leitura automática de faturas, categorização inteligente de despesas e dashboard completo. Comece grátis!',
  keywords: [
    'controle financeiro',
    'organização financeira',
    'leitura de faturas',
    'IA financeira',
    'gestão de despesas',
    'dashboard financeiro',
    'finanças pessoais',
    'categorização automática',
    'reserva de emergência',
    'controle de gastos'
  ],
  authors: [{ name: 'Penochão' }],
  creator: 'Penochão',
  publisher: 'Penochão',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://penochao.app.br',
    siteName: 'Penochão',
    title: 'Penochão - Controle Financeiro Inteligente com IA',
    description: 'Organize suas finanças com IA. Leitura automática de faturas, categorização inteligente e dashboard completo. Comece grátis!',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Penochão - Controle Financeiro Inteligente'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Penochão - Controle Financeiro Inteligente com IA',
    description: 'Organize suas finanças com IA. Leitura automática de faturas e dashboard completo.',
    images: ['/og-image.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={GeistSans.className}>
        <OrganizationJsonLd />
        <SoftwareApplicationJsonLd />
        <WebsiteJsonLd />
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
        <Analytics />
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
        )}
      </body>
    </html>
  )
}
