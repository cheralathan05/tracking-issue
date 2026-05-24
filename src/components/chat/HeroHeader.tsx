import { motion } from 'framer-motion'

import {
  Zap,
  Clock3,
  ShieldCheck,
  Sparkles,
  Activity,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'

/* =========================================================
   PREMIUM HERO HEADER
========================================================= */

export default function HeroHeader() {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.6,
      }}
      className="
        relative
        overflow-hidden
        border-b
        border-white/10
        bg-gradient-to-b
        from-[#0B1020]/95
        via-[#08101F]/92
        to-transparent
      "
    >

      {/* =====================================================
         GLOBAL GLOW
      ===================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute top-[-180px] left-[8%] h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-[140px]" />

        <div className="absolute bottom-[-220px] right-[12%] h-[480px] w-[480px] rounded-full bg-indigo-500/10 blur-[160px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_35%)]" />

      </div>

      {/* =====================================================
         MAIN CONTENT
      ===================================================== */}
      <div
        className="
          relative
          z-10
          mx-auto
          max-w-[1600px]
          px-8
          py-16
        "
      >

        <div className="max-w-5xl">

          {/* =================================================
             TOP LIVE LABELS
          ================================================= */}
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
              delay: 0.1,
            }}
            className="flex flex-wrap items-center gap-4"
          >

            {/* LIVE */}
            <StatusBadge
              icon={Zap}
              label="Realtime Communication"
              color="blue"
              glowing
            />

            {/* AI */}
            <StatusBadge
              icon={Sparkles}
              label="AI Complaint Intelligence"
              color="purple"
            />

            {/* SECURE */}
            <StatusBadge
              icon={ShieldCheck}
              label="Enterprise Secure"
              color="emerald"
            />

          </motion.div>

          {/* =================================================
             MAIN TITLE
          ================================================= */}
          <motion.div
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.2,
            }}
            className="mt-10"
          >

            <h1
              className="
                text-6xl
                font-black
                leading-[1]
                tracking-tight
                lg:text-7xl
              "
            >

              <span
                className="
                  bg-gradient-to-r
                  from-blue-200
                  via-indigo-100
                  to-purple-200
                  bg-clip-text
                  text-transparent
                "
              >
                A calmer,
              </span>

              <br />

              <span className="text-white">
                premium workspace
              </span>

              <br />

              <span className="text-slate-400">
                for every complaint conversation.
              </span>

            </h1>

          </motion.div>

          {/* =================================================
             SUBTEXT
          ================================================= */}
          <motion.p
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.3,
            }}
            className="
              mt-8
              max-w-3xl
              text-lg
              leading-9
              text-slate-400
            "
          >
            Centralize grievance conversations,
            officer coordination, evidence files,
            AI-powered complaint intelligence,
            escalation tracking, and realtime
            citizen communication into a single
            cinematic enterprise workspace.
          </motion.p>

          {/* =================================================
             CTA ROW
          ================================================= */}
          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.4,
            }}
            className="
              mt-10
              flex
              flex-wrap
              items-center
              gap-5
            "
          >

            {/* PRIMARY */}
            <motion.button
              whileHover={{
                scale: 1.03,
                y: -2,
              }}
              whileTap={{
                scale: 0.97,
              }}
              className="
                group
                relative
                overflow-hidden
                rounded-2xl
                border
                border-blue-500/20
                bg-gradient-to-r
                from-blue-500/20
                to-indigo-500/20
                px-7
                py-4
                backdrop-blur-3xl
              "
            >

              {/* GLOW */}
              <div className="absolute inset-0 bg-blue-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex items-center gap-3">

                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-2xl
                    bg-blue-500/20
                  "
                >
                  <Zap className="h-5 w-5 text-blue-300" />
                </div>

                <div className="text-left">

                  <p className="text-sm text-slate-300">
                    Workspace Status
                  </p>

                  <p className="font-semibold text-white">
                    Live & Connected
                  </p>

                </div>

                <ArrowRight className="h-5 w-5 text-blue-300 transition-transform duration-300 group-hover:translate-x-1" />

              </div>

            </motion.button>

            {/* SECONDARY */}
            <motion.button
              whileHover={{
                scale: 1.03,
                y: -2,
              }}
              whileTap={{
                scale: 0.97,
              }}
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/[0.03]
                px-7
                py-4
                backdrop-blur-3xl
                transition-all
                hover:bg-white/[0.05]
              "
            >

              <div className="flex items-center gap-3">

                <div
                  className="
                    flex
                    h-11
                    w-11
                    items-center
                    justify-center
                    rounded-2xl
                    bg-emerald-500/10
                  "
                >
                  <Clock3 className="h-5 w-5 text-emerald-300" />
                </div>

                <div className="text-left">

                  <p className="text-sm text-slate-400">
                    SLA Monitoring
                  </p>

                  <p className="font-semibold text-emerald-300">
                    Active Tracking
                  </p>

                </div>

              </div>

            </motion.button>

          </motion.div>

          {/* =================================================
             ANALYTICS ROW
          ================================================= */}
          <motion.div
            initial={{
              opacity: 0,
              y: 12,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.5,
            }}
            className="
              mt-14
              grid
              gap-5
              sm:grid-cols-2
              xl:grid-cols-4
            "
          >

            <AnalyticsCard
              title="Active Conversations"
              value="124"
              color="blue"
              icon={Activity}
            />

            <AnalyticsCard
              title="Unread Updates"
              value="03"
              color="orange"
              icon={AlertTriangle}
            />

            <AnalyticsCard
              title="Realtime Officers"
              value="18"
              color="emerald"
              icon={ShieldCheck}
            />

            <AnalyticsCard
              title="AI Resolution Rate"
              value="92%"
              color="purple"
              icon={Sparkles}
            />

          </motion.div>

        </div>

      </div>

    </motion.section>
  )
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  icon: Icon,
  label,
  color,
  glowing,
}: any) {
  return (
    <motion.div
      whileHover={{
        scale: 1.04,
      }}
      animate={
        glowing
          ? {
              boxShadow: [
                '0 0 10px rgba(59,130,246,0.2)',
                '0 0 25px rgba(59,130,246,0.45)',
                '0 0 10px rgba(59,130,246,0.2)',
              ],
            }
          : {}
      }
      transition={{
        duration: 2,
        repeat: glowing
          ? Infinity
          : 0,
      }}
      className={`
        flex
        items-center
        gap-3
        rounded-full
        border
        px-5
        py-3
        backdrop-blur-3xl
        ${
          color === 'blue'
            ? `
              border-blue-500/20
              bg-blue-500/10
              text-blue-300
            `
            : color === 'purple'
              ? `
                border-purple-500/20
                bg-purple-500/10
                text-purple-300
              `
              : `
                border-emerald-500/20
                bg-emerald-500/10
                text-emerald-300
              `
        }
      `}
    >

      <Icon className="h-4 w-4" />

      <span className="text-sm font-medium">
        {label}
      </span>

    </motion.div>
  )
}

