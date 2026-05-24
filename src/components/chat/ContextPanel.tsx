import { motion, AnimatePresence } from 'framer-motion'
import {
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

import type { ComplaintRecord } from '@/lib/smartgov-api'

interface ContextPanelProps {
  threadId: string
  complaint?: ComplaintRecord | null
}

export default function ContextPanel({
  threadId,
  complaint,
}: ContextPanelProps) {
  const [expandedSections, setExpandedSections] =
    useState<Record<string, boolean>>({
      details: true,
      citizen: true,
      officer: true,
      escalation: true,
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
        duration: 0.5,
        delay: 0.08,
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
         BACKGROUND GLOW
      ===================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">

        <div 
          className="
            absolute
            top-[-120px]
            right-[-80px]
            h-[350px]
            w-[350px]
            rounded-full
            bg-blue-500/12
            blur-[130px]
          "
        />

        <div 
          className="
            absolute
            bottom-[-150px]
            left-[-80px]
            h-[320px]
            w-[320px]
            rounded-full
            bg-indigo-500/10
            blur-[130px]
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
          py-4
          backdrop-blur-xl
        "
      >

        <div className="space-y-4">

          {/* BADGES */}
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
              Context Panel
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

          {/* TITLE */}
          <h2
            className="
              text-2xl
              font-black
              tracking-tight
              text-white
              leading-tight
            "
          >
            Intelligence Hub
          </h2>

          <p
            className="
              text-xs
              leading-relaxed
              text-slate-400
            "
          >
            AI insights & complaint details
          </p>

        </div>

      </div>

      {/* =====================================================
         SCROLLABLE CONTENT
      ===================================================== */}
      <div
        className="
          relative
          z-10
          flex-1
          min-h-0
          overflow-y-auto
          px-4
          py-4
          space-y-4
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-white/10
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb:hover]:bg-white/20
        "
      >

        {/* =========================================================
           COMPLAINT DETAILS ACCORDION
        ========================================================= */}
        <SectionCard
          title="Complaint Details"
          color="blue"
          expanded={expandedSections.details}
          onToggle={() => toggleSection('details')}
          icon={FileText}
        >

          <div className="space-y-2.5">

            <DetailRow
              label="Status"
              value={complaint?.status ?? 'Open'}
              badge={(complaint?.status ?? 'Open').toLowerCase().replace(/\s+/g, '-')}
            />

            <DetailRow
              label="Priority"
              value={complaint?.priority ?? 'High'}
              badge={(complaint?.priority ?? 'High').toLowerCase()}
            />

            <DetailRow
              label="Department"
              value={complaint?.department ?? 'Public Works'}
            />

            <DetailRow
              label="District"
              value={complaint?.district ?? 'Downtown'}
            />

            <DetailRow
              label="Category"
              value={complaint?.category ?? 'Infrastructure'}
            />

            <DetailRow
              label="Reported"
              value={complaint ? new Date(complaint.createdAt).toLocaleDateString() : '2 days ago'}
            />

          </div>

        </SectionCard>

        {/* Citizen Information section removed as requested */}

        {/* =========================================================
           OFFICER ASSIGNMENT
        ========================================================= */}
        <SectionCard
          title="Assigned Officer"
          color="emerald"
          expanded={expandedSections.officer}
          onToggle={() => toggleSection('officer')}
          icon={ShieldCheck}
        >

          <motion.div
            whileHover={{
              scale: 1.01,
              y: -1,
            }}
            className="
              rounded-[20px]
              border
              border-emerald-500/20
              bg-gradient-to-br
              from-emerald-500/8
              to-teal-500/4
              p-4
              backdrop-blur-xl
              transition-all
              duration-300
            "
          >

            <div className="flex items-start gap-3">

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-br
                  from-emerald-400
                  to-teal-600
                  font-bold
                  text-sm
                  text-white
                  flex-shrink-0
                "
              >
                {(complaint?.assignedOfficerName ?? 'OS')
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0]?.toUpperCase() ?? '')
                  .join('') || 'OS'}
              </div>

              <div className="flex-1 min-w-0">

                <div className="flex items-center gap-2 flex-wrap">

                  <h3 className="text-sm font-bold text-white">
                    {complaint?.assignedOfficerName ?? complaint?.suggestedOfficerName ?? 'Officer Sarah'}
                  </h3>

                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </div>

                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {complaint?.assignedDepartment ?? complaint?.department ?? 'Senior Case Officer'}
                </p>

              </div>

            </div>

            <div className="mt-4 space-y-2.5 border-t border-white/10 pt-4">

              <InfoRow
                icon={Phone}
                value="+1 (555) 987-6543"
              />

              <InfoRow
                icon={Mail}
                value="officer.sarah@gov.local"
              />

            </div>

          </motion.div>

        </SectionCard>

        {/* =========================================================
           ESCALATION STATUS
        ========================================================= */}
        <SectionCard
          title="Escalation Status"
          color="orange"
          expanded={expandedSections.escalation}
          onToggle={() => toggleSection('escalation')}
          icon={Siren}
        >

          <div className="space-y-2.5">

            <TimelineItem
              text="Case escalated to Public Works"
              time="Today, 10:30 AM"
              color="orange"
            />

            <TimelineItem
              text="Senior engineer assigned"
              time="Today, 9:45 AM"
              color="blue"
            />

            <TimelineItem
              text="Initial complaint filed"
              time="2 days ago"
              color="blue"
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

          <div className="space-y-3">

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
          title="Evidence & Files"
          color="slate"
          expanded={expandedSections.evidence}
          onToggle={() => toggleSection('evidence')}
          icon={FileText}
        >

          <div className="space-y-2.5">

            {[
              'pothole-photo.jpg',
              'vehicle-damage.jpg',
              'inspection-report.pdf',
            ].map((file, idx) => (
              <motion.div
                key={idx}
                whileHover={{
                  scale: 1.02,
                  x: 2,
                }}
                className="
                  flex
                  items-center
                  justify-between
                  rounded-[16px]
                  border
                  border-white/10
                  bg-white/[0.03]
                  p-3
                  transition-all
                  duration-300
                  hover:bg-white/[0.05]
                "
              >

                <div className="flex items-center gap-2.5 min-w-0">

                  <div
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      bg-blue-500/10
                      text-sm
                      flex-shrink-0
                    "
                  >
                    📎
                  </div>

                  <div className="min-w-0">

                    <p className="text-xs font-medium text-white truncate">
                      {file}
                    </p>

                    <p className="text-[10px] text-slate-500">
                      128 KB
                    </p>

                  </div>

                </div>

                <button className="flex-shrink-0 h-8 w-8 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/[0.05] transition-all flex items-center justify-center text-slate-400 hover:text-slate-300">
                  <Download className="h-3.5 w-3.5" />
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
  color,
  expanded,
  onToggle,
  icon: Icon,
  children,
}: {
  title: string
  color: 'blue' | 'emerald' | 'orange' | 'indigo' | 'slate'
  expanded: boolean
  onToggle: () => void
  icon?: any
  children?: any
}) {
  const colorClasses: Record<
    'blue' | 'emerald' | 'orange' | 'indigo' | 'slate',
    string
  > = {
    blue: 'border-blue-500/20 hover:border-blue-500/30',
    emerald: 'border-emerald-500/20 hover:border-emerald-500/30',
    orange: 'border-orange-500/20 hover:border-orange-500/30',
    indigo: 'border-indigo-500/20 hover:border-indigo-500/30',
    slate: 'border-white/10 hover:border-white/15',
  }

  return (
    <motion.div
      className={`
        rounded-[20px]
        border
        bg-white/[0.03]
        overflow-hidden
        transition-all
        duration-300
        ${colorClasses[color]}
      `}
    >

      {/* HEADER */}
      <button
        onClick={onToggle}
        className="
          w-full
          flex
          items-center
          justify-between
          gap-3
          px-4
          py-3.5
          hover:bg-white/[0.03]
          transition-all
        "
      >

        <div className="flex items-center gap-2.5 min-w-0">

          {Icon && (
            <Icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
          )}

          <h3 className="text-sm font-semibold text-white">
            {title}
          </h3>

        </div>

        <motion.div
          animate={{
            rotate: expanded ? 180 : 0,
          }}
          transition={{
            duration: 0.3,
          }}
          className="flex-shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </motion.div>

      </button>

      {/* CONTENT */}
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
            transition={{
              duration: 0.3,
            }}
            className="
              border-t
              border-white/8
              px-4
              py-3.5
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
        rounded-[14px]
        border
        border-white/6
        bg-white/[0.02]
        px-3
        py-2.5
      "
    >

      <span className="text-[11px] font-medium text-slate-400">
        {label}
      </span>

      {badge ? (
        <span
          className={`
            rounded-full
            border
            px-2.5
            py-0.5
            text-[10px]
            font-semibold
            ${
              badge === 'open'
                ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                : 'border-orange-500/30 bg-orange-500/10 text-orange-300'
            }
          `}
        >
          {value}
        </span>
      ) : (
        <span className="text-[11px] font-semibold text-slate-200">
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
    <div className="flex items-start gap-2.5">

      <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-500" />

      <p className="text-xs leading-relaxed text-slate-300">
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
    <div className="flex gap-2.5">

      <div
        className={`
          mt-1
          h-2.5
          w-2.5
          flex-shrink-0
          rounded-full
          ${
            color === 'orange'
              ? 'bg-orange-400'
              : color === 'red'
                ? 'bg-red-400'
                : 'bg-blue-400'
          }
        `}
      />

      <div className="min-w-0 flex-1">

        <p className="text-xs font-medium text-slate-200">
          {text}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-500">
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
        scale: 1.01,
        y: -1,
      }}
      className="
        rounded-[16px]
        border
        border-indigo-500/20
        bg-gradient-to-br
        from-indigo-500/8
        to-purple-500/4
        p-3.5
        transition-all
        duration-300
      "
    >

      <div className="flex items-start gap-2.5">

        <div
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            bg-indigo-500/10
            text-sm
            flex-shrink-0
          "
        >
          <Icon className="h-4 w-4 text-indigo-300" />
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex items-center justify-between gap-2">

            <p className="text-xs font-semibold text-white">
              {title}
            </p>

            <p className="text-xs font-black text-indigo-300">
              {value}
            </p>

          </div>

          <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
            {description}
          </p>

        </div>

      </div>

    </motion.div>
  )
}
