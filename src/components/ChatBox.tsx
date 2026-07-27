'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatMessage, PRESET_QUERIES } from '../types'
import ProductCard from './ProductCard'

interface ChatBoxProps {
  embedded?: boolean
}

interface MessageWithProducts extends ChatMessage {
  products?: any[]
}

export default function ChatBox({ embedded }: ChatBoxProps) {
  const [messages, setMessages] = useState<MessageWithProducts[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasMessages = messages.length > 0

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: MessageWithProducts = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()

      const assistantMessage: MessageWithProducts = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'Desculpe, não consegui processar sua solicitação.',
        role: 'assistant',
        createdAt: new Date().toISOString(),
        products: data.products?.length > 0 ? data.products : undefined,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
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
  }

  const handlePresetClick = (query: string) => {
    setInput(query)
    setTimeout(() => handleSend(), 100)
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
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
    }
    recognition.start()
  }

  const autoResize = () => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }

  const formatMessageContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, i) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('## ')) {
        return <h2 key={i} className="text-lg font-bold mt-4 mb-2">{trimmed.slice(3)}</h2>
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={i} className="text-md font-semibold mt-3 mb-1">{trimmed.slice(4)}</h3>
      }
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return <p key={i} className="font-bold mt-2">{trimmed.slice(2, -2)}</p>
      }
      if (trimmed.startsWith('1. ') || trimmed.startsWith('2. ') || trimmed.startsWith('3. ') ||
          trimmed.startsWith('4. ') || trimmed.startsWith('5. ') || trimmed.startsWith('6. ') ||
          trimmed.startsWith('7. ') || trimmed.startsWith('8. ') || trimmed.startsWith('9. ') ||
          trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return <p key={i} className="ml-2 text-sm leading-relaxed">{trimmed}</p>
      }
      if (trimmed === '') {
        return <div key={i} className="h-2" />
      }
      return <p key={i} className="text-sm leading-relaxed">{trimmed}</p>
    })
  }

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
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-2 rounded-xl hover:bg-[#f5f5f5] transition-colors text-gray-400 hover:text-gray-600"
              title="Enviar imagem"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl hover:bg-[#f5f5f5] transition-colors text-gray-400 hover:text-gray-600"
              title="Anexar arquivo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button
              onClick={startVoiceInput}
              className="p-2 rounded-xl hover:bg-[#f5f5f5] transition-colors text-gray-400 hover:text-gray-600"
              title="Ditado por voz"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-5 py-2.5 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
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
        <button
          key={i}
          onClick={() => handlePresetClick(query)}
          className="px-4 py-2 rounded-full bg-[#f5f5f5] text-sm text-gray-600 hover:bg-[#e5e5e5] hover:text-[#1a1a1a] transition-all border border-[#e5e5e5]"
        >
          {query}
        </button>
      ))}
    </div>
  )

  const chatMessages = hasMessages && (
    <div className="flex-1 overflow-y-auto space-y-4 px-4 py-6 max-w-3xl mx-auto w-full">
      {messages.map((msg) => (
        <div key={msg.id} className="space-y-2">
          <div className={`fade-in flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-[#1a1a1a] text-white rounded-br-md'
                  : 'bg-[#f5f5f5] text-[#1a1a1a] rounded-bl-md'
              }`}
            >
              {msg.role === 'assistant' ? formatMessageContent(msg.content) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>

          {msg.role === 'assistant' && msg.products && msg.products.length > 0 && (
            <div className="fade-in flex justify-start pl-2">
              <div className="flex gap-3 overflow-x-auto pb-2 max-w-[90%]" style={{ scrollbarWidth: 'thin' }}>
                {msg.products.map((p, i) => (
                  <div key={i} className="flex-shrink-0 w-[180px]">
                    <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden hover:shadow-md transition-shadow">
                      <a href={p.productUrl} target="_blank" rel="noopener noreferrer" className="block">
                        <div className="relative h-36 bg-gray-50 flex items-center justify-center p-2">
                          <img
                            src={p.imageUrl || 'https://via.placeholder.com/150'}
                            alt={p.name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150' }}
                          />
                          {p.discountPercent > 0 && (
                            <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              -{p.discountPercent}%
                            </span>
                          )}
                        </div>
                        <div className="p-2 space-y-1">
                          <p className="text-[11px] text-gray-500 font-medium uppercase truncate">{p.store}</p>
                          <p className="text-xs font-semibold line-clamp-2 leading-tight">{p.name}</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-[#1a1a1a]">R$ {p.price?.toFixed(2)}</span>
                            {p.oldPrice > 0 && (
                              <span className="text-[10px] text-gray-400 line-through">R$ {p.oldPrice?.toFixed(2)}</span>
                            )}
                          </div>
                          {p.freeShipping && (
                            <span className="text-[10px] text-green-600 font-medium">Frete Grátis</span>
                          )}
                        </div>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {loading && (
        <div className="flex justify-start fade-in">
          <div className="bg-[#f5f5f5] rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )

  const chatInput = hasMessages && (
    <div className="sticky bottom-0 bg-white border-t border-[#e5e5e5] px-4 py-4">
      <div className="max-w-3xl mx-auto relative">
        <div className="flex items-end gap-2 bg-[#f8f8f8] rounded-2xl border border-[#e5e5e5] px-3 py-2 chat-box-shadow">
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-2 rounded-xl hover:bg-[#e5e5e5] transition-colors text-gray-500 shrink-0"
            title="Enviar imagem"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl hover:bg-[#e5e5e5] transition-colors text-gray-500 shrink-0"
            title="Anexar arquivo"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre qualquer produto..."
            className="flex-1 bg-transparent border-0 outline-none resize-none text-sm py-2 max-h-32 placeholder:text-gray-400"
            rows={1}
          />

          <button
            onClick={startVoiceInput}
            className="p-2 rounded-xl hover:bg-[#e5e5e5] transition-colors text-gray-500 shrink-0"
            title="Ditado por voz"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-[#1a1a1a] text-white hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title="Enviar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={`flex flex-col ${embedded ? '' : hasMessages ? 'h-screen' : 'min-h-screen'}`}>
      {!hasMessages && (
        <div className={`flex flex-col items-center justify-center px-4 ${embedded ? 'py-12' : 'flex-1 pt-24 pb-12'}`}>
          <h1 className="font-display text-7xl md:text-9xl font-black gradient-text mb-3 tracking-tight">
            DimDimIA
          </h1>
          <p className="text-gray-500 text-xl md:text-2xl font-light mb-10">
            As Melhores Promoções da Net
          </p>

          {initialInput}
          {initialPresets}
        </div>
      )}

      {hasMessages && chatMessages}
      {hasMessages && chatInput}
    </div>
  )
}
