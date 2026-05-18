# SmartGov Auth API - Quick Reference

## All Endpoints at a Glance

| # | Method | Endpoint | Auth Required | Purpose |
|---|--------|----------|---------------|---------|
| 1 | GET | `/health` | ❌ No | Health check |
| 2 | POST | `/auth/register` | ❌ No | Citizen registration |
| 3 | POST | `/auth/login` | ❌ No | Citizen login |
| 4 | POST | `/auth/admin/register` | ❌ No | Admin registration |
| 5 | POST | `/auth/admin-login` | ❌ No | Admin login (step 1) |
| 6 | POST | `/auth/verify-otp` | ❌ No | OTP verification (all purposes) |
| 7 | POST | `/auth/forgot-password` | ❌ No | Initiate password reset |
| 8 | POST | `/auth/reset-password` | ❌ No | Complete password reset |
| 9 | POST | `/auth/refresh-token` | ✅ Yes | Refresh JWT token |
| 10 | GET | `/auth/profile` | ✅ Yes | Get current user profile |
| 11 | POST | `/auth/logout` | ✅ Yes | Logout user |

---

## Request/Response Summary

### 1️⃣ Health Check
```
GET /health
Response: { success: true, message: "SmartGov citizen auth backend is running" }
```

### 2️⃣ Citizen Registration
```
POST /auth/register
Body: fullName, email, mobile, aadhaar, state, district, address, password, confirmPassword
Response: { user, otp, emailVerificationRequired: true }
```

### 3️⃣ Citizen Login
```
POST /auth/login
Body: identifier (email/mobile), password, rememberMe
Response: { token, user }
Cookies: accessToken, refreshToken
```

### 4️⃣ Admin Registration
```
POST /auth/admin/register
Body: fullName, email (any domain), mobile, state, district, address, role, password, confirmPassword
Response: { user, otp, emailVerificationRequired: true }
```

### 5️⃣ Admin Login (Step 1)
```
POST /auth/admin-login
Body: email, password, rememberMe
Response: { otp, message: "Admin login OTP sent to your email" }
Note: NO JWT issued yet - must verify OTP next
```

### 6️⃣ OTP Verification (Step 2 for Admin)
```
POST /auth/verify-otp
Body: email, otp, purpose ("admin_login", "registration", or "password_reset")

If purpose = "admin_login":
  Response: { token, user }
  Cookies: accessToken, refreshToken

If purpose = "registration":
  Response: { message: "Email verified successfully" }

If purpose = "password_reset":
  Response: { message: "OTP verified successfully" }
```

### 7️⃣ Forgot Password
```
POST /auth/forgot-password
Body: email
Response: { message: "OTP sent to registered email address", otp (dev only) }
```

### 8️⃣ Reset Password
```
POST /auth/reset-password
Body: email, newPassword, confirmPassword
Response: { user, message: "Password reset successfully" }
```

### 9️⃣ Refresh Token
```
POST /auth/refresh-token
Headers: Authorization: Bearer {{ACCESS_TOKEN}}
Cookies: refreshToken (HTTP-only)
Response: { token, user }
Cookies: new accessToken, refreshToken
```

### 🔟 Get Profile
```
GET /auth/profile
Headers: Authorization: Bearer {{ACCESS_TOKEN}}
Response: { user (full details) }
```

### 1️⃣1️⃣ Logout
```
POST /auth/logout
Headers: Authorization: Bearer {{ACCESS_TOKEN}}
Response: { message: "Logout successful" }
Cookies: cleared (accessToken, refreshToken)
```

---

## User Flows

### 👤 Citizen User Flow
```
1. POST /auth/register
   ↓ (get OTP)
2. POST /auth/verify-otp (purpose: "registration")
   ↓ (email verified, account active)
3. POST /auth/login
   ↓ (get JWT tokens in cookies)
4. GET /auth/profile (use Bearer token)
   ↓ (view profile)
5. POST /auth/logout
```

### 👨‍💼 Admin User Flow
```
1. POST /auth/admin/register (by Super Admin)
   ↓ (get OTP)
2. POST /auth/verify-otp (purpose: "registration")
   ↓ (email verified, admin account active)
3. POST /auth/admin-login
   ↓ (get OTP - no JWT yet)
4. POST /auth/verify-otp (purpose: "admin_login")
   ↓ (get JWT tokens in cookies)
5. GET /auth/profile (use Bearer token)
   ↓ (view profile)
6. POST /auth/logout
```

