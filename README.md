# AI2AI Chat

A research tool for running structured conversations between two AI models. Each bot is configured independently — different provider, model, system prompt, and generation parameters — and you watch them talk to each other. Useful for studying how models respond to each other, testing prompt strategies, or collecting dialogue data for research.

[![Deploy to GitHub Pages](https://github.com/JonasHeller1212/AI2AI-Chat/actions/workflows/deploy.yml/badge.svg)](https://github.com/JonasHeller1212/AI2AI-Chat/actions/workflows/deploy.yml)

**Live demo:** https://jonasheller1212.github.io/AI2AI-Chat/

---

## What it does

You set up two AI bots side by side. Each one has its own provider, model version, system prompt, temperature, and token limit. You send an opening message and the two bots respond to each other in turn. You can let them run automatically or step through each response manually.

The main things you can configure and control:

**Per bot:**
- Provider — OpenAI, Anthropic, Google Gemini, or Mistral
- Model version (e.g. GPT-4o, Claude Sonnet 4.6, Gemini 1.5 Pro, Mistral Large)
- System prompt — defines the bot's role, persona, and rules
- Temperature (0–2) and max output tokens
- Custom name, bubble colour, and text colour for the conversation view

**Conversation controls:**
- Auto-interact mode — the bots reply to each other automatically up to a set number of messages per bot (max 25 each)
- Manual mode — click to trigger each response one at a time
- Response delay — add a fixed pause between replies, with an optional length-based variance that scales with message length
- Repetitions — run the same conversation from scratch multiple times in sequence (useful for collecting varied outputs to the same prompt)
- Save to history — toggle whether the conversation is written to the database

**Export:**
- Plain text transcript
- CSV with per-message metadata (sender, model, temperature, word count, response time in ms)
- Screenshot of the conversation panel

**Data view:**
Alongside the chat view there is a live data table showing each message with its sender, model version, temperature, word count, and response time. This updates in real time during a conversation.

**Conversation history:**
Past conversations are saved to a Supabase database per user account. You can browse them, preview the full exchange, and reload any conversation back into the chat panel to continue or re-examine it.

**Other:**
- Dark mode (follows system preference on first visit, then remembers your choice)
- User account settings — update display name, email, password, or delete all stored conversation data

---

## Supported models

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-4, GPT-3.5 Turbo |
| Anthropic | Claude Sonnet 4.6, Claude Opus 4.6, Claude Haiku 4.5, Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus |
| Google | Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini Pro |
| Mistral | Mistral Large, Mistral Medium, Mistral Small, Mistral 7B (open) |

API keys are entered in the bot configuration panel. They are stored in your browser's local storage and cleared automatically when you sign out. Nothing is transmitted to or stored on this server — requests go directly from your browser to each provider's API.

---

## Running locally

**Requirements:** Node.js 18+ and npm, and a [Supabase](https://supabase.com) project.

```bash
git clone https://github.com/JonasHeller1212/AI2AI-Chat.git
cd AI2AI-Chat
npm install
```

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Start the dev server:

```bash
npm run dev
```

The app runs at http://localhost:5173.

To build for production:

```bash
npm run build
```

Output goes to `dist/`.

---

## Deploying to GitHub Pages

The repo includes a GitHub Actions workflow that builds and deploys to GitHub Pages on every push to `main` or `master`.

**One-time setup:**

1. In your repo, go to **Settings → Pages** and set the source to **GitHub Actions**.
2. Go to **Settings → Secrets and variables → Actions** and add two secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

After that, any push to main triggers a deploy. The site will be at:

```
https://<your-username>.github.io/AI2AI-Chat/
```

---

## Tech stack

- [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- [Vite 5](https://vitejs.dev/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) — auth and conversation storage
- [Lucide React](https://lucide.dev/) — icons
- [html2canvas](https://html2canvas.hertzen.com/) — screenshot export
