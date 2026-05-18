# SmartGov Auth API - Step-by-Step Testing Guide for Postman

## Setup Before Testing

### Step 1: Import Collection
1. Open Postman
2. Click "Collections" → "Import"
3. Select `SmartGov-Auth-API.postman_collection.json`
4. Click "Import"

### Step 2: Create Environment
1. Click "Environments" → "+"
2. Name: `SmartGov Dev`
3. Add variables:
   - `API_BASE_URL` = `http://localhost:4000/api`
   - `ACCESS_TOKEN` = (empty)
   - `REFRESH_TOKEN` = (empty)
4. Click "Save"

### Step 3: Select Environment
- In top-right dropdown, select `SmartGov Dev` environment
- Make sure backend server is running on port 4000

---

## Test Scenario 1: Citizen User Complete Flow

### ✅ Test 1.1: Health Check
```
GET /health
```
**Expected Response:**
```json
{
  "success": true,
  "message": "SmartGov citizen auth backend is running"
}
```
**Status:** ✅ Should be `200 OK`

---

### ✅ Test 1.2: Register Citizen
```
POST /auth/register
```

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john.doe@gmail.com",
  "mobile": "9876543210",
  "aadhaar": "1234 5678 9012",
  "state": "Tamil Nadu",
  "district": "Chennai",
  "address": "123 Main Street, Chennai 600001",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful. Verify your email using the OTP sent to your inbox.",
  "user": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john.doe@gmail.com",
    "mobile": "9876543210",
    "role": "citizen",
    "state": "Tamil Nadu",
    "district": "Chennai"
  },
  "emailVerificationRequired": true,
  "otp": "123456"
}
```

**Status:** ✅ Should be `200 OK`

**Note:** Copy the OTP from response (in dev mode, it's `123456`)

---

### ✅ Test 1.3: Verify Email (Registration)
```
POST /auth/verify-otp
```

**Request Body:**
```json
{
  "email": "john.doe@gmail.com",
  "otp": "123456",
  "purpose": "registration"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Status:** ✅ Should be `200 OK`

---

### ✅ Test 1.4: Citizen Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "identifier": "john.doe@gmail.com",
  "password": "SecurePass123!",
  "rememberMe": false
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john.doe@gmail.com",
      "role": "citizen"
    }
  }
}
```

**Status:** ✅ Should be `200 OK`

**Important:**
1. Copy the token from `data.token`
2. In Postman Environment, set `ACCESS_TOKEN` = `{token}`
3. Check cookies tab - should see `accessToken` and `refreshToken` as HTTP-only cookies

---

### ✅ Test 1.5: Get User Profile
```
GET /auth/profile
Header: Authorization: Bearer {{ACCESS_TOKEN}}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john.doe@gmail.com",
      "mobile": "9876543210",
      "role": "citizen",
      "state": "Tamil Nadu",
      "district": "Chennai",
      "emailVerified": true,
      "isVerified": true
    }
  }
}
```

**Status:** ✅ Should be `200 OK`

---

### ✅ Test 1.6: Refresh Token
```
POST /auth/refresh-token
Header: Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "role": "citizen"
    }
  }
}
```

**Status:** ✅ Should be `200 OK`

**Important:**
- Update `ACCESS_TOKEN` environment variable with new token
- New `refreshToken` will be set in cookies

---

### ✅ Test 1.7: Logout
```
POST /auth/logout
Header: Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Status:** ✅ Should be `200 OK`

**Important:**
- Clear environment variables: `ACCESS_TOKEN` = empty
- Cookies `accessToken` and `refreshToken` should be cleared

---

## Test Scenario 2: Admin User Complete Flow

### ✅ Test 2.1: Register Admin
```
POST /auth/admin/register
```

**Request Body:**
```json
{
  "fullName": "Admin User",
  "email": "admin@gmail.com",
  "mobile": "9876543211",
  "state": "Tamil Nadu",
  "district": "Chennai",
  "address": "Admin Building, Chennai 600001",
  "role": "super_admin",
  "password": "AdminPass123!",
  "confirmPassword": "AdminPass123!"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin account created successfully. Verification OTP sent to email.",
  "user": {
    "id": "uuid",
    "fullName": "Admin User",
    "email": "admin@gmail.com",
    "role": "super_admin",
    "emailVerified": false
  },
  "emailVerificationRequired": true,
  "otp": "123456"
}
```

