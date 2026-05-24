// =========================================================
// PREMIUM CHAT WORKSPACE EXPORTS
// SmartGov Enterprise Communication System
// =========================================================

/* =========================================================
   MAIN WORKSPACE
========================================================= */

export { default as ChatWorkspace } from './ChatWorkspace'

/* =========================================================
   LAYOUT & STRUCTURE
========================================================= */

export { default as TopNavbar } from './TopNavbar'
export { default as HeroHeader } from './HeroHeader'
export { default as FilterSection } from './FilterSection'
export { default as AnalyticsCards } from './AnalyticsCards'

/* =========================================================
   THREAD MANAGEMENT
========================================================= */

export { default as ThreadList } from './ThreadList'
export { default as ThreadCard } from './ThreadCard'
export { default as ThreadSkeleton } from './ThreadSkeleton'
export { default as ThreadFilters } from './ThreadFilters'

/* =========================================================
   CHAT SYSTEM
========================================================= */

export { default as ChatArea } from './ChatArea'
export { default as ChatMessage } from './ChatMessage'
export { default as ChatComposer } from './ChatComposer'
export { default as MessageAttachments } from './MessageAttachments'
export { default as TypingIndicator } from './TypingIndicator'
export { default as ReadReceipt } from './ReadReceipt'
export { default as ChatEmptyState } from './ChatEmptyState'

/* =========================================================
   CONTEXT & AI PANEL
========================================================= */

export { default as ContextPanel } from './ContextPanel'
export { default as ComplaintTimeline } from './ComplaintTimeline'
export { default as SLAWidget } from './SLAWidget'
export { default as AIInsights } from './AIInsights'
export { default as OfficerCard } from './OfficerCard'
export { default as CitizenCard } from './CitizenCard'

/* =========================================================
   SYSTEM EVENTS
========================================================= */

export { default as SystemEvent } from './SystemEvent'
export { default as NotificationToast } from './NotificationToast'
export { default as LiveStatusBar } from './LiveStatusBar'

/* =========================================================
   PREMIUM UI COMPONENTS
========================================================= */

export { default as GlassCard } from './ui/GlassCard'
export { default as GlowButton } from './ui/GlowButton'
export { default as StatusBadge } from './ui/StatusBadge'
export { default as GradientBorder } from './ui/GradientBorder'
export { default as AnimatedCounter } from './ui/AnimatedCounter'
export { default as PremiumLoader } from './ui/PremiumLoader'

/* =========================================================
   ANALYTICS & DASHBOARD
========================================================= */

export { default as AnalyticsGrid } from './analytics/AnalyticsGrid'
export { default as RealtimeMetrics } from './analytics/RealtimeMetrics'
export { default as ActivityFeed } from './analytics/ActivityFeed'
export { default as ComplaintStats } from './analytics/ComplaintStats'

/* =========================================================
   RESPONSIVE HELPERS
========================================================= */

export { default as MobileSidebar } from './responsive/MobileSidebar'
export { default as TabletWorkspace } from './responsive/TabletWorkspace'
export { default as DesktopWorkspace } from './responsive/DesktopWorkspace'

/* =========================================================
   ANIMATION UTILITIES
========================================================= */

export { default as FadeIn } from './animations/FadeIn'
export { default as SlideUp } from './animations/SlideUp'
export { default as GlowPulse } from './animations/GlowPulse'
export { default as FloatingOrb } from './animations/FloatingOrb'

/* =========================================================
   TYPES
========================================================= */

export type {
  ChatThread,
  ChatMessageType,
  ComplaintStatus,
  OfficerUser,
  CitizenUser,
  AttachmentFile,
  NotificationItem,
  AnalyticsMetric,
} from './types'

/* =========================================================
   HOOKS
========================================================= */

export { useChatSocket } from './hooks/useChatSocket'
export { useRealtimeMessages } from './hooks/useRealtimeMessages'
export { useThreadFilters } from './hooks/useThreadFilters'
export { useNotifications } from './hooks/useNotifications'

/* =========================================================
   SERVICES
========================================================= */

export { default as chatService } from './services/chatService'
export { default as socketService } from './services/socketService'
export { default as notificationService } from './services/notificationService'

/* =========================================================
   CONSTANTS
========================================================= */

export {
  CHAT_STATUS,
  PRIORITY_LEVELS,
  MESSAGE_TYPES,
  SLA_THRESHOLDS,
  SOCKET_EVENTS,
} from './constants'

/* =========================================================
   DESIGN SYSTEM
========================================================= */

export {
  colors,
  gradients,
  shadows,
  animations,
  spacing,
  typography,
} from './design-system'

/* =========================================================
   ENTERPRISE FEATURES INCLUDED
========================================================= */

/*
✅ Realtime Socket Communication
✅ AI Complaint Intelligence
✅ Enterprise Glassmorphism UI
✅ Citizen ↔ Officer ↔ Admin Chat
✅ Live Notifications
✅ SLA Tracking
✅ Escalation Monitoring
✅ Smart Thread Filtering
✅ Attachment Upload System
✅ Read Receipts
✅ Typing Indicators
✅ Mobile Responsive Workspace
✅ Production-Level Layout System
✅ Overflow Protection
✅ Token-Safe Message Rendering
✅ Premium Animation System
✅ Enterprise Analytics Widgets
✅ Modular Architecture
✅ Scalable Component Structure
✅ Government-Grade UX
*/