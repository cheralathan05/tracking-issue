# SmartGov Auth API - Postman Collection

## Base URL
```
http://localhost:4000/api
```

## Environment Variables (Set in Postman)
- `API_BASE_URL` = `http://localhost:4000/api`
- `ACCESS_TOKEN` = (will be set after login/OTP verification)
- `REFRESH_TOKEN` = (will be set after login)

---

## 1. Health Check

### GET /health
**No Authentication Required**

```bash
GET http://localhost:4000/health
```

**Response:**
```json
{
  "success": true,
  "message": "SmartGov citizen auth backend is running"
}
```

---

## 2. Citizen Registration & Authentication

### POST /auth/register
**Citizen Registration**

```
POST {{API_BASE_URL}}/auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "fullName": "John Doe",
  "email": "john.doe@gmail.com",
  "mobile": "9876543210",
  "aadhaar": "1234 5678 9012",
  "state": "Tamil Nadu",
  "district": "Chennai",
  "address": "123 Main St, Chennai",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Validation Rules:**
- fullName: min 3 chars
- email: valid email format
- mobile: Indian format (10 digits, starts with 6-9)
- aadhaar: 12 digits in format XXXX XXXX XXXX
- state, district: required
- address: min 5 chars
- password: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- confirmPassword: must match password

**Response (Success):**
```json
{
  "success": true,
  "message": "Registration successful. Verify your email using the OTP sent to your inbox.",
  "user": {
    "id": "uuid",
    "fullName": "John Doe",
    "email": "john.doe@gmail.com",
    "mobile": "9876543210",
    "role": "citizen"
  },
  "emailVerificationRequired": true,
  "otp": "123456"  // Only in development mode
}
```

---

### POST /auth/login
**Citizen Login**

```
POST {{API_BASE_URL}}/auth/login
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "identifier": "john.doe@gmail.com",
  "password": "SecurePass123!",
  "rememberMe": false
}
```

**Validation Rules:**
- identifier: email or mobile number
- password: required

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "fullName": "John Doe",
      "email": "john.doe@gmail.com",
      "role": "citizen"
    }
  }
}
```

**Cookies Set (HTTP-only):**
- `accessToken`
- `refreshToken`

---

## 3. Admin Registration & Authentication

### POST /auth/admin/register
**Admin Registration (by Super Admin)**

```
POST {{API_BASE_URL}}/auth/admin/register
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "fullName": "Admin User",
  "email": "admin@gmail.com",
  "mobile": "9876543210",
  "state": "Tamil Nadu",
  "district": "Chennai",
  "address": "Admin Building, Chennai",
  "role": "super_admin",
  "password": "AdminPass123!",
  "confirmPassword": "AdminPass123!"
}
```

**Validation Rules:**
- fullName: min 3 chars
- email: any valid email (NO government domain restriction)
- mobile: Indian format
- state, district, address: required
- role: must be one of: `super_admin`, `state_admin`, `district_officer`, `department_officer`, `admin`, `officer`
- password: min 8 chars with complexity requirements
- confirmPassword: must match

**Response (Success):**
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
  "otp": "123456"  // Only in development mode
}
```

---

### POST /auth/admin-login
**Admin Login**

```
POST {{API_BASE_URL}}/auth/admin-login
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "admin@gmail.com",
  "password": "AdminPass123!",
  "rememberMe": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Admin login OTP sent to your email",
  "otp": "123456"  // Only in development mode
}
```

**Note:** At this point, NO JWT token is issued. Admin must verify OTP next.

---

## 4. OTP Verification Flow

### POST /auth/verify-otp
**Verify OTP and Issue JWT**

```
POST {{API_BASE_URL}}/auth/verify-otp
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON) - For Admin Login:**
```json
{
  "email": "admin@gmail.com",
  "otp": "123456",
  "purpose": "admin_login"
}
```

**Body (JSON) - For Citizen Registration:**
```json
{
  "email": "john.doe@gmail.com",
  "otp": "123456",
  "purpose": "registration"
}
```

**Body (JSON) - For Password Reset:**
```json
{
  "email": "john.doe@gmail.com",
  "otp": "123456",
  "purpose": "password_reset"
}
```

**Validation Rules:**
- email: must be valid
- otp: must be exactly 6 digits
- purpose: `registration`, `admin_login`, or `password_reset`

**Response (For admin_login):**
```json
{
  "success": true,
  "message": "OTP verified and login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "fullName": "Admin User",
      "email": "admin@gmail.com",
      "role": "super_admin"
    }
  }
}
```

