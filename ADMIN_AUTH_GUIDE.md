# Admin Authentication System - Complete Guide

## Overview
This document describes the complete admin authentication system for Civic Bridge Flow, including signup, login, email verification, forgot password, and password reset flows.

## System Architecture

### Database Models
- **User**: Stores user account information with roles (admin, super_admin, state_admin, etc.)
- **OTP**: Temporary one-time passwords for email verification, password reset, and admin login
- **RefreshToken**: Manages session tokens and refresh tokens for security
- **AuditLog**: Tracks all authentication-related actions for compliance

### Roles
The system supports the following roles:
- `admin` - Administrative user
- `super_admin` - Super administrator
- `state_admin` - State-level administrator
- `district_officer` - District level officer
- `department_officer` - Department level officer
- `officer` - General officer
- `citizen` - Regular citizen (public user)

## Authentication Flows

### 1. Admin Signup Flow

**URL**: `/admin_/signup`

**Steps**:
1. User enters details:
   - Full Name
   - Email (must be government email or in allowed domains)
   - Mobile Number (10 digits, starting with 6-9)
   - State
   - District
   - Address
   - Role (Admin, Super Admin, State Admin, etc.)
   - Password (8+ chars, uppercase, lowercase, number, special char)
   - Confirm Password

2. System validates:
   - Email uniqueness
   - Mobile uniqueness
   - Password strength
   - Password confirmation match

3. Account Creation:
   - Password is hashed using bcrypt
   - Random Aadhaar is generated (since optional for admins)
   - User status: `emailVerified: false`, `isVerified: false`

4. OTP Sent:
   - Email verification OTP is generated and sent
   - User redirected to `/verify-otp` page with:
     - `email`: registered email
     - `purpose`: "registration"
     - `returnTo`: "/admin/login"

**Response**: 
```json
{
  "success": true,
  "message": "Admin account created successfully. Verification OTP sent to email.",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "role": "admin",
    "emailVerified": false,
    "isVerified": false
  },
  "emailVerificationRequired": true,
  "otp": "123456" // Only in development
}
```

### 2. Email Verification Flow

**URL**: `/verify-otp` with params: `email`, `purpose=registration`, `returnTo=/admin/login`

**Steps**:
1. User receives OTP email at registered email address
2. User enters OTP (6 digits)
3. System verifies:
   - OTP matches the stored hash
   - OTP hasn't expired (10 minutes)
   - OTP attempts < limit

4. On Success:
   - Sets `emailVerified: true` and `isVerified: true`
   - User redirected to login page to sign in

**Response**:
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### 3. Admin Login Flow

**URL**: `/admin_/login`

**Steps**:
1. User enters:
   - Email (must match registered email)
   - Password

2. System verifies:
   - Account exists
   - Account is verified (emailVerified and isVerified)
   - Account is not locked (after 5 failed attempts)
   - Password is correct

3. If Credentials Valid:
   - Login OTP generated and sent to email
   - User redirected to `/verify-otp` page with:
     - `email`: admin email
     - `purpose`: "admin_login"
     - `returnTo`: "/admin/dashboard"

4. If Credentials Invalid:
   - Failed login attempts incremented
   - Account locked after 5 attempts for 15 minutes

**Response**:
```json
{
  "success": true,
  "message": "OTP sent to your registered email address.",
  "otp": "123456" // Only in development
}
```

### 4. Login OTP Verification Flow

**URL**: `/verify-otp` with params: `email`, `purpose=admin_login`, `returnTo=/admin/dashboard`

**Steps**:
1. User enters OTP received in email
2. System verifies OTP (same as registration verification)
3. On Success:
   - Session created with JWT tokens
   - Access token (7 days) and Refresh token (30 days) issued
   - Auth cookies set:
     - `smartgov_access`: Access token (httpOnly, secure)
     - `smartgov_refresh`: Refresh token (httpOnly, secure, path=/api/auth)
   - User redirected to `/admin/dashboard`
   - Failed login attempts reset to 0

**Response**:
```json
{
  "success": true,
  "message": "OTP verified and login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "fullName": "Chera Admin",
      "role": "admin"
    }
  }
}
```

### 5. Forgot Password Flow

**URL**: `/admin_/forgot-password`

**Steps**:
1. User enters registered email address
2. System verifies:
   - Email exists in database
   - User is an admin (not citizen)

3. If Email Valid:
   - Password reset OTP generated
   - OTP sent to email
   - User redirected to `/verify-otp` with:
     - `email`: admin email
     - `purpose`: "password_reset"
     - `returnTo`: "/admin/login"

**Response**:
```json
{
  "success": true,
  "message": "OTP sent to registered email address",
  "otp": "123456" // Only in development
}
```

### 6. Password Reset OTP Verification

**URL**: `/verify-otp` with params: `email`, `purpose=password_reset`, `returnTo=/admin/login`

**Steps**:
1. User enters OTP
2. OTP verified (same process as other OTPs)
3. On Success:
   - User redirected to `/reset-password?email=admin@example.com`
   - OTP marked as verified (allows password reset in next step)

**Response**:
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

### 7. Password Reset Flow

**URL**: `/reset-password`

**Steps**:
1. User enters:
   - Email (pre-filled from query param)
   - New Password (same validation as signup)
   - Confirm Password

2. System verifies:
   - Verified OTP exists for this email
   - Password confirmation matches
   - Password meets strength requirements

3. On Success:
   - Password updated (hashed)
   - Failed login attempts reset to 0
   - Account lock removed
   - All OTP records cleared
   - User redirected to `/login`

**Response**:
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "fullName": "Chera Admin"
    }
  }
}
```

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/admin/register`
Register new admin user

