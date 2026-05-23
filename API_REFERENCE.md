# SmartGov Citizen API Reference

Complete API documentation for the citizen module with examples and response formats.

---

## 🔐 Authentication

All endpoints require a bearer token in the Authorization header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 ENDPOINTS

### Complaints API

#### Create Complaint
```http
POST /api/complaints
Content-Type: application/json

{
  "title": "Pothole on Main Road",
  "category": "Infrastructure",
  "description": "Large pothole causing accidents",
  "state": "Haryana",
  "district": "Gurugram",
  "city": "Gurgaon",
  "address": "Main Road, Sector 12",
  "landmark": "Near Metro Station",
  "pincode": "122001",
  "priority": "High",
  "latitude": 28.456,
  "longitude": 77.123,
  "evidence": [
    {
      "name": "photo.jpg",
      "type": "image/jpeg",
      "size": 2048,
      "dataUrl": "data:image/jpeg;base64,..."
    }
  ]
}

Response 201:
{
  "success": true,
  "message": "Complaint submitted successfully",
  "data": {
    "complaint": {
      "id": "cuid-123",
      "grievanceId": "GRV-2026-ERD-00482",
      "title": "Pothole on Main Road",
      "status": "Submitted",
      "priority": "High",
      "category": "Infrastructure",
      "createdAt": "2026-05-23T10:30:00Z",
      "assignedOfficer": null,
      "timeline": [...]
    }
  }
}
```

#### List My Complaints
```http
GET /api/complaints?view=mine&status=Submitted

Response 200:
{
  "success": true,
  "message": "Complaints fetched successfully",
  "data": {
    "complaintCount": 5,
    "complaints": [
      {
        "id": "cuid-123",
        "grievanceId": "GRV-2026-ERD-00482",
        "title": "Pothole on Main Road",
        "status": "In Progress",
        "priority": "High",
        "assignedOfficerName": "Ramesh Kumar",
        "createdAt": "2026-05-23T10:30:00Z",
        "updatedAt": "2026-05-23T15:45:00Z"
      }
    ]
  }
}
```

#### Get Complaint Details
```http
GET /api/complaints/{complaintId}

Response 200:
{
  "success": true,
  "data": {
    "complaint": {
      "id": "cuid-123",
      "grievanceId": "GRV-2026-ERD-00482",
      "title": "Pothole on Main Road",
      "description": "Large pothole...",
      "status": "In Progress",
      "priority": "High",
      "district": "Gurugram",
      "city": "Gurgaon",
      "address": "Main Road, Sector 12",
      "latitude": 28.456,
      "longitude": 77.123,
      "assignedOfficer": {
        "id": "officer-1",
        "fullName": "Ramesh Kumar",
        "email": "ramesh@gov.in",
        "department": "Infrastructure"
      },
      "timeline": [
        {
          "date": "2026-05-23T10:30:00Z",
          "action": "Complaint submitted",
          "by": "John Doe"
        },
        {
          "date": "2026-05-23T11:00:00Z",
          "action": "Complaint assigned",
          "by": "Admin",
          "note": "Assigned to Ramesh Kumar"
        }
      ],
      "evidence": [...],
      "resolutionSummary": null,
      "createdAt": "2026-05-23T10:30:00Z",
      "updatedAt": "2026-05-23T15:45:00Z"
    }
  }
}
```

#### Get Complaint Analytics
```http
GET /api/complaints/analytics/personal

Response 200:
{
  "success": true,
  "data": {
    "analytics": {
      "totalComplaints": 12,
      "byStatus": {
        "Submitted": 2,
        "Assigned": 1,
        "InProgress": 3,
        "Resolved": 5,
        "Escalated": 1
      },
      "byCategory": {
        "Infrastructure": 8,
        "Health": 2,
        "Education": 2
      },
      "byPriority": {
        "Low": 2,
        "Medium": 5,
        "High": 4,
        "Critical": 1
      },
      "avgResolutionTime": 48,
      "satisfactionRating": 4.2,
      "escalations": 1,
      "resolutionRate": 41.67,
      "feedback": [
        {
          "complaintId": "GRV-2026-ERD-00482",
          "rating": 5,
          "comment": "Great service",
          "date": "2026-05-23T18:00:00Z"
        }
      ],
      "monthlyTrend": [
        {
          "month": "2026-04",
          "count": 3,
          "resolved": 2
        },
        {
          "month": "2026-05",
          "count": 9,
          "resolved": 3
        }
      ]
    }
  }
}
```

