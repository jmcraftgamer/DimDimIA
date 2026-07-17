'use client'

import { useState } from 'react'
import { STORES } from '../types'

interface MonitorFormProps {
  onAdd: () => void
}

export default function MonitorForm({ onAdd }: MonitorFormProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [store, setStore] = useState(STORES[0])
  const [targetPrice, setTargetPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !url.trim()) {
      setError('Nome e URL são obrigatórios')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, store, targetPrice }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao adicionar monitor')
      }

      setName('')
      setUrl('')
      setTargetPrice('')
      onAdd()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#f8f8f8] rounded-2xl border border-[#e5e5e5] p-6 space-y-4">
      <h3 className="font-semibold text-lg">Adicionar Produto para Monitorar</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Produto</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: iPhone 15 Pro Max"
            className="w-full px-3 py-2 rounded-xl border border-[#e5e5e5] bg-white text-sm outline-none focus:border-[#1a1a1a] transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Loja</label>
          <select
            value={store}
            onChange={(e) => setStore(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#e5e5e5] bg-white text-sm outline-none focus:border-[#1a1a1a] transition-colors"
          >
            {STORES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">URL do Produto</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-xl border border-[#e5e5e5] bg-white text-sm outline-none focus:border-[#1a1a1a] transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Alvo (opcional)</label>
          <input
            type="number"
            step="0.01"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="Ex: 4999.00"
            className="w-full px-3 py-2 rounded-xl border border-[#e5e5e5] bg-white text-sm outline-none focus:border-[#1a1a1a] transition-colors"
          />
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2.5 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {loading ? 'Adicionando...' : 'Adicionar para Monitorar'}
      </button>
    </form>
  )
}