**Request**:
```json
{
  "fullName": "Chera Admin",
  "email": "admin@example.com",
  "mobile": "9876543210",
  "state": "Gujarat",
  "district": "Ahmedabad",
  "address": "123 Government Building",
  "role": "admin",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Response**: User object with OTP (dev only)

---

#### POST `/api/auth/admin-login`
Admin login (generates OTP)

**Request**:
```json
{
  "email": "admin@example.com",
  "password": "SecurePass123!",
  "rememberMe": true
}
```

**Response**: OTP sent to email

---

#### POST `/api/auth/verify-otp`
Verify OTP for registration, login, or password reset

**Request**:
```json
{
  "email": "admin@example.com",
  "otp": "123456",
  "purpose": "admin_login"
}
```

**Response**: Session tokens (for admin_login) or success message

---

#### POST `/api/auth/forgot-password`
Request password reset OTP

**Request**:
```json
{
  "email": "admin@example.com"
}
```

**Response**: OTP sent to email

---

#### POST `/api/auth/reset-password`
Reset password after OTP verification

**Request**:
```json
{
  "email": "admin@example.com",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Response**: User object

---

#### GET `/api/auth/profile`
Get current user profile

**Headers**: `Authorization: Bearer <access_token>`

**Response**: Current user object

---

#### POST `/api/auth/logout`
Logout user and revoke tokens

**Response**: Success message

---

#### POST `/api/auth/refresh-token`
Refresh access token using refresh token

**Response**: New access and refresh tokens

## Frontend Routes

- `/admin_/signup` - Admin registration page
- `/admin_/login` - Admin login page
- `/admin_/forgot-password` - Forgot password page (admin)
- `/forgot-password` - Forgot password page (citizen)
- `/verify-otp` - OTP verification page (shared)
- `/reset-password` - Password reset page (shared)
- `/admin/dashboard` - Admin dashboard (protected)

## Security Features

### Password Security
- Minimum 8 characters
- Must contain uppercase letter (A-Z)
- Must contain lowercase letter (a-z)
- Must contain number (0-9)
- Must contain special character (!@#$%^&*)
- Passwords hashed with bcrypt

### Account Lockout
- After 5 failed login attempts, account locked for 15 minutes
- Failed attempts reset on successful login
- Lock cleared on password reset

### OTP Security
- 6-digit random code
- Expires after 10 minutes
- One OTP per email per purpose
- Max 3 incorrect attempts per OTP
- Hashed in database

### Session Security
- JWT tokens with 7-day expiry (access) and 30-day expiry (refresh)
- Tokens stored in httpOnly cookies
- Secure flag enabled in production
- SameSite=none in production, lax in development
- Token rotation on refresh
- Refresh token revocation on logout

### Audit Logging
- All authentication actions logged
- Includes IP address and user agent
- Compliance-ready audit trail

## Email Verification

### Required Domains
Admin users must use email addresses from:
- Allowed domains: `smartgov.in`, `gov.in`, `nic.in`, `example.com`
- OR explicitly allowed emails (configurable in `.env`)

### Email Service
- SMTP configured for Gmail
- Fallback console logging in development
- OTP sent in HTML email with clear formatting

## Testing

### Default Test Credentials
- Email: `admin@example.com`
- OTP: Check backend console (development mode)
- Password: Must meet strength requirements

### Test Flow
1. Register at `/admin_/signup`
2. Verify OTP at `/verify-otp`
3. Login at `/admin_/login`
4. Verify login OTP
5. Access dashboard at `/admin/dashboard`
6. Forgot password at `/admin_/forgot-password`
7. Reset password with OTP

## Environment Variables

```bash
# Server
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/smartgov

# JWT
JWT_SECRET=your-secret-key-at-least-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-at-least-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Frontend
FRONTEND_ORIGIN=http://localhost:5173

# Cookies
AUTH_ACCESS_COOKIE_NAME=smartgov_access
AUTH_REFRESH_COOKIE_NAME=smartgov_refresh

# OTP
OTP_EXPIRY_MINUTES=10

# Account Security
ACCOUNT_LOCK_THRESHOLD=5
ACCOUNT_LOCK_MINUTES=15

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
SMTP_FROM="SmartGov <no-reply@smartgov.gov>"

# Admin Emails
ADMIN_ALLOWED_EMAILS=admin@example.com,smartgov.admin@gmail.com
ALLOWED_ADMIN_DOMAINS=gov.in,smartgov.in,example.com
```

## Data Privacy & User Segregation

Each user has completely isolated data:
- **User Record**: Unique ID, email, role, state, district
- **OTP Records**: Email-specific, purpose-specific
- **Refresh Tokens**: User ID linked, tied to sessions
- **Audit Logs**: User ID linked for traceability
- **Role-Based Access**: Middleware checks user role for protected routes

No user can:
- Access another user's profile without authorization
- View another user's OTP
- Steal another user's refresh tokens
- Access protected admin routes without proper role

## Error Handling

### Common Errors
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Invalid credentials or missing auth
- `403 Forbidden` - Account not verified or insufficient permissions
- `404 Not Found` - User not found
- `409 Conflict` - Email/mobile already exists
- `423 Locked` - Account locked after failed attempts

## Support

For issues or questions about the authentication system, refer to:
- Backend: [ENDPOINTS_QUICK_REFERENCE.md](../ENDPOINTS_QUICK_REFERENCE.md)
- Email Setup: [GOVERNMENT_EMAIL_VALIDATION.md](../GOVERNMENT_EMAIL_VALIDATION.md)
- Database: [Prisma schema](../prisma/schema.prisma)
