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
  Sparkles,
  Clock3,
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
  messages?: Message[]
  onSendMessage?: (message: string) => Promise<void> | void
  threadLabel?: string
  typingLabel?: string | null
  density?: 'default' | 'compact'
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

export default function ChatArea({ threadId, messages, onSendMessage, threadLabel, typingLabel, density = 'default' }: ChatAreaProps) {
  const [internalMessages, setInternalMessages] = useState<Message[]>(mockMessages)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const visibleMessages = messages ?? internalMessages
  const compact = density === 'compact'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    scrollToBottom()
  }, [visibleMessages])

  const sendMessage = async () => {
    if (!input.trim()) return

    if (onSendMessage) {
      await onSendMessage(input.trim())
      setInput('')
      return
    }

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

    setInternalMessages((prev) => [...prev, newMessage])
    setInput('')

    setTimeout(() => {
      setInternalMessages((prev) => [
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
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
        delay: 0.05,
      }}
      className="
        relative
        flex
        flex-col
        h-full
        min-h-0
        overflow-hidden
        rounded-[28px]
        border
        border-white/8
        bg-gradient-to-b
        from-white/[0.08]
        via-white/[0.05]
        to-white/[0.03]
        backdrop-blur-2xl
        shadow-[0_0_60px_rgba(59,130,246,0.1),inset_0_0_40px_rgba(59,130,246,0.05)]
      "
    >

      {/* =====================================================
         BACKGROUND GLOW
      ===================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">

        <div 
          className="
            absolute
            top-0
            left-[30%]
            h-[400px]
            w-[400px]
            rounded-full
            bg-blue-500/12
            blur-[140px]
          "
        />

        <div 
          className="
            absolute
            bottom-[-150px]
            right-[20%]
            h-[350px]
            w-[350px]
            rounded-full
            bg-indigo-500/10
            blur-[140px]
          "
        />

      </div>

      {/* =====================================================
         FIXED HEADER
      ===================================================== */}
      <div
        className="
          relative
          z-10
          flex-shrink-0
          border-b
          border-white/8
          bg-white/[0.03]
          px-4
          py-3
          backdrop-blur-xl
        "
      >

        {/* TOP ROW: BADGES */}
        <div className={`mb-3 flex flex-wrap items-center gap-2 ${compact ? 'mb-2' : ''}`}>

          <span
            className="
              px-3
              py-1
              rounded-full
              bg-blue-500/12
              border
              border-blue-500/30
              text-xs
              text-[10px]
              font-semibold
              text-blue-300
              uppercase
              tracking-[0.3em]
            "
          >
            Live Chat
          </span>

          <span
            className="
              px-3
              py-1
              rounded-full
              bg-emerald-500/12
              border
              border-emerald-500/30
              text-xs
              text-[10px]
              font-semibold
              text-emerald-300
              flex
              items-center
              gap-1.5
              uppercase
              tracking-[0.3em]
            "
          >
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>

          <span
            className="
              px-3
              py-1
              rounded-full
              bg-orange-500/12
              border
              border-orange-500/30
              text-xs
              text-[10px]
              font-semibold
              text-orange-300
              flex
              items-center
              gap-1.5
              uppercase
              tracking-[0.3em]
            "
          >
            <Clock3 className="w-3 h-3" />
            SLA Active
          </span>

        </div>

        {/* TITLE & CONTROLS */}
        <div className="flex items-center justify-between gap-4">

          <div className="flex-1 min-w-0">

            <h1
              className="
                text-[22px]
                font-black
                tracking-tight
                text-white
                leading-tight
              "
            >
              Citizen Support Chat
            </h1>

            <p
              className="
                mt-1.5
                text-xs
                text-slate-400
                leading-relaxed
              "
            >
              {threadLabel ? `Live thread for ${threadLabel}` : 'Real-time complaint resolution with government officers'}
            </p>

          </div>

          {/* ACTION BUTTONS */}
          <div className={`flex items-center gap-2 flex-shrink-0 ${compact ? 'hidden lg:flex' : ''}`}>

            <button
              className="
                h-11
                px-4
                rounded-xl
                border
                border-blue-500/30
                bg-blue-500/10
                hover:bg-blue-500/15
                transition-all
                flex
                items-center
                gap-2
                text-blue-300
                font-medium
                text-sm
              "
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Call</span>
            </button>

            <button
              className="
                h-11
                px-4
                rounded-xl
                border
                border-indigo-500/30
                bg-indigo-500/10
                hover:bg-indigo-500/15
                transition-all
                flex
                items-center
                gap-2
                text-indigo-300
                font-medium
                text-sm
              "
            >
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Video</span>
            </button>

            <button
              className="
                h-11
                px-4
                rounded-xl
                border
                border-emerald-500/30
                bg-emerald-500/10
                hover:bg-emerald-500/15
                transition-all
                flex
                items-center
                gap-2
                text-emerald-300
                font-medium
                text-sm
              "
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI</span>
            </button>

            <button
              className="
                h-11
                w-11
                rounded-xl
                border
                border-white/15
                bg-white/[0.05]
                hover:bg-white/[0.08]
                transition-all
                flex
                items-center
                justify-center
                text-slate-300
              "
            >
              <MoreVertical className="w-5 h-5" />
            </button>

          </div>

        </div>

      </div>

      {/* =====================================================
         SCROLLABLE MESSAGE AREA
      ===================================================== */}
      <div
        className="
          relative
          z-10
          flex-1
          min-h-0
          overflow-y-auto
          px-4
          py-3
          space-y-3
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-white/10
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb:hover]:bg-white/20
        "
      >

        <AnimatePresence>
          {visibleMessages.map((message) => {
            const isCitizen = message.type === 'citizen'
            const isSystem = message.type === 'system'

            if (isSystem) {
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-center py-2"
                >
                  <div
                    className="
                      px-3
                      py-1.5
                      rounded-xl
                      border
                      border-amber-500/25
                      bg-amber-500/10
                      text-amber-200
                      text-xs
                      font-medium
                      backdrop-blur-xl
                    "
                  >
                    {message.content}
                  </div>
                </motion.div>
              )
            }

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className={`
                  flex
                  ${isCitizen ? 'justify-end' : 'justify-start'}
                `}
              >
                <div
                  className={`
                    flex
                    gap-3
                      max-w-[72%]
                    ${isCitizen ? 'flex-row-reverse' : 'flex-row'}
                  `}
                >

                  {/* AVATAR */}
                  <div
                    className={`
                      h-10
                      w-10
                      flex-shrink-0
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      font-bold
                      text-xs
                      ${
                        isCitizen
                          ? 'bg-gradient-to-br from-blue-400 to-cyan-500 text-white'
                          : 'bg-white/10 text-blue-300 border border-white/20'
                      }
                    `}
                  >
                    {message.avatar}
                  </div>

                  {/* MESSAGE BUBBLE */}
                  <div className="flex flex-col gap-1 min-w-0">

                    {/* BUBBLE CONTENT */}
                    <div
                      className={`
                        rounded-[18px]
                        px-4
                        py-3
                        border
                        backdrop-blur-xl
                        shadow-[0_0_30px_rgba(59,130,246,0.08)]
                        break-words
                        text-[13px]
                        leading-relaxed
                        ${
                          isCitizen
                            ? `
                              bg-gradient-to-br
                              from-blue-500/20
                              via-blue-500/15
                              to-cyan-500/10
                              border-blue-500/30
                              text-white
                            `
                            : `
                              bg-white/[0.05]
                              border-white/10
                              text-slate-200
                            `
                        }
                      `}
                    >
                      {message.content}
                    </div>

                    {/* METADATA */}
                    <div
                      className={`
                        flex
                        items-center
                        gap-2
                        px-2
                        text-[11px]
                        text-slate-500
                        ${isCitizen ? 'justify-end' : 'justify-start'}
                      `}
                    >
                      <span className="font-medium text-slate-400">
                        {message.author}
                      </span>
                      <span>•</span>
                      <span>{message.timestamp}</span>
                    </div>

                  </div>

                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* TYPING INDICATOR */}
        {typingLabel ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 pl-2 text-sm text-slate-400"
          >
            <div className="flex gap-1.5">
              {[0, 1, 2].map((dot) => (
                <motion.div
                  key={dot}
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    delay: dot * 0.1,
                    duration: 0.7,
                    repeat: Infinity,
                  }}
                  className="h-2 w-2 rounded-full bg-blue-400"
                />
              ))}
            </div>
            <span>{typingLabel} is typing...</span>
          </motion.div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      {/* =====================================================
         FIXED COMPOSER FOOTER
      ===================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="
          relative
          z-10
          flex-shrink-0
          border-t
          border-white/8
          bg-white/[0.02]
          px-4
          py-3
          backdrop-blur-xl
        "
      >

        {/* COMPOSER CONTAINER */}
        <div
          className="
            rounded-[20px]
            border
            border-white/12
            bg-gradient-to-br
            from-white/[0.06]
            to-white/[0.02]
            p-3
            space-y-3
            shadow-[0_0_40px_rgba(59,130,246,0.08)]
          "
        >

          {/* INPUT AREA */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            placeholder="Ask anything about your complaint..."
            className="
              w-full
              resize-none
              bg-transparent
              text-white
              placeholder:text-slate-500
              outline-none
              text-sm
              leading-relaxed
              font-medium
            "
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
          />

          {/* ACTIONS ROW */}
          <div
            className="
              flex
              items-center
              justify-between
              gap-4
              flex-wrap
            "
          >

            {/* LEFT ACTIONS */}
            <div className="flex items-center gap-2">

              <button
                className="
                  h-10
                  w-10
                      rounded-md
                  border
                  border-white/15
                  bg-white/[0.05]
                  hover:bg-white/[0.08]
                  transition-all
                  flex
                  items-center
                  justify-center
                  text-slate-400
                  hover:text-slate-300
                "
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <button
                className="
                  h-10
                  w-10
                      rounded-md
                  border
                  border-white/15
                  bg-white/[0.05]
                  hover:bg-white/[0.08]
                  transition-all
                  flex
                  items-center
                  justify-center
                  text-slate-400
                  hover:text-slate-300
                "
              >
                <Smile className="w-4 h-4" />
              </button>

              <button
                className="
                  h-10
                  w-10
                      rounded-md
                  border
                  border-white/15
                  bg-white/[0.05]
                  hover:bg-white/[0.08]
                  transition-all
                  flex
                  items-center
                  justify-center
                  text-slate-400
                  hover:text-slate-300
                "
              >
                <Mic className="w-4 h-4" />
              </button>

            </div>

            {/* RIGHT ACTIONS */}
            <div className="flex items-center gap-2">

              <button
                className="
                  h-10
                  px-3
                      rounded-md
                  border
                  border-purple-500/30
                  bg-purple-500/10
                  hover:bg-purple-500/15
                  transition-all
                  flex
                  items-center
                  gap-2
                  text-purple-300
                  font-medium
                  text-xs
                "
              >
                <Zap className="w-3.5 h-3.5" />
                AI
              </button>

              <button
                onClick={sendMessage}
                className="
                  h-10
                  px-4
                      rounded-md
                  bg-gradient-to-r
                  from-blue-500
                  to-indigo-500
                  hover:from-blue-600
                  hover:to-indigo-600
                  transition-all
                  hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]
                  flex
                  items-center
                  gap-2
                  font-semibold
                  text-white
                  text-xs
                "
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>

            </div>

          </div>

        </div>

      </motion.div>

    </motion.div>
  )
}
