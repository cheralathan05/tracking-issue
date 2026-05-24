import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  CheckCheck,
  Download,
  Copy,
  MoreVertical,
  Reply,
  Smile,
  Sparkles,
  ShieldCheck,
  Clock3,
} from 'lucide-react'

import { useState } from 'react'

interface Message {
  id: string
  type: 'citizen' | 'officer' | 'admin'
  author: string
  avatar?: string
  content: string
  timestamp: string
  attachments?: Array<{
    id: string
    name: string
    type: string
  }>
  reactions?: Array<{
    emoji: string
    count: number
  }>
  isDelivered?: boolean
  isRead?: boolean
}

interface ChatMessageProps {
  message: Message
}

export default function ChatMessage({
  message,
}: ChatMessageProps) {
  const [hovered, setHovered] = useState(false)

  const isCitizen = message.type === 'citizen'
  const isAdmin = message.type === 'admin'

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 14,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
      }}
      transition={{
        duration: 0.3,
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={`
        relative
        flex
        gap-4
        ${isCitizen ? 'justify-end' : 'justify-start'}
      `}
    >

      {/* AVATAR */}
      {!isCitizen && (
        <div
          className={`
            flex-shrink-0
            h-11
            w-11
            rounded-2xl
            flex
            items-center
            justify-center
            font-bold
            text-sm
            border
            backdrop-blur-xl
            ${
              isAdmin
                ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
            }
          `}
        >
          {message.avatar}
        </div>
      )}

      {/* MESSAGE AREA */}
      <div
        className={`
          flex
          flex-col
          min-w-0
          max-w-[75%]
          ${
            isCitizen
              ? 'items-end'
              : 'items-start'
          }
        `}
      >

        {/* AUTHOR */}
        {!isCitizen && (
          <div className="mb-2 flex items-center gap-2 px-1">

            <p
              className={`
                text-sm
                font-semibold
                ${
                  isAdmin
                    ? 'text-purple-300'
                    : 'text-blue-300'
                }
              `}
            >
              {message.author}
            </p>

            {isAdmin && (
              <div className="flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-purple-300">
                <ShieldCheck className="h-3 w-3" />
                Admin
              </div>
            )}

          </div>
        )}

        {/* MESSAGE BUBBLE */}
        <motion.div
          whileHover={{
            scale: 1.01,
          }}
          className={`
            relative
            overflow-hidden
            min-w-0
            w-fit
            max-w-full
            rounded-[28px]
            border
            px-6
            py-5
            backdrop-blur-3xl
            shadow-[0_0_30px_rgba(59,130,246,0.08)]
            transition-all
            duration-300
            ${
              isCitizen
                ? `
                  border-blue-400/20
                  bg-gradient-to-br
                  from-blue-500
                  via-blue-600
                  to-indigo-600
                  text-white
                `
                : isAdmin
                  ? `
                    border-purple-500/20
                    bg-gradient-to-br
                    from-purple-500/10
                    to-pink-500/10
                    text-slate-100
                  `
                  : `
                    border-white/10
                    bg-white/[0.04]
                    text-slate-100
                  `
            }
          `}
        >

          {/* GLOW */}
          <div
            className={`
              absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100
              ${
                isCitizen
                  ? 'bg-blue-400/10'
                  : 'bg-white/5'
              }
            `}
          />

          {/* MESSAGE CONTENT */}
          <div className="relative z-10">

            {/* MESSAGE TEXT */}
            <p
              className="
                break-words
                whitespace-pre-wrap
                overflow-wrap-anywhere
                text-[15px]
                leading-relaxed
              "
            >
              {message.content}
            </p>

            {/* ATTACHMENTS */}
            {message.attachments &&
              message.attachments.length > 0 && (
                <div className="mt-5 space-y-3 border-t border-white/10 pt-5">

                  {message.attachments.map((attachment) => (
                    <motion.div
                      key={attachment.id}
                      whileHover={{
                        scale: 1.01,
                      }}
                      className="
                        flex
                        items-center
                        gap-3
                        rounded-2xl
                        border
                        border-white/10
                        bg-white/[0.04]
                        p-3
                        transition-all
                        duration-300
                        hover:bg-white/[0.06]
                        min-w-0
                      "
                    >

                      {/* ICON */}
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-lg">
                        {attachment.type === 'image'
                          ? '🖼️'
                          : '📎'}
                      </div>

                      {/* INFO */}
                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-medium text-slate-200">
                          {attachment.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Attachment
                        </p>

                      </div>

                      {/* DOWNLOAD */}
                      <button
                        className="
                          flex-shrink-0
                          rounded-xl
                          border
                          border-white/10
                          bg-white/[0.04]
                          p-2
                          transition-all
                          hover:bg-white/[0.08]
                        "
                      >
                        <Download className="h-4 w-4 text-slate-300" />
                      </button>

                    </motion.div>
                  ))}

                </div>
              )}

          </div>
        </motion.div>

        {/* REACTIONS */}
        {message.reactions &&
          message.reactions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 px-1">

              {message.reactions.map((reaction, index) => (
                <motion.button
                  key={index}
                  whileHover={{
                    scale: 1.06,
                  }}
                  whileTap={{
                    scale: 0.95,
                  }}
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-white/10
                    bg-white/[0.04]
                    px-3
                    py-1.5
                    text-xs
                    backdrop-blur-xl
                    transition-all
                    duration-300
                    hover:bg-white/[0.08]
                  "
                >

                  <span>{reaction.emoji}</span>

                  <span className="text-slate-400">
                    {reaction.count}
                  </span>

                </motion.button>
              ))}

            </div>
          )}

        {/* FOOTER */}
        <div
          className={`
            mt-3
            flex
            items-center
            gap-3
            px-1
            text-xs
            text-slate-500
          `}
        >

          <span>{message.timestamp}</span>

          {isCitizen &&
            message.isDelivered &&
            !message.isRead && (
              <Check className="h-3.5 w-3.5" />
            )}

          {isCitizen &&
            message.isRead && (
              <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
            )}

          {isAdmin && (
            <div className="flex items-center gap-1 text-purple-300">
              <Sparkles className="h-3 w-3" />
              Verified
            </div>
          )}

        </div>

      </div>

      {/* HOVER ACTIONS */}
      <AnimatePresence>

        {hovered && (
          <motion.div
            initial={{
              opacity: 0,
              x: isCitizen ? 10 : -10,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
            }}
            className="
              absolute
              top-0
              flex
              items-center
              gap-2
              rounded-2xl
              border
              border-white/10
              bg-[#0B1020]/95
              p-2
              backdrop-blur-3xl
              shadow-2xl
              z-20
            "
            style={{
              [isCitizen ? 'left' : 'right']:
                '-70px',
            }}
          >

            <HoverButton
              icon={<Reply className="h-4 w-4" />}
            />

            <HoverButton
              icon={<Smile className="h-4 w-4" />}
            />

            <HoverButton
              icon={<Copy className="h-4 w-4" />}
            />

            <HoverButton
              icon={<MoreVertical className="h-4 w-4" />}
            />

          </motion.div>
        )}

      </AnimatePresence>

    </motion.div>
  )
}

/* HOVER BUTTON */
function HoverButton({
  icon,
}: {
  icon: React.ReactNode
}) {
  return (
    <motion.button
      whileHover={{
        scale: 1.08,
      }}
      whileTap={{
        scale: 0.92,
      }}
      className="
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-xl
        border
        border-white/10
        bg-white/[0.03]
        text-slate-300
        transition-all
        duration-300
        hover:bg-white/[0.08]
      "
    >
      {icon}
    </motion.button>
  )
}