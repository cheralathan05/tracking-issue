enum Role {
# SmartGov Authentication Notes

The backend now uses official testing accounts for admin and officer flows instead of open public email registration.

## Allowed official accounts

Use the accounts below for admin and officer workflows:

- `smartgov.admin@gmail.com`
- `tn.state.admin@gmail.com`
- `smartgov.helpdesk@gmail.com`

These are controlled by `ADMIN_ALLOWED_EMAILS` in `.env`.

## Supported flows

- Citizen registration with email OTP verification
- Citizen login with email or mobile number
- Admin and officer login with official Gmail accounts
- Forgot password with OTP verification
- Refresh-token session rotation with HTTP-only cookies
- Account lockout after repeated failed logins

## Relevant endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/admin-login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-otp`
- `POST /api/auth/reset-password`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`
- `GET /api/auth/profile`

## Email flow

- Registration sends a verification OTP to the citizen email.
- Forgot password sends a reset OTP to the same email.
- Admin and officer access is restricted to the official accounts listed above.
