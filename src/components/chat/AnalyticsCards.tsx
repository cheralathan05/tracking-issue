import { motion } from "framer-motion";
import {
  TrendingUp,
  AlertTriangle,
  Clock3,
  CheckCircle2,
  Users,
  Zap,
  ShieldCheck,
  Activity,
} from "lucide-react";

const analyticsData = [
  {
    id: "open",
    label: "Open Threads",
    value: "24",
    change: "+12%",
    description: "Live active conversations",
    icon: AlertTriangle,
    gradient: "from-cyan-400 via-blue-500 to-indigo-500",
    glow: "shadow-cyan-500/20",
    border: "border-cyan-500/20",
    bg: "from-cyan-500/10 to-blue-500/5",
  },
  {
    id: "escalations",
    label: "Escalations",
    value: "5",
    change: "+4%",
    description: "SLA breach alerts",
    icon: TrendingUp,
    gradient: "from-orange-400 via-red-500 to-pink-500",
    glow: "shadow-red-500/20",
    border: "border-red-500/20",
    bg: "from-red-500/10 to-pink-500/5",
  },
  {
    id: "urgent",
    label: "Urgent Cases",
    value: "8",
    change: "+9%",
    description: "Critical response queue",
    icon: Zap,
    gradient: "from-pink-400 via-rose-500 to-red-500",
    glow: "shadow-pink-500/20",
    border: "border-pink-500/20",
    bg: "from-pink-500/10 to-red-500/5",
  },
  {
    id: "resolved",
    label: "Resolved",
    value: "156",
    change: "+31%",
    description: "Successfully completed",
    icon: CheckCircle2,
    gradient: "from-emerald-400 via-teal-500 to-green-500",
    glow: "shadow-emerald-500/20",
    border: "border-emerald-500/20",
    bg: "from-emerald-500/10 to-green-500/5",
  },
  {
    id: "officers",
    label: "Active Officers",
    value: "12",
    change: "+2",
    description: "Currently online",
    icon: Users,
    gradient: "from-violet-400 via-purple-500 to-indigo-500",
    glow: "shadow-violet-500/20",
    border: "border-violet-500/20",
    bg: "from-violet-500/10 to-indigo-500/5",
  },
  {
    id: "response",
    label: "Avg Response",
    value: "2.4m",
    change: "-18%",
    description: "Faster than yesterday",
    icon: Clock3,
    gradient: "from-slate-300 via-blue-400 to-cyan-400",
    glow: "shadow-blue-500/20",
    border: "border-blue-500/20",
    bg: "from-blue-500/10 to-slate-500/5",
  },
];

export default function AnalyticsCards() {
  return (
    <section className="relative w-full">
      {/* GRID */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {analyticsData.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.45,
                delay: index * 0.06,
                ease: "easeOut",
              }}
              whileHover={{
                y: -6,
                scale: 1.015,
              }}
              className="group relative"
            >
              {/* OUTER GLOW */}
              <div
                className={`absolute inset-0 rounded-[28px] opacity-0 blur-3xl transition duration-500 group-hover:opacity-100 bg-gradient-to-r ${card.gradient}`}
              />

              {/* CARD */}
              <div
                className={`
                  relative
                  overflow-hidden
                  rounded-[28px]
                  border
                  ${card.border}
                  bg-gradient-to-br
                  ${card.bg}
                  backdrop-blur-2xl
                  p-5
                  min-h-[210px]
                  transition-all
                  duration-500
                  bg-[#081120]/90
                  shadow-2xl
                  ${card.glow}
                `}
              >
                {/* TOP BAR */}
                <div className="flex items-start justify-between">
                  {/* ICON */}
                  <div
                    className={`
                      flex h-14 w-14 items-center justify-center
                      rounded-2xl
                      border border-white/10
                      bg-white/[0.04]
                      backdrop-blur-xl
                    `}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  {/* LIVE DOT */}
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
                    <span className="text-[11px] font-medium text-white/60">
                      Live
                    </span>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="mt-7">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-white/45">
                    {card.label}
                  </p>

                  {/* VALUE */}
                  <div className="mt-3 flex items-end gap-3">
                    <motion.h2
                      initial={{ scale: 0.7 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: index * 0.06 + 0.25,
                        type: "spring",
                        stiffness: 180,
                      }}
                      className={`
                        bg-gradient-to-r
                        ${card.gradient}
                        bg-clip-text
                        text-[42px]
                        font-black
                        leading-none
                        tracking-tight
                        text-transparent
                      `}
                    >
                      {card.value}
                    </motion.h2>

                    <span className="mb-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                      {card.change}
                    </span>
                  </div>

                  {/* DESCRIPTION */}
                  <p className="mt-3 text-sm leading-6 text-white/45">
                    {card.description}
                  </p>
                </div>

                {/* MICRO CHART */}
                <div className="mt-7 flex h-12 items-end gap-1">
                  {[4, 2, 5, 3, 6, 2, 4, 3].map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height * 7}px` }}
                      transition={{
                        delay: index * 0.06 + 0.4 + i * 0.03,
                        duration: 0.35,
                      }}
                      className={`
                        flex-1 rounded-full
                        bg-gradient-to-t
                        ${card.gradient}
                        opacity-50
                        transition-all
                        duration-300
                        group-hover:opacity-90
                      `}
                    />
                  ))}
                </div>

                {/* BOTTOM STATUS */}
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-white/50">
                      System stable
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs text-white/50">
                      Realtime sync
                    </span>
                  </div>
                </div>

                {/* ANIMATED BORDER */}
                <div
                  className={`
                    absolute inset-0 rounded-[28px]
                    opacity-0 group-hover:opacity-100
                    transition duration-500
                    border border-white/10
                  `}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}