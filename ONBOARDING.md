# Logik UI — Onboarding

A custom React UI sitting on top of the **Logik configurator, run headlessly**. Run it,
demo it, and tweak it — without needing to learn the Logik API's quirks.

This app is built to leverage as much of the **Logik layout API JSON** as possible,
on purpose — so the screen is driven by Logik's configuration rather than hardcoded
in the UI. The payoff is fewer code changes: an admin can move a field, rename a
label, or switch a field's display type entirely in Logik, and the UI picks it up
with **no code change required**.

---

## 👋 Pick your track

> **Not a developer? Start here.** This guide has two paths. Most jabronis (like
> the author) only need the first one.

| If you are… | Go to | What you'll get |
|-------------|-------|-----------------|
| 🎤 **A jabroni** — you want to run it, demo it, swap products, and ask Claude to make small changes for you | 👉 **[Track 1: Run & Demo](#track-1--run--demo-the-jabroni-track)** *(start here)* | Get it running, switch products live, talk about the tech, make changes by chatting |
| 🛠️ **A developer** — you want to build a real screen on the SDK and understand the data model | **[Track 2: Build on the SDK](#track-2--build-on-the-sdk-the-developer-track)** | The `logik-client` SDK, the normalized model, the render contract, gotchas |

---
---

# Track 1 — Run & Demo (the jabroni track)

**The 30-second pitch:** Logik is a product configurator — the rules engine that
figures out valid product configurations. It ships with its own UI, but it can
*also* run **headlessly**, exposing everything through an API so you can put your
own UI in front of it. That's what this project is: a custom, composable UI driving
Logik headlessly. You point it at a Logik tenant and a product, and it draws the
whole configurator screen for you. Great for demos where the stock UI doesn't tell
the story you want.

You do **not** need to know React, JavaScript, or the Logik API to run this and
demo it. If you want to *change* something, you can describe it to Claude Code and
let it do the editing — see [Making changes by asking Claude](#making-changes-by-asking-claude).

## Step 0 — Get set up first (one-time, ~10 min)

> 🚨 **New here and nothing works yet? This section is why.** The "3 commands"
> below assume the code is already on your computer and the right tools are
> installed. If you're starting from zero — no project folder, `npm: command not
> found`, "what folder?" — do this first. **This is the step that unsticks you.**

You need four things on your machine, once:

**1. A terminal.** On a Mac, press **⌘ + Space**, type `Terminal`, hit Enter. On
Windows, press the **Windows key**, type `cmd` (or `PowerShell`), hit Enter — either
works the same way for this guide. That's the window where every command here gets
typed.

> 🪟 **On Windows:** paths in this guide use `~/Documents/...` (Mac/Linux style).
> In Command Prompt, use `%USERPROFILE%\Documents\...` instead, or install
> [Git Bash](https://git-scm.com/downloads) to run the commands exactly as written.

**2. Node.js (this is what gives you `npm`).** Go to
[nodejs.org](https://nodejs.org), download the **LTS** version, run the installer,
click through it. To confirm it worked, type this in the terminal:

```bash
node -v      # should print something like v20.x or v22.x
npm -v       # should print a version number too
```

If `npm -v` says `command not found`, Node didn't install — reinstall and reopen the
terminal.

**3. The project code itself.** *This is the part the old guide skipped — and the
usual reason a jabroni is stuck.* Pick whichever is easiest:

- **Easiest — let Claude Code do it.** Open this onboarding link in Claude Code and
  say *"clone this project and get it running."* It fetches the repo and walks you
  through the rest.
- **Git clone (copy-paste).** In the terminal:
  ```bash
  mkdir -p ~/Documents/Projects
  git clone https://github.com/RavioliStorm/logik-custom-ui.git ~/Documents/Projects/logik-ui
  cd ~/Documents/Projects/logik-ui
  ```
  *(`git: command not found`? Run `xcode-select --install` first, or just use the
  zip option below.)*
- **A zip someone sent you.** Unzip it, drag the folder somewhere you'll remember
  (e.g. `~/Documents/Projects/logik-ui`), and note that path — you'll `cd` into it.

**4. Your two Logik secrets.** Ask your team for the **tenant URL** (`LOGIK_API_BASE`)
and an **access token** (`LOGIK_AUTH_TOKEN`). You'll paste them into `.env` in the
next section. You can't load a real product without them.

Once all four are done, you never repeat Step 0 — you're ready for the 3 commands.

## Run it (3 commands)

Open a terminal **in the project folder** (the one you cloned/unzipped in Step 0)
and run:

```bash
npm install               # one-time: downloads dependencies (takes a minute)
cp .env.example .env       # makes your settings file from the template
npm start                  # launches the app → opens http://localhost:3000
```

Between step 2 and 3, open the new `.env` file and fill in the tenant URL and token
(see next section). That's it — `npm start` opens the app in your browser.

### Launching it again, any time

Once you've done the one-time setup above, you don't need to repeat it. But **you
must run the command from inside the project folder** — `npm` looks for the project
in whatever folder your terminal is currently in. Run **both** of these lines, in
order:

```bash
cd ~/Documents/Projects/logik-ui   # 1. move into the project folder (adjust if yours lives elsewhere)
npm start                         # 2. start the app → http://localhost:3000
```

To stop the app, press **Ctrl+C** in the terminal.

> ⚠️ **Seeing `npm error … Could not read package.json` / `ENOENT`?** You ran
> `npm start` from the wrong folder (e.g. straight from your home directory). That's
> harmless — just run the `cd ~/Documents/Projects/logik-ui` line first, then
> `npm start` again.

> ⚠️ **`npm: command not found`?** Node.js isn't installed — go back to
> [Step 0](#step-0--get-set-up-first-one-time-10-min), item 2.

> 🆘 **Something errored?** Copy the red text from the terminal and paste it to
> Claude Code with "this broke when I ran the app." Don't hand-debug it.

## The `.env` file — your 4 settings

`.env` is where you tell the app *which Logik tenant and product* to talk to. Open
it in any text editor:

```bash
LOGIK_API_BASE=https://<tenant>.test.logik.io   # the tenant URL
LOGIK_AUTH_TOKEN=<runtime bearer token>          # your access token (keep secret)
# LOGIK_ORIGIN=https://<tenant>.test.logik.io    # optional — leave commented
REACT_APP_LOGIK_PRODUCT=configurableProduct5     # which product loads first
```

- **`LOGIK_API_BASE`** — the address of the Logik environment (your team will give you this).
- **`LOGIK_AUTH_TOKEN`** — your access token. Treat it like a password.
- **`REACT_APP_LOGIK_PRODUCT`** — the product the app shows on first load.

> 🔒 **Keep `.env` private.** It holds your token. Never paste it in chat, commit it,
> or include it in a zip you share. When you hand the project to someone, share
> `.env.example` (the blank template) and let them fill in their own. (The repo is
> already set up to ignore `.env` — that's why cloning it never leaks a token.)

> 🔁 **Changed the tenant URL or token?** Stop the app (Ctrl+C in the terminal) and
> run `npm start` again — those three are only read at startup. The *product* can
> change live without a restart (below).

## Switching products mid-demo (no restart)

This is the demo superpower. You can flip between products live:

- **In the app:** type a product id into the **Product** box in the top bar and hit
  **Load** (or press Enter). The screen rebuilds for that product instantly.
- **By link:** add `?product=` to the URL, e.g.
  `http://localhost:3000/?product=configurableProduct7`. The URL updates as you
  switch, so you can **bookmark a specific demo and share it as a link**.

If you don't specify a product, the app loads whatever is set in
`REACT_APP_LOGIK_PRODUCT` in your `.env`. Whether a given product id exists depends
on your tenant — use a product id from your own Logik environment.

## What you can say about the tech (the conceptual story)

When you're talking to a customer, here's the architecture in plain terms:

```
  Your browser          This app's "proxy"            The Logik tenant
  (the UI you see)  →   (keeps the token safe)   →   (the rules engine)
```

- The **Logik configurator** is the rules-and-logic engine. It has its own UI, but
  here we run it *headlessly* — driving it through its API instead of its screen.
- **This app** is a custom front-end. It asks Logik "what fields does this product
  have, and what's valid right now?" and draws them. When the user picks something,
  it sends that back and Logik responds with the updated, still-valid configuration.
- A small **proxy** in the middle holds the secret token so it never reaches the
  browser — that's why the token lives in `.env` and not in the app itself.
- **The point:** because the UI is fully custom, you can make the configurator look
  like *anything* — your customer's branding, a simplified guided flow, whatever the
  demo needs — while Logik does the heavy lifting underneath.

That's enough to have a confident conversation. You don't need the internals.

## Making changes by asking Claude

Want the buttons blue, a field hidden, the cart moved, a different layout? You don't
have to write code — **describe it to Claude Code** and let it make the edit. Good
prompts look like:

- *"In the logik-ui project, make the top bar dark with our logo on the left."*
- *"Hide the 'internal notes' field from the configurator screen."*
- *"The product picker images are too small — make them bigger."*

Then run `npm start` and look. If it's not right, say what's off and iterate. The
reference UI lives in `src/components/` — that's the part that's safe to restyle.
(Claude knows where things are; you don't need to.)

## When you're stuck

- **"I don't even have the project" / "what folder?":** you skipped
  [Step 0](#step-0--get-set-up-first-one-time-10-min) — start there.
- **`npm: command not found`:** Node.js isn't installed — Step 0, item 2.
- **App won't start / red errors:** paste the terminal output to Claude Code.
- **Blank screen or "403" errors:** usually the token in `.env` expired — get a
  fresh `LOGIK_AUTH_TOKEN` from your team and restart.
- **"Is this possible?"** — ask. Most "can the demo do X" questions are a quick yes.

➡️ **Want to go deeper and actually build on it?** Head to
**[Track 2: Build on the SDK](#track-2--build-on-the-sdk-the-developer-track)**.

---
---

# Track 2 — Build on the SDK (the developer track)

A guide to building a **custom UI on top of the Logik configurator** using the
`logik-client` SDK in this repo. If you can write React, you can build a
configurator screen without learning the Logik API's quirks — the SDK handles
auth, the session protocol, and the (genuinely weird) set/grid data model for you.

## TL;DR

```jsx
import { useLogikConfigurator } from './logik/useLogikConfigurator';

function MyConfigurator() {
  const { loading, layout, model, setField, setCell, resizeSet } =
    useLogikConfigurator({ baseUrl: '/api', configuredProductId: 'configurableProduct5' });

  if (loading || !model) return <Spinner />;
  return <YourLayout layout={layout} model={model}
                     onField={setField} onCell={setCell} onResize={resizeSet} />;
}
```

You render; the SDK does the plumbing. That's the whole idea.

## Get the code

If you haven't already, clone the repo and install dependencies:

```bash
git clone https://github.com/RavioliStorm/logik-custom-ui.git ~/Documents/Projects/logik-ui
cd ~/Documents/Projects/logik-ui
npm install
```

You'll need **Node.js** installed first (see
[Step 0](#step-0--get-set-up-first-one-time-10-min) in Track 1 if you're not sure).

## Run it

Three commands — no source edits needed:

```bash
npm install
cp .env.example .env     # then open .env and fill in the four values below
npm start                # → http://localhost:3000
```

`.env` holds everything that varies per tenant/product:

```bash
LOGIK_API_BASE=https://<tenant>.test.logik.io   # tenant base URL
LOGIK_AUTH_TOKEN=<runtime bearer token>         # the runtime token
# LOGIK_ORIGIN=https://<tenant>.test.logik.io   # optional; defaults to base
REACT_APP_LOGIK_PRODUCT=configurableProduct5    # which product to load first
```

The first three are read by the dev proxy (`src/setupProxy.js`) **server-side** —
the token never reaches the browser bundle. `REACT_APP_LOGIK_PRODUCT` is browser-
side, so it carries the `REACT_APP_` prefix that Create React App requires to
expose a var to app code. `.env` is gitignored — don't commit it or include it in
a zip you share; ship `.env.example` and let each person fill in their own.

> Changing the proxy-side values (base/token/origin) needs a restart — CRA reads
> `.env` only when the dev server boots. The product can change live (see below).

### Switching products without a restart

The product is chosen at runtime, resolved in this order:

1. a `?product=` URL param (e.g. `http://localhost:3000/?product=configurableProduct7`)
2. `REACT_APP_LOGIK_PRODUCT` from `.env`
3. a hardcoded fallback (`configurableProduct5`) in `src/App.js` — a demo id that
   only resolves on a tenant that actually has that product; change it for your own

Type a product id in the **Product** box in the top bar and hit **Load** (or Enter)
to switch live — the SDK re-inits and the URL updates so the view is bookmarkable
and shareable by link.

## How the pieces fit

```
Browser (React)                  Dev proxy (setupProxy.js)        Logik tenant
─────────────────                ─────────────────────────        ────────────
useLogikConfigurator  ──/api──▶  injects Authorization + Origin ──▶  /api/...
   └─ LogikClient                 (token stays here)
   └─ normalizeConfig
   └─ FieldRenderer / ProductPickerGrid
```

- **`src/logik/`** — the SDK (framework-agnostic core + a React hook).
- **`src/components/`** — the reference UI (FieldRenderer, ProductPickerGrid, ShoppingCart). Restyle or replace these; the SDK doesn't care.
- **`src/setupProxy.js`** — dev-only token/Origin injection.

## The SDK

### `useLogikConfigurator(opts)` — the React way

Returns everything a screen needs:

| field | what it is |
|-------|-----------|
| `loading`, `error` | lifecycle |
| `pending` | a write (field/cell/resize/save) is in flight — for an optional subtle "syncing…" indicator. **Don't disable inputs with it** (it flickers); the hook already discards stale responses so edits can't clobber each other |
| `layout` | the raw layout JSON (tiers → columnSets → elements) |
| `model` | the **normalized** config (see below) |
| `messages` | validation messages keyed by field `variableName` |
| `uuid` | the configuration id |
| `setField(name, value)` | edit a scalar field |
| `setCell(uniqueName, variableName, value)` | edit one set/grid cell |
| `resizeSet(setName, count)` | add/remove set rows |
| `refreshBom(type?)` | fetch the bill of materials (cart) |
| `save()` | persist the configuration |

### `model` — the normalized shape

`normalizeConfig()` turns Logik's flat field list into:

```js
model = {
  uuid, valid, total,
  byVar:    { [variableName]: Field },        // scalar fields
  byUnique: { [uniqueName]: Field },          // every field incl. set instances
  sets: {                                     // sets & product-picker grids
    [setName]: {
      name,
      size,                                   // current row count
      rows: [ { id, index, cells: { [col]: Field } } ],
      sizeField,                              // the row-count control field
    }
  },
  products, messages, layouts,
}
```

Read a value: `model.byVar['ofJars'].value`
Read a grid cell: `model.sets['pickleBrands'].rows[0].cells['pickleBrands.quantity'].value`

### `LogikClient` — the framework-agnostic core

Use it directly in Node, tests, or a non-React app:

```js
import { LogikClient, normalizeConfig } from './logik';
const client = new LogikClient({
  baseUrl: 'https://<tenant>.test.logik.io/api',
  token: process.env.LOGIK_TOKEN,   // Origin auto-derived from baseUrl
});

const model = normalizeConfig(await client.initConfig({ configuredProductId: 'X' }));
await client.setField(model.uuid, 'ofJars', 5);
await client.resizeSet(model.uuid, 'simpleSet', 3);
const bom = await client.getBom(model.uuid);
```

Covers the config runtime (init/get/update/save/reset/validate/bom/sets/options)
and the Transaction Manager runtime (init/patch/runEvent/upsertLines/getLines).

### `FIELD_TYPES` — the render contract

The machine-readable catalog of every Logik display type:

```js
import { getFieldType } from './logik';
getFieldType('MultiSelectProductPickerGrid');
// { category:'product', select:'multiple', dataShape:'set',
//   control:'grid', element:'productpicker', images:true, productPicker:true }
```

Use it to decide which control to render. `dataShape: 'set'` types come from a
`set` / `productpicker` **layout element** (rows live in `model.sets`), not a
single field.

## Build a new screen in ~30 lines

```jsx
function Configurator() {
  const { loading, layout, model, setField, setCell } =
    useLogikConfigurator({ baseUrl: '/api', configuredProductId: 'configurableProduct5' });
  if (loading || !model) return null;

  return layout.layout.tiers.flatMap(t => t.columnSets).map(cs =>
    cs.elements.map(el => {
      if (el.type === 'set' || el.type === 'productpicker') {
        return <Grid set={model.sets[el.variableName]} onCell={setCell} />;
      }
      const f = model.byVar[el.variableName];
      if (!f || f.visibilityState === 'hidden') return null;
      return <Field def={layout.fields.find(x => x.variableName === el.variableName)}
                    value={f.value} onChange={v => setField(el.variableName, v)} />;
    })
  );
}
```

(`src/App.js` is the fully-featured version of exactly this.)

## Gotchas the SDK already handles for you

These cost real time to discover — you get them for free:

1. **The API 403s without an `Origin` header.** The proxy/client always sends one.
2. **The token must stay server-side.** It's injected by the proxy, never bundled.
3. **The `/api` prefix matters.** (A proxy mis-config once stripped it and hit a different auth realm.) `baseUrl` handles this.
4. **Sets/grids are flat fields.** Rows share a `variableName` and are told apart only by `uniqueName` = `` `${set}-${instanceId}-${variableName}` ``. Edit a cell by its `uniqueName`. Resize a set by patching `set.<name>.size` with a **number**. `normalizeConfig` untangles all of it.

## Field-type coverage

Implemented in `src/components/FieldRenderer.js` + `ProductPickerGrid.js`, with the
full catalog in `src/logik/fieldTypes.js`. Text/number/boolean/picklist/visual
types and the set-backed product-picker **grids/sets** are verified against a live
tenant. The picklist-extension option attributes (price/description/model on
ExtendedPicklist & grids) are spec-based pending a blueprint that uses them — if
you build against one, check `optionMeta()` in `FieldRenderer.js` matches the real
option field names.

## Where to go next

- Restyle `src/components/*` (or swap MUI for your design system) — the SDK is UI-agnostic.
- New product? Use the **Product** switcher in the top bar (or a `?product=` URL),
  or set `REACT_APP_LOGIK_PRODUCT` in `.env`. Layout + fields come back automatically.
- Need an admin/authoring endpoint (blueprints, rules, managed tables)? The
  `LogikClient` covers runtime today; the full 309-op gateway surface can be
  generated from the OpenAPI spec when needed.
