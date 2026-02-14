Frontend: Next.js 15+ (App Router) with Tailwind CSS. Agents love this because it's structured and easy to debug.

UI Components: Shadcn/UI + Lucide React (icons).

Database/Auth: Supabase. It provides instant Auth, a Postgres database, and Edge Functions. It’s "agent-friendly" because the agents can use the terminal to run migrations.

Charts: Recharts or Tremor. Critical for a finance app to visualize spending.

AI Models (Inside IDE): * Planning Mode: Use Gemini 3 Pro to map out the database schema.

UI/Asset Gen: Use Nano Banana (built into Antigravity) to generate your logo and custom dashboard backgrounds.

📱 Key Functionalities to Build

The "Smart Dashboard": A central hub showing total balance, monthly spending, and a "burn rate" (how fast you're spending).

AI Expense Categorizer: A feature where you type "Spent $12 on a burrito" and the agent writes logic to automatically tag it as "Food & Dining."

Visual Goal Tracker: A "Progress Bar" for specific savings goals (e.g., "New Vision Pro" or "Japan Trip").