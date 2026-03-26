# CitadelTwin

A full-stack digital twin platform for Architecture, Engineering & Construction (AEC). Upload 2D blueprints, convert them to interactive 3D models, run compliance checks, manage GIS data, collaborate in real-time, and generate documents — all in one web app.

**Stack:** React 18 + TypeScript + Vite + Supabase + Three.js + Tailwind CSS + shadcn/ui

---

## Getting Started (Local Development)

### Prerequisites

- Node.js >= 18 ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm (comes with Node.js)

### Steps

```sh
# 1. Clone the repository
git clone <YOUR_GIT_URL>

# 2. Navigate into the project
cd citadeltwin

# 3. Install dependencies
npm install --legacy-peer-deps

# 4. Start the dev server
npm run dev
```

The app runs at **http://localhost:8080** (or the port Vite assigns).

> **Why `--legacy-peer-deps`?**
> This project uses `web-ifc-viewer` and `web-ifc-three` for IFC/BIM model viewing.
> These packages declare a peer dependency on `three@^0.149.0`, but the rest of the app
> requires `three@^0.160.x` (needed by `@react-three/fiber` and `@react-three/drei`).
> The `--legacy-peer-deps` flag tells npm to skip the peer conflict check and install anyway.
> The IFC viewer uses dynamic imports so this version gap does not cause runtime errors
> during normal app usage. **Do not use `npm install` without this flag — it will error.**

---

## Available Scripts

```sh
npm run dev          # Start development server (hot reload)
npm run build        # Production build
npm run build:dev    # Development-mode build
npm run preview      # Preview the production build locally
npm run lint         # Run ESLint
```

---

## Environment Variables

A `.env` file is required at the project root. It is already present in the repo with the Supabase project pre-configured:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

Do not commit changes to `.env`. Additional secrets required for full functionality must be set in the **Supabase dashboard** under Project Settings > Edge Functions > Secrets:

| Secret | Used For | Required |
|--------|----------|----------|
| `GEMINI_API_KEY` | Blueprint → 3D conversion, AI assistant | Yes |
| `GOOGLE_MAPS_API_KEY` | GIS / Maps page | Yes |
| `PYTHON_BACKEND_URL` | Optional YOLOv8 blueprint pipeline | No |

---

## Project Structure

```
citadeltwin/
├── src/
│   ├── App.tsx                  # Root app — routing + providers
│   ├── pages/                   # One file per route
│   ├── components/              # Feature-grouped UI components
│   │   ├── 3d/                  # Three.js viewers
│   │   ├── ai/                  # AI assistant & design optimizer
│   │   ├── bim/                 # BIM element management
│   │   ├── blueprint3d/         # Upload + 3D processing UI
│   │   ├── cad/                 # CAD drawing canvas (Fabric.js)
│   │   ├── compliance/          # Building code compliance
│   │   ├── collaboration/       # Live cursors, collaborative editor
│   │   ├── cost-estimation/     # Cost breakdowns, quantity takeoff
│   │   ├── documents/           # Document templates & generator
│   │   ├── gis/                 # GIS / Google Maps components
│   │   ├── ifc/                 # IFC model viewer (web-ifc-viewer)
│   │   ├── layout/              # Sidebar, header, responsive layout
│   │   ├── security/            # Security dashboard
│   │   └── ui/                  # shadcn/ui component library
│   ├── hooks/                   # Custom React hooks (feature-grouped)
│   ├── providers/
│   │   └── AuthProvider.tsx     # Supabase auth context
│   └── integrations/
│       └── supabase/
│           ├── client.ts        # Supabase client instance
│           └── types.ts         # Auto-generated DB types
├── supabase/
│   ├── config.toml              # Supabase project config
│   ├── functions/               # Deno Edge Functions
│   └── migrations/              # SQL migration history
├── design-system/
│   └── citadeltwin/MASTER.md    # Design language spec (skeuomorphic)
├── BLUEPRINT_3D_SETUP.md        # Guide to set up the Python 3D pipeline
├── SECURITY_AUDIT.md            # Security audit report and fixes applied
└── .env                         # Environment variables (do not commit)
```

---

## App Routes

| Path | Page |
|------|------|
| `/dashboard` | Main dashboard (BIM, 3D, upload) |
| `/blueprints/upload` | Upload 2D blueprints |
| `/blueprints/view` | View all uploaded blueprints |
| `/blueprint-3d` | Convert 2D blueprint → 3D model (Gemini AI) |
| `/compliance` | Building code compliance checker |
| `/gis` | GIS analysis with Google Maps |
| `/client-portal` | Client sharing and project portal |
| `/documents` | Document templates and generation |
| `/security` | Security monitoring dashboard |
| `/workflow-automation` | Workflow automation tools |
| `/settings` | User settings |
| `/users` | User management |
| `/auth/login` | Login / Signup / Password reset |

---

## Common Issues

### `npm install` fails with ERESOLVE peer dependency error

**Error:**
```
npm error Could not resolve dependency:
npm error peer three@"^0.149.0" from web-ifc-three@0.0.126
```

**Fix:**
```sh
npm install --legacy-peer-deps
```

**Why:** `web-ifc-three` requires `three@^0.149.0` but this project uses `three@0.160.x`.
The flag bypasses the conflict. See the note in the Getting Started section above.

---

### `npm audit` reports vulnerabilities after install

Run the safe auto-fix:
```sh
npm audit fix
```

Do **not** run `npm audit fix --force` — it applies breaking major version changes that can break Three.js, React, or Supabase integrations.

The remaining high/critical vulnerabilities after `npm audit fix` are typically inside `web-ifc-viewer` and `web-ifc-three`. These are AEC ecosystem packages that are slow to patch upstream dependencies. They do not affect the app in normal usage as the vulnerable code paths are never called from the frontend.

---

### `vite` is not recognized / `npm run dev` fails immediately

This means `node_modules` was never installed. Run install first:
```sh
npm install --legacy-peer-deps
npm run dev
```

---

## Deployment

The project was scaffolded via [Lovable](https://lovable.dev/projects/326b4322-869b-449c-9b93-f32547e7186c). You can deploy directly from there (Share > Publish) or build and host anywhere that serves static files (Vercel, Netlify, etc.).

```sh
npm run build
# Output is in /dist
```

Supabase Edge Functions are deployed separately via the Supabase CLI:
```sh
supabase functions deploy
```