#### Update Complaint Status
```http
PATCH /api/complaints/{complaintId}/status
Content-Type: application/json

{
  "newStatus": "In Progress",
  "note": "Started investigating"
}

Response 200:
{
  "success": true,
  "data": {
    "complaint": {
      "id": "cuid-123",
      "status": "In Progress",
      "timeline": [...],
      "updatedAt": "2026-05-23T16:00:00Z"
    }
  }
}
```

---

### Escalations API

#### Create Escalation
```http
POST /api/escalations
Content-Type: application/json

{
  "complaintId": "cuid-123",
  "reason": "Officer has not responded for 5 days",
  "level": "high"
}

Response 201:
{
  "success": true,
  "message": "Complaint escalated successfully",
  "data": {
    "escalation": {
      "id": "esc-123",
      "complaintId": "cuid-123",
      "reason": "Officer has not responded for 5 days",
      "level": "high",
      "status": "active",
      "escalatedBy": "citizen-1",
      "createdAt": "2026-05-23T17:00:00Z"
    }
  }
}
```

#### List Escalations
```http
GET /api/escalations?status=active&level=high

Response 200:
{
  "success": true,
  "data": {
    "total": 3,
    "escalations": [
      {
        "id": "esc-123",
        "complaintId": "cuid-123",
        "reason": "Officer has not responded for 5 days",
        "level": "high",
        "status": "active",
        "escalatedByUser": {
          "fullName": "John Doe",
          "email": "john@example.com"
        },
        "createdAt": "2026-05-23T17:00:00Z"
      }
    ]
  }
}
```

#### Update Escalation
```http
PATCH /api/escalations/{escalationId}
Content-Type: application/json

{
  "status": "resolved",
  "resolutionNote": "Officer contacted and assigned new team member"
}

Response 200:
{
  "success": true,
  "data": {
    "escalation": {
      "id": "esc-123",
      "status": "resolved",
      "resolvedAt": "2026-05-23T18:00:00Z"
    }
  }
}
```

---

### Feedback API

#### Submit Feedback
```http
POST /api/feedback
Content-Type: application/json

{
  "complaintId": "cuid-123",
  "rating": 4,
  "comment": "Good response time",
  "officerRating": 5,
  "overallSatisfaction": true,
  "suggestedImprovements": "Could have provided daily updates"
}

Response 201:
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "feedback": {
      "id": "fb-123",
      "complaintId": "cuid-123",
      "rating": 4,
      "officerRating": 5,
      "createdAt": "2026-05-23T19:00:00Z"
    }
  }
}
```

#### Get Feedback
```http
GET /api/feedback/complaint/{complaintId}

Response 200:
{
  "success": true,
  "data": {
    "feedback": {
      "id": "fb-123",
      "complaintId": "cuid-123",
      "rating": 4,
      "comment": "Good response time",
      "officerRating": 5,
      "overallSatisfaction": true,
      "createdAt": "2026-05-23T19:00:00Z"
    }
  }
}
```

#### Get Citizen Satisfaction Analytics
```http
GET /api/feedback/analytics/satisfaction

Response 200:
{
  "success": true,
  "data": {
    "analytics": {
      "totalFeedback": 45,
      "averageRating": 4.3,
      "averageOfficerRating": 4.5,
      "satisfactionRate": 89.2,
      "ratingDistribution": {
        "1": 2,
        "2": 4,
        "3": 8,
        "4": 18,
        "5": 13
      },
      "officerStats": {
        "officer-1": {
          "name": "Ramesh Kumar",
          "rating": 4.7,
          "count": 12
        },
        "officer-2": {
          "name": "Priya Singh",
          "rating": 4.2,
          "count": 8
        }
      }
    }
  }
}
```

---

### Notifications API

#### Fetch Notifications
```http
GET /api/notifications

Response 200:
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif-1",
        "title": "Officer Assigned",
        "message": "Officer Ramesh has been assigned to your complaint",
        "type": "assignment",
        "priority": "high",
        "isRead": false,
        "actionUrl": "/complaints/cuid-123",
        "createdAt": "2026-05-23T11:00:00Z"
      },
      {
        "id": "notif-2",
        "title": "Status Updated",
        "message": "Your complaint status has been updated to 'In Progress'",
        "type": "status",
        "priority": "medium",
        "isRead": false,
        "actionUrl": "/complaints/cuid-123",
        "createdAt": "2026-05-23T15:30:00Z"
      }
    ]
  }
}
```

