'use client'

import { useState, useEffect } from 'react'
import { MonitorData } from '../types'

export default function MonitorList() {
  const [monitors, setMonitors] = useState<MonitorData[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingId, setCheckingId] = useState<string | null>(null)

  const fetchMonitors = async () => {
    try {
      const res = await fetch('/api/monitor')
      const data = await res.json()
      setMonitors(data.monitors || [])
    } catch (error) {
      console.error('Error fetching monitors:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonitors()
  }, [])

  const checkPrice = async (id: string) => {
    setCheckingId(id)
    try {
      await fetch('/api/monitor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      await fetchMonitors()
    } catch (error) {
      console.error('Error checking price:', error)
    } finally {
      setCheckingId(null)
    }
  }

  const removeMonitor = async (id: string) => {
    try {
      await fetch(`/api/monitor?id=${id}`, { method: 'DELETE' })
      setMonitors((prev) => prev.filter((m) => m.id !== id))
    } catch (error) {
      console.error('Error removing monitor:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[#f8f8f8] rounded-xl animate-pulse p-4 h-20" />
        ))}
      </div>
    )
  }

  if (monitors.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">Nenhum produto sendo monitorado</p>
        <p className="text-sm mt-1">Adicione produtos acima para começar a monitorar</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {monitors.map((monitor) => (
        <div
          key={monitor.id}
          className={`bg-white rounded-xl border p-4 transition-colors ${
            monitor.onSale ? 'border-green-300 bg-green-50' : 'border-[#e5e5e5]'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate">{monitor.name}</h4>
                {monitor.onSale && (
                  <span className="text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">
                    EM PROMOÇÃO!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span>{monitor.store}</span>
                {monitor.currentPrice != null && (
                  <span className="font-semibold text-[#1a1a1a]">
                    R$ {monitor.currentPrice.toFixed(2)}
                  </span>
                )}
                {monitor.targetPrice != null && (
                  <span>
                    Meta: R$ {monitor.targetPrice.toFixed(2)}
                  </span>
                )}
                {monitor.lastChecked && (
                  <span>
                    Verificado: {new Date(monitor.lastChecked).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
              <a
                href={monitor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline mt-1 inline-block"
              >
                Ver produto →
              </a>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => checkPrice(monitor.id)}
                disabled={checkingId === monitor.id}
                className="px-3 py-1.5 rounded-lg border border-[#e5e5e5] text-xs font-medium hover:bg-[#f5f5f5] transition-colors disabled:opacity-50"
              >
                {checkingId === monitor.id ? 'Verificando...' : 'Verificar Preço'}
              </button>
              <button
                onClick={() => removeMonitor(monitor.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
