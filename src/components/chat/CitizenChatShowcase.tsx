import { type ComponentType, type SVGProps, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  BrainCircuit,
  ChevronDown,
  FileText,
  Globe,
  Mic,
  MessageSquareText,
  PanelLeft,
  Settings,
  Sparkles,
  Stars,
  SquareUserRound,
  Smile,
  SlidersHorizontal,
  SquarePen,
  Volume2,
} from 'lucide-react'

type ChatRole = 'assistant' | 'citizen'

type ChatMessage = {
  id: number
  role: ChatRole
  text: string
  time: string
}

const quickActions = [
  { label: 'Create Image', icon: SquarePen },
  { label: 'Summarize Text', icon: FileText },
  { label: 'Analyze Data', icon: BarChart3 },
  { label: 'Make a Plan', icon: BrainCircuit },
  { label: 'More', icon: SlidersHorizontal },
]

const featureCards = [
  {
    title: 'Smart Summary',
    description: 'Get AI summary of complaints and reports',
    footer: 'Popular',
    icon: Sparkles,
  },
  {
    title: 'Complaint Insights',
    description: 'AI insights and trends from citizen data',
    footer: 'Analytics',
    icon: BarChart3,
  },
  {
    title: 'Draft Reply',
    description: 'Generate professional replies instantly',
    footer: 'Assistant',
    icon: MessageSquareText,
  },
  {
    title: 'Translate',
    description: 'Translate messages in any language',
    footer: 'Languages',
    icon: Globe,
  },
  {
    title: 'Voice Assistant',
    description: 'Speak to Neo and get instant answers',
    footer: 'Voice',
    icon: Volume2,
  },
]

const stats = [
  { label: 'Active Sessions', value: '128', tone: 'emerald' },
  { label: 'Messages Processed', value: '12.4k', tone: 'blue' },
  { label: 'Complaints Solved', value: '2.1k', tone: 'sky' },
  { label: 'Avg. Satisfaction', value: '4.8/5', tone: 'amber' },
  { label: 'Escalations Today', value: '24', tone: 'rose' },
]

const starterMessages: ChatMessage[] = []

function buildReply(message: string) {
  const lower = message.toLowerCase()

  if (lower.includes('status') || lower.includes('track')) {
    return 'I can help you track the complaint, summarize the latest update, or draft a follow-up for the department.'
  }

  if (lower.includes('water') || lower.includes('electric') || lower.includes('streetlight')) {
    return 'I will route this to the correct civic category and prepare a concise escalation note for the assigned officer.'
  }

  return 'I can summarize this complaint, draft a response, translate the message, or prepare the next action plan.'
}

