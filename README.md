# Smart Expense & Wealth Tracker Pro

Production-ready full-stack personal finance and wealth tracking platform.

## Monorepo Structure
- `frontend/` Next.js 15 + Tailwind + shadcn-style components + Recharts + Framer Motion
- `backend/` Express + MongoDB + Mongoose + JWT + Google auth + reminders + exports

## Features
- Auth (register/login/google/forgot password)
- Finance dashboard with analytics cards and charts
- Expense, bank, UPI, cash, salary/income, savings/investments, EMI/loan modules
- AI insights API for spending/budget suggestions
- Reports + Excel/PDF export
- Reminder service (email/SMS/push) via cron
- Admin APIs

## Setup
### 1) Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 2) Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

## Deployment
- Frontend: Vercel (`frontend`)
- Backend: Railway/Render (`backend`)
- Database: MongoDB Atlas

Set environment variables from `.env.example` and `.env.local.example`.
