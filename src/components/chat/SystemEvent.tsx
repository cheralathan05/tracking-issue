import { motion } from 'framer-motion'

import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Zap,
  Activity,
} from 'lucide-react'

interface SystemEventProps {
  event: string
  type?:
    | 'system'
    | 'success'
    | 'warning'
    | 'critical'
    | 'sla'
    | 'ai'
}

/* =========================================================
   PREMIUM SYSTEM EVENT
========================================================= */

export default function SystemEvent({
  event,
  type = 'system',
}: SystemEventProps) {
  const config = getEventConfig(type)

  const Icon = config.icon

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 16,
        scale: 0.96,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        duration: 0.45,
      }}
      className="
        relative
        flex
        items-center
        justify-center
        py-7
      "
    >

      {/* =====================================================
         BACKGROUND GLOW
      ===================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <motion.div
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
          className={`
            absolute
            left-1/2
            top-1/2
            h-[120px]
            w-[320px]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            blur-[90px]
            ${config.glow}
          `}
        />

      </div>

      {/* =====================================================
         TIMELINE WRAPPER
      ===================================================== */}
      <div className="relative z-10 flex w-full items-center gap-5">

        {/* LEFT LINE */}
        <motion.div
          initial={{
            scaleX: 0,
          }}
          animate={{
            scaleX: 1,
          }}
          transition={{
            duration: 0.5,
          }}
          className={`
            h-px
            flex-1
            origin-right
            bg-gradient-to-r
            from-transparent
            via-white/10
            to-transparent
          `}
        />

        {/* =================================================
           EVENT CARD
        ================================================= */}
        <motion.div
          whileHover={{
            scale: 1.03,
            y: -2,
          }}
          className={`
            group
            relative
            flex
            flex-shrink-0
            items-center
            gap-4
            overflow-hidden
            rounded-full
            border
            px-5
            py-3
            backdrop-blur-3xl
            transition-all
            duration-300
            ${config.container}
          `}
        >

          {/* INNER GLOW */}
          <div
            className={`
              absolute
              inset-0
              opacity-0
              transition-opacity
              duration-300
              group-hover:opacity-100
              ${config.innerGlow}
            `}
          />

          {/* ICON */}
          <motion.div
            animate={
              type === 'critical' ||
              type === 'warning'
                ? {
                    scale: [1, 1.08, 1],
                  }
                : {}
            }
            transition={{
              duration: 1.8,
              repeat: Infinity,
            }}
            className={`
              relative
              z-10
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              border
              ${config.iconContainer}
            `}
          >

            <Icon
              className={`
                h-4 w-4
                ${config.iconColor}
              `}
            />

          </motion.div>

          {/* TEXT */}
          <div className="relative z-10">

            <p
              className={`
                text-[11px]
                uppercase
                tracking-[0.25em]
                ${config.labelColor}
              `}
            >
              {config.label}
            </p>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                text-white
              "
            >
              {event}
            </p>

          </div>

          {/* LIVE DOT */}
          <motion.div
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
            }}
            className={`
              relative
              z-10
              h-2.5
              w-2.5
              rounded-full
              ${config.dot}
            `}
          />

        </motion.div>

        {/* RIGHT LINE */}
        <motion.div
          initial={{
            scaleX: 0,
          }}
          animate={{
            scaleX: 1,
          }}
          transition={{
            duration: 0.5,
          }}
          className="
            h-px
            flex-1
            origin-left
            bg-gradient-to-r
            from-transparent
            via-white/10
            to-transparent
          "
        />

      </div>

    </motion.div>
  )
}

/* =========================================================
   EVENT CONFIG
========================================================= */

function getEventConfig(type: string) {
  switch (type) {
    case 'success':
      return {
        label: 'Resolved',
        icon: CheckCircle2,
        glow: 'bg-emerald-500/10',
        dot: 'bg-emerald-400',
        labelColor: 'text-emerald-300',
        iconColor: 'text-emerald-300',
        container: `
          border-emerald-500/20
          bg-emerald-500/10
        `,
        iconContainer: `
          border-emerald-500/20
          bg-emerald-500/10
        `,
        innerGlow: 'bg-emerald-500/5',
      }

    case 'warning':
      return {
        label: 'Escalation',
        icon: AlertTriangle,
        glow: 'bg-orange-500/10',
        dot: 'bg-orange-400',
        labelColor: 'text-orange-300',
        iconColor: 'text-orange-300',
        container: `
          border-orange-500/20
          bg-orange-500/10
        `,
        iconContainer: `
          border-orange-500/20
          bg-orange-500/10
        `,
        innerGlow: 'bg-orange-500/5',
      }

    case 'critical':
      return {
        label: 'Critical Alert',
        icon: Zap,
        glow: 'bg-red-500/10',
        dot: 'bg-red-400',
        labelColor: 'text-red-300',
        iconColor: 'text-red-300',
        container: `
          border-red-500/20
          bg-red-500/10
        `,
        iconContainer: `
          border-red-500/20
          bg-red-500/10
        `,
        innerGlow: 'bg-red-500/5',
      }

    case 'sla':
      return {
        label: 'SLA Tracking',
        icon: Clock3,
        glow: 'bg-blue-500/10',
        dot: 'bg-blue-400',
        labelColor: 'text-blue-300',
        iconColor: 'text-blue-300',
        container: `
          border-blue-500/20
          bg-blue-500/10
        `,
        iconContainer: `
          border-blue-500/20
          bg-blue-500/10
        `,
        innerGlow: 'bg-blue-500/5',
      }

    case 'ai':
      return {
        label: 'AI Intelligence',
        icon: Sparkles,
        glow: 'bg-purple-500/10',
        dot: 'bg-purple-400',
        labelColor: 'text-purple-300',
        iconColor: 'text-purple-300',
        container: `
          border-purple-500/20
          bg-purple-500/10
        `,
        iconContainer: `
          border-purple-500/20
          bg-purple-500/10
        `,
        innerGlow: 'bg-purple-500/5',
      }

    default:
      return {
        label: 'System Event',
        icon: Activity,
        glow: 'bg-slate-500/10',
        dot: 'bg-slate-300',
        labelColor: 'text-slate-300',
        iconColor: 'text-slate-300',
        container: `
          border-white/10
          bg-white/[0.03]
        `,
        iconContainer: `
          border-white/10
          bg-white/[0.03]
        `,
        innerGlow: 'bg-white/[0.03]',
      }
  }
}