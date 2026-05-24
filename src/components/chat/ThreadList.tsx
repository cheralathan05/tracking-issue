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
}: ThreadListProps) {
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
        rounded-[32px]
        border
        border-white/10
        bg-gradient-to-b
        from-[#0B1020]/95
        via-[#091120]/92
        to-[#08101E]/95
        backdrop-blur-3xl
        shadow-[0_0_80px_rgba(59,130,246,0.08)]
      "
    >

      {/* =====================================================
         BACKGROUND GLOW
      ===================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute top-[-120px] left-[-60px] h-[260px] w-[260px] rounded-full bg-blue-500/10 blur-[120px]" />

        <div className="absolute bottom-[-120px] right-[-60px] h-[260px] w-[260px] rounded-full bg-purple-500/10 blur-[120px]" />

      </div>

      {/* =====================================================
         HEADER
      ===================================================== */}
      <div
        className="
          relative
          z-10
          border-b
          border-white/10
          bg-white/[0.03]
          px-6
          py-6
          backdrop-blur-3xl
        "
      >

        {/* TOP */}
        <div className="flex items-start justify-between gap-4">

          <div>

            <div className="flex items-center gap-3 flex-wrap">

              <span
                className="
                  rounded-full
                  border
                  border-blue-500/20
                  bg-blue-500/10
                  px-3
                  py-1
                  text-[11px]
                  uppercase
                  tracking-[0.25em]
                  text-blue-300
                "
              >
                Realtime Threads
              </span>

              <span
                className="
                  flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-emerald-500/20
                  bg-emerald-500/10
                  px-3
                  py-1
                  text-xs
                  text-emerald-300
                "
              >
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>

            </div>

            <h2
              className="
                mt-5
                text-3xl
                font-black
                tracking-tight
                text-white
              "
            >
              Complaint Threads
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Unified complaint communication
              workspace.
            </p>

          </div>

          {/* UNREAD */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 10px rgba(249,115,22,0.2)',
                '0 0 25px rgba(249,115,22,0.45)',
                '0 0 10px rgba(249,115,22,0.2)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="
              flex
              h-16
              min-w-[70px]
              flex-col
              items-center
              justify-center
              rounded-3xl
              border
              border-orange-500/20
              bg-orange-500/10
              px-4
            "
          >

            <p className="text-2xl font-black text-orange-300">
              {unreadCount}
            </p>

            <p className="text-[10px] uppercase tracking-[0.2em] text-orange-200">
              Unread
            </p>

          </motion.div>

        </div>

      </div>

      {/* =====================================================
         THREADS
      ===================================================== */}
      <div
        className="
          relative
          z-10
          flex-1
          min-h-0
          overflow-y-auto
          px-4
          py-5
          space-y-4
        "
      >

        {mockThreads.map((thread, index) => {
          const config =
            statusConfig[thread.status]

          const StatusIcon =
            config.icon

          return (
            <motion.button
              key={thread.id}
              onClick={() =>
                onSelectThread(thread.id)
              }
              initial={{
                opacity: 0,
                x: -14,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay: index * 0.05,
              }}
              whileHover={{
                scale: 1.015,
                y: -2,
              }}
              whileTap={{
                scale: 0.98,
              }}
              className={`
                group
                relative
                w-full
                overflow-hidden
                rounded-[28px]
                border
                p-5
                text-left
                transition-all
                duration-300
                ${
                  selectedThread === thread.id
                    ? `
                      border-blue-500/30
                      bg-gradient-to-br
                      from-blue-500/15
                      to-indigo-500/10
                      shadow-[0_0_40px_rgba(59,130,246,0.18)]
                    `
                    : `
                      border-white/10
                      bg-white/[0.03]
                      hover:bg-white/[0.05]
                    `
                }
              `}
            >

              {/* ACTIVE GLOW */}
              {selectedThread ===
                thread.id && (
                <motion.div
                  layoutId="active-thread"
                  className="
                    absolute
                    inset-0
                    bg-blue-500/[0.04]
                  "
                  transition={{
                    type: 'spring',
                    bounce: 0.2,
                  }}
                />
              )}

              {/* SIDE INDICATOR */}
              {selectedThread ===
                thread.id && (
                <motion.div
                  layoutId="active-side"
                  className="
                    absolute
                    left-0
                    top-1/2
                    h-16
                    w-1.5
                    -translate-y-1/2
                    rounded-r-full
                    bg-blue-400
                  "
                />
              )}

              {/* CONTENT */}
              <div className="relative z-10">

                {/* =========================================
                   TOP
                ========================================= */}
                <div className="flex items-start justify-between gap-4">

                  {/* LEFT */}
                  <div className="min-w-0 flex-1">

                    <div className="flex items-center gap-3 flex-wrap">

                      <span
                        className="
                          rounded-full
                          border
                          border-blue-500/20
                          bg-blue-500/10
                          px-3
                          py-1
                          text-[11px]
                          font-medium
                          tracking-[0.15em]
                          text-blue-300
                        "
                      >
                        {thread.complaintId}
                      </span>

                      <div
                        className={`
                          flex
                          items-center
                          gap-2
                          rounded-full
                          border
                          px-3
                          py-1
                          text-xs
                          ${
                            config.color ===
                            'blue'
                              ? `
                                border-blue-500/20
                                bg-blue-500/10
                                text-blue-300
                              `
                              : config.color ===
                                  'orange'
                                ? `
                                  border-orange-500/20
                                  bg-orange-500/10
                                  text-orange-300
                                `
                                : config.color ===
                                    'red'
                                  ? `
                                    border-red-500/20
                                    bg-red-500/10
                                    text-red-300
                                  `
                                  : `
                                    border-emerald-500/20
                                    bg-emerald-500/10
                                    text-emerald-300
                                  `
                          }
                        `}
                      >

                        <StatusIcon className="h-3 w-3" />

                        {config.label}

                      </div>

                    </div>

                    {/* TITLE */}
                    <h3
                      className="
                        mt-4
                        truncate
                        text-lg
                        font-bold
                        text-white
                        transition-colors
                        group-hover:text-blue-200
                      "
                    >
                      {thread.title}
                    </h3>

                  </div>

                  {/* PRIORITY */}
                  <div
                    className={`
                      h-3
                      w-3
                      flex-shrink-0
                      rounded-full
                      ${
                        thread.priority ===
                        'critical'
                          ? 'bg-red-400'
                          : thread.priority ===
                              'high'
                            ? 'bg-orange-400'
                            : thread.priority ===
                                'medium'
                              ? 'bg-blue-400'
                              : 'bg-slate-400'
                      }
                    `}
                  />

                </div>

                {/* =========================================
                   TAGS
                ========================================= */}
                <div className="mt-5 flex flex-wrap gap-3">

                  <Tag
                    icon={Building2}
                    label={thread.department}
                    color="blue"
                  />

                  <Tag
                    icon={MapPin}
                    label={thread.district}
                    color="slate"
                  />

                </div>

                {/* =========================================
                   MESSAGE
                ========================================= */}
                <div
                  className="
                    mt-5
                    rounded-2xl
                    border
                    border-white/5
                    bg-white/[0.03]
                    p-4
                  "
                >

                  <div className="flex items-start gap-3">

                    <div
                      className="
                        flex
                        h-10
                        w-10
                        flex-shrink-0
                        items-center
                        justify-center
                        rounded-2xl
                        bg-indigo-500/10
                      "
                    >

                      <MessageSquare className="h-4 w-4 text-indigo-300" />

                    </div>

                    <div className="min-w-0 flex-1">

                      <p
                        className="
                          line-clamp-2
                          break-words
                          text-sm
                          leading-7
                          text-slate-300
                        "
                      >
                        {thread.lastMessage}
                      </p>

                    </div>

                  </div>

                </div>

                {/* =========================================
                   FOOTER
                ========================================= */}
                <div
                  className="
                    mt-5
                    flex
                    items-center
                    justify-between
                    gap-4
                  "
                >

                  {/* OFFICER */}
                  <div className="flex items-center gap-3 min-w-0">

                    <div
                      className="
                        flex
                        h-11
                        w-11
                        flex-shrink-0
                        items-center
                        justify-center
                        rounded-2xl
                        bg-gradient-to-br
                        from-blue-400
                        to-indigo-600
                        font-black
                        text-white
                      "
                    >
                      {thread.avatar}
                    </div>

                    <div className="min-w-0">

                      <p className="text-sm font-medium text-white truncate">
                        {thread.officer}
                      </p>

                      <div className="mt-1 flex items-center gap-2">

                        {thread.isTyping ? (
                          <div className="flex gap-1">

                            {[0, 1, 2].map(
                              (dot) => (
                                <motion.div
                                  key={dot}
                                  animate={{
                                    y: [
                                      0,
                                      -4,
                                      0,
                                    ],
                                  }}
                                  transition={{
                                    delay:
                                      dot *
                                      0.1,
                                    duration: 0.7,
                                    repeat:
                                      Infinity,
                                  }}
                                  className="
                                    h-1.5
                                    w-1.5
                                    rounded-full
                                    bg-blue-400
                                  "
                                />
                              )
                            )}

                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">
                            {
                              thread.lastMessageTime
                            }
                          </p>
                        )}

                      </div>

                    </div>

                  </div>

                  {/* RIGHT */}
                  <div className="flex items-center gap-3">

                    {/* SLA */}
                    {thread.slaRemaining !==
                      'Closed' && (
                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          rounded-full
                          border
                          border-orange-500/20
                          bg-orange-500/10
                          px-3
                          py-2
                        "
                      >

                        <Clock3 className="h-3.5 w-3.5 text-orange-300" />

                        <span className="text-xs font-medium text-orange-300">
                          {
                            thread.slaRemaining
                          }
                        </span>

                      </div>
                    )}

                    {/* UNREAD */}
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
                            h-8
                            min-w-[32px]
                            items-center
                            justify-center
                            rounded-full
                            bg-gradient-to-r
                            from-orange-500
                            to-red-500
                            px-2
                            text-xs
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

                    {/* ARROW */}
                    <ChevronRight
                      className="
                        h-5
                        w-5
                        text-slate-500
                        transition-transform
                        duration-300
                        group-hover:translate-x-1
                      "
                    />

                  </div>

                </div>

              </div>

            </motion.button>
          )
        })}

      </div>

    </motion.div>
  )
}

/* =========================================================
   TAG
========================================================= */

function Tag({
  icon: Icon,
  label,
  color,
}: any) {
  return (
    <div
      className={`
        flex
        items-center
        gap-2
        rounded-full
        border
        px-3
        py-2
        text-xs
        ${
          color === 'blue'
            ? `
              border-blue-500/20
              bg-blue-500/10
              text-blue-300
            `
            : `
              border-white/10
              bg-white/[0.03]
              text-slate-300
            `
        }
      `}
    >

      <Icon className="h-3.5 w-3.5" />

      <span>{label}</span>

    </div>
  )
}