#### Mark Notification as Read
```http
POST /api/notifications/{notificationId}/read

Response 200:
{
  "success": true,
  "data": {
    "notification": {
      "id": "notif-1",
      "isRead": true
    }
  }
}
```

#### Mark All Notifications as Read
```http
POST /api/notifications/read-all

Response 200:
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### Chat API

#### Get or Create Chat Room
```http
POST /api/chat/rooms/complaint/{complaintId}

Response 200:
{
  "success": true,
  "data": {
    "room": {
      "id": "room-123",
      "complaintId": "cuid-123",
      "createdAt": "2026-05-23T11:00:00Z"
    }
  }
}
```

#### Send Message
```http
POST /api/chat/rooms/{roomId}/messages
Content-Type: application/json

{
  "message": "Can you please visit the site tomorrow?",
  "receiverId": "officer-1"
}

Response 201:
{
  "success": true,
  "data": {
    "message": {
      "id": "msg-123",
      "roomId": "room-123",
      "senderId": "citizen-1",
      "message": "Can you please visit the site tomorrow?",
      "createdAt": "2026-05-23T17:30:00Z",
      "isRead": false
    }
  }
}
```

#### Get Messages
```http
GET /api/chat/rooms/{roomId}/messages?limit=50

Response 200:
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg-122",
        "senderId": "officer-1",
        "message": "I will visit tomorrow morning",
        "createdAt": "2026-05-23T17:25:00Z",
        "isRead": true
      },
      {
        "id": "msg-123",
        "senderId": "citizen-1",
        "message": "Can you please visit the site tomorrow?",
        "createdAt": "2026-05-23T17:30:00Z",
        "isRead": false
      }
    ]
  }
}
```

---

## 🔄 Common Query Parameters

### Pagination
```
?page=1&limit=20
```

### Filtering
```
?status=Resolved&priority=High
?district=Gurugram&category=Infrastructure
?createdAfter=2026-05-01&createdBefore=2026-05-31
```

### Sorting
```
?sort=createdAt&order=desc
```

### Search
```
?search=pothole
```

---

## 📊 Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Success |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid token |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource doesn't exist |
| 429 | Rate Limited - Too many requests |
| 500 | Server Error - Internal error |

---

## 🔌 Socket.IO Events

### Client → Server

#### Join User Room
```javascript
socket.emit('join', { userId: 'citizen-1' })
```

#### Join Complaint Room
```javascript
socket.emit('join-complaint', { complaintId: 'cuid-123' })
```

#### Send Chat Message
```javascript
socket.emit('chat-message', {
  roomId: 'room-123',
  message: 'Hello officer'
})
```

### Server → Client

#### Notification
```javascript
socket.on('notification', {
  id: 'notif-1',
  title: 'Status Updated',
  message: '...',
  type: 'status',
  priority: 'medium',
  createdAt: '2026-05-23T15:30:00Z'
})
```

#### Complaint Status Update
```javascript
socket.on('complaint-updated', {
  complaintId: 'cuid-123',
  newStatus: 'In Progress',
  updatedAt: '2026-05-23T16:00:00Z'
})
```

#### Chat Message
```javascript
socket.on('chat-message', {
  roomId: 'room-123',
  senderId: 'officer-1',
  message: 'I will visit tomorrow',
  createdAt: '2026-05-23T17:25:00Z'
})
```

---

## 🔐 Error Examples

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "fieldErrors": {
      "title": ["Title is required"],
      "priority": ["Priority must be one of: Low, Medium, High, Critical"]
    }
  }
}
```

### Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized - Invalid or expired token"
}
```

### Not Found
```json
{
  "success": false,
  "message": "Complaint not found"
}
```

---

## 📱 Frontend Integration Example

```typescript
import { submitComplaint, listComplaints, createEscalation } from '@/lib/smartgov-api'

// Create complaint
const result = await submitComplaint({
  title: 'Pothole',
  category: 'Infrastructure',
  // ... other fields
})

// List complaints
const { complaints } = await listComplaints({ view: 'mine', status: 'Resolved' })

// Escalate
await createEscalation(complaintId, 'Officer not responding', 'high')
```

---

## 🧪 Testing Endpoint

```bash
# Health check
curl http://localhost:3000/health

# Create test complaint
curl -X POST http://localhost:3000/api/complaints \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "category": "Infrastructure", ...}'
```

---

**API Version**: 1.0  
**Last Updated**: May 23, 2026  
**Status**: Production Ready
