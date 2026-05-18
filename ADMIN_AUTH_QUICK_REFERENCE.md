# Admin Authentication - Quick Reference

## Authentication Flow Diagram

```
Admin Signup
    ↓
Fill Form (Email, Password, etc)
    ↓
Validate & Create Account
    ↓
Send Email Verification OTP
    ↓
User Verifies OTP at /verify-otp
    ↓
Account Verified (emailVerified=true)
    ↓
Redirect to Admin Login
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓
Admin Login
    ↓
Enter Email & Password
    ↓
Validate Credentials
    ↓
Generate Admin Login OTP
    ↓
Send OTP to Email
    ↓
User Verifies OTP at /verify-otp
    ↓
Create JWT Session
    ↓
Set Auth Cookies
    ↓
Redirect to Admin Dashboard
    ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓
Forgot Password
    ↓
Enter Email
    ↓
Validate Email Exists
    ↓
Generate Password Reset OTP
    ↓
Send OTP to Email
    ↓
User Verifies OTP at /verify-otp
    ↓
Redirect to /reset-password
    ↓
Enter New Password
    ↓
Update Password
    ↓
Redirect to Admin Login
    ↓
Login with New Password
```

## Frontend Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin_/signup` | AdminSignupPage | New admin registration |
| `/admin_/login` | AdminLoginPage | Admin authentication |
| `/admin_/forgot-password` | AdminForgotPasswordPage | Forgot password request |
| `/verify-otp` | VerifyOtpPage | OTP verification (shared) |
| `/reset-password` | ResetPasswordPage | Password reset (shared) |
| `/admin/dashboard` | AdminDashboard | Protected admin area |

## Backend API Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/auth/admin/register` | Register admin | No |
| POST | `/api/auth/admin-login` | Admin login OTP | No |
| POST | `/api/auth/verify-otp` | Verify OTP | No |
| POST | `/api/auth/forgot-password` | Forgot password OTP | No |
| POST | `/api/auth/reset-password` | Reset password | No |
| GET | `/api/auth/profile` | Get user profile | Yes |
| POST | `/api/auth/logout` | Logout user | Yes |
| POST | `/api/auth/refresh-token` | Refresh tokens | No |

## Frontend Auth API Functions

```typescript
// src/lib/auth-api.ts

// Register admin
registerAdmin(payload: {
  fullName: string;
  email: string;
  mobile: string;
  state: string;
  district: string;
  address: string;
  role: string;
  password: string;
  confirmPassword: string;
})

// Admin login (generates OTP)
loginAdmin(email: string, password: string, rememberMe?: boolean)

// Verify OTP
verifyOtp(email: string, otp: string, purpose: 'registration' | 'password_reset' | 'admin_login')

// Forgot password
forgotPassword(email: string)

// Reset password
resetPassword(email: string, newPassword: string, confirmPassword: string)

// Get profile
getProfile()

// Logout
logout()
```

## Database Schema Summary

```prisma
model User {
  id            String   @id @default(cuid())
  fullName      String
  email         String   @unique
  mobile        String   @unique
  state         String
  district      String
  address       String
  password      String   // bcrypt hashed
  role          Role     @default(citizen)
  emailVerified Boolean  @default(false)
  isVerified    Boolean  @default(false)
  failedLoginAttempts Int @default(0)
  lockedUntil   DateTime?
  lastLoginAt   DateTime?
  
  refreshTokens RefreshToken[]
}

model OTP {
  id        String   @id @default(cuid())
  email     String
  otp       String   // bcrypt hashed
  purpose   OtpPurpose // 'registration' | 'password_reset' | 'admin_login'
  expiresAt DateTime
  verified  Boolean  @default(false)
  attempts  Int      @default(0)
}

model RefreshToken {
  id        String   @id @default(cuid())
  jti       String   @unique
  tokenHash String
  userId    String
  expiresAt DateTime
  revokedAt DateTime?
  user      User     @relation(fields: [userId], references: [id])
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String   // 'admin_registered', 'admin_login_completed', etc
  metadata  Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
}
```

## Environment Variables

```bash
# Required for Admin Auth
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=32-char-minimum-random-string
JWT_REFRESH_SECRET=32-char-minimum-random-string
FRONTEND_ORIGIN=http://localhost:5173

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password

# Admin Domain Validation
ADMIN_ALLOWED_EMAILS=admin@example.com
ALLOWED_ADMIN_DOMAINS=example.com,gov.in
```

## Key Functions in Backend

### Services (src/services/auth.service.ts)

```typescript
registerAdmin(input, meta)          // Create new admin
loginAdmin(input, meta)             // Generate login OTP
verifyOtpFlow(input, meta)         // Handle all OTP verification
startForgotPasswordFlow(input)      // Generate forgot password OTP
resetPassword(input, meta)          // Update password
logoutUser(userId)                  // Revoke tokens
```

