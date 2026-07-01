# logik-custom-ui

A custom React UI sitting on top of the **Logik configurator, run headlessly**. It
drives Logik through its runtime API and renders the screen from Logik's own layout
JSON — so an admin can move a field, rename a label, or change a field's display type
in Logik and the UI picks it up with **no code change**. A great way to demo Logik
with your own branding, and to learn how Logik communicates.

## 📖 Start here → [ONBOARDING.md](ONBOARDING.md)

The onboarding guide has two tracks:

- **Track 1 — Run & Demo:** get it running, switch products live, and make changes
  by asking Claude Code. No coding required. Start here if you just want to demo it.
- **Track 2 — Build on the SDK:** the `logik-client` SDK, the normalized data model,
  the render contract, and the gotchas — for building your own screen.

New to this / starting from zero? Jump to **Step 0** in the guide — it walks you
through installing Node.js, cloning this repo, and getting your Logik credentials.

## Quick start

```bash
git clone https://github.com/RavioliStorm/logik-custom-ui.git
cd logik-custom-ui
npm install
cp .env.example .env     # then fill in your tenant URL + token
npm start                # → http://localhost:3000
```

You'll need **Node.js** installed and two values from your team: your Logik tenant
URL and an access token. See [ONBOARDING.md](ONBOARDING.md) for the details.

> 🔒 Your token lives in `.env`, which is gitignored and never committed. Share
> `.env.example` (the blank template), not `.env`.

## What's in here

- `src/logik/` — the SDK (framework-agnostic core + a React hook)
- `src/components/` — the reference UI (restyle or replace freely)
- `src/setupProxy.js` — dev-only proxy that keeps the token server-side
- `ONBOARDING.md` — the full guide
