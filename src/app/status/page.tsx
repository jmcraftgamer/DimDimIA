'use client'

import { useState, useEffect } from 'react'

export default function StatusPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/worker')
      const d = await res.json()
      setData(d)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black">Status do Sistema</h1>
        <p className="text-gray-500 text-sm mt-1">
          Modo: <span className="font-medium text-[#1a1a1a]">Cron (Vercel)</span> &middot;
          Atualiza a cada 10s
        </p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-[#f5f5f5] rounded-2xl" />
          <div className="h-40 bg-[#f5f5f5] rounded-2xl" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#e5e5e5] p-4">
              <p className="text-2xl font-bold">{data.stats.activeProducts}</p>
              <p className="text-xs text-gray-500">Produtos Ativos</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#e5e5e5] p-4">
              <p className="text-2xl font-bold">{data.stats.inactiveProducts}</p>
              <p className="text-xs text-gray-500">Inativos</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#e5e5e5] p-4">
              <p className="text-2xl font-bold">{data.stats.monitors}</p>
              <p className="text-xs text-gray-500">Monitores</p>
            </div>
            <div className="bg-white rounded-2xl border border-[#e5e5e5] p-4">
              <p className="text-2xl font-bold">{data.stats.users}</p>
              <p className="text-xs text-gray-500">Usuários</p>
            </div>
          </div>

          {data.progress && (
            <div className="bg-white rounded-2xl border border-[#e5e5e5] p-4">
              <h3 className="font-semibold text-sm mb-2">Progresso do Worker</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Categoria</p>
                  <p className="font-medium">{data.progress.currentCategory}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Subcategoria</p>
                  <p className="font-medium">{data.progress.currentSubcategory}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Loja</p>
                  <p className="font-medium">{data.progress.currentStore} ({data.progress.storeIndex + 1}/{data.progress.totalStores})</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Subs processadas</p>
                  <p className="font-medium">{data.progress.processedSubs}/{data.progress.totalSubs}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Ciclo</p>
                  <p className="font-medium">#{data.progress.cycleCount}</p>
                </div>
              </div>
            </div>
          )}

          {data.lastRun && (
            <div className="bg-white rounded-2xl border border-[#e5e5e5] p-4">
              <h3 className="font-semibold text-sm mb-2">Última execução</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{data.lastRun.category} &gt; {data.lastRun.subcategory}</p>
                <p>Status: {data.lastRun.status}</p>
                <p>{data.lastRun.found} encontrados, {data.lastRun.saved} salvos</p>
                <p className="text-xs text-gray-400">
                  {new Date(data.lastRun.time).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#e5e5e5] p-4">
            <h3 className="font-semibold text-sm mb-3">Produtos por Categoria</h3>
            {data.categories?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {data.categories.map((cat: any) => (
                  <div key={cat.name} className="bg-[#f8f8f8] rounded-lg px-3 py-2">
                    <p className="text-sm font-medium">{cat.name}</p>
                    <p className="text-xs text-gray-500">{cat.count} produtos</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Nenhum produto ainda. Aguardando o cron buscar...</p>
            )}
          </div>

          {data.recentLogs?.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e5e5e5] p-4">
              <h3 className="font-semibold text-sm mb-3">Últimas execuções</h3>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {data.recentLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className={`flex items-center justify-between text-xs px-2 py-1 rounded ${
                      log.status === 'success' ? 'bg-green-50' : 'bg-yellow-50'
                    }`}
                  >
                    <span className="truncate max-w-[60%]">
                      {log.category} &gt; {log.subcategory}
                    </span>
                    <span className="text-gray-500 shrink-0">
                      {log.productsFound} encont. | {new Date(log.createdAt).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-400">Erro ao carregar status</p>
      )}
    </div>
  )
}
