# Starlog - Personal Language Dictionary

Starlog is a web application for building personal vocabulary dictionaries, with a focus on endangered and underrepresented languages.

## Features

- **Personal Dictionary**: Create and manage vocabulary decks
- **Audio Recording**: Record pronunciations for words
- **Community Decks**: Browse and fork community-curated vocabulary
- **Spaced Repetition**: Built-in SRS for effective learning
- **Offline Support**: PWA with offline capabilities
- **AI Definitions**: Optional Claude-powered word definitions

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Backend**: Supabase (Auth, Database, Storage)
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   cd speakeasy3d-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

4. Add your Supabase credentials to `.env.local`

5. Start the development server:
   ```bash
   npm run dev
   ```

### Supabase Setup

1. Create a new Supabase project
2. Run the database migrations (see `docs/schema.sql`)
3. Enable Email and Google OAuth in Authentication settings
4. Create storage buckets for `audio` and `images`
5. Copy your project URL and anon key to `.env.local`

## Project Structure

```
src/
├── components/
│   ├── ui/          # Reusable UI components
│   ├── layout/      # App shell, navigation
│   └── starlog/     # Feature-specific components
├── pages/           # Route pages
├── hooks/           # React hooks
├── lib/             # Utilities and API clients
├── stores/          # Zustand stores
└── styles/          # Global styles
```

## Deployment

### Vercel

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Custom Domain

1. Add `app.speakeasy3d.com` in Vercel domain settings
2. Update DNS: CNAME to `cname.vercel-dns.com`

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT
