# AI2AI-Chat

A React + TypeScript application that lets two AI models have a conversation with each other. Configure any two AI instances with independent system prompts, models, and parameters, then watch them interact.

[![Deploy to GitHub Pages](https://github.com/JonasHeller1212/AI2AI-Chat/actions/workflows/deploy.yml/badge.svg)](https://github.com/JonasHeller1212/AI2AI-Chat/actions/workflows/deploy.yml)

**Live demo:** https://jonasheller1212.github.io/AI2AI-Chat/

---

## Features

- Configure two independent AI agents (model, API key, system prompt, temperature, max tokens)
- Auto-interact mode — let the two AIs reply to each other up to 5 rounds
- Supports OpenAI GPT-4 models
- Clean, responsive UI built with Tailwind CSS

## Local Development

### Prerequisites

- Node.js 18+ and npm

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/JonasHeller1212/AI2AI-Chat.git
   cd AI2AI-Chat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment template and fill in your values:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your [Supabase](https://supabase.com) project URL and anon key.

4. Start the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 in your browser.

### Build

```bash
npm run build
```

The production output is written to `dist/`.

## Deploying to GitHub Pages

The included GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically builds and deploys to GitHub Pages on every push to `main`/`master`.

### One-time setup

1. Go to your repo **Settings → Pages** and set the source to **GitHub Actions**.
2. Go to **Settings → Secrets and variables → Actions** and add:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon key

After the next push the site will be live at:
```
https://<your-username>.github.io/AI2AI-Chat/
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key |

See `.env.example` for a template.

## Tech Stack

- [React 18](https://react.dev/)
- [TypeScript 5](https://www.typescriptlang.org/)
- [Vite 5](https://vitejs.dev/)
- [Tailwind CSS 3](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) (icons)
- [Supabase](https://supabase.com/) (auth / database)
