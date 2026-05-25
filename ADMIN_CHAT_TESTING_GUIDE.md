# Admin Chat System - Testing Guide

## Pre-Test Checklist

- [ ] Backend running on `localhost:4000`
- [ ] Frontend running on `localhost:3000`
- [ ] PostgreSQL database connected
- [ ] Socket.IO service initialized
- [ ] Admin user exists with valid JWT token
- [ ] At least 3 complaints exist in database

## Backend Testing

### Test 1: Admin Chat Routes Exist

```bash
# Check routes are registered
curl -X GET http://localhost:4000/api/admin/chat/rooms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected response:
# { "success": true, "data": { "rooms": [...], "total": X } }
```

**Expected**: 200 OK response with rooms array

**Actual**: ________________

### Test 2: List Chat Rooms with Filters

```bash
# Filter by escalated
curl -X GET "http://localhost:4000/api/admin/chat/rooms?filter=escalated" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by urgent
curl -X GET "http://localhost:4000/api/admin/chat/rooms?filter=urgent" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search by grievance ID
curl -X GET "http://localhost:4000/api/admin/chat/rooms?search=GRV001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: Returns filtered rooms

**Actual**: ________________

### Test 3: Get Room Details

```bash
# Get a specific room (use real roomId from previous test)
curl -X GET http://localhost:4000/api/admin/chat/ROOM_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: 200 OK with full room details including messages, complaint, participants

**Actual**: ________________

### Test 4: Send Admin Message

```bash
# Send message to room
curl -X POST http://localhost:4000/api/admin/chat/ROOM_ID/message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "This is a test admin message"
  }'
```

**Expected**: 200 OK with messageId

**Actual**: ________________

**Verification**: Check database - message should appear in `chat_messages` table with `messageType = "admin_message"`

### Test 5: Reassign Officer

```bash
# Reassign complaint to different officer (use real IDs)
curl -X POST http://localhost:4000/api/admin/chat/COMPLAINT_ID/reassign \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newOfficerId": "NEW_OFFICER_ID",
    "reason": "Test reassignment"
  }'
```

**Expected**: 200 OK

**Actual**: ________________

**Verification**: 
- Check `complaints` table - `assignedOfficerId` should be updated
- Check `complaint_timelines` - should have new entry
- Check `audit_logs` - should have `admin.complaint.reassign` action

### Test 6: Escalate Complaint

```bash
# Escalate complaint
curl -X POST http://localhost:4000/api/admin/chat/COMPLAINT_ID/escalate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "high",
    "reason": "Test escalation"
  }'
```

**Expected**: 200 OK

**Actual**: ________________

**Verification**:
- Check `escalations` table - should have new record
- Check `complaints` - if high/emergency, `priority` should be "CRITICAL"
- Check `audit_logs` - should have `admin.complaint.escalate` action

### Test 7: Freeze Chat

```bash
# Freeze chat
curl -X POST http://localhost:4000/api/admin/chat/COMPLAINT_ID/freeze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Test freeze"
  }'
```

**Expected**: 200 OK

**Actual**: ________________

**Verification**:
- Check `complaints` table - `timeline` field should have `chatFrozen: true`
- Check `audit_logs` - should have `admin.chat.freeze` action

### Test 8: Unfreeze Chat

```bash
# Unfreeze chat
curl -X POST http://localhost:4000/api/admin/chat/COMPLAINT_ID/unfreeze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected**: 200 OK

**Actual**: ________________

**Verification**:
- Check `complaints` - `timeline` should have `chatFrozen: false`
- Check `audit_logs` - should have `admin.chat.unfreeze` action

### Test 9: Broadcast Alert

```bash
# Broadcast to all complaints
curl -X POST http://localhost:4000/api/admin/chat/broadcast \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test broadcast message",
    "priority": "high",
    "scope": "all"
  }'
```

**Expected**: 200 OK with `{ "broadcastTo": X }`

**Actual**: ________________

**Verification**:
- Check `chat_messages` - should have system messages in each room
- Check `chat_notifications` - should have entries for all participants
- Check `audit_logs` - should have `admin.broadcast.alert` action

### Test 10: Check Audit Logs

```bash
# Verify admin actions are logged
curl -X GET "http://localhost:4000/api/admin/audit-logs?action=admin.chat" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected**: List of admin actions with timestamps

**Actual**: ________________

---

## Frontend Testing

### Test 11: Navigate to Admin Chat Page

1. Login as admin user
2. Navigate to `/admin/chat`
3. Check page loads without errors

**Expected**: Page renders with 4-column layout

**Actual**: ________________

### Test 12: Room List Loads

**Steps**:
1. Page loads
2. Wait for room list to populate (2-3 seconds)
3. Verify rooms appear in left panel

**Expected**: 
- Unread count badges visible
- Priority badges (HIGH, MEDIUM, LOW)
- Escalation indicators visible

**Actual**: ________________

### Test 13: Search Rooms

**Steps**:
1. Type in search box: "GRV001"
2. Verify list filters

**Expected**: Only matching rooms shown

**Actual**: ________________

### Test 14: Filter by Escalated

**Steps**:
1. Click "Escalated" tab
2. Verify only escalated rooms shown

**Expected**: List updates with escalated rooms only

**Actual**: ________________

### Test 15: Select Room

**Steps**:
1. Click any room in list
2. Wait for details to load
3. Check details panel fills in

**Expected**: 
- Complaint info card appears
- Messages load
- Participants list visible
- Action buttons enabled

**Actual**: ________________

### Test 16: View Messages

**Steps**:
1. Room selected
2. Scroll through message history
3. Verify message format and timestamps

**Expected**:
- Each message shows sender, role, content
- Admin messages highlighted
- Newest messages at bottom
- Auto-scroll when new message arrives

