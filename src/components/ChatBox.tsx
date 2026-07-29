'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChatMessage, PRESET_QUERIES } from '../types'
import ChatLoading from './ChatLoading'

interface ChatBoxProps {
  embedded?: boolean
}

interface MessageWithProducts extends ChatMessage {
  products?: any[]
  liked?: boolean
  hidden?: boolean
}

function BanknoteIcon({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-7 h-7' : 'w-16 h-16'
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`${cls} shrink-0`}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 9c2 0 3-1.5 3-3.5" />
      <path d="M22 9c-2 0-3-1.5-3-3.5" />
      <path d="M2 15c2 0 3 1.5 3 3.5" />
      <path d="M22 15c-2 0-3 1.5-3 3.5" />
      <text x="12" y="12" textAnchor="middle" dy=".35em" fontSize="12" fontWeight="bold" fill="currentColor" stroke="none">$</text>
    </svg>
  )
}

function TypewriterMessage({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        return (
          <div key={i} className="typewriter-line" style={{ animationDelay: `${i * 0.04}s` }}>
            {renderLine(trimmed, i)}
          </div>
        )
      })}
    </div>
  )
}

function renderLine(trimmed: string, i: number) {
  if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
    return <p className="font-bold text-sm mt-2">{trimmed.slice(2, -2)}</p>
  }
  if (trimmed.startsWith('## ')) {
    return <h2 className="text-lg font-bold mt-3 mb-1">{trimmed.slice(3)}</h2>
  }
  if (trimmed.startsWith('### ')) {
    return <h3 className="text-md font-semibold mt-2 mb-1">{trimmed.slice(4)}</h3>
  }
  if (trimmed.startsWith('🎯') || trimmed.startsWith('✅') || trimmed.startsWith('❌')) {
    return <p className="text-sm leading-relaxed">{trimmed}</p>
  }
  if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
    return <p className="ml-3 text-sm leading-relaxed">{trimmed}</p>
  }
  if (trimmed === '') {
    return <div className="h-1" />
  }
  return <p className="text-sm leading-relaxed">{trimmed}</p>
}