**Status:** ✅ Should be `200 OK`

**Note:** Copy the OTP from response (in dev mode: `123456`)

---

### ✅ Test 2.2: Verify Admin Email (Registration)
```
POST /auth/verify-otp
```

**Request Body:**
```json
{
  "email": "admin@gmail.com",
  "otp": "123456",
  "purpose": "registration"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Status:** ✅ Should be `200 OK`

---

### ✅ Test 2.3: Admin Login (Step 1)
```
POST /auth/admin-login
```

**Request Body:**
```json
{
  "email": "admin@gmail.com",
  "password": "AdminPass123!",
  "rememberMe": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin login OTP sent to your email",
  "otp": "123456"
}
```

**Status:** ✅ Should be `200 OK`

**⚠️ Important:** NO JWT token issued yet! Must verify OTP next.

---

### ✅ Test 2.4: Verify Admin Login OTP (Step 2)
```
POST /auth/verify-otp
```

**Request Body:**
```json
{
  "email": "admin@gmail.com",
  "otp": "123456",
  "purpose": "admin_login"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP verified and login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "fullName": "Admin User",
      "email": "admin@gmail.com",
      "role": "super_admin"
    }
  }
}
```

**Status:** ✅ Should be `200 OK`

**Important:**
1. Copy the token from `data.token`
2. Update environment: `ACCESS_TOKEN` = `{token}`
3. Check cookies - `accessToken` and `refreshToken` should be set

---

### ✅ Test 2.5: Get Admin Profile
```
GET /auth/profile
Header: Authorization: Bearer {{ACCESS_TOKEN}}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "Admin User",
      "email": "admin@gmail.com",
      "mobile": "9876543211",
      "role": "super_admin",
      "state": "Tamil Nadu",
      "district": "Chennai",
      "emailVerified": true,
      "isVerified": true
    }
  }
}
```

**Status:** ✅ Should be `200 OK`

---

### ✅ Test 2.6: Admin Logout
```
POST /auth/logout
Header: Authorization: Bearer {{ACCESS_TOKEN}}
```

**Request Body:**
```json
{}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Status:** ✅ Should be `200 OK`

---

## Test Scenario 3: Password Reset Flow

### ✅ Test 3.1: Forgot Password
```
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "john.doe@gmail.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent to registered email address",
  "otp": "123456"
}
```

**Status:** ✅ Should be `200 OK`

**Note:** Copy the OTP (in dev mode: `123456`)

---

### ✅ Test 3.2: Verify Password Reset OTP
```
POST /auth/verify-otp
```

**Request Body:**
```json
{
  "email": "john.doe@gmail.com",
  "otp": "123456",
  "purpose": "password_reset"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

**Status:** ✅ Should be `200 OK`

---

### ✅ Test 3.3: Reset Password
```
POST /auth/reset-password
```

**Request Body:**
```json
{
  "email": "john.doe@gmail.com",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john.doe@gmail.com"
    }
  }
}
```

**Status:** ✅ Should be `200 OK`

---

### ✅ Test 3.4: Login with New Password
```
POST /auth/login
```

**Request Body:**
```json
{
  "identifier": "john.doe@gmail.com",
  "password": "NewSecurePass456!",
  "rememberMe": false
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john.doe@gmail.com",
      "role": "citizen"
    }
  }
}
```

**Status:** ✅ Should be `200 OK`

---

## Test Scenario 4: Error Cases

### ❌ Test 4.1: Invalid Credentials
```
POST /auth/login
```

**Request Body:**
```json
{
  "identifier": "john.doe@gmail.com",
  "password": "WrongPassword123!",
  "rememberMe": false
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid password"
}
```

**Status:** ❌ Should be `401 Unauthorized`

---

### ❌ Test 4.2: Email Already Registered
```
POST /auth/register
```

**Request Body:**
```json
{
  "fullName": "Duplicate User",
  "email": "john.doe@gmail.com",
  "mobile": "9999999999",
  "aadhaar": "5678 9012 3456",
  "state": "Karnataka",
  "district": "Bangalore",
  "address": "123 New Street",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

**Status:** ❌ Should be `409 Conflict`

---

### ❌ Test 4.3: Invalid OTP
```
POST /auth/verify-otp
```

**Request Body:**
```json
{
  "email": "john.doe@gmail.com",
  "otp": "000000",
  "purpose": "registration"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

**Status:** ❌ Should be `401 Unauthorized`

---

### ❌ Test 4.4: Wrong Role Login
**Setup:** Use citizen email in admin login
```
POST /auth/admin-login
```

**Request Body:**
```json
{
  "email": "john.doe@gmail.com",
  "password": "SecurePass123!",
  "rememberMe": true
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "User not found or invalid role"
}
```

**Status:** ❌ Should be `401 Unauthorized`

---

### ❌ Test 4.5: Missing Authorization
```
GET /auth/profile
(No Authorization header)
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Missing authorization token"
}
```

**Status:** ❌ Should be `401 Unauthorized`

---

### ❌ Test 4.6: Invalid JWT Token
```
GET /auth/profile
Header: Authorization: Bearer invalid.token.here
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**Status:** ❌ Should be `401 Unauthorized`

