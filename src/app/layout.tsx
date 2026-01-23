import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { ThemeProvider } from '@/app/context/theme-provider'
import { SessionProvider } from '@/app/context/session-provider'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Penochão - Controle Financeiro Inteligente',
  description: 'Organize suas finanças com facilidade. Dashboard completo, leitura de faturas com IA e muito mais.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={GeistSans.className}>
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
      </body>
    </html>
  )
}
