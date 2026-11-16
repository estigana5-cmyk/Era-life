# إراء Era — Habit Planner

Arabic RTL monthly planner prototype with a real Express server, SQLite central storage, owner session authentication, rate-limited login, viewer isolation, and optimistic revision checks.

## Requirements
- Node.js 20+
- A persistent server/disk (SQLite file is stored in `data/era.sqlite`)
- Set `SESSION_SECRET` and `OWNER_PASSWORD_HASH` in environment variables before deployment.

## Run locally
```bash
npm install
cp .env.example .env
```
Generate an owner password hash without putting the password in public source:
```bash
node -e "import('bcryptjs').then(async b=>console.log(await b.hash(process.stdin.read().toString().trim(),12)))"
```
Type/paste your password into stdin, then copy the printed hash to `OWNER_PASSWORD_HASH` in `.env`. (For production, set environment variables in your host's secret manager.) Then:
```bash
npm start
```
Open http://localhost:3000

## Storage and security
- Owner records are stored centrally in SQLite on the server; they are not stored in browser localStorage.
- Viewer/demo mode uses in-memory state in the page and has no write endpoint. Its submitted requests are denied by the server.
- Login is rate-limited; passwords are bcrypt hashes; session cookie is HttpOnly and SameSite=Lax. Set HTTPS in production so Secure cookies are enabled.
- Every save includes a revision number. A stale revision receives HTTP 409 and cannot silently overwrite newer data.
- JSON export is owner-only. This local app does not include hosted deployment, email recovery, or managed database backups.
- Use a persistent volume for `data/` in deployment. SQLite is suitable for a small personal site, not multi-node serverless deployment.

## Implemented baseline
Daily sections, configurable goals, habits, prayer status and points, study sessions, water steps, exercise records/timer, sleep/phone fields, weekly care schedule, notes, draft save, day approval, monthly overview, JSON/CSV export, temporary viewer mode, responsive RTL layout, reduced-motion support, and audio toggle.

## Important limitations
This is a working starter project, not a claim of completed production audit. You must deploy it to a trusted HTTPS host and set secrets. YouTube metadata retrieval is not implemented; add manual title/thumbnail/duration where needed. Browser audio and visual behavior must be checked on target devices. The included tests are not a substitute for live multi-device, visual, security, or deployment tests.
