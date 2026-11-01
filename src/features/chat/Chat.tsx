import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { Card } from '../../components/Card'
import { getMessages, sendMessage, subscribeToMessages, type Message } from './chatService'

export function Chat() {
  const { profile } = useAuth()
  const farmId = profile?.farmId || ''
  const senderId = profile?.id || ''
  const senderName = profile?.name || 'Unknown User'

  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!farmId) return

    // 1. Load initial messages
    getMessages(farmId).then(data => {
      setMessages(data)
      setLoading(false)
      setTimeout(scrollToBottom, 100)
    })

    // 2. Subscribe to real-time updates
    const subscription = subscribeToMessages(farmId, (newMsg) => {
      setMessages(prev => [...prev, newMsg])
      setTimeout(scrollToBottom, 100)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [farmId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !farmId) return

    const content = newMessage.trim()
    setNewMessage('') // Clear input immediately

    try {
      await sendMessage(farmId, senderId, senderName, content)
    } catch (err) {
      console.error('Failed to send:', err)
    }
  }

  if (loading) return <div className="p-8 text-slate-500">Loading chat...</div>

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <div className="mb-4">
        <p className="text-sm uppercase tracking-[0.2em] text-orange-600 font-bold">Communication</p>
        <h3 className="mt-1 text-3xl font-bold text-slate-900">Farm Chat</h3>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden bg-slate-50 border-slate-200">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 mt-10">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === senderId
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-xs text-slate-500 mb-1 ml-1">{msg.senderName}</span>}
                  <div 
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isMe 
                        ? 'bg-orange-600 text-white rounded-br-sm' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 mx-1">
                    {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-6 py-2.5 text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </Card>
    </div>
  )
}