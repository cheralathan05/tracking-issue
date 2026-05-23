# SmartGov Citizen Module - Quick Start & Testing Guide

Complete testing guide to verify the 100% working citizen module.

---

## 🚀 QUICK START (5 MINUTES)

### Prerequisites
- Backend running on `http://localhost:3000`
- Frontend running on `http://localhost:5173`
- PostgreSQL database configured
- Email service configured (optional for testing)

### Step 1: Start Backend
```bash
cd backend
npm install  # if needed
npm run dev
```

Backend should start on port 3000 with message:
```
✓ SmartGov citizen auth backend is running
```

### Step 2: Start Frontend
```bash
npm install  # if needed
npm run dev
```

Frontend should start on port 5173.

### Step 3: Verify Health
```bash
curl http://localhost:3000/health

# Response:
# {"success": true, "message": "SmartGov citizen auth backend is running"}
```

---

## 🧪 COMPLETE TESTING WORKFLOW

### Test 1: User Registration (2 min)
1. Go to `http://localhost:5173/register`
2. Fill form:
   - Full Name: `Aarav Sharma`
   - Email: `aarav@example.com`
   - Mobile: `+91-9000000000`
   - Aadhaar: `1234 5678 9012 3456`
   - State: `Haryana`
   - District: `Gurugram`
   - Address: `123 Main Road, Sector 12`
   - Password: `Test@123456`
3. Submit
4. ✅ Should see "Account created, check email for OTP"

### Test 2: OTP Verification (2 min)
1. Check backend console or database for OTP (default test OTP: `123456`)
2. Go to `http://localhost:5173/verify-otp`
3. Enter OTP
4. ✅ Should redirect to login page

### Test 3: User Login (1 min)
1. Go to `http://localhost:5173/login`
2. Email: `aarav@example.com`
3. Password: `Test@123456`
4. ✅ Should redirect to `/_app/dashboard`

### Test 4: View Dashboard (1 min)
1. On dashboard, verify:
   - ✅ Analytics cards visible
   - ✅ Total complaints: 0
   - ✅ Active complaints: 0
   - ✅ Resolved: 0
   - ✅ Escalated: 0

### Test 5: Create Complaint (3 min)
1. Click "New Complaint"
2. Go to `/_app/complaints/new`
3. Fill form:
   - Title: `Broken streetlight in Sector 12`
   - Category: `Infrastructure`
   - Description: `The street light is broken and needs replacement`
   - District: `Gurugram`
   - City: `Gurgaon`
   - Address: `Sector 12, Near Park`
   - Priority: `High`
4. Upload test image (optional)
5. Click "Use My GPS" (will ask for location permission)
6. Submit
7. ✅ Should see success message with grievance ID (e.g., `GRV-2026-ABC-0001`)

### Test 6: View Complaint (2 min)
1. Go to `/_app/complaints`
2. ✅ Should see your complaint in list
3. Click on complaint
4. ✅ Should open detail page with:
   - Complaint info
   - Timeline showing submission
   - Officer assignment status
   - Evidence section

### Test 7: Notifications (1 min)
1. Click bell icon in navbar
2. ✅ Should see notification:
   - "Complaint submitted successfully"
   - Status: Unread
3. Click notification to mark as read
4. ✅ Status should change to read

### Test 8: Analytics (1 min)
1. Go to `/_app/reports`
2. ✅ Should see:
   - Total complaints: 1
   - Recent complaint card
   - Charts (might be empty with one complaint)

### Test 9: Settings (1 min)
1. Go to `/_app/settings`
2. ✅ Should see:
   - Profile information populated
   - Notification preferences
   - Theme settings
   - Security options

### Test 10: Create Second Complaint (2 min)
1. Go to `/_app/complaints/new`
2. Fill different complaint:
   - Title: `Garbage pile-up on Main Road`
   - Category: `Sanitation`
   - Priority: `Medium`
3. Submit
4. ✅ Now should have 2 complaints

---

## 🔌 BACKEND API TESTING

### Test Complaint Creation via API
```bash
curl -X POST http://localhost:3000/api/complaints \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Complaint",
    "category": "Infrastructure",
    "description": "Test description",
    "state": "Haryana",
    "district": "Gurugram",
    "city": "Gurgaon",
    "address": "Test Address",
    "pincode": "122001",
    "priority": "High",
    "reporterName": "Test User",
    "reporterMobile": "9000000000",
    "evidence": []
  }'

# Should return 201 with complaint data
```

### Test List Complaints
```bash
curl -X GET "http://localhost:3000/api/complaints?view=mine" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return list of complaints
```

### Test Get Complaint Details
```bash
curl -X GET http://localhost:3000/api/complaints/{complaintId} \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return full complaint details
```

### Test Create Escalation
```bash
curl -X POST http://localhost:3000/api/escalations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "complaintId": "{complaintId}",
    "reason": "Officer not responding",
    "level": "high"
  }'

# Should return 201 with escalation
```

### Test Submit Feedback
```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "complaintId": "{complaintId}",
    "rating": 5,
    "comment": "Great service",
    "officerRating": 5,
    "overallSatisfaction": true
  }'

# Should return 201 with feedback
```

### Test Get Notifications
```bash
curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return list of notifications
```

---

## 📊 DATABASE VERIFICATION

### Check if tables created
```bash
psql citizen -c "\dt"

# Should show:
# - users
# - complaints
# - complaint_timelines
# - escalations
# - feedback
# - notifications
# - chat_rooms
# - chat_messages
# - refresh_tokens
# - otps
```

