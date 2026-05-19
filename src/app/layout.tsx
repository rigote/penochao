import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { ThemeProvider } from '@/app/context/theme-provider'
import { SessionProvider } from '@/app/context/session-provider'
import { Toaster } from 'sonner'
import { OrganizationJsonLd, SoftwareApplicationJsonLd, WebsiteJsonLd } from '@/app/components/seo/json-ld'
import { PrivacyConsentManager } from '@/app/components/privacy-consent'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://penochao.app.br'),
  title: {
    default: 'Penochão - Saia das Dívidas com Diagnóstico Financeiro e IA',
    template: '%s | Penochão'
  },
  description: 'Organize entradas, despesas e dívidas. Entenda o que está travando sua vida financeira e receba um plano realista para sair do aperto.',
  keywords: [
    'sair das dívidas',
    'controle financeiro',
    'organização financeira',
    'leitura de faturas',
    'IA financeira',
    'gestão de despesas',
    'diagnóstico financeiro',
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
    title: 'Penochão - Saia das Dívidas com Diagnóstico Financeiro e IA',
    description: 'Organize entradas, despesas e dívidas para entender o que está travando sua vida financeira.',
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
    title: 'Penochão - Saia das Dívidas com Diagnóstico Financeiro e IA',
    description: 'Entenda suas dívidas, sua sobra real e seu próximo passo.',
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
        <PrivacyConsentManager />
      </body>
    </html>
  )
}
