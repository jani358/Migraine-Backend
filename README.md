# Migraine — Strapi Backend (Ceylon Hospital)

Headless CMS for the Ceylon Hospital migraine landing page. The Next.js
frontend (`../Migrane-Free`) consumes this over the REST/GraphQL API.

- **Strapi** v5 (TypeScript)
- **Database** PostgreSQL (local: Docker; production: Hostinger VPS)
- **Media** Cloudflare R2 (S3-compatible) + Cloudflare CDN

---

## Prerequisites

- Node.js 22+
- pnpm
- Docker Desktop (for the local PostgreSQL container)

## Local setup

### 1. Start PostgreSQL (Docker)

```bash
docker run -d \
  --name migraine-postgres \
  -e POSTGRES_USER=strapi \
  -e POSTGRES_PASSWORD=strapi_dev_password \
  -e POSTGRES_DB=migraine_strapi \
  -p 5433:5432 \
  -v migraine_pgdata:/var/lib/postgresql/data \
  postgres:16-alpine
```

> Host port **5433** (maps to 5432 in the container) to avoid clashing with any
> local Postgres on the default port. Data persists in the `migraine_pgdata`
> volume. Start it again later with `docker start migraine-postgres`.

### 2. Environment

`.env` is already set up for local dev. Copy `.env.example` for other
environments. Fill in the Cloudflare R2 block when the client provides keys
(see below) — until then, uploads fall back to local disk automatically.

### 3. Run

```bash
pnpm install
pnpm run develop      # http://localhost:1337/admin
```

First run: create the admin user at `/admin`.

---

## Cloudflare R2 (media uploads)

Ask the **client** for an R2 bucket + API token, then fill these in `.env`:

| Variable | Where to get it |
|----------|-----------------|
| `R2_BUCKET` | The bucket name |
| `R2_ACCESS_KEY_ID` | R2 → Manage API Tokens → create token |
| `R2_SECRET_ACCESS_KEY` | (shown once when the token is created) |
| `R2_ENDPOINT` | `https://<accountid>.r2.cloudflarestorage.com` |
| `R2_PUBLIC_URL` | Public bucket URL or custom domain, e.g. `https://media.ceylonhospital.com` |

With all five set, the S3 provider activates (see `config/plugins.ts`) and every
upload made in the Strapi admin goes straight to R2 — keeping large patient
videos off the VPS disk and serving them via Cloudflare's CDN. Video upload
limit is 200 MB (adjust `sizeLimit` in `config/plugins.ts`).

---

## Content model

| API | Kind | Drives (Figma section) |
|-----|------|------------------------|
| `video-testimonial` | collection | "Real Stories. Real Patients." (patient videos) |
| `text-testimonial` | collection | "What Our Clients Say" (written reviews) |
| `pricing-plan` | collection | "Choose Your Path to Relief" (Basic/Standard/Premium) |
| `faq` | collection | FAQ accordion |
| `symptom` | collection | "Have You Experienced Any of These?" |
| `commitment` | collection | Feature cards (Airport pickup, 24/7 care, …) |
| `doctor` | **single** | "Meet Your Specialist" + stats band |
| `site-setting` | **single** | header / hero / contact / footer / socials |

Components: `shared.stat` (value + label), `shared.social-link` (platform + url).

### Making content public

New collection/single types are private by default. To let the frontend read
them without auth: **Settings → Users & Permissions → Roles → Public** → enable
`find` / `findOne` for each content-type. (Can be automated in `src/index.ts`
bootstrap — ask if you want that seeded.)

---

## Production (Hostinger VPS) — notes

- Provision **PostgreSQL** on the VPS; point `DATABASE_*` at it and set
  `DATABASE_SSL=true` if required.
- `pnpm run build && pnpm run start` (run under PM2 or systemd).
- Put **Cloudflare** in front (DNS proxy) for SSL + DDoS + to hide the VPS IP.
- Set all R2 vars so media never touches the VPS disk.

## Scripts

```bash
pnpm run develop   # dev with autoreload
pnpm run build     # build admin panel
pnpm run start     # production server (after build)
```
