# Admin Chat System - Quick Reference Guide

## Quick Start

### Access Admin Chat
1. Navigate to: `/admin/chat`
2. View all complaint chat rooms in real-time
3. Click any room to monitor and take action

### API Endpoints

#### Get All Chat Rooms
```bash
curl -X GET http://localhost:4000/api/admin/chat/rooms \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# With filters
curl -X GET "http://localhost:4000/api/admin/chat/rooms?filter=escalated&search=GRV001&limit=20"
```

#### Get Room Details
```bash
curl -X GET http://localhost:4000/api/admin/chat/{roomId} \
  -H "Authorization: Bearer <token>"
```

#### Send Admin Message
```bash
curl -X POST http://localhost:4000/api/admin/chat/{roomId}/message \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "This is an admin message",
    "attachment": null
  }'
```

#### Reassign Officer
```bash
curl -X POST http://localhost:4000/api/admin/chat/{complaintId}/reassign \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "newOfficerId": "officer_id_here",
    "reason": "Original officer unavailable"
  }'
```

#### Escalate Complaint
```bash
curl -X POST http://localhost:4000/api/admin/chat/{complaintId}/escalate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "high",
    "reason": "SLA deadline breached"
  }'
```

#### Freeze Chat
```bash
curl -X POST http://localhost:4000/api/admin/chat/{complaintId}/freeze \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Abusive language detected"
  }'
```

#### Unfreeze Chat
```bash
curl -X POST http://localhost:4000/api/admin/chat/{complaintId}/unfreeze \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

#### Broadcast Alert
```bash
curl -X POST http://localhost:4000/api/admin/chat/broadcast \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "System maintenance at 8 PM IST",
    "priority": "high",
    "scope": "all"
  }'
```

## Frontend Usage Examples

### List Chat Rooms
```typescript
import { listAdminChatRooms } from '@/lib/smartgov-api'

const { data } = await listAdminChatRooms({
  filter: 'escalated',
  search: 'GRV001',
  limit: 20,
  offset: 0
})

// Response: { rooms: [...], total: 125 }
```

### Get Room Details
```typescript
import { getAdminChatRoom } from '@/lib/smartgov-api'

const { data } = await getAdminChatRoom(roomId)

// Response: {
//   room: { id, complaintId, createdAt },
//   complaint: { id, grievanceId, title, ... },
//   participants: [ ... ],
//   messages: [ ... ]
// }
```

### Send Message
```typescript
import { sendAdminChatMessage } from '@/lib/smartgov-api'

await sendAdminChatMessage(roomId, "Officer please expedite this case", attachment)
```

### Real-time Updates with Socket.IO
```typescript
import { useSocket } from '@/hooks/useSocket'

const { socket } = useSocket()

// Admin joins monitoring
socket?.emit('adminJoinMonitoring', adminId)

// Listen for events
socket?.on('escalation_alert', (data) => {
  console.log('Escalation:', data)
  loadRooms() // Refresh room list
})

socket?.on('officer_reassigned', (data) => {
  console.log('Officer reassigned:', data)
  reloadCurrentRoom()
})
```

## Database Queries

### Find Escalated Complaints
```sql
SELECT c.*, e.level, e.reason
FROM complaints c
JOIN escalations e ON c.id = e.complaint_id
WHERE e.status = 'active'
ORDER BY e.created_at DESC
```

### Get Admin Audit Trail
```sql
SELECT *
FROM audit_logs
WHERE action LIKE 'admin.%'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 100
```

### List Frozen Chats
```sql
SELECT id, grievance_id, title
FROM complaints
WHERE timeline->>'chatFrozen' = 'true'
ORDER BY updated_at DESC
```

### Get Officer Reassignments
```sql
SELECT *
FROM audit_logs
WHERE action = 'admin.complaint.reassign'
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
```

## Common Workflows

### Workflow 1: Monitor and Escalate
```
1. Click room → Load details
2. View complaint and escalation status
3. If SLA breached:
   - Click "Escalate" button
   - Select level="high"
   - Enter reason