**Actual**: ________________

### Test 17: Send Admin Message

**Steps**:
1. Room selected
2. Type in message input: "Test admin message"
3. Click Send or press Enter
4. Wait for message to appear

**Expected**:
- Message appears immediately in chat
- Input cleared
- Message marked as "admin"
- Notification sent to participants

**Actual**: ________________

### Test 18: Reassign Officer

**Steps**:
1. Room selected
2. Click "Reassign Officer" button
3. Prompt appears for officer ID
4. Enter valid officer ID
5. Confirm

**Expected**:
- Officer info updates in complaint card
- Message appears in chat
- Notification sent
- Audit log created

**Actual**: ________________

### Test 19: Escalate Complaint

**Steps**:
1. Room selected
2. Click "Escalate" button
3. Prompt for level
4. Prompt for reason
5. Confirm

**Expected**:
- Priority updates (CRITICAL)
- Escalation alert appears
- Message in chat
- All admins notified

**Actual**: ________________

### Test 20: Freeze Chat

**Steps**:
1. Room selected
2. Click "Freeze Chat" button
3. Enter reason
4. Confirm

**Expected**:
- Button changes to "Unfreeze Chat"
- Alert message appears
- Audit log created

**Actual**: ________________

### Test 21: Unfreeze Chat

**Steps**:
1. Chat already frozen (from Test 20)
2. Click "Unfreeze Chat"
3. Confirm

**Expected**:
- Button reverts to "Freeze Chat"
- Success message
- Audit log created

**Actual**: ________________

---

## Real-time Testing (Socket.IO)

### Test 22: Admin Joins Monitoring

**Steps**:
1. Open browser dev tools → Console
2. Check Socket.IO connection
3. Verify admin joins "admin_monitoring" room

**Expected**: 
```
Connected to Socket.IO
admin_monitoring room joined
```

**Actual**: ________________

### Test 23: Real-time Message Updates

**Steps**:
1. Admin A has room open
2. Officer sends message in same room
3. Check if Admin A's chat updates automatically

**Expected**: New message appears without reload

**Actual**: ________________

### Test 24: Escalation Broadcast

**Steps**:
1. Admin A has room list open
2. Admin B escalates a complaint
3. Check if Admin A's list updates

**Expected**: Room appears in escalated list, notification appears

**Actual**: ________________

### Test 25: Officer Reassignment Broadcast

**Steps**:
1. Admin A has room open
2. Admin B reassigns officer
3. Check if Admin A's view updates

**Expected**: Officer name updates, message appears

**Actual**: ________________

---

## Database Verification Tests

### Test 26: Chat Messages Stored Correctly

```sql
SELECT * FROM chat_messages 
WHERE message_type = 'admin_message' 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected**: Admin messages visible with correct sender

**Actual**: ________________

### Test 27: Escalations Logged

```sql
SELECT * FROM escalations 
WHERE status = 'active' 
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected**: Escalation records with level and reason

**Actual**: ________________

### Test 28: Timeline Entries Created

```sql
SELECT * FROM complaint_timelines 
WHERE reason LIKE '%reassign%' OR reason LIKE '%escalat%'
ORDER BY created_at DESC 
LIMIT 5;
```

**Expected**: Timeline entries for admin actions

**Actual**: ________________

### Test 29: Audit Log Complete

```sql
SELECT * FROM audit_logs 
WHERE action LIKE 'admin.%'
ORDER BY created_at DESC 
LIMIT 10;
```

**Expected**: All admin actions logged with metadata

**Actual**: ________________

---

## Load Testing

### Test 30: Handle Multiple Simultaneous Admins

**Steps**:
1. Open 3 browser windows (different admins)
2. Each selects different rooms
3. Admin 1 sends message
4. Check if Admins 2 & 3 receive updates

**Expected**: All admins receive real-time updates

**Actual**: ________________

### Test 31: Broadcast to Large Number of Rooms

**Steps**:
1. Ensure 100+ complaints in database
2. Broadcast alert to all
3. Verify performance (should complete in <5s)

**Expected**: Broadcast completes, all notifications created

**Actual**: ________________

---

## Edge Cases

### Test 32: Non-admin Access Denied

```bash
curl -X GET http://localhost:4000/api/admin/chat/rooms \
  -H "Authorization: Bearer CITIZEN_TOKEN"
```

**Expected**: 403 Forbidden or 401 Unauthorized

**Actual**: ________________

### Test 33: Invalid Room ID

```bash
curl -X GET http://localhost:4000/api/admin/chat/invalid-id \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected**: 404 Not Found

**Actual**: ________________

### Test 34: Missing Required Fields

```bash
curl -X POST http://localhost:4000/api/admin/chat/ROOM_ID/message \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected**: 400 Bad Request

**Actual**: ________________

### Test 35: Empty Message

```bash
curl -X POST http://localhost:4000/api/admin/chat/ROOM_ID/message \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": ""}'
```

**Expected**: 400 Bad Request or 422 Unprocessable

**Actual**: ________________

---

## Acceptance Criteria Checklist

- [ ] All 35 tests passed
- [ ] No console errors on frontend
- [ ] No server errors in backend logs
- [ ] Real-time updates working via Socket.IO
- [ ] Audit logs capturing all admin actions
- [ ] Database consistency maintained
- [ ] Performance acceptable (<2s for most operations)
- [ ] UI responsive and user-friendly
- [ ] Error messages clear and helpful

---

## Sign-off

**Tested By**: ________________
**Date**: ________________
**Status**: ⬜ PASS / ⬜ FAIL

**Notes**:
_________________________________________________________________________

_________________________________________________________________________

_________________________________________________________________________

---

**Testing Complete**: YES / NO
**Ready for Production**: YES / NO
