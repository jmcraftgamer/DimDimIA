'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import MonitorForm from '../../components/MonitorForm'
import MonitorList from '../../components/MonitorList'

export default function MonitorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#f5f5f5] rounded w-1/3" />
          <div className="h-32 bg-[#f5f5f5] rounded-2xl" />
          <div className="h-20 bg-[#f5f5f5] rounded-xl" />
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-black gradient-text">
          Monitorar Preços
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Adicione produtos para monitorar e seja avisado quando entrarem em promoção
        </p>
      </div>

      <MonitorForm onAdd={() => {}} />
      <MonitorList />
    </div>
  )
}
