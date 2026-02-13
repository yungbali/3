# KOTOMO

CA: ExSiURQuUF5SyTer9ErA7uwnKGVSmJkZe2GBz3f1pump

**AI Podcast Generator** — Turn any topic into a fully produced, multi-speaker podcast episode. Powered by multi-agent AI synthesis.

## What it does

1. **Enter a topic** (e.g. “The future of React Server Components”).
2. **KOTOMO** validates the topic, generates research, writes a multi-speaker script, and synthesizes audio with neural TTS.
3. **Listen or download** — stream the episode or get a shareable link (when storage is enabled).

Tech: Next.js (App Router), OpenRouter (Claude), OpenAI TTS, Vercel Blob (optional). Dark UI, real-time progress over SSE.

## Quick start

### Prerequisites

- Node.js 18+
- npm (or yarn / pnpm)

### Install and run

```bash
git clone https://github.com/yungbali/3.git
cd 3
npm install
cp .env.example .env.local
```

Edit `.env.local` and set at least:

- **OPENROUTER_API_KEY** — [OpenRouter](https://openrouter.ai/keys) (for Claude/LLM).
- **OPENAI_API_KEY** — [OpenAI API](https://platform.openai.com/api-keys) (for TTS).

Optional:

- **BLOB_READ_WRITE_TOKEN** — [Vercel Blob](https://vercel.com/dashboard/stores) for persistent audio URLs.
- **NEXT_PUBLIC_SITE_URL** — Your production URL (e.g. `https://3-nine-brown.vercel.app`).
- **LLM_MODEL** — e.g. `anthropic/claude-sonnet-4` (default).
- **OPENAI_TTS_MODEL** — `tts-1` (default) or `tts-1-hd`.

Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
npm start
```

## Environment variables (no secrets in the repo)

**Never commit API keys or tokens.** Use:

- **Local:** `.env.local` (already in `.gitignore`).
- **Vercel:** Project → Settings → Environment Variables.
- **GitHub Actions:** Repository → Settings → Secrets and variables → Actions.

Required for generation:

| Variable             | Description              |
| -------------------- | ------------------------ |
| `OPENROUTER_API_KEY` | OpenRouter API key (LLM) |
| `OPENAI_API_KEY`     | OpenAI API key (TTS)     |

Optional:

| Variable                | Description                        |
| ----------------------- | ---------------------------------- |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (audio storage)  |
| `NEXT_PUBLIC_SITE_URL`  | Public site URL                    |
| `LLM_MODEL`             | OpenRouter model (default: Claude) |
| `OPENAI_TTS_MODEL`      | `tts-1` or `tts-1-hd`              |

## Project structure

```
3/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes (generate, health)
│   │   ├── legal/        # Legal page
│   │   ├── status/       # Status page
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/       # React components
│   └── lib/              # Services (LLM, TTS, storage, audio)
├── public/               # Static assets (logo, og-image)
├── .env.example          # Example env (no secrets)
└── README.md
```

## Deploy (Vercel)

1. Push to GitHub and import the repo in [Vercel](https://vercel.com/new).
2. Set **Root Directory** to the repo root (or the folder that contains `package.json`).
3. Add the environment variables above in Vercel (Settings → Environment Variables).
4. Deploy; the app will be available at your Vercel URL.

## Links

- **App:** [3-nine-brown.vercel.app](https://3-nine-brown.vercel.app)
- **GitHub:** [github.com/yungbali/3](https://github.com/yungbali/3)
- **Twitter:** [@kotomo_engine](https://x.com/kotomo_engine)

## License

Private. See [Legal](https://3-nine-brown.vercel.app/legal) for terms and privacy.
