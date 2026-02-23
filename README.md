# FinanceAI 💰

A premium personal finance dashboard built with **Next.js 16**, **Supabase**, and **Tailwind CSS**.

![Dashboard Preview](https://via.placeholder.com/1200x600.png?text=FinanceAI+Dashboard)

## Features

- 📊 **Smart Dashboard**: Real-time financial overview with interactive charts (Income vs Spending, Category Breakdown).
- 🤖 **AI Expense Categorizer**: Natural language input (e.g., "Spent $15 on lunch") auto-categorizes transactions using a smart rules engine.
- 🎯 **Visual Goal Tracker**: Track savings goals with animated progress bars and contribution logging.
- 🔐 **Secure Authentication**: Full login/signup flow powered by Supabase Auth with secure session management.
- 🌑 **Dark Mode**: Sleek glassmorphism UI design with responsiveness for all devices.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

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

### 3. Configure Supabase

1. Create a new project on [Supabase](https://supabase.com).
2. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
3. Fill in your Supabase credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
   Restart your Next.js process after editing environment variables.
4. Run database migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_goal_contribution_atomic.sql`
   - `supabase/migrations/003_seed_dummy_data.sql` (no-op placeholder)
   - `supabase/migrations/004_production_hardening.sql`

### 4. (Optional) Seed local-only demo data

Run `supabase/seed.local.sql` only in local development environments.

- Never run this file in staging or production.
- It assumes at least one auth user already exists.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Quality Gates

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

All four commands should pass before any release.

## CI

GitHub Actions workflow is in `.github/workflows/ci.yml` and runs lint, typecheck, tests, and production build on push/PR.

- CI uses placeholder env values for compile-time checks.
- Production deployments must still set real values for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Production Runbook

- **Deploy checklist**: set env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`), run migrations, verify auth callback URL.
- **Rollback checklist**: restore previous app build, restore database from backup/snapshot if migration rollback is needed.
- **Incident checklist**: check auth/session state, inspect Supabase logs, validate RLS access paths with an affected user account.

## License

This project is open source and available under the [MIT License](LICENSE).
