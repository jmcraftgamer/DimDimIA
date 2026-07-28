'use client'

import { useEffect, useState } from 'react'

interface ChatLoadingProps {
  phase: 'thinking' | 'searching' | 'evaluating'
}

function WalletIcon() {
  return (
    <div className="relative w-16 h-16">
      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full drop-shadow-lg">
        <rect x="4" y="14" width="56" height="40" rx="6" fill="#1a1a1a" />
        <rect x="8" y="18" width="48" height="32" rx="4" fill="#2d2d2d" />
        <rect x="20" y="28" width="24" height="12" rx="3" fill="#f5c518" />
        <rect x="22" y="30" width="20" height="2" rx="1" fill="#d4a017" />
        <rect x="22" y="34" width="12" height="2" rx="1" fill="#d4a017" />
        <circle cx="44" cy="22" r="3" fill="#f5c518" />
        <circle cx="44" cy="22" r="1.5" fill="#1a1a1a" />
      </svg>
      <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow" />
    </div>
  )
}

function FlyingNotes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute text-yellow-500 text-lg animate-float-note"
          style={{
            left: `${20 + Math.random() * 60}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${1.5 + Math.random()}s`,
            opacity: 0.7,
          }}
        >
          💰
        </div>
      ))}
    </div>
  )
}

function StatusText({ phase }: { phase: string }) {
  const [dotCount, setDotCount] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount(prev => (prev + 1) % 6)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const dots = '.'.repeat((dotCount % 3) + 1)
  const labels: Record<string, string> = {
    thinking: 'Pensando',
    searching: 'Pesquisando',
    evaluating: 'Avaliando',
  }

  return (
    <span className="text-sm text-gray-500 font-medium animate-pulse">
      {labels[phase] || 'Processando'}{dots}
    </span>
  )
}

export default function ChatLoading({ phase }: ChatLoadingProps) {
  return (
    <div className="fade-in flex justify-start mb-4">
      <div className="flex items-start gap-3">
        <div className="relative">
          <WalletIcon />
          {phase === 'searching' && <FlyingNotes />}
        </div>
        <div className="bg-transparent rounded-2xl rounded-bl-md px-4 py-3">
          <StatusText phase={phase} />
        </div>
      </div>
    </div>
  )
}
