Officer Invitation — Backend
===========================

Overview
--------
This backend implements the officer invitation workflow used by the SmartGov frontend.

Key endpoints
-------------
- `POST /api/officers/invitations` — create an invitation (admin auth required)
- `GET /api/officers/invitations/:code` — fetch invitation details
- `POST /api/officers/invitations/:code/accept` — accept invitation (create officer account)

Email delivery
--------------
Emails are sent using the existing `transporter` in `src/config/mailer.ts`.
Provide SMTP config in environment variables for real delivery. Fallback logs the invite URL to the server console when SMTP is not configured.

Environment variables
---------------------
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` — optional SMTP server
- `EMAIL_USER`, `EMAIL_PASS` — optional Gmail fallback
- `SMTP_FROM` — default sender (e.g. "SmartGov <no-reply@smartgov.gov>")
- `FRONTEND_ORIGIN` — used to construct the invite URL shown to the admin and embedded in emails

How to test locally
--------------------
1. Start the backend (ensure `DATABASE_URL` is set and migrations applied).
2. Start the frontend.
3. As an admin, open Admin → Invite officer and submit the form.
4. If SMTP is configured, the officer will receive an email. If not, check server logs — the invite URL will be printed.

Notes
-----
- Invitations auto-expire (7 days) and are marked `Accepted` when used.
- The invitation email is best-effort — email failures do not prevent the invitation from being created.
