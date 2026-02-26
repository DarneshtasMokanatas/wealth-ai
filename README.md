# FinanceAI 💰

A premium personal finance dashboard built with **Next.js 16**, **Supabase**, and **Tailwind CSS**. Track spending, manage budgets, set savings goals, and get AI-powered insights powered by Google Gemini.

## Features

### Core Pages
- 📊 **Dashboard** — Real-time financial overview with income/spending charts, category breakdown, and live budget alerts
- 💳 **Transactions** — Full transaction history with smart auto-categorisation, recurring transaction support, and inline CRUD
- 📅 **Calendar** — Monthly calendar view of all transactions with per-day summaries
- 💰 **Budgets** — Monthly/weekly budget limits per category with live spend tracking and warning banners
- 🎯 **Goals** — Savings goal tracker with animated progress bars and atomic contribution logging
- 📈 **Analytics** — Spending trends (3/6/12 months), day-of-week breakdown, month-over-month category comparison
- 🗂️ **Categories** — System + custom user-defined categories with icon and colour support
- 👤 **Profile** — Display name, avatar, phone, and account settings

### AI Features (Google Gemini)
- 🤖 **AI Insights** — Generates 5 personalised, data-driven spending insights from your financial history
- 💬 **Ask Anything** — Natural language Q&A about your finances (e.g. "Which day should I avoid spending?")
- 🏷️ **Smart Categoriser** — Auto-categorises transactions from plain-text descriptions

### Platform
- 🔐 **Authentication** — Supabase Auth with secure session management and OAuth callback
- 🌙 **Dark / Light Theme** — Glassmorphism UI with persistent theme preference
- 🔁 **Recurring Transactions** — Cron-based auto-processing of weekly/monthly recurring entries
- 🛡️ **Rate Limiting** — In-memory sliding-window rate limiter on AI endpoints
- 📋 **Security Logging** — Server-side logging for auth and sensitive actions
- ⚡ **SQL Aggregate RPCs** — All dashboard and analytics data served via Postgres functions — no full table scans

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Server Actions) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL + RLS) |
| Auth | Supabase Auth (SSR cookies via `@supabase/ssr`) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Charts | [Recharts](https://recharts.org/) |
| AI | [Google Gemini](https://ai.google.dev/) (`gemini-2.5-flash`) |
| Icons | [Lucide React](https://lucide.dev/) |
| Deployment | [Vercel](https://vercel.com/) |

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/DarneshtasMokanatas/finance-ai.git
cd finance-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Required — Supabase project credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Required for auth redirect (set to your deployed URL in production)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Required for recurring transaction cron job
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=a_random_secret_string

# Optional — enables AI Insights and Ask Anything features
GEMINI_API_KEY=your_gemini_api_key
```

> Restart the Next.js process after editing environment variables.

### 4. Run database migrations

Execute all migration files in order against your Supabase project (SQL Editor or CLI):

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_goal_contribution_atomic.sql
supabase/migrations/003_seed_dummy_data.sql
supabase/migrations/004_production_hardening.sql
supabase/migrations/005_fix_profiles_rls.sql
supabase/migrations/006_fix_security_and_performance.sql
supabase/migrations/007_fix_categories_rls_and_transaction_fk_index.sql
supabase/migrations/008_add_phone_to_profiles.sql
supabase/migrations/009_add_budgets.sql
supabase/migrations/010_add_recurring_transactions.sql
supabase/migrations/011_custom_categories.sql
supabase/migrations/012_drop_redundant_index.sql
supabase/migrations/013_fix_categories_rls_auth_uid.sql
supabase/migrations/014_analytics_rpc.sql
```

### 5. (Optional) Seed demo data

Run `supabase/seed.local.sql` in your local development environment only to populate dummy users and transactions.

> ⚠️ Never run the seed file in staging or production.

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx              # Dashboard home
│   │   ├── transactions/         # Transaction management
│   │   ├── budgets/              # Budget tracking
│   │   ├── goals/                # Savings goals
│   │   ├── analytics/            # Charts + AI insights
│   │   ├── calendar/             # Calendar view
│   │   ├── categories/           # Category management
│   │   └── profile/              # User profile
│   ├── api/cron/process-recurring/  # Recurring tx cron endpoint
│   ├── auth/callback/            # Supabase OAuth callback
│   └── login/                    # Auth page
├── components/
│   ├── dashboard/                # Chart components
│   └── layout/                   # Sidebar, Header, Theme
└── lib/
    ├── data.ts                   # All data fetching (RPCs + queries)
    ├── categorizer.ts            # Smart auto-categorisation engine
    ├── rate-limit.ts             # Sliding-window rate limiter
    ├── security-logger.ts        # Server-side security logging
    ├── types.ts                  # Shared TypeScript types
    ├── validation.ts             # Input validation helpers
    └── supabase/                 # Supabase client helpers (server/client/middleware)
supabase/
└── migrations/                   # 14 ordered SQL migrations
```

## Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # ESLint
npm run typecheck  # TypeScript type check
npm run test       # Run Vitest tests
```

All four quality gate commands (`lint`, `typecheck`, `test`, `build`) must pass before any release.

## Cron Job

The endpoint `POST /api/cron/process-recurring` processes due recurring transactions. Set up a scheduled job (e.g. Vercel Cron) to call it daily with the `Authorization: Bearer <CRON_SECRET>` header.

## Production Deployment

1. Set all required environment variables in your deployment platform
2. Run all 14 migrations against your production Supabase project
3. Configure the Supabase Auth redirect URL to match `NEXT_PUBLIC_SITE_URL`
4. Add the cron job to run `POST /api/cron/process-recurring` daily
5. Set `GEMINI_API_KEY` to enable the AI features

## License

This project is open source and available under the [MIT License](LICENSE).
