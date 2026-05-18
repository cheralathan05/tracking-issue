# Admin Authentication - Testing Checklist

## Pre-Testing Setup

- [ ] Database is running and connected
- [ ] Backend server is running on port 4000
- [ ] Frontend development server is running on port 5173
- [ ] `.env` file is configured with valid credentials
- [ ] SMTP configuration is set up (or using console fallback)
- [ ] Prisma migrations have been applied

## Test Case 1: Admin Registration

### Steps:
1. Navigate to `http://localhost:5173/admin_/signup`
2. Fill in form with:
   - Full name: `Chera Admin`
   - Email: `admin@example.com`
   - Mobile: `9876543210`
   - State: `Gujarat`
   - District: `Ahmedabad`
   - Address: `123 Government Building`
   - Role: `Admin`
   - Password: `SecurePass123!`
   - Confirm password: `SecurePass123!`

### Expected Results:
- [ ] Form validates successfully
- [ ] Account is created in database
- [ ] User status: `emailVerified: false`, `isVerified: false`
- [ ] OTP email is sent
- [ ] Redirected to `/verify-otp` page
- [ ] Email and purpose parameters are in URL

### Error Cases:
- [ ] Email already exists → Error: "Email already registered"
- [ ] Mobile already exists → Error: "Mobile already registered"
- [ ] Password too weak → Error: "Password must include..."
- [ ] Passwords don't match → Error: "Password and confirm password must match"
- [ ] Email not in allowed domain → Error: "Email not allowed"

---

## Test Case 2: Email Verification via OTP

### Steps:
1. From previous registration, you're on `/verify-otp`
2. Check backend console for OTP (in development)
3. Enter OTP in form
4. Submit

### Expected Results:
- [ ] OTP is validated
- [ ] User status updated: `emailVerified: true`, `isVerified: true`
- [ ] Redirected to `/admin/login`
- [ ] Account is now verified

### Error Cases:
- [ ] Invalid OTP → Error: "Invalid OTP"
- [ ] Expired OTP → Error: "OTP expired"
- [ ] Wrong email → OTP not found for that email
- [ ] Too many attempts → Error after 3 wrong attempts

---

## Test Case 3: Admin Login

### Steps:
1. Navigate to `http://localhost:5173/admin_/login`
2. Enter credentials:
   - Email: `admin@example.com`
   - Password: `SecurePass123!`
3. Click "Sign in to admin console"

### Expected Results:
- [ ] Form validates email and password
- [ ] New OTP generated and sent to email
- [ ] Redirected to `/verify-otp`
- [ ] OTP email received with login OTP
- [ ] URL contains `purpose=admin_login`

### Error Cases:
- [ ] Invalid email → Error: "Invalid login credentials"
- [ ] Wrong password → Error: "Invalid password"
- [ ] Account not verified → Error: "Account not verified..."
- [ ] Account locked → Error: "Account locked..."

---

## Test Case 4: Login OTP Verification

### Steps:
1. From previous login step, you're on `/verify-otp`
2. Check backend console for OTP
3. Enter OTP
4. Submit

### Expected Results:
- [ ] OTP verified
- [ ] Session created with JWT tokens
- [ ] Auth cookies set (`smartgov_access`, `smartgov_refresh`)
- [ ] Redirected to `/admin/dashboard`
- [ ] Can access protected admin pages
- [ ] Failed login attempts reset to 0

### Error Cases:
- [ ] Invalid OTP → Error: "Invalid OTP"
- [ ] Expired OTP → Error: "OTP expired"

---

## Test Case 5: Forgot Password

### Steps:
1. From login page, click "Forgot password?" link
2. Navigate to `http://localhost:5173/admin_/forgot-password`
3. Enter email: `admin@example.com`
4. Click "Send verification OTP"

### Expected Results:
- [ ] Email validated
- [ ] Password reset OTP generated
- [ ] OTP sent to email
- [ ] Redirected to `/verify-otp`
- [ ] URL contains `purpose=password_reset`
- [ ] `returnTo=/admin/login` is in URL

### Error Cases:
- [ ] Email doesn't exist → Error: "Email not found"
- [ ] Invalid email format → Error: "Enter a valid email address"

---

## Test Case 6: Password Reset OTP Verification

### Steps:
1. From previous forgot password step, you're on `/verify-otp`
2. Check backend console for OTP
3. Enter OTP
4. Submit

### Expected Results:
- [ ] OTP verified
- [ ] Redirected to `/reset-password?email=admin@example.com`
- [ ] Email is pre-filled on reset form

### Error Cases:
- [ ] Invalid OTP → Error: "Invalid OTP"
- [ ] Expired OTP → Error: "OTP expired"

---

## Test Case 7: Password Reset

### Steps:
1. On `/reset-password` form
2. Enter:
   - Email: `admin@example.com` (pre-filled)
   - New password: `NewSecurePass456!`
   - Confirm password: `NewSecurePass456!`
3. Click "Reset password"

### Expected Results:
- [ ] Password updated in database
- [ ] Failed login attempts reset to 0
- [ ] Account lock removed
- [ ] OTP records cleared
- [ ] Redirected to `/login`
- [ ] Can login with new password

### Error Cases:
- [ ] Passwords don't match → Error: "Password and confirm password must match"
- [ ] Password too weak → Error: "Password must include..."
- [ ] No verified OTP found → Error: "OTP verification required"

---

## Test Case 8: Account Lockout

### Steps:
1. Go to `/admin_/login`
2. Enter correct email but wrong password 5 times
3. Try 6th attempt