4. System updates priority and escalation
5. All admins notified via Socket.IO
```

### Workflow 2: Intervene in Emergency
```
1. See room with escalation alert
2. Click "Reassign Officer"
3. Enter officer ID of available officer
4. Send admin message: "Officer, please prioritize this"
5. System notifies new officer
6. Continue monitoring progress
```

### Workflow 3: Handle Abusive Chat
```
1. Notice inappropriate messages in chat
2. Click "Freeze Chat"
3. Enter reason: "Abusive language"
4. Send message: "Chat frozen due to policy violation"
5. Citizen can no longer send messages
6. After investigation, click "Unfreeze Chat"
7. Normal communication resumes
```

### Workflow 4: System-wide Alert
```
1. Emergency situation arises
2. Click "Broadcast Alert"
3. Enter message: "System will be down for maintenance"
4. Select scope: "all" or "department"
5. System sends to all relevant complaints
6. Everyone receives notification
7. Message appears in all chat rooms
```

## Configuration

### Environment Variables (Backend)
```bash
# Socket.IO CORS origins
SOCKET_ORIGINS=http://localhost:3000,https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/civic_db

# Admin JWT Secret
JWT_SECRET=your_secret_key
```

### Socket.IO Setup
```typescript
// In socket.ts
initSocket(server, [
  'http://localhost:3000',
  'https://yourdomain.com'
])
```

## Performance Optimization

### Room List Query
- Limit: Default 20, Max 100 per request
- Use pagination with offset for large datasets
- Filter by escalation status to reduce payload

### Message Fetching
- Messages loaded on-demand (100 at a time)
- Use cursor-based pagination for load more
- Implement virtual scrolling for large histories

### Real-time Updates
- Socket.IO uses room-based pub/sub
- Admin monitoring room broadcasts to all admins
- Specific room joins only get updates for that room

## Debugging

### Check Socket.IO Connection
```typescript
socket?.on('connect', () => console.log('Connected'))
socket?.on('disconnect', () => console.log('Disconnected'))
socket?.on('connect_error', (error) => console.error('Connection error:', error))
```

### View Audit Logs
```bash
# Last 24 hours of admin actions
SELECT * FROM audit_logs
WHERE action LIKE 'admin.%'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
```

### Check Room Status
```typescript
// In browser console
socket?.emit('joinRoom', roomId)
socket?.on('message', (data) => console.log('Message:', data))
```

## Testing

### Test with curl
```bash
# List rooms
curl -X GET http://localhost:4000/api/admin/chat/rooms \
  -H "Authorization: Bearer $(echo $TOKEN)"

# Send message
curl -X POST http://localhost:4000/api/admin/chat/ROOM_ID/message \
  -H "Authorization: Bearer $(echo $TOKEN)" \
  -H "Content-Type: application/json" \
  -d '{"message":"Test message"}'
```

### Test Real-time with Socket.IO CLI
```bash
npm install -g socket.io-cli

# Connect as admin
socket.io-client http://localhost:4000 \
  --query "token=YOUR_JWT_TOKEN" \
  --event "adminJoinMonitoring" --args '["admin_id"]'
```

## Common Issues

### Issue: Admin not receiving real-time updates
**Solution**: Check Socket.IO connection
```typescript
console.log(socket?.id) // Should show socket ID
socket?.emit('adminJoinMonitoring', userId) // Re-join monitoring
```

### Issue: Chat messages not loading
**Solution**: Verify room ID and permissions
```typescript
const { data } = await getAdminChatRoom(roomId)
// Should return messages array
```

### Issue: Escalation not appearing
**Solution**: Check audit logs and escalation table
```sql
SELECT * FROM escalations WHERE complaint_id = 'COMPLAINT_ID'
```

### Issue: Socket rooms not emitting events
**Solution**: Verify Socket.IO namespaces
```typescript
// Check available rooms
io.to('admin_monitoring').emit('test', {})
io.to(`room:${roomId}`).emit('test', {})
```

## Performance Metrics

| Operation | Typical Time | Limit |
|-----------|-------------|-------|
| List rooms | 200-500ms | 100 rooms max per page |
| Load room details | 300-800ms | Single room |
| Send message | 150-400ms | No limit |
| Reassign officer | 200-500ms | No limit |
| Escalate complaint | 150-350ms | No limit |
| Broadcast to all | 1-3s | For 1000+ complaints |

## Support

- **Backend Issues**: Check `/backend/src/controllers/admin-chat.controller.ts`
- **Frontend Issues**: Check `/src/routes/admin.chat.tsx`
- **Database Issues**: Check `audit_logs` and `escalations` tables
- **Real-time Issues**: Check Socket.IO connection and room membership

---

**Last Updated**: May 2026
**Version**: 1.0.0
**Status**: Production Ready