### 🔐 Password Reset Flow
```
1. POST /auth/forgot-password
   ↓ (get OTP)
2. POST /auth/verify-otp (purpose: "password_reset")
   ↓ (OTP verified)
3. POST /auth/reset-password
   ↓ (password updated)
4. POST /auth/login or /auth/admin-login
```

---

## Testing Checklist

### Basic Connectivity
- [ ] GET /health → Returns success

### Citizen Flow
- [ ] POST /auth/register with valid data → Returns user + otp (dev mode)
- [ ] POST /auth/verify-otp (purpose: registration) with correct OTP → Email verified
- [ ] POST /auth/login → Returns JWT + cookies
- [ ] GET /auth/profile → Returns user details
- [ ] POST /auth/logout → Clears cookies

### Admin Flow
- [ ] POST /auth/admin/register with valid data → Returns user + otp (dev mode)
- [ ] POST /auth/verify-otp (purpose: registration) → Email verified
- [ ] POST /auth/admin-login → Returns otp (no JWT)
- [ ] POST /auth/verify-otp (purpose: admin_login) → Returns JWT + cookies
- [ ] GET /auth/profile → Returns admin details
- [ ] POST /auth/logout

### Password Reset
- [ ] POST /auth/forgot-password → OTP sent
- [ ] POST /auth/verify-otp (purpose: password_reset) → OTP verified
- [ ] POST /auth/reset-password → Password updated
- [ ] POST /auth/login with new password → Success

### Token Refresh
- [ ] POST /auth/refresh-token → Returns new JWT
- [ ] GET /auth/profile with new token → Success

### Error Handling
- [ ] Invalid credentials → 401 error
- [ ] Duplicate email/mobile → 409 conflict
- [ ] Invalid OTP → 401 error
- [ ] Rate limit exceeded → 429 error
- [ ] Missing fields → 400 bad request
- [ ] Wrong role → 403 forbidden

---

## Database Test Users

### Development Mode
- All OTPs returned in response: `123456`
- All errors logged to console

### Test Admin
```
Email: admin@gmail.com
Password: AdminPass123!
Role: super_admin
```

### Test Citizen
```
Email: john.doe@gmail.com
Password: SecurePass123!
Aadhaar: 1234 5678 9012
```

---

## Environment Setup

### Backend .env
```
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your_secret_key_min_32_chars_long
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars_long

# Email (SMTP)
SMTP_FROM=noreply@smartgov.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=false

# Frontend
FRONTEND_ORIGIN=http://localhost:5173

# OTP Settings
OTP_EXPIRY_MINUTES=10
ACCOUNT_LOCK_THRESHOLD=5
ACCOUNT_LOCK_MINUTES=15

# Admin Settings
ALLOWED_ADMIN_DOMAINS=gmail.com,yahoo.com
ADMIN_ALLOWED_EMAILS=admin@example.com
```

### Postman Variables
```
API_BASE_URL: http://localhost:4000/api
ACCESS_TOKEN: (empty - filled after login)
REFRESH_TOKEN: (empty - filled after login)
```

---

## Common Issues & Solutions

### Issue: "Too many requests"
**Solution:** Rate limiting active. Wait 15 minutes or check rate-limiter settings.

### Issue: OTP expires
**Solution:** OTP valid for 10 minutes. Request new OTP via forgot-password or re-register.

### Issue: Account locked
**Solution:** Account locked after 5 failed attempts for 15 minutes. Wait or reset password.

### Issue: Cookies not being set
**Solution:** 
- Check "Send cookie with request" in Postman
- Ensure `credentials: "include"` in frontend fetch

### Issue: CORS error
**Solution:** 
- Check FRONTEND_ORIGIN env variable
- Verify origin is in allowedOrigins array

### Issue: "Use admin login for official accounts"
**Solution:** 
- Citizen role must use /auth/login
- Admin roles must use /auth/admin-login

---

## Performance Notes

- Access tokens: 15 minutes expiry
- Refresh tokens: 7 days expiry
- OTP: 10 minutes expiry
- Hashing: bcrypt 10 rounds
- Rate limit: 200 requests per 15 minutes (global)
- OTP rate limit: 3 requests per 15 minutes

---

## Security Notes

✅ Passwords: bcrypt hashed (10 salt rounds)
✅ JWT: HS256 algorithm
✅ Tokens: HTTP-only, Secure (prod), SameSite cookies
✅ Account lockout: 5 failed attempts → 15 min lockout
✅ OTP: 6 digits, single use, 10 min expiry
✅ Refresh token: JTI-based, revocable
✅ CORS: Whitelist only allowed origins
✅ Validation: Zod schemas for all inputs