### Controllers (src/controllers/auth.controller.ts)

```typescript
registerAdminUser(req, res)         // POST /api/auth/admin/register
adminLogin(req, res)                // POST /api/auth/admin-login
verifyOtp(req, res)                 // POST /api/auth/verify-otp
forgotPassword(req, res)            // POST /api/auth/forgot-password
resetCitizenPassword(req, res)      // POST /api/auth/reset-password
profile(req, res)                   // GET /api/auth/profile
logout(req, res)                    // POST /api/auth/logout
```

## Security Features

| Feature | Details |
|---------|---------|
| **Password Hashing** | bcrypt with salt rounds |
| **Password Strength** | 8+ chars, uppercase, lowercase, number, special |
| **OTP Hashing** | bcrypt hashed, 10-minute expiry |
| **JWT Tokens** | HS256, 7-day access, 30-day refresh |
| **Account Lockout** | 5 failed attempts → 15-minute lock |
| **Session Tokens** | HttpOnly, Secure cookies, SameSite protection |
| **Rate Limiting** | Auth endpoints rate limited |
| **Audit Logging** | All auth actions logged with IP/User-Agent |
| **CORS** | Configured for frontend origin |
| **Email Domain** | Admin must use government email domains |

## Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| 400 | Bad Request | Validation failed |
| 401 | Unauthorized | Invalid credentials |
| 403 | Forbidden | Account not verified |
| 404 | Not Found | Email doesn't exist |
| 409 | Conflict | Email already registered |
| 423 | Locked | Account locked |

## Validation Rules

### Password
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)

### Email
- Valid email format
- For admins: must be from allowed domains or allowed emails list
- For citizens: any valid email

### Mobile
- 10 digits starting with 6-9
- Can include +91 country code
- Normalized to 10 digits

### OTP
- 6 digits
- Valid for 10 minutes
- Max 3 incorrect attempts

## Common Tasks

### Enable User Access to Admin Dashboard
1. User must complete registration OTP verification
2. User must complete admin login with OTP
3. Auth cookies will be set automatically
4. Access `/admin/dashboard` to verify login

### Reset User Password
1. User navigates to `/admin_/forgot-password`
2. Enters registered email
3. Verifies OTP from email
4. Sets new password
5. Can login with new password

### Check Admin Status
```javascript
const profile = await getProfile();
console.log(profile.data.user.role); // Should be 'admin' or other admin role
console.log(profile.data.user.isVerified); // Should be true
console.log(profile.data.user.emailVerified); // Should be true
```

### Debug Failed Login
```javascript
// Check database for user status
SELECT email, "isVerified", "emailVerified", "failedLoginAttempts", "lockedUntil"
FROM users
WHERE email = 'admin@example.com';

// Check if OTP was sent
SELECT email, purpose, verified, attempts, "expiresAt"
FROM otps
WHERE email = 'admin@example.com'
ORDER BY "createdAt" DESC;
```

## File Structure

```
civic-bridge-flow/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── email.service.ts
│   │   │   └── otp.service.ts
│   │   ├── routes/
│   │   │   └── auth.routes.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── validate.middleware.ts
│   │   ├── utils/
│   │   │   ├── validators.ts
│   │   │   ├── crypto.ts
│   │   │   └── jwt.ts
│   │   └── config/
│   │       ├── env.ts
│   │       ├── mailer.ts
│   │       └── prisma.ts
│   └── prisma/
│       └── schema.prisma
├── src/
│   ├── routes/
│   │   ├── admin_.signup.tsx
│   │   ├── admin_.login.tsx
│   │   ├── admin_.forgot-password.tsx
│   │   ├── verify-otp.tsx
│   │   └── reset-password.tsx
│   └── lib/
│       └── auth-api.ts
└── ADMIN_AUTH_GUIDE.md
```

## Testing Checklist

- [ ] Register new admin
- [ ] Verify email with OTP
- [ ] Login as admin
- [ ] Verify login OTP
- [ ] Access admin dashboard
- [ ] Forgot password flow
- [ ] Reset password successfully
- [ ] Login with new password
- [ ] Logout and verify cookies cleared
- [ ] Account lockout after 5 failed attempts
- [ ] Token refresh works
- [ ] Multiple admins don't access each other's data

## Deployment Notes

1. **Email Configuration**: Update SMTP credentials for production
2. **JWT Secrets**: Generate strong random secrets (32+ chars)
3. **Database**: Configure PostgreSQL for production
4. **CORS**: Update FRONTEND_ORIGIN for production domain
5. **Cookies**: Secure flag and SameSite are auto-enabled in production
6. **Rate Limiting**: Configured on auth endpoints
7. **Audit Logs**: Enable monitoring in production
