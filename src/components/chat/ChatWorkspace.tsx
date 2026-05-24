import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import TopNavbar from './TopNavbar'
import ThreadList from './ThreadList'
import ChatArea from './ChatArea'
import ContextPanel from './ContextPanel'
import {
  createComplaintChatRoom,
  listChatRoomMessages,
  listComplaints,
  markChatRoomRead,
  sendChatRoomMessage,
  type ComplaintMessageRecord,
  type ComplaintRecord,
} from '@/lib/smartgov-api'
import { useSocket } from '@/hooks/useSocket'

type LiveThread = {
  id: string
  complaintId: string
  title: string
  department: string
  district: string
  status: 'open' | 'escalated' | 'urgent' | 'resolved'
  priority: 'low' | 'medium' | 'high' | 'critical'
  officer: string
  lastMessage: string
  unreadCount: number
  slaRemaining: string
  isTyping?: boolean
  lastMessageTime: string
  avatar?: string
}

type WorkspaceMessage = {
  id: string
  type: 'citizen' | 'officer' | 'admin' | 'system'
  author: string
  avatar?: string
  content: string
  timestamp: string
  isRead?: boolean
}

function mapStatus(complaint: ComplaintRecord): LiveThread['status'] {
  if (complaint.status === 'Resolved' || complaint.status === 'Closed') return 'resolved'
  if (complaint.status === 'Escalated') return 'escalated'
  if (complaint.priority === 'Critical' || complaint.priority === 'High') return 'urgent'
  return 'open'
}

function mapPriority(priority: ComplaintRecord['priority']): LiveThread['priority'] {
  return priority === 'Critical' ? 'critical' : priority === 'High' ? 'high' : priority === 'Medium' ? 'medium' : 'low'
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'CB'
}

