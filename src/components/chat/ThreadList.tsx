import { motion, AnimatePresence } from 'framer-motion'

import {
  Clock3,
  AlertTriangle,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Zap,
  CheckCircle2,
  Activity,
  ChevronRight,
  MapPin,
  Building2,
} from 'lucide-react'

/* =========================================================
   TYPES
========================================================= */

interface Thread {
  id: string
  complaintId: string
  title: string
  department: string
  district: string
  status:
    | 'open'
    | 'escalated'
    | 'urgent'
    | 'resolved'
  priority:
    | 'low'
    | 'medium'
    | 'high'
    | 'critical'
  officer: string
  lastMessage: string
  unreadCount: number
  slaRemaining: string
  isTyping?: boolean
  lastMessageTime: string
  avatar?: string
}

interface ThreadListProps {
  selectedThread: string | null
  onSelectThread: (
    threadId: string
  ) => void
  unreadCount: number
  threads?: Thread[]
  density?: 'default' | 'compact'
}

/* =========================================================
   MOCK DATA
========================================================= */

const mockThreads: Thread[] = [
  {
    id: 'complaint-2024-001',
    complaintId: '#CBF-2024-001',
    title: 'Pothole on Main Street',
    department: 'Public Works',
    district: 'Downtown',
    status: 'open',
    priority: 'high',
    officer: 'Officer Sarah',
    lastMessage:
      'I have escalated your case to the senior engineering team.',
    unreadCount: 2,
    slaRemaining: '4h 23m',
    isTyping: false,
    lastMessageTime: '2 min ago',
    avatar: 'S',
  },
  {
    id: 'complaint-2024-002',
    complaintId: '#CBF-2024-002',
    title: 'Water Supply Issue',
    department: 'Water & Sanitation',
    district: 'North Zone',
    status: 'escalated',
    priority: 'critical',
    officer: 'Officer Mike',
    lastMessage:
      'Checking with the engineering response unit.',
    unreadCount: 1,
    slaRemaining: '1h 15m',
    isTyping: true,
    lastMessageTime: 'typing...',
    avatar: 'M',
  },
  {
    id: 'complaint-2024-003',
    complaintId: '#CBF-2024-003',
    title: 'Street Lights Not Working',
    department: 'Infrastructure',
    district: 'West Zone',
    status: 'urgent',
    priority: 'high',
    officer: 'Officer Alex',
    lastMessage:
      'We will fix this within 24 hours.',
    unreadCount: 0,
    slaRemaining: '18h 40m',
    isTyping: false,
    lastMessageTime: '45 min ago',
    avatar: 'A',
  },
  {
    id: 'complaint-2024-004',
    complaintId: '#CBF-2024-004',
    title: 'Garbage Collection Delay',
    department: 'Sanitation',
    district: 'South Zone',
    status: 'resolved',
    priority: 'medium',
    officer: 'Officer James',
    lastMessage:
      'Issue resolved. Thank you for reporting.',
    unreadCount: 0,
    slaRemaining: 'Closed',
    isTyping: false,
    lastMessageTime: '2 days ago',
    avatar: 'J',
  },
]

/* =========================================================
   CONFIG
========================================================= */

const statusConfig = {
  open: {
    label: 'Open',
    color: 'blue',
    icon: Activity,
  },
  escalated: {
    label: 'Escalated',
    color: 'orange',
    icon: AlertTriangle,
  },
  urgent: {
    label: 'Urgent',
    color: 'red',
    icon: Zap,
  },
  resolved: {
    label: 'Resolved',
    color: 'emerald',
    icon: CheckCircle2,
  },
}

/* =========================================================
   PREMIUM THREAD LIST
========================================================= */