### Check complaint records
```bash
psql citizen -c "SELECT grievance_id, status, priority FROM complaints LIMIT 5;"
```

### Check feedback records
```bash
psql citizen -c "SELECT complaint_id, rating, officer_rating FROM feedback;"
```

### Check escalations
```bash
psql citizen -c "SELECT complaint_id, level, status FROM escalations;"
```

---

## 🐛 TROUBLESHOOTING

### Issue: "Cannot reach backend"
**Solution:**
```bash
# 1. Verify backend is running
ps aux | grep "tsx\|node"

# 2. Check logs
tail -f backend/logs/*.log

# 3. Restart backend
npm run dev
```

### Issue: "Database connection failed"
**Solution:**
```bash
# 1. Check PostgreSQL
psql citizen -c "SELECT 1;"

# 2. Verify connection string
echo $DATABASE_URL

# 3. Run migrations
cd backend
npx prisma migrate deploy
```

### Issue: "CORS error"
**Solution:**
```bash
# Check FRONTEND_ORIGIN in .env
# Should be: http://localhost:5173

# If needed, update and restart backend
```

### Issue: "Token invalid"
**Solution:**
```bash
# Re-login to get new token
# Or run database seed with test user
cd backend
npm run seed  # if available
```

---

## ✅ VERIFICATION CHECKLIST

- [ ] Backend starts without errors
- [ ] Frontend loads on localhost:5173
- [ ] Can register new user
- [ ] Can verify OTP
- [ ] Can login
- [ ] Dashboard loads with analytics
- [ ] Can create complaint
- [ ] Complaint appears in list
- [ ] Can view complaint details
- [ ] Can see notifications
- [ ] Can view reports/analytics
- [ ] Can access settings
- [ ] Can create multiple complaints
- [ ] Database has data
- [ ] API endpoints respond with 200
- [ ] No TypeScript errors
- [ ] No console errors

---

## 📱 RESPONSIVE DESIGN TESTING

### Mobile (375px width)
```
1. Go to any page
2. Press F12
3. Click device toolbar
4. Select "iPhone 12"
5. Verify layout is responsive
6. All buttons clickable
7. No horizontal scroll
```

### Tablet (768px width)
```
1. Select iPad
2. Verify layout adapts
3. Check card grid
4. Verify navigation
```

### Desktop (1440px width)
```
1. Select responsive desktop
2. Verify full layout
3. Check all columns visible
4. Verify no overflow
```

---

## 🚀 PERFORMANCE TESTING

### Measure Page Load Time
```bash
# In browser console:
performance.measure('load')
performance.getEntries().at(-1).duration

# Should be < 2 seconds
```

### Check Bundle Size
```bash
npm run build
ls -lh dist/

# Should be < 500KB for JS
```

### Monitor Network
```
1. Open DevTools
2. Go to Network tab
3. Reload page
4. Check:
   - Total requests < 50
   - Total size < 2MB
   - No failed requests
   - API responses < 200ms
```

---

## 📝 EXAMPLE TEST DATA

### Citizen 1
- Email: `john@example.com`
- Password: `Test@123456`
- Name: `John Doe`

### Citizen 2
- Email: `priya@example.com`
- Password: `Test@123456`
- Name: `Priya Singh`

### Officer (if seed data available)
- Email: `officer@gov.in`
- Password: `Officer@123`
- Name: `Ramesh Kumar`

---

## 📚 ADDITIONAL TESTING

### Test Socket.IO
```javascript
// In browser console:
const socket = io('http://localhost:3000')
socket.on('notification', (data) => console.log('Received:', data))
socket.on('complaint-updated', (data) => console.log('Updated:', data))
```

### Test File Upload
```
1. Go to create complaint
2. Click "Upload Evidence"
3. Select image, video, or PDF
4. Verify upload progress
5. Verify file displays in form
```

### Test GPS Location
```
1. Go to create complaint
2. Click "Use My GPS"
3. Allow location access
4. Verify lat/long auto-filled
5. Verify address auto-populated
```

---

## 🎯 TEST SCENARIOS

### Scenario 1: Complete Happy Path
1. Register → Verify → Login
2. Create complaint
3. View in dashboard
4. Get notification
5. View details
6. Escalate if needed
7. Submit feedback
8. View reports

### Scenario 2: Multiple Complaints
1. Login
2. Create 5 different complaints
3. View analytics shows all 5
4. Filter by status
5. Filter by priority
6. Search by title
7. Export as CSV

### Scenario 3: Escalation Flow
1. Create complaint
2. Wait (simulate delay)
3. Escalate complaint
4. Check notifications
5. View in escalations page
6. Admin resolves
7. Check notification

---

## 📊 EXPECTED RESULTS

After completing all tests, you should have:

- ✅ 5+ complaints in database
- ✅ Multiple notifications
- ✅ At least 1 escalation
- ✅ Analytics showing:
  - 5 total complaints
  - Status distribution
  - Category breakdown
  - Priority distribution
- ✅ No console errors
- ✅ All API endpoints responding
- ✅ Database with complete data
- ✅ Responsive UI on all devices

---

## 🎉 COMPLETION

If all tests pass, you have a **100% working citizen module** ready for production!

**Next Steps:**
1. Deploy to staging
2. User acceptance testing
3. Performance testing under load
4. Security audit
5. Deploy to production

---

**Date**: May 23, 2026  
**Status**: Ready for Testing  
**Estimated Time**: 30-45 minutes
