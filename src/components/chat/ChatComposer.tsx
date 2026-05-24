import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Paperclip,
  Mic,
  Send,
  Smile,
  Zap,
  MapPin,
  Image,
  Sparkles,
} from 'lucide-react'

interface ChatComposerProps {
  onSendMessage: (message: string) => void
  onFocusChange: (focused: boolean) => void
}

export default function ChatComposer({
  onSendMessage,
  onFocusChange,
}: ChatComposerProps) {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /* AUTO RESIZE */
  useEffect(() => {
    if (!textareaRef.current) return

    textareaRef.current.style.height = '0px'

    const scrollHeight = textareaRef.current.scrollHeight

    textareaRef.current.style.height =
      Math.min(scrollHeight, 180) + 'px'
  }, [message])

  const handleSend = () => {
    if (!message.trim()) return

    onSendMessage(message)

    setMessage('')

    if (textareaRef.current) {
      textareaRef.current.style.height = '56px'
    }
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative flex-shrink-0 border-t border-white/10 bg-black/20 backdrop-blur-3xl px-6 py-5"
    >

      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute bottom-[-100px] left-[20%] h-[180px] w-[180px] rounded-full bg-blue-500/10 blur-[90px]" />
        <div className="absolute top-[-80px] right-[15%] h-[140px] w-[140px] rounded-full bg-purple-500/10 blur-[90px]" />
      </div>

      {/* MAIN CONTAINER */}
      <motion.div
        animate={{
          borderColor: isFocused
            ? 'rgba(59,130,246,0.45)'
            : 'rgba(255,255,255,0.08)',
        }}
        className="
          relative
          mx-auto
          max-w-full
          rounded-[32px]
          border
          bg-gradient-to-br
          from-[#0B1020]
          via-[#0A1122]
          to-[#09101F]
          shadow-[0_0_60px_rgba(59,130,246,0.08)]
          overflow-hidden
        "
      >

        {/* INNER GLOW */}
        <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_60%)] pointer-events-none" />

        {/* CONTENT */}
        <div className="relative z-10 p-5">

          {/* TOP SECTION */}
          <div className="flex flex-col gap-4">

            {/* TEXTAREA ROW */}
            <div className="flex items-end gap-4 min-w-0">

              {/* LEFT ACTIONS */}
              <div className="flex items-center gap-2 flex-shrink-0">

                <ActionButton
                  icon={<Paperclip className="w-5 h-5" />}
                  color="blue"
                  title="Attach file"
                />

                <ActionButton
                  icon={<Image className="w-5 h-5" />}
                  color="purple"
                  title="Image upload"
                />

                <ActionButton
                  icon={<MapPin className="w-5 h-5" />}
                  color="emerald"
                  title="Location"
                />

              </div>

              {/* TEXTAREA */}
              <div className="flex-1 min-w-0">

                <div
                  className={`
                    relative
                    rounded-[26px]
                    border
                    ${
                      isFocused
                        ? 'border-blue-500/40'
                        : 'border-white/10'
                    }
                    bg-white/[0.03]
                    transition-all
                    duration-300
                  `}
                >

                  {/* GLOW */}
                  {isFocused && (
                    <div className="absolute inset-0 rounded-[26px] bg-blue-500/5 blur-xl pointer-events-none" />
                  )}

                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onFocus={() => {
                      setIsFocused(true)
                      onFocusChange(true)
                    }}
                    onBlur={() => {
                      setIsFocused(false)
                      onFocusChange(false)
                    }}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Ask anything about your complaint..."
                    className="
                      relative
                      z-10
                      w-full
                      resize-none
                      bg-transparent
                      px-5
                      py-4
                      text-[15px]
                      leading-relaxed
                      text-white
                      placeholder:text-slate-500
                      outline-none
                      min-h-[60px]
                      max-h-[180px]
                      overflow-y-auto
                      break-words
                      whitespace-pre-wrap
                    "
                  />

                  {/* MODEL ROW */}
                  <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">

                    <div className="flex items-center gap-3 flex-wrap">

                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        Neo Model
                      </div>

                      <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                        Choose model
                      </button>

                    </div>

                    <div className="flex items-center gap-2">

                      <button className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-all flex items-center justify-center">
                        <Smile className="w-4 h-4 text-slate-300" />
                      </button>

                      <button className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-all flex items-center justify-center">
                        <Mic className="w-4 h-4 text-slate-300" />
                      </button>

                    </div>

                  </div>

                </div>

              </div>

              {/* SEND */}
              <div className="flex-shrink-0">

                <motion.button
                  onClick={handleSend}
                  whileHover={{
                    scale: 1.05,
                  }}
                  whileTap={{
                    scale: 0.95,
                  }}
                  disabled={!message.trim()}
                  className={`
                    h-[60px]
                    w-[60px]
                    rounded-[22px]
                    flex
                    items-center
                    justify-center
                    transition-all
                    duration-300
                    shadow-[0_0_40px_rgba(59,130,246,0.35)]
                    ${
                      message.trim()
                        ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-white'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }
                  `}
                >
                  <Send className="w-5 h-5" />
                </motion.button>

              </div>

            </div>

            {/* QUICK ACTIONS */}
            <div className="flex items-center gap-3 flex-wrap">

              <QuickAction label="Create Image" />
              <QuickAction label="Summarize" />
              <QuickAction label="Analyze Data" />
              <QuickAction label="Draft Reply" />
              <QuickAction label="Translate" />
              <QuickAction label="Voice Assistant" />

            </div>

          </div>

        </div>

      </motion.div>
    </motion.div>
  )
}

/* ACTION BUTTON */
function ActionButton({
  icon,
  color,
  title,
}: {
  icon: React.ReactNode
  color: string
  title: string
}) {
  return (
    <motion.button
      whileHover={{
        scale: 1.08,
      }}
      whileTap={{
        scale: 0.92,
      }}
      title={title}
      className={`
        h-11
        w-11
        rounded-2xl
        border
        backdrop-blur-xl
        flex
        items-center
        justify-center
        transition-all
        duration-300
        ${
          color === 'blue'
            ? 'border-blue-500/20 bg-blue-500/10 text-blue-300'
            : ''
        }
        ${
          color === 'purple'
            ? 'border-purple-500/20 bg-purple-500/10 text-purple-300'
            : ''
        }
        ${
          color === 'emerald'
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
            : ''
        }
      `}
    >
      {icon}
    </motion.button>
  )
}

/* QUICK ACTION */
function QuickAction({
  label,
}: {
  label: string
}) {
  return (
    <motion.button
      whileHover={{
        scale: 1.03,
      }}
      whileTap={{
        scale: 0.96,
      }}
      className="
        rounded-2xl
        border
        border-white/10
        bg-white/[0.03]
        px-4
        py-2.5
        text-sm
        text-slate-300
        hover:bg-white/[0.06]
        transition-all
        duration-300
      "
    >
      {label}
    </motion.button>
  )
}