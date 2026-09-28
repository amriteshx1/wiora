# Wiora

**AI counterparts for live conversations.**

Meet the other side before it matters. You define who sits across from you, meet them in a real-time voice session, and keep that meeting: recording, transcript, summary, and Ask AI.

A counterpart is an agent with a name and instructions — interviewer, investor, client, or anyone else you can describe. The same session shape covers pitches, client conversations, sales, negotiations, and interviews. None of those is the product category.

The product is three steps, already wired:

1. **Define the counterpart.** Name them and write the role.
2. **Enter the conversation.** Join a live voice session. OpenAI Realtime speaks as that counterpart on the Stream call.
3. **Keep the conversation.** Transcript, recording, and a generated summary stay on the meeting. Ask AI answers from that summary and the chat you continue there. A follow-up email goes out the next day.

This is not a custom-trained model, an autonomous agent workforce, or a guarantee of any outcome. It is a role-defined voice counterpart and a session you can reopen.

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
- Polar (subscriptions, billing)

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
