# Wiora

Prepare for one real conversation, practice it in one paid live session, then read a report of what to do next.

A preparation is one situation: a job interview, an investor pitch, a sales call, a negotiation, a leadership conversation, a difficult conversation, or a custom conversation. You do not pick a difficulty. The brief decides how the conversation will feel.

1. **Describe the situation.** Add the documents that belong to it.
2. **Read the brief.** Correct facts that are wrong.
3. **Pay for one session.** $2 for 30 minutes, $3 for 45, or $4 for 60.
4. **Practice live.** The counterpart responds to what you just said until the paid time ends.
5. **Read the report.** Practice one weakness again, or take the next practice. Both are new paid sessions. There is no free tier and no subscription.

## Setup

```bash
npm install
```

Create `.env` with the database, Better Auth, OAuth, Stream, OpenAI, Polar, Resend, and S3 values used by the app. Non-voice model calls use `OPENAI_TEXT_MODEL`. Session length products use `POLAR_PRODUCT_30`, `POLAR_PRODUCT_45`, and `POLAR_PRODUCT_60`. Polar webhooks use `POLAR_WEBHOOK_SECRET`. The voice worker uses `WORKER_URL` and `WORKER_SECRET`.

```bash
npm run dev
npm run worker
```

Outside production, `TEST_SESSION_MINUTES` shortens the paid clock.

Object storage is S3-compatible: MinIO locally, Cloudflare R2 when deployed. The app uses the same `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY` in both places.


---

## ✨ Features

- 🧠 **Role-defined counterparts** – A name and instructions. Those instructions are the prompt for the live session.
- 🎙️ **Real-time voice** – You speak on a Stream call. OpenAI Realtime listens and answers in that role, including turns you did not script.
- 📝 **A kept session** – Searchable transcript, recording, and a summary written after the call by a background job. Ask AI continues on that meeting from the summary and recent chat, not from an unlimited transcript dump.
- 🪄 **Session history** – Meetings, summaries, transcripts, and the counterpart that was in the room.
- 🔐 **Authentication & billing** – Better Auth, with subscriptions on Polar.
- 👀 **Serverless backend** – Neon (Postgres), Drizzle, and tRPC.
- 🎨 **App UI** – Next.js, React, Tailwind CSS, and the existing component set.

---

## 🛠️ Tech Stack

### Frontend
- Next.js 15 (App Router)
- React 19 
- TypeScript 
- TailwindCSS 4 + shadcn/ui 
- Motion
- React Query + tRPC

### Real-Time & AI
- Stream Video/Chat SDK
- OpenAI Realtime API
- @stream-io/openai-realtime
- Inngest (background jobs & automation)

### Backend & Database
- Neon (Serverless Postgres)
- Drizzle ORM
- tRPC
- BetterAuth
- Polar (one session at a time: $2, $3, or $4)

### Other Integrations
- Resend (emails)
- Dicebear (avatars)
- Cloud environment via .env config

---

## 📂 Project Structure

```bash
wiora/
│── src/app/             # Next.js routes, landing, dashboard, call, webhooks
│── src/modules/         # Agents, meetings, call, home, auth, billing UI
│── src/db/              # Drizzle schema
│── src/inngest/         # Post-session summary and follow-up jobs
│── src/components/      # Shared UI
│── src/lib/             # Stream, auth, and server config
│── public/              # Assets
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/your-username/wiora.git
cd wiora
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables

- Create a .env file in the project root and include:

  ```bash
  DATABASE_URL="postgresql://<your-neon-db>"
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

  OPENAI_API_KEY="<openai_realtime_key>"

  POLAR_ACCESS_TOKEN="<polar_access_token>"
  RESEND_API_KEY="<resend_key>"
  ```

### 4. Database Setup (Drizzle + Neon)

- Push the schema:
  
```bash
npm run db:push
```

- Open Drizzle Studio:
  
```bash
npm run db:studio
```

### 5. Start the development server
```bash
npm run dev
```

- Your app runs at:

```bash
http://localhost:3000
```

---

## 🚀 Usage

- Sign up with OAuth or email.
- Create a counterpart: a name and the instructions for their role.
- Start a meeting, select that counterpart, and join from the lobby.
- Speak with them in real time.
- After the session, open the summary, searchable transcript, recording, and Ask AI.
- Manage billing and subscriptions in Polar.

---

## 🔮 Future Enhancements

Not built. Listed so the current product is not confused with them.

- More than one counterpart in the same session
- Search across past sessions
- Timelines and highlight reels from a transcript
- Shared session history for a team

---

## 🤝 Contributing

- Contributions are welcome!
- Feel free to fork the repo, submit issues, or open a PR.

---

## 📜 License

- Licensed under the MIT License.

---

 ## 🌐 Connect

- Engineered with care by Amritesh.
