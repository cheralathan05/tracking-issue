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
      className="relative w-full min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#0F1535] to-[#1A1F3A] flex items-center justify-center overflow-hidden"
    >
      {/* Ambient glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] -z-10" />
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
          <p className="text-slate-400 text-base">
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
                ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)]'
                : 'border-slate-700/50 shadow-[0_0_20px_rgba(0,0,0,0.3)]'
            } border backdrop-blur-xl bg-slate-900/40`}
          >
            {/* Inner glow */}
            <div
              className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${
                isFocused ? 'opacity-100' : 'opacity-0'
              } pointer-events-none`}
              style={{
                background:
                  'radial-gradient(circle at top, rgba(59,130,246,0.1), transparent)',
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
              className="relative w-full px-6 py-4 bg-transparent text-white placeholder-slate-500 focus:outline-none font-medium"
            />

            {/* Input border effect */}
            <div
              className={`absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300 ${
                isFocused ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                background: `linear-gradient(90deg, 
                  transparent,
                  rgba(59,130,246,0.3) 50%,
                  transparent)`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
              }}
            />
          </div>

          {/* Model selector hint */}
          <div className="mt-4 flex items-center justify-between px-2">
            <span className="text-sm text-slate-500">Chat Mode: Smart Assistant</span>
            <button className="text-sm text-slate-400 hover:text-slate-300 transition-colors">
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
                border border-slate-700/50
                bg-slate-900/30 hover:bg-slate-800/50
                text-slate-300 hover:text-white
                transition-all duration-200
                text-sm font-medium
                hover:border-slate-600
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
