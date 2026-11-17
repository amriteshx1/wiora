# Wiora

Meet the other side before it matters.

Wiora helps you rehearse high-stakes conversations in your own words: job interviews, investor pitches, sales calls, negotiations, leadership talks, difficult conversations, or a custom situation. Each **preparation** is one real scenario—not a generic mock interview. You describe the situation, Wiora researches and writes a brief, you practice in a live voice session, then read a report on what to improve next.

**Conversation types:** job interview · investor pitch · sales call · negotiation · leadership conversation · difficult conversation · custom

## How it works

1. **Describe the situation** — Pick a conversation type, add context, and attach the documents that matter (resume, deck, proposal, and the like).
2. **Research & brief** — Wiora builds a brief from your intake: facts, unknowns, and how the conversation will feel. Fix anything that is wrong before you spend a credit. You do not pick a difficulty; the brief shapes the room.
3. **Practice live** — Spend one credit on a continuous **30-minute voice session**. You speak; the counterpart responds to what you just said until time runs out.
4. **Read the report** — Strengths, gaps, moments, transcript, recording, and Ask AI on that run. Practice one weakness again or start another run; each live session uses another credit.

**Billing:** Preparation and research are free. Credits are a one-time purchase (PRO 5 · PLUS 10 · SUPER 15 sessions). There is no subscription and no free live session.

## Quick start

```bash
npm install
```

Create `.env` with the database, Better Auth, OAuth, Stream, OpenAI, Polar, Resend, and S3 values used by the app. Non-voice model calls use `OPENAI_TEXT_MODEL`. Public research uses `BRAVE_SEARCH_API_KEY` and `BRAVE_SEARCH_COUNTRY` (default `IN`). Credit packs use `POLAR_PRODUCT_PRO`, `POLAR_PRODUCT_PLUS`, and `POLAR_PRODUCT_SUPER`. Polar webhooks use `POLAR_WEBHOOK_SECRET`. The voice worker uses `WORKER_URL` and `WORKER_SECRET`.

```bash
npm run dev
npm run worker
```

Object storage is S3-compatible: MinIO locally, Cloudflare R2 when deployed. The app uses the same `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY` in both places.

---

## Features

- **Situation intake** — Type-specific forms and document slots so the brief matches the conversation you are walking into.
- **Research & brief** — One Brave research request per preparation, then a correctable brief. A preparation credit is held before research and spent when the brief is ready. Interview credits are separate.
- **Live counterpart** — Stream Video plus an OpenAI Realtime worker; the other side stays in role and reacts to your answers, not a fixed script.
- **Session artifacts** — Transcript, recording, structured report, and Ask AI grounded in that run’s summary and chat.
- **Preparation workspace** — List, journey spine, brief, lobby, call, and report in one flow per preparation.
- **Auth & credits** — Better Auth and Polar prepaid packs (not subscriptions).
- **Data layer** — local Postgres, Drizzle, tRPC, Inngest for report generation and hard-stop jobs.

---

## Tech stack

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4 + shadcn/ui
- Motion
- React Query + tRPC

### Real-time & AI
- Stream Video / Chat
- OpenAI Realtime API
- `@stream-io/openai-realtime`
- Inngest (reports, session hard-stop, automation)

### Backend & database
- Postgres (Docker locally)
- Drizzle ORM
- tRPC
- Better Auth
- Polar (PRO / PLUS / SUPER credit packs)

### Other
- Resend (email)
- Dicebear (avatars)
- S3-compatible object storage

---

## Project structure

```bash
wiora/
├── src/app/                 # Routes, landing, dashboard, API, webhooks
├── src/modules/
│   ├── preparations/        # Intake, brief, runs, call, report UI + server
│   ├── home/                # Marketing landing
│   ├── auth/                # Sign-in / sign-up
│   ├── premium/             # Credits & checkout
│   └── dashboard/           # Shell, sidebar, nav
├── src/worker/              # OpenAI Realtime session worker
├── src/db/                  # Drizzle schema
├── src/inngest/             # Report generation, run hard-stop
├── src/components/          # Shared UI
├── src/lib/                 # Auth, Stream, Polar, storage
└── public/
```

---

## Setup & installation

### 1. Clone

```bash
git clone https://github.com/your-username/wiora.git
cd wiora
```

### 2. Install

```bash
npm install
```

### 3. Environment

Create a `.env` in the project root. At minimum:

```bash
DATABASE_URL="postgresql://wiora:wiora@127.0.0.1:5433/wiora"
BETTER_AUTH_SECRET="<your_auth_secret>"
BETTER_AUTH_URL="http://localhost:3000"

GITHUB_CLIENT_ID="<github_client_id>"
GITHUB_CLIENT_SECRET="<github_client_secret>"

GOOGLE_CLIENT_ID="<google_client_id>"
GOOGLE_CLIENT_SECRET="<google_client_secret>"

NEXT_PUBLIC_APP_URL="http://localhost:3000"

NEXT_PUBLIC_STREAM_VIDEO_API_KEY="<stream_video_public>"
STREAM_VIDEO_SECRET_KEY="<stream_video_secret>"

NEXT_PUBLIC_STREAM_CHAT_API_KEY="<stream_chat_public>"
STREAM_CHAT_SECRET_KEY="<stream_chat_secret>"

OPENAI_API_KEY="<openai_key>"
OPENAI_TEXT_MODEL="gpt-5.6-luna"
BRAVE_SEARCH_API_KEY="<brave_search_api_key>"
BRAVE_SEARCH_COUNTRY="IN"

POLAR_ACCESS_TOKEN="<polar_access_token>"
RESEND_API_KEY="<resend_key>"
```

Add worker, Polar product IDs, webhook secret, text model, and S3 vars as needed for full local voice and billing.

### 4. Database

Start local Postgres (and MinIO) with Docker, then push the schema:

```bash
docker compose up -d
npm run db:push
npm run db:studio   # optional
```

### 5. Run

```bash
npm run dev        # http://localhost:3000
npm run worker     # realtime voice (separate process)
```

---

## Usage

- Sign up with OAuth or email.
- Create a **new preparation**, choose the conversation type, and complete intake.
- Wait for research, review the brief, and correct facts if needed.
- Buy credits when you are ready; join the lobby and enter the live session.
- Open the report: summary, moments, transcript, recording, and Ask.
- Run another practice from the same preparation when you want another 30 minutes.

---

## Future enhancements

Not built today; listed so the product is not confused with them.

- Multiple counterparts in one session
- Cross-preparation search
- Timelines / highlight reels from transcript
- Shared history for teams

---

## Contributing

Contributions welcome—fork, open issues, or submit a PR.

---

## License

MIT License.

---

## Connect

Engineered with care by Amritesh.