export default function ThreadList({
  selectedThread,
  onSelectThread,
  unreadCount,
  threads,
  density = 'default',
}: ThreadListProps) {
  const visibleThreads = threads ?? mockThreads
  const compact = density === 'compact'

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: -18,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.5,
      }}
      className="
        relative
        flex
        h-full
        min-h-0
        flex-col
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
         CINEMATIC BACKGROUND GLOW
      ===================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">

        <div 
          className="
            absolute
            top-[-100px]
            left-0
            h-[300px]
            w-[300px]
            rounded-full
            bg-blue-500/12
            blur-[120px]
          "
        />

        <div 
          className="
            absolute
            bottom-[-100px]
            right-0
            h-[280px]
            w-[280px]
            rounded-full
            bg-indigo-500/10
            blur-[120px]
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

        {/* HEADER CONTENT */}
        <div className={`space-y-4 ${compact ? 'space-y-3' : ''}`}>

          {/* TOP ROW */}
          <div className="flex items-start justify-between gap-4">

            <div className="flex-1 min-w-0">

              <div className="flex items-center gap-2 flex-wrap">

                <span
                  className="
                    rounded-full
                    border
                    border-blue-500/30
                    bg-blue-500/10
                    px-3
                    py-1
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.3em]
                    text-blue-300
                  "
                >
                  Threads
                </span>

                <span
                  className="
                    flex
                    items-center
                    gap-1.5
                    rounded-full
                    border
                    border-emerald-500/30
                    bg-emerald-500/10
                    px-3
                    py-1
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.3em]
                    text-emerald-300
                  "
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>

              </div>

              <h2
                className="
                  mt-3
                  text-[22px]
                  font-black
                  tracking-tight
                  text-white
                  leading-tight
                "
              >
                Active Complaints
              </h2>

              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Real-time complaint communication
              </p>

            </div>

            {/* UNREAD BADGE */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 8px rgba(249,115,22,0.15)',
                  '0 0 20px rgba(249,115,22,0.35)',
                  '0 0 8px rgba(249,115,22,0.15)',
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
              }}
              className="
                flex
                h-12
                min-w-[60px]
                flex-col
                items-center
                justify-center
                rounded-xl
                border
                border-orange-500/25
                bg-gradient-to-br
                from-orange-500/15
                to-orange-500/5
                px-3
                flex-shrink-0
              "
            >

              <p className="text-xl font-black text-orange-300">
                {unreadCount}
              </p>

              <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-orange-300/80">
                Unread
              </p>

            </motion.div>

          </div>

        </div>

      </div>

      {/* =====================================================
         SCROLLABLE THREAD LIST
      ===================================================== */}
      <div
        className={`
          relative
          z-10
          flex-1
          min-h-0
          overflow-y-auto
          px-4
          py-3
          space-y-3
          [&>*]:min-h-0
          ${compact ? 'px-3 py-3 space-y-2' : ''}
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-white/10
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb:hover]:bg-white/20
        `}
      >

        <AnimatePresence>
          {visibleThreads.map((thread, index) => {
            const config =
              statusConfig[thread.status]

            const StatusIcon =
              config.icon

            const isSelected =
              selectedThread === thread.id

            return (
              <motion.button
                key={thread.id}
                onClick={() =>
                  onSelectThread(thread.id)
                }
                initial={{
                  opacity: 0,
                  x: -12,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -12,
                }}
                transition={{
                  delay: index * 0.04,
                  duration: 0.3,
                }}
                whileHover={{
                  scale: 1.02,
                  y: -1,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                className={`
                  group
                  relative
                  w-full
                  overflow-hidden
                  rounded-[20px]
                  border
                  p-3.5
                  text-left
                  transition-all
                  duration-300
                  ${
                    isSelected
                      ? `
                        border-blue-500/40
                        bg-gradient-to-br
                        from-blue-500/12
                        via-blue-500/8
                        to-indigo-500/6
                        shadow-[0_0_30px_rgba(59,130,246,0.15),inset_0_0_30px_rgba(59,130,246,0.08)]
                      `
                      : `
                        border-white/8
                        bg-white/[0.03]
                        hover:bg-white/[0.05]
                        hover:border-white/12
                      `
                  }
                `}
              >

                {/* ACTIVE INDICATOR GLOW */}
                {isSelected && (
                  <motion.div
                    layoutId="active-thread-bg"
                    className="
                      absolute
                      inset-0
                      rounded-[22px]
                      bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_70%)]
                    "
                    transition={{
                      type: 'spring',
                      bounce: 0.1,
                    }}
                  />
                )}

                {/* ACTIVE LEFT BORDER */}
                {isSelected && (
                  <motion.div
                    layoutId="active-border"
                    className="
                      absolute
                      left-0
                      top-0
                      bottom-0
                      w-1
                      rounded-r-full
                      bg-gradient-to-b
                      from-blue-400
                      via-blue-500
                      to-indigo-500
                    "
                    transition={{
                      type: 'spring',
                      bounce: 0.2,
                    }}
                  />
                )}

                {/* CONTENT */}
                <div className="relative z-10 space-y-3">

                  {/* =========================================
                     TOP: ID & STATUS
                  ========================================= */}
                  <div className="flex items-center justify-between gap-3">

                    <div className="flex items-center gap-2 min-w-0">

                      <span
                        className="
                          rounded-full
                          border
                          border-blue-500/30
                          bg-blue-500/10
                          px-2.5
                          py-1
                          text-[10px]
                          font-semibold
                          text-blue-300
                          flex-shrink-0
                        "
                      >
                        {thread.complaintId}
                      </span>

                      <div
                        className={`
                          flex
                          items-center
                          gap-1
                          rounded-full
                          border
                          px-2.5
                          rounded-[20px]
                          text-[10px]
                          p-3.5
                          flex-shrink-0
                          ${
                            config.color ===
                            'blue'
                              ? `
                                border-blue-500/30
                                bg-blue-500/10
                                text-blue-300
                              `
                              : config.color ===
                                  'orange'
                                ? `
                                  border-orange-500/30
                                  bg-orange-500/10
                                  text-orange-300
                                `
                                : config.color ===
                                    'red'
                                  ? `
                                    border-red-500/30
                                    bg-red-500/10
                                    text-red-300
                                  `
                                  : `
                                    border-emerald-500/30
                                    bg-emerald-500/10
                                    text-emerald-300
                                  `
                          }
                        `}
                      >

                        <StatusIcon className="h-3 w-3" />

                        <span>{config.label}</span>

                      </div>

                    </div>

                    {/* PRIORITY DOT */}
                    <div
                      className={`
                        h-2.5
                        w-2.5
                        flex-shrink-0
                        rounded-full
                        ${
                          thread.priority ===
                          'critical'
                            ? 'bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.4)]'
                            : thread.priority ===
                                'high'
                              ? 'bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.3)]'
                              : thread.priority ===
                                  'medium'
                                ? 'bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.3)]'
                                : 'bg-slate-400'
                        }
                      `}
                    />

                  </div>

                  {/* =========================================
                     TITLE
                  ========================================= */}
                  <div>

                    <h3
                      className="
                        truncate
                        text-sm
                        font-bold
                        text-white
                        transition-colors
                        group-hover:text-blue-200
                      "
                      title={thread.title}
                    >
                      {thread.title}
                    </h3>

                  </div>

                  {/* =========================================
                     METADATA: DEPARTMENT & DISTRICT
                  ========================================= */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">

                    <div className="flex items-center gap-1.5 min-w-0">
                      <Building2 className="h-3 w-3 flex-shrink-0 text-blue-400/60" />
                      <span className="truncate">{thread.department}</span>
                    </div>

                    <span className="text-white/20">•</span>

                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="h-3 w-3 flex-shrink-0 text-blue-400/60" />
                      <span className="truncate">{thread.district}</span>
                    </div>

                  </div>

                  {/* =========================================
                     OFFICER & MESSAGE PREVIEW
                  ========================================= */}
                  <div
                    className="
                      rounded-[16px]
                      border
                      border-white/6
                      bg-white/[0.02]
                      p-3
                      space-y-2
                    "
                  >

                    {/* OFFICER */}
                    <div className="flex items-center gap-2.5">

                      <div
                        className="
                          flex
                          h-8
                          w-8
                          flex-shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-gradient-to-br
                          from-blue-400
                          to-indigo-600
                          font-bold
                          text-xs
                          text-white
                        "
                      >
                        {thread.avatar}
                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="text-xs font-semibold text-white">
                          {thread.officer}
                        </p>

                        {thread.isTyping ? (
                          <div className="flex gap-1 mt-0.5">

                            {[0, 1, 2].map(
                              (dot) => (
                                <motion.div
                                  key={dot}
                                  animate={{
                                    y: [
                                      0,
                                      -2,
                                      0,
                                    ],
                                  }}
                                  transition={{
                                    delay:
                                      dot *
                                      0.1,
                                    duration: 0.6,
                                    repeat:
                                      Infinity,
                                  }}
                                  className="
                                    h-1
                                    w-1
                                    rounded-full
                                    bg-blue-400
                                  "
                                />
                              )
                            )}

                          </div>
                        ) : (
                          <p className="text-[9px] text-slate-500 mt-0.5">
                            {
                              thread.lastMessageTime
                            }
                          </p>
                        )}

                      </div>

                    </div>

                    {/* BOTTOM ROW: SLA & UNREAD */}
                    <div className="flex items-center justify-between gap-2 pt-1">

                      {/* SLA */}
                      {thread.slaRemaining !==
                        'Closed' && (
                        <div
                          className="
                            flex
                            items-center
                            gap-1.5
                            rounded-full
                            border
                            border-orange-500/25
                            bg-orange-500/8
                            px-2.5
                            py-1
                          "
                        >

                          <Clock3 className="h-3 w-3 text-orange-300" />

                          <span className="text-[9px] font-semibold text-orange-300">
                            {
                              thread.slaRemaining
                            }
                          </span>

                        </div>
                      )}

                      {/* UNREAD BADGE */}
                      <AnimatePresence>

                        {thread.unreadCount >
                          0 && (
                          <motion.div
                            initial={{
                              scale: 0,
                            }}
                            animate={{
                              scale: 1,
                            }}
                            exit={{
                              scale: 0,
                            }}
                            className="
                              flex
                              h-6
                              min-w-[24px]
                              items-center
                              justify-center
                              rounded-full
                              bg-gradient-to-r
                              from-orange-500
                              to-red-500
                              px-1.5
                              text-[10px]
                              font-bold
                              text-white
                            "
                          >
                            {
                              thread.unreadCount
                            }
                          </motion.div>
                        )}

                      </AnimatePresence>

                    </div>

                  </div>

                </div>

              </motion.button>
            )
          })}
        </AnimatePresence>

      </div>

    </motion.div>
  )
}
