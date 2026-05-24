import { motion } from 'framer-motion'
import {
  Code,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Layers3,
  Cpu,
  Palette,
  Workflow,
  Monitor,
  Globe,
  Zap,
} from 'lucide-react'

import { useState } from 'react'

/* =========================================================
   PREMIUM DESIGN SHOWCASE
========================================================= */

export default function DesignShowcase() {
  const [copiedCode, setCopiedCode] =
    useState<string | null>(null)

  const copyCode = (
    code: string,
    id: string
  ) => {
    navigator.clipboard.writeText(code)

    setCopiedCode(id)

    setTimeout(() => {
      setCopiedCode(null)
    }, 2000)
  }

  return (
    <div
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[#050816]
        text-white
      "
    >

      {/* =====================================================
         GLOBAL BACKGROUND
      ===================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute top-[-300px] left-[10%] h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[180px]" />

        <div className="absolute bottom-[-300px] right-[10%] h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-[180px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_45%)]" />

      </div>

      {/* =====================================================
         HEADER
      ===================================================== */}
      <div
        className="
          sticky
          top-0
          z-50
          border-b
          border-white/10
          bg-[#050816]/80
          backdrop-blur-3xl
        "
      >

        <div className="mx-auto max-w-[1600px] px-8 py-7">

          <div className="flex items-center justify-between gap-6 flex-wrap">

            <div>

              <div className="flex items-center gap-3 flex-wrap">

                <span
                  className="
                    rounded-full
                    border
                    border-blue-500/20
                    bg-blue-500/10
                    px-4
                    py-1.5
                    text-[11px]
                    uppercase
                    tracking-[0.3em]
                    text-blue-300
                  "
                >
                  Enterprise AI Workspace
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
                    px-4
                    py-1.5
                    text-xs
                    text-emerald-300
                  "
                >
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Design System
                </span>

              </div>

              <h1
                className="
                  mt-6
                  text-6xl
                  font-black
                  tracking-tight
                  leading-[1]
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
                  Premium Chat Workspace
                </span>
              </h1>

              <p
                className="
                  mt-5
                  max-w-3xl
                  text-lg
                  leading-8
                  text-slate-400
                "
              >
                Futuristic AI-powered enterprise
                communication system built for
                Smart Governance, realtime
                collaboration, and cinematic user
                experience architecture.
              </p>

            </div>

            {/* STATUS */}
            <div className="flex items-center gap-4 flex-wrap">

              <TopBadge
                icon={Cpu}
                label="AI Powered"
              />

              <TopBadge
                icon={ShieldCheck}
                label="Enterprise Secure"
              />

              <TopBadge
                icon={Zap}
                label="Realtime"
              />

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
         CONTENT
      ===================================================== */}
      <div className="relative z-10">

        <div
          className="
            mx-auto
            max-w-[1600px]
            space-y-24
            px-8
            py-16
          "
        >

          {/* =================================================
             HERO SHOWCASE
          ================================================= */}
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.7,
            }}
            className="
              grid
              grid-cols-1
              gap-8
              lg:grid-cols-3
            "
          >

            <HeroCard
              icon={Palette}
              title="Futuristic UI"
              description="Luxury glassmorphism with cinematic composition and AI-inspired interactions."
              color="blue"
            />

            <HeroCard
              icon={Workflow}
              title="Enterprise Workflow"
              description="Citizen, Admin, and Officer communication architecture with realtime intelligence."
              color="purple"
            />

            <HeroCard
              icon={Monitor}
              title="Premium Experience"
              description="Production-level desktop workspace with scalable enterprise layouts."
              color="emerald"
            />

          </motion.div>

          {/* =================================================
             COLOR SYSTEM
          ================================================= */}
          <Section
            title="Color System"
            description="Premium futuristic AI color palette with cinematic neon lighting."
          >

            <div
              className="
                grid
                grid-cols-2
                gap-6
                lg:grid-cols-4
              "
            >

              <ColorCard
                name="Deep Space"
                value="#050816"
                gradient="from-slate-950 to-slate-900"
              />

              <ColorCard
                name="Neon Blue"
                value="#3B82F6"
                gradient="from-blue-500 to-cyan-400"
              />

              <ColorCard
                name="Indigo Core"
                value="#6366F1"
                gradient="from-indigo-500 to-purple-500"
              />

              <ColorCard
                name="Emerald Live"
                value="#10B981"
                gradient="from-emerald-500 to-teal-400"
              />

              <ColorCard
                name="Warning Orange"
                value="#F97316"
                gradient="from-orange-500 to-red-400"
              />

              <ColorCard
                name="Critical Red"
                value="#EF4444"
                gradient="from-red-500 to-pink-500"
              />

              <ColorCard
                name="Luxury Purple"
                value="#A855F7"
                gradient="from-purple-500 to-indigo-500"
              />

              <ColorCard
                name="Glass White"
                value="rgba(255,255,255,0.03)"
                gradient="from-white/20 to-white/5"
              />

            </div>

          </Section>

          {/* =================================================
             GLASSMORPHISM
          ================================================= */}
          <Section
            title="Glassmorphism Components"
            description="Advanced glass UI architecture with layered blur, gradients, and glow systems."
          >

            <div
              className="
                grid
                grid-cols-1
                gap-8
                lg:grid-cols-3
              "
            >

              <GlassCard
                title="Standard Glass"
                description="Basic futuristic glass layer for enterprise interfaces."
                color="blue"
              />

              <GlassCard
                title="Glow Glass"
                description="Animated realtime glowing interaction card."
                color="purple"
                glowing
              />

              <GlassCard
                title="Premium Admin"
                description="High-priority luxury control interface."
                color="emerald"
              />

            </div>

          </Section>

          {/* =================================================
             INTERACTIVE BUTTONS
          ================================================= */}
          <Section
            title="Interactive Components"
            description="Production-level interaction patterns and motion systems."
          >

            <div className="space-y-8">

              {/* BUTTONS */}
              <div className="flex flex-wrap gap-5">

                <ActionButton
                  label="Primary Action"
                  variant="primary"
                />

                <ActionButton
                  label="Secondary Action"
                  variant="secondary"
                />

                <ActionButton
                  label="Emergency Action"
                  variant="danger"
                />

              </div>

              {/* FILTERS */}
              <div className="flex flex-wrap gap-4">

                {[
                  'All',
                  'Open',
                  'Escalated',
                  'Urgent',
                  'Resolved',
                ].map((item, index) => (
                  <motion.button
                    key={item}
                    initial={{
                      opacity: 0,
                      scale: 0.9,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                    }}
                    transition={{
                      delay: index * 0.08,
                    }}
                    whileHover={{
                      scale: 1.05,
                    }}
                    className={`
                      rounded-full
                      border
                      px-5
                      py-2.5
                      text-sm
                      font-medium
                      transition-all
                      duration-300
                      ${
                        index === 0
                          ? `
                            border-blue-500/30
                            bg-blue-500/15
                            text-blue-300
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
                    {item}
                  </motion.button>
                ))}

              </div>

            </div>

          </Section>

          {/* =================================================
             MESSAGE SHOWCASE
          ================================================= */}
          <Section
            title="Chat Message System"
            description="Realtime futuristic conversation architecture."
          >

            <div className="space-y-8">

              {/* USER MESSAGE */}
              <div className="flex justify-end">

                <motion.div
                  whileHover={{
                    scale: 1.01,
                  }}
                  className="
                    max-w-[520px]
                    rounded-[28px]
                    border
                    border-blue-500/20
                    bg-gradient-to-br
                    from-blue-500/20
                    to-indigo-500/20
                    px-6
                    py-5
                    backdrop-blur-3xl
                  "
                >

                  <p className="text-[15px] leading-8 text-slate-100">
                    This is a premium citizen message
                    bubble with futuristic AI styling
                    and cinematic spacing hierarchy.
                  </p>

                  <p className="mt-4 text-xs text-slate-400">
                    09:05 AM
                  </p>

                </motion.div>

              </div>

              {/* OFFICER */}
              <div className="flex justify-start">

                <div className="flex gap-4">

                  <div
                    className="
                      flex
                      h-12
                      w-12
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
                    S
                  </div>

                  <motion.div
                    whileHover={{
                      scale: 1.01,
                    }}
                    className="
                      max-w-[520px]
                      rounded-[28px]
                      border
                      border-white/10
                      bg-white/[0.04]
                      px-6
                      py-5
                      backdrop-blur-3xl
                    "
                  >

                    <p className="mb-3 text-sm font-semibold text-blue-300">
                      Officer Sarah
                    </p>

                    <p className="text-[15px] leading-8 text-slate-100">
                      Officer messages appear with
                      premium glassmorphism styling
                      and luxury enterprise spacing.
                    </p>

                    <p className="mt-4 text-xs text-slate-500">
                      10:30 AM
                    </p>

                  </motion.div>

                </div>

              </div>

            </div>

          </Section>

          {/* =================================================
             CODE BLOCKS
          ================================================= */}
          <Section
            title="Implementation Blocks"
            description="Production-ready component structures for enterprise applications."
          >

            <div className="space-y-8">

              <CodeBlock
                title="Import Chat Workspace"
                code={`import ChatWorkspace from '@/components/chat/ChatWorkspace'

export default function ChatPage() {
  return <ChatWorkspace />
}`}
                id="import-chat"
                onCopy={copyCode}
                copiedId={copiedCode}
              />

              <CodeBlock
                title="Glassmorphism Container"
                code={`<motion.div
  className="
    rounded-[32px]
    border
    border-white/10
    bg-white/[0.03]
    backdrop-blur-3xl
  "
>
  {/* Content */}
</motion.div>`}
                id="glass-ui"
                onCopy={copyCode}
                copiedId={copiedCode}
              />

            </div>

          </Section>

          {/* =================================================
             RESPONSIVE
          ================================================= */}
          <Section
            title="Responsive Architecture"
            description="Enterprise multi-device layout system."
          >

            <div
              className="
                rounded-[32px]
                border
                border-white/10
                bg-white/[0.03]
                p-8
                backdrop-blur-3xl
              "
            >

              <div className="flex flex-wrap gap-4">

                <DeviceBadge label="Desktop Workspace" />

                <DeviceBadge label="Tablet Layout" />

                <DeviceBadge label="Mobile Responsive" />

                <DeviceBadge label="Realtime Scaling" />

              </div>

              <div
                className="
                  mt-8
                  grid
                  gap-4
                  lg:grid-cols-[340px_minmax(0,1fr)_380px]
                "
              >

                <LayoutBox
                  title="Threads"
                  color="blue"
                />

                <LayoutBox
                  title="Chat Workspace"
                  color="indigo"
                />

                <LayoutBox
                  title="Context Panel"
                  color="purple"
                />

              </div>

            </div>

          </Section>

          {/* =================================================
             FOOTER
          ================================================= */}
          <div
            className="
              border-t
              border-white/10
              py-20
              text-center
            "
          >

            <h2
              className="
                text-4xl
                font-black
                tracking-tight
              "
            >
              SmartGov Enterprise Workspace
            </h2>

            <p
              className="
                mx-auto
                mt-5
                max-w-2xl
                text-lg
                leading-8
                text-slate-400
              "
            >
              Production-level futuristic AI
              communication platform for
              government-grade civic operations.
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}

/* =========================================================
   SECTION
========================================================= */

function Section({
  title,
  description,
  children,
}: any) {
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 24,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
      }}
      transition={{
        duration: 0.5,
      }}
      className="space-y-8"
    >

      <div>

        <h2
          className="
            text-4xl
            font-black
            tracking-tight
          "
        >
          {title}
        </h2>

        <p
          className="
            mt-3
            max-w-3xl
            text-lg
            leading-8
            text-slate-400
          "
        >
          {description}
        </p>

      </div>

      {children}

    </motion.section>
  )
}

