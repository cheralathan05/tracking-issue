import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  MessageSquare,
  Zap,
  Clock,
  MoreHorizontal,
} from 'lucide-react'

interface NeoChatHeroProps {
  title: string
  placeholder?: string
  onQuickAction?: (action: string) => void
  actionButtons?: Array<{
    id: string
    label: string
    icon: React.ReactNode
  }>
}

export default function NeoChatHero({
  title,
  placeholder = 'Ask anything you want...',
  onQuickAction,
  actionButtons = [
    {
      id: 'report',
      label: 'Report Issue',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'message',
      label: 'Send Message',
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: 'escalate',
      label: 'Escalate',
      icon: <Zap className="w-4 h-4" />,
    },
    {
      id: 'track',
      label: 'Track Status',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: 'more',
      label: 'More',
      icon: <MoreHorizontal className="w-4 h-4" />,
    },
  ],
}: NeoChatHeroProps) {
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleQuickAction = (actionId: string) => {
    if (onQuickAction) {
      onQuickAction(actionId)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full min-h-screen bg-gradient-to-b from-[#09090b] via-[#121215] to-[#18181b] flex items-center justify-center overflow-hidden"
    >
      {/* Ambient glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-white/[0.03] rounded-full blur-[140px] -z-10" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-zinc-400/[0.04] rounded-full blur-[140px] -z-10" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-white/[0.02] rounded-full blur-[140px] -z-10" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl px-6 py-20 mx-auto">
        {/* Title section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
            {title}
          </h1>
          <p className="text-zinc-400 text-base">
            Get instant support and track your complaints
          </p>
        </motion.div>

        {/* Input section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-8"
        >
          <div
            className={`relative rounded-2xl transition-all duration-300 ${
              isFocused
                ? 'border-white/50 shadow-[0_0_30px_rgba(255,255,255,0.12)]'
                : 'border-zinc-800/80 shadow-[0_0_20px_rgba(0,0,0,0.5)]'
            } border backdrop-blur-xl bg-zinc-950/60`}
          >
            {/* Inner glow */}
            <div
              className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                isFocused ? 'opacity-100' : 'opacity-0'
              } pointer-events-none`}
              style={{
                background:
                  'radial-gradient(circle at top, rgba(255,255,255,0.06), transparent)',
              }}
            />

            {/* Input field */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className="relative w-full px-6 py-4 bg-transparent text-white placeholder-zinc-500 focus:outline-none font-medium"
            />

            {/* Input border effect */}
            <div
              className={`absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300 ${
                isFocused ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: `linear-gradient(90deg, 
                  transparent,
                  rgba(255,255,255,0.18) 50%,
                  transparent)`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
              }}
            />
          </div>

          {/* Model selector hint */}
          <div className="mt-4 flex items-center justify-between px-2">
            <span className="text-sm text-zinc-500">Chat Mode: Smart Assistant</span>
            <button className="text-sm text-zinc-400 hover:text-white transition-colors">
              Choose mode ↓
            </button>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          {actionButtons.map((button, index) => (
            <motion.button
              key={button.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              onClick={() => handleQuickAction(button.id)}
              className="
                flex items-center gap-2
                px-4 py-2.5
                rounded-xl
                border border-zinc-800/80
                bg-zinc-900/50 hover:bg-zinc-800/80
                text-zinc-300 hover:text-white
                transition-all duration-200
                text-sm font-medium
                hover:border-zinc-700
                group
              "
            >
              <span className="transition-transform group-hover:scale-110">
                {button.icon}
              </span>
              {button.label}
            </motion.button>
          ))}
        </motion.div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </motion.div>
  )
}
