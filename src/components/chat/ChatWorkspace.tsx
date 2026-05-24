import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import TopNavbar from './TopNavbar'
import ThreadList from './ThreadList'
import ChatArea from './ChatArea'
import ContextPanel from './ContextPanel'

export default function ChatWorkspace() {
  const [selectedThread, setSelectedThread] =
    useState<string | null>('complaint-2024-001')

  const [unreadCount] = useState(3)

  return (
    <div
      className="
        relative
        h-screen
        overflow-hidden
        bg-[#050816]
        text-white
      "
    >

      {/* GLOBAL BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute top-[-250px] left-[15%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[180px]" />

        <div className="absolute bottom-[-250px] right-[10%] h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[180px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_45%)]" />

      </div>

      {/* MAIN APP */}
      <div className="relative z-10 flex h-full flex-col overflow-hidden">

        {/* NAVBAR */}
        <div className="flex-shrink-0">
          <TopNavbar />
        </div>

        {/* CONTENT */}
        <div
          className="
            flex-1
            min-h-0
            overflow-hidden
          "
        >

          <AnimatePresence mode="wait">
            {/* LIVE CHAT WORKSPACE */}
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
                overflow-hidden
                flex
                gap-4
                p-4"
            >
              {/* GRID */}
              <div
                className="
                  grid
                  h-full
                  min-h-0
                  grid-cols-[340px_minmax(0,1fr)_380px]
                  gap-6
                  w-full
                "
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
                      min-w-0
                      min-h-0
                      overflow-hidden
                    "
                  >

                    <ThreadList
                      selectedThread={selectedThread}
                      onSelectThread={setSelectedThread}
                      unreadCount={unreadCount}
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
                      min-w-0
                      min-h-0
                      overflow-hidden
                    "
                  >

                    {selectedThread ? (
                      <ChatArea
                        threadId={selectedThread}
                      />
                    ) : (
                      <div
                        className="
                          flex
                          h-full
                          items-center
                          justify-center
                          rounded-[32px]
                          border
                          border-white/10
                          bg-white/[0.03]
                          backdrop-blur-3xl
                        "
                      >

                        <div className="space-y-5 text-center">

                          <div className="text-7xl">
                            💬
                          </div>

                          <h3
                            className="
                              text-3xl
                              font-black
                              tracking-tight
                            "
                          >
                            Select a conversation
                          </h3>

                          <p
                            className="
                              mx-auto
                              max-w-md
                              text-base
                              leading-8
                              text-slate-400
                            "
                          >
                            Choose a complaint thread to
                            start realtime communication
                            with officers and administrators.
                          </p>

                        </div>

                      </div>
                    )}

                  </motion.div>

                  {/* ===================================================
                     CONTEXT PANEL
                  =================================================== */}
                  {selectedThread && (
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
                      className="
                        min-w-0
                        min-h-0
                        overflow-hidden
                      "
                    >

                      <ContextPanel
                        threadId={selectedThread}
                      />

                    </motion.div>
                  )}

                </div>

              </motion.div>

            </AnimatePresence>

        </div>

      </div>
    </div>
  )
}