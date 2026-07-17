'use client'

import { signIn, useSession } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) {
      router.push('/')
    }
  }, [session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isRegister) {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erro ao registrar')

        await signIn('credentials', { email, password, callbackUrl: '/' })
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    } else {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email ou senha inválidos')
      } else {
        router.push('/')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-black gradient-text">
            DimDimIA
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isRegister ? 'Crie sua conta' : 'Entre para continuar'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-6 space-y-4">
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[#e5e5e5] text-sm font-medium hover:bg-[#f5f5f5] transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar com Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e5e5e5]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-400">ou</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome"
                className="w-full px-3 py-2.5 rounded-xl border border-[#e5e5e5] text-sm outline-none focus:border-[#1a1a1a] transition-colors"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-[#e5e5e5] text-sm outline-none focus:border-[#1a1a1a] transition-colors"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-[#e5e5e5] text-sm outline-none focus:border-[#1a1a1a] transition-colors"
            />

            {error && (
              <p className="text-red-500 text-xs">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Carregando...' : isRegister ? 'Criar conta' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500">
            {isRegister ? 'Já tem conta?' : 'Não tem conta?'}{' '}
            <button
              onClick={() => { setIsRegister(!isRegister); setError('') }}
              className="text-[#1a1a1a] font-medium hover:underline"
            >
              {isRegister ? 'Entrar' : 'Cadastrar'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
