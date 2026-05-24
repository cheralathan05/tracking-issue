import { motion, AnimatePresence } from 'framer-motion'

import {
  Bell,
  Search,
  Wifi,
  Clock3,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Activity,
  Command,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react'

/* =========================================================
   PREMIUM TOP NAVBAR
========================================================= */

interface TopNavbarProps {
  compact?: boolean
}

export default function TopNavbar({ compact = false }: TopNavbarProps) {
  return (
    <motion.header
      initial={{
        opacity: 0,
        y: -18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.5,
      }}
      className="
        relative
        z-50
        flex
        h-16
        flex-shrink-0
        items-center
        justify-between
        overflow-hidden
        border-b
        border-white/8
        bg-gradient-to-b
        from-white/[0.08]
        via-white/[0.05]
        to-white/[0.02]
        px-4
        backdrop-blur-xl
      "
    >

      {/* =====================================================
         GLOBAL BACKGROUND GLOW
      ===================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute top-[-120px] left-[10%] h-[240px] w-[240px] rounded-full bg-blue-500/10 blur-[100px]" />

        <div className="absolute bottom-[-120px] right-[15%] h-[240px] w-[240px] rounded-full bg-indigo-500/10 blur-[100px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:120px]" />

      </div>

      {/* =====================================================
         LEFT SECTION
      ===================================================== */}
      <div className="relative z-10 flex min-w-0 items-center gap-3">

        {/* =================================================
           LOGO
        ================================================= */}
        <motion.div
          whileHover={{
            scale: 1.03,
          }}
          className="
            group
            flex
            cursor-pointer
            items-center
            gap-3
          "
        >

          {/* LOGO ICON */}
          <div className="relative">

            <motion.div
              animate={{
                boxShadow: [
                  '0 0 12px rgba(59,130,246,0.25)',
                  '0 0 30px rgba(59,130,246,0.45)',
                  '0 0 12px rgba(59,130,246,0.25)',
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
              className="
                relative
                flex
                h-11
                w-11
                items-center
                justify-center
                overflow-hidden
                rounded-xl
                border
                border-blue-400/30
                bg-gradient-to-br
                from-blue-400
                via-indigo-500
                to-purple-600
              "
            >

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.4),transparent_40%)]" />

              <span className="relative z-10 text-lg font-black text-white">
                CB
              </span>

            </motion.div>

            {/* OUTER GLOW */}
            <div className="absolute inset-0 rounded-xl bg-blue-400/20 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          </div>

          {/* TEXT */}
          <div>

            <h1
              className="
                text-xl
                font-black
                tracking-tight
                text-white
              "
            >

              <span
                className="
                  bg-gradient-to-r
                  from-blue-300
                  via-indigo-200
                  to-purple-300
                  bg-clip-text
                  text-transparent
                "
              >
                Civic Bridge
              </span>

            </h1>

            <div className="mt-1 flex items-center gap-2">

              <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Flow Workspace
              </span>

              <div className="h-1 w-1 rounded-full bg-slate-600" />

              <span className="text-xs text-blue-300">
                Enterprise
              </span>

            </div>

          </div>

        </motion.div>

        {/* =================================================
           LIVE STATUS
        ================================================= */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 10px rgba(34,197,94,0.15)',
              '0 0 22px rgba(34,197,94,0.35)',
              '0 0 10px rgba(34,197,94,0.15)',
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
          }}
            className={compact ? 'hidden 2xl:flex items-center gap-3 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 backdrop-blur-2xl' : 'hidden xl:flex items-center gap-3 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 backdrop-blur-2xl'}
        >

          <div className="relative flex h-3 w-3 items-center justify-center">

            <div className="absolute h-3 w-3 rounded-full bg-emerald-400 animate-ping opacity-50" />

            <div className="relative h-2.5 w-2.5 rounded-full bg-emerald-400" />

          </div>

          <div>

            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">
              Live System
            </p>

            <p className="text-sm font-semibold text-emerald-300">
              All Services Operational
            </p>

          </div>

        </motion.div>

      </div>

      {/* =====================================================
         CENTER SECTION
      ===================================================== */}
      <div className="relative z-10 hidden 2xl:flex items-center gap-4">

        {/* REALTIME */}
        <StatusPill
          icon={Wifi}
          title="Realtime"
          value="Socket Connected"
          color="blue"
        />

        {/* SLA */}
        <StatusPill
          icon={Clock3}
          title="Response"
          value="2.4 min Avg"
          color="purple"
        />

        {/* AI */}
        <StatusPill
          icon={Sparkles}
          title="AI Engine"
          value="Online"
          color="pink"
        />

        {/* SECURITY */}
        <StatusPill
          icon={ShieldCheck}
          title="Security"
          value="Protected"
          color="emerald"
        />

      </div>

      {/* =====================================================
         RIGHT SECTION
      ===================================================== */}
      <div className="relative z-10 flex items-center gap-5">

        {/* =================================================
           SEARCH
        ================================================= */}
        <motion.div
          whileHover={{
            scale: 1.01,
          }}
          className="
            hidden
            lg:flex
            items-center
            gap-4
            rounded-2xl
            border
            border-white/10
            bg-white/[0.03]
            px-5
            py-3
            backdrop-blur-2xl
            transition-all
            hover:border-blue-500/30
          "
        >

          <Search className="h-4 w-4 text-slate-500" />

          <input
            type="text"
            placeholder="Search complaints, officers, citizens..."
            className="
              w-[260px]
              bg-transparent
              text-sm
              text-slate-200
              placeholder:text-slate-500
              outline-none
            "
          />

          {/* SHORTCUT */}
          <div
            className="
              flex
              items-center
              gap-1
              rounded-lg
              border
              border-white/10
              bg-white/[0.03]
              px-2
              py-1
              text-[11px]
              text-slate-500
            "
          >

            <Command className="h-3 w-3" />

            K

          </div>

        </motion.div>

        {/* =================================================
           ACTIVITY
        ================================================= */}
        <motion.button
          whileHover={{
            scale: 1.05,
          }}
          whileTap={{
            scale: 0.95,
          }}
          className="
            relative
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            border
            border-blue-500/20
            bg-blue-500/10
            text-blue-300
            transition-all
            hover:border-blue-400/40
          "
        >

          <Activity className="h-5 w-5" />

          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="
              absolute
              right-2
              top-2
              h-2
              w-2
              rounded-full
              bg-blue-400
            "
          />

        </motion.button>

        {/* =================================================
           MESSAGES
        ================================================= */}
        <motion.button
          whileHover={{
            scale: 1.05,
          }}
          whileTap={{
            scale: 0.95,
          }}
          className="
            relative
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            border
            border-indigo-500/20
            bg-indigo-500/10
            text-indigo-300
            transition-all
            hover:border-indigo-400/40
          "
        >

          <MessageSquare className="h-5 w-5" />

          <div
            className="
              absolute
              -right-1
              -top-1
              flex
              h-5
              min-w-[20px]
              items-center
              justify-center
              rounded-full
              bg-gradient-to-r
              from-indigo-500
              to-blue-500
              px-1
              text-[10px]
              font-bold
              text-white
            "
          >
            3
          </div>

        </motion.button>

        {/* =================================================
           NOTIFICATIONS
        ================================================= */}
        <motion.button
          whileHover={{
            scale: 1.05,
          }}
          whileTap={{
            scale: 0.95,
          }}
          className="
            relative
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            border
            border-orange-500/20
            bg-orange-500/10
            text-orange-300
            transition-all
            hover:border-orange-400/40
          "
        >

          <Bell className="h-5 w-5" />

          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="
              absolute
              right-2
              top-2
              h-2
              w-2
              rounded-full
              bg-orange-400
            "
          />

        </motion.button>

        {/* =================================================
           ALERT
        ================================================= */}
        <motion.button
          whileHover={{
            scale: 1.05,
          }}
          whileTap={{
            scale: 0.95,
          }}
          className="
            hidden
            xl:flex
            relative
            items-center
            gap-3
            rounded-2xl
            border
            border-red-500/20
            bg-red-500/10
            px-4
            py-3
          "
        >

          <AlertTriangle className="h-4 w-4 text-red-300" />

          <div className="text-left">

            <p className="text-[10px] uppercase tracking-[0.2em] text-red-200">
              Escalation
            </p>

            <p className="text-xs font-semibold text-red-300">
              2 urgent complaints
            </p>

          </div>

        </motion.button>

        {/* =================================================
           PROFILE
        ================================================= */}
        <motion.button
          whileHover={{
            scale: 1.03,
          }}
          className="
            group
            flex
            items-center
            gap-4
            rounded-2xl
            border
            border-white/10
            bg-white/[0.03]
            px-4
            py-2.5
            backdrop-blur-2xl
            transition-all
            hover:border-blue-500/30
          "
        >

          {/* AVATAR */}
          <div className="relative">

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-2xl
                bg-gradient-to-br
                from-blue-400
                to-indigo-600
                text-sm
                font-black
                text-white
              "
            >
              JD
            </div>

            {/* ONLINE */}
            <div
              className="
                absolute
                -bottom-0.5
                -right-0.5
                h-3.5
                w-3.5
                rounded-full
                border-2
                border-[#060B16]
                bg-emerald-400
              "
            />

          </div>

          {/* USER */}
          <div className="hidden text-left xl:block">

            <p className="text-sm font-semibold text-white">
              John Doe
            </p>

            <p className="text-xs text-slate-500">
              Verified Citizen
            </p>

          </div>

          <ChevronDown
            className="
              hidden
              h-4
              w-4
              text-slate-500
              transition-transform
              duration-300
              group-hover:rotate-180
              xl:block
            "
          />

        </motion.button>

      </div>

    </motion.header>
  )
}

/* =========================================================
   STATUS PILL
========================================================= */

function StatusPill({
  icon: Icon,
  title,
  value,
  color,
}: any) {
  return (
    <motion.div
      whileHover={{
        scale: 1.03,
      }}
      className={`
        flex
        items-center
        gap-3
        rounded-2xl
        border
        px-4
        py-3
        backdrop-blur-2xl
        ${
          color === 'blue'
            ? `
              border-blue-500/20
              bg-blue-500/10
            `
            : color === 'purple'
              ? `
                border-purple-500/20
                bg-purple-500/10
              `
              : color === 'pink'
                ? `
                  border-pink-500/20
                  bg-pink-500/10
                `
                : `
                  border-emerald-500/20
                  bg-emerald-500/10
                `
        }
      `}
    >

      <div
        className={`
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-2xl
          ${
            color === 'blue'
              ? `
                bg-blue-500/10
                text-blue-300
              `
              : color === 'purple'
                ? `
                  bg-purple-500/10
                  text-purple-300
                `
                : color === 'pink'
                  ? `
                    bg-pink-500/10
                    text-pink-300
                  `
                  : `
                    bg-emerald-500/10
                    text-emerald-300
                  `
          }
        `}
      >

        <Icon className="h-4 w-4" />

      </div>

      <div>

        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
          {title}
        </p>

        <p className="text-sm font-semibold text-white">
          {value}
        </p>

      </div>

    </motion.div>
  )
}