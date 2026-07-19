import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../components/SessionProvider'
import Header from '../components/Header'
import BackgroundScraper from '../components/BackgroundScraper'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'DimDimIA - As Melhores Promoções da Net',
  description: 'Encontre as melhores promoções da internet com inteligência artificial',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-white text-[#1a1a1a] antialiased">
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t border-[#e5e5e5] py-6 px-4">
              <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
                DimDimIA © 2026 - Encontrando as melhores promoções para você
              </div>
            </footer>
          </div>
          <BackgroundScraper />
        </AuthProvider>
      </body>
    </html>
  )
}
