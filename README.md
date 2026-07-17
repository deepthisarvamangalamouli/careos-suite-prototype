# CareOS Suite — Prototype

A care planning, billing, and AI-assistant mini-suite for home care teams,
built on React + Supabase + Stripe + Grok, deployed on Vercel.

This is the companion prototype to the CareOS rostering/compliance app —
same domain, different slice: **care plans → visit notes → AI summaries →
subscription billing**, all on one continuous record instead of separate
tools.

## What's in here

| Area | How it works |
|---|---|
| **Care Planning** | Clients, care plans (goals/needs/risks), and a visit-notes log — all real Supabase tables, live CRUD from the UI |
| **Rostering** | Schedule shifts (client + carer + date/time), grouped by day, with scheduled/completed/missed status |
| **Compliance** | Log carer training/certifications with expiry dates; a dashboard flags anything expired or expiring within 60 days |
| **AI Assistant** | A chat interface backed by Grok (x.ai). It reads the team's recent visit notes as context and can summarise, spot gaps, or draft handovers |
| **Billing** | Stripe Checkout for three subscription tiers, a Stripe Customer Portal link to manage/cancel, and a webhook that syncs subscription status back into Supabase |
| **Auth** | Supabase email/password auth, with a `carer` / `manager` role on the profile |

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4 + React Router
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Billing:** Stripe (Checkout + Billing Portal + Webhooks)
- **AI:** Grok (x.ai `grok-4`) via a Vercel serverless function
- **Hosting:** Vercel (static frontend + `/api` serverless functions)

See [`TECH_STACK.md`](./TECH_STACK.md) for how the pieces fit together.

## 1. Run it locally

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

The app runs at `http://localhost:5173`. The `/api` serverless functions
only run when deployed to Vercel (or via `vercel dev` — see step 5).

## 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor → New query**, paste in the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates
   `profiles`, `clients`, `care_plans`, `visit_notes`, `shifts`,
   `carer_training`, and `billing_accounts`, with row-level security enabled.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (server-side only —
     never expose this with a `VITE_` prefix)
4. In **Authentication → URL Configuration**, add your Vercel URL to
   **Redirect URLs** once you've deployed (step 5).

## 3. Set up Stripe

1. Create a [Stripe](https://dashboard.stripe.com) account (test mode is
   fine for a prototype).
2. **Products → Add product**, create three recurring prices (Starter,
   Growth, Agency — or your own tiers). Copy each **Price ID** into
   `STRIPE_PRICE_STARTER` / `_GROWTH` / `_AGENCY`.
3. **Developers → API keys** → copy the **Secret key** into
   `STRIPE_SECRET_KEY`.
4. **Developers → Webhooks → Add endpoint**, pointing at
   `https://<your-vercel-url>/api/stripe-webhook`, listening for
   `checkout.session.completed`, `customer.subscription.updated`, and
   `customer.subscription.deleted`. Copy the **Signing secret** into
   `STRIPE_WEBHOOK_SECRET`.

## 4. Set up Grok (x.ai)

1. Get an API key from [console.x.ai](https://console.x.ai).
2. Put it in `GROK_API_KEY`.

The chat function calls Grok's OpenAI-compatible endpoint
(`https://api.x.ai/v1/chat/completions`) with the `grok-4` model and a
system prompt scoped to visit-note summarisation — swap the model name in
[`api/chat.js`](./api/chat.js) if you're on a different Grok tier.

## 5. Deploy to Vercel

1. Push this repo to GitHub, then **Import Project** in Vercel.
2. Add every variable from `.env.example` under **Settings → Environment
   Variables** (both the `VITE_` ones and the server-side ones).
3. Deploy. Vercel automatically builds the frontend and turns everything in
   `/api` into serverless functions.
4. Copy the deployed URL into Supabase's **Redirect URLs** (step 2.4) and
   into `PUBLIC_SITE_URL` in Vercel's env vars, then redeploy.

## Project structure

```
src/
  pages/        Landing, Login, Signup, Dashboard, Clients, ClientDetail,
                Rostering, Compliance, Billing, Assistant
  components/    Layout (sidebar nav), StatusPill
  lib/           supabaseClient.js, AuthContext.jsx
api/
  create-checkout-session.js   Stripe Checkout
  create-portal-session.js     Stripe Billing Portal
  stripe-webhook.js            Syncs subscription status → Supabase
  chat.js                      Grok-powered assistant
supabase/
  schema.sql                   Tables + RLS policies
```

## Known limits (it's a prototype)

- Billing and care-planning data are shared across the whole team rather
  than scoped per agency — fine for a demo, not for multi-tenant use.
- The AI assistant only reads the 15 most recent visit notes as context;
  it doesn't yet do retrieval over the full history.
- No automated tests yet.