/* =========================================================
   HERO CARD
========================================================= */

function HeroCard({
  icon: Icon,
  title,
  description,
  color,
}: any) {
  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        y: -4,
      }}
      className="
        rounded-[32px]
        border
        border-white/10
        bg-white/[0.03]
        p-8
        backdrop-blur-3xl
      "
    >

      <div
        className={`
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-3xl
          ${
            color === 'blue'
              ? 'bg-blue-500/10 text-blue-300'
              : color === 'purple'
                ? 'bg-purple-500/10 text-purple-300'
                : 'bg-emerald-500/10 text-emerald-300'
          }
        `}
      >
        <Icon className="h-8 w-8" />
      </div>

      <h3 className="mt-8 text-2xl font-bold">
        {title}
      </h3>

      <p className="mt-4 text-slate-400 leading-8">
        {description}
      </p>

    </motion.div>
  )
}

/* =========================================================
   COLOR CARD
========================================================= */

function ColorCard({
  name,
  value,
  gradient,
}: any) {
  return (
    <motion.div
      whileHover={{
        scale: 1.03,
      }}
      className="
        rounded-[28px]
        border
        border-white/10
        bg-white/[0.03]
        p-6
        backdrop-blur-3xl
      "
    >

      <div
        className={`
          h-28
          rounded-2xl
          bg-gradient-to-br
          ${gradient}
        `}
      />

      <div className="mt-5">

        <h4 className="font-bold text-white">
          {name}
        </h4>

        <p className="mt-2 text-sm text-slate-400">
          {value}
        </p>

      </div>

    </motion.div>
  )
}

