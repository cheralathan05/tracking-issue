# COMPLETE CITIZEN CHAT IMPLEMENTATION — CIVIC BRIDGE FLOW

This document covers the complete production-level Citizen Chat module implementation including frontend-backend integration, database flows, realtime updates, and the full product lifecycle.

---

## TABLE OF CONTENTS

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Frontend Routes & Pages](#frontend-routes--pages)
4. [Backend API Endpoints](#backend-api-endpoints)
5. [Socket.IO Realtime Events](#socketio-realtime-events)
6. [Chat Workflow](#chat-workflow)
7. [Admin Monitoring System](#admin-monitoring-system)
8. [Escalation System](#escalation-system)
9. [Resolution Verification](#resolution-verification)
10. [Security & Validation](#security--validation)
11. [Testing Guide](#testing-guide)
12. [API Reference](#api-reference)

---

## ARCHITECTURE OVERVIEW

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CIVIC BRIDGE FLOW CHAT SYSTEM                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CITIZEN              │              BACKEND              │    OFFICER     │
│  ──────────────────────────────────────────────────────────────────────   │
│                      │                                   │                  │
│  1. Files Complaint  │  Creates Complaint               │                  │
│                      │──────────────────────────────────>│                  │
│                      │  Assigns Officer                  │                  │
│                      │  Creates Chat Room                │                  │
│                      │                                   │                  │
│  Receives Link ──────│  Socket Notification             │<─ Joins Room    │
│                      │  (Officer Assigned)              │  Sees Complaint │
│                      │                                   │                  │
│  2. Sends Message    │  Stores in ChatMessage           │                  │
│  ──────────────────>│  Creates Notification             │ Receives via    │
│  (Real-time Socket)  │  Emits Socket Event              │ Socket          │
│                      │  Broadcasts to Room              │                  │
│                      │                                   │──────────────>  │
│                      │                                   │  Sees Message   │
│                      │                                   │  Replies        │
│  <────────────────────────── Socket Event ───────────────│                  │
│  Message Appears                                         │                  │
│  Real-time                                               │                  │
│                      │                                   │                  │
│  3. Escalation       │  Marks as Escalated              │                  │
│  (if delayed)        │─ Creates Escalation Record       │                  │
│  ──────────────────>│  Notifies Admins                  │                  │
│                      │                                   │                  │
│                      │                      ┌─────────────────────────────┐ │
│                      │                      │      ADMIN DASHBOARD        │ │
│                      │                      ├─────────────────────────────┤ │
│                      │                      │ Sees Escalation Alert       │ │
│                      │                      │ Can Reassign Officer        │ │
│                      │                      │ Can Freeze Chat             │ │
│                      │                      │ Can Send Admin Message      │ │
│                      │                      │ Can Verify Resolution       │ │
│                      │                      └─────────────────────────────┘ │
│                      │                                   │                  │
│  4. Resolution       │  Officer Uploads Proof           │                  │
│  Uploaded            │  ──────────────────────────────>│                  │
│                      │  Status: Resolved                │                  │
│  <───── Socket ──────│  Notification to Citizen          │<─ Uploads Proof │
│  Sees Proof          │                                   │                  │
│                      │                                   │                  │
│  5. Verification     │  Updates Status to Closed        │                  │
│  Click Accept        │  Creates Timeline Entry          │                  │
│  ──────────────────>│  Marks Feedback                   │                  │
│                      │  Sends Notification              │                  │
│                      │  Creates Audit Log               │                  │
│                      │                                   │                  │
│                      │          WORKFLOW COMPLETE        │                  │
│                      │                                   │                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## DATABASE SCHEMA

### Core Tables

#### `chat_rooms`
```sql
CREATE TABLE chat_rooms (
  id              String @id @default(cuid())
  complaintId     String? @unique
  roomType        String @default("complaint")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  -- Relations
  complaint       Complaint?
  participants    ChatParticipant[]
  messages        ChatMessage[]
  notifications   ChatNotification[]
)
```

**Purpose:** One chat room per complaint. Automatically created when a complaint is filed.

#### `chat_messages`
```sql
CREATE TABLE chat_messages (
  id              String @id @default(cuid())
  roomId          String
  senderId        String
  receiverId      String?
  complaintId     String?
  message         String?
  messageType     String @default("text")  -- text, attachment, system, admin_message
  attachment      Json?
  metadata        Json?
  createdAt       DateTime @default(now())
  isRead          Boolean @default(false)
  
  -- Relations
  room            ChatRoom
  sender          User
  receiver        User?
  complaint       Complaint?
  attachments     ChatAttachment[]
  notifications   ChatNotification[]
)
```

**Message Types:**
- `text`: Normal message
- `attachment`: File/image upload
- `system`: Automated system message
- `admin_message`: Message from admin
- `system_alert`: Critical alert from admin
- `status_update`: Status change notification

#### `chat_participants`
```sql
CREATE TABLE chat_participants (
  id          String @id @default(cuid())
  roomId      String
  userId      String
  role        Role
  joinedAt    DateTime @default(now())
  lastSeenAt  DateTime?
  isMuted     Boolean @default(false)
  
  -- Relations
  room        ChatRoom
  user        User
)
```

**Purpose:** Track who has joined each chat room and their participation level.

#### `chat_notifications`
```sql
CREATE TABLE chat_notifications (
  id          String @id @default(cuid())
  userId      String
  roomId      String
  messageId   String?
  type        String  -- new_message, admin_message, broadcast_alert
  read        Boolean @default(false)
  createdAt   DateTime @default(now())
  
  -- Relations
  user        User
  room        ChatRoom
  message     ChatMessage?
)
```

**Purpose:** Track unread messages and notifications per user.

#### `escalations`
```sql
CREATE TABLE escalations (
  id              String @id @default(cuid())
  complaintId     String @unique
  escalatedBy     String
  level           String  -- low, medium, high, emergency
  reason          String
  status          String @default("active")  -- active, resolved, closed
  resolvedBy      String?
  resolvedAt      DateTime?
  resolutionNote  String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
)
```

**Purpose:** Track complaint escalations and their resolution.

---

## FRONTEND ROUTES & PAGES

### Citizen Routes

#### `/chat`
- **Component:** `src/routes/_app.chat.tsx`
- **Purpose:** Main citizen chat page
- **Features:**
  - Complaint list sidebar (left panel)
  - Chat area (center)
  - Complaint details panel (right)
  - Real-time message updates
  - File upload support
  - Escalation button
  - Resolution verification UI

#### `/chat/:complaintId` (sub-route)
- **Purpose:** Open specific complaint chat
- **Behavior:** Auto-loads complaint and initializes Socket.IO room

### Officer Routes

#### `/officer/chat`
- **Component:** `src/routes/officer.chat.tsx`
- **Purpose:** Officer's chat workspace
- **Features:**
  - Assigned complaints list
  - Real-time message handling
  - Status update controls
  - Resolution upload interface
  - AI assistance panel

### Admin Routes

#### `/admin/chat-monitor`
- **Component:** `src/routes/admin.chat-monitor.tsx`
- **Purpose:** Admin chat monitoring and control center
- **Features:**
  - All chat rooms browser
  - Escalation monitoring
  - Officer performance metrics
  - Message broadcasting
  - Complaint reassignment
  - Chat freezing/unfreezing
  - Resolution verification override

---

## BACKEND API ENDPOINTS

### Chat Management

#### Create/Get Chat Room
```http
POST /api/chat/rooms/complaint/:complaintId
```
**Purpose:** Get or create a chat room for a complaint
**Response:**
```json
{
  "success": true,
  "room": {
    "id": "room_123",
    "complaintId": "complaint_456",
    "roomType": "complaint",
    "createdAt": "2026-05-25T10:00:00Z"
  }
}
```

#### Get Messages
```http
GET /api/chat/rooms/:roomId/messages?limit=50&cursor=msg_xyz
```
**Parameters:**
- `limit`: Number of messages to fetch (default: 50)
- `cursor`: For pagination, ID of last message

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg_001",
      "authorId": "user_123",
      "authorName": "John Doe",
      "authorRole": "citizen",
      "message": "Water is still not fixed",
      "createdAt": "2026-05-25T10:15:00Z",
      "messageType": "text",
      "isAdmin": false,
      "metadata": {
        "reactions": [
          { "userId": "user_456", "emoji": "👍" }
        ]
      }
    }
  ]
}
```

#### Send Message
```http
POST /api/chat/rooms/:roomId/messages
Content-Type: application/json

{
  "message": "Complaint not resolved yet",
  "messageType": "text",
  "attachment": null
}
```

#### Mark as Read
```http
POST /api/chat/rooms/:roomId/read
```

### Complaint Integration

#### Get Complaint Header
```http
GET /api/chat/complaints/:complaintId/header
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "complaint_456",
    "grievanceId": "GRV-2026-001",
    "title": "Water Supply Issue",
    "department": "Water Supply",
    "status": "In Progress",
    "priority": "High",
    "category": "Water Supply",
    "assignedOfficer": {
      "id": "officer_789",
      "name": "Raj Kumar",
      "email": "raj@gov.in",
      "department": "Water Supply"
    },
    "citizen": {
      "id": "user_123",
      "name": "John Doe"
    },
    "isEscalated": false,
    "escalationLevel": null,
    "slaDeadline": "2026-05-28T10:00:00Z",
    "createdAt": "2026-05-25T08:00:00Z"
  }
}
```

### Escalation Endpoints

#### Escalate Complaint
```http
POST /api/chat/complaints/:complaintId/escalate
Content-Type: application/json

{
  "reason": "Officer not responding for 2 days",
  "level": "high"
}
```
**Levels:** `low`, `medium`, `high`, `emergency`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Complaint escalated successfully",
    "escalation": {
      "id": "esc_123",
      "complaintId": "complaint_456",
      "level": "high",
      "reason": "Officer not responding for 2 days",
      "status": "active",
      "escalatedAt": "2026-05-25T10:30:00Z"
    }
  }
}
```

#### Get Escalation Details
```http
GET /api/chat/complaints/:complaintId/escalation
```

### Resolution Verification

#### Upload Resolution Proof
```http
POST /api/chat/complaints/:complaintId/resolution-proof
Content-Type: application/json

{
  "proofUrl": "https://storage.example.com/proof_image.jpg",
  "proofType": "image",
  "description": "Water connection repaired"
}
```

**Proof Types:** `image`, `pdf`, `video`, `document`

**Response:**
```json
{
  "success": true,
  "message": "Resolution proof uploaded successfully",
  "data": {
    "complaintId": "complaint_456",
    "status": "Resolved"
  }
}
```

#### Verify Resolution
```http
POST /api/chat/complaints/:complaintId/verify-resolution
Content-Type: application/json

{
  "verified": true,
  "feedback": "Water flow is now normal. Issue resolved."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Resolution approved",
  "data": {
    "complaintId": "complaint_456",
    "status": "Closed"
  }
}
```

### Admin Endpoints

#### Get Admin Chat Rooms
```http
GET /api/chat/admin/rooms?search=GRV&filter=escalated&sortBy=latest&limit=20
```

**Filters:**
- `all`: All rooms
- `escalated`: Only escalated complaints
- `urgent`: High/Critical priority
- `unread`: Has unread messages

**Sort:**
- `latest`: Most recent first
- `oldest`: Oldest first
- `activity`: By last message time

#### Get Admin Chat Details
```http
GET /api/chat/admin/rooms/:roomId/details
```

**Response includes:** Complaint details, participants, messages, escalation info

#### Send Admin Message
```http
POST /api/chat/admin/rooms/:roomId/message
Content-Type: application/json

{
  "message": "We are investigating this matter. Will update within 24 hours.",
  "attachment": null
}
```

#### Reassign Complaint
```http
POST /api/chat/admin/complaints/:complaintId/reassign
Content-Type: application/json

{
  "newOfficerId": "officer_999",
  "reason": "Previous officer overloaded"
}
```

#### Admin Escalate Complaint
```http
POST /api/chat/admin/complaints/:complaintId/escalate
Content-Type: application/json

{
  "level": "emergency",
  "reason": "Multiple citizen complaints, immediate action needed"
}
```

#### Freeze Chat
```http
POST /api/chat/admin/complaints/:complaintId/freeze-chat
Content-Type: application/json

{
  "reason": "Under investigation"
}
```

**Effect:** Citizens and officers cannot send new messages. Admin can still send messages.

#### Unfreeze Chat
```http
POST /api/chat/admin/complaints/:complaintId/unfreeze-chat
```

#### Broadcast Message
```http
POST /api/chat/admin/broadcast-message
Content-Type: application/json

{
  "message": "Government office will be closed on Sunday",
  "priority": "high",
  "scope": "department",
  "filters": {
    "department": "Water Supply"
  }
}
```

**Scope:**
- `all`: Broadcast to all complaints
- `department`: Filter by department
- `district`: Filter by district

---

## SOCKET.IO REALTIME EVENTS

### Client Emit → Server Listen

#### Join Room
```javascript
socket.emit('join_room', {
  roomId: 'room_123',
  userId: 'user_456',
  role: 'citizen'
})
```

#### Send Message
```javascript
socket.emit('send_message', {
  roomId: 'room_123',
  message: 'Can you please update on the status?',
  messageType: 'text'
})
```

#### Typing Indicator
```javascript
socket.emit('typing', {
  roomId: 'room_123',
  isTyping: true
})
```

#### Mark as Seen
```javascript
socket.emit('mark_seen', {
  roomId: 'room_123',
  messageId: 'msg_001'
})
```

### Server Emit → Client Listen

#### Message Received
```javascript
socket.on('message', (data) => {
  console.log('New message:', data)
  // {
  //   id: 'msg_123',
  //   authorId: 'user_456',
  //   authorName: 'Officer Name',
  //   message: 'We are working on it',
  //   timestamp: '2026-05-25T10:30:00Z',
  //   messageType: 'text'
  // }
})
```

#### Complaint Escalated
```javascript
socket.on('complaint_escalated', (data) => {
  console.log('Escalation:', data)
  // {
  //   complaintId: 'complaint_456',
  //   level: 'high',
  //   reason: 'Officer not responding',
  //   escalatedAt: '2026-05-25T10:30:00Z'
  // }
})
```

#### Resolution Uploaded
```javascript
socket.on('resolution_uploaded', (data) => {
  console.log('Resolution:', data)
  // {
  //   complaintId: 'complaint_456',
  //   proofType: 'image',
  //   uploadedAt: '2026-05-25T14:00:00Z'
  // }
})
```

#### Resolution Verified
```javascript
socket.on('resolution_verified', (data) => {
  console.log('Verified:', data)
  // {
  //   complaintId: 'complaint_456',
  //   verified: true,
  //   feedback: 'Approved',
  //   newStatus: 'Closed',
  //   verifiedAt: '2026-05-25T14:15:00Z'
  // }
})
```

#### Typing Indicator
```javascript
socket.on('user_typing', (data) => {
  // { userId: 'user_456', isTyping: true }
})
```

#### Status Update
```javascript
socket.on('status_updated', (data) => {
  // {
  //   complaintId: 'complaint_456',
  //   oldStatus: 'Assigned',
  //   newStatus: 'In Progress',
  //   changedAt: '2026-05-25T10:45:00Z'
  // }
})
```

#### Admin Message
```javascript
socket.on('admin_message', (data) => {
  // Admin message with special styling/badge
})
```

---

## CHAT WORKFLOW

### Complete End-to-End Flow

#### Step 1: Complaint Filing
```
1. Citizen visits /complaints/new
2. Fills complaint form and submits
3. Backend creates Complaint record
4. Backend creates ChatRoom (complaintId-linked)
5. Backend initializes ChatParticipants:
   - Citizen (role: citizen)
   - Assigned Officer (role: officer, if auto-assigned)
   - Admin observers (role: admin)
6. Citizen receives notification with chat link
7. Officer receives notification about new assignment
```

#### Step 2: Entering Chat
```
1. Citizen clicks chat link or navigates to /chat
2. Frontend fetches complaint list via listThreadsForUser()
3. User selects a complaint
4. Frontend calls getRoomWorkspace() to get full chat context
5. Frontend establishes Socket.IO connection
6. Socket joins room: room_<complaintId>
7. Frontend displays:
   - Complaint header (officer, status, priority)
   - Message history
   - File upload area
   - Escalation button
```

#### Step 3: Messaging
```
1. User types message in ChatComposer
2. User clicks Send
3. Frontend:
   - Emits socket: 'send_message'
   - Calls POST /chat/rooms/:roomId/messages
4. Backend:
   - Stores in ChatMessage table
   - Creates ChatNotification for other participants
   - Emits socket: 'message' to all in room
5. All participants receive update via socket
6. Messages marked as read via POST /chat/rooms/:roomId/read
```

#### Step 4: Status Updates
```
1. Officer updates complaint status
2. Backend updates Complaint.status
3. Backend creates ComplaintTimeline entry
4. Backend emits socket: 'status_updated'
5. Frontend shows status badge update in real-time
6. Citizen receives notification
```

#### Step 5: Escalation
```
1. Citizen clicks Escalate button (if delayed > X hours)
2. Frontend shows escalation modal
3. Citizen selects level and types reason
4. Frontend calls POST /chat/complaints/:complaintId/escalate
5. Backend:
   - Creates Escalation record
   - Updates Complaint.status = "Escalated"
   - Notifies all admins
   - Emits socket: 'complaint_escalated'
6. Admin sees escalation in dashboard
7. Admin can reassign or investigate
```

#### Step 6: Resolution
```
1. Officer uploads proof (image/pdf/video)
2. Frontend calls POST /chat/complaints/:complaintId/resolution-proof
3. Backend:
   - Stores in Complaint.resolutionEvidence
   - Updates status to "Resolved"
   - Emits socket: 'resolution_uploaded'
4. Citizen sees "Resolution Proof Uploaded" message
5. Citizen verifies resolution (Accept/Reject)
6. Frontend calls POST /chat/complaints/:complaintId/verify-resolution
7. Backend:
   - If verified: status = "Closed"
   - Creates timeline entry
   - Emits socket: 'resolution_verified'
8. Chat room archived
9. Citizen can leave feedback
```

---

## ADMIN MONITORING SYSTEM

### Admin Dashboard Features

#### 1. Chat Room Browser
```
GET /chat/admin/rooms?filter=escalated&sortBy=latest

Shows:
- All complaint chats
- Filter by: escalated, urgent, unread
- Sort by: latest activity, oldest, most recent message
- Shows SLA deadline, participant count, escalation level
- Quick actions: reassign, escalate, freeze, broadcast
```

#### 2. Real-Time Monitoring
```
Admin can:
- See all messages in real-time
- View escalation reason
- Check resolution proof
- Monitor SLA compliance
- See officer response time
```

#### 3. Chat Controls
```
Available Actions:
- Send admin message (visible to all)
- Reassign to different officer
- Force escalate
- Freeze chat (no more citizen/officer messages)
- Broadcast message to multiple chats
- Override resolution verification
```

#### 4. SLA Tracking
```
Shows:
- Time until SLA deadline
- Complaints approaching deadline
- Breached SLA cases
- Trends and metrics
```

---

## ESCALATION SYSTEM

### Levels

| Level | Priority | Escalates To | Auto-Triggers |
|-------|----------|--------------|----------------|
| low | Informational | Next supervisor | > 48 hours |
| medium | Important | Department head | > 24 hours |
| high | Urgent | State admin | > 12 hours |
| emergency | Critical | Super admin | > 6 hours / Critical priority |

### Escalation Flow

```
1. Citizen initiates escalation
   ↓
2. System creates Escalation record with level
   ↓
3. Complaint status → "Escalated"
   ↓
4. Admin receives alert notification
   ↓
5. Admin can:
   - Investigate
   - Reassign to different officer
   - Increase priority
   - Provide instructions
   ↓
6. Admin marks escalation as resolved
   ↓
7. Complaint continues normal workflow
```

### Auto-Escalation

```
Cron job checks every hour:
- Complaints without updates > X hours
- If true: Auto-escalate to next level
- Send notifications
- Create audit log
```

---

## RESOLUTION VERIFICATION

### Officer Uploads Proof

```
POST /chat/complaints/:complaintId/resolution-proof

{
  "proofUrl": "https://storage.com/repair_photo.jpg",
  "proofType": "image",
  "description": "Water connection repaired on 2026-05-25"
}

Backend stores in resolutionEvidence array:
[
  {
    "id": "proof_001",
    "type": "image",
    "url": "https://...",
    "uploadedAt": "2026-05-25T14:00:00Z",
    "description": "...",
    "uploadedBy": "officer_id"
  }
]
```

### Citizen Verifies

```
POST /chat/complaints/:complaintId/verify-resolution

{
  "verified": true,
  "feedback": "Water flow is normal. Issue resolved."
}

OR

{
  "verified": false,
  "feedback": "Still having issues. Water pressure is low."
}

If verified = false:
- Status → "In Progress"
- Complaint reopened
- Officer notified
- Escalation may occur

If verified = true:
- Status → "Closed"
- Complaint archived
- Timeline entry created
- Feedback recorded
- Chat room accessible but read-only
```

---

## SECURITY & VALIDATION

### Authentication

```
✓ All endpoints require JWT token
✓ Token validated in requireAuth middleware
✓ Token must be valid and not expired
✓ User role checked for admin endpoints
```

### Authorization

```
Citizen:
✓ Can access own complaints' chats
✓ Can send messages to own complaint
✓ Can escalate own complaints
✓ Can verify resolution

Officer:
✓ Can access assigned complaints' chats
✓ Can send messages
✓ Can update status
✓ Can upload resolution proof

Admin:
✓ Can access all chats
✓ Can send admin messages
✓ Can reassign complaints
✓ Can force escalations
✓ Can freeze/unfreeze chats
✓ Can broadcast messages
```

### Input Validation

```
Message:
- Max length: 5000 characters
- Must not be empty
- XSS protection: escape HTML

File Upload:
- Max size: 50MB
- Allowed types: jpg, png, pdf, mp4
- Scanned for malware
- Stored with unique naming

Complaint ID:
- Must be valid CUID
- Must exist in database
- User must have access
```

### Rate Limiting

```
Per User Per Hour:
- Send message: 100 requests
- Upload file: 10 requests
- Escalate: 5 requests
- Broadcast (admin): 20 requests

Endpoints return 429 Too Many Requests if exceeded
```

---

## TESTING GUIDE

### Manual Testing Scenarios

#### Scenario 1: Citizen Files Complaint and Chats with Officer

```
1. Login as citizen
2. File complaint: "Water Supply Issue"
3. Navigate to /chat
4. Select the complaint from list
5. Send message: "Is someone working on this?"
6. Wait for officer response
7. Check message appears in real-time
8. Verify timestamp and sender info
```

#### Scenario 2: Officer Responds and Updates Status

```
1. Login as officer
2. Navigate to /officer/chat
3. See assigned complaints
4. Click on citizen's complaint
5. Reply: "Yes, we've started work"
6. Update status from "Assigned" → "In Progress"
7. Verify status update appears for citizen in real-time
```

#### Scenario 3: Escalation Flow

```
1. Login as citizen
2. Go to chat for complaint
3. Click "Escalate Complaint"
4. Select level: "High"
5. Enter reason: "Officer not responding"
6. Submit escalation
7. Login as admin
8. Go to /admin/chat-monitor
9. Filter: "escalated"
10. See the complaint in escalated list
11. Open details
12. Send admin message: "Investigating"
13. Reassign to different officer
14. Verify citizen sees update
```

#### Scenario 4: Resolution Verification

```
1. Officer logs in
2. Opens chat for assigned complaint
3. Clicks "Upload Resolution Proof"
4. Selects image file
5. Types: "Water connection repaired"
6. Submits

7. Citizen logs in
8. Sees "Resolution proof uploaded" in chat
9. Clicks "View Proof"
10. Sees image
11. Clicks "Accept" or "Reject"
12. If Accept: Complaint status → "Closed"
13. If Reject: Status → "In Progress", reopened
```

#### Scenario 5: Admin Broadcast

```
1. Login as super_admin
2. Go to /admin/chat-monitor
3. Click "Broadcast Message"
4. Select scope: "Department"
5. Select: "Water Supply"
6. Type: "Government office closed Sunday"
7. Send

8. All citizens in Water Supply complaints see message
9. Message appears as system alert
10. Marked with [BROADCAST ALERT] prefix
```

### Automated Tests

#### Backend Tests (Jest)

```typescript
describe('Chat Service', () => {
  test('Creates chat room for complaint', async () => {
    const complaint = await createTestComplaint()
    const room = await chatService.getOrCreateRoomForComplaint(complaint.id)
    expect(room.complaintId).toBe(complaint.id)
  })

  test('Sends message to chat room', async () => {
    const room = await createTestRoom()
    const message = await chatService.sendMessage({
      roomId: room.id,
      senderId: 'user_123',
      message: 'Test message'
    })
    expect(message.message).toBe('Test message')
  })

  test('Escalates complaint', async () => {
    const complaint = await createTestComplaint()
    const result = await escalationService.createEscalation({
      complaintId: complaint.id,
      reason: 'Delayed',
      escalatedBy: 'user_123'
    })
    expect(result.escalation.level).toBe('medium')
  })
})
```

#### Frontend Tests (Vitest)

```typescript
describe('ChatWorkspace', () => {
  test('Renders complaint list', () => {
    const { getByText } = render(<ChatWorkspace />)
    expect(getByText(/My Complaints/)).toBeInTheDocument()
  })

  test('Sends message via socket', async () => {
    const { getByPlaceholderText, getByRole } = render(<ChatWorkspace />)
    const input = getByPlaceholderText(/Type a message/)
    await userEvent.type(input, 'Test message')
    await userEvent.click(getByRole('button', { name: /Send/ }))
    expect(mockSocket.emit).toHaveBeenCalledWith('send_message', expect.any(Object))
  })
})
```

---

## API REFERENCE

### Frontend Functions

All functions defined in `src/lib/smartgov-api.ts`

```typescript
// Get complaint header
getChatComplaintHeader(complaintId: string)

// Escalate complaint
escalateComplaintFromChat(complaintId: string, { reason, level })

// Get escalation details
getEscalationDetails(complaintId: string)

// Upload resolution proof
uploadResolutionProof(complaintId: string, { proofUrl, proofType, description })

// Verify resolution
verifyResolution(complaintId: string, { verified, feedback })

// Admin operations
getAdminChatRooms({ search, filter, sortBy, limit, offset })
getAdminChatDetails(roomId: string)
sendAdminChatMessage(roomId: string, { message, attachment })
adminReassignComplaint(complaintId: string, { newOfficerId, reason })
adminEscalateComplaint(complaintId: string, { level, reason })
freezeComplaintChat(complaintId: string, { reason })
unfreezeComplaintChat(complaintId: string)
sendBroadcastAdminMessage({ message, priority, scope, filters })
```

### Backend Routes

```
GET    /api/chat/threads
GET    /api/chat/complaints/:complaintId/header
GET    /api/chat/rooms/:roomId/messages
GET    /api/chat/rooms/:roomId/workspace
GET    /api/chat/complaints/:complaintId/escalation
GET    /api/chat/admin/rooms
GET    /api/chat/admin/rooms/:roomId/details

POST   /api/chat/rooms/complaint/:complaintId
POST   /api/chat/rooms/:roomId/messages
POST   /api/chat/rooms/:roomId/read
POST   /api/chat/rooms/:roomId/attachments
POST   /api/chat/rooms/:roomId/upload
POST   /api/chat/rooms/:roomId/messages/:messageId/reaction
POST   /api/chat/rooms/:roomId/messages/:messageId/pin

POST   /api/chat/complaints/:complaintId/escalate
POST   /api/chat/complaints/:complaintId/resolution-proof
POST   /api/chat/complaints/:complaintId/verify-resolution

POST   /api/chat/admin/rooms/:roomId/message
POST   /api/chat/admin/complaints/:complaintId/reassign
POST   /api/chat/admin/complaints/:complaintId/escalate
POST   /api/chat/admin/complaints/:complaintId/freeze-chat
POST   /api/chat/admin/complaints/:complaintId/unfreeze-chat
POST   /api/chat/admin/broadcast-message
```

---

## DEPLOYMENT CHECKLIST

- [x] Database migrations created and tested
- [x] Backend endpoints implemented and tested
- [x] Frontend pages created and styled
- [x] Socket.IO integration working
- [x] Escalation system functional
- [x] Resolution verification working
- [x] Admin monitoring dashboard complete
- [x] Security and validation in place
- [ ] Load testing completed
- [ ] Performance optimization done
- [ ] Documentation reviewed
- [ ] User training materials prepared
- [ ] Deployment to staging
- [ ] UAT testing
- [ ] Production deployment

---

## QUICK START

### For Development

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd civic-bridge-flow-main
npm install
npm run dev
```

### Access Points

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`
- Citizen Chat: `http://localhost:3000/chat`
- Officer Chat: `http://localhost:3000/officer/chat`
- Admin Chat Monitor: `http://localhost:3000/admin/chat-monitor`

### Test Accounts

```
Citizen:
Email: citizen@example.com
Password: password123

Officer:
Email: officer@example.com
Password: password123

Admin:
Email: admin@example.com
Password: password123
```

---

## TROUBLESHOOTING

### Socket Connection Issues

```
Problem: Messages not appearing in real-time
Solution: Check Socket.IO connection in browser console
- Verify socket.io URL is correct
- Check CORS configuration
- Verify port 4000 is open

Command: Check backend socket status
npm run dev -- --debug socket
```

### Chat Room Not Found

```
Problem: Error "Chat room not found"
Solution:
1. Verify complaint exists
2. Check chat room created via endpoint
3. Review database for orphaned rooms

Query:
SELECT * FROM chat_rooms WHERE complaint_id = 'xyz'
```

### Permission Denied

```
Problem: User cannot access chat
Solution:
1. Check JWT token is valid
2. Verify user owns complaint (citizen) or assigned (officer)
3. Check role permissions

Debug: Review middleware/chat.middleware.ts
```

---

## FUTURE ENHANCEMENTS

1. **AI-Powered Responses**
   - Auto-suggest resolution steps
   - Sentiment analysis
   - Chatbot for initial queries

2. **Video Calling**
   - Direct call between citizen and officer
   - Screen sharing for technical issues

3. **Multilingual Support**
   - Auto-translate messages
   - Language preference per user

4. **Advanced Analytics**
   - Response time analytics
   - Resolution rate by department
   - Citizen satisfaction trends

5. **Mobile App**
   - Native iOS/Android
   - Push notifications
   - Offline message queuing

---

**Document Version:** 1.0
**Last Updated:** May 25, 2026
**Maintained By:** Engineering Team

