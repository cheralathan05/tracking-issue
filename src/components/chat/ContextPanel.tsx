import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  MapPin,
  Clock3,
  AlertTriangle,
  TrendingUp,
  FileText,
  Zap,
  Download,
  ChevronDown,
  ShieldCheck,
  Activity,
  Sparkles,
  Phone,
  Mail,
  Globe,
  CheckCircle2,
  Siren,
} from 'lucide-react'

import { useState } from 'react'

interface ContextPanelProps {
  threadId: string
}

export default function ContextPanel({
  threadId,
}: ContextPanelProps) {
  const [expandedSections, setExpandedSections] =
    useState<Record<string, boolean>>({
      details: true,
      history: true,
      insights: true,
      evidence: true,
    })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 18,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      transition={{
        duration: 0.45,
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
        via-[#0A1122]/90
        to-[#09101F]/95
        backdrop-blur-3xl
        shadow-[0_0_80px_rgba(59,130,246,0.08)]
      "
    >

      {/* BACKGROUND GLOW */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute top-[-120px] right-[-60px] h-[220px] w-[220px] rounded-full bg-blue-500/10 blur-[100px]" />

        <div className="absolute bottom-[-120px] left-[-60px] h-[220px] w-[220px] rounded-full bg-purple-500/10 blur-[100px]" />

      </div>

      {/* HEADER */}
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

        <div className="flex items-start justify-between">

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
                AI Context Panel
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
              Complaint Intelligence
            </h2>

            <p
              className="
                mt-2
                text-sm
                leading-7
                text-slate-400
              "
            >
              AI-powered complaint insights,
              escalation tracking,
              officer coordination,
              and SLA monitoring.
            </p>

          </div>

        </div>

      </div>

      {/* CONTENT */}
      <div
        className="
          relative
          z-10
          flex-1
          min-h-0
          overflow-y-auto
          px-5
          py-5
          space-y-5
        "
      >

        {/* =========================================================
           COMPLAINT DETAILS
        ========================================================= */}
        <SectionCard
          title="Complaint Details"
          color="blue"
          expanded={expandedSections.details}
          onToggle={() => toggleSection('details')}
        >

          <div className="space-y-3">

            <DetailRow
              label="Status"
              value="Open"
              badge="open"
            />

            <DetailRow
              label="Priority"
              value="High"
              badge="high"
            />

            <DetailRow
              label="Department"
              value="Public Works"
            />

            <DetailRow
              label="District"
              value="Downtown"
            />

            <DetailRow
              label="Category"
              value="Infrastructure"
            />

            <DetailRow
              label="Reported"
              value="2 days ago"
            />

          </div>

        </SectionCard>

        {/* =========================================================
           CITIZEN CARD
        ========================================================= */}
        <motion.div
          whileHover={{
            scale: 1.01,
            y: -2,
          }}
          className="
            rounded-[28px]
            border
            border-blue-500/20
            bg-gradient-to-br
            from-blue-500/10
            to-indigo-500/5
            p-5
            backdrop-blur-3xl
            transition-all
            duration-300
          "
        >

          <div className="flex items-start gap-4">

            <div
              className="
                flex
                h-14
                w-14
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
              JD
            </div>

            <div className="min-w-0 flex-1">

              <div className="flex items-center gap-2 flex-wrap">

                <h3 className="text-lg font-bold text-white">
                  John Doe
                </h3>

                <div
                  className="
                    flex
                    items-center
                    gap-1
                    rounded-full
                    border
                    border-emerald-500/20
                    bg-emerald-500/10
                    px-2
                    py-1
                    text-[10px]
                    uppercase
                    tracking-[0.2em]
                    text-emerald-300
                  "
                >
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </div>

              </div>

              <p className="mt-1 text-sm text-slate-400">
                Registered Citizen
              </p>

            </div>

          </div>

          <div className="mt-5 space-y-3 border-t border-white/10 pt-5">

            <InfoRow
              icon={MapPin}
              value="123 Main Street, Downtown District"
            />

            <InfoRow
              icon={Phone}
              value="+1 (555) 123-4567"
            />

            <InfoRow
              icon={Mail}
              value="john.doe@email.com"
            />

          </div>

        </motion.div>

        {/* =========================================================
           OFFICER CARD
        ========================================================= */}
        <motion.div
          whileHover={{
            scale: 1.01,
            y: -2,
          }}
          className="
            rounded-[28px]
            border
            border-emerald-500/20
            bg-gradient-to-br
            from-emerald-500/10
            to-teal-500/5
            p-5
            backdrop-blur-3xl
            transition-all
            duration-300
          "
        >

          <div className="flex items-start gap-4">

            <div
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-gradient-to-br
                from-emerald-400
                to-teal-600
                font-black
                text-white
              "
            >
              OS
            </div>

            <div className="flex-1 min-w-0">

              <div className="flex items-center gap-2 flex-wrap">

                <h3 className="text-lg font-bold text-white">
                  Officer Sarah
                </h3>

                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </div>

              </div>

              <p className="mt-1 text-sm text-slate-400">
                Senior Case Officer
              </p>

            </div>

          </div>

          <div className="mt-5 space-y-3 border-t border-white/10 pt-5">

            <InfoRow
              icon={Clock3}
              value="Assigned 2 days ago"
            />

            <InfoRow
              icon={Globe}
              value="Public Works Department"
            />

          </div>

        </motion.div>

        {/* =========================================================
           SLA TIMER
        ========================================================= */}
        <motion.div
          whileHover={{
            scale: 1.01,
          }}
          className="
            rounded-[28px]
            border
            border-orange-500/20
            bg-gradient-to-br
            from-orange-500/10
            to-red-500/5
            p-5
            backdrop-blur-3xl
          "
        >

          <div className="flex items-center gap-3">

            <div className="h-3 w-3 rounded-full bg-orange-400 animate-pulse shadow-[0_0_20px_rgba(251,146,60,0.9)]" />

            <h3 className="text-lg font-bold text-orange-200">
              SLA Countdown
            </h3>

          </div>

          <div className="mt-6">

            <h2
              className="
                text-5xl
                font-black
                tracking-tight
                text-orange-300
              "
            >
              4h 23m
            </h2>

            <p className="mt-2 text-sm text-orange-200/70">
              Until automatic escalation is triggered.
            </p>

          </div>

        </motion.div>

        {/* =========================================================
           ESCALATION HISTORY
        ========================================================= */}
        <SectionCard
          title="Escalation History"
          color="red"
          expanded={expandedSections.history}
          onToggle={() => toggleSection('history')}
        >

          <div className="space-y-4">

            <TimelineItem
              color="red"
              text="Escalated to Senior Management"
              time="11:00 AM"
            />

            <TimelineItem
              color="orange"
              text="Safety concern detected"
              time="10:45 AM"
            />

            <TimelineItem
              color="blue"
              text="Complaint assigned to field officer"
              time="09:30 AM"
            />

          </div>

        </SectionCard>

        {/* =========================================================
           AI INSIGHTS
        ========================================================= */}
        <SectionCard
          title="AI Insights"
          color="indigo"
          expanded={expandedSections.insights}
          onToggle={() => toggleSection('insights')}
          icon={Sparkles}
        >

          <div className="space-y-4">

            <InsightCard
              icon={TrendingUp}
              title="Escalation Risk"
              value="78%"
              description="High probability of escalation."
            />

            <InsightCard
              icon={AlertTriangle}
              title="Citizen Sentiment"
              value="Urgent"
              description="Strong dissatisfaction detected."
            />

            <InsightCard
              icon={CheckCircle2}
              title="Suggested Action"
              value="Immediate Repair"
              description="AI recommends rapid deployment."
            />

          </div>

        </SectionCard>

        {/* =========================================================
           ATTACHMENTS
        ========================================================= */}
        <SectionCard
          title="Evidence & Attachments"
          color="slate"
          expanded={expandedSections.evidence}
          onToggle={() => toggleSection('evidence')}
        >

          <div className="space-y-3">

            {[
              'pothole-photo.jpg',
              'vehicle-damage.jpg',
              'inspection-report.pdf',
            ].map((file, idx) => (
              <motion.div
                key={idx}
                whileHover={{
                  scale: 1.01,
                  x: 4,
                }}
                className="
                  flex
                  items-center
                  justify-between
                  rounded-2xl
                  border
                  border-white/10
                  bg-white/[0.03]
                  p-4
                  transition-all
                  duration-300
                  hover:bg-white/[0.06]
                "
              >

                <div className="flex items-center gap-3 min-w-0">

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-2xl
                      bg-blue-500/10
                      text-lg
                    "
                  >
                    📎
                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-medium text-slate-200">
                      {file}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Evidence File
                    </p>

                  </div>

                </div>

                <button
                  className="
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.03]
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

        </SectionCard>

      </div>

    </motion.div>
  )
}

/* =========================================================
   SECTION CARD
========================================================= */

function SectionCard({
  title,
  expanded,
  onToggle,
  children,
  color,
  icon: Icon,
}: any) {
  return (
    <motion.div
      whileHover={{
        scale: 1.01,
      }}
      className="
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-white/10
        bg-white/[0.03]
        backdrop-blur-3xl
        shadow-[0_0_40px_rgba(59,130,246,0.06)]
      "
    >

      <button
        onClick={onToggle}
        className="
          flex
          w-full
          items-center
          justify-between
          px-5
          py-4
          transition-all
          duration-300
          hover:bg-white/[0.03]
        "
      >

        <div className="flex items-center gap-3">

          {Icon && (
            <Icon className="h-4 w-4 text-indigo-300" />
          )}

          <span className="text-sm font-bold text-white">
            {title}
          </span>

        </div>

        <motion.div
          animate={{
            rotate: expanded ? 180 : 0,
          }}
        >
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </motion.div>

      </button>

      <AnimatePresence>

        {expanded && (
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
              border-t
              border-white/10
              px-5
              py-5
            "
          >
            {children}
          </motion.div>
        )}

      </AnimatePresence>

    </motion.div>
  )
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
  badge,
}: any) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        rounded-2xl
        border
        border-white/5
        bg-white/[0.02]
        px-4
        py-3
      "
    >

      <span className="text-xs text-slate-400">
        {label}
      </span>

      {badge ? (
        <span
          className={`
            rounded-full
            border
            px-2
            py-1
            text-xs
            font-medium
            ${
              badge === 'open'
                ? 'border-blue-500/20 bg-blue-500/15 text-blue-300'
                : 'border-orange-500/20 bg-orange-500/15 text-orange-300'
            }
          `}
        >
          {value}
        </span>
      ) : (
        <span className="text-xs font-medium text-slate-200">
          {value}
        </span>
      )}

    </div>
  )
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  icon: Icon,
  value,
}: any) {
  return (
    <div className="flex items-start gap-3">

      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />

      <p className="text-sm leading-6 text-slate-300">
        {value}
      </p>

    </div>
  )
}

/* =========================================================
   TIMELINE ITEM
========================================================= */

function TimelineItem({
  text,
  time,
  color,
}: any) {
  return (
    <div className="flex gap-3">

      <div
        className={`
          mt-1.5
          h-2.5
          w-2.5
          flex-shrink-0
          rounded-full
          ${
            color === 'red'
              ? 'bg-red-400'
              : color === 'orange'
                ? 'bg-orange-400'
                : 'bg-blue-400'
          }
        `}
      />

      <div>

        <p className="text-sm text-slate-200">
          {text}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {time}
        </p>

      </div>

    </div>
  )
}

/* =========================================================
   INSIGHT CARD
========================================================= */

function InsightCard({
  icon: Icon,
  title,
  value,
  description,
}: any) {
  return (
    <motion.div
      whileHover={{
        scale: 1.015,
        y: -2,
      }}
      className="
        rounded-[24px]
        border
        border-indigo-500/20
        bg-gradient-to-br
        from-indigo-500/10
        to-purple-500/5
        p-4
        transition-all
        duration-300
      "
    >

      <div className="flex items-start gap-3">

        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-2xl
            bg-indigo-500/10
          "
        >
          <Icon className="h-5 w-5 text-indigo-300" />
        </div>

        <div className="min-w-0 flex-1">

          <p className="text-sm font-semibold text-white">
            {title}
          </p>

          <p className="mt-1 text-lg font-black text-indigo-300">
            {value}
          </p>

          <p className="mt-2 text-xs leading-6 text-slate-400">
            {description}
          </p>

        </div>

      </div>

    </motion.div>
  )
}