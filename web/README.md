# Fortune Reflection Studio (Global Web MVP)

Overseas website MVP for US, Europe, and Asia audiences.

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS
- API route: `/api/fortune`
- Qwen (DashScope) integration (primary)
- Optional OpenAI fallback
- Local fallback if no API key is configured

## Local Run

```bash
cd /Users/mac/Documents/Playground/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy and edit:

```bash
cp .env.example .env.local
```

Set:

- `DASHSCOPE_API_KEY` (recommended)
- `DASHSCOPE_MODEL` (optional, default: `qwen-turbo`)
- `OPENAI_API_KEY` (optional fallback)

If all keys are missing, the app still works with local fallback responses.

## Deploy (Vercel)

1. Push this folder to GitHub.
2. In Vercel, click **Add New Project** and import the repo.
3. Framework preset: **Next.js**.
4. Add environment variables:
   - `DASHSCOPE_API_KEY` (recommended)
   - `DASHSCOPE_MODEL=qwen-turbo` (optional)
   - `OPENAI_API_KEY` (optional fallback)
5. Click **Deploy**.
6. Bind your custom domain in Vercel + configure DNS in Cloudflare.

## Suggested Next Steps

1. Add auth (Clerk/Supabase Auth).
2. Add payment (Stripe).
3. Save reports to DB (Supabase Postgres).
4. Add analytics (PostHog or GA4).
5. Add locale routing (`/en`, `/zh`) and legal pages (privacy, terms).
