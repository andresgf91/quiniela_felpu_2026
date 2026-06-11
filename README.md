# Quiniela Mundial 2026 — Felpu

Private World Cup 2026 prediction pool for friends. Spanish UI, Next.js + Prisma + PostgreSQL.

## Quick start

```bash
pnpm install
docker compose up -d          # Postgres on localhost:5432
cp .env.example .env          # edit secrets
pnpm db:push                  # or pnpm db:migrate
pnpm seed
pnpm dev
```

Open http://localhost:3000

**First time:** go to `/register`, pick **any name you want**, use PIN **`1991`** and invite code **`1991`**.

**Returning:** `/login` with your name + PIN `1991`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm seed` | Load fixtures + sample users |
| `pnpm test:unit` | Vitest unit tests |
| `pnpm test:integration` | Integration tests (needs Postgres) |
| `pnpm test:e2e` | Playwright E2E |
| `pnpm simulate-tournament` | Fast-forward fake results |
| `pnpm build-fixture` | Regenerate `data/worldcup2026.json` |

## Deploy (Railway)

1. Create project with Postgres plugin
2. Set env: `DATABASE_URL`, `AUTH_SECRET`, `INVITE_CODE`, `ADMIN_NAMES`, `FOOTBALL_DATA_TOKEN`
3. Connect repo — `railway.json` runs migrations on deploy
4. Enable Postgres backups

## Default seed users (after `pnpm seed`)

All use PIN **`1991`**: `admin`, `Ana`, `Carlos`, `María`, `Luis` — or register with your own name.
