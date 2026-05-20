# Chat Support Feature (SmartGov)

This document describes the new Chat Support feature: database schema, backend endpoints, realtime integration, and frontend scaffolding.

Summary
- Prisma models added: `ChatRoom`, `ChatParticipant`, `ChatMessage`, `ChatAttachment`, `ChatNotification`.
- Backend: REST endpoints under `/api/chat` and Socket.IO realtime handlers in `backend/src/server.ts`.
- Frontend: lightweight chat UI at `src/components/ui/ChatPanel.tsx` and a `useSocket` hook.

Quick start (local)

1. Install dependencies for backend and frontend:

```bash
cd backend
npm install
cd ..
npm install
```

2. Run Prisma migrate to apply new chat models:

```bash
cd backend
npx prisma migrate dev --name add_chat_models
```

3. Start backend in dev:

```bash
cd backend
npm run dev
```

4. Start frontend (from repo root):

```bash
npm run dev
```

APIs
- `POST /api/chat/rooms/complaint/:complaintId` — create or get chat room for a complaint (requires auth)
- `GET /api/chat/rooms/:roomId/messages` — list messages
- `POST /api/chat/rooms/:roomId/messages` — send a message
- `POST /api/chat/rooms/:roomId/attachments` — create an attachment message (MVP, accepts `fileUrl`)

Realtime (Socket.IO)
- Connect to backend Socket.IO namespace (same origin).
- Events:
  - `joinRoom` (roomId) — join a room
  - `leaveRoom` (roomId) — leave a room
  - `sendMessage` (payload) — server persists then broadcasts `message` event to `room:{roomId}`

Security
- All REST chat endpoints are protected by existing `requireAuth` middleware.
- `requireChatAccess` middleware enforces that only complaint owner, assigned officer, or chat participants (and admins) can access room messages.

Next steps / Improvements
- Replace the attachment endpoint with a signed-upload flow (S3/Cloud storage) and server-side validation.
- Add pagination, unread counts, typing indicators, presence, and message delivery receipts.
- Add client-side UI polish, image previews, and file upload controls.
