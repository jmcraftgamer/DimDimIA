'use client'

import { useState } from 'react'
import ProductGrid from '../components/ProductGrid'
import ChatBox from '../components/ChatBox'

export default function HomePage() {
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black gradient-text">
            DimDimIA
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            As melhores promoções da net em tempo real
          </p>
        </div>
        <button
          onClick={() => setChatOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Buscar com IA
        </button>
      </div>

      <ProductGrid />

      {chatOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setChatOpen(false)} />
          <div className="relative ml-auto w-full max-w-lg h-full bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5]">
              <span className="font-semibold text-sm">Busca inteligente</span>
              <button
                onClick={() => setChatOpen(false)}
                className="p-2 rounded-xl hover:bg-[#f5f5f5] transition-colors text-gray-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatBox />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
