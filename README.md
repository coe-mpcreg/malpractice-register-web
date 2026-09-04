# Malpractice Register — Web App

A real web app: open it in any browser, on any device, from anywhere —
no install needed. Both campuses sign in and work against the same
live Google Sheet. This is the "Option C" version — a small backend
server plus a web frontend — as opposed to the Electron desktop app
(which needs installing on each computer).

## How it's put together

- **`server.js` + `server/`** — a small Node/Express backend. This is
  the only place that ever touches your Google service-account
  credentials — they live in environment variables on the server, and
  are never sent to the browser.
- **`public/`** — the web frontend (plain HTML + a React component,
  loaded from CDN, no build step). It talks to the backend over a
  small JSON API (`/api/...`) and renders the whole register in the
  browser.
- **Google Sheets** — still the actual data store, exactly like the
  desktop app: a "Reports" tab (one row per case) and a "Users" tab
  (the 5 logins). New cases are appended as new rows; edits update only
  one row.

## 1. Set up the Google side (same as before, do this once)

1. Create a Google Cloud project at https://console.cloud.google.com
   and enable the **Google Sheets API**.
2. Create a **Service Account**, then create a JSON key for it and
   download it.
3. From that JSON file, note the `client_email` and `private_key`.
4. Create a Google Sheet and share it with that `client_email` as
   **Editor**.
5. Copy the **Spreadsheet ID** from the Sheet's URL (the long string
   between `/d/` and `/edit`).

## 2. Run it locally first (recommended, to make sure it all works)

1. Open a terminal in this folder.
2. Install dependencies:
   npm install
3. Copy `.env.example` to `.env` and fill in the three Google values
   from step 1, plus a `SESSION_SECRET` (a long random string — the
   file tells you how to generate one).
4. Start the server:
   npm start
5. Open http://localhost:3000 in a browser. You should see the sign-in
   screen. The first successful request automatically creates the
   "Reports" and "Users" tabs in your Sheet with the 5 default logins.

## 3. Deploy it somewhere reachable "from anywhere"

This is a completely standard Node.js web app, so it runs on any
Node-friendly host. Two simple, low-effort options if you don't
already have a preferred host:

**Render.com** (has a free tier)
1. Push this folder to a GitHub repo.
2. In Render, "New Web Service" → connect the repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Add the environment variables from `.env.example` under
   "Environment" in Render's dashboard (not as a file — paste each
   one in directly, including the multi-line `GOOGLE_PRIVATE_KEY`).
5. Deploy. Render gives you a URL like `https://your-app.onrender.com`
   — that's the link both campuses open in a browser.

**Railway.app** (similar flow)
1. Push to GitHub, "New Project" → deploy from repo.
2. Add the same environment variables under "Variables".
3. Railway detects `npm start` automatically and gives you a public URL.

Either way: once deployed, nobody needs to install anything. Both
campuses just open the URL in a browser (desktop or phone) and sign in.

If your institution already has its own server or hosting, this app
runs there too — it's just `node server.js` behind any process manager
(pm2, systemd, etc.), ideally behind HTTPS.

## Logging in

5 accounts, all with the same rights for now (view, create, and edit
cases for either campus), work from any browser once deployed:

| User                          | Password    |
|-------------------------------|-------------|
| Controller of Examinations (COE) | coe@123  |
| North Dept. COE (NDepCOE)     | ndep@123    |
| South Dept. COE (SDepCOE)     | sdep@123    |
| North Campus MPC (NorthMPC)   | north@123   |
| South Campus MPC (SouthMPC)   | south@123   |

These are the defaults created the first time the Sheet is set up.
**Sign in as COE and open "Manage users"** to change any password —
it updates the shared Sheet immediately, so it works from every device
right away.

Every case records who entered it and who last edited it (visible in
the case details and the Excel export).

## Notes / known limitations

- Sessions last 30 days and are just a signed token stored in the
  browser (`localStorage`) — there's no per-device revocation beyond
  changing that account's password (which invalidates old passwords,
  not old tokens; for a hard cutoff, change `SESSION_SECRET` and
  restart, which signs everyone out).
- Two people entering a brand-new case for the *same* campus in the
  same instant could, very rarely, get the same case-number serial.
  No data is lost — just correct the number by hand if it ever
  happens.
- This is deliberately simple auth for a small internal tool, not a
  hardened multi-tenant system. Put it behind your institution's VPN
  or IP allowlist if you want an extra layer, though it's not required.
- "Export to Excel" and "Print case report" work exactly like the
  desktop version, generated in the browser.