export default function CitizenChatShowcase() {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages)

  const sendMessage = () => {
    const trimmed = prompt.trim()

    if (!trimmed) return

    const citizenMessage: ChatMessage = {
      id: Date.now(),
      role: 'citizen',
      text: trimmed,
      time: 'Now',
    }

    const assistantMessage: ChatMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      text: buildReply(trimmed),
      time: 'Just now',
    }

    setMessages((current) => [...current, citizenMessage, assistantMessage])
    setPrompt('')
  }

  return (
    <div className="relative min-h-[calc(100vh-2rem)] overflow-hidden rounded-[32px] border border-white/10 bg-[#050816] text-white shadow-[0_0_80px_rgba(59,130,246,0.12)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[6%] top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-blue-500/15 blur-[150px]" />
        <div className="absolute right-[6%] top-24 h-[24rem] w-[24rem] rounded-full bg-indigo-500/10 blur-[150px]" />
        <div className="absolute bottom-[-10rem] left-1/3 h-[26rem] w-[26rem] rounded-full bg-cyan-500/10 blur-[180px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:90px_90px] opacity-30" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1500px] flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <TopBar />

        <main className="flex flex-1 flex-col items-center justify-center gap-8 py-8 md:py-12">
          <section className="mx-auto w-full max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-blue-200">
                  Citizen AI
                </span>
                <span className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-200 backdrop-blur-xl">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
                  Live Service Online
                </span>
              </div>

              <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                What Can <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-200 bg-clip-text text-transparent">Neo</span> Help You With Today?
              </h1>

              <p className="mx-auto max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
                AI-powered support for citizen grievances and operations
              </p>
            </motion.div>
          </section>

          <section className="w-full max-w-4xl">
            <PromptCard prompt={prompt} setPrompt={setPrompt} onSend={sendMessage} />
          </section>

          <section className="flex flex-wrap items-center justify-center gap-3">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-slate-200 shadow-[0_0_30px_rgba(59,130,246,0.06)] transition hover:border-blue-400/30 hover:bg-white/[0.06]"
              >
                <action.icon className="h-4 w-4 text-blue-300" />
                {action.label}
              </motion.button>
            ))}
          </section>

          <section className="grid w-full gap-4 md:grid-cols-2 xl:grid-cols-5">
            {featureCards.map((card, index) => (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className="group rounded-[28px] border border-white/8 bg-white/[0.035] p-5 shadow-[0_0_48px_rgba(2,6,23,0.35)] backdrop-blur-2xl transition hover:-translate-y-1 hover:border-blue-400/30 hover:bg-white/[0.05]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-400/15 bg-blue-500/10 text-blue-200 transition group-hover:scale-105">
                  <card.icon className="h-5 w-5" />
                </div>
                <div className="mt-5 space-y-2">
                  <h3 className="text-base font-semibold text-white">{card.title}</h3>
                  <p className="text-sm leading-6 text-slate-400">{card.description}</p>
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
                  <span>{card.footer}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </motion.article>
            ))}
          </section>

          <section className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {stats.map((stat, index) => (
              <motion.article
                key={stat.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${getToneClass(stat.tone)}`} />
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </div>
                <div className="mt-2 text-lg font-semibold tracking-tight text-white">{stat.value}</div>
              </motion.article>
            ))}
          </section>

          <section className="w-full max-w-4xl">
            <AnimatePresence>
              {messages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-4 rounded-[28px] border border-white/8 bg-white/[0.03] p-5 backdrop-blur-2xl"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.28em] text-slate-500">Conversation Preview</div>
                      <div className="mt-1 text-sm text-slate-300">Recent messages from the active citizen thread</div>
                    </div>
                    <div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-slate-400">Realtime</div>
                  </div>

                  <div className="space-y-3">
                    {messages.map((message) => (
                      <ChatBubble key={message.id} message={message} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </main>
      </div>
    </div>
  )
}

function TopBar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/8 bg-[#070b1a]/70 px-4 py-4 backdrop-blur-3xl sm:px-5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-xs font-bold text-white shadow-[0_0_28px_rgba(59,130,246,0.3)]">
            CB
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">Civic Bridge</div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Citizen Portal</div>
          </div>
        </div>

        <div className="hidden items-center gap-3 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2.5 text-xs text-slate-300 md:flex">
          <PanelLeft className="h-4 w-4 text-blue-300" />
          <span>Live</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>Service online</span>
        </div>
      </div>

      <div className="hidden items-center gap-4 lg:flex">
        <HeaderMetric icon={Sparkles} label="Response time" value="1.2s" />
        <HeaderMetric icon={Bell} label="Notifications" value="03" />
      </div>

      <div className="flex items-center gap-3">
        <button className="grid h-11 w-11 place-items-center rounded-2xl border border-white/8 bg-white/[0.04] text-slate-300 transition hover:border-blue-400/30 hover:bg-white/[0.06]">
          <Settings className="h-4.5 w-4.5" />
        </button>

        <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 pr-4">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.25)]">
            U
          </div>
          <div className="hidden min-w-0 sm:block">
            <div className="flex items-center gap-1 text-sm font-medium text-white">
              Profile
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-[11px] text-slate-500">Citizen account</div>
          </div>
        </div>
      </div>
    </header>
  )
}

function HeaderMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-2.5">
      <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/10 text-blue-200">
        <Icon className="h-4 w-4" />
      </div>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
        <div className="text-sm font-medium text-white">{value}</div>
      </div>
    </div>
  )
}

function PromptCard({
  prompt,
  setPrompt,
  onSend,
}: {
  prompt: string
  setPrompt: (value: string) => void
  onSend: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#0b1122] via-[#0a1020] to-[#090f1d] p-2 shadow-[0_0_60px_rgba(59,130,246,0.12)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_55%)]" />
      <div className="relative rounded-[26px] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-2xl sm:p-5">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              onSend()
            }
          }}
          rows={4}
          placeholder="Ask anything you want..."
          className="min-h-[130px] w-full resize-none border-0 bg-transparent text-base leading-7 text-white outline-none placeholder:text-slate-500"
        />

        <div className="mt-5 flex flex-col gap-4 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-slate-300 transition hover:border-blue-400/30 hover:bg-white/[0.06]">
              <Sparkles className="h-4 w-4 text-blue-300" />
              Neo Model
            </button>
            <button className="inline-flex items-center gap-1 text-slate-400 transition hover:text-white">
              Choose model
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <IconButton icon={Mic} title="Voice input" />
            <IconButton icon={Smile} title="Emoji" />
            <button
              onClick={onSend}
              className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-white shadow-[0_0_28px_rgba(59,130,246,0.35)] transition hover:scale-105"
            >
              <ArrowUpRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function IconButton({
  icon: Icon,
  title,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
}) {
  return (
    <button
      title={title}
      className="grid h-12 w-12 place-items-center rounded-2xl border border-white/8 bg-white/[0.04] text-slate-300 transition hover:border-blue-400/30 hover:bg-white/[0.06]"
    >
      <Icon className="h-4.5 w-4.5" />
    </button>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isCitizen = message.role === 'citizen'

  return (
    <div className={`flex ${isCitizen ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-[24px] border px-4 py-3 shadow-[0_0_24px_rgba(59,130,246,0.06)] ${
          isCitizen
            ? 'border-blue-400/25 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-cyan-500/20 text-white'
            : 'border-white/8 bg-white/[0.04] text-slate-200'
        }`}
      >
        <div className="text-sm leading-7">{message.text}</div>
        <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">{message.time}</div>
      </div>
    </div>
  )
}

function getToneClass(tone: string) {
  switch (tone) {
    case 'emerald':
      return 'bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.55)]'
    case 'blue':
      return 'bg-blue-400 shadow-[0_0_18px_rgba(96,165,250,0.55)]'
    case 'sky':
      return 'bg-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.55)]'
    case 'amber':
      return 'bg-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.55)]'
    case 'rose':
      return 'bg-rose-400 shadow-[0_0_18px_rgba(251,113,133,0.55)]'
    default:
      return 'bg-slate-400'
  }
}