# Christopher James — portfolio frontend

React + TypeScript + Vite. Talks to a separate FastAPI backend over `/api/v1`.

## Environments

|             | Frontend                        | Backend                                    |
|-------------|----------------------------------|---------------------------------------------|
| Production  | `https://chrisjames.vercel.app`  | `https://chrisjames-backend.vercel.app`     |
| Local dev   | `http://localhost:5173`          | `http://localhost:8000`                     |

These are two separate deployments on two separate domains — there is no
server-side rewrite tying them together in production, so the frontend needs
to know the backend's absolute URL. That's the one thing that has to be
configured per environment; everything else is the same code.

## Local development

```bash
npm install
npm run dev
```

`.env.development` ships with `VITE_API_URL` empty on purpose: requests stay
relative (`/api/v1/...`), and Vite's dev-server proxy (`vite.config.ts`)
forwards `/api` and `/media` to `http://localhost:8000`. Run the backend
locally on port 8000 and this works with zero configuration.

If your backend runs on a different port or host, override it in a
`.env.development.local` file (already git-ignored):

```
VITE_API_URL=http://localhost:8001
```

## Production (Vercel)

`.env.production` sets:

```
VITE_API_URL=https://chrisjames-backend.vercel.app
```

`vite build` picks this up automatically (Vite loads `.env.production` in
production mode), so the deployed bundle talks to the real backend directly
— no proxy involved. If the backend's URL ever changes, this is the one line
to update.

**The backend must allow this frontend's origin in CORS** (`https://chrisjames.vercel.app`)
or every request will fail in the browser with a CORS error despite looking
fine in a REST client. See the backend's own README/`.env.example`.

```bash
npm run build     # outputs to dist/, using .env.production
npm run preview   # serve the production build locally to sanity-check it
```

## Environment variables

See `.env.example` for the full list with comments. Currently just one:

- `VITE_API_URL` — the backend's origin. Empty in dev (uses the proxy), the
  deployed backend's URL in production. Only variables prefixed `VITE_` are
  exposed to the browser bundle — anything without that prefix silently
  won't be available in the code.

## Scripts

- `npm run dev` — local dev server (port 5173)
- `npm run build` — type-check (`tsc -b`) then production build
- `npm run preview` — serve the built `dist/` locally
- `npm run typecheck` — type-check only, no build
