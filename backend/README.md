# SmartGov Citizen Authentication Backend

Production-ready Express + Prisma backend for SmartGov citizen authentication.

## Features

- Citizen registration and login
- JWT authentication
- Protected profile route
- OTP-based forgot password flow
- Password hashing with bcrypt
- Nodemailer email delivery
- PostgreSQL support with Prisma ORM
- Security middleware with Helmet, CORS, and rate limiting

## Setup

1. Install dependencies inside the `backend` folder.
2. Copy `.env.example` to `.env` and fill in the values.
3. Run `npx prisma generate`.
4. Run `npx prisma migrate dev --name init`.
5. Start the API with `npm run dev`.

## Database

Connect PostgreSQL through pgAdmin using the same `DATABASE_URL` value in `.env`.

## API Base

`/api/auth`

## Notes

- OTP emails use Nodemailer.
- In development, if SMTP values are missing, the OTP is still generated and logged so the workflow remains usable.
- If your SMTP provider requires TLS on port 465, set `SMTP_SECURE=true`; otherwise leave it `false` for port 587.