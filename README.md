# Wiora

Meet the other side before it matters.

Wiora helps you rehearse high-stakes conversations in your own words: job interviews, investor pitches, sales calls, negotiations, leadership talks, difficult conversations, or a custom situation. Each **preparation** is one real scenario. You describe it, Wiora researches and writes a brief, you practice live for thirty minutes, then read what to do next.

**Conversation types:** job interview · investor pitch · sales call · negotiation · leadership conversation · difficult conversation · custom

## How it works

1. **Describe the situation** — Pick a conversation type, add context, and attach the documents that matter (resume, deck, proposal, and the like). Leaving at this step does not use a preparation credit.
2. **Research & brief** — Submitting follow-ups starts research and spends **one preparation credit**. The brief is built from your intake and public research. Updating or re-running the brief spends another preparation credit.
3. **Practice live** — One **interview credit** starts a continuous **30-minute voice session**. That does not spend a second preparation credit. You speak; the counterpart stays in role and leads from the brief.
4. **Read the report** — Strengths, gaps, moments, transcript, recording, and Ask on that run.

After sign-in you land on **Home** and pick a conversation type.

## Credits

Every account starts with **10 free preparations**. Live sessions are not free.

| Pack | Interview credits | Preparations |
| --- | --- | --- |
| Pro | 5 | 10 |
| Premium | 10 | 20 |
| Super | 15 | 30 |

- **Preparation credits** are spent when research starts (and again if you refresh the brief). They are not spent again when the interview ends.
- **Interview credits** are spent when you start a live session.
- Packs are prepaid Polar products (not a subscription). Refunds are handled personally within 24 hours of purchase — contact [amritesh.cv](https://amritesh.cv/).

The dashboard sidebar shows remaining preparations, remaining live sessions, and **Add Credits**.

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
- **Research & brief** — One Brave research request per research run, then a correctable brief. A preparation credit is spent when research is queued.
- **Live counterpart** — Stream Video plus an OpenAI Realtime worker (`gpt-realtime-2.1-mini`). The other side greets in role, then leads from the brief. Spoken turns stay within **40 words**. User speech is not limited.
- **Session artifacts** — Transcript with elapsed timestamps, recording, richer moments, structured report, and Ask with message bubbles.
- **Preparation workspace** — Home type picker, list, journey, brief, lobby, call, and report in one flow.
- **Auth & credits** — Better Auth and Polar prepaid packs. Interview credits and preparation credits are separate ledgers.
- **Data layer** — local Postgres, Drizzle, tRPC, Inngest for research, reports, and hard-stop jobs.

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
- Inngest (research, reports, session hard-stop)

### Backend & database
- Postgres (Docker locally)
- Drizzle ORM
- tRPC
- Better Auth
- Polar (Pro / Premium / Super packs)

### Other
- Resend (email)
- Dicebear (avatars)
- S3-compatible object storage
- Brave Search (LLM context)

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
│   └── dashboard/           # Shell, sidebar, nav, plan card
├── src/worker/              # OpenAI Realtime session worker
├── src/db/                  # Drizzle schema
├── src/inngest/             # Research, report generation, run hard-stop
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
POLAR_PRODUCT_PRO="<polar_product_id>"
POLAR_PRODUCT_PLUS="<polar_product_id>"
POLAR_PRODUCT_SUPER="<polar_product_id>"
POLAR_WEBHOOK_SECRET="<polar_webhook_secret>"

WORKER_URL="http://localhost:8787"
WORKER_SECRET="<worker_secret>"

RESEND_API_KEY="<resend_key>"
```

Add S3 vars for uploads and recordings.

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

Restart the worker after changing session instructions. Next.js hot-reloads the app; the worker does not.

---

## Usage

- Sign up with OAuth or email (you are sent to `/home`).
- Create a **new preparation**, choose the conversation type, and complete intake.
- Submit follow-ups to start research (this uses one preparation credit).
- Review the brief. Saving a brief refresh uses another preparation credit.
- Buy interview credits when you are ready; join the lobby and enter the live session (this uses one interview credit).
- Open the report: summary, moments, transcript, recording, and Ask.

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