---

### ❌ Test 4.7: Password Validation Errors
```
POST /auth/register
```

**Request Body (weak password):**
```json
{
  "fullName": "Test User",
  "email": "test@gmail.com",
  "mobile": "9876543212",
  "aadhaar": "1111 2222 3333",
  "state": "State",
  "district": "District",
  "address": "Address",
  "password": "weak",
  "confirmPassword": "weak"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Password must be at least 8 characters long"
}
```

**Status:** ❌ Should be `400 Bad Request`

---

### ❌ Test 4.8: Mismatched Passwords
```
POST /auth/register
```

**Request Body:**
```json
{
  "fullName": "Test User",
  "email": "test@gmail.com",
  "mobile": "9876543212",
  "aadhaar": "1111 2222 3333",
  "state": "State",
  "district": "District",
  "address": "Address",
  "password": "SecurePass123!",
  "confirmPassword": "DifferentPass123!"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Password and confirm password must match"
}
```

**Status:** ❌ Should be `400 Bad Request`

---

## Test Scenario 5: Rate Limiting

### ⏱️ Test 5.1: Rate Limit - Auth Limiter
Make 10+ requests to `/auth/login` within 1 minute

**Expected Response (after 10 requests):**
```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

**Status:** ❌ Should be `429 Too Many Requests`

---

### ⏱️ Test 5.2: Rate Limit - OTP Limiter
Make 3+ requests to `/auth/verify-otp` within 1 minute

**Expected Response (after 3 requests):**
```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

**Status:** ❌ Should be `429 Too Many Requests`

---

## Summary Checklist

### ✅ All Tests Passed
- [ ] Health check works
- [ ] Citizen registration, email verification, login, profile, logout
- [ ] Admin registration, email verification, login, OTP verification, profile, logout
- [ ] Password reset flow complete
- [ ] Token refresh works
- [ ] All error cases handled correctly
- [ ] Rate limiting works

### Performance Checks
- [ ] All endpoints respond < 500ms
- [ ] Database queries are efficient
- [ ] No memory leaks in repeated requests

### Security Checks
- [ ] Passwords are hashed
- [ ] JWT tokens are secure
- [ ] HTTP-only cookies set correctly
- [ ] Rate limiting prevents brute force
- [ ] Invalid inputs rejected with 400
- [ ] Unauthorized access blocked with 401
- [ ] CORS headers present

---

## Troubleshooting

### Issue: "Backend not responding"
1. Check if backend server is running on port 4000
2. Run `npm run dev` in `/backend` directory
3. Verify database is connected (check console logs)

### Issue: "OTP not received"
1. In dev mode, OTP is returned in response
2. Check backend `.env` for SMTP configuration
3. If SMTP not configured, check backend console logs

### Issue: "Token not stored in Postman"
1. After login, manually copy token to environment
2. Or use Postman Test scripts to auto-extract token
3. Check cookie settings in Postman request config

### Issue: "Cookie not being sent"
1. Enable "Send cookie with request" in Postman
2. Ensure same base URL for all requests
3. Check cookie domain matches

### Issue: "CORS error in browser"
1. Backend is returning 200 but browser blocking
2. Check `FRONTEND_ORIGIN` in backend `.env`
3. Should include `http://localhost:5173` for local dev

---

## Next Steps

After all tests pass:
1. Test in actual React frontend
2. Verify JWT tokens in browser DevTools
3. Test logout actually clears cookies
4. Test account lockout after 5 failed attempts
5. Test token expiry and refresh