function toThread(complaint: ComplaintRecord): LiveThread {
  const lastTimelineEntry = [...(complaint.timeline ?? [])].reverse().find((entry) => Boolean(entry.note || entry.action))
  const lastMessage = lastTimelineEntry?.note || lastTimelineEntry?.action || complaint.status
  const officer = complaint.assignedOfficerName || complaint.suggestedOfficerName || 'Unassigned'

  return {
    id: complaint.id,
    complaintId: complaint.grievanceId,
    title: complaint.title,
    department: complaint.department,
    district: complaint.district,
    status: mapStatus(complaint),
    priority: mapPriority(complaint.priority),
    officer,
    lastMessage,
    unreadCount: complaint.status === 'Resolved' ? 0 : 1,
    slaRemaining: complaint.slaDeadline ? 'Active' : 'Tracked',
    isTyping: false,
    lastMessageTime: new Date(complaint.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    avatar: initials(officer !== 'Unassigned' ? officer : complaint.reporterName),
  }
}

function mapMessage(message: ComplaintMessageRecord): WorkspaceMessage {
  const role = message.isAdmin ? 'admin' : message.authorRole === 'citizen' ? 'citizen' : 'officer'

  return {
    id: message.id,
    type: role,
    author: message.authorName,
    avatar: initials(message.authorName),
    content: message.message,
    timestamp: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isRead: true,
  }
}

type ChatWorkspaceProps = {
  view?: 'all' | 'mine' | 'assigned'
  workspaceTitle?: string
  variant?: 'default' | 'admin'
}

export default function ChatWorkspace({ view = 'mine', workspaceTitle, variant = 'default' }: ChatWorkspaceProps) {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([])
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<WorkspaceMessage[]>([])
  const [typingLabel, setTypingLabel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const isAdminWorkspace = variant === 'admin'

  const { on, emit } = useSocket(undefined, true)

  useEffect(() => {
    let mounted = true

    listComplaints({ view, summaryOnly: false, limit: 12 })
      .then((result) => {
        if (!mounted) return

        const liveComplaints = result.complaints ?? []
        setComplaints(liveComplaints)
        setSelectedThread((current) => current ?? liveComplaints[0]?.id ?? null)
      })
      .catch(() => {
        if (mounted) {
          setComplaints([])
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const visibleThreads = useMemo(() => complaints.map(toThread), [complaints])
  const selectedComplaint = useMemo(
    () => complaints.find((complaint) => complaint.id === selectedThread) ?? null,
    [complaints, selectedThread],
  )

  useEffect(() => {
    let mounted = true

    async function loadRoom() {
      if (!selectedComplaint) {
        setRoomId(null)
        setMessages([])
        return
      }

      const { room } = await createComplaintChatRoom(selectedComplaint.id)
      if (!mounted) return

      setRoomId(room.id)

      const response = await listChatRoomMessages(room.id)
      if (!mounted) return

      setMessages(response.messages.map(mapMessage))
      await markChatRoomRead(room.id).catch(() => null)
    }

    void loadRoom().catch(() => {
      if (mounted) {
        setRoomId(null)
        setMessages([])
      }
    })

    return () => {
      mounted = false
    }
  }, [selectedComplaint])

  useEffect(() => {
    if (!roomId) return undefined

    emit('joinRoom', roomId)

    const refreshRoom = async (payload?: { roomId?: string }) => {
      if (payload?.roomId !== roomId) return
      const response = await listChatRoomMessages(roomId)
      setMessages(response.messages.map(mapMessage))
      await markChatRoomRead(roomId).catch(() => null)
    }

    const stopTyping = (payload?: { roomId?: string }) => {
      if (payload?.roomId === roomId) {
        setTypingLabel(null)
      }
    }

    const offMessage = on('message_sent', (payload) => {
      void refreshRoom(payload)
    })
    const offTypingStart = on('typing_start', (payload) => {
      if (payload?.roomId === roomId && payload?.userName) {
        setTypingLabel(payload.userName)
      }
    })
    const offTypingStop = on('typing_stop', stopTyping)
    const offAi = on('ai_response_stream', (payload) => {
      if (payload?.roomId === roomId && payload?.intelligence?.summary) {
        setTypingLabel(null)
      }
    })

    return () => {
      emit('leaveRoom', roomId)
      offMessage()
      offTypingStart()
      offTypingStop()
      offAi()
    }
  }, [emit, on, roomId])

  const unreadCount = visibleThreads.reduce((count, thread) => count + thread.unreadCount, 0)

  const handleSendMessage = async (message: string) => {
    if (!roomId) return

    await sendChatRoomMessage(roomId, message)
    const response = await listChatRoomMessages(roomId)
    setMessages(response.messages.map(mapMessage))
    await markChatRoomRead(roomId).catch(() => null)
  }

  return (
    <div
      className="
        relative
        h-full
        w-full
        min-h-0
        overflow-hidden
        bg-gradient-to-b
        from-[#040813]
        via-[#050816]
        to-[#0a0e1a]
        text-white
      "
    >

      {/* ===================================================
         GLOBAL CINEMATIC BACKGROUND
      =================================================== */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        
        {/* PRIMARY BLUE GLOW - TOP LEFT */}
        <div 
          className="
            absolute
            top-[-200px]
            left-[10%]
            h-[600px]
            w-[600px]
            rounded-full
            bg-blue-500/15
            blur-[200px]
          "
        />
        
        {/* SECONDARY PURPLE GLOW - BOTTOM RIGHT */}
        <div 
          className="
            absolute
            bottom-[-200px]
            right-[5%]
            h-[600px]
            w-[600px]
            rounded-full
            bg-indigo-500/12
            blur-[200px]
          "
        />
        
        {/* AMBIENT RADIAL GRADIENT */}
        <div 
          className="
            absolute
            inset-0
            bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06),transparent_60%)]
          "
        />
        
      </div>

      {/* ===================================================
         MAIN APPLICATION CONTAINER
      =================================================== */}
      <div className="relative z-10 flex h-full min-h-0 w-full flex-col overflow-hidden">

        {/* NAVBAR */}
        <div className="flex-shrink-0">
          <TopNavbar compact={isAdminWorkspace} />
        </div>

        {/* WORKSPACE CONTENT REGION */}
        <div
          className="
            flex-1
            min-h-0
            w-full
            overflow-hidden
            px-0
            py-0
          "
        >

          <AnimatePresence mode="wait">
            {/* ===================================================
               LIVE PREMIUM CHAT WORKSPACE
            =================================================== */}
            <motion.div
              key="workspace"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                duration: 0.4,
              }}
              className="
                h-full
                w-full
                overflow-hidden
                flex
              "
            >
              {/* ===================================================
                 GRID LAYOUT - 3 COLUMN STRUCTURE
              =================================================== */}
              <div
                className={`
                  grid
                  h-full
                  w-full
                  min-h-0
                  gap-3
                  ${isAdminWorkspace ? 'lg:grid-cols-[280px_minmax(0,1fr)_340px]' : 'lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]'}
                `}
              >

                  {/* ===================================================
                     THREAD PANEL
                  =================================================== */}
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
                      duration: 0.45,
                    }}
                    className="
                      h-full
                      min-w-0
                      min-h-0
                      overflow-hidden
                    "
                  >

                    <ThreadList
                      density={isAdminWorkspace ? 'compact' : 'default'}
                      selectedThread={selectedThread}
                      onSelectThread={setSelectedThread}
                      unreadCount={unreadCount}
                      threads={visibleThreads}
                    />

                  </motion.div>

                  {/* ===================================================
                     CHAT PANEL
                  =================================================== */}
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.45,
                      delay: 0.05,
                    }}
                    className="
                      h-full
                      min-w-0
                      min-h-0
                      overflow-hidden
                    "
                  >

                    <div className="h-full min-w-0 min-h-0 overflow-hidden">
                      {selectedThread ? (
                        <ChatArea
                          density={isAdminWorkspace ? 'compact' : 'default'}
                          threadId={selectedThread}
                          messages={messages}
                          onSendMessage={handleSendMessage}
                          typingLabel={typingLabel}
                          threadLabel={selectedComplaint?.title ?? selectedComplaint?.grievanceId ?? 'Selected complaint'}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-3xl">
                          <div className="space-y-5 text-center">
                            <div className="text-7xl">💬</div>
                            <h3 className="text-3xl font-black tracking-tight">Select a conversation</h3>
                            <p className="mx-auto max-w-md text-base leading-8 text-slate-400">
                              Choose a complaint thread to start realtime communication with officers and administrators.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                  </motion.div>

                  {isAdminWorkspace && (
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
                        delay: 0.08,
                      }}
                      className="h-full min-w-0 min-h-0 overflow-hidden"
                    >
                      <ContextPanel
                        threadId={selectedComplaint?.id ?? 'admin-inbox'}
                        complaint={selectedComplaint}
                      />
                    </motion.div>
                  )}

                </div>

              </motion.div>

            </AnimatePresence>

        </div>

      </div>

      {loading && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center">
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-300 backdrop-blur-xl">
            Loading live complaints
          </div>
        </div>
      )}
    </div>
  )
}