/* =========================================================
   GLASS CARD
========================================================= */

function GlassCard({
  title,
  description,
  color,
  glowing,
}: any) {
  return (
    <motion.div
      whileHover={{
        scale: 1.03,
      }}
      animate={
        glowing
          ? {
              boxShadow: [
                '0 0 10px rgba(59,130,246,0.2)',
                '0 0 30px rgba(59,130,246,0.45)',
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
      className="
        relative
        overflow-hidden
        rounded-[32px]
        border
        border-white/10
        bg-white/[0.03]
        p-8
        backdrop-blur-3xl
      "
    >

      <div
        className={`
          absolute
          inset-0
          opacity-30
          ${
            color === 'blue'
              ? 'bg-blue-500/10'
              : color === 'purple'
                ? 'bg-purple-500/10'
                : 'bg-emerald-500/10'
          }
        `}
      />

      <div className="relative">

        <h3 className="text-2xl font-bold">
          {title}
        </h3>

        <p className="mt-4 text-slate-400 leading-8">
          {description}
        </p>

      </div>

    </motion.div>
  )
}

/* =========================================================
   ACTION BUTTON
========================================================= */

function ActionButton({
  label,
  variant,
}: any) {
  return (
    <motion.button
      whileHover={{
        scale: 1.05,
      }}
      whileTap={{
        scale: 0.96,
      }}
      className={`
        rounded-2xl
        border
        px-6
        py-3
        font-medium
        transition-all
        duration-300
        ${
          variant === 'primary'
            ? `
              border-blue-500/20
              bg-blue-500/15
              text-blue-300
            `
            : variant === 'danger'
              ? `
                border-red-500/20
                bg-red-500/15
                text-red-300
              `
              : `
                border-white/10
                bg-white/[0.03]
                text-slate-300
              `
        }
      `}
    >
      {label}
    </motion.button>
  )
}

/* =========================================================
   CODE BLOCK
========================================================= */

function CodeBlock({
  title,
  code,
  id,
  onCopy,
  copiedId,
}: any) {
  return (
    <div
      className="
        overflow-hidden
        rounded-[32px]
        border
        border-white/10
        bg-[#0B1020]
      "
    >

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-white/10
          px-6
          py-4
        "
      >

        <div className="flex items-center gap-3">

          <Code className="h-5 w-5 text-blue-300" />

          <p className="font-medium text-blue-200">
            {title}
          </p>

        </div>

        <motion.button
          whileHover={{
            scale: 1.08,
          }}
          whileTap={{
            scale: 0.92,
          }}
          onClick={() => onCopy(code, id)}
          className="
            rounded-xl
            border
            border-white/10
            bg-white/[0.03]
            p-2
            transition-all
            hover:bg-white/[0.06]
          "
        >

          {copiedId === id ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4 text-slate-300" />
          )}

        </motion.button>

      </div>

      <pre
        className="
          overflow-x-auto
          p-6
          text-sm
          leading-8
          text-slate-300
        "
      >
        <code>{code}</code>
      </pre>

    </div>
  )
}

/* =========================================================
   TOP BADGE
========================================================= */

function TopBadge({
  icon: Icon,
  label,
}: any) {
  return (
    <div
      className="
        flex
        items-center
        gap-2
        rounded-full
        border
        border-white/10
        bg-white/[0.03]
        px-4
        py-2
        backdrop-blur-3xl
      "
    >

      <Icon className="h-4 w-4 text-blue-300" />

      <span className="text-sm text-slate-300">
        {label}
      </span>

    </div>
  )
}

/* =========================================================
   DEVICE BADGE
========================================================= */

function DeviceBadge({
  label,
}: any) {
  return (
    <div
      className="
        rounded-full
        border
        border-blue-500/20
        bg-blue-500/10
        px-4
        py-2
        text-sm
        text-blue-300
      "
    >
      {label}
    </div>
  )
}

/* =========================================================
   LAYOUT BOX
========================================================= */

function LayoutBox({
  title,
  color,
}: any) {
  return (
    <div
      className={`
        flex
        h-48
        items-center
        justify-center
        rounded-[28px]
        border
        text-center
        font-bold
        ${
          color === 'blue'
            ? `
              border-blue-500/20
              bg-blue-500/10
            `
            : color === 'indigo'
              ? `
                border-indigo-500/20
                bg-indigo-500/10
              `
              : `
                border-purple-500/20
                bg-purple-500/10
              `
        }
      `}
    >
      {title}
    </div>
  )
}