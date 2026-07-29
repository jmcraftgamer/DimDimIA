'use client'

import { useEffect, useState } from 'react'

interface ChatLoadingProps {
  phase: 'thinking' | 'searching' | 'evaluating'
}

function BanknoteLoadingIcon() {
  return (
    <div className="relative w-12 h-12" style={{ transform: 'rotate(-8deg)' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-gray-400">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 9c2 0 3-1.5 3-3.5" />
        <path d="M22 9c-2 0-3-1.5-3-3.5" />
        <path d="M2 15c2 0 3 1.5 3 3.5" />
        <path d="M22 15c-2 0-3 1.5-3 3.5" />
        <text x="12" y="12" textAnchor="middle" dy=".35em" fontSize="12" fontWeight="bold" fill="currentColor" stroke="none">$</text>
      </svg>
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow" />
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
          <BanknoteLoadingIcon />
          {phase === 'searching' && <FlyingNotes />}
        </div>
        <div className="bg-transparent rounded-2xl rounded-bl-md px-4 py-3">
          <StatusText phase={phase} />
        </div>
      </div>
    </div>
  )
}