function MicIcon({ isRecording }: { isRecording: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {isRecording ? (
        <rect x="6" y="6" width="12" height="12" rx="2" strokeWidth={2} />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      )}
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function ThumbsUpIcon({ filled }: { filled?: boolean }) {
  return (
    <svg className="w-3.5 h-3.5" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
    </svg>
  )
}

export default function ChatBox({ embedded }: ChatBoxProps) {
  const [messages, setMessages] = useState<MessageWithProducts[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState<'thinking' | 'searching' | 'evaluating'>('thinking')
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const hasMessages = messages.length > 0

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    if (messages.length > 0) {
      const raf = requestAnimationFrame(() => scrollToBottom())
      return () => cancelAnimationFrame(raf)
    }
  }, [messages])

  const handleSend = useCallback(async (customMessage?: string) => {
    const msg = customMessage ?? input
    if (!msg.trim() || loading) return

    const userMessage: MessageWithProducts = {
      id: Date.now().toString(),
      content: msg,
      role: 'user',
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setLoadingPhase('thinking')

    try {
      const res = await fetch('/api/chat?stream=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (res.headers.get('Content-Type')?.includes('text/event-stream')) {
        await handleSSEResponse(res)
      } else {
        const data = await res.json()
        const assistantMessage: MessageWithProducts = {
          id: (Date.now() + 1).toString(),
          content: data.response || 'Desculpe, não consegui processar sua solicitação.',
          role: 'assistant',
          createdAt: new Date().toISOString(),
          products: data.products?.length > 0 ? data.products : undefined,
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch {
      const errorMessage: MessageWithProducts = {
        id: (Date.now() + 1).toString(),
        content: 'Erro ao conectar com o servidor. Tente novamente.',
        role: 'assistant',
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  async function handleSSEResponse(res: Response) {
    const reader = res.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    let buffer = ''
    let resultData: any = null

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''

      for (const event of events) {
        const lines = event.split('\n')
        let eventType = ''
        let eventData = ''

        for (const line of lines) {
          if (line.startsWith('event: ')) eventType = line.slice(7)
          if (line.startsWith('data: ')) eventData = line.slice(6)
        }

        if (!eventData) continue

        try {
          const parsed = JSON.parse(eventData)
          if (eventType === 'status') {
            setLoadingPhase(parsed.phase)
          } else if (eventType === 'result') {
            resultData = parsed
          }
        } catch { }
      }
    }

    if (resultData) {
      const assistantMessage: MessageWithProducts = {
        id: (Date.now() + 1).toString(),
        liked: false,
        hidden: false,
        content: resultData.response || 'Desculpe, não consegui processar sua solicitação.',
        role: 'assistant',
        createdAt: new Date().toISOString(),
        products: resultData.products?.length > 0 ? resultData.products : undefined,
      }
      setMessages((prev) => [...prev, assistantMessage])
    }
  }

  const handlePresetClick = (query: string) => {
    setInput(query)
    setTimeout(() => handleSend(query), 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0]
    if (!file) return
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        content: type === 'image' ? `[Imagem enviada: ${file.name}]` : `[Arquivo enviado: ${file.name}]`,
        role: 'user',
        createdAt: new Date().toISOString(),
      },
    ])
    e.target.value = ''
  }

  const startVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: 'Seu navegador não suporta entrada de voz.',
          role: 'assistant',
          createdAt: new Date().toISOString(),
        },
      ])
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let final = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }
      setInput(final + interim)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }

  const autoResize = () => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch { }
  }

  const toggleLike = (msgId: string) => {
    setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, liked: !m.liked } : m))
  }

  const toggleHide = (msgId: string) => {
    setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, hidden: !m.hidden } : m))
  }

  const renderMessageActions = (msg: MessageWithProducts) => (
    <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => copyMessage(msg.content)} className="p-1.5 rounded-md hover:bg-[#f0f0f0] text-gray-400 hover:text-gray-600 transition-colors" title="Copiar resposta"><CopyIcon /></button>
      <button className="p-1.5 rounded-md hover:bg-[#f0f0f0] text-gray-400 hover:text-gray-600 transition-colors" title="Refazer resposta"><RefreshIcon /></button>
      <button onClick={() => toggleLike(msg.id)} className={`p-1.5 rounded-md hover:bg-[#f0f0f0] transition-colors ${msg.liked ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`} title={msg.liked ? 'Não gostei' : 'Gostei'}><ThumbsUpIcon filled={msg.liked} /></button>
      <button onClick={() => toggleHide(msg.id)} className="p-1.5 rounded-md hover:bg-[#f0f0f0] text-gray-400 hover:text-gray-600 transition-colors" title="Ocultar resposta"><EyeOffIcon /></button>
      <button onClick={() => copyMessage(msg.content)} className="p-1.5 rounded-md hover:bg-[#f0f0f0] text-gray-400 hover:text-gray-600 transition-colors" title="Mais opções"><DotsIcon /></button>
    </div>
  )

  const initialInput = !hasMessages && (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative bg-white rounded-3xl border-2 border-[#e5e5e5] shadow-lg p-5 transition-all hover:shadow-xl hover:border-gray-300">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); autoResize() }}
          onKeyDown={handleKeyDown}
          placeholder="Deseja que eu procure um produto específico?"
          className="w-full bg-transparent border-0 outline-none resize-none text-base min-h-[120px] placeholder:text-gray-400"
          rows={4}
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <button onClick={() => imageInputRef.current?.click()} className="p-2 rounded-xl hover:bg-[#f5f5f5] transition-colors text-gray-400 hover:text-gray-600" title="Enviar imagem">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl hover:bg-[#f5f5f5] transition-colors text-gray-400 hover:text-gray-600" title="Anexar arquivo">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>
            <button onClick={startVoiceInput} className="p-2 rounded-xl hover:bg-[#f5f5f5] transition-colors text-gray-400 hover:text-gray-600" title={isRecording ? 'Parar gravação' : 'Ditado por voz'}>
              <MicIcon isRecording={isRecording} />
            </button>
          </div>
          <button onClick={() => handleSend()} disabled={!input.trim() || loading} className="px-5 py-2.5 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
      </div>
    </div>
  )

  const initialPresets = !hasMessages && (
    <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto mt-6">
      {PRESET_QUERIES.map((query, i) => (
        <button key={i} onClick={() => handlePresetClick(query)} className="px-4 py-2 rounded-full bg-[#f5f5f5] text-sm text-gray-600 hover:bg-[#e5e5e5] hover:text-[#1a1a1a] transition-all border border-[#e5e5e5]">{query}</button>
      ))}
    </div>
  )

  const chatMessages = hasMessages && (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-3 px-4 py-6 max-w-3xl mx-auto w-full scrollbar-hide">
      {messages.filter(m => !m.hidden).map((msg) => (
        <div key={msg.id} className={`fade-in flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
          <div className={`flex items-start gap-1 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="relative shrink-0 text-gray-400 mt-1.5" style={{ transform: 'rotate(-8deg)' }}>
                <BanknoteIcon size="sm" />
              </div>
            )}
            <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-[#1a1a1a] text-white rounded-br-md' : 'bg-transparent rounded-bl-md'}`}>
              {msg.role === 'assistant' ? <TypewriterMessage content={msg.content} /> : <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
            </div>
          </div>

          {msg.role === 'assistant' && msg.products && msg.products.length > 0 && (
            <div className="pl-[44px] mt-2 space-y-4 w-full max-w-[88%]">
              {msg.products.slice(0, 10).map((p, i) => {
                return (
                  <div key={i} className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden hover:shadow-md transition-shadow product-card">
                    <div className="p-4 space-y-3">
                      <h3 className="font-bold text-base leading-tight text-[#1a1a1a]">{p.name}</h3>
                      <div className="relative w-full h-48 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center">
                        <img
                          src={p.imageUrl || ''}
                          alt={p.name}
                          className="w-full h-full object-contain p-3 absolute inset-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = 'none' }}
                        />
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1" />
                          <circle cx="12" cy="12" r="4" strokeWidth="1" />
                        </svg>
                        {p.discountPercent > 0 && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md">-{p.discountPercent}%</span>
                        )}
                        {p.freeShipping && (
                          <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">Frete Grátis</span>
                        )}
                      </div>
                      {p.description && p.description !== p.name && (
                        <p className="text-sm text-gray-600 leading-relaxed">{p.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <div className="space-y-0.5">
                          <p className="text-[11px] text-gray-500 font-medium uppercase">{p.store}</p>
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-lg font-bold text-[#1a1a1a]">R$ {p.price?.toFixed(2)}</span>
                            {p.oldPrice > 0 && <span className="text-sm text-gray-400 line-through">R$ {p.oldPrice?.toFixed(2)}</span>}
                          </div>
                          {p.rating && <span className="block text-[11px] text-gray-500">★ {p.rating}/5 {p.totalSales ? p.totalSales + ' vendidos' : ''}</span>}
                        </div>
                        <a href={p.productUrl} target="_blank" rel="noopener noreferrer" className="px-5 py-2 bg-[#1a1a1a] text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors text-center">Comprar</a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {msg.role === 'assistant' && (
            <div className="pl-[44px] group">{renderMessageActions(msg)}</div>
          )}
        </div>
      ))}

      {loading && <ChatLoading phase={loadingPhase} />}

      <div ref={messagesEndRef} />
    </div>
  )

  const chatInput = hasMessages && (
    <div className="sticky bottom-0 bg-white border-t border-[#e5e5e5] px-4 py-4">
      <div className="max-w-3xl mx-auto relative">
        <div className="flex items-end gap-2 bg-[#f8f8f8] rounded-2xl border border-[#e5e5e5] px-3 py-2 chat-box-shadow">
          <button onClick={() => imageInputRef.current?.click()} className="p-2 rounded-xl hover:bg-[#e5e5e5] transition-colors text-gray-500 shrink-0" title="Enviar imagem">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
          <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl hover:bg-[#e5e5e5] transition-colors text-gray-500 shrink-0" title="Anexar arquivo">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />

          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Pergunte sobre qualquer produto..." className="flex-1 bg-transparent border-0 outline-none resize-none text-sm py-2 max-h-32 placeholder:text-gray-400" rows={1} />

          <button onClick={startVoiceInput} className={`p-2 rounded-xl transition-colors ${isRecording ? 'bg-gray-100' : 'hover:bg-[#e5e5e5]'} text-gray-500`} title={isRecording ? 'Parar gravação' : 'Ditado por voz'}>
            <MicIcon isRecording={isRecording} />
          </button>

          <button onClick={() => handleSend()} disabled={!input.trim() || loading} className="p-2.5 rounded-xl bg-[#1a1a1a] text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0" title="Enviar">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`flex flex-col ${embedded ? '' : hasMessages ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {!hasMessages && (
        <div className={`flex flex-col items-center justify-center px-4 ${embedded ? 'py-12' : 'flex-1 pt-24 pb-12'}`}>
          <h1 className="font-display text-5xl md:text-7xl font-black gradient-text mb-1 tracking-tight">DimDimIA</h1>
          <p className="text-gray-500 text-lg md:text-xl font-light mb-8">As Melhores Promoções da Net</p>
          {initialInput}
          {initialPresets}
        </div>
      )}

      {hasMessages && chatMessages}
      {hasMessages && chatInput}
    </div>
  )
}
