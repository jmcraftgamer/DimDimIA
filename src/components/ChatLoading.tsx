'use client'

import { useEffect, useState } from 'react'

interface ChatLoadingProps {
  phase: 'thinking' | 'searching' | 'evaluating'
}

function BanknoteLoadingIcon() {
  return (
    <div className="shrink-0 text-gray-400" style={{ transform: 'rotate(-8deg)' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 9c2 0 3-1.5 3-3.5" />
        <path d="M22 9c-2 0-3-1.5-3-3.5" />
        <path d="M2 15c2 0 3 1.5 3 3.5" />
        <path d="M22 15c-2 0-3 1.5-3 3.5" />
        <text x="12" y="13" textAnchor="middle" dy=".35em" fontSize="12" fontWeight="bold" fill="currentColor" stroke="none">$</text>
      </svg>
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
      <div className="flex items-start gap-1.5">
        <div className="mt-0.5">
          <BanknoteLoadingIcon />
        </div>
        <div className="bg-transparent rounded-2xl rounded-bl-md px-4 py-3">
          <StatusText phase={phase} />
        </div>
      </div>
    </div>
  )
}
