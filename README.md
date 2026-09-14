# Wiora

Wiora is a platform for practicing high-stakes professional conversations before they happen. You create an AI agent for the other seat (interviewer, investor, client, sales counterpart), join a live voice session, and leave with a summary, searchable transcript, recording, and Ask AI on that session.

Built with modern real-time tech and a fully serverless architecture.

---

## ✨ Features

- 🧠 **Custom AI Agents** – Give an agent a name and instructions so it stays in role for the conversation you need to rehearse.
- 🎙️ **Real-Time Voice Practice** – Speak in a live session. Speech → understanding → response pipelines powered by Stream Video/Chat + OpenAI Realtime.
- 📝 **Post-Session Insights** – Auto-generated transcripts, summaries, and structured notes via Inngest workflows, plus recording playback and Ask AI.
- 🪄 **Session Dashboard** – View session history, summaries, transcripts, and agent context in one place.
- 🔐 **Authentication & Billing** – Secure login with BetterAuth and Subscription management powered by Polar. 
- 👀 **Serverless + Scalable Backend** – Neon (Postgres) + Drizzle ORM and tRPC API for end-to-end type-safety.
- 🎨 **Modern UI/UX** – Next.js + React + TailwindCSS + shadcn/ui + smooth animations with Motion.

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
│── app/                 # Next.js routes & UI
│── server/              # tRPC routers, services, auth, workflows
│── db/                  # Drizzle schema & migrations
│── components/          # Reusable UI components
│── hooks/               # Client-side hooks
│── lib/                 # Utils, server configs
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

- Sign up using OAuth or email.
- Create a custom AI agent for the role you need to practice against.
- Start a session, select that agent, and join from the lobby.
- Speak with the agent in real time.
- After the session, review the summary, searchable transcript, recording, and Ask AI.
- Manage billing & subscriptions via Polar.

---

## 🔮 Future Enhancements

- Multi-agent collaborative meeting rooms
- Advanced analytics & similarity-based call retrieval
- AI-powered topic timelines & highlight reels
- Team spaces & shared meeting history

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