**Response (For registration):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Cookies Set (For admin_login):**
- `accessToken`
- `refreshToken`

---

## 5. Password Management

### POST /auth/forgot-password
**Initiate Password Reset**

```
POST {{API_BASE_URL}}/auth/forgot-password
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "john.doe@gmail.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent to registered email address",
  "otp": "123456"  // Only in development mode
}
```

---

### POST /auth/reset-password
**Reset Password (after OTP verification)**

```
POST {{API_BASE_URL}}/auth/reset-password
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "john.doe@gmail.com",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

**Validation Rules:**
- email: must have verified OTP for password_reset purpose
- newPassword: same complexity as registration password
- confirmPassword: must match

**Response (Success):**
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

---

## 6. Token Management

### POST /auth/refresh-token
**Refresh JWT Access Token**

```
POST {{API_BASE_URL}}/auth/refresh-token
```

**Headers:**
```
Content-Type: application/json
```

**Cookies:**
- `refreshToken` (HTTP-only, automatically sent by browser/Postman)

**Body:**
```json
{}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "role": "admin"
    }
  }
}
```

**Cookies Set:**
- `accessToken` (new)
- `refreshToken` (may be rotated)

---

## 7. Authenticated Endpoints

### GET /auth/profile
**Get Current User Profile**

```
GET {{API_BASE_URL}}/auth/profile
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Cookies:**
- `accessToken` (HTTP-only, automatically sent)

**Response (Success):**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "user": {
      "id": "uuid",
      "fullName": "Admin User",
      "email": "admin@gmail.com",
      "mobile": "9876543210",
      "role": "super_admin",
      "state": "Tamil Nadu",
      "district": "Chennai",
      "emailVerified": true,
      "isVerified": true
    }
  }
}
```

---

### POST /auth/logout
**Logout Current User**

```
POST {{API_BASE_URL}}/auth/logout
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{ACCESS_TOKEN}}
```

**Cookies:**
- `accessToken` (HTTP-only, automatically sent)
- `refreshToken` (HTTP-only, automatically sent)

**Body:**
```json
{}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Cookies Cleared:**
- `accessToken`
- `refreshToken`

---

## Authentication Workflow

### Citizen User Flow:
1. **Register** → POST /auth/register
2. **Verify Email** → POST /auth/verify-otp (purpose: registration)
3. **Login** → POST /auth/login
4. **Access Protected** → GET /auth/profile (with JWT token)

### Admin User Flow:
1. **Create Admin** → POST /auth/admin/register (by Super Admin)
2. **Verify Email** → POST /auth/verify-otp (purpose: registration)
3. **Login** → POST /auth/admin-login
4. **Verify OTP** → POST /auth/verify-otp (purpose: admin_login) → Gets JWT
5. **Access Protected** → GET /auth/profile (with JWT token)

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid password"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Use admin login for official accounts"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Email not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Email already registered"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

- **Auth Limiter**: 10 requests per 15 minutes (register, login, admin-login)
- **OTP Limiter**: 3 requests per 15 minutes (forgot-password, verify-otp, reset-password)

---

## Test Data (Development Mode)

### Admin Account:
```
Email: admin@gmail.com
Password: AdminPass123!
OTP: 123456 (returned in dev mode)
```

### Citizen Account:
```
Email: john.doe@gmail.com
Password: SecurePass123!
OTP: 123456 (returned in dev mode)
```

---

## Postman Setup Instructions

1. **Create new Environment:**
   - Set `API_BASE_URL` = `http://localhost:4000/api`
   - Set `ACCESS_TOKEN` = (empty, will be set after login)
   - Set `REFRESH_TOKEN` = (empty, will be set after login)

2. **Configure Cookies:**
   - Postman automatically handles cookies if "Automatically follow redirects" is enabled
   - Enable "Send cookie with request" in request settings

3. **Set JWT Token after Login:**
   - After POST /auth/verify-otp (for admin) or POST /auth/login
   - Extract `data.token` from response
   - Set environment variable: `ACCESS_TOKEN` = `{token}`

4. **Use Bearer Token:**
   - In protected endpoints, use header: `Authorization: Bearer {{ACCESS_TOKEN}}`

---

## Security Notes

- All passwords are hashed with bcrypt (salt rounds: 10)
- JWT tokens use HS256 algorithm
- Refresh tokens are stored as hashed JTI in database
- Tokens expire after 15 minutes (access) and 7 days (refresh)
- Account lockout after 5 failed login attempts (15 minutes)
- OTP expires after 10 minutes
- All sensitive data (passwords, tokens) are HTTP-only cookies