/* =========================================================
   ANALYTICS CARD
========================================================= */

function AnalyticsCard({
  title,
  value,
  icon: Icon,
  color,
}: any) {
  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        y: -2,
      }}
      className="
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-white/10
        bg-white/[0.03]
        p-6
        backdrop-blur-3xl
      "
    >

      {/* GLOW */}
      <div
        className={`
          absolute
          top-[-40px]
          right-[-40px]
          h-[120px]
          w-[120px]
          rounded-full
          blur-[70px]
          ${
            color === 'blue'
              ? 'bg-blue-500/10'
              : color === 'orange'
                ? 'bg-orange-500/10'
                : color === 'emerald'
                  ? 'bg-emerald-500/10'
                  : 'bg-purple-500/10'
          }
        `}
      />

      <div className="relative z-10">

        <div className="flex items-center justify-between">

          <div
            className={`
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              ${
                color === 'blue'
                  ? 'bg-blue-500/10 text-blue-300'
                  : color === 'orange'
                    ? 'bg-orange-500/10 text-orange-300'
                    : color === 'emerald'
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : 'bg-purple-500/10 text-purple-300'
              }
            `}
          >

            <Icon className="h-5 w-5" />

          </div>

          <div className="text-right">

            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Live
            </p>

          </div>

        </div>

        <div className="mt-8">

          <h3
            className="
              text-4xl
              font-black
              tracking-tight
              text-white
            "
          >
            {value}
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            {title}
          </p>

        </div>

      </div>

    </motion.div>
  )
}