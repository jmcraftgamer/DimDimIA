'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { HomeIcon, ChatIcon, StoreIcon, MonitorIcon, StatusIcon, LoginIcon } from './Icons'

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { href: '/inicio', icon: HomeIcon, label: 'Início' },
    { href: '/', icon: ChatIcon, label: 'Chat' },
    { href: '/store', icon: StoreIcon, label: 'Loja' },
    { href: '/monitor', icon: MonitorIcon, label: 'Monitorar' },
    { href: '/status', icon: StatusIcon, label: 'Status' },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <nav className="fixed left-0 top-0 bottom-0 w-14 z-40 flex flex-col items-center pt-3">
        <Link href="/inicio" className="no-underline flex flex-col items-center leading-none">
          <span className="font-display text-[9px] font-black text-[#1a1a1a] tracking-tighter">DimDimIA</span>
        </Link>

        <div className="flex flex-col items-center gap-0.5 mt-6">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`p-2 rounded-xl transition-colors no-underline ${
                  active ? 'text-[#1a1a1a] bg-[#f0f0f0]' : 'text-gray-400 hover:text-gray-600 hover:bg-[#f8f8f8]'
                }`}
                title={item.label}
              >
                <Icon size={22} />
              </Link>
            )
          })}
        </div>

        <div className="mt-auto mb-4">
          {session ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-[#f8f8f8] transition-colors"
                title="Sair"
              >
                {session.user?.image ? (
                  <img src={session.user.image} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <LoginIcon size={22} />
                )}
              </button>
              {menuOpen && (
                <div className="absolute left-12 bottom-0 bg-white rounded-xl shadow-lg border border-[#e5e5e5] py-1 min-w-[120px]">
                  <div className="px-3 py-2 text-xs text-gray-500 border-b border-[#e5e5e5] truncate">
                    {session.user?.name}
                  </div>
                  <button
                    onClick={() => { signOut(); setMenuOpen(false) }}
                    className="w-full px-3 py-2 text-xs text-left text-gray-700 hover:bg-[#f5f5f5] transition-colors"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-[#f8f8f8] transition-colors no-underline block"
              title="Entrar"
            >
              <LoginIcon size={22} />
            </Link>
          )}
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
      )}
    </>
  )
}
