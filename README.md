# ZER0ONE

**ZER0ONE** is a full-stack business portfolio and client services platform. Visitors can explore completed work, submit project quotation requests, leave reviews, and make payments. Admins manage all content through a dedicated secure admin panel.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     PRODUCTION STACK                     │
├─────────────────────┬────────────────────────────────────┤
│  Vercel (Frontend)  │   Render (Backend API)             │
│  Next.js 16 (App)   │   Express 5 + Node.js              │
│                     │   JWT Auth · Rate Limiting          │
│                     │   Helmet · CORS                     │
└────────────┬────────┴───────────┬────────────────────────┘
             │                   │
             └─────────┬─────────┘
                       ↓
               MongoDB Atlas (zeroone)
                       │
                  Collections:
              users · projects · reviews
              quotations · payments
                       │
                       ↓
              Resend API (email)
                       ↓
          freelancehq26@gmail.com
```

---

## Features

- **WORK** — Portfolio of completed projects pulled from MongoDB
- **CLIENT REVIEWS** — Per-project visitor reviews with 5-star ratings
- **QUOTATION** — Multi-step quote form with email notifications (ZR-YYYY-XXXX request IDs)
- **PAY US** — Razorpay payment architecture (architecture-ready, not live)
- **ADMIN PANEL** — Full CRUD for projects, review moderation, quotation management, metrics dashboard
- **SECURITY** — JWT auth, bcrypt, rate limiting, Helmet, input validation, CORS whitelist

---

## Local Development

### Prerequisites

- Node.js ≥ 20
- MongoDB Atlas account with a `zeroone` database

### 1. Clone the repository

```bash
git clone https://github.com/aka-GitCoder007/ZeroOne_MAIN.git
cd ZeroOne_MAIN
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Set up frontend environment

```bash
cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### 4. Install backend dependencies

```bash
cd backend
npm install
```

### 5. Set up backend environment

```bash
cp .env.example .env
# Fill in all required values in backend/.env
```

### 6. Start development servers

```bash
# From the project root — runs both frontend + backend concurrently
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health: http://localhost:5000/api/health

---

## Environment Variables

### Frontend (`.env.local`)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000/api/v1` |

### Backend (`backend/.env`)

| Variable | Description | Required |
|---|---|---|
| `NODE_ENV` | `development` or `production` | Yes |
| `PORT` | Server port | Yes (default: 5000) |
| `MONGODB_URI` | MongoDB Atlas connection string | Yes |
| `JWT_SECRET` | Strong random secret (≥32 chars) | Yes |
| `JWT_EXPIRES_IN` | Token TTL | Yes (default: 1d) |
| `ADMIN_USERNAME` | Admin login username | Yes |
| `ADMIN_PASSWORD` | Admin login password | Yes |
| `CLIENT_URL` | Frontend origin for CORS | Yes |
| `RESEND_API_KEY` | Resend.com API key for email | Yes (for email) |
| `RESEND_FROM_EMAIL` | Sender address | Yes (for email) |
| `QUOTE_RECEIVER_EMAIL` | Where quotation emails land | Yes |
| `RAZORPAY_KEY_ID` | Razorpay key ID | Optional |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret | Optional |

---

## Frontend Deployment — Vercel

1. Push to `aka-GitCoder007/ZeroOne_MAIN` on GitHub
2. Connect the repository to Vercel
3. Configure in the Vercel dashboard:

```
Framework: Next.js
Root Directory: . (project root)
Build Command: npm run build
Install Command: npm install
```

4. Add environment variable:

```
NEXT_PUBLIC_API_URL = https://<your-render-backend>.onrender.com/api/v1
```

5. Deploy. Vercel will provide a domain like `zeroone.vercel.app`.

---

## Backend Deployment — Render

1. Connect `aka-GitCoder007/ZeroOne_MAIN` to Render
2. Create a **Web Service** with:

```
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

3. Add all environment variables in the Render dashboard:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-atlas-uri>
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=1d
ADMIN_USERNAME=<your-admin-username>
ADMIN_PASSWORD=<your-admin-password>
CLIENT_URL=https://<your-vercel-domain>.vercel.app
RESEND_API_KEY=<your-resend-key>
RESEND_FROM_EMAIL=<your-verified-sender>
QUOTE_RECEIVER_EMAIL=freelancehq26@gmail.com
RAZORPAY_KEY_ID=<optional>
RAZORPAY_KEY_SECRET=<optional>
```

4. After Render gives you the backend URL (e.g. `https://zeroone-api.onrender.com`):
   - Update Vercel `NEXT_PUBLIC_API_URL` → `https://zeroone-api.onrender.com/api/v1`
   - Update Render `CLIENT_URL` → your Vercel domain
   - Redeploy both if needed

---

## MongoDB Atlas

- Database: `zeroone`
- Collections: `users`, `projects`, `reviews`, `quotations`, `payments`
- **Network Access**: Add Render's outbound IP range (or `0.0.0.0/0` for initial setup, then restrict)
- The admin user is auto-seeded on first startup via `ADMIN_USERNAME` + `ADMIN_PASSWORD`

---

## Email Configuration

Quotation notifications use [Resend](https://resend.com) (not SMTP).

- `RESEND_API_KEY` — obtain from resend.com dashboard
- `RESEND_FROM_EMAIL` — must be a verified sender domain in Resend
- `QUOTE_RECEIVER_EMAIL` — where quotation alerts land (`freelancehq26@gmail.com`)

If `RESEND_API_KEY` is not configured, quotations are **still saved to MongoDB** — only the email notification is skipped.

---

## API Health Check

```bash
curl https://<your-render-backend>.onrender.com/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "ZER0ONE API is running smoothly",
  "timestamp": "2026-09-09T12:00:00.000Z"
}
```

---

## Deployment Order

```
1. Push code to GitHub (aka-GitCoder007/ZeroOne_MAIN)
2. Verify MongoDB Atlas is accessible
3. Deploy backend on Render — wait for health check PASS
4. Note your Render backend URL
5. Deploy frontend on Vercel with NEXT_PUBLIC_API_URL set
6. Note your Vercel domain
7. Update Render CLIENT_URL to your Vercel domain
8. Redeploy Render backend
9. Run smoke test on production URL
```

---

## Security

- JWT tokens expire in `JWT_EXPIRES_IN` (default 1 day)
- Login rate limited to 5 attempts per 15 minutes per IP
- Review submission limited to 10 per hour per IP
- Quotation submission limited to 10 per hour per IP
- General API limited to 100 requests per 15 minutes per IP
- All admin routes require valid JWT + `role: admin`
- CORS allows only whitelisted origins
- Helmet sets secure HTTP headers
- Input is validated and sanitized before database writes

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend + backend concurrently |
| `npm run dev:frontend` | Start Next.js only |
| `npm run dev:backend` | Start Express only |
| `npm run build` | Build Next.js for production |
| `npm start` | Start Next.js production server |
