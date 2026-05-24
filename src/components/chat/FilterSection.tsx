import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import {
  Search,
  Filter,
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Zap,
  Clock3,
  ChevronDown,
} from 'lucide-react'

/* =========================================================
   FILTER CONFIG
========================================================= */

const filters = [
  {
    id: 'all',
    label: 'All Threads',
    icon: Activity,
    color: 'blue',
    count: 124,
  },
  {
    id: 'open',
    label: 'Open',
    icon: Clock3,
    color: 'indigo',
    count: 42,
  },
  {
    id: 'escalated',
    label: 'Escalated',
    icon: AlertTriangle,
    color: 'orange',
    count: 11,
  },
  {
    id: 'urgent',
    label: 'Urgent',
    icon: Zap,
    color: 'red',
    count: 8,
  },
  {
    id: 'resolved',
    label: 'Resolved',
    icon: CheckCircle2,
    color: 'emerald',
    count: 63,
  },
]

/* =========================================================
   PREMIUM FILTER SECTION
========================================================= */

export default function FilterSection() {
  const [activeFilter, setActiveFilter] =
    useState('all')

  const [searchQuery, setSearchQuery] =
    useState('')

  const [showAdvanced, setShowAdvanced] =
    useState(false)

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.55,
      }}
      className="space-y-5"
    >

      {/* =====================================================
         SEARCH CONTAINER
      ===================================================== */}
      <motion.div
        whileHover={{
          scale: 1.01,
        }}
        className="
          group
          relative
          overflow-hidden
          rounded-[28px]
          border
          border-white/10
          bg-gradient-to-br
          from-[#0B1020]/95
          via-[#0A1122]/90
          to-[#09101F]/95
          backdrop-blur-3xl
          shadow-[0_0_40px_rgba(59,130,246,0.08)]
        "
      >

        {/* GLOW */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">

          <div className="absolute top-[-40px] left-[20%] h-[120px] w-[120px] rounded-full bg-blue-500/10 blur-[60px]" />

          <div className="absolute bottom-[-40px] right-[15%] h-[120px] w-[120px] rounded-full bg-purple-500/10 blur-[60px]" />

        </div>

        {/* CONTENT */}
        <div className="relative z-10 p-5">

          {/* SEARCH BAR */}
          <div
            className="
              flex
              items-center
              gap-4
              rounded-[24px]
              border
              border-white/10
              bg-white/[0.03]
              px-5
              py-4
              transition-all
              duration-300
              group-hover:border-blue-500/20
            "
          >

            {/* ICON */}
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-2xl
                border
                border-blue-500/20
                bg-blue-500/10
              "
            >
              <Search className="h-5 w-5 text-blue-300" />
            </div>

            {/* INPUT */}
            <input
              type="text"
              placeholder="Search complaints, officers, IDs, locations..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              className="
                flex-1
                bg-transparent
                text-[15px]
                text-slate-100
                placeholder:text-slate-500
                outline-none
              "
            />

            {/* CLEAR */}
            <AnimatePresence>

              {searchQuery && (
                <motion.button
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                  }}
                  whileHover={{
                    scale: 1.08,
                  }}
                  whileTap={{
                    scale: 0.92,
                  }}
                  onClick={() =>
                    setSearchQuery('')
                  }
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/[0.03]
                    transition-all
                    hover:bg-white/[0.06]
                  "
                >

                  <X className="h-4 w-4 text-slate-400" />

                </motion.button>
              )}

            </AnimatePresence>

          </div>

          {/* TOP STATUS */}
          <div className="mt-5 flex flex-wrap items-center gap-3">

            <StatusBadge
              icon={ShieldCheck}
              label="Realtime Connected"
              color="emerald"
            />

            <StatusBadge
              icon={Sparkles}
              label="AI Thread Analysis"
              color="blue"
            />

            <StatusBadge
              icon={Activity}
              label="124 Active Conversations"
              color="purple"
            />

          </div>

        </div>

      </motion.div>

      {/* =====================================================
         FILTER ROW
      ===================================================== */}
      <motion.div
        initial={{
          opacity: 0,
          x: -20,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        transition={{
          duration: 0.5,
          delay: 0.08,
        }}
        className="
          relative
          overflow-hidden
          rounded-[28px]
          border
          border-white/10
          bg-white/[0.03]
          p-4
          backdrop-blur-3xl
        "
      >

        {/* GLOW */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">

          <div className="absolute top-[-30px] right-[20%] h-[100px] w-[100px] rounded-full bg-indigo-500/10 blur-[60px]" />

        </div>

        {/* FILTERS */}
        <div className="relative z-10 flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">

          {/* ICON */}
          <div
            className="
              flex
              h-11
              w-11
              flex-shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              border-white/10
              bg-white/[0.03]
            "
          >

            <Filter className="h-5 w-5 text-slate-300" />

          </div>

          {/* FILTER PILLS */}
          {filters.map((filter, index) => {
            const Icon = filter.icon

            return (
              <motion.button
                key={filter.id}
                onClick={() =>
                  setActiveFilter(filter.id)
                }
                initial={{
                  opacity: 0,
                  scale: 0.92,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  delay: index * 0.05,
                }}
                whileHover={{
                  scale: 1.05,
                }}
                whileTap={{
                  scale: 0.96,
                }}
                className={`
                  relative
                  flex
                  flex-shrink-0
                  items-center
                  gap-3
                  overflow-hidden
                  rounded-full
                  border
                  px-5
                  py-3
                  transition-all
                  duration-300
                  ${
                    activeFilter === filter.id
                      ? `
                        border-blue-500/30
                        bg-gradient-to-r
                        from-blue-500/15
                        to-indigo-500/15
                        text-white
                        shadow-[0_0_30px_rgba(59,130,246,0.2)]
                      `
                      : `
                        border-white/10
                        bg-white/[0.03]
                        text-slate-300
                        hover:bg-white/[0.06]
                      `
                  }
                `}
              >

                {/* ACTIVE GLOW */}
                {activeFilter === filter.id && (
                  <motion.div
                    layoutId="active-filter"
                    className="
                      absolute
                      inset-0
                      bg-blue-500/5
                    "
                    transition={{
                      type: 'spring',
                      bounce: 0.2,
                    }}
                  />
                )}

                {/* ICON */}
                <div
                  className={`
                    relative
                    z-10
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-full
                    ${
                      filter.color === 'blue'
                        ? 'bg-blue-500/15 text-blue-300'
                        : filter.color === 'indigo'
                          ? 'bg-indigo-500/15 text-indigo-300'
                          : filter.color === 'orange'
                            ? 'bg-orange-500/15 text-orange-300'
                            : filter.color === 'red'
                              ? 'bg-red-500/15 text-red-300'
                              : 'bg-emerald-500/15 text-emerald-300'
                    }
                  `}
                >

                  <Icon className="h-4 w-4" />

                </div>

                {/* TEXT */}
                <div className="relative z-10 text-left">

                  <p className="text-sm font-semibold">
                    {filter.label}
                  </p>

                  <p className="text-xs text-slate-500">
                    {filter.count} threads
                  </p>

                </div>

              </motion.button>
            )
          })}

          {/* ADVANCED */}
          <motion.button
            whileHover={{
              scale: 1.04,
            }}
            whileTap={{
              scale: 0.96,
            }}
            onClick={() =>
              setShowAdvanced(!showAdvanced)
            }
            className="
              ml-auto
              flex
              flex-shrink-0
              items-center
              gap-3
              rounded-full
              border
              border-white/10
              bg-white/[0.03]
              px-5
              py-3
              transition-all
              hover:bg-white/[0.06]
            "
          >

            <Sparkles className="h-4 w-4 text-blue-300" />

            <span className="text-sm text-slate-300">
              Advanced
            </span>

            <motion.div
              animate={{
                rotate: showAdvanced
                  ? 180
                  : 0,
              }}
            >

              <ChevronDown className="h-4 w-4 text-slate-400" />

            </motion.div>

          </motion.button>

        </div>

      </motion.div>

      {/* =====================================================
         ADVANCED FILTERS
      ===================================================== */}
      <AnimatePresence>

        {showAdvanced && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: 'auto',
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            className="
              overflow-hidden
              rounded-[28px]
              border
              border-white/10
              bg-white/[0.03]
              backdrop-blur-3xl
            "
          >

            <div className="p-6">

              <div
                className="
                  grid
                  gap-4
                  md:grid-cols-2
                  xl:grid-cols-4
                "
              >

                <AdvancedCard
                  title="District"
                  value="Downtown"
                />

                <AdvancedCard
                  title="Department"
                  value="Public Works"
                />

                <AdvancedCard
                  title="Priority"
                  value="High"
                />

                <AdvancedCard
                  title="Officer"
                  value="Sarah"
                />

              </div>

            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </motion.div>
  )
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  icon: Icon,
  label,
  color,
}: any) {
  return (
    <motion.div
      whileHover={{
        scale: 1.04,
      }}
      className={`
        flex
        items-center
        gap-2
        rounded-full
        border
        px-4
        py-2
        text-sm
        backdrop-blur-xl
        ${
          color === 'emerald'
            ? `
              border-emerald-500/20
              bg-emerald-500/10
              text-emerald-300
            `
            : color === 'purple'
              ? `
                border-purple-500/20
                bg-purple-500/10
                text-purple-300
              `
              : `
                border-blue-500/20
                bg-blue-500/10
                text-blue-300
              `
        }
      `}
    >

      <Icon className="h-4 w-4" />

      <span>{label}</span>

    </motion.div>
  )
}

/* =========================================================
   ADVANCED CARD
========================================================= */

function AdvancedCard({
  title,
  value,
}: any) {
  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        y: -2,
      }}
      className="
        rounded-[24px]
        border
        border-white/10
        bg-white/[0.03]
        p-5
        transition-all
        duration-300
      "
    >

      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-lg font-semibold text-white">
        {value}
      </p>

    </motion.div>
  )
}