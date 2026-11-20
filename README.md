# Wiora

Meet the other side before it matters.

Wiora is practice for one real upcoming conversation. You pick the type, describe the situation, attach the documents that matter, and Wiora researches the public side of it. You get a brief, then sit across from that counterpart in a 30-minute live voice session. Afterward you keep a report, moments, transcript, recording, and Ask.

This is not a custom-trained model, an agent you configure by name, a subscription, or a guarantee of any outcome. It is a situation-specific counterpart and a session you can reopen.

**Conversation types**

Job interview · Investor pitch · Sales call · Negotiation · Leadership conversation · Difficult conversation · Performance review · Customer escalation · Partnership meeting · Media interview · Salary negotiation · Networking conversation · Custom

---

## How it works

1. **Describe the situation** — From Home, pick a type (or Create your own). Fill the type-specific intake and attach files. Saving a draft does not spend a preparation credit.
2. **Research and brief** — Submit follow-ups to start research. That spends **one preparation credit**. Brave Search looks up public sources; the brief is synthesized from your intake, documents, and those findings. You can correct facts. Refreshing or re-running the brief spends another preparation credit.
3. **Practice live** — One **interview credit** starts a continuous **30-minute** voice session. That does not spend a second preparation credit. You speak first; the counterpart greets in role, then leads from the brief. Spoken turns stay at **40 words or fewer** (aim 20–30). You are not asked to be brief.
4. **Read the report** — Strengths, gaps, moments, transcript, recording, and Ask on that run.

After sign-in you land on **Home**.

---

## Credits

Every account starts with **10 free preparations**. Live sessions are not free. There is no subscription.

| Pack (Polar) | Live sessions | Preparations |
| --- | --- | --- |
| Pro | 5 | 10 |
| Premium | 10 | 20 |
| Super | 15 | 30 |

- **Preparation credits** are spent when research is queued (and again if you refresh the brief). They are not spent again when the interview ends.
- **Interview credits** are spent when you start a live session. One live session at a time.
- Packs are prepaid Polar products. Refund requests are processed within 24 hours of purchase — contact [amritesh.cv](https://amritesh.cv/).

The sidebar shows remaining preparations, remaining live sessions, and **Add Credits**.

---

## Features

- **Type-specific intake** — Twelve predefined packs plus custom. Each type has its own fields, files, research hints, evaluation dimensions, and counterpart stance.
- **Research and brief** — One Brave LLM-context request per research run, then a correctable situation brief. Research is skipped for private conversations unless a named public organization is in play.
- **Live counterpart** — Stream Video plus an OpenAI Realtime worker (`gpt-realtime-2.1-mini`). The other side stays in role and drives from the brief.
- **Session artifacts** — Transcript with elapsed timestamps, recording, moments, structured report, and Ask with waiting indicators.
- **Preparation workspace** — Home type picker, list, details → follow-ups → research → brief → interview → report.
- **Auth and credits** — Better Auth. Separate ledgers for preparations and interviews. Polar checkout for Pro / Premium / Super.
- **Data layer** — Postgres, Drizzle, tRPC, Inngest (research, reports, session hard-stop), S3-compatible object storage.

---

## Tech stack

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4 + shadcn/ui
- Motion
- React Query + tRPC

### Real-time and AI
- Stream Video / Chat
- OpenAI Realtime API (`gpt-realtime-2.1-mini`)
- Text model via `OPENAI_TEXT_MODEL` (default `gpt-5.6-luna`)
- Brave Search (LLM Context)
- Inngest (research, reports, hard-stop)

### Backend and database
- Postgres (Docker locally; Neon in production)
- Drizzle ORM
- tRPC
- Better Auth
- Polar (prepaid packs, not subscriptions)

### Other
- Resend (email)
- Dicebear (avatars)
- S3-compatible object storage (MinIO locally, Cloudflare R2 when deployed)

---

## Project structure

```bash
wiora/
├── src/app/                 # Routes, landing, dashboard, API, webhooks
├── src/modules/
│   ├── preparations/        # Intake, research, brief, runs, report
│   ├── call/                # Live session UI
│   ├── home/                # Marketing landing
│   ├── auth/                # Sign-in / sign-up
│   ├── premium/             # Credits and Polar checkout
│   └── dashboard/           # Shell, sidebar, Home
├── src/worker/              # OpenAI Realtime session worker
├── src/db/                  # Drizzle schema
├── src/inngest/             # Research, report generation, run hard-stop
├── src/components/          # Shared UI
├── src/lib/                 # Auth, Stream, Polar, Brave, storage
└── public/
```

---

## Setup and installation

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

Create a `.env` in the project root:

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

WORKER_URL="http://127.0.0.1:8787"
WORKER_SECRET="<worker_secret>"

RESEND_API_KEY="<resend_key>"

S3_ENDPOINT="http://127.0.0.1:9002"
S3_REGION="us-east-1"
S3_BUCKET="wiora"
S3_ACCESS_KEY_ID="wiora"
S3_SECRET_ACCESS_KEY="wiora-local-secret"
```

Non-voice model calls use `OPENAI_TEXT_MODEL`. Public research uses `BRAVE_SEARCH_API_KEY`. Credit packs use the three `POLAR_PRODUCT_*` ids. Polar webhooks use `POLAR_WEBHOOK_SECRET`. The voice worker uses `WORKER_URL` and `WORKER_SECRET`.

### 4. Database and storage

Start local Postgres and MinIO, then push the schema:

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
- Pick a conversation type, or **Create your own**.
- Complete intake. Submit follow-ups to start research (one preparation credit).
- Review the brief. Saving a brief refresh uses another preparation credit.
- Buy a pack when you need live sessions or more preparations.
- Join the lobby and enter the live session (one interview credit, 30 minutes).
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

Contributions welcome — fork, open issues, or submit a PR.

---

## License

MIT License.

---

## Connect

Engineered with care by Amritesh.
