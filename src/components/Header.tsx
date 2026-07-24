'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { href: '/inicio', label: 'Início', icon: '🏠' },
    { href: '/', label: 'Chat IA', icon: '💬' },
    { href: '/store', label: 'Loja', icon: '🏪' },
    { href: '/monitor', label: 'Monitorar', icon: '📊' },
    { href: '/status', label: 'Status', icon: '📈' },
  ]

  return (
    <header className="border-b border-[#e5e5e5] bg-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="text-lg font-bold font-display text-[#1a1a1a]">DimDimIA</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                pathname === link.href
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-gray-600 hover:bg-[#f5f5f5]'
              }`}
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden sm:block">
                {session.user?.name}
              </span>
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-7 h-7 rounded-full"
                />
              )}
              <button
                onClick={() => signOut()}
                className="text-xs text-gray-500 hover:text-[#1a1a1a] transition-colors"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-lg bg-[#1a1a1a] text-white text-sm font-medium no-underline hover:bg-gray-800 transition-colors"
            >
              Entrar
            </Link>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1.5 rounded-lg hover:bg-[#f5f5f5]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-[#e5e5e5] px-4 py-2 bg-white">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium no-underline ${
                pathname === link.href
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-gray-600 hover:bg-[#f5f5f5]'
              }`}
            >
              {link.icon} {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
