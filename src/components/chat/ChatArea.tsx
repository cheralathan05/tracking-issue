import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Paperclip,
  Mic,
  Send,
  MoreVertical,
  Smile,
  Zap,
  Phone,
  Video,
  Shield,
  Clock3,
  Sparkles,
  Bell,
} from 'lucide-react'

interface Message {
  id: string
  type: 'citizen' | 'officer' | 'admin' | 'system'
  author: string
  avatar?: string
  content: string
  timestamp: string
  isRead?: boolean
}

interface ChatAreaProps {
  threadId: string
}

const mockMessages: Message[] = [
  {
    id: '1',
    type: 'system',
    author: 'System',
    content: 'Complaint escalated to Public Works Department',
    timestamp: '09:00 AM',
  },
  {
    id: '2',
    type: 'citizen',
    author: 'John Doe',
    avatar: 'JD',
    content:
      'There is a large pothole on Main Street near the intersection causing heavy traffic and vehicle damage.',
    timestamp: '09:05 AM',
  },
  {
    id: '3',
    type: 'officer',
    author: 'Officer Sarah',
    avatar: 'OS',
    content:
      'Thank you for reporting this issue. Inspection team has been dispatched and repair work will begin shortly.',
    timestamp: '10:30 AM',
  },
]

export default function ChatArea({ threadId }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = () => {
    if (!input.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'citizen',
      author: 'Citizen',
      avatar: 'C',
      content: input,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    setMessages((prev) => [...prev, newMessage])
    setInput('')

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: 'officer',
          author: 'Officer Sarah',
          avatar: 'OS',
          content:
            'Your complaint update has been received. Team is actively reviewing your request.',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ])
    }, 2000)
  }

  return (
    <div className="relative flex flex-col h-full min-h-0 overflow-hidden rounded-[32px] border border-blue-500/20 bg-[#050816] text-white shadow-[0_0_80px_rgba(59,130,246,0.15)]">

      {/* BACKGROUND GLOW */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-100px] left-[20%] h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[10%] h-[250px] w-[250px] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      {/* HEADER */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/10 bg-white/[0.03] backdrop-blur-3xl flex-shrink-0">

        {/* LEFT */}
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 uppercase tracking-[0.25em]">
              Citizen Support Workspace
            </span>

            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>

            <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300 flex items-center gap-2">
              <Clock3 className="w-3 h-3" />
              SLA Active
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight">
            Government Support Chat
          </h1>

          <p className="mt-3 text-slate-400 max-w-2xl text-sm leading-relaxed">
            Real-time grievance communication workspace for citizens, officers,
            escalation teams, and administrators.
          </p>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-3 ml-6">

          <button className="h-12 px-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 transition-all flex items-center gap-2 text-blue-200">
            <Phone className="w-4 h-4" />
            Call
          </button>

          <button className="h-12 px-5 rounded-2xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 transition-all flex items-center gap-2 text-purple-200">
            <Video className="w-4 h-4" />
            Video
          </button>

          <button className="h-12 px-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all flex items-center gap-2 text-emerald-200">
            <Sparkles className="w-4 h-4" />
            AI Summary
          </button>

          <button className="h-12 w-12 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-all flex items-center justify-center">
            <MoreVertical className="w-5 h-5 text-slate-300" />
          </button>

        </div>
      </div>

      {/* MESSAGE AREA */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto px-8 py-8 space-y-8">

        <AnimatePresence>
          {messages.map((message) => {
            const isCitizen = message.type === 'citizen'
            const isSystem = message.type === 'system'

            if (isSystem) {
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                  <div className="px-5 py-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 text-yellow-200 text-sm backdrop-blur-xl">
                    {message.content}
                  </div>
                </motion.div>
              )
            }

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isCitizen ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[72%] min-w-0 break-words whitespace-pre-wrap rounded-[28px] px-6 py-5 border backdrop-blur-2xl shadow-[0_0_30px_rgba(59,130,246,0.12)]
                  ${
                    isCitizen
                      ? 'bg-gradient-to-br from-blue-600 to-cyan-500 border-blue-400/30 text-white'
                      : 'bg-white/[0.04] border-white/10 text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold
                      ${
                        isCitizen
                          ? 'bg-white/20'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {message.avatar}
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        {message.author}
                      </p>
                      <p className="text-xs opacity-60">
                        {message.timestamp}
                      </p>
                    </div>
                  </div>

                  <p className="leading-relaxed text-[15px] break-words whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* TYPING INDICATOR */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 text-slate-400 text-sm"
        >
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce delay-100" />
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce delay-200" />
          </div>

          Officer Sarah is typing...
        </motion.div>

        <div ref={messagesEndRef} />
      </div>

      {/* COMPOSER */}
      <div className="relative z-10 border-t border-white/10 p-6 bg-black/20 backdrop-blur-3xl flex-shrink-0">

        <div className="rounded-[32px] border border-blue-500/20 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 shadow-[0_0_40px_rgba(59,130,246,0.12)]">

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            placeholder="Ask anything about your complaint..."
            className="w-full resize-none bg-transparent text-white placeholder:text-slate-500 outline-none text-[15px] leading-relaxed"
          />

          <div className="mt-5 flex items-center justify-between gap-4 flex-wrap">

            {/* LEFT ACTIONS */}
            <div className="flex items-center gap-3">

              <button className="h-11 w-11 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-all flex items-center justify-center">
                <Paperclip className="w-5 h-5 text-slate-300" />
              </button>

              <button className="h-11 w-11 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-all flex items-center justify-center">
                <Smile className="w-5 h-5 text-slate-300" />
              </button>

              <button className="h-11 w-11 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-all flex items-center justify-center">
                <Mic className="w-5 h-5 text-slate-300" />
              </button>

            </div>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-3">

              <button className="h-11 px-5 rounded-2xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 transition-all flex items-center gap-2 text-purple-200">
                <Zap className="w-4 h-4" />
                AI Assist
              </button>

              <button
                onClick={sendMessage}
                className="h-12 px-7 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-[1.03] transition-all shadow-[0_0_40px_rgba(59,130,246,0.45)] flex items-center gap-2 font-semibold"
              >
                <Send className="w-4 h-4" />
                Send
              </button>

            </div>

          </div>
        </div>

      </div>
    </div>
  )
}