### Expected Results:
- [ ] First 5 attempts: Error "Invalid password"
- [ ] 6th attempt: Error "Account locked due to multiple failed attempts"
- [ ] Account remains locked for 15 minutes
- [ ] Failed login attempts = 5 in database
- [ ] `lockedUntil` timestamp is set

### Recovery:
- [ ] Wait 15 minutes OR
- [ ] Reset password (clears lock)
- [ ] Login successful after lock expires

---

## Test Case 9: Session Management

### Steps:
1. Login successfully to admin console
2. Check browser cookies in DevTools
3. Make API request to `/api/auth/profile`
4. Logout

### Expected Results:
- [ ] `smartgov_access` cookie set (httpOnly, Secure in prod)
- [ ] `smartgov_refresh` cookie set (httpOnly, path=/api/auth)
- [ ] Profile endpoint returns current user
- [ ] After logout, cookies cleared
- [ ] Cannot access protected routes after logout

---

## Test Case 10: Token Refresh

### Steps:
1. Login successfully
2. Wait 1-2 minutes
3. Make API request to check if token refreshes automatically

### Expected Results:
- [ ] Access token refreshed automatically
- [ ] New refresh token issued
- [ ] Session continues without re-login
- [ ] Old tokens revoked

---

## Test Case 11: Multiple Admin Roles

### Steps:
1. Register new admin with role: `Super Admin`
2. Register another with role: `State Admin`
3. Register another with role: `District Officer`

### Expected Results:
- [ ] Each admin can register with different roles
- [ ] Each role stored correctly in database
- [ ] Each user gets unique ID and tokens
- [ ] No data cross-contamination between users

---

## Test Case 12: Email Domain Validation

### Steps:
1. Try registering with `user@gmail.com` → Should fail
2. Try registering with `admin@example.com` → Should succeed
3. Try registering with `admin@gov.in` → Should succeed
4. Try registering with `smartgov.admin@gmail.com` → Should succeed (allowed email)

### Expected Results:
- [ ] Only allowed domains and emails accepted
- [ ] Proper error message for invalid domains
- [ ] ADMIN_ALLOWED_EMAILS checked correctly
- [ ] ALLOWED_ADMIN_DOMAINS checked correctly

---

## Test Case 13: Data Privacy (Each User Isolated)

### Steps:
1. Register User1: `user1@example.com`
2. Register User2: `user2@example.com`
3. Get User1 profile token
4. Try to get User2 profile using User1's token
5. Login as User2
6. Check that User2 cannot see User1's data

### Expected Results:
- [ ] User1 can only access User1's profile
- [ ] User2 can only access User2's profile
- [ ] No cross-user data access
- [ ] Each user has isolated OTP records
- [ ] Audit logs show each user's actions separately

---

## Backend Testing Commands

### Check OTP in Console
```bash
# When SMTP is not configured, OTP prints to console
# Look for: [SmartGov OTP fallback] email@example.com: 123456
```

### Check Database
```bash
# Connect to PostgreSQL
psql postgresql://postgres:password@localhost:5432/smartgov_auth

# View users
SELECT id, email, "emailVerified", "isVerified", role FROM users;

# View OTPs
SELECT email, purpose, verified, "expiresAt" FROM otps;

# View audit logs
SELECT * FROM audit_logs WHERE action LIKE '%admin%';
```

### Test API Endpoints Directly
```bash
# Register Admin
curl -X POST http://localhost:4000/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Admin",
    "email": "test@example.com",
    "mobile": "9876543210",
    "state": "Gujarat",
    "district": "Ahmedabad",
    "address": "Test Address",
    "role": "admin",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'

# Admin Login
curl -X POST http://localhost:4000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!",
    "rememberMe": true
  }'

# Verify OTP
curl -X POST http://localhost:4000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "otp": "123456",
    "purpose": "admin_login"
  }' \
  -c cookies.txt

# Get Profile
curl -X GET http://localhost:4000/api/auth/profile \
  -b cookies.txt

# Logout
curl -X POST http://localhost:4000/api/auth/logout \
  -b cookies.txt
```

## Known Issues & Workarounds

### Email Not Sending
- [ ] Check SMTP credentials in `.env`
- [ ] Use Gmail with App Password (not regular password)
- [ ] Enable "Less Secure Apps" if using Gmail
- [ ] Check backend console for fallback OTP
- [ ] Verify SMTP_PORT is 587 for TLS

### OTP Not Appearing
- [ ] Check backend console in development mode
- [ ] Look for: `[SmartGov OTP fallback]` message
- [ ] Verify email is correct
- [ ] Check spam folder in email

### Redirect Issues
- [ ] Clear browser cookies
- [ ] Check FRONTEND_ORIGIN in `.env` matches your dev URL
- [ ] Verify route files exist at correct paths

### Database Connection
- [ ] Ensure PostgreSQL is running
- [ ] Check DATABASE_URL is correct
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Check for migration errors

## Performance Checklist

- [ ] Login process completes within 5 seconds
- [ ] OTP verification within 3 seconds
- [ ] Password reset within 3 seconds
- [ ] No database N+1 queries
- [ ] Email sending doesn't block requests

## Security Checklist

- [ ] Passwords hashed with bcrypt
- [ ] OTPs hashed in database
- [ ] Auth tokens in httpOnly cookies
- [ ] CORS configured correctly
- [ ] Rate limiting on auth endpoints
- [ ] Account lockout after 5 failures
- [ ] Audit logs for all actions
- [ ] No sensitive data in logs
- [ ] CSRF protection enabled
- [ ] SQL injection prevention (via ORM)
