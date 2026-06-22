# Maintenance Tracker (מערכת קריאות תחזוקה)

Mobile-first web app for a hotel / resort / restaurant. Staff report things that
are broken or wrong ("calls"), with a photo, and the maintenance team tracks them
to resolution. Hebrew RTL UI.

## Stack
- **Server:** Node + TypeScript, Express, better-sqlite3, JWT auth, multer (photos)
- **Client:** React + Vite + TypeScript, mobile-first RTL CSS
- **DB:** SQLite (single file, `server/data.sqlite`)

## Setup
```bash
npm run install:all      # install root + server + client deps
cp server/.env.example server/.env   # then edit secrets if you like
npm run dev              # server on :4000, client (Vite) on :5173
```

Open http://localhost:5173 on your phone/browser.

Default admin login is seeded from `server/.env` (`ADMIN_USERNAME` /
`ADMIN_PASSWORD`, default `admin` / `admin123`). Log in, then create employees,
locations and categories from the admin screens.

## Roles
- **staff** – open issues and track their own
- **maintenance** – see all issues, assign, change status, resolve
- **admin** – everything + manage employees, locations, categories

## Production (single process)
```bash
npm run build            # builds client into client/dist, compiles server
npm start                # server serves the built client + API on $PORT (4000)
```
The Express server serves the built React app, the API, and uploaded photos all
from one process — so production is a single web service.

Set `DATA_DIR` to a writable, persistent path; the SQLite file and uploaded
photos are stored there. Locally it defaults to the `server/` folder.

## Deploy to Render
This repo includes `render.yaml` (a Render Blueprint).

1. Push the repo to GitHub.
2. In Render: **New → Blueprint** → select the repo. Render reads `render.yaml`
   and provisions a web service with a persistent disk mounted at `/var/data`.
3. When prompted, set **`ADMIN_PASSWORD`** (a strong value). `JWT_SECRET` is
   auto-generated.
4. After the first deploy, log in with `ADMIN_USERNAME` / your `ADMIN_PASSWORD`
   and create employees, locations and categories.

**Cost note:** the persistent disk requires a paid instance (**Starter, ~$7/mo**).
On the free plan there's no disk and the filesystem resets on every restart, so
the database and photos would not survive — fine for a throwaway demo, not for
real use.
